/** @format */

import React, { useState } from 'react';
import { useUIStore } from '../../store/useUIStore';
import { PUSH_API_BASE } from '../../services/push-notifications';

export default function SendTestPushButton() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const addNotification = useUIStore((s) => s.addNotification);

  const handleSendTest = async () => {
    setSending(true);
    setSent(false);

    try {
      const response = await fetch(`${PUSH_API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔔 Teste — Fusion ERP',
          body: 'Esta é uma notificação push de teste. Se você está vendo isso, o sistema está funcionando!',
          url: '/dashboard',
          tag: 'fusion-push-test',
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setSent(true);
        addNotification({
          type: 'success',
          title: 'Notificação de teste enviada!',
          message: data.sent > 0
            ? `Enviada com sucesso para ${data.sent} dispositivo(s).`
            : 'Nenhum dispositivo inscrito no momento.',
        });
      } else {
        const errorMsg = data?.error || data?.details || `HTTP ${response.status}`;
        addNotification({
          type: 'error',
          title: 'Falha ao enviar teste',
          message: errorMsg,
        });
      }
    } catch (err) {
      addNotification({
        type: 'error',
        title: 'Falha ao enviar teste',
        message: `Erro de conexão: ${err.message}`,
      });
    } finally {
      setSending(false);
      // Volta ao estado normal após 4s
      setTimeout(() => setSent(false), 4000);
    }
  };

  return (
    <div className="mx-4 mt-2 mb-1">
      <button
        onClick={handleSendTest}
        disabled={sending}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-[11px] font-semibold transition-all duration-150 ${
          sent
            ? 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark border border-sage/30 dark:border-sage-dark/30'
            : 'bg-brand-soft/20 dark:bg-brand-dark-soft/10 text-brand dark:text-brand-dark border border-brand/20 dark:border-brand-dark/20 hover:bg-brand-soft/40 dark:hover:bg-brand-dark-soft/20'
        }`}
        aria-label={sending ? 'Enviando notificação de teste' : sent ? 'Notificação de teste enviada' : 'Enviar notificação de teste'}
      >
        {sending ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Enviando…
          </>
        ) : sent ? (
          <span className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            Notificação de teste enviada!
          </span>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
            Enviar notificação de teste
          </>
        )}
      </button>
    </div>
  );
}
