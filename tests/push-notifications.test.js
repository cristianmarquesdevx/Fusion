/** @format */

/**
 * Fusion ERP — Testes do Push Notification Service
 *
 * Cobre:
 *  - src/services/push-notifications.js (todas as funções exportadas)
 *  - src/hooks/usePushNotifications.js (React hook)
 *  - src/hooks/useLocalNotifications.js (React hook com polling)
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import React from 'react';

// ═══════════════════════════════════════════════════════════════════
// MOCKS GLOBAIS — APIs do navegador não disponíveis em happy-dom
// ═══════════════════════════════════════════════════════════════════

// Mock Notification API
const mockNotificationPermission = vi.fn(() => 'default');
let notificationPermissionValue = 'default';

beforeAll(() => {
  globalThis.Notification = {
    permission: notificationPermissionValue,
    requestPermission: vi.fn().mockResolvedValue('granted'),
  };
});

beforeEach(() => {
  // Reset localStorage entre testes
  localStorage.clear();

  // Reset Notification permission
  notificationPermissionValue = 'default';
  globalThis.Notification.permission = notificationPermissionValue;
  globalThis.Notification.requestPermission.mockResolvedValue('granted');

  // Mock navigator.serviceWorker
  const mockPushManager = {
    getSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockResolvedValue({
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
      options: { userVisibleOnly: true },
      toJSON: () => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
        keys: {
          p256dh: 'BOrS2Jx8_XKjRQBd4kL6Qz7y9kFhGfHjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqrstuvwxyzABCDEF=',
          auth: 'test-auth-key-12345',
        },
      }),
      unsubscribe: vi.fn().mockResolvedValue(true),
    }),
  };

  const mockRegistration = {
    pushManager: mockPushManager,
    showNotification: vi.fn().mockResolvedValue(undefined),
  };

  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      ready: Promise.resolve(mockRegistration),
      register: vi.fn().mockResolvedValue({
        installing: null,
        addEventListener: vi.fn(),
      }),
      addEventListener: vi.fn(),
    },
    writable: true,
    configurable: true,
  });

  // Mock fetch para as chamadas de backend
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true }),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ═══════════════════════════════════════════════════════════════════
// PUSH NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════════

describe('Push Notification Service', () => {
  let service;

  beforeEach(async () => {
    // Configura VAPID key para testes de subscribe funcionarem
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', 'BOrS2Jx8_XKjRQBd4kL6Qz7y9kFhGfHjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqrstuvwxyzABCDEF=');
    // Limpa cache do módulo para recarregar com a env var
    vi.resetModules();
    // Import fresh each time to reset module state with env vars
    service = await import('../src/services/push-notifications');
  });

  /* ─── PERMISSÃO ─── */

  describe('requestPermission / getPermission', () => {
    it('getPermission deve retornar default inicialmente', () => {
      expect(service.getPermission()).toBe('default');
    });

    it('getPermission deve refletir permissão atual', () => {
      Notification.permission = 'granted';
      expect(service.getPermission()).toBe('granted');
    });

    it('getPermission deve retornar denied se Notification não existir', () => {
      const orig = globalThis.Notification;
      delete globalThis.Notification;
      expect(service.getPermission()).toBe('denied');
      globalThis.Notification = orig;
    });

    it('requestPermission deve solicitar permissão e retornar granted', async () => {
      const result = await service.requestPermission();
      expect(result).toBe('granted');
      expect(Notification.requestPermission).toHaveBeenCalledTimes(1);
    });

    it('requestPermission deve persistir permissão no localStorage', async () => {
      await service.requestPermission();
      const stored = localStorage.getItem('fusion_push_permission');
      expect(stored).toBe('granted');
    });

    it('requestPermission deve retornar denied se Notification não existir', async () => {
      const orig = globalThis.Notification;
      delete globalThis.Notification;
      const result = await service.requestPermission();
      expect(result).toBe('denied');
      globalThis.Notification = orig;
    });

    it('requestPermission deve armazenar resultado denied no localStorage', async () => {
      Notification.requestPermission.mockResolvedValue('denied');
      const result = await service.requestPermission();
      expect(result).toBe('denied');
      expect(localStorage.getItem('fusion_push_permission')).toBe('denied');
    });
  });

  describe('subscribe', () => {
    it('deve retornar null se PushManager não for suportado', async () => {
      const orig = globalThis.PushManager;
      delete globalThis.PushManager;
      const result = await service.subscribe();
      expect(result).toBeNull();
      globalThis.PushManager = orig;
    });

    it('deve retornar null se serviceWorker não for suportado', async () => {
      const orig = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const result = await service.subscribe();
      expect(result).toBeNull();
      Object.defineProperty(navigator, 'serviceWorker', { value: orig, writable: true, configurable: true });
    });

    it('deve inscrever com userVisibleOnly e applicationServerKey', async () => {
      const registration = await navigator.serviceWorker.ready;
      registration.pushManager.getSubscription.mockResolvedValue(null);

      const result = await service.subscribe();
      expect(result).not.toBeNull();
      expect(result.endpoint).toContain('fcm.googleapis.com');
      expect(registration.pushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      });
    });

    it('deve retornar subscription existente sem criar nova', async () => {
      const existing = {
        endpoint: 'https://existing-endpoint',
        options: { userVisibleOnly: true },
        toJSON: () => ({
          endpoint: 'https://existing-endpoint',
          keys: { p256dh: 'key', auth: 'auth' },
        }),
      };
      const registration = await navigator.serviceWorker.ready;
      registration.pushManager.getSubscription.mockResolvedValue(existing);

      const result = await service.subscribe();
      expect(result).toBe(existing); // mesma referência
      expect(registration.pushManager.subscribe).not.toHaveBeenCalled();
    });

    it('deve armazenar subscription no localStorage', async () => {
      const result = await service.subscribe();
      const stored = localStorage.getItem('fusion_push_subscription');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored);
      expect(parsed.endpoint).toBe(result.endpoint);
    });
  });

  describe('unsubscribe', () => {
    it('deve chamar subscription.unsubscribe e remover do localStorage', async () => {
      // Primeiro inscreve
      await service.subscribe();
      expect(localStorage.getItem('fusion_push_subscription')).not.toBeNull();

      // Depois desinscreve
      await service.unsubscribe();
      expect(localStorage.getItem('fusion_push_subscription')).toBeNull();
    });

    it('não deve lançar erro se não houver subscription', async () => {
      await expect(service.unsubscribe()).resolves.not.toThrow();
    });

    it('deve falhar silenciosamente se service worker não existir', async () => {
      const orig = navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true,
      });
      await expect(service.unsubscribe()).resolves.not.toThrow();
      Object.defineProperty(navigator, 'serviceWorker', { value: orig, writable: true, configurable: true });
    });
  });

  describe('getSubscription', () => {
    it('deve retornar null se não houver subscription ativa', async () => {
      const reg = await navigator.serviceWorker.ready;
      reg.pushManager.getSubscription.mockResolvedValue(null);
      const result = await service.getSubscription();
      expect(result).toBeNull();
    });

    it('deve retornar subscription ativa se existir', async () => {
      const existing = { endpoint: 'https://test', toJSON: () => ({ endpoint: 'https://test', keys: {} }) };
      const reg = await navigator.serviceWorker.ready;
      reg.pushManager.getSubscription.mockResolvedValue(existing);
      const result = await service.getSubscription();
      expect(result).toBe(existing);
    });

    it('deve retornar null se PushManager não for suportado', async () => {
      const orig = globalThis.PushManager;
      delete globalThis.PushManager;
      const result = await service.getSubscription();
      expect(result).toBeNull();
      globalThis.PushManager = orig;
    });
  });

  /* ─── NOTIFICAÇÕES LOCAIS ─── */

  describe('showLocalNotification', () => {
    it('não deve fazer nada se permissão não for granted', async () => {
      Notification.permission = 'denied';
      await service.showLocalNotification('Test', { body: 'Body' });
      const reg = await navigator.serviceWorker.ready;
      expect(reg.showNotification).not.toHaveBeenCalled();
    });

    it('deve chamar showNotification no service worker', async () => {
      Notification.permission = 'granted';
      await service.showLocalNotification('Título Teste', { body: 'Corpo da notificação' });
      const reg = await navigator.serviceWorker.ready;
      expect(reg.showNotification).toHaveBeenCalledWith('Título Teste', expect.objectContaining({
        body: 'Corpo da notificação',
        icon: '/icon-192.png',
        vibrate: [200, 100, 200],
      }));
    });
  });

  describe('scheduleLocalNotification', () => {
    it('deve adicionar notificação agendada ao localStorage', () => {
      const notif = {
        id: 'test-1',
        title: 'Lembrete',
        body: 'Teste',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        type: 'appointment',
        data: { url: '/agenda' },
      };

      service.scheduleLocalNotification(notif);
      const list = service.getScheduledNotifications();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('test-1');
      expect(list[0].title).toBe('Lembrete');
    });

    it('não deve duplicar notificações com o mesmo id', () => {
      const notif = {
        id: 'dup-1', title: 'Test', body: 'Corpo',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      };

      service.scheduleLocalNotification(notif);
      service.scheduleLocalNotification(notif);
      const list = service.getScheduledNotifications();
      expect(list).toHaveLength(1);
    });

    it('deve usar type generic como padrão', () => {
      service.scheduleLocalNotification({
        id: 'g-1', title: 'Gen', body: 'Genérica',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      });

      const list = service.getScheduledNotifications();
      expect(list[0].type).toBe('generic');
    });

    it('deve armazenar createdAt', () => {
      const before = Date.now();
      service.scheduleLocalNotification({
        id: 'ts-1', title: 'TS', body: 'Timestamp',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      });

      const list = service.getScheduledNotifications();
      expect(list[0].createdAt).toBeGreaterThanOrEqual(before);
    });

    it('deve aceitar múltiplas notificações com IDs diferentes', () => {
      for (let i = 0; i < 5; i++) {
        service.scheduleLocalNotification({
          id: `multi-${i}`, title: `Notif ${i}`, body: 'Body',
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        });
      }

      expect(service.getScheduledNotifications()).toHaveLength(5);
    });
  });

  describe('cancelScheduledNotification', () => {
    it('deve remover notificação pelo id', () => {
      service.scheduleLocalNotification({
        id: 'cancel-1', title: 'Cancelar', body: 'Body',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      });
      service.scheduleLocalNotification({
        id: 'cancel-2', title: 'Manter', body: 'Body',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      });
      expect(service.getScheduledNotifications()).toHaveLength(2);

      service.cancelScheduledNotification('cancel-1');
      const list = service.getScheduledNotifications();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('cancel-2');
    });

    it('não deve quebrar se id não existir', () => {
      expect(() => service.cancelScheduledNotification('nao-existe')).not.toThrow();
    });

    it('não deve quebrar se lista estiver vazia', () => {
      localStorage.removeItem('fusion_scheduled_notifications');
      expect(() => service.cancelScheduledNotification('qualquer')).not.toThrow();
    });
  });

  describe('getScheduledNotifications', () => {
    it('deve retornar array vazio se não houver notificações', () => {
      expect(service.getScheduledNotifications()).toEqual([]);
    });

    it('deve retornar notificações salvas', () => {
      service.scheduleLocalNotification({
        id: 'a', title: 'A', body: 'B',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
      });
      service.scheduleLocalNotification({
        id: 'b', title: 'C', body: 'D',
        scheduledAt: new Date(Date.now() + 7200000).toISOString(),
      });

      expect(service.getScheduledNotifications()).toHaveLength(2);
    });
  });

  describe('cleanExpiredNotifications', () => {
    it('deve remover notificações com mais de 24h de atraso', () => {
      const antiga = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(); // 48h atrás
      const recente = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h atrás

      service.scheduleLocalNotification({ id: 'old', title: 'Velha', body: 'V', scheduledAt: antiga });
      service.scheduleLocalNotification({ id: 'new', title: 'Nova', body: 'N', scheduledAt: recente });

      service.cleanExpiredNotifications();
      const list = service.getScheduledNotifications();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe('new');
    });

    it('não deve remover notificações futuras', () => {
      const futuro = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      service.scheduleLocalNotification({ id: 'fut', title: 'Futura', body: 'F', scheduledAt: futuro });

      service.cleanExpiredNotifications();
      expect(service.getScheduledNotifications()).toHaveLength(1);
    });

    it('não deve quebrar se lista estiver vazia', () => {
      expect(() => service.cleanExpiredNotifications()).not.toThrow();
    });
  });

  /* ─── STATUS ─── */

  describe('getPushStatus', () => {
    it('deve retornar suported = true em ambiente mockado', async () => {
      const status = await service.getPushStatus();
      expect(status.supported).toBe(true);
    });

    it('deve retornar permission atual', async () => {
      Notification.permission = 'granted';
      const status = await service.getPushStatus();
      expect(status.permission).toBe('granted');
    });

    it('deve retornar subscribed = false se não houver subscription', async () => {
      const reg = await navigator.serviceWorker.ready;
      reg.pushManager.getSubscription.mockResolvedValue(null);
      const status = await service.getPushStatus();
      expect(status.subscribed).toBe(false);
    });

    it('deve retornar subscribed = true se houver subscription', async () => {
      const reg = await navigator.serviceWorker.ready;
      reg.pushManager.getSubscription.mockResolvedValue({
        endpoint: 'https://test',
        toJSON: () => ({ endpoint: 'https://test', keys: {} }),
      });
      const status = await service.getPushStatus();
      expect(status.subscribed).toBe(true);
    });
  });

  /* ─── INIT ─── */

  describe('initPushService', () => {
    it('não deve lançar erro ao inicializar', async () => {
      await expect(service.initPushService()).resolves.not.toThrow();
    });

    it('deve restaurar subscription existente no localStorage', async () => {
      const subData = { endpoint: 'https://restored', toJSON: () => ({ endpoint: 'https://restored', keys: {} }) };
      const reg = await navigator.serviceWorker.ready;
      reg.pushManager.getSubscription.mockResolvedValue(subData);

      await service.initPushService();
      const stored = localStorage.getItem('fusion_push_subscription');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored);
      expect(parsed.endpoint).toBe('https://restored');
    });

    it('deve limpar notificações expiradas na inicialização', async () => {
      const antiga = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      service.scheduleLocalNotification({ id: 'exp', title: 'Exp', body: 'E', scheduledAt: antiga });

      await service.initPushService();
      expect(service.getScheduledNotifications()).toHaveLength(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// USE PUSH NOTIFICATIONS HOOK
// ═══════════════════════════════════════════════════════════════════

describe('usePushNotifications', () => {
  let hook;
  let pushService;

  beforeEach(async () => {
    // Importa o módulo real do serviço e espiona as funções que o hook usa
    pushService = await import('../src/services/push-notifications');
    vi.spyOn(pushService, 'getPushStatus').mockResolvedValue({
      supported: true,
      permission: 'default',
      subscribed: false,
      vapidConfigured: true,
      subscription: null,
    });
    vi.spyOn(pushService, 'subscribe').mockResolvedValue({
      endpoint: 'https://mock',
      toJSON: () => ({ endpoint: 'https://mock', keys: { p256dh: 'k', auth: 'a' } }),
    });
    vi.spyOn(pushService, 'unsubscribe').mockResolvedValue(undefined);
    vi.spyOn(pushService, 'requestPermission').mockResolvedValue('granted');

    const mod = await import('../src/hooks/usePushNotifications');
    const usePushNotifications = mod.default;

    hook = renderHook(() => usePushNotifications());

    // Flush microtasks (getPushStatus .then callback)
    await act(async () => {
      await Promise.resolve();
    });
  });

  afterEach(() => {
    hook?.unmount();
    vi.restoreAllMocks();
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve retornar status com supported = true', () => {
      expect(hook.result.current.status.supported).toBe(true);
    });

    it('deve retornar permission inicial', () => {
      expect(hook.result.current.status.permission).toBe('default');
    });

    it('deve retornar subscribed = false inicialmente', () => {
      expect(hook.result.current.status.subscribed).toBe(false);
    });

    it('deve retornar loading false após carregar', () => {
      expect(hook.result.current.loading).toBe(false);
    });

    it('deve expor funções subscribe, unsubscribe, requestPermission, refresh', () => {
      expect(typeof hook.result.current.subscribe).toBe('function');
      expect(typeof hook.result.current.unsubscribe).toBe('function');
      expect(typeof hook.result.current.requestPermission).toBe('function');
      expect(typeof hook.result.current.refresh).toBe('function');
    });
  });

  /* ─── SUBSCRIBE ─── */

  describe('subscribe', () => {
    it('deve alterar subscribed para true após subscribe bem-sucedido', async () => {
      // Muda o mock do getPushStatus para simular subscription ativa após subscribe
      pushService.getPushStatus.mockResolvedValue({
        supported: true,
        permission: 'granted',
        subscribed: true,
        vapidConfigured: true,
        subscription: { endpoint: 'https://mock' },
      });

      await act(async () => {
        await hook.result.current.subscribe();
      });

      expect(hook.result.current.status.subscribed).toBe(true);
      expect(pushService.getPushStatus).toHaveBeenCalled();
    });
  });

  /* ─── UNSUBSCRIBE ─── */

  describe('unsubscribe', () => {
    it('não deve lançar erro ao desinscrever sem subscription ativa', async () => {
      await expect(
        act(async () => {
          await hook.result.current.unsubscribe();
        })
      ).resolves.not.toThrow();
    });
  });

  /* ─── REQUEST PERMISSION ─── */

  describe('requestPermission', () => {
    it('deve retornar granted após solicitar permissão', async () => {
      let result;
      await act(async () => {
        result = await hook.result.current.requestPermission();
      });
      expect(result).toBe('granted');
    });
  });

  /* ─── REFRESH ─── */

  describe('refresh', () => {
    it('deve atualizar o status', async () => {
      // Muda o spy do getPushStatus para retornar subscribed = true
      pushService.getPushStatus.mockResolvedValue({
        supported: true,
        permission: 'granted',
        subscribed: true,
        vapidConfigured: true,
        subscription: { endpoint: 'https://manual' },
      });

      await act(async () => {
        await hook.result.current.refresh();
      });
      expect(hook.result.current.status.subscribed).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// USE LOCAL NOTIFICATIONS HOOK
// ═══════════════════════════════════════════════════════════════════

describe('useLocalNotifications', () => {
  let useLocalNotifications;
  let service;

  beforeAll(async () => {
    const mod = await import('../src/hooks/useLocalNotifications');
    useLocalNotifications = mod.default;
  });

  beforeEach(async () => {
    service = await import('../src/services/push-notifications');
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /* ─── ACTIVE = FALSE ─── */

  describe('quando active = false', () => {
    it('não deve verificar notificações', () => {
      const spy = vi.spyOn(service, 'getScheduledNotifications');
      renderHook(() => useLocalNotifications(false));
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  /* ─── ACTIVE = TRUE ─── */

  describe('quando active = true', () => {
    it('deve verificar notificações na montagem', () => {
      const spy = vi.spyOn(service, 'getScheduledNotifications');
      renderHook(() => useLocalNotifications(true));
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });

    it('deve disparar notificação se houver notificação agendada no momento', () => {
      const now = Date.now();
      const showSpy = vi.spyOn(service, 'showLocalNotification').mockResolvedValue(undefined);
      const cancelSpy = vi.spyOn(service, 'cancelScheduledNotification');

      // Agenda notificação para agora
      service.scheduleLocalNotification({
        id: 'now-1',
        title: 'Imediata',
        body: 'Deve disparar agora',
        scheduledAt: new Date(now - 1000).toISOString(), // 1s atrás (dentro da janela de 60s)
        type: 'appointment',
        data: { url: '/agenda' },
      });

      renderHook(() => useLocalNotifications(true));

      expect(showSpy).toHaveBeenCalledWith('Imediata', expect.objectContaining({
        body: 'Deve disparar agora',
        tag: 'appointment',
      }));
      expect(cancelSpy).toHaveBeenCalledWith('now-1');
      showSpy.mockRestore();
      cancelSpy.mockRestore();
    });

    it('não deve disparar notificação ainda não chegou no horário', () => {
      const showSpy = vi.spyOn(service, 'showLocalNotification').mockResolvedValue(undefined);

      service.scheduleLocalNotification({
        id: 'futura',
        title: 'Futura',
        body: 'Ainda não deve disparar',
        scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1h no futuro
      });

      renderHook(() => useLocalNotifications(true));

      expect(showSpy).not.toHaveBeenCalled();
      showSpy.mockRestore();
    });

    it('não deve disparar notificação expirada (> 60s de atraso)', () => {
      const showSpy = vi.spyOn(service, 'showLocalNotification').mockResolvedValue(undefined);

      service.scheduleLocalNotification({
        id: 'velha',
        title: 'Velha',
        body: 'Muito antiga',
        scheduledAt: new Date(Date.now() - 120000).toISOString(), // 2min atrás
      });

      renderHook(() => useLocalNotifications(true));

      expect(showSpy).not.toHaveBeenCalled();
      showSpy.mockRestore();
    });

    it('deve verificar novamente a cada 30s', () => {
      const spy = vi.spyOn(service, 'getScheduledNotifications');
      renderHook(() => useLocalNotifications(true));

      expect(spy).toHaveBeenCalledTimes(1); // chamada na montagem

      vi.advanceTimersByTime(30000);
      expect(spy).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(30000);
      expect(spy).toHaveBeenCalledTimes(3);

      spy.mockRestore();
    });

    it('deve limpar o intervalo ao desmontar', () => {
      const spy = vi.spyOn(service, 'getScheduledNotifications');
      const { unmount } = renderHook(() => useLocalNotifications(true));

      const chamadasMontagem = spy.mock.calls.length;
      unmount();

      // Avança o tempo mas não deve chamar novamente
      vi.advanceTimersByTime(60000);
      expect(spy.mock.calls.length).toBe(chamadasMontagem);

      spy.mockRestore();
    });

    it('deve re-criar intervalo se active mudar de false para true', () => {
      const spy = vi.spyOn(service, 'getScheduledNotifications');
      const { rerender } = renderHook(
        (props) => useLocalNotifications(props.active),
        { initialProps: { active: false } }
      );

      expect(spy).not.toHaveBeenCalled();

      rerender({ active: true });
      expect(spy).toHaveBeenCalledTimes(1);

      spy.mockRestore();
    });
  });
});
