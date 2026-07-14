/** @format */

/**
 * Fusion ERP — Push Send API
 *
 * POST /api/push/send
 * Dispara uma notificação push remota para TODAS as inscrições armazenadas
 * usando o Web Push Protocol (VAPID).
 *
 * Body esperado:
 *   {
 *     title: string,
 *     body: string,
 *     icon?: string,
 *     url?: string,
 *     tag?: string,
 *     data?: object
 *   }
 *
 * Retorna:
 *   { success: true, sent: number, failed: number, errors: [...] }
 */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.VITE_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'admin@fusionerp.com';

// ─── Configura web-push com as chaves VAPID ────────────────────
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(`mailto:${VAPID_EMAIL}`, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

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
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return res.status(500).json({
      error: 'VAPID keys não configuradas',
      details: 'Defina VITE_VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nas env vars',
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: 'Supabase não configurado' });
  }

  try {
    const { title, body, icon, url, tag, data } = req.body || {};

    if (!title || !body) {
      return res.status(400).json({ error: 'title e body são obrigatórios' });
    }

    // ─── Busca todas as subscriptions ativas ──────────────────
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys');

    if (fetchError) {
      console.error('[PushAPI] Erro ao buscar subscriptions:', fetchError);
      return res.status(500).json({ error: 'Erro ao buscar inscrições' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(200).json({ success: true, sent: 0, failed: 0, message: 'Nenhuma inscrição ativa' });
    }

    // ─── Monta o payload da notificação ───────────────────────
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/LOGO.png',
      badge: '/LOGO.png',
      tag: tag || 'fusion-push-' + Date.now(),
      data: data || { url: url || '/' },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
    });

    // ─── Dispara para todas as subscriptions ──────────────────
    const results = await Promise.allSettled(
      subscriptions.map((sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: sub.keys,
        };
        return webpush.sendNotification(pushSub, payload);
      })
    );

    // ─── Remove subscriptions inválidas (expiradas) ───────────
    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = [];

    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'rejected') {
        const sub = subscriptions[i];
        const err = r.reason;

        // Se a subscription expirou (410 Gone) ou não existe mais (404), remove do banco
        if (
          err.statusCode === 410 ||
          err.statusCode === 404 ||
          (err.message && err.message.includes('expired'))
        ) {
          try {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          } catch {
            // Silencia erro na limpeza
          }
          failed.push({ endpoint: sub.endpoint.slice(0, 50) + '…', reason: 'expired', removed: true });
        } else {
          failed.push({ endpoint: sub.endpoint.slice(0, 50) + '…', reason: err.message });
        }
      }
    }

    return res.status(200).json({
      success: true,
      sent,
      failed: failed.length,
      errors: failed.slice(0, 20), // Limita a 20 erros na resposta
    });
  } catch (err) {
    console.error('[PushAPI] send error:', err);
    return res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
  }
}
