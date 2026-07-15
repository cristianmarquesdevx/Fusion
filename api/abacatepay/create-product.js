/** @format */

/**
 * Fusion ERP — AbacatePay Create Product API
 * Aceita apiKey no body como override (configurada via UI em Configurações > Integrações).
 *
 * POST /api/abacatepay/create-product
 * Cria um produto no AbacatePay com ciclo de cobrança (ex: MONTHLY).
 *
 * Body esperado:
 *   {
 *     name: string,
 *     price: number,
 *     externalId: string,
 *     cycle: string,
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
    const { name, price, externalId, cycle, apiKey } = req.body || {};

    const effectiveApiKey = apiKey || ABACATEPAY_API_KEY;

    if (!effectiveApiKey) {
      return res.status(500).json({
        error: 'Gateway de pagamento não configurado',
        details: 'Configure a chave da AbacatePay em Configurações > Integrações ou via ABACATEPAY_API_KEY no Vercel.',
      });
    }

    if (!name || !price || !externalId || !cycle) {
      return res.status(400).json({
        error: 'Campos obrigatórios: name, price, externalId, cycle',
      });
    }

    const validCycles = ['WEEKLY', 'MONTHLY', 'SEMIANNUALLY', 'ANNUALLY'];
    if (!validCycles.includes(cycle)) {
      return res.status(400).json({
        error: `Ciclo inválido. Use: ${validCycles.join(', ')}`,
      });
    }

    const priceInCents = Math.round(price * 100);

    const response = await fetch(`${ABACATEPAY_API_URL}/products/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${effectiveApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalId,
        name,
        price: priceInCents,
        currency: 'BRL',
        cycle,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('[AbacatePay] Erro ao criar produto:', result);
      return res.status(response.ok ? 400 : response.status).json({
        error: 'Erro ao criar produto no gateway',
        details: result.error || result.message || 'Erro desconhecido',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: result.data?.id,
        externalId: result.data?.externalId,
        name: result.data?.name,
        price: result.data?.price,
        cycle: result.data?.cycle,
      },
    });

  } catch (err) {
    console.error('[AbacatePay] create-product error:', err);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: err.message,
    });
  }
}
