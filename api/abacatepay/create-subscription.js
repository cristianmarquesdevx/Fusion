/** @format */

/**
 * Fusion ERP — AbacatePay Create Subscription API
 * Aceita apiKey no body como override (configurada via UI em Configurações > Integrações).
 *
 * POST /api/abacatepay/create-subscription
 * Cria um checkout de assinatura no AbacatePay para cobrança recorrente.
 *
 * Body esperado:
 *   {
 *     productId: string,
 *     customer: { name: string, email?: string, cellphone?: string },
 *     planName: string,
 *     returnUrl?: string,
 *     apiKey?: string       // opcional — override da chave configurada via UI
 *   }
 */

const ABACATEPAY_API_KEY = process.env.ABACATEPAY_API_KEY;
const ABACATEPAY_API_URL = 'https://api.abacatepay.com/v1';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, customer, planName, returnUrl, apiKey } = req.body || {};

    const effectiveApiKey = apiKey || ABACATEPAY_API_KEY;

    if (!effectiveApiKey) {
      return res.status(500).json({
        error: 'Gateway de pagamento não configurado',
        details: 'Configure a chave da AbacatePay em Configurações > Integrações ou via ABACATEPAY_API_KEY no Vercel.',
      });
    }

    if (!productId) {
      return res.status(400).json({ error: 'productId é obrigatório' });
    }
    if (!customer || !customer.name) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }

    const response = await fetch(`${ABACATEPAY_API_URL}/subscriptions/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: productId,
            quantity: 1,
          },
        ],
        returnUrl: returnUrl || 'https://fusion-erp.vercel.app/planos-recorrentes',
        metadata: {
          planName: planName || 'Plano Fusion ERP',
          source: 'fusion-erp-planos',
        },
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[AbacatePay] Erro ao criar assinatura:', result);
      return res.status(response.ok ? 400 : response.status).json({
        error: 'Erro ao criar assinatura no gateway',
        details: result.error || result.message || 'Erro desconhecido',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: result.data?.id,
        url: result.data?.url,
        status: result.data?.status || 'pending',
        productId,
      },
    });

  } catch (err) {
    console.error('[AbacatePay] create-subscription error:', err);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: err.message,
    });
  }
}
