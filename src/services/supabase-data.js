/** @format */

/**
 * Fusion ERP v2 — Supabase Data Service
 *
 * Serviço centralizado que expõe métodos sync/async para cada módulo,
 * com fallback automático para dados mockados quando offline.
 *
 * Uso:
 *   import { supabaseData } from '../services/supabase-data';
 *   const clientes = await supabaseData.clientes.load();
 *   await supabaseData.clientes.save({ nome: 'João' });
 */

import { createSupabaseSync } from '../store/supabase-sync';
import { SupabaseService } from './supabase';

/**
 * Factory que cria um módulo sync com fallback
 */
function createModule(table, unidadeId) {
  // Se não informar unidadeId, o createSupabaseSync usará DEFAULT_UNIDADE
  const sync = createSupabaseSync(table, unidadeId);

  return {
    /** Nome da tabela */
    table,

    /** Verifica se Supabase está pronto */
    isAvailable() {
      return SupabaseService.isReady();
    },

    /**
     * Carrega dados do Supabase
     * @returns {Promise<Array|null>} - dados ou null se offline
     */
    async load(options = {}) {
      if (!this.isAvailable()) return null;
      try {
        const { data, error } = await sync.query('select', options);
        if (error) throw error;
        return data || [];
      } catch (e) {
        return null;
      }
    },

    /**
     * Salva um registro no Supabase
     */
    async save(data) {
      if (!this.isAvailable()) return { success: false, offline: true };
      return sync.save(data);
    },

    /**
     * Atualiza um registro pelo ID
     */
    async update(id, data) {
      if (!this.isAvailable()) return { success: false, offline: true };
      return sync.update(id, data);
    },

    /**
     * Remove um registro pelo ID
     */
    async remove(id) {
      if (!this.isAvailable()) return { success: false, offline: true };
      return sync.remove(id);
    },

    /**
     * Executa RPC
     */
    async rpc(func, args = {}) {
      if (!this.isAvailable()) return { data: null, error: null, offline: true };
      return SupabaseService.query(table, 'rpc', { func, args });
    },

    /**
     * Busca com filtros
     */
    async find(params = {}) {
      if (!this.isAvailable()) return null;
      const { data, error } = await sync.query('select', params);
      if (error) return null;
      return data || [];
    },
  };
}

/**
 * Supabase Data Service — módulos disponíveis
 */
export const supabaseData = {
  /** Indica se o Supabase está globalmente disponível */
  get isReady() {
    return SupabaseService.isReady();
  },

  /** Inicializa a conexão Supabase */
  async init() {
    return SupabaseService.init();
  },

  // ─── MÓDULOS ───

  clientes: createModule('clientes'),
  agendamentos: createModule('agendamentos'),
  transacoes: createModule('transacoes'),
  estoqueItems: createModule('estoque_items'),
  estoqueEntradas: createModule('estoque_entradas'),
  profissionais: createModule('profissionais'),
  servicos: createModule('servicos'),
  salas: createModule('salas'),
  equipamentos: createModule('equipamentos'),
  sessoesFila: createModule('sessoes_fila'),
  pacotes: createModule('pacotes'),
  planos: createModule('planos'),
  fidelidadeClientes: createModule('fidelidade_clientes'),
  fidelidadeHistorico: createModule('fidelidade_historico'),
  listaEspera: createModule('lista_espera'),
  pdvVendas: createModule('pdv_vendas'),
  prontuarios: createModule('prontuarios'),

  // ─── MÉTODOS ESPECÍFICOS ───

  /** Dashboard: carrega dados consolidados */
  async loadDashboard(unidadeId) {
    if (!this.isReady || !unidadeId) return null;
    try {
      const { data, error } = await SupabaseService.getDashboardData(unidadeId);
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  /** BI: carrega indicadores */
  async loadBIIndicadores(unidadeId) {
    if (!this.isReady) return null;
    try {
      const { data, error } = await SupabaseService.getBIIndicadores(unidadeId);
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  /** Lista de espera: bulk operations */
  async addToWaitlist(entry) {
    return this.listaEspera.save(entry);
  },

  async removeFromWaitlist(id) {
    return this.listaEspera.remove(id);
  },

  /** Fidelidade */
  async loadFidelidadeNiveis() {
    if (!this.isReady) return null;
    try {
      const { data, error } = await SupabaseService.listarFidelidadeNiveis();
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  async loadFidelidadeCompleta(unidadeId) {
    if (!this.isReady) return null;
    try {
      const { data, error } = await SupabaseService.listarFidelidadeCompleta(unidadeId);
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  /** Estoque: entrada e saída */
  async registrarEntrada(unidadeId, itemId, quantidade, valorUnitario, fornecedor) {
    if (!this.isReady) return { success: false, offline: true };
    try {
      const result = await SupabaseService.registrarEntrada(
        unidadeId, itemId, quantidade, valorUnitario, fornecedor
      );
      return result;
    } catch (e) {
      return { success: false, error: e };
    }
  },

  async registrarSaida(unidadeId, itemId, quantidade, motivo) {
    if (!this.isReady) return { success: false, offline: true };
    try {
      return await SupabaseService.registrarSaida(unidadeId, itemId, quantidade, motivo);
    } catch (e) {
      return { success: false, error: e };
    }
  },

  /** Fila de atendimento */
  async loadFila(unidadeId, status) {
    if (!this.isReady) return null;
    try {
      const { data, error } = await SupabaseService.listarFila(unidadeId, status);
      if (error) throw error;
      return data;
    } catch (e) {
      return null;
    }
  },

  async finalizarSessao(sessaoId, valorReal) {
    if (!this.isReady) return { success: false, offline: true };
    try {
      return await SupabaseService.finalizarSessao(sessaoId, valorReal);
    } catch (e) {
      return { success: false, error: e };
    }
  },

  /** Auditoria */
  async registrarAuditoria(unidadeId, acao, entidade, entidadeId, detalhes) {
    if (!this.isReady) return { success: false, offline: true };
    try {
      return await SupabaseService.registrarAuditoria(
        unidadeId, acao, entidade, entidadeId, detalhes
      );
    } catch (e) {
      return { success: false, error: e };
    }
  },
};

export default supabaseData;
