/**
 * Fusion ERP - Gerenciamento de Estado Global (Store)
 * @author Cristian Marques
 * 
 * Sistema de estado reativo inspirado em Vuex/Pinia
 * com suporte a módulos, mutations, actions e computed properties
 */

class FusionStore {
  constructor() {
    this._state = {};
    this._modules = {};
    this._listeners = new Map();
    this._computedCache = new Map();
    this._batchUpdates = false;
    this._batchQueue = [];
    this._initialized = false;
  }

  /**
   * Inicializa a store com módulos
   */
  init(modules = {}) {
    this._modules = modules;
    
    // Inicializa estado de cada módulo
    for (const [name, module] of Object.entries(modules)) {
      if (!this._state[name]) {
        this._state[name] = {};
      }
      
      // Merge do estado inicial
      if (module.state) {
        this._state[name] = {
          ...this._state[name],
          ...(typeof module.state === 'function' ? module.state() : module.state)
        };
      }
    }

    // Carrega estado persistido
    this._hydrate();
    this._initialized = true;
    
    // Se tiver módulo de UI com tema, aplica
    const theme = this.getState('ui.theme') || APP_CONFIG?.theme?.default || 'dark';
    document.documentElement.setAttribute('data-theme', theme);

    return this;
  }

  /**
   * Registra um módulo dinamicamente
   */
  registerModule(name, module) {
    this._modules[name] = module;
    if (module.state) {
      this._state[name] = {
        ...this._state[name],
        ...(typeof module.state === 'function' ? module.state() : module.state)
      };
    }
    this._notifyListeners(name, this._state[name]);
  }

  /**
   * Obtém estado por caminho (ex: "ui.theme")
   */
  getState(path) {
    if (!path) return this._state;
    
    const parts = path.split('.');
    let current = this._state;
    
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    
    return current;
  }

  /**
   * Define estado via mutation
   */
  commit(mutation, payload) {
    const [moduleName, mutationName] = mutation.split('/');
    const module = this._modules[moduleName];
    
    if (module?.mutations?.[mutationName]) {
      const oldState = { ...this._state[moduleName] };
      module.mutations[mutationName](this._state[moduleName], payload);
      this._persist(moduleName);
      
      if (this._batchUpdates) {
        this._batchQueue.push({ moduleName, oldState });
      } else {
        this._notifyListeners(moduleName, this._state[moduleName], oldState);
      }
    } else {
      // Mutação direta: moduleName.action
      if (this._state[moduleName] !== undefined && mutationName) {
        const oldState = { ...this._state[moduleName] };
        this._state[moduleName][mutationName] = payload;
        this._persist(moduleName);
        this._notifyListeners(moduleName, this._state[moduleName], oldState);
      }
    }
  }

  /**
   * Dispara uma action (assíncrona ou síncrona)
   */
  async dispatch(action, payload) {
    const [moduleName, actionName] = action.split('/');
    const module = this._modules[moduleName];
    
    if (module?.actions?.[actionName]) {
      const context = {
        state: this._state[moduleName],
        getState: (path) => this.getState(path),
        commit: (mut, data) => this.commit(`${moduleName}/${mut}`, data),
        dispatch: (act, data) => this.dispatch(act, data)
      };
      
      return await module.actions[actionName](context, payload);
    }
    
    return Promise.reject(new Error(`Action ${action} not found`));
  }

  /**
   * Computed property (reativa)
   */
  computed(fn, deps = []) {
    const key = fn.toString();
    if (this._computedCache.has(key)) {
      return this._computedCache.get(key);
    }

    const computed = {
      value: fn(this._state),
      update: () => {
        const newValue = fn(this._state);
        if (newValue !== computed.value) {
          computed.value = newValue;
          this._notifyComputed(key, newValue);
        }
      }
    };

    this._computedCache.set(key, computed);
    
    // Recalcula quando dependências mudam
    deps.forEach(dep => {
      this.subscribe(dep, () => computed.update());
    });

    return computed;
  }

  /**
   * Inscreve para mudanças em um módulo
   */
  subscribe(moduleName, callback) {
    if (!this._listeners.has(moduleName)) {
      this._listeners.set(moduleName, new Set());
    }
    this._listeners.get(moduleName).add(callback);
    
    // Retorna unsubscribe
    return () => {
      this._listeners.get(moduleName)?.delete(callback);
    };
  }

  /**
   * Inicia batch de atualizações
   */
  startBatch() {
    this._batchUpdates = true;
    this._batchQueue = [];
  }

  /**
   * Finaliza batch e notifica listeners
   */
  endBatch() {
    this._batchUpdates = false;
    
    // Dedup notificações por módulo
    const deduped = new Map();
    this._batchQueue.forEach(({ moduleName, oldState }) => {
      if (!deduped.has(moduleName)) {
        deduped.set(moduleName, oldState);
      }
    });
    
    deduped.forEach((oldState, moduleName) => {
      this._notifyListeners(moduleName, this._state[moduleName], oldState);
    });
    
    this._batchQueue = [];
  }

  /**
   * Notifica listeners de um módulo
   */
  _notifyListeners(moduleName, newState, oldState) {
    this._listeners.get(moduleName)?.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (e) {
        console.error('Store listener error:', e);
      }
    });
  }

  /**
   * Notifica computed listeners
   */
  _notifyComputed(key, value) {
    // Computed notifications
  }

  /**
   * Persiste estado no storage
   */
  _persist(moduleName) {
    const module = this._modules[moduleName];
    if (module?.persist !== false) {
      StorageService.set(`store_${moduleName}`, this._state[moduleName]);
    }
  }

  /**
   * Hidrata estado do storage
   */
  _hydrate() {
    for (const [name, module] of Object.entries(this._modules)) {
      if (module.persist !== false) {
        const saved = StorageService.get(`store_${name}`);
        if (saved) {
          this._state[name] = { ...this._state[name], ...saved };
        }
      }
    }
  }

  /**
   * Reseta estado de um módulo
   */
  resetModule(moduleName) {
    const module = this._modules[moduleName];
    if (module?.state) {
      this._state[moduleName] = typeof module.state === 'function' ? module.state() : { ...module.state };
      this._persist(moduleName);
      this._notifyListeners(moduleName, this._state[moduleName]);
    }
  }

  /**
   * Reseta toda a store
   */
  resetAll() {
    for (const name of Object.keys(this._modules)) {
      this.resetModule(name);
    }
  }

  /**
   * Retorna snapshot do estado
   */
  snapshot() {
    return JSON.parse(JSON.stringify(this._state));
  }
}

// Store Singleton
const Fusion = new FusionStore();

// Módulos padrão da store
Fusion.init({
  ui: {
    state: () => ({
      theme: localStorage.getItem(APP_CONFIG?.theme?.storageKey || 'fusion_theme') || 'dark',
      sidebarOpen: true,
      sidebarCollapsed: false,
      modalOpen: false,
      modalComponent: null,
      modalProps: {},
      loading: false,
      loadingMessage: '',
      searchTerm: '',
      notifications: [],
      pageTitle: 'Dashboard',
      breadcrumbs: []
    }),
    mutations: {
      setTheme(state, theme) {
        state.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(APP_CONFIG?.theme?.storageKey || 'fusion_theme', theme);
      },
      toggleSidebar(state) {
        state.sidebarOpen = !state.sidebarOpen;
      },
      setSidebarCollapsed(state, collapsed) {
        state.sidebarCollapsed = collapsed;
      },
      openModal(state, { component, props = {} }) {
        state.modalOpen = true;
        state.modalComponent = component;
        state.modalProps = props;
      },
      closeModal(state) {
        state.modalOpen = false;
        state.modalComponent = null;
        state.modalProps = {};
      },
      setLoading(state, { loading, message = '' }) {
        state.loading = loading;
        state.loadingMessage = message;
      },
      addNotification(state, notification) {
        state.notifications.push({
          id: Helpers.generateId(),
          timestamp: new Date().toISOString(),
          ...notification
        });
      },
      removeNotification(state, id) {
        state.notifications = state.notifications.filter(n => n.id !== id);
      },
      setSearchTerm(state, term) {
        state.searchTerm = term;
      },
      setPageTitle(state, title) {
        state.pageTitle = title;
      },
      setBreadcrumbs(state, crumbs) {
        state.breadcrumbs = crumbs;
      }
    },
    actions: {
      async showNotification({ commit }, { type, message, duration = 5000 }) {
        const id = Helpers.generateId();
        commit('addNotification', { id, type, message, duration });
        
        if (duration > 0) {
          setTimeout(() => {
            commit('removeNotification', id);
          }, duration);
        }
        return id;
      }
    }
  },
  
  auth: {
    state: () => ({
      user: null,
      isAuthenticated: false,
      permissions: [],
      loginAttempts: 0,
      lastLogin: null
    }),
    mutations: {
      setUser(state, user) {
        state.user = user;
        state.isAuthenticated = !!user;
        state.lastLogin = user ? new Date().toISOString() : null;
      },
      setPermissions(state, permissions) {
        state.permissions = permissions;
      },
      incrementLoginAttempts(state) {
        state.loginAttempts++;
      },
      resetLoginAttempts(state) {
        state.loginAttempts = 0;
      },
      logout(state) {
        state.user = null;
        state.isAuthenticated = false;
        state.permissions = [];
      }
    },
    actions: {
      async login({ commit, state }, { email, password }) {
        // Tenta login via Supabase primeiro
        if (typeof SupabaseService !== 'undefined' && SupabaseService.isReady()) {
          var result = await SupabaseService.signIn(email, password);
          if (result.success) {
            commit('setUser', result.user);
            commit('setPermissions', ['*']);
            commit('resetLoginAttempts');
            StorageService.set('session', result.user);

            // Carrega dados da store do Supabase
            if (APP_CONFIG?.supabase?.autoLoadStore) {
              SupabaseService.loadAllToStore();
            }
            return { success: true, user: result.user };
          }
          // Fallback: se Supabase falhou (offline), tenta local
        }

        // Fallback local (modo demonstrativo)
        var allowedUsers = [
          { email: 'admin@fusion.com', password: 'admin123', name: 'Cristian Marques', role: 'admin' },
          { email: 'ana@fusion.com', password: 'ana123', name: 'Ana Souza', role: 'recepcionista' }
        ];
        let matched = null;
        for (let i = 0; i < allowedUsers.length; i++) {
          if (allowedUsers[i].email === email && allowedUsers[i].password === password) {
            matched = allowedUsers[i];
            break;
          }
        }
        if (matched) {
          const user = {
            id: String(matched.email.charCodeAt(0)),
            name: matched.name,
            email: matched.email,
            role: matched.role,
            avatar: null,
            company: 'Fusion Estética',
            companyId: '1'
          };
          commit('setUser', user);
          commit('setPermissions', ['*']);
          commit('resetLoginAttempts');
          StorageService.set('session', user);
          return { success: true, user };
        }
        
        commit('incrementLoginAttempts');
        if (state.loginAttempts >= 5) {
          return { success: false, error: 'Conta temporariamente bloqueada. Tente novamente mais tarde.' };
        }
        return { success: false, error: 'Email ou senha inválidos.' };
      },
      
      async logout({ commit }) {
        if (typeof SupabaseService !== 'undefined') {
          await SupabaseService.signOut();
        }
        commit('logout');
        StorageService.remove('session');
        window.location.href = '/login.html';
      },
      
      async checkSession({ commit }) {
        const session = StorageService.get('session');
        if (session) {
          commit('setUser', session);
          return true;
        }
        return false;
      },

      /**
       * Sincroniza store com Supabase
       */
      async syncWithSupabase({ commit }) {
        if (typeof SupabaseService === 'undefined' || !SupabaseService.isReady()) {
          return { success: false, error: 'Supabase não conectado' };
        }
        try {
          await SupabaseService.loadAllToStore();
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    },
    persist: true
  },
  
  dashboard: {
    state: () => ({
      metrics: {
        revenue: { value: 0, trend: 0, label: 'Faturamento Hoje' },
        appointments: { value: 0, trend: 0, label: 'Agendamentos Hoje' },
        clients: { value: 0, trend: 0, label: 'Clientes Ativos' },
        occupancy: { value: 0, trend: 0, label: 'Ocupação' }
      },
      appointmentsToday: [],
      revenueChart: [],
      servicesChart: [],
      professionalsChart: [],
      loading: false,
      period: 'today'
    }),
    mutations: {
      setMetrics(state, metrics) {
        Object.assign(state.metrics, metrics);
      },
      setAppointmentsToday(state, appointments) {
        state.appointmentsToday = appointments;
      },
      setRevenueChart(state, data) {
        state.revenueChart = data;
      },
      setServicesChart(state, data) {
        state.servicesChart = data;
      },
      setProfessionalsChart(state, data) {
        state.professionalsChart = data;
      },
      setLoading(state, loading) {
        state.loading = loading;
      },
      setPeriod(state, period) {
        state.period = period;
      }
    },
    actions: {
      async loadDashboard({ commit, getState }, period = 'today') {
        commit('setLoading', true);
        commit('setPeriod', period);

        // Tenta carregar dados reais do Supabase
        // Só tenta RPC se o heartbeat confirmou que o banco está respondendo
        var dbStatus = (typeof SupabaseService !== 'undefined' && typeof SupabaseService.getStatus === 'function')
          ? SupabaseService.getStatus()
          : 'offline';
        var podeTentarRPC = typeof SupabaseService !== 'undefined'
          && SupabaseService.isReady()
          && dbStatus !== 'disconnected'
          && dbStatus !== 'offline';

        if (podeTentarRPC) {
          try {
            // Pega unidadeId do usuário logado ou usa fallback
            var state = getState();
            var unidadeId = (state.auth?.user?.companyId === '1' && APP_CONFIG?.api?.demoUnidadeId)
              ? APP_CONFIG.api.demoUnidadeId
              : null;

            if (!unidadeId && state.auth?.user?.companyId) {
              unidadeId = state.auth.user.companyId;
            }

            var result = await SupabaseService.getDashboardData(unidadeId);

            if (result.data && !result.error) {
              var dashData = typeof result.data === 'string'
                ? JSON.parse(result.data)
                : result.data;

              // Mapeia os dados do JSONB para a store
              if (dashData.metricas) {
                commit('setMetrics', {
                  revenue: { value: dashData.metricas.faturamento_hoje || 0, trend: 0, label: 'Faturamento Hoje' },
                  appointments: { value: dashData.metricas.agendamentos_hoje || 0, trend: 0, label: 'Agendamentos Hoje' },
                  clients: { value: dashData.metricas.clientes_ativas || 0, trend: 0, label: 'Clientes Ativas' },
                  occupancy: { value: dashData.metricas.taxa_ocupacao || 0, trend: 0, label: 'Ocupação' }
                });
              }

              if (dashData.agendamentos_hoje_lista) {
                // Mapeia campos do RPC (hora, cliente, servico, profissional, valor)
                // para os nomes esperados pela store (time, client, service, professional, value)
                var mappedAppts = dashData.agendamentos_hoje_lista.map(function(a) {
                  return {
                    time: a.hora,
                    client: a.cliente,
                    service: a.servico,
                    professional: a.profissional,
                    status: a.status,
                    value: a.valor
                  };
                });
                commit('setAppointmentsToday', mappedAppts);
              }

              commit('setLoading', false);
              return;
            }
          } catch (e) {
            console.warn('[Store] Dashboard RPC falhou, usando fallback:', e.message);
          }
        }

        // Fallback: dados mockados (modo demonstrativo)
        setTimeout(function() {
          commit('setMetrics', {
            revenue: { value: 12580, trend: 12.5, label: 'Faturamento Hoje' },
            appointments: { value: 18, trend: -3.2, label: 'Agendamentos Hoje' },
            clients: { value: 234, trend: 8.1, label: 'Clientes Ativos' },
            occupancy: { value: 78, trend: 5.4, label: 'Ocupação' }
          });

          commit('setAppointmentsToday', [
            { time: '08:00', client: 'Ana Silva', service: 'Limpeza de Pele', professional: 'Dra. Marina', status: 'confirmado', value: 150 },
            { time: '09:00', client: 'Carla Santos', service: 'Massagem Relaxante', professional: 'Carlos', status: 'confirmado', value: 200 },
            { time: '10:00', client: 'Juliana Costa', service: 'Depilação', professional: 'Dra. Marina', status: 'em_atendimento', value: 120 },
            { time: '11:00', client: 'Patrícia Lima', service: 'Consultoria', professional: 'Dr. Roberto', status: 'pendente', value: 180 },
            { time: '14:00', client: 'Fernanda Rocha', service: 'Laser Facial', professional: 'Dra. Marina', status: 'confirmado', value: 350 },
            { time: '15:00', client: 'Amanda Oliveira', service: 'Maquiagem Social', professional: 'Julia', status: 'confirmado', value: 250 },
            { time: '16:00', client: 'Beatriz Martins', service: 'Peeling', professional: 'Dr. Roberto', status: 'pendente', value: 280 },
            { time: '17:00', client: 'Débora Almeida', service: 'Hidratação Capilar', professional: 'Carlos', status: 'confirmado', value: 160 }
          ]);

          commit('setRevenueChart', [
            { month: 'Jan', revenue: 28500, expenses: 18200 },
            { month: 'Fev', revenue: 32000, expenses: 19500 },
            { month: 'Mar', revenue: 29800, expenses: 17800 },
            { month: 'Abr', revenue: 35600, expenses: 21000 },
            { month: 'Mai', revenue: 41200, expenses: 22500 },
            { month: 'Jun', revenue: 38900, expenses: 19800 },
            { month: 'Jul', revenue: 0, expenses: 0 }
          ]);

          commit('setServicesChart', [
            { name: 'Limpeza de Pele', value: 25 },
            { name: 'Massagem', value: 20 },
            { name: 'Depilação', value: 18 },
            { name: 'Laser', value: 15 },
            { name: 'Maquiagem', value: 12 },
            { name: 'Outros', value: 10 }
          ]);

          commit('setProfessionalsChart', [
            { name: 'Dra. Marina', appointments: 45, revenue: 15750 },
            { name: 'Carlos', appointments: 32, revenue: 9600 },
            { name: 'Dr. Roberto', appointments: 28, revenue: 11200 },
            { name: 'Julia', appointments: 20, revenue: 6000 }
          ]);

          commit('setLoading', false);
        }, 500);
      }
    },
    persist: false
  }
});
