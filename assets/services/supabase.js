/**
 * Fusion ERP - Supabase Client Service
 * @author Cristian Marques
 * 
 * Serviço central de conexão com Supabase:
 * - Autenticação (login, logout, session)
 * - Operações de banco de dados (CRUD)
 * - Real-time subscriptions
 * - Fallback para localStorage quando offline
 */
(function() {
  'use strict';

  // Credenciais lidas do APP_CONFIG com fallback hardcoded
  var SUPABASE_URL = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.api && APP_CONFIG.api.supabaseUrl)
    ? APP_CONFIG.api.supabaseUrl
    : 'https://njbkbhqioieqfzfaczqs.supabase.com';
  var SUPABASE_ANON_KEY = (typeof APP_CONFIG !== 'undefined' && APP_CONFIG.api && APP_CONFIG.api.supabaseAnonKey)
    ? APP_CONFIG.api.supabaseAnonKey
    : 'sb_publishable_xwEa8eGaBM4JedwDj8uTRg_WxPRuYJk';

  var SupabaseService = {
    _client: null,
    _channels: [],
    _ready: false,
    _subscriptions: {},
    _status: 'offline',
    _checkInterval: null,

    /**
     * Inicializa o cliente Supabase
     */
    init: function() {
      try {
        if (typeof supabase === 'undefined' && typeof createClient !== 'function') {
          console.warn('[Supabase] SDK não carregado. Usando fallback localStorage.');
          this._ready = false;
          return false;
        }
        var create = supabase.createClient || createClient;
        this._client = create(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            storageKey: 'fusion_supabase_auth'
          },
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });
        this._ready = true;
        console.log('[Supabase] Cliente inicializado com sucesso');
        return true;
      } catch (e) {
        console.warn('[Supabase] Erro ao inicializar:', e.message);
        this._ready = false;
        return false;
      }
    },

    /**
     * Verifica se o cliente está pronto
     */
    isReady: function() {
      return this._ready && this._client !== null;
    },

    /**
     * Retorna o status atual da conexão
     */
    getStatus: function() {
      return this._status;
    },

    /**
     * Dispara um evento de mudança de status
     */
    _emitStatusChange: function(newStatus) {
      this._status = newStatus;
      if (typeof Helpers !== 'undefined' && Helpers.publish) {
        Helpers.publish('supabase:status', newStatus);
      }
      // Dispara evento DOM para outros listeners
      var event = new CustomEvent('supabase:status', { detail: { status: newStatus } });
      document.dispatchEvent(event);
    },

    /**
     * Verifica se a conexão com o Supabase está realmente ativa
     * Faz uma requisição HEAD leve para testar conectividade
     */
    checkConnection: async function() {
      if (!this._ready || !this._client) {
        this._emitStatusChange('offline');
        return 'offline';
      }

      try {
        this._emitStatusChange('checking');
        // Usa .select() com limit(1) e head:true para uma requisição mínima
        var result = await this._client
          .from('clientes')
          .select('id', { count: 'exact', head: true })
          .limit(1);

        if (result.error) {
          console.warn('[Supabase] Heartbeat falhou:', result.error.message);
          this._emitStatusChange('disconnected');
          return 'disconnected';
        }

        this._emitStatusChange('connected');
        return 'connected';
      } catch (e) {
        // Erro de rede / fetch
        console.warn('[Supabase] Heartbeat — erro de rede:', e.message);
        this._emitStatusChange('disconnected');
        return 'disconnected';
      }
    },

    /**
     * Inicia heartbeat periódico para monitorar conexão
     * @param {number} intervalMs - Intervalo entre checagens (padrão: 30s)
     */
    startHeartbeat: function(intervalMs) {
      this.stopHeartbeat();
      var self = this;
      intervalMs = intervalMs || 30000; // 30 segundos

      // Faz uma verificação imediata
      this.checkConnection();

      this._checkInterval = setInterval(function() {
        self.checkConnection();
      }, intervalMs);
    },

    /**
     * Para o heartbeat
     */
    stopHeartbeat: function() {
      if (this._checkInterval) {
        clearInterval(this._checkInterval);
        this._checkInterval = null;
      }
    },

    /**
     * Atualiza o indicador visual de conexão no DOM
     */
    updateStatusIndicator: function(status) {
      var indicator = document.getElementById('dbStatusIndicator');
      if (!indicator) return;

      // Remove todas as classes de status
      indicator.classList.remove('connected', 'disconnected', 'checking', 'offline');

      var dot = indicator.querySelector('.db-status-dot');
      var label = indicator.querySelector('.db-status-label');

      if (dot) dot.className = 'db-status-dot';

      switch (status) {
        case 'connected':
          indicator.classList.add('connected');
          if (dot) dot.classList.add('connected');
          if (label) label.textContent = 'Banco conectado';
          indicator.title = 'Banco de dados conectado';
          break;
        case 'checking':
          indicator.classList.add('checking');
          if (dot) dot.classList.add('checking');
          if (label) label.textContent = 'Verificando…';
          indicator.title = 'Verificando conexão…';
          break;
        case 'disconnected':
          indicator.classList.add('disconnected');
          if (dot) dot.classList.add('disconnected');
          if (label) label.textContent = 'Banco desconectado';
          indicator.title = 'Banco de dados desconectado. Verifique sua conexão.';
          break;
        default: // offline
          indicator.classList.add('offline');
          if (dot) dot.classList.add('offline');
          if (label) label.textContent = 'Modo offline';
          indicator.title = 'Modo offline — dados locais';
          break;
      }
    },

    // =====================================================================
    // AUTH
    // =====================================================================

    /**
     * Login com email e senha
     */
    signIn: async function(email, password) {
      // Tenta Supabase primeiro se o cliente estiver pronto
      if (this.isReady()) {
        try {
          var result = await this._client.auth.signInWithPassword({
            email: email,
            password: password
          });
          if (!result.error) {
            var session = result.data.session;
            var user = result.data.user;
            return {
              success: true,
              user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
                role: user.user_metadata?.role || 'recepcionista',
                avatar: user.user_metadata?.avatar_url || null,
                company: user.user_metadata?.company || 'Fusion Estética',
                companyId: user.user_metadata?.company_id || '1'
              },
              session: session
            };
          }
          // Se Supabase retornou erro (ex.: credenciais inválidas), tenta fallback local
          console.warn('[Supabase] SignIn falhou, tentando fallback local:', result.error.message);
        } catch (e) {
          console.warn('[Supabase] SignIn com erro de rede, tentando fallback local:', e.message);
        }
      }

      // Fallback local (modo demonstrativo)
      return this._fallbackSignIn(email, password);
    },

    /**
     * Login de fallback (modo demonstrativo)
     */
    _fallbackSignIn: function(email, password) {
      var allowed = [
        { email: 'admin@fusion.com', password: 'admin123', name: 'Cristian Marques', role: 'admin' },
        { email: 'ana@fusion.com', password: 'ana123', name: 'Ana Souza', role: 'recepcionista' }
      ];
      for (var i = 0; i < allowed.length; i++) {
        if (allowed[i].email === email && allowed[i].password === password) {
          return {
            success: true,
            user: {
              id: String(email.charCodeAt(0)),
              email: email,
              name: allowed[i].name,
              role: allowed[i].role,
              avatar: null,
              company: 'Fusion Estética',
              companyId: '1'
            }
          };
        }
      }
      return { success: false, error: 'Email ou senha inválidos.' };
    },

    /**
     * Logout
     */
    signOut: async function() {
      if (this.isReady()) {
        try {
          await this._client.auth.signOut();
        } catch (e) {
          console.warn('[Supabase] Erro ao fazer logout:', e.message);
        }
      }
      // Limpa canais real-time
      this._channels.forEach(function(ch) {
        try { ch.unsubscribe(); } catch(e) {}
      });
      this._channels = [];
      return true;
    },

    /**
     * Recupera sessão atual
     */
    getSession: async function() {
      if (!this.isReady()) return null;
      try {
        var result = await this._client.auth.getSession();
        return result.data?.session || null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Escuta mudanças de auth
     */
    onAuthChange: function(callback) {
      if (!this.isReady()) return function() {};
      var subscription = this._client.auth.onAuthStateChange(function(event, session) {
        callback(event, session);
      });
      return subscription.data?.unsubscribe || function() {};
    },

    // =====================================================================
    // DATABASE (CRUD)
    // =====================================================================

    /**
     * Busca registros de uma tabela
     */
    from: function(table) {
      if (!this.isReady()) {
        console.warn('[Supabase] Cliente não pronto para consultas.');
        return null;
      }
      return this._client.from(table);
    },

    /**
     * Busca dados com query
     */
    select: async function(table, columns, options) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      try {
        var query = this._client.from(table).select(columns || '*');
        if (options?.eq) query = query.eq(options.eq.field, options.eq.value);
        if (options?.order) query = query.order(options.order.field, { ascending: options.order.ascending !== false });
        if (options?.limit) query = query.limit(options.limit);
        if (options?.range) query = query.range(options.range.from, options.range.to);
        return await query;
      } catch (e) {
        return { data: null, error: e };
      }
    },

    /**
     * Insere registro
     */
    insert: async function(table, data) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      try {
        return await this._client.from(table).insert(data).select();
      } catch (e) {
        return { data: null, error: e };
      }
    },

    /**
     * Atualiza registro
     */
    update: async function(table, match, data) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      try {
        var query = this._client.from(table).update(data);
        for (var key in match) {
          query = query.eq(key, match[key]);
        }
        return await query.select();
      } catch (e) {
        return { data: null, error: e };
      }
    },

    /**
     * Remove registro
     */
    remove: async function(table, match) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      try {
        var query = this._client.from(table).delete();
        for (var key in match) {
          query = query.eq(key, match[key]);
        }
        return await query;
      } catch (e) {
        return { data: null, error: e };
      }
    },

    // =====================================================================
    // REAL-TIME SUBSCRIPTIONS
    // =====================================================================

    /**
     * Inscreve em mudanças de uma tabela
     * @param {string} table - Nome da tabela
     * @param {string} event - 'INSERT' | 'UPDATE' | 'DELETE' | '*'
     * @param {Function} callback - fn(payload)
     * @returns {Function} unsubscribe
     */
    subscribeToTable: function(table, event, callback) {
      if (!this.isReady()) return function() {};

      var channelName = 'fusion-' + table + '-' + Date.now();
      var channel = this._client.channel(channelName);

      channel.on(
        'postgres_changes',
        { event: event || '*', schema: 'public', table: table },
        function(payload) {
          if (typeof callback === 'function') {
            callback(payload);
          }
        }
      );

      channel.subscribe();
      this._channels.push(channel);

      var self = this;
      return function() {
        channel.unsubscribe();
        self._channels = self._channels.filter(function(ch) { return ch !== channel; });
      };
    },

    // =====================================================================
    // RPC (FUNCTIONS SQL)
    // =====================================================================

    /**
     * Invoca uma função SQL no Supabase via RPC
     * @param {string} name - Nome da função
     * @param {object} params - Parâmetros da função
     * @returns {Promise<{data, error}>}
     */
    rpc: async function(name, params) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      try {
        var result = await this._client.rpc(name, params || {});
        return result;
      } catch (e) {
        console.warn('[Supabase] RPC ' + name + ' falhou:', e.message);
        return { data: null, error: e };
      }
    },

    /**
     * Busca dados completos do dashboard (KPIs, agendamentos, fila, estoque crítico)
     * @param {string} unidadeId - UUID da unidade
     * @returns {Promise<{data: object, error}>}
     */
    getDashboardData: async function(unidadeId) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };

      // Se o heartbeat já detectou que o banco está desconectado, não tenta RPC
      if (this._status === 'disconnected' || this._status === 'offline') {
        return { data: null, error: new Error('Supabase desconectado — usando dados locais') };
      }

      // Se não tiver unidadeId, tenta da store ou usa fallback mock
      if (!unidadeId && typeof Fusion !== 'undefined' && Fusion._modules) {
        var session = Fusion._state.auth?.user?.companyId || '1';
        if (APP_CONFIG?.api?.demoUnidadeId) {
          unidadeId = APP_CONFIG.api.demoUnidadeId;
        }
      }

      if (!unidadeId) {
        return { data: null, error: new Error('Unidade não especificada') };
      }

      return await this.rpc('get_dashboard_data', { p_unidade_id: unidadeId });
    },

    /**
     * Busca textual de clientes com relevância
     * @param {string} termo - Termo de busca
     * @param {string} unidadeId - UUID da unidade (opcional)
     * @param {number} limite - Máx. resultados (padrão: 20)
     * @returns {Promise<{data: Array, error}>}
     */
    buscarClientes: async function(termo, unidadeId, limite) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      if (!termo || termo.length < 2) return { data: [], error: null };

      return await this.rpc('buscar_clientes', {
        p_termo: termo,
        p_unidade_id: unidadeId || null,
        p_limite: limite || 20
      });
    },

    /**
     * Cria um agendamento com sessão na fila (operação atômica)
     * @returns {Promise<{data: uuid, error}>}
     */
    criarAgendamento: async function(params) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      return await this.rpc('criar_agendamento', {
        p_unidade_id: params.unidadeId,
        p_cliente_id: params.clienteId,
        p_profissional_id: params.profissionalId || null,
        p_servico_id: params.servicoId || null,
        p_sala_id: params.salaId || null,
        p_data: params.data,
        p_hora: params.hora,
        p_duracao_min: params.duracaoMin || 60,
        p_valor: params.valor || 0,
        p_observacoes: params.observacoes || null,
        p_origem: params.origem || 'interno',
        p_created_by: params.createdBy || null
      });
    },

    /**
     * Finaliza uma sessão de atendimento (cria transação, acumula fidelidade)
     * @returns {Promise<{data, error}>}
     */
    finalizarSessao: async function(sessaoId, valorReal) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      return await this.rpc('finalizar_sessao', {
        p_sessao_id: sessaoId,
        p_valor_real: valorReal || null
      });
    },

    /**
     * Registra entrada no estoque e atualiza quantidade
     * @returns {Promise<{data: uuid, error}>}
     */
    registrarEntradaEstoque: async function(params) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      return await this.rpc('registrar_entrada_estoque', {
        p_unidade_id: params.unidadeId,
        p_item_id: params.itemId,
        p_quantidade: params.quantidade,
        p_valor_unitario: params.valorUnitario,
        p_fornecedor: params.fornecedor || null,
        p_nota_fiscal: params.notaFiscal || null,
        p_data_entrada: params.dataEntrada || new Date().toISOString().split('T')[0],
        p_created_by: params.createdBy || null
      });
    },

    /**
     * Atualiza o status de uma sala baseado na sessão atual
     */
    atualizarStatusSala: async function(salaId) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      return await this.rpc('atualizar_status_sala', { p_sala_id: salaId });
    },

    /**
     * Atualiza o nível de fidelidade de um cliente
     */
    atualizarNivelFidelidade: async function(clienteId) {
      if (!this.isReady()) return { data: null, error: new Error('Supabase não conectado') };
      return await this.rpc('atualizar_nivel_fidelidade', { p_cliente_id: clienteId });
    },

    // =====================================================================
    // STORE SYNC
    // =====================================================================

    /**
     * Carrega dados iniciais de todas as tabelas para a store
     */
    loadAllToStore: async function() {
      if (!this.isReady() || typeof Fusion === 'undefined') return;

      // Tabelas para carregar e mapear para módulos da store
      var tables = [
        { table: 'clientes', module: 'clientes', key: 'list' },
        { table: 'agendamentos', module: 'agenda', key: 'appointments' },
        { table: 'transacoes', module: 'financeiro', key: 'transacoes' },
        { table: 'estoque_items', module: 'estoque', key: 'items' },
        { table: 'estoque_entradas', module: 'estoque', key: 'entries' },
        { table: 'salas', module: 'salas', key: 'list' },
        { table: 'sessoes_fila', module: 'filaAtendimento', key: 'sessions' },
        { table: 'lista_espera', module: 'listaEspera', key: 'list' },
        { table: 'pacotes', module: 'pacotes', key: 'list' },
        { table: 'planos', module: 'planosRecorrentes', key: 'planos' }
      ];

      for (var i = 0; i < tables.length; i++) {
        var t = tables[i];
        try {
          var result = await this.select(t.table);
          if (result.data && result.data.length > 0 && Fusion._modules[t.module]) {
            // Usa a chave de estado correta (list, sessions, etc.)
            var modState = Fusion._state[t.module];
            if (modState && t.key && modState.hasOwnProperty(t.key)) {
              modState[t.key] = result.data;
              Fusion._persist(t.module);
            }
          }
        } catch (e) {
          // Silencia erros — dados locais são mantidos
        }
      }
    }
  };

  // Expõe globalmente
  window.SupabaseService = SupabaseService;

  // =====================================================================
  // OFFLINE INTEGRATION
  // =====================================================================

  /**
   * Integra com OfflineManager para fila de sincronizacao
   */
  SupabaseService._initOfflineIntegration = function() {
    if (typeof OfflineManager === 'undefined') return;

    // Adiciona mutacoes aa fila offline quando sem conexao
    var originalInsert = SupabaseService.insert;
    SupabaseService.insert = async function(table, data) {
      if (this.isReady()) {
        try {
          return await originalInsert.call(this, table, data);
        } catch (e) {
          // Se erro de rede, enfileira
          if (e.message && (e.message.indexOf('fetch') >= 0 || e.message.indexOf('network') >= 0 || e.message.indexOf('Failed to fetch') >= 0)) {
            return this._queueOffline(table, 'POST', data);
          }
          return { data: null, error: e };
        }
      }
      // Offline: enfileira direto
      return this._queueOffline(table, 'POST', data);
    };

    var originalUpdate = SupabaseService.update;
    SupabaseService.update = async function(table, match, data) {
      if (this.isReady()) {
        try {
          return await originalUpdate.call(this, table, match, data);
        } catch (e) {
          if (e.message && (e.message.indexOf('fetch') >= 0 || e.message.indexOf('network') >= 0 || e.message.indexOf('Failed to fetch') >= 0)) {
            return this._queueOffline(table, 'PUT', { match: match, data: data });
          }
          return { data: null, error: e };
        }
      }
      return this._queueOffline(table, 'PUT', { match: match, data: data });
    };

    var originalRemove = SupabaseService.remove;
    SupabaseService.remove = async function(table, match) {
      if (this.isReady()) {
        try {
          return await originalRemove.call(this, table, match);
        } catch (e) {
          if (e.message && (e.message.indexOf('fetch') >= 0 || e.message.indexOf('network') >= 0 || e.message.indexOf('Failed to fetch') >= 0)) {
            return this._queueOffline(table, 'DELETE', match);
          }
          return { data: null, error: e };
        }
      }
      return this._queueOffline(table, 'DELETE', match);
    };

    // Escuta eventos de conectividade para atualizar estado
    OfflineManager.on('online', function() {
      SupabaseService._ready = true;
      // Tenta recarregar dados da store
      if (typeof Fusion !== 'undefined') {
        SupabaseService.loadAllToStore();
      }
    });

    OfflineManager.on('offline', function() {
      // Marca como offline, mas mantem client carregado
    });
  };

  /**
   * Enfileira operacao para sincronizacao offline
   */
  SupabaseService._queueOffline = function(table, method, data) {
    if (typeof OfflineManager !== 'undefined' && OfflineManager.isOnline && !OfflineManager.isOnline()) {
      var url = SUPABASE_URL + '/rest/v1/' + table;
      OfflineManager.addMutation(url, method, {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }, JSON.stringify(data));
    }
    return {
      data: null,
      error: null,
      offlineQueued: true,
      message: 'Operacao enfileirada para sincronizacao offline.'
    };
  };

  // Inicia integracao offline apos inicializacao
  SupabaseService._initOfflineIntegration();

  // Tenta inicializar automaticamente
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    SupabaseService.init();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      SupabaseService.init();
    });
  }

})();
