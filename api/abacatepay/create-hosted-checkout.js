/** @format */

/**
 * Fusion ERP — AbacatePay Create Hosted Checkout API
 * Aceita apiKey no body como override (configurada via UI em Configurações > Integrações).
 *
 * POST /api/abacatepay/create-hosted-checkout
 * Cria um checkout hospedado no AbacatePay suportando PIX + Cartão de Crédito/Débito.
 *
 * Body esperado:
 *   {
 *     value: number,
 *     description: string,
 *     customer: { name: string, email?: string, cellphone?: string },
 *     returnUrl?: string,
 *     items?: Array<{name: string, quantity: number, value: number}>,
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
    const { value, description, customer, returnUrl, items, apiKey } = req.body || {};

    const effectiveApiKey = apiKey || ABACATEPAY_API_KEY;

    if (!effectiveApiKey) {
      return res.status(500).json({
        error: 'Gateway de pagamento não configurado',
        details: 'Configure a chave da AbacatePay em Configurações > Integrações ou via ABACATEPAY_API_KEY no Vercel.',
      });
    }

    if (!value || value <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }
    if (!customer?.name) {
      return res.status(400).json({ error: 'Nome do cliente é obrigatório' });
    }

    const valueInCents = Math.round(value * 100);

    const payload = {
      value: valueInCents,
      description: description || 'Venda PDV Fusion ERP',
      customer: {
        name: customer.name,
        email: customer.email || null,
        cellphone: customer.cellphone || null,
      },
      returnUrl: returnUrl || 'https://fusion-erp.vercel.app/pdv',
      metadata: {
        source: 'fusion-erp-pdv',
        clientName: customer.name,
      },
    };

    if (items && Array.isArray(items) && items.length > 0) {
      payload.items = items.map(item => ({
        name: item.name,
        quantity: item.quantity || 1,
        value: Math.round((item.value || 0) * 100),
      }));
    }

    const response = await fetch(`${ABACATEPAY_API_URL}/checkouts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[AbacatePay] Erro ao criar checkout:', result);
      return res.status(response.ok ? 400 : response.status).json({
        error: 'Erro ao criar checkout no gateway',
        details: result.error || result.message || 'Erro desconhecido',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: result.data?.id,
        url: result.data?.url,
        status: result.data?.status || 'pending',
      },
    });

  } catch (err) {
    console.error('[AbacatePay] create-hosted-checkout error:', err);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: err.message,
    });
  }
}
