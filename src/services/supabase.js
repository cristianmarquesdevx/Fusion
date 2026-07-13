/** @format */

/**
 * Fusion ERP v2 — Supabase Client Service
 */

import { APP_CONFIG } from '../utils/constants';
import { StorageService } from './storage';

let supabaseClient = null;
let clientReady = false;

async function getClient() {
  if (supabaseClient) return supabaseClient;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(
      APP_CONFIG.supabase.url,
      APP_CONFIG.supabase.anonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          storageKey: APP_CONFIG.supabase.storageKey,
        },
      }
    );
    clientReady = true;
    return supabaseClient;
  } catch (e) {
    console.warn('[Supabase] SDK não disponível:', e.message);
    return null;
  }
}

// Initialize immediately
const initPromise = getClient();

export const SupabaseService = {
  _ready: false,
  _status: 'offline',

  async init() {
    await initPromise;
    this._ready = clientReady;
    return this._ready;
  },

  isReady() {
    return clientReady && !!supabaseClient;
  },

  getStatus() {
    return this._status;
  },

  async signIn(email, password) {
    if (!this.isReady()) return this._fallbackSignIn(email, password);
    try {
      const result = await supabaseClient.auth.signInWithPassword({ email, password });
      if (result.error) return { success: false, error: result.error.message };
      const user = result.data.user;
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          role: user.user_metadata?.role || 'recepcionista',
          avatar: user.user_metadata?.avatar_url || null,
          company: user.user_metadata?.company || 'Fusion Estética',
          companyId: user.user_metadata?.company_id || '1',
        },
      };
    } catch (e) {
      return { success: false, error: e.message || 'Erro de conexão.' };
    }
  },

  _fallbackSignIn(email, password) {
    const found = APP_CONFIG.demoUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (found) {
      return {
        success: true,
        user: {
          id: String(email.charCodeAt(0)),
          email,
          name: found.name,
          role: found.role,
          avatar: null,
          company: 'Fusion Estética',
          companyId: '1',
        },
      };
    }
    return { success: false, error: 'Email ou senha inválidos.' };
  },

  async signOut() {
    if (this.isReady()) {
      try {
        await supabaseClient.auth.signOut();
      } catch (e) {
        console.warn('[Supabase] Erro ao fazer logout:', e);
      }
    }
    clientReady = false;
    return true;
  },

  async select(table, columns = '*', options = {}) {
    if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
    try {
      let query = supabaseClient.from(table).select(columns);
      if (options.eq) query = query.eq(options.eq.field, options.eq.value);
      if (options.order) query = query.order(options.order.field, { ascending: options.order.ascending !== false });
      if (options.limit) query = query.limit(options.limit);
      return await query;
    } catch (e) {
      return { data: null, error: e };
    }
  },

  async insert(table, data) {
    if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
    try {
      return await supabaseClient.from(table).insert(data).select();
    } catch (e) {
      return { data: null, error: e };
    }
  },
};

// Auto-init
SupabaseService.init();
