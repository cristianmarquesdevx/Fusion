/** @format */

/**
 * Fusion ERP — Push Unsubscribe API
 *
 * POST /api/push/unsubscribe
 * Remove uma PushSubscription do banco de dados pelo endpoint.
 *
 * Body esperado:
 *   {
 *     endpoint: string   // URL única da subscription a remover
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

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Servidor mal configurado' });
  }

  try {
    const { endpoint } = req.body || {};

    if (!endpoint) {
      return res.status(400).json({ error: 'Endpoint da inscrição é obrigatório' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[PushAPI] Erro ao remover subscription:', error);
      return res.status(500).json({ error: 'Erro ao remover inscrição', details: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[PushAPI] unsubscribe error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
  }
}
