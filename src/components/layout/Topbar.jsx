/** @format */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useTheme } from '../../hooks/useTheme';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAuthListener } from '../../hooks/useAuthListener';
import usePushNotifications from '../../hooks/usePushNotifications';
import useLocalNotifications from '../../hooks/useLocalNotifications';
import { Helpers } from '../../utils/helpers';
import SendTestPushButton from '../ui/SendTestPushButton';

export default function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isDark, toggleTheme } = useTheme();

  const { isOnline, isOffline, queueSize, updateAvailable, checking, dismissUpdate } = useOnlineStatus();
  const { authToast, dismissAuthToast } = useAuthListener();

  // ── Push notifications ────────────────────────────────────────────────────
  const { status, loading: pushLoading, requestPermission, subscribe, unsubscribe } = usePushNotifications();
  useLocalNotifications(true);

  const storeNotifications = useUIStore((s) => s.notifications);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  const totalNotifications = storeNotifications.length;
  const hasUnread = totalNotifications > 0;

  // Fecha o painel ao clicar fora
  useEffect(() => {
    if (!notifPanelOpen) return;
    const handleClickOutside = (e) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        bellRef.current &&
        !bellRef.current.contains(e.target)
      ) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifPanelOpen]);

  // Fecha com Escape
  useEffect(() => {
    if (!notifPanelOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setNotifPanelOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [notifPanelOpen]);

  const removeNotification = useUIStore((s) => s.removeNotification);

  const handleDismissNotif = useCallback((id) => {
    removeNotification(id);
  }, [removeNotification]);

  const handleClearAll = useCallback(() => {
    storeNotifications.forEach((n) => removeNotification(n.id));
  }, [storeNotifications, removeNotification]);

  return (
    <>
    <header className="sticky top-0 z-10 flex items-center gap-4 px-4 sm:px-8 py-4 border-b border-border dark:border-border-dark bg-bg dark:bg-bg-dark">
      {/* Hamburger — mobile (<= 859px, mesmo breakpoint do Sidebar) */}
      <button
        onClick={toggleSidebar}
        className="hidden max-[859px]:flex items-center justify-center w-9 h-9 shrink-0 rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
        aria-label="Abrir menu"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-4 h-4"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Unit switch */}
      <button className="hidden sm:flex items-center gap-2 px-3.5 py-2 border border-border dark:border-border-dark rounded-sm bg-surface dark:bg-surface-dark text-sm font-medium">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-3.5 h-3.5 text-ink-faint dark:text-ink-dark-faint"
        >
          <path d="M12 21s7-6.3 7-11.5A7 7 0 005 9.5C5 14.7 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.3" />
        </svg>
        <span className="max-lg:hidden">{user?.company || 'Centro Vitta — Unidade Jardins'}</span>
      </button>

      <div className="flex-1" />

      {/* Connectivity indicator — só em telas grandes (sidebar fixa) */}
      <div className="max-[859px]:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium bg-surface dark:bg-surface-dark-2 border border-border dark:border-border-dark">
        {isOnline ? (
          <>
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage dark:bg-sage-dark opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sage dark:bg-sage-dark" />
            </span>
            <span className="text-ink-soft dark:text-ink-dark-soft">
              {checking ? 'Sincronizando…' : 'Online'}
              {queueSize > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gold dark:bg-gold-dark text-[10px] font-bold text-white">
                  {queueSize}
                </span>
              )}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-rose dark:bg-rose-dark animate-pulse" />
            <span className="text-rose dark:text-rose-dark">
              Offline{queueSize > 0 ? ` · ${queueSize} pendente(s)` : ''}
            </span>
          </>
        )}
      </div>

      {/* Update available banner — só em telas grandes */}
      {updateAvailable && (
        <div className="max-[859px]:hidden flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium bg-gold-soft dark:bg-gold-dark-soft text-gold dark:text-gold-dark border border-gold/30 dark:border-gold-dark/30 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span>Nova versão disponível</span>
          <button
            onClick={() => { window.location.reload(); dismissUpdate(); }}
            className="ml-1 font-bold underline underline-offset-2 hover:no-underline"
          >
            Atualizar
          </button>
          <button onClick={dismissUpdate} className="p-0.5 hover:bg-gold/10 dark:hover:bg-gold-dark/10 rounded-sm" aria-label="Descartar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="w-9 h-9 flex items-center justify-center rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark"
        aria-label="Alternar tema"
      >
        {isDark ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-4 h-4"
          >
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-4 h-4"
          >
            <path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z" />
          </svg>
        )}
      </button>

      {/* Push subscription toggle */}
      <button
        onClick={async () => {
          if (status.permission === 'granted' && status.subscribed) {
            await unsubscribe();
          } else {
            await requestPermission();
          }
        }}
        disabled={!status.supported || pushLoading}
        className={`w-9 h-9 flex items-center justify-center rounded-sm border ${
          status.subscribed
            ? 'border-sage/50 dark:border-sage-dark/50 bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark'
            : 'border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink-faint dark:text-ink-dark-faint'
        }`}
        aria-label={status.subscribed ? 'Notificações push ativadas' : 'Ativar notificações push'}
        title={status.subscribed ? 'Push ativado' : 'Ativar push'}
      >
        {pushLoading ? (
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
            <path d="M12 2a2 2 0 00-2 2c0 .5.2 1 .5 1.4A7 7 0 005 12v3l-1 1.5v1h16v-1L19 15v-3a7 7 0 00-5.5-6.6c.3-.4.5-.9.5-1.4a2 2 0 00-2-2z" />
            <path d="M10 19a2 2 0 004 0" />
          </svg>
        )}
      </button>

      {/* Notifications bell */}
      <div className="relative">
        <button
          ref={bellRef}
          onClick={() => setNotifPanelOpen((prev) => !prev)}
          className="w-9 h-9 flex items-center justify-center rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark relative"
          aria-label="Notificações"
          aria-expanded={notifPanelOpen}
          aria-haspopup="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="w-4 h-4"
          >
            <path d="M6 8a6 6 0 0112 0c0 3.5 1 5.5 2 7H4c1-1.5 2-3.5 2-7z" />
            <path d="M10 20a2 2 0 004 0" />
          </svg>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-rose dark:bg-rose-dark text-white text-[9px] font-bold leading-none border-2 border-bg dark:border-bg-dark">
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </span>
          )}
        </button>

        {/* Notification dropdown panel */}
        {notifPanelOpen && (
          <div
            ref={panelRef}
            role="menu"
            className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-xl animate-scale-in origin-top-right z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border dark:border-border-dark">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark">
                Notificações
              </h3>
              <div className="flex items-center gap-2">
                {totalNotifications > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-medium text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
                <button
                  onClick={() => setNotifPanelOpen(false)}
                  className="p-1 rounded-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                  aria-label="Fechar"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Push subscription status */}
            {status.supported && status.permission !== 'granted' && (
              <div className="mx-4 mt-3 mb-2 p-3 rounded-lg bg-brand-soft/20 dark:bg-brand-dark-soft/10 border border-brand/20 dark:border-brand-dark/20">
                <div className="flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 mt-0.5 text-brand dark:text-brand-dark shrink-0">
                    <path d="M12 2a2 2 0 00-2 2c0 .5.2 1 .5 1.4A7 7 0 005 12v3l-1 1.5v1h16v-1L19 15v-3a7 7 0 00-5.5-6.6c.3-.4.5-.9.5-1.4a2 2 0 00-2-2z" />
                    <path d="M10 19a2 2 0 004 0" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-ink dark:text-ink-dark">
                      Notificações push
                    </p>
                    <p className="text-[11px] text-ink-faint dark:text-ink-dark-faint mt-0.5">
                      Ative para receber lembretes de agendamentos e alertas em tempo real.
                    </p>
                    <button
                      onClick={async () => {
                        await requestPermission();
                      }}
                      disabled={pushLoading}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-brand dark:bg-brand-dark text-white text-[11px] font-semibold hover:bg-brand-hover dark:hover:bg-brand-dark-hover transition-colors disabled:opacity-60"
                    >
                      {pushLoading ? 'Ativando…' : 'Ativar notificações'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de teste — visível quando inscrito */}
            {status.subscribed && status.permission === 'granted' && (
              <SendTestPushButton />
            )}

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {storeNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-ink-faint dark:text-ink-dark-faint">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-ink-soft dark:text-ink-dark-soft">
                    Nenhuma notificação
                  </p>
                  <p className="text-xs text-ink-faint dark:text-ink-dark-faint mt-1">
                    Você será notificado sobre agendamentos, fila de espera e alertas do sistema.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-border dark:divide-border-dark">
                  {storeNotifications.map((notif) => (
                    <li
                      key={notif.id}
                      className="px-4 py-3 hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon based on type */}
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          notif.type === 'error'
                            ? 'bg-rose/10 dark:bg-rose-dark/10 text-rose dark:text-rose-dark'
                            : notif.type === 'warning'
                            ? 'bg-gold/10 dark:bg-gold-dark/10 text-gold dark:text-gold-dark'
                            : 'bg-brand-soft/30 dark:bg-brand-dark-soft/20 text-brand dark:text-brand-dark'
                        }`}>
                          {notif.type === 'success' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                              <path d="M22 4L12 14.01l-3-3" />
                            </svg>
                          ) : notif.type === 'error' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M15 9l-6 6M9 9l6 6" />
                            </svg>
                          ) : notif.type === 'warning' ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              <path d="M12 9v4M12 17h.01" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4M12 8h.01" />
                            </svg>
                          )}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink dark:text-ink-dark truncate">
                            {notif.title}
                          </p>
                          {notif.message && (
                            <p className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                          )}
                          {notif.timestamp && (
                            <p className="text-[10px] text-ink-faint/60 dark:text-ink-dark-faint/60 mt-1">
                              {Helpers.formatRelativeTime(notif.timestamp)}
                            </p>
                          )}
                        </div>
                        {/* Dismiss */}
                        <button
                          onClick={() => handleDismissNotif(notif.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-all"
                          aria-label="Descartar notificação"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Logout — só em telas grandes */}
      <button
        onClick={() => logout(navigate)}
        className="max-[859px]:hidden flex w-9 h-9 items-center justify-center rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink-soft dark:text-ink-dark-soft hover:text-rose dark:hover:text-rose-dark transition-colors"
        aria-label="Sair"
        title="Sair"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="w-4 h-4"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
        </svg>
      </button>

      {/* User info */}
      <div className="flex items-center gap-2.5 pl-3 ml-1 border-l border-border dark:border-border-dark">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center font-display font-semibold text-xs"
          style={{
            backgroundColor: user?.name ? Helpers.getAvatarColor(user.name) + '20' : undefined,
            color: user?.name ? Helpers.getAvatarColor(user.name) : undefined,
          }}
        >
          {user?.name ? Helpers.getInitials(user.name) : '?'}
        </div>
        <div className="max-sm:hidden">
          <div className="text-sm font-semibold leading-tight">
            {user?.name || 'Usuário'}
          </div>
          <div className="text-[11.5px] text-ink-faint dark:text-ink-dark-faint capitalize">
            {user?.role === 'admin' ? 'Administradora' : 'Recepção'}
          </div>
        </div>
      </div>
    </header>

      {/* Global Auth Toast — sessão encerrada / expirada */}
      {authToast && (
        <div
          className="fixed top-4 right-4 z-[9999] max-w-sm animate-fade-in"
        >
          <div
            className={`rounded-xl px-5 py-4 shadow-xl border ${
              authToast.type === 'warning'
                ? 'bg-gold-soft dark:bg-gold-dark/20 border-gold/30 dark:border-gold-dark/30 text-gold dark:text-gold-dark'
                : authToast.type === 'error'
                ? 'bg-rose/10 dark:bg-rose-dark/10 border-rose/30 dark:border-rose-dark/30 text-rose dark:text-rose-dark'
                : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark text-ink dark:text-ink-dark'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Ícone */}
              <div className="flex-shrink-0 mt-0.5">
                {authToast.type === 'warning' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                )}
                {authToast.type === 'error' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                )}
                {authToast.type === 'info' && (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                )}
              </div>
              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{authToast.title}</p>
                <p className="text-xs mt-0.5 opacity-80">{authToast.message}</p>
              </div>
              {/* Fechar */}
              <button
                onClick={dismissAuthToast}
                className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                aria-label="Fechar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
