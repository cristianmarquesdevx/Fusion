/** @format */

import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useUIStore } from './store/useUIStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Agenda from './pages/Agenda';
import FilaAtendimento from './pages/FilaAtendimento';
import Financeiro from './pages/Financeiro';
import Estoque from './pages/Estoque';
import Fidelidade from './pages/Fidelidade';
import Pacotes from './pages/Pacotes';
import PDV from './pages/PDV';
import BI from './pages/BI';
import PlanosRecorrentes from './pages/PlanosRecorrentes';
import ListaEspera from './pages/ListaEspera';
import Salas from './pages/Salas';
import Configuracoes from './pages/Configuracoes';
import Relatorios from './pages/Relatorios';
import Prontuario from './pages/Prontuario';
import Shell from './components/layout/Shell';

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

// Placeholder for modules not yet migrated
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

export default function App() {
  const init = useAuthStore((s) => s.init);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    // Restore session on mount
    init();
  }, []);

  useEffect(() => {
    // Sync theme class
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

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

      {/* Clientes */}
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

      {/* Agenda */}
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

      {/* Fila de Atendimento */}
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

      {/* Financeiro */}
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

      {/* Estoque */}
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

      {/* Fidelidade */}
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

      {/* Pacotes */}
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

      {/* PDV */}
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

      {/* Planos Recorrentes */}
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

      {/* Lista de Espera */}
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

      {/* Salas */}
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

      {/* Prontuario */}
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

      {/* Configuracoes */}
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

      {/* Relatorios */}
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

      {/* Catch-all for modules not yet migrated */}
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
  );
}
