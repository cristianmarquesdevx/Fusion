/** @format */

/**
 * Fusion ERP v2 — Hook de Listener de Autenticação
 *
 * Lê do sessionStorage mensagens de toast de autenticação que foram salvas
 * pelo useAuthStore antes de redirecionar para /login (ex: sessão encerrada
 * remotamente, sessão expirada).
 *
 * O sessionStorage é usado porque sobrevive à navegação via window.location.href,
 * ao contrário de eventos customizados do window que morrem com o unload da página.
 *
 * Uso: Importar em App.jsx ou Topbar.jsx para exibir toasts globais de auth.
 *
 * Exemplo:
 *   const { authToast, dismissAuthToast } = useAuthListener();
 *   {authToast && <ToastComponent ... />}
 */

import { useState, useEffect, useCallback } from 'react';

const AUTH_TOAST_KEY = 'fusion_auth_toast';
const DEFAULT_DURATION = 6000;

export function useAuthListener() {
  const [authToast, setAuthToast] = useState(null);

  const dismissAuthToast = useCallback(() => {
    setAuthToast(null);
  }, []);

  useEffect(() => {
    // Ao montar (em qualquer página protegida), verifica se há toast pendente
    // salvo pelo store antes de redirecionar para /login
    try {
      const stored = sessionStorage.getItem(AUTH_TOAST_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const toast = {
          id: `auth-${Date.now()}`,
          type: parsed.type || 'warning',
          title: parsed.title || '',
          message: parsed.message || '',
          duration: parsed.duration || DEFAULT_DURATION,
        };

        setAuthToast(toast);

        // Auto-dismiss
        if (toast.duration > 0) {
          setTimeout(() => {
            setAuthToast((current) =>
              current?.id === toast.id ? null : current
            );
          }, toast.duration);
        }

        // Limpa o storage para não mostrar o mesmo toast duas vezes
        sessionStorage.removeItem(AUTH_TOAST_KEY);
      }
    } catch {
      // Ignora erro de parsing
      sessionStorage.removeItem(AUTH_TOAST_KEY);
    }
  }, []);

  return {
    authToast,
    dismissAuthToast,
  };
}
