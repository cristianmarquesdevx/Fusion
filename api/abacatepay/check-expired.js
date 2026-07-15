/** @format */

/**
 * Fusion ERP — AbacatePay Check Expired Charges
 *
 * GET /api/abacatepay/check-expired?apiKey=<optional>
 *
 * Varre cobranças PIX com status PENDING cujo expires_at já passou
 * e as marca como EXPIRED. Pode ser chamado por um cron job (ex:
 * Vercel Cron Jobs) a cada 5-10 minutos.
 *
 * Uso com Vercel Cron (vercel.json):
 *   {
 *     "crons": [{
 *       "path": "/api/abacatepay/check-expired",
 *       "schedule": "*/10 * * * *"
 *     }]
 *   }
 *
 * Retorna:
 *   {
 *     success: true,
 *     data: {
 *       checked: number,     // total de PENDING verificadas
 *       expired: number      // quantas foram marcadas EXPIRED
 *     }
 *   }
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Segurança: apenas Vercel Cron pode chamar este endpoint
  // ou chamadas com o header x-vercel-cron (adicionado automaticamente)
  const isVercelCron = req.headers['x-vercel-cron'];
  if (!isVercelCron) {
    console.warn('[AbacatePay] check-expired chamado sem header x-vercel-cron');
    return res.status(403).json({ error: 'Acesso restrito a Vercel Cron Jobs' });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({
      error: 'Supabase não configurado',
      details: 'Configure VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    });
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    };

    // Busca todas as cobranças PENDING com expires_at no passado
    const now = new Date().toISOString();
    const queryUrl = `${SUPABASE_URL}/rest/v1/pix_charges?status=eq.PENDING&expires_at=lt.${encodeURIComponent(now)}&select=id,external_id`;

    const findRes = await fetch(queryUrl, { headers });
    if (!findRes.ok) {
      return res.status(500).json({
        error: 'Erro ao buscar cobranças expiradas',
        details: `HTTP ${findRes.status}`,
      });
    }

    const pendingExpired = await findRes.json();

    if (!Array.isArray(pendingExpired) || pendingExpired.length === 0) {
      return res.status(200).json({
        success: true,
        data: { checked: 0, expired: 0 },
      });
    }

    // Marca cada uma como EXPIRED
    let expiredCount = 0;
    for (const charge of pendingExpired) {
      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/pix_charges?id=eq.${charge.id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            status: 'EXPIRED',
            expired_at: now,
          }),
        }
      );

      if (updateRes.ok) {
        expiredCount++;
        console.log(`[AbacatePay] Charge expirada: ${charge.external_id} (${charge.id})`);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        checked: pendingExpired.length,
        expired: expiredCount,
      },
    });

  } catch (err) {
    console.error('[AbacatePay] check-expired error:', err);
    return res.status(500).json({
      error: 'Erro interno',
      details: err.message,
    });
  }
}
