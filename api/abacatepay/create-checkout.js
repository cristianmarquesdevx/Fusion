/** @format */

/**
 * Fusion ERP — AbacatePay Create Checkout API (v2)
 *
 * POST /api/abacatepay/create-checkout
 *
 * Cria uma cobrança PIX no AbacatePay (v2 transparents API), salva os
 * detalhes na tabela `pix_charges` do Supabase e retorna o QR Code.
 *
 * Body esperado:
 *   {
 *     customer: { name: string, email?: string, cellphone?: string },
 *     value: number,              // valor em reais (ex: 180.00)
 *     description: string,
 *     source: string,             // opcional: 'public_booking' | 'pdv' | 'planos'
 *     externalId?: string,        // opcional: UUID do sistema (gerado auto se omitido)
 *     agendamentoId?: string,     // opcional: UUID do agendamento
 *     vendaId?: string,           // opcional: UUID da venda PDV
 *     assinaturaId?: string,      // opcional: UUID da assinatura
 *     expiresInMinutes?: number,  // opcional: tempo expiração (default 60)
 *     apiKey?: string             // opcional: override da chave configurada via UI
 *   }
 *
 * Retorna:
 *   {
 *     success: true,
 *     data: {
 *       id: string,               // UUID do pix_charge no sistema
 *       abacatepayId: string,     // ID da cobrança na AbacatePay
 *       externalId: string,       // externalId usado na criação
 *       brCode: string,           // Código PIX copia-e-cola
 *       brCodeBase64: string,     // QR Code em base64
 *       status: string,           // 'PENDING' | 'PAID' | etc
 *       expiresAt: string         // ISO 8601 expiration
 *     }
 *   }
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v2';

/** Gera um externalId único para correlacionar com a AbacatePay */
function generateExternalId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `fusion_${timestamp}_${random}`;
}

/**
 * Persiste ou atualiza uma cobrança no Supabase via service_role.
 */
async function savePixCharge(chargeData) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn('[AbacatePay] Supabase não configurado — charge não será persistida');
    return null;
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=representation',
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/pix_charges`, {
      method: 'POST',
      headers,
      body: JSON.stringify(chargeData),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[AbacatePay] Erro ao salvar pix_charge:', res.status, errBody);
      return null;
    }

    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (err) {
    console.error('[AbacatePay] Erro de rede ao salvar pix_charge:', err.message);
    return null;
  }
}

/**
 * Atualiza uma cobrança existente no Supabase com o abacatepay_id e brCode.
 */
async function updatePixChargeWithGatewayData(externalId, gatewayData) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Prefer': 'return=representation',
  };

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/pix_charges?external_id=eq.${encodeURIComponent(externalId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(gatewayData),
      }
    );

    if (!res.ok) {
      console.error('[AbacatePay] Erro ao atualizar pix_charge:', res.status);
      return null;
    }

    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch (err) {
    console.error('[AbacatePay] Erro de rede ao atualizar pix_charge:', err.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customer,
      value,
      description,
      source,
      externalId: providedExternalId,
      agendamentoId,
      vendaId,
      assinaturaId,
      expiresInMinutes,
      apiKey,
    } = req.body || {};

    const effectiveApiKey = apiKey || ABACATEPAY_API_KEY;

    if (!effectiveApiKey) {
      console.error('[AbacatePay] Nenhuma chave de API disponível');
      return res.status(500).json({
        error: 'Gateway de pagamento não configurado',
        details: 'Configure a chave da AbacatePay em Configurações > Integrações ou via ABACATEPAY_API_KEY no Vercel.',
      });
    }

    if (!customer || !customer.name) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }
    if (!value || value <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
    if (!description) {
      return res.status(400).json({ error: 'Descrição é obrigatória' });
    }

    // ─── 1. Gera externalId e persiste charge com status PENDING ──
    const externalId = providedExternalId || generateExternalId();
    const amountCents = Math.round(value * 100);
    const expiresAt = new Date(
      Date.now() + (expiresInMinutes || 60) * 60 * 1000
    ).toISOString();

    // Salva primeiro no banco (antes de chamar gateway) para ter o registro
    const chargeRecord = await savePixCharge({
      external_id: externalId,
      customer_name: customer.name,
      customer_email: customer.email || null,
      customer_cellphone: customer.cellphone || null,
      amount_cents: amountCents,
      amount: value,
      description: description,
      source: source || 'manual',
      status: 'PENDING',
      agendamento_id: agendamentoId || null,
      venda_id: vendaId || null,
      assinatura_id: assinaturaId || null,
      expires_at: expiresAt,
      metadata: { origin: req.headers['user-agent'] || 'unknown' },
    });

    if (!chargeRecord) {
      console.warn('[AbacatePay] Charge salva sem persistência em banco — fluxo continua');
    }

    // ─── 2. Chama AbacatePay v2 API ──────────────────────────────
    const response = await fetch(`${ABACATEPAY_API_URL}/transparents/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        method: 'PIX',
        data: {
          externalId,
          amount: amountCents,
          description: description,
          customer: {
            name: customer.name,
            email: customer.email || null,
            cellphone: customer.cellphone || null,
          },
          expiresAt: expiresAt,
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[AbacatePay] Erro na API v2:', response.status, JSON.stringify(result));

      // Atualiza charge no banco como FAILED se já tínhamos criado
      if (chargeRecord?.id) {
        await updatePixChargeWithGatewayData(externalId, {
          status: 'FAILED',
          last_webhook_payload: JSON.stringify(result),
        });
      }

      return res.status(response.ok ? 400 : response.status).json({
        error: 'Erro ao criar cobrança PIX',
        details: result.error || result.message || 'Erro desconhecido',
      });
    }

    // ─── 3. Extrai dados do gateway ───────────────────────────────
    const gatewayData = result.data || {};
    const abacatepayId = gatewayData.id;
    const brCode = gatewayData.brCode;
    const brCodeBase64 = gatewayData.brCodeBase64;
    const gatewayExpiresAt = gatewayData.expiresAt || expiresAt;

    // ─── 4. Atualiza charge no banco com dados do gateway ────
    if (chargeRecord?.id) {
      await updatePixChargeWithGatewayData(externalId, {
        abacatepay_id: abacatepayId,
        br_code: brCode,
        br_code_base64: brCodeBase64,
        expires_at: gatewayExpiresAt,
        status: 'PENDING',
      });
    }

    // ─── 5. Retorna ao frontend ───────────────────────────────────
    return res.status(200).json({
      success: true,
      data: {
        id: chargeRecord?.id || null,
        abacatepayId: abacatepayId,
        externalId: externalId,
        brCode: brCode,
        brCodeBase64: brCodeBase64,
        status: 'PENDING',
        expiresAt: gatewayExpiresAt,
      },
    });

  } catch (err) {
    console.error('[AbacatePay] create-checkout error:', err);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: err.message,
    });
  }
}
