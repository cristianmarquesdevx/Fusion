/**
 * Fusion ERP — Push Notification Service
 *
 * Gerencia notificações push via Service Worker + Web Push API.
 * Fornece métodos para:
 *  - Inscrever/desinscrever o usuário no Push
 *  - Agendar notificações locais (agendamentos, fila de espera)
 *  - Solicitar permissão do usuário
 *  - Sincronizar subscriptions com o backend (API serverless)
 *  - Rastrear estado da subscription
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || null;

/** Base URL da API de push. Em produção aponta para o mesmo domínio. */
export const PUSH_API_BASE = import.meta.env.VITE_PUSH_API_URL || '/api/push';

const STORAGE_KEYS = {
  SUBSCRIPTION: 'fusion_push_subscription',
  PERMISSION: 'fusion_push_permission',
  SCHEDULED: 'fusion_scheduled_notifications',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

function isSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

function getRegistration() {
  return navigator.serviceWorker.ready;
}

// ─── Permissão ──────────────────────────────────────────────────────────────

/**
 * Solicita permissão de notificação ao usuário.
 * @returns {'granted' | 'denied' | 'default'}
 */
export async function requestPermission() {
  if (!('Notification' in window)) return 'denied';

  const result = await Notification.requestPermission();
  localStorage.setItem(STORAGE_KEYS.PERMISSION, result);
  return result;
}

export function getPermission() {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

// ─── Subscription ───────────────────────────────────────────────────────────

/**
 * Inscreve o usuário no Push via Service Worker.
 * @returns {PushSubscription | null}
 */
export async function subscribe() {
  if (!isSupported()) return null;
  if (!VAPID_PUBLIC_KEY) return null;

  try {
    const registration = await getRegistration();
    const existing = await registration.pushManager.getSubscription();
    if (existing) return existing;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(subscription));

    // Envia a subscription para o backend
    sendSubscriptionToBackend(subscription).catch((err) => {
      console.warn('[PushService] Falha ao sincronizar subscription com backend:', err?.message || err);
    });

    return subscription;
  } catch (err) {
    console.warn('[PushService] Erro ao inscrever para push:', err?.message || err);
    return null;
  }
}

/**
 * Remove a inscrição Push do usuário.
 */
export async function unsubscribe() {
  if (!isSupported()) return;

  try {
    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      // Notifica o backend antes de remover localmente
      removeSubscriptionFromBackend(subscription.endpoint).catch(() => {});
      await subscription.unsubscribe();
    }
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION);
  } catch (err) {
    console.warn('[PushService] Erro ao desinscrever push:', err?.message || err);
  }
}

/**
 * Retorna a subscription atual, se existir.
 * @returns {PushSubscription | null}
 */
export async function getSubscription() {
  if (!isSupported()) return null;

  try {
    const registration = await getRegistration();
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.warn('[PushService] Erro ao obter subscription:', err?.message || err);
    return null;
  }
}

// ─── Notificações Locais (Schedule) ─────────────────────────────────────────

/**
 * Dispara uma notificação local imediatamente (sem depender do servidor).
 * Usa a ServiceWorkerRegistration.showNotification().
 *
 * @param {string} title
 * @param {object} options
 * @param {string} [options.body]
 * @param {string} [options.icon]
 * @param {string} [options.tag]  - Agrupa notificações similares
 * @param {object} [options.data] - Dados extras enviados no click
 */
export async function showLocalNotification(title, options = {}) {
  if (!isSupported()) return;
  if (getPermission() !== 'granted') return;

  try {
    const registration = await getRegistration();
    await registration.showNotification(title, {
      icon: options.icon || '/icon-192.png',
      badge: options.badge || '/badge-72.png',
      vibrate: [200, 100, 200],
      ...options,
    });
  } catch (err) {
    console.warn('[PushService] Erro ao exibir notificação local:', err?.message || err);
  }
}

/**
 * Agenda uma notificação local para um horário futuro.
 * Armazena no localStorage e o `Scheduler` (hook) verifica em intervalo.
 *
 * @param {object} notif
 * @param {string} notif.id
 * @param {string} notif.title
 * @param {string} notif.body
 * @param {string|number} notif.scheduledAt - ISO string ou timestamp
 * @param {string} notif.type - 'appointment' | 'waiting_list'
 * @param {object} [notif.data]
 */
export function scheduleLocalNotification(notif) {
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED);
  const list = raw ? JSON.parse(raw) : [];

  // Evita duplicatas pelo id
  if (list.some((n) => n.id === notif.id)) return;

  list.push({
    id: notif.id,
    title: notif.title,
    body: notif.body,
    scheduledAt: notif.scheduledAt,
    type: notif.type || 'generic',
    data: notif.data || {},
    createdAt: Date.now(),
  });

  localStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(list));
}

/**
 * Remove uma notificação agendada pelo id.
 * @param {string} id
 */
export function cancelScheduledNotification(id) {
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED);
  if (!raw) return;

  const list = JSON.parse(raw).filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(list));
}

/**
 * Retorna a lista de notificações agendadas pendentes.
 * @returns {Array}
 */
export function getScheduledNotifications() {
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED);
  return raw ? JSON.parse(raw) : [];
}

/**
 * Remove notificações agendadas que já expiraram (mais de 24h de atraso).
 */
export function cleanExpiredNotifications() {
  const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED);
  if (!raw) return;

  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const list = JSON.parse(raw).filter((n) => {
    const t = new Date(n.scheduledAt).getTime();
    return t > cutoff;
  });

  localStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(list));
}

// ─── Status ─────────────────────────────────────────────────────────────────

/**
 * Retorna um objeto com o estado completo do Push.
 */
export async function getPushStatus() {
  const permission = getPermission();
  let subscribed = false;
  let subscription = null;

  if (isSupported()) {
    try {
      subscription = await getSubscription();
      subscribed = !!subscription;
    } catch (err) {
      console.warn('[PushService] Erro ao verificar status push:', err?.message || err);
    }
  }

  return {
    supported: isSupported(),
    permission,
    subscribed,
    vapidConfigured: !!VAPID_PUBLIC_KEY,
    subscription,
  };
}

// ─── Backend Sync ───────────────────────────────────────────────────────────

/**
 * Obtém o ID do usuário atual da store de autenticação.
 * Faz import dinâmico para evitar dependência circular.
 */
async function getCurrentUserId() {
  try {
    const { useAuthStore } = await import('../store/useAuthStore');
    const user = useAuthStore.getState?.()?.user;
    return user?.id || null;
  } catch (err) {
    console.warn('[PushService] Erro ao obter userId:', err?.message || err);
    return null;
  }
}

/**
 * Envia a PushSubscription para o backend armazenar no Supabase.
 * @param {PushSubscription} subscription
 */
async function sendSubscriptionToBackend(subscription) {
  const userId = await getCurrentUserId();

  const body = {
    subscription: {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
    },
    userId,
  };

  const response = await fetch(`${PUSH_API_BASE}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
}

/**
 * Remove a PushSubscription do backend.
 * @param {string} endpoint - URL única da subscription
 */
async function removeSubscriptionFromBackend(endpoint) {
  const response = await fetch(`${PUSH_API_BASE}/unsubscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }
}

// ─── Inicialização ──────────────────────────────────────────────────────────

/**
 * Inicializa o Push Service. Deve ser chamado após o registro do SW.
 * Tenta restaurar a subscription existente.
 */
export async function initPushService() {
  if (!isSupported()) {
    return;
  }

  // Restaura subscription se já existia
  try {
    const sub = await getSubscription();
    if (sub) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(sub));
    }
  } catch (err) {
    // SW ainda não registrado — tenta de novo depois
    console.warn('[PushService] init: SW não disponível ainda:', err?.message || err);
  }

  // Limpa notificações expiradas
  cleanExpiredNotifications();

}
