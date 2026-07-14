/** @format */

/**
 * Fusion ERP v2 — Auth Callback Page
 *
 * Esta página recebe o redirecionamento após autenticação OAuth (GitHub).
 * Processa a sessão retornada pelo Supabase e redireciona para o dashboard.
 *
 * Rota: /auth/callback
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function AuthCallback() {
  const navigate = useNavigate();
  const handleAuthCallback = useAuthStore((s) => s.handleAuthCallback);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Processando autenticação…');

  // Evita dupla execução em React StrictMode (desenvolvimento)
  const processed = useRef(false);

  useEffect(() => {
    // Se já autenticado (ex: sessão restaurada), redirecionar imediatamente
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Previne execução dupla no React StrictMode
    if (processed.current) return;
    processed.current = true;

    let cancelled = false;

    async function processCallback() {
      try {
        // Garantir que o cliente Supabase esteja inicializado
        const result = await handleAuthCallback();

        if (cancelled) return;

        if (result.success) {
          setStatus('success');
          setMessage('Autenticação realizada com sucesso! Redirecionando…');

          // Pequeno delay para mostrar feedback visual
          setTimeout(() => {
            if (!cancelled) {
              navigate('/dashboard', { replace: true });
            }
          }, 800);
        } else {
          // Se falhou, verifica se a sessão já foi processada (StrictMode)
          const currentState = useAuthStore.getState();
          if (currentState.isAuthenticated) {
            navigate('/dashboard', { replace: true });
            return;
          }

          setStatus('error');
          setMessage(result.error || 'Falha na autenticação. Tente novamente.');

          setTimeout(() => {
            if (!cancelled) {
              navigate('/login', { replace: true });
            }
          }, 2000);
        }
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        setMessage('Erro inesperado. Redirecionando…');
        setTimeout(() => {
          if (!cancelled) {
            navigate('/login', { replace: true });
          }
        }, 2000);
      }
    }

    processCallback();

    return () => {
      cancelled = true;
    };
  }, [navigate, handleAuthCallback, isAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg dark:bg-bg-dark">
      <div className="text-center max-w-sm px-8">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/LOGO.png"
            alt="Fusion ERP"
            className="w-20 h-20 object-contain rounded-2xl shadow-lg"
          />
        </div>

        {/* Status indicator */}
        <div className="mb-6">
          {status === 'processing' && (
            <div className="flex justify-center mb-4">
              <svg
                className="animate-spin h-10 w-10 text-gold dark:text-gold-dark"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          )}

          {status === 'success' && (
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-sage/20 dark:bg-sage-dark/20 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-7 h-7 text-sage dark:text-sage-dark"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-rose/20 dark:bg-rose-dark/20 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-7 h-7 text-rose dark:text-rose-dark"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        <h2 className="font-display text-xl font-semibold text-ink dark:text-ink-dark mb-2">
          {status === 'processing' && 'Autenticando…'}
          {status === 'success' && 'Autenticação concluída!'}
          {status === 'error' && 'Algo deu errado'}
        </h2>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft">
          {message}
        </p>

        {/* Error retry */}
        {status === 'error' && (
          <button
            onClick={() => navigate('/login')}
            className="mt-6 btn btn-sm"
          >
            Voltar para o login
          </button>
        )}
      </div>
    </div>
  );
}
