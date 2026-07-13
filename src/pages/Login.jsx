/** @format */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Helpers } from '../utils/helpers';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
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
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-gold dark:bg-gold-dark flex items-center justify-center text-brand-strong dark:text-brand-dark-ink font-display font-bold text-2xl">
              F
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-ink dark:text-ink-dark">
                Fusion
              </div>
              <div className="text-[11px] tracking-[1.2px] uppercase text-ink-faint dark:text-ink-dark-faint">
                ERP Estética
              </div>
            </div>
          </div>

          {/* Welcome */}
          <div className="mb-10">
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink dark:text-ink-dark mb-2">
              Bem-vinda de volta
            </h1>
            <p className="text-ink-soft dark:text-ink-dark-soft text-[15px]">
              Entre com suas credenciais para acessar o painel do Centro Vitta.
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
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

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-ink dark:text-ink-dark mb-1.5"
              >
                Senha
              </label>
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

          {/* Footer */}
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
