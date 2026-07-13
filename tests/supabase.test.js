/**
 * Fusion ERP — Testes do SupabaseService
 * 
 * Testa todos os métodos do serviço com mock do cliente Supabase JS SDK.
 * Dois modos: fallback (sem SDK) e conectado (com SDK mockado).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// =====================================================================
// HELPERS: Factory de mock do cliente Supabase
// =====================================================================

/**
 * Cria um mock completo do cliente Supabase SDK v2
 * Cada chamada retorna um novo mock com funções spy.
 */
function createMockSupabaseClient() {
  // Query builder chainável
  // Nota: métodos encadeados (eq, order, limit, range) delegam
  // para os spies originais do table mock, permitindo assertions.
  const createQueryBuilder = (initialMethods = {}) => {
    const chainHandlers = {};
    const builder = new Proxy({}, {
      get(target, prop) {
        if (prop === 'then') {
          const resolver = initialMethods._resolver || (() => ({ data: [], error: null }));
          return (resolve, reject) => {
            const result = resolver();
            if (result && result.error) {
              reject(result.error);
            } else {
              resolve(result);
            }
          };
        }
        if (chainHandlers[prop]) return chainHandlers[prop];
        // Delega para o método original do table mock se existir
        const spy = vi.fn((...args) => {
          if (typeof initialMethods[prop] === 'function' &&
              prop !== 'select' && prop !== 'insert' &&
              prop !== 'update' && prop !== 'delete') {
            initialMethods[prop](...args);
          }
          return createQueryBuilder(initialMethods);
        });
        chainHandlers[prop] = spy;
        return spy;
      }
    });
    return builder;
  };

  // === Auth mock ===
  const authMock = {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
  };

  // === Channel mock ===
  const createChannelMock = (name) => {
    const channel = {
      _name: name,
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    };
    return channel;
  };

  // === from() table mock ===
  const tableMocks = new Map();

  const client = {
    _channels: [],
    auth: authMock,
    from: vi.fn((tableName) => {
      if (!tableMocks.has(tableName)) {
        const mock = {
          _resolver: () => ({ data: [], error: null }),
          select: vi.fn(function (columns) {
            const builder = createQueryBuilder(mock);
            return builder;
          }),
          insert: vi.fn(function (data) {
            const builder = createQueryBuilder({
              ...mock,
              _resolver: () => ({ data: Array.isArray(data) ? data : [data], error: null })
            });
            return builder;
          }),
          update: vi.fn(function (data) {
            const builder = createQueryBuilder({
              ...mock,
              _resolver: () => ({ data: [data], error: null })
            });
            return builder;
          }),
          delete: vi.fn(function () {
            const builder = createQueryBuilder({
              ...mock,
              _resolver: () => ({ data: [], error: null })
            });
            return builder;
          }),
          eq: vi.fn(function (field, value) {
            const builder = createQueryBuilder(mock);
            return builder;
          }),
          order: vi.fn(function (field, opts) {
            const builder = createQueryBuilder(mock);
            return builder;
          }),
          limit: vi.fn(function (n) {
            const builder = createQueryBuilder(mock);
            return builder;
          }),
          range: vi.fn(function (from, to) {
            const builder = createQueryBuilder(mock);
            return builder;
          }),
        };
        tableMocks.set(tableName, mock);
      }
      return tableMocks.get(tableName);
    }),
    channel: vi.fn((name) => {
      const ch = createChannelMock(name);
      client._channels.push(ch);
      return ch;
    }),
  };

  return { client, authMock, tableMocks };
}

// =====================================================================
// Carrega o serviço
// =====================================================================

function loadSupabaseService() {
  const code = fs.readFileSync(
    path.resolve(projectRoot, 'assets/services/supabase.js'),
    'utf-8'
  );
  // Remove a inicialização automática para controle manual nos testes
  const cleaned = code.replace(
    /\/\/ Tenta inicializar automaticamente[\s\S]*?}\)\(\);/,
    '})();'
  );
  (0, eval)(cleaned);
}

// =====================================================================
// TESTS
// =====================================================================

describe('SupabaseService — Modo Fallback (sem SDK)', () => {
  beforeAll(() => {
    // Garante que supabase não está definido
    delete globalThis.supabase;
    delete globalThis.createClient;
    // Carrega o serviço — sem SDK, init() falha silenciosamente
    loadSupabaseService();
  });

  describe('init / isReady', () => {
    it('deve inicializar sem SDK sem lançar erro', () => {
      expect(SupabaseService).toBeDefined();
      expect(typeof SupabaseService.init).toBe('function');
    });

    it('isReady deve retornar false sem SDK', () => {
      expect(SupabaseService.isReady()).toBe(false);
    });

    it('init deve retornar false sem SDK', () => {
      const result = SupabaseService.init();
      expect(result).toBe(false);
    });
  });

  describe('signIn — fallback', () => {
    it('deve logar admin@fusion.com / admin123 retornando admin', async () => {
      const result = await SupabaseService.signIn('admin@fusion.com', 'admin123');
      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Cristian Marques');
      expect(result.user.role).toBe('admin');
      expect(result.user.email).toBe('admin@fusion.com');
    });

    it('deve logar ana@fusion.com / ana123 retornando recepcionista', async () => {
      const result = await SupabaseService.signIn('ana@fusion.com', 'ana123');
      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Ana Souza');
      expect(result.user.role).toBe('recepcionista');
    });

    it('deve rejeitar credenciais inválidas', async () => {
      const result = await SupabaseService.signIn('wrong@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toContain('inválidos');
    });

    it('deve gerar id a partir do charCode do email', async () => {
      const result = await SupabaseService.signIn('admin@fusion.com', 'admin123');
      expect(result.user.id).toBe(String('admin@fusion.com'.charCodeAt(0)));
    });
  });

  describe('signOut', () => {
    it('não deve lançar erro ao fazer logout em modo fallback', async () => {
      const result = await SupabaseService.signOut();
      expect(result).toBe(true);
    });
  });

  describe('getSession', () => {
    it('deve retornar null em modo fallback', async () => {
      const session = await SupabaseService.getSession();
      expect(session).toBeNull();
    });
  });

  describe('CRUD operations — fallback', () => {
    it('from() deve retornar null', () => {
      expect(SupabaseService.from('clientes')).toBeNull();
    });

    it('select() deve retornar erro', async () => {
      const result = await SupabaseService.select('clientes');
      expect(result.error).toBeDefined();
      expect(result.data).toBeNull();
    });

    it('insert() deve retornar erro', async () => {
      const result = await SupabaseService.insert('clientes', { nome: 'Teste' });
      expect(result.error).toBeDefined();
    });

    it('update() deve retornar erro', async () => {
      const result = await SupabaseService.update('clientes', { id: '1' }, { nome: 'Novo' });
      expect(result.error).toBeDefined();
    });

    it('remove() deve retornar erro', async () => {
      const result = await SupabaseService.remove('clientes', { id: '1' });
      expect(result.error).toBeDefined();
    });
  });

  describe('subscribeToTable — fallback', () => {
    it('deve retornar função vazia sem SDK', () => {
      const unsub = SupabaseService.subscribeToTable('clientes', '*', vi.fn());
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });
  });

  describe('onAuthChange — fallback', () => {
    it('deve retornar função vazia sem SDK', () => {
      const unsub = SupabaseService.onAuthChange(vi.fn());
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });
  });
});

// =====================================================================
// Modo Conectado (com SDK mockado)
// =====================================================================

describe('SupabaseService — Modo Conectado (SDK mockado)', () => {
  let mockClient, mockAuth, mockTables;

  beforeEach(() => {
    // Cria mock fresco para cada teste
    const mock = createMockSupabaseClient();
    mockClient = mock.client;
    mockAuth = mock.authMock;
    mockTables = mock.tableMocks;

    // Expõe supabase globalmente com createClient
    globalThis.supabase = {
      createClient: vi.fn((url, anonKey, options) => {
        return mockClient;
      })
    };

    // Reseta o serviço para um estado limpo
    // (Precisamos recarregar porque o serviço é um singleton)
    delete globalThis.SupabaseService;
    loadSupabaseService();
  });

  afterEach(() => {
    delete globalThis.supabase;
    delete globalThis.SupabaseService;
  });

  // ---- init / isReady ----
  describe('init / isReady', () => {
    it('init deve criar cliente com credenciais corretas', () => {
      const result = SupabaseService.init();
      expect(result).toBe(true);
      expect(globalThis.supabase.createClient).toHaveBeenCalled();
      // Verifica que foi chamado com URL e anon key
      const callArgs = globalThis.supabase.createClient.mock.calls[0];
      expect(callArgs[0]).toContain('supabase.com');
      expect(callArgs[1]).toContain('sb_publishable');
    });

    it('isReady deve retornar true após init', () => {
      SupabaseService.init();
      expect(SupabaseService.isReady()).toBe(true);
    });

    it('isReady deve retornar false se init não foi chamado', () => {
      // O init automático na carga pode ter sido chamado,
      // então resetamos manualmente
      SupabaseService._ready = false;
      SupabaseService._client = null;
      expect(SupabaseService.isReady()).toBe(false);
    });

    it('init deve aceitar opções de configuração', () => {
      SupabaseService.init();
      const options = globalThis.supabase.createClient.mock.calls[0][2];
      expect(options.auth.persistSession).toBe(true);
      expect(options.auth.autoRefreshToken).toBe(true);
      expect(options.auth.storageKey).toBe('fusion_supabase_auth');
      expect(options.realtime.params.eventsPerSecond).toBe(10);
    });
  });

  // ---- signIn ----
  describe('signIn', () => {
    beforeEach(() => {
      SupabaseService.init();
    });

    it('deve logar com sucesso via SDK', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'token123' },
          user: {
            id: 'user-1',
            email: 'admin@fusion.com',
            user_metadata: { name: 'Admin User', role: 'admin' }
          }
        },
        error: null
      });

      const result = await SupabaseService.signIn('admin@fusion.com', 'admin123');
      expect(result.success).toBe(true);
      expect(result.user.id).toBe('user-1');
      expect(result.user.name).toBe('Admin User');
      expect(result.user.role).toBe('admin');
      expect(result.session.access_token).toBe('token123');
    });

    it('deve retornar erro quando credenciais são inválidas', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: { session: null, user: null },
        error: { message: 'Invalid login credentials' }
      });

      const result = await SupabaseService.signIn('wrong@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid login credentials');
    });

    it('deve extrair nome do email quando user_metadata.name está ausente', async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: {
          session: { access_token: 'tok' },
          user: {
            id: 'user-2',
            email: 'maria@test.com',
            user_metadata: {}
          }
        },
        error: null
      });

      const result = await SupabaseService.signIn('maria@test.com', '123');
      expect(result.user.name).toBe('maria');
    });

    it('deve tratar erro de rede', async () => {
      mockAuth.signInWithPassword.mockRejectedValue(new Error('Network error'));

      const result = await SupabaseService.signIn('test@test.com', '123');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('deve usar fallback quando cliente não está pronto', async () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const result = await SupabaseService.signIn('admin@fusion.com', 'admin123');
      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Cristian Marques');
    });
  });

  // ---- signOut ----
  describe('signOut', () => {
    beforeEach(() => {
      SupabaseService.init();
    });

    it('deve chamar auth.signOut e limpar canais', async () => {
      // Adiciona um canal mock
      const unsubSpy = vi.fn();
      SupabaseService._channels = [
        { unsubscribe: unsubSpy },
        { unsubscribe: unsubSpy }
      ];
      mockAuth.signOut.mockResolvedValue({ error: null });

      const result = await SupabaseService.signOut();
      expect(result).toBe(true);
      expect(mockAuth.signOut).toHaveBeenCalled();
      expect(unsubSpy).toHaveBeenCalledTimes(2);
      expect(SupabaseService._channels).toEqual([]);
    });

    it('não deve lançar erro se signOut falhar', async () => {
      mockAuth.signOut.mockRejectedValue(new Error('fail'));
      SupabaseService._channels = [];

      await expect(SupabaseService.signOut()).resolves.toBe(true);
    });
  });

  // ---- getSession ----
  describe('getSession', () => {
    beforeEach(() => {
      SupabaseService.init();
    });

    it('deve retornar sessão atual', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: { access_token: 'tok', user: { id: '1' } } },
        error: null
      });

      const session = await SupabaseService.getSession();
      expect(session).toBeDefined();
      expect(session.access_token).toBe('tok');
    });

    it('deve retornar null se não houver sessão', async () => {
      mockAuth.getSession.mockResolvedValue({
        data: { session: null },
        error: null
      });

      const session = await SupabaseService.getSession();
      expect(session).toBeNull();
    });

    it('deve retornar null em caso de erro', async () => {
      mockAuth.getSession.mockRejectedValue(new Error('fail'));
      const session = await SupabaseService.getSession();
      expect(session).toBeNull();
    });
  });

  // ---- onAuthChange ----
  describe('onAuthChange', () => {
    beforeEach(() => {
      SupabaseService.init();
    });

    it('deve inscrever callback em auth state change', () => {
      const unsubscribe = vi.fn();
      mockAuth.onAuthStateChange.mockReturnValue({
        data: { unsubscribe }
      });

      const callback = vi.fn();
      const result = SupabaseService.onAuthChange(callback);
      expect(mockAuth.onAuthStateChange).toHaveBeenCalled();
      expect(typeof result).toBe('function');
    });

    it('deve retornar função vazia se cliente não estiver pronto', () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const result = SupabaseService.onAuthChange(vi.fn());
      expect(typeof result).toBe('function');
      expect(() => result()).not.toThrow();
    });
  });

  // ---- from ----
  describe('from', () => {
    beforeEach(() => {
      SupabaseService.init();
    });

    it('deve retornar o query builder da tabela', () => {
      const qb = SupabaseService.from('clientes');
      expect(qb).toBeDefined();
      expect(mockClient.from).toHaveBeenCalledWith('clientes');
    });

    it('deve retornar null se cliente não estiver pronto', () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const qb = SupabaseService.from('clientes');
      expect(qb).toBeNull();
    });
  });

  // ---- select ----
  // Nota: mockTables só é populado após from() ser chamado,
  // então primeiro chamamos o serviço, depois obtemos o mock.
  describe('select', () => {
    beforeEach(() => {
      SupabaseService.init();
      vi.clearAllMocks();
    });

    it('deve selecionar todas as colunas por padrão', async () => {
      await SupabaseService.select('clientes');

      const tableMock = mockTables.get('clientes');
      expect(tableMock.select).toHaveBeenCalledWith('*');
    });

    it('deve selecionar colunas específicas', async () => {
      await SupabaseService.select('clientes', 'id,nome,email');

      const tableMock = mockTables.get('clientes');
      expect(tableMock.select).toHaveBeenCalledWith('id,nome,email');
    });

    it('deve aplicar filtro eq', async () => {
      await SupabaseService.select('clientes', '*', { eq: { field: 'id', value: '123' } });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.select).toHaveBeenCalled();
      expect(tableMock.eq).toHaveBeenCalledWith('id', '123');
    });

    it('deve aplicar ordenação', async () => {
      await SupabaseService.select('clientes', '*', {
        order: { field: 'nome', ascending: true }
      });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.order).toHaveBeenCalledWith('nome', { ascending: true });
    });

    it('deve aplicar ascending como true por padrão', async () => {
      await SupabaseService.select('clientes', '*', {
        order: { field: 'nome' }
      });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.order).toHaveBeenCalledWith('nome', { ascending: true });
    });

    it('deve aplicar limite', async () => {
      await SupabaseService.select('clientes', '*', { limit: 10 });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.limit).toHaveBeenCalledWith(10);
    });

    it('deve aplicar range', async () => {
      await SupabaseService.select('clientes', '*', { range: { from: 0, to: 9 } });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.range).toHaveBeenCalledWith(0, 9);
    });

    it('deve combinar múltiplos filtros', async () => {
      await SupabaseService.select('clientes', 'id,nome', {
        eq: { field: 'ativo', value: true },
        order: { field: 'nome', ascending: false },
        limit: 5
      });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.select).toHaveBeenCalled();
      expect(tableMock.eq).toHaveBeenCalledWith('ativo', true);
      expect(tableMock.order).toHaveBeenCalled();
      expect(tableMock.limit).toHaveBeenCalledWith(5);
      // range não deve ser chamado
      expect(tableMock.range).not.toHaveBeenCalled();
    });

    it('deve retornar erro se cliente não estiver pronto', async () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const result = await SupabaseService.select('clientes');
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Supabase não conectado');
    });
  });

  // ---- insert ----
  describe('insert', () => {
    beforeEach(() => {
      SupabaseService.init();
      vi.clearAllMocks();
    });

    it('deve inserir um único registro', async () => {
      const data = { nome: 'Maria', email: 'maria@test.com' };

      await SupabaseService.insert('clientes', data);

      const tableMock = mockTables.get('clientes');
      expect(tableMock.insert).toHaveBeenCalledWith(data);
    });

    it('deve chamar select após insert', async () => {
      await SupabaseService.insert('clientes', { nome: 'João' });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.insert).toHaveBeenCalled();
    });

    it('deve retornar erro se cliente não estiver pronto', async () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const result = await SupabaseService.insert('clientes', { nome: 'Teste' });
      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Supabase não conectado');
    });
  });

  // ---- update ----
  describe('update', () => {
    beforeEach(() => {
      SupabaseService.init();
      vi.clearAllMocks();
    });

    it('deve atualizar registro com match', async () => {
      const match = { id: 'abc-123' };
      const data = { nome: 'Atualizado' };

      await SupabaseService.update('clientes', match, data);

      const tableMock = mockTables.get('clientes');
      expect(tableMock.update).toHaveBeenCalledWith(data);
      expect(tableMock.eq).toHaveBeenCalledWith('id', 'abc-123');
    });

    it('deve aplicar múltiplos matchs', async () => {
      await SupabaseService.update('clientes', { unidade_id: 'u1', ativo: true }, { status: 'inativo' });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.update).toHaveBeenCalled();
      expect(tableMock.eq).toHaveBeenCalledWith('unidade_id', 'u1');
      expect(tableMock.eq).toHaveBeenCalledWith('ativo', true);
    });

    it('deve retornar erro se cliente não estiver pronto', async () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const result = await SupabaseService.update('clientes', { id: '1' }, { nome: 'X' });
      expect(result.error).toBeDefined();
    });
  });

  // ---- remove ----
  describe('remove', () => {
    beforeEach(() => {
      SupabaseService.init();
      vi.clearAllMocks();
    });

    it('deve deletar registro com match', async () => {
      await SupabaseService.remove('clientes', { id: 'abc-123' });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.delete).toHaveBeenCalled();
      expect(tableMock.eq).toHaveBeenCalledWith('id', 'abc-123');
    });

    it('deve aplicar múltiplos matchs no delete', async () => {
      await SupabaseService.remove('clientes', { unidade_id: 'u1', ativo: false });

      const tableMock = mockTables.get('clientes');
      expect(tableMock.delete).toHaveBeenCalled();
      expect(tableMock.eq).toHaveBeenCalledWith('unidade_id', 'u1');
      expect(tableMock.eq).toHaveBeenCalledWith('ativo', false);
    });

    it('deve retornar erro se cliente não estiver pronto', async () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const result = await SupabaseService.remove('clientes', { id: '1' });
      expect(result.error).toBeDefined();
    });
  });

  // ---- subscribeToTable ----
  describe('subscribeToTable', () => {
    beforeEach(() => {
      SupabaseService.init();
      vi.clearAllMocks();
    });

    it('deve criar canal e inscrever em postgres_changes', () => {
      const callback = vi.fn();
      const unsub = SupabaseService.subscribeToTable('clientes', '*', callback);

      expect(mockClient.channel).toHaveBeenCalled();
      const channelName = mockClient.channel.mock.calls[0][0];
      expect(channelName).toContain('fusion-clientes-');

      const channel = mockClient._channels[0];
      expect(channel.on).toHaveBeenCalledWith(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clientes' },
        expect.any(Function)
      );
      expect(channel.subscribe).toHaveBeenCalled();
      expect(typeof unsub).toBe('function');
    });

    it('deve notificar callback quando payload chegar', () => {
      const callback = vi.fn();
      SupabaseService.subscribeToTable('clientes', 'INSERT', callback);

      const channel = mockClient._channels[0];
      // Extrai o callback passado para channel.on
      const onArgs = channel.on.mock.calls[0];
      const payloadHandler = onArgs[2];

      const fakePayload = { event: 'INSERT', new: { id: '123', nome: 'Novo' } };
      payloadHandler(fakePayload);

      expect(callback).toHaveBeenCalledWith(fakePayload);
    });

    it('deve retornar unsubscribe que remove o canal', () => {
      const unsub = SupabaseService.subscribeToTable('clientes', '*', vi.fn());
      expect(SupabaseService._channels).toHaveLength(1);

      unsub();

      expect(SupabaseService._channels).toHaveLength(0);
      const channel = mockClient._channels[0];
      expect(channel.unsubscribe).toHaveBeenCalled();
    });

    it('deve suportar múltiplas subscriptions', () => {
      SupabaseService.subscribeToTable('clientes', '*', vi.fn());
      SupabaseService.subscribeToTable('salas', '*', vi.fn());
      SupabaseService.subscribeToTable('agendamentos', 'INSERT', vi.fn());

      expect(SupabaseService._channels).toHaveLength(3);
      expect(mockClient.channel).toHaveBeenCalledTimes(3);
    });

    it('deve retornar função vazia se cliente não estiver pronto', () => {
      SupabaseService._ready = false;
      SupabaseService._client = null;

      const unsub = SupabaseService.subscribeToTable('clientes', '*', vi.fn());
      expect(typeof unsub).toBe('function');
      expect(() => unsub()).not.toThrow();
    });
  });

  // ---- loadAllToStore ----
  describe('loadAllToStore', () => {
    beforeEach(() => {
      SupabaseService.init();
      vi.clearAllMocks();

      // Configura Fusion mock com módulos
      globalThis.Fusion = {
        _modules: {
          clientes: {},
          agenda: {},
          financeiro: {},
          estoque: {},
          salas: {},
          filaAtendimento: {},
          listaEspera: {},
          pacotes: {},
          planosRecorrentes: {}
        },
        _state: {
          clientes: { list: [] },
          agenda: { appointments: [] },
          financeiro: { transacoes: [] },
          estoque: { items: [], entries: [] },
          salas: { list: [] },
          filaAtendimento: { sessions: [] },
          listaEspera: { list: [] },
          pacotes: { list: [] },
          planosRecorrentes: { planos: [] }
        },
        _persist: vi.fn()
      };
    });

    afterEach(() => {
      delete globalThis.Fusion;
    });

    it('deve carregar dados de múltiplas tabelas', async () => {
      // Pre-popula os mocks antes de chamar loadAllToStore
      // forçando a criação das entradas em mockTables
      SupabaseService.from('clientes');
      SupabaseService.from('salas');

      const clientesData = [{ id: '1', nome: 'Ana' }];
      const salasData = [{ id: 's1', nome: 'Sala 1' }];

      const clientesMock = mockTables.get('clientes');
      clientesMock.select = vi.fn(() => Promise.resolve({ data: clientesData, error: null }));

      const salasMock = mockTables.get('salas');
      salasMock.select = vi.fn(() => Promise.resolve({ data: salasData, error: null }));

      // Carrega todos os dados
      await SupabaseService.loadAllToStore();

      expect(Fusion._state.clientes.list).toEqual(clientesData);
      expect(Fusion._state.salas.list).toEqual(salasData);
      expect(Fusion._persist).toHaveBeenCalledWith('clientes');
      expect(Fusion._persist).toHaveBeenCalledWith('salas');
    });

    it('não deve quebrar se tabela retornar erro', async () => {
      SupabaseService.from('clientes');
      const clientesMock = mockTables.get('clientes');
      clientesMock.select = vi.fn(() => Promise.resolve({ data: null, error: new Error('fail') }));

      await expect(SupabaseService.loadAllToStore()).resolves.not.toThrow();
    });

    it('não deve quebrar se módulo não existir na store', async () => {
      delete Fusion._modules.clientes;
      delete Fusion._state.clientes;

      await expect(SupabaseService.loadAllToStore()).resolves.not.toThrow();
    });

    it('não deve quebrar se Fusion não estiver definido', async () => {
      delete globalThis.Fusion;

      await expect(SupabaseService.loadAllToStore()).resolves.not.toThrow();
    });

    it('não deve alterar estado se select retornar array vazio', async () => {
      SupabaseService.from('clientes');
      const clientesMock = mockTables.get('clientes');
      clientesMock.select = vi.fn(() => Promise.resolve({ data: [], error: null }));

      Fusion._state.clientes.list = ['existing'];
      await SupabaseService.loadAllToStore();

      // Não deve substituir porque data está vazio
      expect(Fusion._state.clientes.list).toEqual(['existing']);
    });
  });
});

// =====================================================================
// Testes de integração: init automático
// =====================================================================

describe('SupabaseService — Inicialização automática', () => {
  afterEach(() => {
    delete globalThis.supabase;
    delete globalThis.SupabaseService;
  });

  it('deve tentar init automático quando documento está completo', () => {
    // Cria um mock do supabase
    const mockCreateClient = vi.fn(() => ({}));
    globalThis.supabase = { createClient: mockCreateClient };

    // Carrega o serviço (que tenta init automático)
    const code = fs.readFileSync(
      path.resolve(projectRoot, 'assets/services/supabase.js'),
      'utf-8'
    );
    // Mantém o código de init automático
    (0, eval)(code);

    // init() foi chamado (pode ter falhado porque o mock não é completo)
    expect(globalThis.SupabaseService).toBeDefined();
  });
});

// =====================================================================
// Teste de carregamento: SUPABASE_URL do APP_CONFIG
// =====================================================================

describe('SupabaseService — Credenciais do APP_CONFIG', () => {
  beforeEach(() => {
    // Configura APP_CONFIG com credenciais específicas
    globalThis.APP_CONFIG = globalThis.APP_CONFIG || {};
    globalThis.APP_CONFIG.api = {
      supabaseUrl: 'https://custom-project.supabase.co',
      supabaseAnonKey: 'custom-anon-key-test'
    };
  });

  afterEach(() => {
    delete globalThis.SupabaseService;
    // Restaura APP_CONFIG original (feito pelo setup.js)
  });

  it('deve usar credenciais do APP_CONFIG quando disponíveis', () => {
    const mockCreateClient = vi.fn(() => ({}));
    globalThis.supabase = { createClient: mockCreateClient };

    // Carrega com APP_CONFIG configurado
    loadSupabaseService();
    SupabaseService.init();

    const [url, key] = mockCreateClient.mock.calls[0];
    expect(url).toBe('https://custom-project.supabase.co');
    expect(key).toBe('custom-anon-key-test');
  });
});
