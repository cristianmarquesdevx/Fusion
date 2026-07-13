import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// FusionStore class and Fusion singleton are loaded as globals via setup.js

describe('FusionStore', () => {
  let store;

  beforeEach(() => {
    // Fresh store instance for each test
    store = new FusionStore();
  });

  // ---- Constructor ----
  describe('constructor', () => {
    it('deve inicializar com estado vazio', () => {
      expect(store._state).toEqual({});
      expect(store._modules).toEqual({});
      expect(store._listeners).toBeInstanceOf(Map);
      expect(store._computedCache).toBeInstanceOf(Map);
      expect(store._batchUpdates).toBe(false);
      expect(store._initialized).toBe(false);
    });
  });

  // ---- init ----
  describe('init', () => {
    it('deve inicializar com módulos', () => {
      store.init({
        test: {
          state: { count: 0 },
          mutations: {
            increment: (state) => { state.count++; }
          },
          persist: false
        }
      });
      expect(store._modules.test).toBeDefined();
      expect(store._state.test.count).toBe(0);
      expect(store._initialized).toBe(true);
    });

    it('deve aceitar state como função', () => {
      store.init({
        test: {
          state: () => ({ count: 42 }),
          persist: false
        }
      });
      expect(store._state.test.count).toBe(42);
    });

    it('deve retornar a própria store', () => {
      const result = store.init({});
      expect(result).toBe(store);
    });
  });

  // ---- registerModule ----
  describe('registerModule', () => {
    it('deve registrar módulo dinamicamente', () => {
      store.registerModule('dynamic', {
        state: { value: 1 },
        mutations: {
          set: (state, v) => { state.value = v; }
        },
        persist: false
      });
      expect(store._modules.dynamic).toBeDefined();
      expect(store.getState('dynamic.value')).toBe(1);
    });

    it('deve notificar listeners ao registrar', () => {
      const listener = vi.fn();
      store.subscribe('dynamic', listener);
      store.registerModule('dynamic', { state: { x: 1 }, persist: false });
      expect(listener).toHaveBeenCalled();
    });
  });

  // ---- getState ----
  describe('getState', () => {
    beforeEach(() => {
      store.init({
        auth: {
          state: { user: { name: 'Ana', role: 'admin' }, token: 'abc' },
          persist: false
        }
      });
    });

    it('deve retornar estado completo sem path', () => {
      expect(store.getState()).toBe(store._state);
    });

    it('deve retornar estado por path simples', () => {
      expect(store.getState('auth.token')).toBe('abc');
    });

    it('deve retornar estado por path aninhado', () => {
      expect(store.getState('auth.user.name')).toBe('Ana');
    });

    it('deve retornar undefined para path inexistente', () => {
      expect(store.getState('auth.inexistente')).toBeUndefined();
      expect(store.getState('modulo.inexistente')).toBeUndefined();
    });
  });

  // ---- commit ----
  describe('commit', () => {
    beforeEach(() => {
      store.init({
        counter: {
          state: { count: 0, items: [] },
          mutations: {
            increment: (state, by = 1) => { state.count += by; },
            addItem: (state, item) => { state.items.push(item); },
            setCount: (state, val) => { state.count = val; }
          },
          persist: false
        }
      });
    });

    it('deve executar mutation', () => {
      store.commit('counter/increment', 5);
      expect(store._state.counter.count).toBe(5);
    });

    it('deve permitir mutation direta', () => {
      store.commit('counter/count', 99);
      expect(store._state.counter.count).toBe(99);
    });

    it('deve notificar listeners', () => {
      const listener = vi.fn();
      store.subscribe('counter', listener);
      store.commit('counter/increment');
      expect(listener).toHaveBeenCalled();
      expect(listener.mock.calls[0][0].count).toBe(1);
    });

    it('não deve quebrar se mutation não existir', () => {
      expect(() => store.commit('counter/nonexistent')).not.toThrow();
    });

    it('não deve quebrar para módulo inexistente', () => {
      expect(() => store.commit('ghost/set', 1)).not.toThrow();
    });

    it('deve persistir estado quando persist não é false', () => {
      const spy = vi.spyOn(StorageService, 'set');
      store.init({
        persistModule: {
          state: { x: 1 },
          mutations: { set: (s, v) => { s.x = v; } }
          // persist: true (default)
        }
      });
      store.commit('persistModule/set', 2);
      expect(spy).toHaveBeenCalledWith('store_persistModule', { x: 2 });
      spy.mockRestore();
    });

    it('não deve persistir quando persist é false', () => {
      const spy = vi.spyOn(StorageService, 'set');
      store.commit('counter/increment', 1);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ---- subscribe / unsubscribe ----
  describe('subscribe', () => {
    it('deve notificar quando estado mudar', () => {
      store.init({ mod: { state: { x: 0 }, mutations: { set: (s, v) => { s.x = v; } }, persist: false } });
      const listener = vi.fn();
      store.subscribe('mod', listener);
      store.commit('mod/set', 5);
      expect(listener).toHaveBeenCalledWith({ x: 5 }, { x: 0 });
    });

    it('deve parar de notificar após unsubscribe', () => {
      store.init({ mod: { state: { x: 0 }, mutations: { set: (s, v) => { s.x = v; } }, persist: false } });
      const listener = vi.fn();
      const unsubscribe = store.subscribe('mod', listener);
      unsubscribe();
      store.commit('mod/set', 5);
      expect(listener).not.toHaveBeenCalled();
    });

    it('deve suportar múltiplos listeners', () => {
      store.init({ mod: { state: { x: 0 }, mutations: { set: (s, v) => { s.x = v; } }, persist: false } });
      const l1 = vi.fn();
      const l2 = vi.fn();
      store.subscribe('mod', l1);
      store.subscribe('mod', l2);
      store.commit('mod/set', 1);
      expect(l1).toHaveBeenCalled();
      expect(l2).toHaveBeenCalled();
    });
  });

  // ---- dispatch ----
  describe('dispatch', () => {
    beforeEach(() => {
      store.init({
        auth: {
          state: { user: null, isAuthenticated: false, loginAttempts: 0 },
          mutations: {
            setUser: (state, user) => { state.user = user; state.isAuthenticated = !!user; },
            incrementLoginAttempts: (state) => { state.loginAttempts++; },
            resetLoginAttempts: (state) => { state.loginAttempts = 0; },
            setPermissions: () => {},
          },
          actions: {
            login: async ({ commit, state }, { email, password }) => {
              if (email === 'admin@test.com' && password === '123') {
                commit('setUser', { name: 'Admin' });
                commit('resetLoginAttempts');
                return { success: true };
              }
              commit('incrementLoginAttempts');
              return { success: false };
            }
          },
          persist: false
        }
      });
    });

    it('deve executar action com sucesso', async () => {
      const result = await store.dispatch('auth/login', { email: 'admin@test.com', password: '123' });
      expect(result.success).toBe(true);
      expect(store._state.auth.user.name).toBe('Admin');
      expect(store._state.auth.isAuthenticated).toBe(true);
    });

    it('deve executar action com falha', async () => {
      const result = await store.dispatch('auth/login', { email: 'wrong@test.com', password: 'wrong' });
      expect(result.success).toBe(false);
      expect(store._state.auth.loginAttempts).toBe(1);
    });

    it('deve rejeitar para action inexistente', async () => {
      await expect(store.dispatch('auth/nonexistent')).rejects.toThrow('Action auth/nonexistent not found');
    });

    it('deve rejeitar para módulo inexistente', async () => {
      await expect(store.dispatch('ghost/action')).rejects.toThrow('Action ghost/action not found');
    });
  });

  // ---- computed ----
  describe('computed', () => {
    it('deve criar computed property', () => {
      store.init({ mod: { state: { a: 1, b: 2 }, persist: false } });
      const comp = store.computed(() => store._state.mod.a + store._state.mod.b, ['mod']);
      expect(comp.value).toBe(3);
    });

    it('deve cachear computações iguais', () => {
      store.init({ mod: { state: { x: 1 }, persist: false } });
      const fn = () => store._state.mod.x;
      const comp1 = store.computed(fn, ['mod']);
      const comp2 = store.computed(fn, ['mod']);
      expect(comp1).toBe(comp2);
    });
  });

  // ---- batch updates ----
  describe('batch updates', () => {
    it('deve notificar apenas uma vez no final do batch', () => {
      store.init({
        mod: {
          state: { a: 1, b: 2 },
          mutations: {
            setA: (s, v) => { s.a = v; },
            setB: (s, v) => { s.b = v; }
          },
          persist: false
        }
      });

      const listener = vi.fn();
      store.subscribe('mod', listener);

      store.startBatch();
      store.commit('mod/setA', 10);
      store.commit('mod/setB', 20);
      expect(listener).not.toHaveBeenCalled(); // não chamado durante o batch

      store.endBatch();
      expect(listener).toHaveBeenCalledTimes(1); // chamado apenas uma vez no final
      expect(store._state.mod.a).toBe(10);
      expect(store._state.mod.b).toBe(20);
    });

    it('não deve notificar se não houver mudanças no batch', () => {
      store.init({ mod: { state: { x: 1 }, persist: false } });
      const listener = vi.fn();
      store.subscribe('mod', listener);
      store.startBatch();
      store.endBatch();
      expect(listener).not.toHaveBeenCalled();
    });
  });

  // ---- resetModule ----
  describe('resetModule', () => {
    it('deve resetar estado de um módulo', () => {
      const initialState = { count: 0, items: [] };
      store.init({ mod: { state: { ...initialState }, mutations: { add: (s) => { s.count++; } }, persist: false } });
      store.commit('mod/add');
      store.commit('mod/add');
      expect(store._state.mod.count).toBe(2);

      store.resetModule('mod');
      expect(store._state.mod.count).toBe(0);
      expect(store._state.mod.items).toEqual([]);
    });

    it('não deve quebrar se módulo não existir', () => {
      expect(() => store.resetModule('ghost')).not.toThrow();
    });
  });

  // ---- resetAll ----
  describe('resetAll', () => {
    it('deve resetar todos os módulos', () => {
      store.init({
        a: { state: { x: 1 }, mutations: { inc: (s) => { s.x++; } }, persist: false },
        b: { state: { y: 2 }, mutations: { inc: (s) => { s.y++; } }, persist: false },
      });

      store.commit('a/inc');
      store.commit('b/inc');
      expect(store._state.a.x).toBe(2);
      expect(store._state.b.y).toBe(3);

      store.resetAll();
      expect(store._state.a.x).toBe(1);
      expect(store._state.b.y).toBe(2);
    });
  });

  // ---- snapshot ----
  describe('snapshot', () => {
    it('deve retornar snapshot imutável do estado', () => {
      store.init({ mod: { state: { items: [1, 2, 3] }, persist: false } });
      const snap = store.snapshot();
      expect(snap.mod.items).toEqual([1, 2, 3]);
      snap.mod.items.push(4);
      expect(store._state.mod.items).toEqual([1, 2, 3]); // original não foi alterado
    });
  });

  // ---- Tratamento de erros em listeners ----
  describe('error handling', () => {
    it('não deve propagar erros de listeners', () => {
      store.init({ mod: { state: { x: 0 }, mutations: { set: (s, v) => { s.x = v; } }, persist: false } });
      const errorListener = vi.fn(() => { throw new Error('listener error'); });
      store.subscribe('mod', errorListener);
      expect(() => store.commit('mod/set', 1)).not.toThrow();
      expect(store._state.mod.x).toBe(1);
    });
  });

  // ---- Integração com StorageService (_persist / _hydrate) ----
  describe('storage integration', () => {
    it('deve persistir estado no StorageService ao commitar', () => {
      StorageService._store = {};
      const spy = vi.spyOn(StorageService, 'set');
      store.init({
        pmod: {
          state: { data: 'initial' },
          mutations: { setData: (s, v) => { s.data = v; } }
          // persist: true (default)
        }
      });
      store.commit('pmod/setData', 'updated');
      expect(spy).toHaveBeenCalledWith('store_pmod', { data: 'updated' });
      spy.mockRestore();
    });

    it('não deve persistir quando persist é false', () => {
      const spy = vi.spyOn(StorageService, 'set');
      store.init({
        npmod: {
          state: { data: 'initial' },
          mutations: { setData: (s, v) => { s.data = v; } },
          persist: false
        }
      });
      store.commit('npmod/setData', 'updated');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('deve hidratar estado do StorageService ao inicializar', () => {
      // Simula dado salvo no storage
      StorageService.set('store_hmod', { data: 'from storage', extra: 42 });
      store.init({
        hmod: {
          state: { data: 'default', extra: 0 },
          mutations: {},
          persist: true
        }
      });
      expect(store._state.hmod.data).toBe('from storage');
      expect(store._state.hmod.extra).toBe(42);
    });

    it('não deve hidratar quando persist é false', () => {
      StorageService._store['store_nohyd'] = { data: 'stored' };
      store.init({
        nohyd: {
          state: { data: 'default' },
          mutations: {},
          persist: false
        }
      });
      expect(store._state.nohyd.data).toBe('default');
    });
  });
});

// ---- Testes do singleton global Fusion ----
describe('Fusion (singleton global)', () => {
  it('deve ser uma instância de FusionStore', () => {
    expect(Fusion).toBeInstanceOf(FusionStore);
  });

  it('deve estar inicializada com módulos', () => {
    expect(Fusion._initialized).toBe(true);
    expect(Fusion._modules.ui).toBeDefined();
    expect(Fusion._modules.auth).toBeDefined();
    expect(Fusion._modules.dashboard).toBeDefined();
  });

  it('deve ter módulo ui com estado padrão', () => {
    const ui = Fusion.getState('ui');
    expect(ui.sidebarOpen).toBe(true);
    expect(ui.modalOpen).toBe(false);
    expect(typeof ui.theme).toBe('string');
  });

  it('deve ter módulo auth com usuário nulo', () => {
    expect(Fusion.getState('auth.user')).toBeNull();
    expect(Fusion.getState('auth.isAuthenticated')).toBe(false);
  });

  describe('auth actions', () => {
    it('deve fazer login com credenciais corretas', async () => {
      StorageService._store = {};
      const result = await Fusion.dispatch('auth/login', { email: 'admin@fusion.com', password: 'admin123' });
      expect(result.success).toBe(true);
      expect(Fusion.getState('auth.user.name')).toBe('Cristian Marques');
    });

    it('deve falhar login com credenciais erradas', async () => {
      const result = await Fusion.dispatch('auth/login', { email: 'wrong@test.com', password: 'wrong' });
      expect(result.success).toBe(false);
      expect(Fusion.getState('auth.loginAttempts')).toBeGreaterThan(0);
    });

    it('deve bloquear após 5 tentativas', async () => {
      StorageService._store = {};
      // Reseta tentativas
      Fusion._state.auth.loginAttempts = 0;
      for (let i = 0; i < 5; i++) {
        await Fusion.dispatch('auth/login', { email: 'wrong@test.com', password: 'wrong' });
      }
      const result = await Fusion.dispatch('auth/login', { email: 'wrong@test.com', password: 'wrong' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('temporariamente bloqueada');
    });
  });

  describe('ui mutations', () => {
    it('deve alternar sidebar', () => {
      const before = Fusion.getState('ui.sidebarOpen');
      Fusion.commit('ui/toggleSidebar');
      expect(Fusion.getState('ui.sidebarOpen')).toBe(!before);
    });

    it('deve definir tema', () => {
      Fusion.commit('ui/setTheme', 'light');
      expect(Fusion.getState('ui.theme')).toBe('light');
    });

    it('deve abrir e fechar modal', () => {
      Fusion.commit('ui/openModal', { component: 'test' });
      expect(Fusion.getState('ui.modalOpen')).toBe(true);
      expect(Fusion.getState('ui.modalComponent')).toBe('test');

      Fusion.commit('ui/closeModal');
      expect(Fusion.getState('ui.modalOpen')).toBe(false);
      expect(Fusion.getState('ui.modalComponent')).toBeNull();
    });

    it('deve adicionar e remover notificações', () => {
      Fusion.commit('ui/addNotification', { type: 'success', message: 'Teste' });
      const notifications = Fusion.getState('ui.notifications');
      expect(notifications.length).toBeGreaterThan(0);
      const last = notifications[notifications.length - 1];
      expect(last.type).toBe('success');
      expect(last.message).toBe('Teste');

      Fusion.commit('ui/removeNotification', last.id);
      expect(Fusion.getState('ui.notifications').find(n => n.id === last.id)).toBeUndefined();
    });
  });

  describe('dashboard module', () => {
    it('deve ter estado inicial', () => {
      expect(Fusion.getState('dashboard.metrics.revenue.value')).toBe(0);
      expect(Fusion.getState('dashboard.period')).toBe('today');
      expect(Fusion.getState('dashboard.loading')).toBe(false);
    });
  });
});
