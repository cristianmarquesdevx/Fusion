/** @format */

/**
 * Fusion ERP v2 — Store de Autenticação (Zustand)
 */

import { create } from 'zustand';
import { SupabaseService } from '../services/supabase';
import { StorageService } from '../services/storage';
import { APP_CONFIG } from '../utils/constants';

const SESSION_KEY = APP_CONFIG.session.storageKey;

const initialState = {
  user: null,
  isAuthenticated: false,
  permissions: [],
  loginAttempts: 0,
  loading: false,
  error: null,
};

export const useAuthStore = create((set, get) => ({
  ...initialState,

  // Restore session from storage
  init: () => {
    const session = StorageService.get(SESSION_KEY);
    if (session) {
      set({ user: session, isAuthenticated: true, permissions: ['*'] });
      return true;
    }
    return false;
  },

  // Login action
  login: async (email, password) => {
    set({ loading: true, error: null });

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

  // Logout action
  logout: async () => {
    await SupabaseService.signOut();
    StorageService.remove(SESSION_KEY);
    set({ ...initialState });
    window.location.href = '/login';
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
