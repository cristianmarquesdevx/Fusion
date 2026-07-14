/** @format */

/**
 * Fusion ERP v2 — Store de Autenticação (Zustand)
 *
 * Gerencia autenticação via Supabase (email/senha e OAuth),
 * com fallback para usuários demo em localStorage.
 */

import { create } from 'zustand';
import { SupabaseService } from '../services/supabase';
import { StorageService } from '../services/storage';
import { APP_CONFIG } from '../utils/constants';

const SESSION_KEY = APP_CONFIG.session.storageKey;

// Listener de auth armazenado fora do Zustand para evitar serialização
// de funções no estado e permitir cleanup adequado.
let authUnsubscribe = null;

// Flag para evitar toast de "sessão encerrada" no logout intencional
let isIntentionalLogout = false;

const initialState = {
  user: null,
  isAuthenticated: false,
  permissions: [],
  loginAttempts: 0,
  loading: true, // começa true para evitar flash antes do init() rodar
  error: null,
};

/** Limpa listener de auth anterior e configura um novo */
async function setupAuthListener() {
  // Remove listener anterior se existir
  if (authUnsubscribe) {
    authUnsubscribe();
    authUnsubscribe = null;
  }

  await SupabaseService.init();
  const unsubscribe = SupabaseService.onAuthStateChange((event, session) => {
    const state = useAuthStore.getState();
    if (event === 'SIGNED_OUT') {
      if (state.isAuthenticated) {
        StorageService.remove(SESSION_KEY);
        useAuthStore.setState({ ...initialState });

        // Salva toast no sessionStorage (persiste entre navegações)
        // e redireciona para o login. O hook useAuthListener lê ao montar.
        if (typeof window !== 'undefined' && !isIntentionalLogout) {
          try {
            sessionStorage.setItem('fusion_auth_toast', JSON.stringify({
              type: 'warning',
              title: 'Sessão encerrada',
              message: 'Sua sessão foi encerrada em outro dispositivo.',
            }));
          } catch { /* ignora erro de storage */ }
        }

        // Redirecionar para o login (a não ser que já estejamos lá)
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    } else if (event === 'TOKEN_REFRESHED' && session?.user) {
      const user = SupabaseService.formatUser(session.user);
      StorageService.set(SESSION_KEY, user);
      useAuthStore.setState({ user, isAuthenticated: true, permissions: ['*'] });
    } else if (event === 'INITIAL_SESSION' && session?.user) {
      const user = SupabaseService.formatUser(session.user);
      StorageService.set(SESSION_KEY, user);
      useAuthStore.setState({ user, isAuthenticated: true, permissions: ['*'], loading: false });
    }
  });

  authUnsubscribe = unsubscribe;
}

export const useAuthStore = create((set, get) => ({
  ...initialState,

  /**
   * Restore session on app mount.
   * Tenta restaurar do Supabase primeiro (OAuth), depois fallback localStorage.
   */
  init: async () => {
    set({ loading: true });

    // 1. Tentar restaurar sessão do Supabase (OAuth / token persistido)
    const sessionResult = await SupabaseService.getSession();
    if (sessionResult?.data?.session) {
      const user = SupabaseService.formatUser(sessionResult.data.session.user);
      StorageService.set(SESSION_KEY, user);
      set({
        user,
        isAuthenticated: true,
        permissions: ['*'],
        loading: false,
        error: null,
      });

      // Inscrever para mudanças de auth em tempo real
      setupAuthListener();

      return true;
    }

    // 2. Fallback: restaurar sessão do localStorage (usuários demo)
    const localSession = StorageService.get(SESSION_KEY);
    if (localSession) {
      set({ user: localSession, isAuthenticated: true, permissions: ['*'], loading: false });
      return true;
    }

    set({ loading: false });
    return false;
  },

  /**
   * Login com email e senha (Supabase auth, com fallback demo)
   */
  login: async (email, password) => {
    set({ loading: true, error: null });
    // Resetar flag de logout intencional ao fazer novo login
    isIntentionalLogout = false;

    if (!email || !password) {
      set({ loading: false, error: 'Preencha email e senha para entrar.' });
      return { success: false };
    }

    try {
      const result = await SupabaseService.signIn(email, password);

      if (result.success) {
        StorageService.set(SESSION_KEY, result.user);
        set({
          user: result.user,
          isAuthenticated: true,
          permissions: ['*'],
          loginAttempts: 0,
          loading: false,
          error: null,
        });

        // Configurar listener de auth
        setupAuthListener();

        return { success: true, user: result.user };
      }

      const attempts = get().loginAttempts + 1;
      set({ loginAttempts: attempts, loading: false, error: result.error });

      if (attempts >= 5) {
        return {
          success: false,
          error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.',
        };
      }
      return { success: false, error: result.error };
    } catch (err) {
      set({ loading: false, error: 'Erro de conexão. Tente novamente.' });
      return { success: false, error: 'Erro de conexão.' };
    }
  },

  /**
   * Login com GitHub OAuth — redireciona o navegador para o GitHub
   */
  loginWithGithub: async () => {
    return get()._socialLogin(() => SupabaseService.signInWithGithub(), 'GitHub');
  },

  /**
   * Login com Google OAuth — redireciona o navegador para o Google
   */
  loginWithGoogle: async () => {
    return get()._socialLogin(() => SupabaseService.signInWithGoogle(), 'Google');
  },

  /**
   * Helper genérico para login social (GitHub, Google, etc.)
   */
  _socialLogin: async (loginFn, providerName) => {
    set({ loading: true, error: null });
    const result = await loginFn();
    if (!result.success) {
      set({ loading: false, error: result.error || `Erro ao conectar com ${providerName}.` });
      return { success: false, error: result.error };
    }
    return { success: true };
  },

  /**
   * Processa callback OAuth — chamado pela página AuthCallback
   */
  handleAuthCallback: async () => {
    // Garantir que o cliente Supabase esteja pronto
    await SupabaseService.init();
    // Resetar flag de logout intencional ao processar callback OAuth
    isIntentionalLogout = false;

    set({ loading: true, error: null });
    const result = await SupabaseService.handleAuthCallback();
    if (result.success) {
      StorageService.set(SESSION_KEY, result.user);
      set({
        user: result.user,
        isAuthenticated: true,
        permissions: ['*'],
        loading: false,
        error: null,
      });

      // Configurar listener de auth
      setupAuthListener();

      return { success: true, user: result.user };
    }
    set({ loading: false, error: result.error || 'Falha na autenticação.' });
    return { success: false, error: result.error };
  },

  /**
   * Logout — limpa sessão no Supabase e localStorage
   */
  logout: async (navigate) => {
    // Marca como logout intencional para evitar toast de "sessão encerrada"
    isIntentionalLogout = true;
    await SupabaseService.signOut();
    StorageService.remove(SESSION_KEY);
    // Limpar listener de auth
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    // loading: false para não travar a UI após logout
    set({ ...initialState, loading: false });
    if (navigate) {
      navigate('/login', { replace: true });
    } else {
      window.location.href = '/login';
    }
  },

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Clear error state
   */
  clearError: () => set({ error: null }),

  /**
   * Cleanup on unmount (para testes)
   */
  destroy: () => {
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
  },
}));
