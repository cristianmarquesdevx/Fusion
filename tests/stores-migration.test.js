/** @format */

import { describe, it, expect, beforeEach } from 'vitest';

// Helper: reseta apenas as propriedades de dados da store,
// preservando as actions (setSearchTerm, addPontos, etc.)
const resetStoreData = (store, data) => {
  store.setState(data);
  return store;
};

// ─── Helper para formatar moeda nos testes ───
const formatCurrency = (val) =>
  'R$ ' + val.toFixed(2).replace('.', ',');

/* ════════════════════════════════════════════════════════════════
   FIDELIDADE STORE
   ════════════════════════════════════════════════════════════════ */

describe('useFidelidadeStore', () => {
  let store;

  const CLIENTES_INICIAIS = [
    { id: '1', nome: 'Patrícia Nogueira', nivel: 'Diamante', pontos: 1050, ultima: 'Hoje, 14:30' },
    { id: '2', nome: 'Beatriz Lima', nivel: 'Platina', pontos: 620, ultima: 'Hoje, 12:15' },
    { id: '3', nome: 'Juliana Prado', nivel: 'Ouro', pontos: 350, ultima: 'Hoje, 11:30' },
    { id: '4', nome: 'Marina Costa', nivel: 'Ouro', pontos: 320, ultima: 'Hoje, 09:00' },
    { id: '5', nome: 'Renata Alves', nivel: 'Prata', pontos: 180, ultima: 'Hoje, 10:00' },
    { id: '6', nome: 'Larissa Teixeira', nivel: 'Bronze', pontos: 45, ultima: '18 de junho' },
    { id: '7', nome: 'Camila Ferreira', nivel: 'Bronze', pontos: 20, ultima: '22 de junho' },
    { id: '8', nome: 'Sofia Ribeiro', nivel: 'Prata', pontos: 120, ultima: '15 de junho' },
  ];

  beforeEach(async () => {
    const mod = await import('../src/store/useFidelidadeStore');
    store = resetStoreData(mod.useFidelidadeStore, {
      niveis: [
        { nome: 'Bronze', pontosMin: 0, cor: '#CD7F32', codigo: 'BRZ', beneficios: ['Acúmulo de pontos'] },
        { nome: 'Prata', pontosMin: 100, cor: '#C0C0C0', codigo: 'PRT', beneficios: ['Acúmulo de pontos', 'Desconto progressivo'] },
        { nome: 'Ouro', pontosMin: 300, cor: '#FFD700', codigo: 'OUR', beneficios: ['Acúmulo de pontos', 'Desconto progressivo', 'Prioridade de agendamento'] },
        { nome: 'Platina', pontosMin: 600, cor: '#E5E4E2', codigo: 'PLT', beneficios: ['Acúmulo de pontos', 'Desconto progressivo', 'Prioridade de agendamento', 'Acesso a eventos exclusivos'] },
        { nome: 'Diamante', pontosMin: 1000, cor: '#B9F2FF', codigo: 'DMT', beneficios: ['Acúmulo de pontos', 'Desconto progressivo', 'Prioridade de agendamento', 'Acesso a eventos exclusivos', 'Brinde de aniversário'] },
      ],
      clientes: CLIENTES_INICIAIS.map((c) => ({ ...c })),
      totalPontos: 18420,
      resgateMes: 3240,
      ticketMedio: 312,
      searchTerm: '',
      activeFilter: null,
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 5 níveis (Bronze → Diamante)', () => {
      const niveis = store.getState().niveis;
      expect(niveis).toHaveLength(5);
      expect(niveis[0].nome).toBe('Bronze');
      expect(niveis[4].nome).toBe('Diamante');
    });

    it('cada nível deve ter codigo, cor, pontosMin e beneficios', () => {
      store.getState().niveis.forEach((n) => {
        expect(n).toHaveProperty('codigo');
        expect(n).toHaveProperty('cor');
        expect(typeof n.pontosMin).toBe('number');
        expect(Array.isArray(n.beneficios)).toBe(true);
      });
    });

    it('deve ter 8 clientes iniciais', () => {
      expect(store.getState().clientes).toHaveLength(8);
    });

    it('deve ter totalPontos = 18420, resgateMes = 3240, ticketMedio = 312', () => {
      const state = store.getState();
      expect(state.totalPontos).toBe(18420);
      expect(state.resgateMes).toBe(3240);
      expect(state.ticketMedio).toBe(312);
    });

    it('deve iniciar com searchTerm vazio e activeFilter null', () => {
      expect(store.getState().searchTerm).toBe('');
      expect(store.getState().activeFilter).toBeNull();
    });
  });

  /* ─── GET DISTRIBUICAO ─── */

  describe('getDistribuicao', () => {
    it('deve retornar contagem correta por nível', () => {
      const dist = store.getState().getDistribuicao();
      expect(dist).toEqual({
        Bronze: 2,
        Prata: 2,
        Ouro: 2,
        Platina: 1,
        Diamante: 1,
      });
    });

    it('deve ter chaves para todos os 5 níveis', () => {
      const dist = store.getState().getDistribuicao();
      expect(Object.keys(dist)).toHaveLength(5);
    });

    it('deve refletir mudanças após addPontos trocar nível de cliente', () => {
      // Marina Costa: Ouro, 320 pts → adiciona 300 → 620 → Platina
      store.getState().addPontos('4', 300);
      const dist = store.getState().getDistribuicao();
      expect(dist.Ouro).toBe(1); // só Juliana (350)
      expect(dist.Platina).toBe(2); // Beatriz (620) + Marina (620)
    });
  });

  /* ─── GET TOP CLIENTES ─── */

  describe('getTopClientes', () => {
    it('deve retornar clientes ordenados por pontos decrescente', () => {
      const top = store.getState().getTopClientes();
      expect(top[0].nome).toBe('Patrícia Nogueira'); // 1050 pts
      expect(top[1].nome).toBe('Beatriz Lima');       // 620 pts
      expect(top[7].nome).toBe('Camila Ferreira');    // 20 pts
    });

    it('cada cliente deve ter pontos maior ou igual ao próximo', () => {
      const top = store.getState().getTopClientes();
      for (let i = 1; i < top.length; i++) {
        expect(top[i - 1].pontos).toBeGreaterThanOrEqual(top[i].pontos);
      }
    });

    it('não deve modificar o array original de clientes', () => {
      const original = [...store.getState().clientes];
      store.getState().getTopClientes();
      expect(store.getState().clientes).toEqual(original);
    });
  });

  /* ─── GET NIVEL BY PONTOS ─── */

  describe('getNivelByPontos', () => {
    it('deve retornar Bronze para 0-99 pontos', () => {
      expect(store.getState().getNivelByPontos(0).nome).toBe('Bronze');
      expect(store.getState().getNivelByPontos(50).nome).toBe('Bronze');
      expect(store.getState().getNivelByPontos(99).nome).toBe('Bronze');
    });

    it('deve retornar Prata para 100-299 pontos', () => {
      expect(store.getState().getNivelByPontos(100).nome).toBe('Prata');
      expect(store.getState().getNivelByPontos(250).nome).toBe('Prata');
      expect(store.getState().getNivelByPontos(299).nome).toBe('Prata');
    });

    it('deve retornar Ouro para 300-599 pontos', () => {
      expect(store.getState().getNivelByPontos(300).nome).toBe('Ouro');
      expect(store.getState().getNivelByPontos(599).nome).toBe('Ouro');
    });

    it('deve retornar Platina para 600-999 pontos', () => {
      expect(store.getState().getNivelByPontos(600).nome).toBe('Platina');
      expect(store.getState().getNivelByPontos(999).nome).toBe('Platina');
    });

    it('deve retornar Diamante para 1000+ pontos', () => {
      expect(store.getState().getNivelByPontos(1000).nome).toBe('Diamante');
      expect(store.getState().getNivelByPontos(5000).nome).toBe('Diamante');
    });

    it('deve retornar o objeto completo do nível (com cor, codigo, beneficios)', () => {
      const nivel = store.getState().getNivelByPontos(600);
      expect(nivel.nome).toBe('Platina');
      expect(nivel.cor).toBe('#E5E4E2');
      expect(nivel.codigo).toBe('PLT');
      expect(nivel.beneficios).toHaveLength(4);
    });
  });

  /* ─── ADD PONTOS ─── */

  describe('addPontos', () => {
    it('deve adicionar pontos a um cliente existente', () => {
      store.getState().addPontos('6', 55); // Larissa: 45 + 55 = 100
      const cliente = store.getState().clientes.find((c) => c.id === '6');
      expect(cliente.pontos).toBe(100);
    });

    it('deve atualizar totalPontos', () => {
      store.getState().addPontos('1', 200);
      expect(store.getState().totalPontos).toBe(18420 + 200);
    });

    it('deve recalcular o nível quando ultrapassa o threshold', () => {
      // Larissa: Bronze, 45 pts → add 300 → 345 → Ouro
      store.getState().addPontos('6', 300);
      const cliente = store.getState().clientes.find((c) => c.id === '6');
      expect(cliente.nivel).toBe('Ouro');
      expect(cliente.pontos).toBe(345);
    });

    it('não deve modificar outros clientes', () => {
      const original = store.getState().clientes.find((c) => c.id === '1').pontos;
      store.getState().addPontos('6', 100);
      expect(store.getState().clientes.find((c) => c.id === '1').pontos).toBe(original);
    });

    it('deve retornar undefined para cliente inexistente (sem quebrar)', () => {
      expect(() => store.getState().addPontos('999', 100)).not.toThrow();
      expect(store.getState().totalPontos).toBe(18420); // não alterou
    });

    it('deve usar mutação imutável (criar novo objeto, não modificar original)', () => {
      const clienteOriginal = store.getState().clientes.find((c) => c.id === '1');
      store.getState().addPontos('1', 50);
      const clienteAtualizado = store.getState().clientes.find((c) => c.id === '1');
      expect(clienteAtualizado).not.toBe(clienteOriginal); // referência diferente
    });
  });

  /* ─── SEARCH ─── */

  describe('setSearchTerm', () => {
    it('deve atualizar searchTerm', () => {
      store.getState().setSearchTerm('Patrícia');
      expect(store.getState().searchTerm).toBe('Patrícia');
    });

    it('deve aceitar string vazia', () => {
      store.getState().setSearchTerm('teste');
      store.getState().setSearchTerm('');
      expect(store.getState().searchTerm).toBe('');
    });
  });

  /* ─── FILTRO ─── */

  describe('setActiveFilter', () => {
    it('deve definir filtro ativo por nível', () => {
      store.getState().setActiveFilter('Ouro');
      expect(store.getState().activeFilter).toBe('Ouro');
    });

    it('deve limpar filtro com null', () => {
      store.getState().setActiveFilter('Prata');
      store.getState().setActiveFilter(null);
      expect(store.getState().activeFilter).toBeNull();
    });
  });

  /* ─── GET FILTERED CLIENTES ─── */

  describe('getFilteredClientes', () => {
    it('deve retornar todos os clientes sem filtros', () => {
      expect(store.getState().getFilteredClientes()).toHaveLength(8);
    });

    it('deve filtrar por nome (case-insensitive)', () => {
      store.getState().setSearchTerm('patrícia');
      const result = store.getState().getFilteredClientes();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('deve filtrar por nome parcial', () => {
      store.getState().setSearchTerm('Marina');
      const result = store.getState().getFilteredClientes();
      expect(result).toHaveLength(1);
      expect(result[0].nome).toContain('Marina');
    });

    it('deve filtrar por nível', () => {
      store.getState().setActiveFilter('Ouro');
      const result = store.getState().getFilteredClientes();
      expect(result).toHaveLength(2); // Juliana + Marina
      result.forEach((c) => expect(c.nivel).toBe('Ouro'));
    });

    it('deve filtrar por nível Bronze', () => {
      store.getState().setActiveFilter('Bronze');
      const result = store.getState().getFilteredClientes();
      expect(result).toHaveLength(2); // Larissa + Camila
    });

    it('deve combinar search + nível', () => {
      store.getState().setSearchTerm('Silva');
      store.getState().setActiveFilter('Ouro');
      const result = store.getState().getFilteredClientes();
      expect(result).toHaveLength(0);
    });

    it('deve combinar search + nível com resultado', () => {
      store.getState().setSearchTerm('Marina');
      store.getState().setActiveFilter('Ouro');
      const result = store.getState().getFilteredClientes();
      expect(result).toHaveLength(1);
      expect(result[0].nome).toBe('Marina Costa');
    });

    it('deve retornar lista vazia para filtro sem match', () => {
      store.getState().setActiveFilter('Diamante');
      store.getState().setSearchTerm('zzz');
      expect(store.getState().getFilteredClientes()).toHaveLength(0);
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   PACOTES STORE
   ════════════════════════════════════════════════════════════════ */

describe('usePacotesStore', () => {
  let store;

  const PACOTES_INICIAIS = [
    { id: 'p1', nome: 'Limpeza facial', servico: 'Limpeza de pele', sessoes: 10, valor: 1600.00, validadeMeses: 12, ativos: 12, promocao: false, cor: '#4C7A5E' },
    { id: 'p2', nome: 'Peeling de diamante', servico: 'Peeling de diamante', sessoes: 6, valor: 1350.00, validadeMeses: 12, ativos: 8, promocao: false, cor: '#6C5CE7' },
    { id: 'p3', nome: 'Drenagem linfática', servico: 'Drenagem linfática', sessoes: 8, valor: 1280.00, validadeMeses: 12, ativos: 6, promocao: false, cor: '#00B894' },
    { id: 'p4', nome: 'Laser CO2 completo', servico: 'Laser CO2 fracionado', sessoes: 5, valor: 5400.00, validadeMeses: 12, ativos: 3, promocao: true, cor: '#B14E3D' },
    { id: 'p5', nome: 'Massagem relaxante', servico: 'Massagem relaxante', sessoes: 8, valor: 1100.00, validadeMeses: 6, ativos: 10, promocao: false, cor: '#9C7A3E' },
  ];

  beforeEach(async () => {
    const mod = await import('../src/store/usePacotesStore');
    store = resetStoreData(mod.usePacotesStore, {
      list: PACOTES_INICIAIS.map((p) => ({ ...p })),
      filterPeriod: 'todos',
      searchTerm: '',
      nextId: 'p6',
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 5 pacotes', () => {
      expect(store.getState().list).toHaveLength(5);
    });

    it('deve ter nextId = p6', () => {
      expect(store.getState().nextId).toBe('p6');
    });

    it('deve ter filterPeriod = todos', () => {
      expect(store.getState().filterPeriod).toBe('todos');
    });

    it('cada pacote deve ter id, nome, sessoes, valor, ativos', () => {
      store.getState().list.forEach((p) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('nome');
        expect(typeof p.sessoes).toBe('number');
        expect(typeof p.valor).toBe('number');
        expect(typeof p.ativos).toBe('number');
      });
    });
  });

  /* ─── GET KPIS ─── */

  describe('getKPIs', () => {
    it('deve retornar totalAtivos = 5', () => {
      expect(store.getState().getKPIs().totalAtivos).toBe(5);
    });

    it('deve calcular totalSessoes (soma de ativos * sessoes)', () => {
      // 12*10 + 8*6 + 6*8 + 3*5 + 10*8 = 120 + 48 + 48 + 15 + 80 = 311
      expect(store.getState().getKPIs().totalSessoes).toBe(311);
    });

    it('deve calcular receitaPacotes (soma de ativos * valor)', () => {
      // 12*1600 + 8*1350 + 6*1280 + 3*5400 + 10*1100
      // = 19200 + 10800 + 7680 + 16200 + 11000 = 64880
      expect(store.getState().getKPIs().receitaPacotes).toBe(64880);
    });

    it('deve calcular ticketMedio = receita / totalAtivos', () => {
      const kpis = store.getState().getKPIs();
      expect(kpis.ticketMedio).toBe(64880 / 5);
    });

    it('deve recalcular após adicionar pacote', () => {
      store.getState().addPacote({ nome: 'Novo', servico: 'Teste', sessoes: 4, valor: 800, validadeMeses: 6 });
      const kpis = store.getState().getKPIs();
      expect(kpis.totalAtivos).toBe(6);
      // Mesmo valor (novo pacote tem ativos=0, então não altera receita)
      expect(kpis.receitaPacotes).toBe(64880);
      // ticket = 64880 / 6 ≈ 10813.33
      expect(kpis.ticketMedio).toBeCloseTo(10813.33, 0);
    });
  });

  /* ─── ADD PACOTE ─── */

  describe('addPacote', () => {
    it('deve adicionar novo pacote com ID incremental', () => {
      store.getState().addPacote({ nome: 'Teste', servico: 'Teste', sessoes: 4, valor: 400, validadeMeses: 12 });
      const list = store.getState().list;
      expect(list).toHaveLength(6);
      expect(list[5].id).toBe('p6');
      expect(list[5].nome).toBe('Teste');
      expect(store.getState().nextId).toBe('p7');
    });

    it('deve iniciar com ativos = 0 e promocao = false', () => {
      store.getState().addPacote({ nome: 'Novo', servico: 'Serviço', sessoes: 2, valor: 200, validadeMeses: 6 });
      const novo = store.getState().list[5];
      expect(novo.ativos).toBe(0);
      expect(novo.promocao).toBe(false);
    });

    it('deve preservar pacotes anteriores', () => {
      store.getState().addPacote({ nome: 'A', servico: 'A', sessoes: 1, valor: 100, validadeMeses: 12 });
      store.getState().addPacote({ nome: 'B', servico: 'B', sessoes: 2, valor: 200, validadeMeses: 12 });
      expect(store.getState().list).toHaveLength(7);
      expect(store.getState().list[5].id).toBe('p6');
      expect(store.getState().list[6].id).toBe('p7');
    });

    it('deve manter campo servico mesmo se não informado (—)', () => {
      store.getState().addPacote({ nome: 'Teste', servico: '—', sessoes: 3, valor: 300, validadeMeses: 12 });
      expect(store.getState().list[5].servico).toBe('—');
    });
  });

  /* ─── FILTER PERIOD ─── */

  describe('setFilterPeriod', () => {
    it('deve alterar filterPeriod', () => {
      store.getState().setFilterPeriod('promocoes');
      expect(store.getState().filterPeriod).toBe('promocoes');
    });

    it('deve aceitar "todos"', () => {
      store.getState().setFilterPeriod('expirados');
      store.getState().setFilterPeriod('todos');
      expect(store.getState().filterPeriod).toBe('todos');
    });
  });

  /* ─── GET FILTERED LIST ─── */

  describe('getFilteredList', () => {
    it('deve retornar todos com filterPeriod = todos', () => {
      expect(store.getState().getFilteredList()).toHaveLength(5);
    });

    it('deve filtrar por promocoes', () => {
      store.getState().setFilterPeriod('promocoes');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(1); // só Laser CO2
      expect(result[0].promocao).toBe(true);
    });

    it('deve retornar vazio para expirados', () => {
      store.getState().setFilterPeriod('expirados');
      expect(store.getState().getFilteredList()).toHaveLength(0);
    });

    it('deve filtrar por searchTerm (nome)', () => {
      store.getState().setSearchTerm('Laser');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p4');
    });

    it('deve filtrar por searchTerm (servico)', () => {
      store.getState().setSearchTerm('drenagem');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p3');
    });

    it('deve ser case-insensitive na busca', () => {
      store.getState().setSearchTerm('MASSAGEM');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(1);
    });

    it('deve combinar promocoes + search', () => {
      store.getState().setFilterPeriod('promocoes');
      store.getState().setSearchTerm('laser');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(1);
    });

    it('deve combinar promocoes + search sem resultado', () => {
      store.getState().setFilterPeriod('promocoes');
      store.getState().setSearchTerm('limp');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(0); // limpeza não é promoção
    });

    it('deve retornar vazio para busca sem match', () => {
      store.getState().setSearchTerm('zzzzz');
      expect(store.getState().getFilteredList()).toHaveLength(0);
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   PDV STORE
   ════════════════════════════════════════════════════════════════ */

describe('usePDVStore', () => {
  let store;

  const PRODUTOS_INICIAIS = [
    { id: 'prod1', nome: 'Protetor solar FPS 60', tipo: 'Produto', valor: 96.00, estoque: 15, imagem: '🧴' },
    { id: 'prod2', nome: 'Sérum vitamina C 30ml', tipo: 'Produto', valor: 189.00, estoque: 8, imagem: '✨' },
    { id: 'prod3', nome: 'Hidratante pós-peeling', tipo: 'Produto', valor: 145.00, estoque: 12, imagem: '🧊' },
    { id: 'prod4', nome: 'Máscara calmante', tipo: 'Produto', valor: 78.00, estoque: 20, imagem: '🎭' },
    { id: 'serv1', nome: 'Limpeza de pele', tipo: 'Serviço', valor: 180.00, duracao: '60min', imagem: '🧖' },
    { id: 'serv2', nome: 'Massagem relaxante', tipo: 'Serviço', valor: 200.00, duracao: '50min', imagem: '💆' },
    { id: 'serv3', nome: 'Peeling de diamante', tipo: 'Serviço', valor: 250.00, duracao: '45min', imagem: '💎' },
    { id: 'serv4', nome: 'Toxina botulínica', tipo: 'Serviço', valor: 890.00, duracao: '30min', imagem: '💉' },
    { id: 'serv5', nome: 'Drenagem linfática', tipo: 'Serviço', valor: 180.00, duracao: '60min', imagem: '🌊' },
    { id: 'prod5', nome: 'Luvas de nitrilo (cx)', tipo: 'Produto', valor: 45.00, estoque: 58, imagem: '🧤' },
    { id: 'prod6', nome: 'Condicionador capilar', tipo: 'Produto', valor: 62.00, estoque: 25, imagem: '🧴' },
  ];

  beforeEach(async () => {
    const mod = await import('../src/store/usePDVStore');
    store = resetStoreData(mod.usePDVStore, {
      cart: [],
      products: PRODUTOS_INICIAIS.map((p) => ({ ...p })),
      searchTerm: '',
      discount: { type: null, value: 0, label: '' },
      paymentMethod: 'credito',
      clientName: '',
      notes: '',
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 11 produtos/serviços', () => {
      expect(store.getState().products).toHaveLength(11);
    });

    it('deve ter carrinho vazio', () => {
      expect(store.getState().cart).toHaveLength(0);
    });

    it('deve ter método de pagamento padrão = credito', () => {
      expect(store.getState().paymentMethod).toBe('credito');
    });

    it('deve ter discount zerado', () => {
      expect(store.getState().discount).toEqual({ type: null, value: 0, label: '' });
    });

    it('deve ter clientName e notes vazios', () => {
      expect(store.getState().clientName).toBe('');
      expect(store.getState().notes).toBe('');
    });
  });

  /* ─── ADD TO CART ─── */

  describe('addToCart', () => {
    it('deve adicionar item ao carrinho com qty = 1', () => {
      const produto = store.getState().products[0];
      store.getState().addToCart(produto);
      const cart = store.getState().cart;
      expect(cart).toHaveLength(1);
      expect(cart[0].id).toBe('prod1');
      expect(cart[0].qty).toBe(1);
    });

    it('deve incrementar qty se item já existe no carrinho', () => {
      const produto = store.getState().products[1];
      store.getState().addToCart(produto);
      store.getState().addToCart(produto);
      const cart = store.getState().cart;
      expect(cart).toHaveLength(1);
      expect(cart[0].qty).toBe(2);
    });

    it('deve adicionar itens diferentes separadamente', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().addToCart(store.getState().products[2]);
      expect(store.getState().cart).toHaveLength(2);
    });

    it('deve manter dados do produto no carrinho (nome, valor, tipo)', () => {
      const produto = store.getState().products[3];
      store.getState().addToCart(produto);
      const item = store.getState().cart[0];
      expect(item.nome).toBe('Máscara calmante');
      expect(item.valor).toBe(78.00);
      expect(item.tipo).toBe('Produto');
    });
  });

  /* ─── REMOVE FROM CART ─── */

  describe('removeFromCart', () => {
    it('deve remover item do carrinho', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().addToCart(store.getState().products[1]);
      store.getState().removeFromCart('prod1');
      expect(store.getState().cart).toHaveLength(1);
      expect(store.getState().cart[0].id).toBe('prod2');
    });

    it('não deve quebrar ao remover item inexistente', () => {
      store.getState().addToCart(store.getState().products[0]);
      expect(() => store.getState().removeFromCart('inexistente')).not.toThrow();
      expect(store.getState().cart).toHaveLength(1);
    });
  });

  /* ─── UPDATE QTY ─── */

  describe('updateQty', () => {
    it('deve atualizar quantidade de um item', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().updateQty('prod1', 3);
      expect(store.getState().cart[0].qty).toBe(3);
    });

    it('deve remover item se qty <= 0', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().updateQty('prod1', 0);
      expect(store.getState().cart).toHaveLength(0);
    });

    it('deve remover item se qty negativa', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().updateQty('prod1', -1);
      expect(store.getState().cart).toHaveLength(0);
    });
  });

  /* ─── CLEAR CART ─── */

  describe('clearCart', () => {
    it('deve esvaziar carrinho', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().addToCart(store.getState().products[1]);
      store.getState().clearCart();
      expect(store.getState().cart).toHaveLength(0);
    });

    it('deve resetar discount', () => {
      store.getState().setDiscount({ type: 'porcentagem', value: 10, label: '10%' });
      store.getState().clearCart();
      expect(store.getState().discount).toEqual({ type: null, value: 0, label: '' });
    });

    it('deve resetar clientName e notes', () => {
      store.getState().setClientName('Maria');
      store.getState().setNotes('Cliente VIP');
      store.getState().clearCart();
      expect(store.getState().clientName).toBe('');
      expect(store.getState().notes).toBe('');
    });
  });

  /* ─── SETTERS ─── */

  describe('setters', () => {
    it('setDiscount deve atualizar desconto', () => {
      store.getState().setDiscount({ type: 'fixo', value: 50, label: 'R$ 50' });
      expect(store.getState().discount).toEqual({ type: 'fixo', value: 50, label: 'R$ 50' });
    });

    it('setPaymentMethod deve atualizar método', () => {
      store.getState().setPaymentMethod('pix');
      expect(store.getState().paymentMethod).toBe('pix');
    });

    it('setClientName deve atualizar nome do cliente', () => {
      store.getState().setClientName('João Silva');
      expect(store.getState().clientName).toBe('João Silva');
    });

    it('setNotes deve atualizar observações', () => {
      store.getState().setNotes('Desconto especial');
      expect(store.getState().notes).toBe('Desconto especial');
    });

    it('setSearchTerm deve atualizar termo de busca', () => {
      store.getState().setSearchTerm('protetor');
      expect(store.getState().searchTerm).toBe('protetor');
    });
  });

  /* ─── GET FILTERED PRODUCTS ─── */

  describe('getFilteredProducts', () => {
    it('deve retornar todos os produtos sem busca', () => {
      expect(store.getState().getFilteredProducts()).toHaveLength(11);
    });

    it('deve filtrar por nome', () => {
      store.getState().setSearchTerm('protetor');
      const result = store.getState().getFilteredProducts();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prod1');
    });

    it('deve filtrar por tipo', () => {
      store.getState().setSearchTerm('serviço');
      const result = store.getState().getFilteredProducts();
      expect(result).toHaveLength(5); // todos os serviços
      result.forEach((p) => expect(p.tipo).toBe('Serviço'));
    });

    it('deve ser case-insensitive', () => {
      store.getState().setSearchTerm('VITAMINA');
      const result = store.getState().getFilteredProducts();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prod2');
    });

    it('deve retornar vazio para busca sem match', () => {
      store.getState().setSearchTerm('zzzzz');
      expect(store.getState().getFilteredProducts()).toHaveLength(0);
    });
  });

  /* ─── GET CART TOTAL ─── */

  describe('getCartTotal', () => {
    it('deve retornar 0 para carrinho vazio', () => {
      expect(store.getState().getCartTotal()).toBe(0);
    });

    it('deve calcular subtotal sem desconto', () => {
      store.getState().addToCart(store.getState().products[0]); // 96.00
      store.getState().addToCart(store.getState().products[4]); // 180.00
      expect(store.getState().getCartTotal()).toBe(276.00);
    });

    it('deve aplicar desconto fixo', () => {
      store.getState().addToCart(store.getState().products[0]); // 96.00
      store.getState().setDiscount({ type: 'fixo', value: 20, label: 'R$ 20' });
      expect(store.getState().getCartTotal()).toBe(76.00);
    });

    it('não deve permitir total negativo', () => {
      store.getState().addToCart(store.getState().products[0]); // 96.00
      store.getState().setDiscount({ type: 'fixo', value: 200, label: 'R$ 200' });
      expect(store.getState().getCartTotal()).toBe(0);
    });

    it('deve considerar quantidades múltiplas', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().addToCart(store.getState().products[0]); // qty=2 → 96*2 = 192
      expect(store.getState().getCartTotal()).toBe(192.00);
    });
  });

  /* ─── GET CART SUMMARY ─── */

  describe('getCartSummary', () => {
    it('deve retornar subtotal, discount, total e itens', () => {
      store.getState().addToCart(store.getState().products[1]); // 189.00
      store.getState().addToCart(store.getState().products[2]); // 145.00
      store.getState().setDiscount({ type: 'fixo', value: 34, label: 'R$ 34' });
      const summary = store.getState().getCartSummary();
      expect(summary.subtotal).toBe(334.00);
      expect(summary.discount).toBe(34);
      expect(summary.total).toBe(300.00);
      expect(summary.itens).toBe(2);
    });

    it('deve contar itens totais (soma de qty)', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().addToCart(store.getState().products[0]); // qty=2
      store.getState().addToCart(store.getState().products[5]); // qty=1
      const summary = store.getState().getCartSummary();
      expect(summary.itens).toBe(3); // 2 + 1
    });

    it('deve ter subtotal 0 e itens 0 para carrinho vazio', () => {
      const summary = store.getState().getCartSummary();
      expect(summary.subtotal).toBe(0);
      expect(summary.itens).toBe(0);
      expect(summary.total).toBe(0);
    });
  });

  /* ─── FINALIZE SALE ─── */

  describe('finalizeSale', () => {
    it('deve retornar erro para carrinho vazio', () => {
      const result = store.getState().finalizeSale();
      expect(result.success).toBe(false);
      expect(result.error).toContain('vazio');
    });

    it('deve finalizar venda com sucesso', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().addToCart(store.getState().products[4]);
      store.getState().setClientName('Ana Souza');
      store.getState().setPaymentMethod('pix');
      store.getState().setNotes('Cliente regular');

      const result = store.getState().finalizeSale();
      expect(result.success).toBe(true);
      expect(result.sale).toBeDefined();
      expect(result.sale.itens).toHaveLength(2);
      expect(result.sale.clientName).toBe('Ana Souza');
      expect(result.sale.paymentMethod).toBe('pix');
      expect(result.sale.notes).toBe('Cliente regular');
    });

    it('deve limpar carrinho após finalizar', () => {
      store.getState().addToCart(store.getState().products[0]);
      store.getState().finalizeSale();
      const state = store.getState();
      expect(state.cart).toHaveLength(0);
      expect(state.clientName).toBe('');
      expect(state.discount).toEqual({ type: null, value: 0, label: '' });
    });

    it('deve gerar id, total e createdAt na venda', () => {
      store.getState().addToCart(store.getState().products[0]); // 96.00
      const result = store.getState().finalizeSale();
      expect(result.sale.id).toBeDefined();
      expect(typeof result.sale.id).toBe('string');
      expect(result.sale.total).toBe(96.00);
      expect(result.sale.createdAt).toBeDefined();
    });

    it('deve calcular total com desconto na finalização', () => {
      store.getState().addToCart(store.getState().products[0]); // 96.00
      store.getState().addToCart(store.getState().products[1]); // 189.00 = 285
      store.getState().setDiscount({ type: 'fixo', value: 85, label: 'R$ 85' });
      const result = store.getState().finalizeSale();
      expect(result.sale.total).toBe(200.00);
      expect(result.sale.discount).toBe(85);
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   BI STORE
   ════════════════════════════════════════════════════════════════ */

describe('useBIStore', () => {
  let store;

  beforeEach(async () => {
    const mod = await import('../src/store/useBIStore');
    store = resetStoreData(mod.useBIStore, {
      period: 'month',
      metrics: {
        receita: 86420,
        ticketMedio: 238,
        clientesAtivas: 328,
        sessoes: 362,
      },
      revenueData: [
        { month: 'Jan', revenue: 28500, pct: 69 },
        { month: 'Fev', revenue: 32000, pct: 78 },
        { month: 'Mar', revenue: 29800, pct: 72 },
        { month: 'Abr', revenue: 35600, pct: 86 },
        { month: 'Mai', revenue: 41200, pct: 90 },
        { month: 'Jun', revenue: 38900, pct: 85 },
        { month: 'Jul', revenue: 86420, pct: 100, today: true },
      ],
      servicesData: [
        { name: 'Limpeza de pele', pct: 100, value: '25%', cor: '#4C7A5E' },
        { name: 'Massagem', pct: 80, value: '20%', cor: '#6C5CE7' },
        { name: 'Botox', pct: 72, value: '18%', cor: '#9C7A3E' },
        { name: 'Maquiagem', pct: 60, value: '15%', cor: '#00B894' },
        { name: 'Laser', pct: 48, value: '12%', cor: '#B14E3D' },
        { name: 'Outros', pct: 40, value: '10%', cor: '#8A9186' },
      ],
      professionalsData: [
        { name: 'Dra. Camila', receita: 28450, atendimentos: 48, cor: '#6C5CE7' },
        { name: 'Fernanda', receita: 12800, atendimentos: 32, cor: '#00B894' },
        { name: 'Carlos', receita: 7200, atendimentos: 18, cor: '#FDCB6E' },
      ],
      growthData: [
        { mes: 'Fev', clientes: 10, receita: 32000 },
        { mes: 'Mar', clientes: 7, receita: 29800 },
        { mes: 'Abr', clientes: 14, receita: 35600 },
        { mes: 'Mai', clientes: 9, receita: 41200 },
        { mes: 'Jun', clientes: 12, receita: 38900 },
        { mes: 'Jul', clientes: 16, receita: 86420 },
      ],
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter period = month', () => {
      expect(store.getState().period).toBe('month');
    });

    it('deve ter métricas base (receita=86420, ticket=238, clientes=328, sessoes=362)', () => {
      const m = store.getState().metrics;
      expect(m.receita).toBe(86420);
      expect(m.ticketMedio).toBe(238);
      expect(m.clientesAtivas).toBe(328);
      expect(m.sessoes).toBe(362);
    });

    it('deve ter 7 meses de revenueData', () => {
      expect(store.getState().revenueData).toHaveLength(7);
    });

    it('deve ter 6 serviços em servicesData', () => {
      expect(store.getState().servicesData).toHaveLength(6);
    });

    it('deve ter 3 profissionais em professionalsData', () => {
      expect(store.getState().professionalsData).toHaveLength(3);
    });

    it('deve ter 6 meses de growthData', () => {
      expect(store.getState().growthData).toHaveLength(6);
    });
  });

  /* ─── SET PERIOD ─── */

  describe('setPeriod', () => {
    it('deve alterar period para month', () => {
      store.getState().setPeriod('month');
      expect(store.getState().period).toBe('month');
    });

    it('deve recalcular métricas para week (×0.23)', () => {
      store.getState().setPeriod('week');
      expect(store.getState().metrics.receita).toBe(Math.round(86420 * 0.23));
      expect(store.getState().metrics.sessoes).toBe(Math.round(362 * 0.23));
    });

    it('deve recalcular métricas para quarter (×3)', () => {
      store.getState().setPeriod('quarter');
      expect(store.getState().metrics.receita).toBe(Math.round(86420 * 3));
      expect(store.getState().metrics.sessoes).toBe(Math.round(362 * 3));
    });

    it('deve recalcular métricas para year (×12)', () => {
      store.getState().setPeriod('year');
      expect(store.getState().metrics.receita).toBe(Math.round(86420 * 12));
      expect(store.getState().metrics.sessoes).toBe(Math.round(362 * 12));
    });

    it('deve manter ticketMedio inalterado (238)', () => {
      store.getState().setPeriod('year');
      expect(store.getState().metrics.ticketMedio).toBe(238);
    });

    it('deve usar valores específicos para clientesAtivas por período', () => {
      store.getState().setPeriod('week');
      expect(store.getState().metrics.clientesAtivas).toBe(82);

      store.getState().setPeriod('year');
      expect(store.getState().metrics.clientesAtivas).toBe(1280);
    });

    it('deve usar valor padrão 328 para períodos não mapeados', () => {
      store.getState().setPeriod('month');
      expect(store.getState().metrics.clientesAtivas).toBe(328);

      store.getState().setPeriod('quarter');
      expect(store.getState().metrics.clientesAtivas).toBe(328);
    });
  });

  /* ─── GET PERIOD LABEL ─── */

  describe('getPeriodLabel', () => {
    it('deve retornar "Este mês" para month', () => {
      expect(store.getState().getPeriodLabel()).toBe('Este mês');
    });

    it('deve retornar "Esta semana" para week', () => {
      store.getState().setPeriod('week');
      expect(store.getState().getPeriodLabel()).toBe('Esta semana');
    });

    it('deve retornar "Este trimestre" para quarter', () => {
      store.getState().setPeriod('quarter');
      expect(store.getState().getPeriodLabel()).toBe('Este trimestre');
    });

    it('deve retornar "Este ano" para year', () => {
      store.getState().setPeriod('year');
      expect(store.getState().getPeriodLabel()).toBe('Este ano');
    });

    it('deve retornar "Este mês" para período desconhecido', () => {
      store.getState().setPeriod('desconhecido');
      expect(store.getState().getPeriodLabel()).toBe('Este mês');
    });
  });

  /* ─── METRICS ─── */

  describe('integridade dos dados', () => {
    it('revenueData deve ter pct máximo = 100 no mês atual', () => {
      const atual = store.getState().revenueData.find((r) => r.today);
      expect(atual).toBeDefined();
      expect(atual.pct).toBe(100);
    });

    it('servicesData deve ter pct entre 0 e 100', () => {
      store.getState().servicesData.forEach((s) => {
        expect(s.pct).toBeGreaterThanOrEqual(0);
        expect(s.pct).toBeLessThanOrEqual(100);
      });
    });

    it('servicesData deve estar ordenado por pct decrescente', () => {
      const data = store.getState().servicesData;
      for (let i = 1; i < data.length; i++) {
        expect(data[i - 1].pct).toBeGreaterThanOrEqual(data[i].pct);
      }
    });

    it('growthData deve ter clientes e receita positivos', () => {
      store.getState().growthData.forEach((g) => {
        expect(g.clientes).toBeGreaterThan(0);
        expect(g.receita).toBeGreaterThan(0);
      });
    });

    it('professionalsData deve ter cor definida para cada profissional', () => {
      store.getState().professionalsData.forEach((p) => {
        expect(p.cor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });
});
