/** @format */

import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import Shell from './components/layout/Shell';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Lazy-loaded pages — cada uma vira um chunk separado no build
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const AuthCallback = lazy(() => import('./pages/AuthCallback'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Agenda = lazy(() => import('./pages/Agenda'));
const FilaAtendimento = lazy(() => import('./pages/FilaAtendimento'));
const Financeiro = lazy(() => import('./pages/Financeiro'));
const Estoque = lazy(() => import('./pages/Estoque'));
const Fidelidade = lazy(() => import('./pages/Fidelidade'));
const Pacotes = lazy(() => import('./pages/Pacotes'));
const PDV = lazy(() => import('./pages/PDV'));
const BI = lazy(() => import('./pages/BI'));
const PlanosRecorrentes = lazy(() => import('./pages/PlanosRecorrentes'));
const ListaEspera = lazy(() => import('./pages/ListaEspera'));
const Salas = lazy(() => import('./pages/Salas'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Prontuario = lazy(() => import('./pages/Prontuario'));

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function PlaceholderView() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
      <div className="flex gap-2.5 justify-center mb-5">
        <span className="w-9 h-9 rounded-lg bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center text-ink-faint dark:text-ink-dark-faint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18M15 3v18" />
          </svg>
        </span>
        <span className="w-9 h-9 rounded-lg bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center text-ink-faint dark:text-ink-dark-faint">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </span>
      </div>
      <h3 className="font-display text-xl font-semibold text-ink dark:text-ink-dark mb-2">
        Em andamento
      </h3>
      <p className="text-sm text-ink-soft dark:text-ink-dark-soft max-w-xs">
        Este módulo está sendo migrado para o React e estará disponível em breve.
      </p>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-bg dark:bg-bg-dark">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(47,74,62,0.08) 0%, transparent 50%)',
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-12">
          <img
            src="/LOGO.png"
            alt="Fusion ERP"
            className="w-28 h-28 sm:w-32 sm:h-32 object-contain rounded-[28px] shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          />
        </div>
        <div className="relative mb-6">
          <svg
            className="animate-spin h-8 w-8 text-gold dark:text-gold-dark"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </div>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft animate-pulse">
          Restaurando sessão…
        </p>
        <p className="absolute bottom-8 text-[11px] text-ink-faint dark:text-ink-dark-faint">
          Fusion ERP v2.0.0
        </p>
      </div>
    </div>
  );
}

/** Fallback exibido enquanto um chunk lazy está sendo carregado */
function RouteLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin h-8 w-8 text-gold dark:text-gold-dark"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft">Carregando módulo…</p>
      </div>
    </div>
  );
}

export default function App() {
  const init = useAuthStore((s) => s.init);
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (loading && !isAuthenticated && window.location.pathname !== '/auth/callback') {
    return <SplashScreen />;
  }

  return (
    <ErrorBoundary fallback="critical">
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Shell>
                  <Dashboard />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Shell>
                  <Clientes />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute>
                <Shell>
                  <Agenda />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fila-atendimento"
            element={
              <ProtectedRoute>
                <Shell>
                  <FilaAtendimento />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/financeiro"
            element={
              <ProtectedRoute>
                <Shell>
                  <Financeiro />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/estoque"
            element={
              <ProtectedRoute>
                <Shell>
                  <Estoque />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/fidelidade"
            element={
              <ProtectedRoute>
                <Shell>
                  <Fidelidade />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pacotes"
            element={
              <ProtectedRoute>
                <Shell>
                  <Pacotes />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pdv"
            element={
              <ProtectedRoute>
                <Shell>
                  <PDV />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/planos-recorrentes"
            element={
              <ProtectedRoute>
                <Shell>
                  <PlanosRecorrentes />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lista-espera"
            element={
              <ProtectedRoute>
                <Shell>
                  <ListaEspera />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/salas"
            element={
              <ProtectedRoute>
                <Shell>
                  <Salas />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/prontuario"
            element={
              <ProtectedRoute>
                <Shell>
                  <Prontuario />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <ProtectedRoute>
                <Shell>
                  <Configuracoes />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <ProtectedRoute>
                <Shell>
                  <Relatorios />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/:module"
            element={
              <ProtectedRoute>
                <Shell>
                  <PlaceholderView />
                </Shell>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
