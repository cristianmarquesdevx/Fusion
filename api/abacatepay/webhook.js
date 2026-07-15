/** @format */

/**
 * Fusion ERP — AbacatePay Webhook Handler (v2)
 *
 * POST /api/abacatepay/webhook
 *
 * Recebe notificações de eventos da AbacatePay e atualiza o status
 * das cobranças na tabela `pix_charges` do Supabase.
 *
 * Eventos suportados:
 *   - transparent.completed   → PAID
 *   - transparent.failed      → FAILED
 *   - transparent.expired     → EXPIRED
 *   - transparent.refunded    → REFUNDED
 *   - transparent.disputed    → DISPUTED
 *   - subscription.*          → assinaturas (log apenas)
 *
 * O payload é correlacionado via externalId (nosso UUID) enviado
 * no campo `data.externalId` pela AbacatePay.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Headers para chamadas à API REST do Supabase */
function supabaseHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=representation',
  };
}

/**
 * Busca uma cobrança pelo externalId.
 */
async function findCharge(externalId) {
  const url = `${SUPABASE_URL}/rest/v1/pix_charges?external_id=eq.${encodeURIComponent(externalId)}&limit=1`;
  const res = await fetch(url, { headers: supabaseHeaders() });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[AbacatePay Webhook] findCharge HTTP ${res.status} para externalId=${externalId}: ${errBody.slice(0, 500)}`);
    return null;
  }
  const data = await res.json();
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

/**
 * Atualiza o status de uma cobrança.
 */
async function updateCharge(externalId, updates) {
  const url = `${SUPABASE_URL}/rest/v1/pix_charges?external_id=eq.${encodeURIComponent(externalId)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: supabaseHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`[AbacatePay Webhook] updateCharge HTTP ${res.status} para externalId=${externalId}: ${errBody.slice(0, 500)}`);
  }
}

/**
 * Mapeia evento AbacatePay → nosso status.
 */
function eventToStatus(event) {
  const map = {
    'transparent.completed': 'PAID',
    'transparent.failed': 'FAILED',
    'transparent.expired': 'EXPIRED',
    'transparent.refunded': 'REFUNDED',
    'transparent.disputed': 'DISPUTED',
  };
  return map[event] || null;
}

/**
 * Processa evento de transparent checkout.
 */
async function handleTransparentEvent(event, data) {
  const status = eventToStatus(event);
  if (!status) {
    console.log(`[AbacatePay Webhook] Evento transparent não mapeado: ${event}`);
    return;
  }

  // Extrai externalId do payload
  const transparent = data?.transparent || {};
  const externalId = transparent.externalId || data?.externalId;

  if (!externalId) {
    console.warn('[AbacatePay Webhook] Payload sem externalId — não é possível correlacionar');
    return;
  }

  console.log(`[AbacatePay Webhook] Processando ${event} → ${status} para externalId: ${externalId}`);

  // Busca cobrança no banco
  const charge = await findCharge(externalId);

  if (!charge) {
    console.warn(`[AbacatePay Webhook] Cobrança não encontrada para externalId: ${externalId}`);
    return;
  }

  // Prepara atualizações
  const updates = {
    status: status,
    last_webhook_payload: JSON.stringify(data),
    abacatepay_id: transparent.id || charge.abacatepay_id || null,
  };

  if (status === 'PAID') {
    updates.paid_at = data?.paidAt || data?.paid_at || new Date().toISOString();
  }

  if (status === 'EXPIRED') {
    updates.expired_at = new Date().toISOString();
  }

  // Atualiza no banco
  await updateCharge(externalId, updates);
  console.log(`[AbacatePay Webhook] Cobrança ${externalId} atualizada para ${status}`);
}

/**
 * Processa evento de assinatura (log apenas por enquanto).
 */
async function handleSubscriptionEvent(event, data) {
  console.log(`[AbacatePay Webhook] Evento de assinatura: ${event}`, data?.id || 'sem ID');
  // TODO: Integrar com tabela de assinaturas no futuro
}

export default async function handler(req, res) {
  // ─── Validação de ambiente ─────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    const missing = [];
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL / SUPABASE_URL');
    if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    console.error('[AbacatePay Webhook] Erro de configuração:', missing.join(', '));
    return res.status(500).json({ error: 'Servidor mal configurado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { event, data, apiVersion, devMode } = req.body || {};

    if (!event || !data) {
      return res.status(400).json({ error: 'Payload inválido: event e data são obrigatórios' });
    }

    // Log do webhook recebido
    console.log('[AbacatePay Webhook] Evento recebido:', {
      event,
      apiVersion,
      devMode,
      dataId: data?.id || data?.transparent?.id || 'sem ID',
    });

    // ─── Roteamento por tipo de evento ───────────────────────────
    if (event.startsWith('transparent.')) {
      await handleTransparentEvent(event, data);
    } else if (event.startsWith('subscription.')) {
      await handleSubscriptionEvent(event, data);
    } else {
      console.log(`[AbacatePay Webhook] Evento desconhecido: ${event}`);
    }

    // Sempre retorna 200 para confirmar recebimento
    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('[AbacatePay Webhook] Erro:', err);
    // Retorna 200 mesmo em erro para não re-enfileirar
    return res.status(200).json({ received: true, warning: err.message });
  }
}
