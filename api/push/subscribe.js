/** @format */

/**
 * Fusion ERP — Push Subscribe API
 *
 * POST /api/push/subscribe
 * Recebe uma PushSubscription do frontend e a armazena no Supabase.
 *
 * Body esperado:
 *   {
 *     subscription: { endpoint: string, keys: { p256dh: string, auth: string } },
 *     userId: string | null       // ID do usuário autenticado (opcional)
 *   }
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  // ─── CORS ──────────────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ─── Validação de ambiente ─────────────────────────────────
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    const missing = [];
    if (!SUPABASE_URL) missing.push('VITE_SUPABASE_URL / SUPABASE_URL');
    if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    console.error('[PushAPI] Erro de configuração — variáveis faltando:', missing.join(', '));
    return res.status(500).json({
      error: 'Servidor mal configurado',
      details: `Variáveis obrigatórias: ${missing.join(', ')}. Configure-as no dashboard do Vercel.`,
    });
  }

  try {
    const { subscription, userId } = req.body || {};

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        error: 'Objeto de inscrição inválido',
        details: 'É necessário enviar { subscription: { endpoint, keys } }',
      });
    }

    if (!subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({
        error: 'Chaves da inscrição incompletas',
        details: 'subscription.keys precisa conter p256dh e auth',
      });
    }

    // ─── Conecta ao Supabase com service_role ────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Upsert: atualiza se o endpoint já existir, insere se não
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        user_id: userId || null,
        user_agent: req.headers['user-agent'] || null,
      },
      { onConflict: 'endpoint', ignoreDuplicates: false }
    );

    if (error) {
      console.error('[PushAPI] Erro ao salvar subscription:', error);
      return res.status(500).json({ error: 'Erro ao salvar inscrição', details: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[PushAPI] subscribe error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
  }
}
