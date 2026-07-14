/** @format */

import React from 'react';
import { useUIStore } from '../../store/useUIStore';

export default function NotificationToast() {
  const notifications = useUIStore((s) => s.notifications);
  const removeNotification = useUIStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`pointer-events-auto rounded-xl px-4 py-3.5 shadow-xl border animate-fade-in-up ${
            notif.type === 'success'
              ? 'bg-sage/10 dark:bg-sage-dark/10 border-sage/30 dark:border-sage-dark/30 text-sage dark:text-sage-dark'
              : notif.type === 'error'
              ? 'bg-rose/10 dark:bg-rose-dark/10 border-rose/30 dark:border-rose-dark/30 text-rose dark:text-rose-dark'
              : notif.type === 'warning'
              ? 'bg-gold-soft dark:bg-gold-dark/20 border-gold/30 dark:border-gold-dark/30 text-gold dark:text-gold-dark'
              : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-ink dark:text-ink-dark'
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {notif.type === 'success' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
              {notif.type === 'error' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              )}
              {notif.type === 'warning' && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              )}
              {!notif.type && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {notif.title && (
                <p className="text-sm font-semibold">{notif.title}</p>
              )}
              <p className="text-xs mt-0.5 opacity-80">{notif.message}</p>
            </div>
            <button
              onClick={() => removeNotification(notif.id)}
              className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              aria-label="Fechar notificação"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
