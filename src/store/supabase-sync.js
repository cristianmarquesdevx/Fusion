/** @format */

/**
 * Fusion ERP — Supabase Sync Utility
 *
 * Hook/mixin reutilizável para sincronizar stores com o Supabase.
 * Cada store pode usar este módulo para adicionar capacidade de
 * carregar/salvar dados no Supabase, mantendo fallback para dados locais.
 *
 * Uso:
 *   import { createSupabaseSync } from '../store/supabase-sync';
 *   const sync = createSupabaseSync('clientes', unidadeId);
 *   await sync.load(set);   // carrega dados do Supabase
 *   await sync.save(data);  // salva no Supabase
 */

import { SupabaseService } from '../services/supabase';
import { APP_CONFIG } from '../utils';

const DEFAULT_UNIDADE = APP_CONFIG.supabase.demoUnidadeId;

/**
 * Cria um objeto de sincronização para uma tabela específica
 * @param {string} table - Nome da tabela no Supabase
 * @param {string} [unidadeId] - ID da unidade (default: demoUnidadeId)
 * @returns {object} - Métodos de sincronização
 */
export function createSupabaseSync(table, unidadeId = DEFAULT_UNIDADE) {
  const ctx = SupabaseService.withUnit(table, unidadeId);

  return {
    /**
     * Carrega dados do Supabase e atualiza o store
     * @param {function} setState - Função set do Zustand
     * @param {object} options - Opções de consulta
     */
    async load(setState, options = {}) {
      if (!SupabaseService.isReady()) return false;
      try {
        const { data, error } = await ctx.select(options);
        if (error) throw error;
        if (data) {
          setState({ data, loaded: true });
          return data;
        }
      } catch (e) {
        // Silencia erro de carregamento
      }
      return false;
    },

    /**
     * Insere ou atualiza um registro
     */
    async save(data) {
      if (!SupabaseService.isReady()) return { success: false, offline: true };
      try {
        const { data: result, error } = await ctx.insert(data);
        if (error) throw error;
        return { success: true, data: result?.[0] || result };
      } catch (e) {
        return { success: false, error: e };
      }
    },

    /**
     * Atualiza um registro pelo ID
     */
    async update(id, data) {
      if (!SupabaseService.isReady()) return { success: false, offline: true };
      try {
        const { data: result, error } = await ctx.update(id, data);
        if (error) throw error;
        return { success: true, data: result?.[0] };
      } catch (e) {
        return { success: false, error: e };
      }
    },

    /**
     * Remove um registro pelo ID
     */
    async remove(id) {
      if (!SupabaseService.isReady()) return { success: false, offline: true };
      try {
        const { error } = await ctx.delete(id);
        if (error) throw error;
        return { success: true };
      } catch (e) {
        return { success: false, error: e };
      }
    },

    /**
     * Executa query personalizada
     */
    async query(method, params = {}) {
      if (!SupabaseService.isReady()) return { data: null, offline: true };
      return SupabaseService.query(table, method, { ...params, eq: { field: 'unidade_id', value: unidadeId } });
    },
  };
}

/**
 * Decorator para adicionar métodos Supabase a um store Zustand
 * @param {function} createStore - Função original create do Zustand
 * @param {string} table - Nome da tabela Supabase
 * @param {string} [unidadeId] - ID da unidade
 * @returns {function} - Store decorada com métodos Supabase
 */
export function withSupabase(createStore, table, unidadeId = DEFAULT_UNIDADE) {
  const sync = createSupabaseSync(table, unidadeId);

  return (set, get, api) => {
    const store = createStore(set, get, api);

    return {
      ...store,

      /** Flag indicando se dados foram carregados do Supabase */
      _supabaseLoaded: false,
      _sync: sync,

      /** Carrega dados iniciais do Supabase */
      async initFromSupabase(options = {}) {
        const data = await sync.load(set, options);
        if (data) {
          set({ _supabaseLoaded: true });
        }
        return data;
      },

      /** Salva no Supabase + atualiza store local */
      async saveToSupabase(item) {
        const result = await sync.save(item);
        if (result.success && result.data) {
          // Atualiza lista local se temos a função addItem no store
          if (typeof store.addItem === 'function') {
            store.addItem(result.data);
          }
        }
        return result;
      },
    };
  };
}

export default createSupabaseSync;
