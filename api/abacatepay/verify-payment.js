/** @format */

/**
 * Fusion ERP — AbacatePay Verify Payment API (v2)
 *
 * GET /api/abacatepay/verify-payment?id=<externalId>&apiKey=<optional>
 *
 * Verifica o status de uma cobrança PIX. Primeiro consulta a tabela
 * local `pix_charges` no Supabase. Se o status for definitivo (PAID,
 * FAILED, EXPIRED), retorna imediatamente. Caso contrário, consulta
 * a AbacatePay via abacatepay_id para obter o status mais recente
 * e atualiza o banco.
 *
 * Se a cobrança não for encontrada no banco local, tenta consultar
 * a AbacatePay diretamente (fallback para cobranças antigas).
 *
 * Query params:
 *   id        - externalId (nosso UUID) da cobrança
 *   apiKey    - opcional: override da chave configurada via UI
 *
 * Retorna:
 *   {
 *     success: true,
 *     data: {
 *       id: string | null,          // UUID do pix_charge no sistema
 *       abacatepayId: string | null, // ID na AbacatePay
 *       externalId: string,
 *       status: string,              // 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | etc
 *       paidAt: string | null,
 *       brCode: string | null
 *     }
 *   }
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v2';

const FINAL_STATUSES = ['PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED'];

function supabaseHeaders() {
  return {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  };
}

async function findChargeByExternalId(externalId) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pix_charges?external_id=eq.${encodeURIComponent(externalId)}&limit=1`,
      { headers: supabaseHeaders() }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch {
    return null;
  }
}

async function updateChargeStatus(externalId, updates) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/pix_charges?external_id=eq.${encodeURIComponent(externalId)}`,
      {
        method: 'PATCH',
        headers: { ...supabaseHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      }
    );
  } catch {
    // Silencia
  }
}

/** Consulta gateway AbacatePay pelo abacatepay_id */
async function queryGateway(abacatepayId, apiKey) {
  const res = await fetch(`${ABACATEPAY_API_URL}/transparents/${abacatepayId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return null;
  const result = await res.json();
  return result.success ? result.data : null;
}

/** Mapeia status do gateway para nosso enum */
function mapStatus(gwStatus) {
  const map = {
    'PENDING': 'PENDING',
    'PAID': 'PAID',
    'COMPLETED': 'PAID',
    'FAILED': 'FAILED',
    'EXPIRED': 'EXPIRED',
    'CANCELLED': 'CANCELLED',
    'CANCELED': 'CANCELLED',
    'REFUNDED': 'REFUNDED',
    'DISPUTED': 'DISPUTED',
  };
  return map[(gwStatus || '').toUpperCase()] || 'PENDING';
}

/** Formata resposta padrão */
function formatResponse(charge, gatewayData) {
  return {
    id: charge?.id || null,
    abacatepayId: charge?.abacatepay_id || gatewayData?.id || null,
    externalId: charge?.external_id || null,
    status: charge?.status || mapStatus(gatewayData?.status) || 'PENDING',
    paidAt: charge?.paid_at || gatewayData?.paidAt || gatewayData?.paid_at || null,
    brCode: charge?.br_code || null,
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const apiKey = req.query.apiKey || ABACATEPAY_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Gateway de pagamento não configurado',
        details: 'Configure a chave da AbacatePay em Configurações > Integrações ou via ABACATEPAY_API_KEY no Vercel.',
      });
    }

    if (!id) {
      return res.status(400).json({ error: 'ID (externalId) da cobrança é obrigatório' });
    }

    // ─── 1. Consulta banco local ─────────────────────────────────
    const localCharge = await findChargeByExternalId(id);

    if (localCharge) {
      // Status definitivo → retorna sem chamar gateway
      if (FINAL_STATUSES.includes(localCharge.status)) {
        return res.status(200).json({ success: true, data: formatResponse(localCharge) });
      }

      // Tem abacatepay_id → consulta gateway para status atualizado
      if (localCharge.abacatepay_id) {
        const gwData = await queryGateway(localCharge.abacatepay_id, apiKey);
        if (gwData) {
          const mappedStatus = mapStatus(gwData.status);
          if (mappedStatus !== localCharge.status) {
            const updates = { status: mappedStatus };
            if (mappedStatus === 'PAID') updates.paid_at = gwData.paidAt || gwData.paid_at || new Date().toISOString();
            if (mappedStatus === 'EXPIRED') updates.expired_at = new Date().toISOString();
            await updateChargeStatus(id, updates);
          }
          return res.status(200).json({
            success: true,
            data: formatResponse({ ...localCharge, status: mappedStatus }, gwData),
          });
        }
      }

      // Sem abacatepay_id ou gateway offline → retorna status local
      return res.status(200).json({ success: true, data: formatResponse(localCharge) });
    }

    // ─── 2. Não encontrado no banco — fallback para gateway ──────
    // Tenta consultar AbacatePay diretamente (cobranças pré-migration)
    const gwFallback = await queryGateway(id, apiKey);
    if (gwFallback) {
      return res.status(200).json({
        success: true,
        data: formatResponse(null, gwFallback),
      });
    }

    // ─── 3. Não encontrado em lugar nenhum ───────────────────────
    return res.status(404).json({
      success: false,
      error: 'Cobrança não encontrada',
      details: `Nenhuma cobrança encontrada com o ID: ${id}`,
    });

  } catch (err) {
    console.error('[AbacatePay] verify-payment error:', err);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: err.message,
    });
  }
}
