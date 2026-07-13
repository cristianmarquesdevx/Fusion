/** @format */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { useTheme } from '../../hooks/useTheme';
import { Helpers } from '../../utils/helpers';

export default function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 px-4 sm:px-8 py-4 border-b border-border dark:border-border-dark bg-bg dark:bg-bg-dark">
      {/* Menu toggle (mobile) */}
      <button
        onClick={toggleSidebar}
        className="md:hidden p-1.5 -ml-1.5"
        aria-label="Abrir menu"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="w-5.5 h-5.5"
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
        <span className="max-lg:hidden">Centro Vitta — Unidade Jardins</span>
      </button>

      <div className="flex-1" />

      {/* DB Status */}
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium bg-surface dark:bg-surface-dark-2 border border-border dark:border-border-dark">
        <span className="w-2 h-2 rounded-full bg-sage dark:bg-sage-dark shadow-[0_0_0_0_rgba(59,184,110,0.5)]" />
        <span className="text-ink-soft dark:text-ink-dark-soft">Banco conectado</span>
      </div>

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

      {/* Notifications */}
      <button className="w-9 h-9 flex items-center justify-center rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark relative">
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
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-rose dark:bg-rose-dark border border-surface dark:border-surface-dark" />
      </button>

      {/* Logout */}
      <button
        onClick={() => logout(navigate)}
        className="hidden sm:flex w-9 h-9 items-center justify-center rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark text-ink-soft dark:text-ink-dark-soft hover:text-rose dark:hover:text-rose-dark transition-colors"
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
  );
}
