/** @format */

/**
 * Fusion ERP v2 — Supabase Client Service
 * Serviço central de banco de dados com suporte a todos os módulos.
 * Inclui fallback para localStorage quando Supabase não está disponível.
 */

import { APP_CONFIG } from '../utils';
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
    return null;
  }
}

const initPromise = getClient();

/**
 * Wrapper para queries Supabase com fallback silencioso
 */
/** Aplica filtros encadeados a uma query Supabase */
function applyFilters(q, params) {
  if (params.columns) q = q.select(params.columns);
  // Suporta array ou objeto único para eq
  if (params.eq) {
    const conditions = Array.isArray(params.eq) ? params.eq : [params.eq];
    conditions.forEach((c) => { q = q.eq(c.field, c.value); });
  }
  if (params.neq) q = q.neq(params.neq.field, params.neq.value);
  if (params.gte) q = q.gte(params.gte.field, params.gte.value);
  if (params.lte) q = q.lte(params.lte.field, params.lte.value);
  if (params.in) q = q.in(params.in.field, params.in.values);
  if (params.order) q = q.order(params.order.field, { ascending: params.order.ascending !== false });
  if (params.limit) q = q.limit(params.limit);
  if (params.range) q = q.range(params.range.from, params.range.to);
  if (params.single) q = q.single();
  return q;
}

async function query(table, method = 'select', params = {}) {
  if (!clientReady || !supabaseClient) {
    return { data: null, error: new Error('Supabase offline'), offline: true };
  }
  try {
    let q = supabaseClient.from(table);
    let result;

    switch (method) {
      case 'select':
        q = applyFilters(q.select(params.columns || '*'), params);
        result = await q;
        break;

      case 'insert':
        result = await supabaseClient.from(table).insert(params.data).select();
        break;

      case 'upsert':
        result = await supabaseClient.from(table).upsert(params.data, { onConflict: params.onConflict }).select();
        break;

      case 'update':
        q = supabaseClient.from(table).update(params.data);
        if (params.eq) q = q.eq(params.eq.field, params.eq.value);
        if (params.in) q = q.in(params.in.field, params.in.values);
        result = await q.select();
        break;

      case 'delete':
        q = supabaseClient.from(table).delete();
        if (params.eq) q = q.eq(params.eq.field, params.eq.value);
        if (params.in) q = q.in(params.in.field, params.in.values);
        result = await q;
        break;

      case 'rpc':
        result = await supabaseClient.rpc(params.func, params.args);
        break;

      default:
        throw new Error(`Método desconhecido: ${method}`);
    }

    return result;
  } catch (e) {
    return { data: null, error: e };
  }
}

/**
 * Helper: filtro contextual com unidade_id
 */
function withUnit(table, unidadeId) {
  return {
    table,
    unidadeId,
    async select(params = {}) {
      // Sempre inclui o filtro de unidade_id quando disponível
      const filters = { ...params };
      if (unidadeId) {
        const unitFilter = { field: 'unidade_id', value: unidadeId };
        if (filters.eq) {
          filters.eq = Array.isArray(filters.eq)
            ? [...filters.eq, unitFilter]
            : [filters.eq, unitFilter];
        } else {
          filters.eq = unitFilter;
        }
      }
      return query(table, 'select', filters);
    },
    async insert(data) {
      const payload = unidadeId ? { ...data, unidade_id: unidadeId } : data;
      return query(table, 'insert', { data: payload });
    },
    async update(id, data) {
      return query(table, 'update', { data, eq: { field: 'id', value: id } });
    },
    async delete(id) {
      return query(table, 'delete', { eq: { field: 'id', value: id } });
    },
    async getById(id) {
      return query(table, 'select', { eq: { field: 'id', value: id }, single: true });
    },
  };
}

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

  /* ═══════════════════════════════════════════════════════
     AUTH
     ═══════════════════════════════════════════════════════ */

  /**
   * Login com email e senha (Supabase auth, com fallback local)
   */
  async signIn(email, password) {
    if (this.isReady()) {
      try {
        const result = await supabaseClient.auth.signInWithPassword({ email, password });
        if (!result.error) {
          const user = result.data.user;
          return {
            success: true,
            user: this.formatUser(user),
            session: result.data.session,
          };
        }
        // Supabase offline — fallback local
      } catch (e) {
        // Rede indisponível — fallback local
      }
    }
    return this._fallbackSignIn(email, password);
  },

  /**
   * Login com Google OAuth — redireciona para página de autorização do Google
   */
  async signInWithGoogle() {
    return this._signInWithOAuth('google', 'email profile');
  },

  /**
   * Helper genérico para login OAuth com qualquer provedor do Supabase
   */
  async _signInWithOAuth(provider, scopes = '') {
    if (!this.isReady()) {
      return { success: false, error: 'Supabase não está disponível.' };
    }
    try {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes,
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, url: data.url };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Processa a callback OAuth — extrai a sessão dos parâmetros da URL
   */
  async handleAuthCallback() {
    if (!this.isReady()) {
      return { success: false, error: 'Supabase não está disponível.' };
    }
    try {
      const { data, error } = await supabaseClient.auth.getSession();
      if (error) throw error;
      if (data?.session) {
        return {
          success: true,
          user: this.formatUser(data.session.user),
          session: data.session,
        };
      }
      return { success: false, error: 'Nenhuma sessão encontrada.' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  /**
   * Obtém a sessão atual do Supabase (útil para verificar se já está logado)
   */
  async getSession() {
    if (!this.isReady()) return { data: { session: null }, error: null };
    try {
      const result = await supabaseClient.auth.getSession();
      return result;
    } catch (e) {
      return { data: { session: null }, error: e };
    }
  },

  /**
   * Escuta mudanças no estado de autenticação (login, logout, token refresh)
   * Retorna uma função unsubscribe para limpar o listener.
   */
  onAuthStateChange(callback) {
    if (!this.isReady()) {
      return () => {};
    }
    const { data } = supabaseClient.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data?.subscription?.unsubscribe || (() => {});
  },

  /** Formata o usuário do Supabase para o formato padrão do Fusion ERP */
  formatUser(user) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
      avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      role: user.user_metadata?.role || 'admin',
      company: user.user_metadata?.company || 'Fusion Estética',
      companyId: user.user_metadata?.company_id || APP_CONFIG.supabase.demoUnidadeId,
    };
  },

  _fallbackSignIn(email, password) {
    const found = APP_CONFIG.demoUsers.find((u) => u.email === email && u.password === password);
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
          companyId: APP_CONFIG.supabase.demoUnidadeId,
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
        // Ignora erro no logout
      }
    }
    clientReady = false;
    return true;
  },

  /* ═══════════════════════════════════════════════════════
     QUERY GENÉRICA
     ═══════════════════════════════════════════════════════ */

  query,
  withUnit,

  /* ═══════════════════════════════════════════════════════
     CLIENTES
     ═══════════════════════════════════════════════════════ */

  clientes(unidadeId) { return withUnit('clientes', unidadeId); },

  async buscarClientes(termo, unidadeId, limite = 20) {
    return query('buscar_clientes', 'rpc', {
      func: 'buscar_clientes',
      args: { p_termo: termo, p_unidade_id: unidadeId, p_limite: limite },
    });
  },

  /* ═══════════════════════════════════════════════════════
     PRONTUÁRIOS
     ═══════════════════════════════════════════════════════ */

  prontuarios(unidadeId) { return withUnit('prontuarios', unidadeId); },

  async listarProntuarios(clienteId) {
    return query('prontuarios', 'select', {
      eq: { field: 'cliente_id', value: clienteId },
      order: { field: 'data', ascending: false },
    });
  },

  /* ═══════════════════════════════════════════════════════
     PROFISSIONAIS
     ═══════════════════════════════════════════════════════ */

  profissionais(unidadeId) { return withUnit('profissionais', unidadeId); },

  /* ═══════════════════════════════════════════════════════
     SERVIÇOS
     ═══════════════════════════════════════════════════════ */

  servicos(unidadeId) { return withUnit('servicos', unidadeId); },

  /* ═══════════════════════════════════════════════════════
     AGENDAMENTOS
     ═══════════════════════════════════════════════════════ */

  agendamentos(unidadeId) { return withUnit('agendamentos', unidadeId); },

  async listarAgendamentos(unidadeId, data) {
    return query('agendamentos', 'select', {
      eq: [
        { field: 'unidade_id', value: unidadeId },
        { field: 'data', value: data },
      ],
      order: { field: 'hora', ascending: true },
    });
  },

  async criarAgendamento(dados) {
    return query('criar_agendamento', 'rpc', {
      func: 'criar_agendamento',
      args: dados,
    });
  },

  /* ═══════════════════════════════════════════════════════
     FILA DE ATENDIMENTO
     ═══════════════════════════════════════════════════════ */

  fila(unidadeId) { return withUnit('sessoes_fila', unidadeId); },

  async listarFila(unidadeId, status) {
    const params = {
      eq: { field: 'unidade_id', value: unidadeId },
      order: { field: 'hora_programada', ascending: true },
    };
    if (status) params.neq = { field: 'status', value: 'concluido' };
    return query('sessoes_fila', 'select', params);
  },

  async finalizarSessao(sessaoId, valorReal) {
    return query('finalizar_sessao', 'rpc', {
      func: 'finalizar_sessao',
      args: { p_sessao_id: sessaoId, p_valor_real: valorReal },
    });
  },

  /* ═══════════════════════════════════════════════════════
     SALAS
     ═══════════════════════════════════════════════════════ */

  salas(unidadeId) { return withUnit('salas', unidadeId); },

  /* ═══════════════════════════════════════════════════════
     EQUIPAMENTOS
     ═══════════════════════════════════════════════════════ */

  equipamentos(unidadeId) { return withUnit('equipamentos', unidadeId); },

  async listarEquipamentos(salaId) {
    return query('equipamentos', 'select', { eq: { field: 'sala_id', value: salaId } });
  },

  /* ═══════════════════════════════════════════════════════
     FINANCEIRO
     ═══════════════════════════════════════════════════════ */

  transacoes(unidadeId) { return withUnit('transacoes', unidadeId); },

  async listarTransacoes(unidadeId, periodo) {
    const params = {
      eq: { field: 'unidade_id', value: unidadeId },
      order: { field: 'data', ascending: false },
    };
    if (periodo?.inicio) params.gte = { field: 'data', value: periodo.inicio };
    if (periodo?.fim) params.lte = { field: 'data', value: periodo.fim };
    return query('transacoes', 'select', params);
  },

  /* ═══════════════════════════════════════════════════════
     PDV
     ═══════════════════════════════════════════════════════ */

  pdv(unidadeId) { return withUnit('pdv_vendas', unidadeId); },

  async finalizarVenda(dados) {
    return query('finalizar_venda_pdv', 'rpc', {
      func: 'finalizar_venda_pdv',
      args: dados,
    });
  },

  /* ═══════════════════════════════════════════════════════
     ESTOQUE
     ═══════════════════════════════════════════════════════ */

  estoque(unidadeId) { return withUnit('estoque_items', unidadeId); },

  async listarEstoqueCritico(unidadeId) {
    return query('vw_estoque_critico', 'select', { eq: { field: 'unidade_id', value: unidadeId } });
  },

  entradaEstoque(unidadeId) { return withUnit('estoque_entradas', unidadeId); },

  async registrarEntrada(unidadeId, itemId, quantidade, valorUnitario, fornecedor) {
    return query('registrar_entrada_estoque', 'rpc', {
      func: 'registrar_entrada_estoque',
      args: {
        p_unidade_id: unidadeId,
        p_item_id: itemId,
        p_quantidade: quantidade,
        p_valor_unitario: valorUnitario,
        p_fornecedor: fornecedor,
        p_created_by: null,
      },
    });
  },

  async registrarSaida(unidadeId, itemId, quantidade, motivo) {
    return query('registrar_saida_estoque', 'rpc', {
      func: 'registrar_saida_estoque',
      args: {
        p_unidade_id: unidadeId,
        p_item_id: itemId,
        p_quantidade: quantidade,
        p_motivo: motivo,
        p_created_by: null,
      },
    });
  },

  /* ═══════════════════════════════════════════════════════
     PACOTES E PLANOS
     ═══════════════════════════════════════════════════════ */

  pacotes(unidadeId) { return withUnit('pacotes', unidadeId); },
  planos(unidadeId) { return withUnit('planos', unidadeId); },
  assinaturas() { return withUnit('assinaturas', null); },
  clientePacotes() { return withUnit('cliente_pacotes', null); },

  /* ═══════════════════════════════════════════════════════
     FIDELIDADE
     ═══════════════════════════════════════════════════════ */

  fidelidadeClientes() { return withUnit('fidelidade_clientes', null); },
  fidelidadeHistorico() { return withUnit('fidelidade_historico', null); },

  async listarFidelidadeNiveis() {
    return query('fidelidade_niveis', 'select', { order: { field: 'pontos_min', ascending: true } });
  },

  async listarFidelidadeCompleta(unidadeId) {
    return query('vw_fidelidade_completa', 'select', { eq: { field: 'unidade_id', value: unidadeId } });
  },

  /* ═══════════════════════════════════════════════════════
     LISTA DE ESPERA
     ═══════════════════════════════════════════════════════ */

  listaEspera(unidadeId) { return withUnit('lista_espera', unidadeId); },

  /* ═══════════════════════════════════════════════════════
     DASHBOARD / BI
     ═══════════════════════════════════════════════════════ */

  async getDashboardData(unidadeId) {
    return query('get_dashboard_data', 'rpc', {
      func: 'get_dashboard_data',
      args: { p_unidade_id: unidadeId },
    });
  },

  async getFinanceiroMensal(unidadeId) {
    return query('vw_financeiro_mensal', 'select', { eq: { field: 'unidade_id', value: unidadeId } });
  },

  async getTopClientes(unidadeId) {
    return query('vw_top_clientes', 'select', { eq: { field: 'unidade_id', value: unidadeId } });
  },

  async getBIIndicadores(unidadeId) {
    return query('vw_bi_indicadores', 'select', { eq: { field: 'unidade_id', value: unidadeId } });
  },

  /* ═══════════════════════════════════════════════════════
     CONFIGURAÇÕES
     ═══════════════════════════════════════════════════════ */

  unidades() { return withUnit('unidades', null); },

  async listarUnidades() {
    return query('unidades', 'select', { order: { field: 'nome', ascending: true } });
  },

  usuarios() { return withUnit('usuarios', null); },

  /* ═══════════════════════════════════════════════════════
     AUDITORIA
     ═══════════════════════════════════════════════════════ */

  async registrarAuditoria(unidadeId, acao, entidade, entidadeId, detalhes) {
    return query('auditoria', 'insert', {
      data: { unidade_id: unidadeId, acao, entidade, entidade_id: entidadeId, detalhes },
    });
  },

  async listarAuditoria(unidadeId, limite = 20) {
    return query('auditoria', 'select', {
      eq: { field: 'unidade_id', value: unidadeId },
      order: { field: 'created_at', ascending: false },
      limit: limite,
    });
  },
};

// Auto-init
SupabaseService.init();

export default SupabaseService;
