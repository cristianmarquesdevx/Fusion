/** @format */

/**
 * Fusion ERP v2 — Hook de Inicialização Supabase
 *
 * Hook utilitário para stores carregarem dados do Supabase com fallback
 * automático para os dados mockados locais quando offline.
 *
 * Uso típico dentro de uma store Zustand:
 *
 *   import { supabaseData } from '../services/supabase-data';
 *   import { withSupabaseFallback } from '../hooks/useSupabaseInit';
 *
 *   // No método loadDashboard:
 *   const data = await withSupabaseFallback(
 *     () => supabaseData.loadDashboard(unidadeId),
 *     MOCK_DATA
 *   );
 */

import { supabaseData } from '../services/supabase-data';

/**
 * Tenta carregar dados do Supabase.
 * Se falhar (offline ou erro), retorna o fallback.
 * Se conseguir, retorna os dados do Supabase (ou fallback se vier null/vazio).
 *
 * @param {Function} fetchFn - Função async que busca do Supabase
 * @param {*} fallbackData - Dados mockados para usar se Supabase estiver offline
 * @param {Object} [options]
 * @param {boolean} [options.keepFallbackIfEmpty=true] - Se true, usa fallback quando Supabase retorna array vazio
 * @returns {Promise<*>} - Dados do Supabase ou fallback
 */
export async function withSupabaseFallback(fetchFn, fallbackData, options = {}) {
  const { keepFallbackIfEmpty = true } = options;

  try {
    const data = await fetchFn();

    // Se Supabase retornou dados válidos
    if (data !== null && data !== undefined) {
      // Se for array, verificar se não está vazio
      if (Array.isArray(data) && data.length === 0 && keepFallbackIfEmpty) {
        return fallbackData;
      }
      return data;
    }

    // Supabase está offline ou retornou null
    return fallbackData;
  } catch (e) {
    // Erro inesperado — usar fallback
    return fallbackData;
  }
}

/**
 * Tenta sincronizar uma operação com o Supabase.
 * Se falhar, a operação ainda é aplicada localmente.
 *
 * @param {Function} syncFn - Função async que executa no Supabase
 * @returns {Promise<Object>} - Resultado { success, offline, data }
 */
export async function trySync(syncFn) {
  try {
    const result = await syncFn();
    return result;
  } catch (e) {
    return { success: false, error: e, offline: true };
  }
}

/**
 * Verifica se o Supabase está disponível
 */
export function isSupabaseReady() {
  return supabaseData.isReady;
}

export default withSupabaseFallback;
