/** @format */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loading = useAuthStore((s) => s.loading);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState('admin@fusion.com');
  const [password, setPassword] = useState('admin123');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) {
      showToast('Preencha email e senha para entrar.', 'error');
      return;
    }

    const result = await login(email.trim(), password.trim());
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      showToast(result.error || 'Email ou senha inválidos.', 'error');
    }
  };

  const handleGoogleLogin = async () => {
    clearError();
    const result = await loginWithGoogle();
    if (!result.success) {
      showToast(result.error || 'Erro ao conectar com Google.', 'error');
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-bg dark:bg-bg-dark">
      {/* Left side — Login form */}
      <div className="relative flex items-center justify-center p-8 lg:p-16 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 30% 50%, rgba(47,74,62,0.08) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(156,122,62,0.06) 0%, transparent 50%)',
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Logo — ENORME, só a logo, sem texto */}
          <div className="flex justify-center mb-16">
            <img
              src="/LOGO.png"
              alt="Fusion ERP"
              className="w-44 h-44 sm:w-52 sm:h-52 object-contain rounded-[32px] shadow-2xl ring-1 ring-black/5"
            />
          </div>

          {/* Welcome */}
          <div className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink dark:text-ink-dark mb-2">
              Bem-vinda de volta
            </h1>
            <p className="text-ink-soft dark:text-ink-dark-soft text-[15px]">
              Entre com sua conta para acessar o painel do Centro Vitta.
            </p>
          </div>

          {/* Login Form — EMAIL E SENHA PRIMEIRO */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-ink dark:text-ink-dark mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-ink dark:text-ink-dark"
                >
                  Senha
                </label>
                <span className="text-[12px] text-gold dark:text-gold-dark hover:underline cursor-pointer">
                  Esqueceu a senha?
                </span>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Sua senha"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-lg w-full h-12 justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Entrando…
                </span>
              ) : (
                'Entrar no sistema'
              )}
            </button>
          </form>

          {/* Divider — GOOGLE EMBAIXO */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border dark:border-border-dark" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-bg dark:bg-bg-dark px-2.5 text-ink-faint dark:text-ink-dark-faint">
                ou entre com Google
              </span>
            </div>
          </div>

          {/* Google Button — AGORA EMBAIXO */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-semibold text-sm shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-200 border border-gray-200 dark:bg-white/95 dark:hover:bg-white/85"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? 'Entrando…' : 'Continuar com Google'}
          </button>

          {/* Footer — mais espaço do Google */}
          <p className="text-center mt-10 text-xs text-ink-faint dark:text-ink-dark-faint">
            Fusion ERP v2.0.0 — Desenvolvido por Cristian Marques
          </p>
        </div>
      </div>

      {/* Right side — Showcase */}
      <div className="hidden lg:flex items-center justify-center bg-gradient-to-br from-[#1C2620] to-[#0E1710] p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute w-[600px] h-[600px] rounded-full bg-[rgba(47,74,62,0.15)] top-[-100px] right-[-100px] pointer-events-none" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-[rgba(156,122,62,0.1)] bottom-[-50px] left-[-50px] pointer-events-none" />

        <div className="relative z-10 text-center text-white max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gold flex items-center justify-center mx-auto mb-8">
            <span className="font-display font-bold text-4xl text-brand-strong">
              F
            </span>
          </div>

          <h2 className="font-display text-3xl font-semibold mb-4">
            Fusion ERP
          </h2>
          <p className="text-white/60 text-base leading-relaxed max-w-sm mx-auto">
            Sistema completo de gestão para centros de estética avançada
          </p>

          <div className="grid grid-cols-2 gap-4 mt-12 text-left">
            {[
              'Dashboard Executivo',
              'Agenda Inteligente',
              'Gestão de Clientes',
              'Controle Financeiro',
              'Prontuário Digital',
              'BI & Relatórios',
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/10"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gold dark:text-gold-dark flex-shrink-0"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-[13px] text-white/70">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl text-sm font-semibold z-[999] shadow-lg animate-fade-in text-white ${
            toast.type === 'error'
              ? 'bg-rose dark:bg-rose-dark'
              : 'bg-sage dark:bg-sage-dark'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
