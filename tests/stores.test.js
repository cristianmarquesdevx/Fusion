/** @format */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Helper: reseta apenas as propriedades de dados da store,
// preservando as actions (setSearchTerm, setFilter, addTransacao, etc.)
// que são definidas no objeto retornado por create().
const resetStoreData = (store, data) => {
  store.setState(data);
  return store;
};

/* ════════════════════════════════════════════════════════════════
   FINANCEIRO STORE
   ════════════════════════════════════════════════════════════════ */

describe('useFinanceiroStore', () => {
  let store;

  // Standard initial data
  const TRANSACOES_INICIAIS = [
    { id: '1', descricao: 'Sessão · Juliana Prado', categoria: 'Procedimento', data: '30/06', valor: 890.00, tipo: 'receita', status: 'Pago', formaPagamento: 'Crédito', observacoes: '' },
    { id: '2', descricao: 'Compra de insumos · Distribuidora Bela Pele', categoria: 'Estoque', data: '29/06', valor: 2340.00, tipo: 'despesa', status: 'Pago', formaPagamento: 'PIX', observacoes: 'NF 4521' },
    { id: '3', descricao: 'Sessão · Beatriz Lima', categoria: 'Procedimento', data: '30/06', valor: 180.00, tipo: 'receita', status: 'Pendente', formaPagamento: '', observacoes: '' },
    { id: '4', descricao: 'Comissão · Dra. Camila', categoria: 'Comissão', data: '28/06', valor: 1120.00, tipo: 'despesa', status: 'A pagar', formaPagamento: '', observacoes: 'Ref. junho' },
    { id: '5', descricao: 'Plano recorrente · Renata Alves', categoria: 'Assinatura', data: '27/06', valor: 349.00, tipo: 'receita', status: 'Pago', formaPagamento: 'Débito automático', observacoes: '' },
  ];

  const KPIS_INICIAIS = {
    receita: { valor: 86420, tendencia: 9, label: 'Receita do mês', descricao: '+9% vs. maio' },
    despesas: { valor: 31150, tendencia: -3, label: 'Despesas do mês', descricao: '-3% vs. maio' },
    lucro: { valor: 55270, tendencia: 14, label: 'Lucro líquido', descricao: '+14% vs. maio' },
    comissoes: { valor: 8940, tendencia: 0, label: 'Comissões a pagar', descricao: 'Fecha em 5 dias' },
  };

  beforeEach(async () => {
    const mod = await import('../src/store/useFinanceiroStore');
    store = resetStoreData(mod.useFinanceiroStore, {
      transacoes: [...TRANSACOES_INICIAIS],
      searchTerm: '',
      activeFilters: {},
      nextId: 6,
      kpis: { ...KPIS_INICIAIS,
        receita: { ...KPIS_INICIAIS.receita },
        despesas: { ...KPIS_INICIAIS.despesas },
        lucro: { ...KPIS_INICIAIS.lucro },
        comissoes: { ...KPIS_INICIAIS.comissoes },
      },
      filterOptions: {
        tipo: [{ label: 'Receita', value: 'receita' }, { label: 'Despesa', value: 'despesa' }],
        status: [{ label: 'Pago', value: 'Pago' }, { label: 'Pendente', value: 'Pendente' }, { label: 'A pagar', value: 'A pagar' }],
        categoria: [{ label: 'Procedimento', value: 'Procedimento' }, { label: 'Estoque', value: 'Estoque' }, { label: 'Comissão', value: 'Comissão' }, { label: 'Assinatura', value: 'Assinatura' }],
      },
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 5 transações iniciais', () => {
      expect(store.getState().transacoes).toHaveLength(5);
    });

    it('deve ter 4 KPIs iniciais', () => {
      const kpis = store.getState().kpis;
      expect(kpis.receita.valor).toBe(86420);
      expect(kpis.despesas.valor).toBe(31150);
      expect(kpis.lucro.valor).toBe(55270);
      expect(kpis.comissoes.valor).toBe(8940);
    });

    it('deve ter filterOptions com 3 grupos', () => {
      const opts = store.getState().filterOptions;
      expect(opts.tipo).toHaveLength(2);
      expect(opts.status).toHaveLength(3);
      expect(opts.categoria).toHaveLength(4);
    });

    it('deve iniciar com nextId = 6', () => {
      expect(store.getState().nextId).toBe(6);
    });

    it('deve iniciar com searchTerm vazio e activeFilters vazio', () => {
      expect(store.getState().searchTerm).toBe('');
      expect(store.getState().activeFilters).toEqual({});
    });
  });

  /* ─── SEARCH ─── */

  describe('setSearchTerm', () => {
    it('deve atualizar o searchTerm', () => {
      store.getState().setSearchTerm('comissão');
      expect(store.getState().searchTerm).toBe('comissão');
    });

    it('deve aceitar string vazia para limpar busca', () => {
      store.getState().setSearchTerm('termo qualquer');
      expect(store.getState().searchTerm).toBe('termo qualquer');
      store.getState().setSearchTerm('');
      expect(store.getState().searchTerm).toBe('');
    });
  });

  /* ─── FILTROS ─── */

  describe('filtros (setFilter / clearFilters)', () => {
    it('deve definir um filtro ativo', () => {
      store.getState().setFilter('tipo', 'receita');
      expect(store.getState().activeFilters).toEqual({ tipo: 'receita' });
    });

    it('deve remover um filtro ao passar null/undefined', () => {
      store.getState().setFilter('tipo', 'receita');
      store.getState().setFilter('status', 'Pago');
      expect(Object.keys(store.getState().activeFilters)).toHaveLength(2);

      store.getState().setFilter('tipo', null);
      expect(store.getState().activeFilters).toEqual({ status: 'Pago' });
    });

    it('deve limpar todos os filtros com clearFilters', () => {
      store.getState().setFilter('tipo', 'despesa');
      store.getState().setFilter('categoria', 'Comissão');
      store.getState().clearFilters();
      expect(store.getState().activeFilters).toEqual({});
    });

    it('deve suportar múltiplos filtros simultâneos', () => {
      store.getState().setFilter('tipo', 'receita');
      store.getState().setFilter('status', 'Pago');
      store.getState().setFilter('categoria', 'Procedimento');
      expect(store.getState().activeFilters).toEqual({
        tipo: 'receita',
        status: 'Pago',
        categoria: 'Procedimento',
      });
    });
  });

  /* ─── GET FILTERED TRANSACOES ─── */

  describe('getFilteredTransacoes', () => {
    it('deve retornar todas as transações sem filtros', () => {
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(5);
    });

    it('deve filtrar por searchTerm (descricao)', () => {
      store.getState().setSearchTerm('comissão');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(1);
      expect(result[0].descricao).toContain('Comissão');
    });

    it('deve filtrar por searchTerm (categoria)', () => {
      store.getState().setSearchTerm('estoque');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(1);
      expect(result[0].categoria).toBe('Estoque');
    });

    it('deve filtrar por searchTerm (status)', () => {
      store.getState().setSearchTerm('pendente');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Pendente');
    });

    it('deve filtrar por tipo', () => {
      store.getState().setFilter('tipo', 'receita');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(3);
      result.forEach((t) => expect(t.tipo).toBe('receita'));
    });

    it('deve filtrar por despesa', () => {
      store.getState().setFilter('tipo', 'despesa');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(2);
      result.forEach((t) => expect(t.tipo).toBe('despesa'));
    });

    it('deve filtrar por status', () => {
      store.getState().setFilter('status', 'Pendente');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('Pendente');
    });

    it('deve filtrar por categoria', () => {
      store.getState().setFilter('categoria', 'Assinatura');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(1);
      expect(result[0].categoria).toBe('Assinatura');
    });

    it('deve combinar searchTerm + filtro tipo', () => {
      store.getState().setSearchTerm('sessão');
      store.getState().setFilter('tipo', 'receita');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(2);
      result.forEach((t) => {
        expect(t.tipo).toBe('receita');
        expect(t.descricao.toLowerCase()).toContain('sessão');
      });
    });

    it('deve retornar lista vazia se nada corresponder', () => {
      store.getState().setSearchTerm('zzzzzzzz');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(0);
    });

    it('deve ordenar por data decrescente (mais recente primeiro)', () => {
      const result = store.getState().getFilteredTransacoes();
      for (let i = 1; i < result.length; i++) {
        const [dPrev, mPrev] = result[i - 1].data.split('/').map(Number);
        const [dCurr, mCurr] = result[i].data.split('/').map(Number);
        const valPrev = mPrev * 100 + dPrev;
        const valCurr = mCurr * 100 + dCurr;
        expect(valPrev).toBeGreaterThanOrEqual(valCurr);
      }
    });

    it('deve ser case-insensitive na busca', () => {
      store.getState().setSearchTerm('COMISSÃO');
      const result = store.getState().getFilteredTransacoes();
      expect(result).toHaveLength(1);
    });
  });

  /* ─── ADD TRANSACAO ─── */

  describe('addTransacao', () => {
    it('deve adicionar nova transação com id incremental', () => {
      store.getState().addTransacao({
        descricao: 'Nova consulta',
        categoria: 'Procedimento',
        data: '01/07',
        valor: 250.00,
        tipo: 'receita',
        status: 'Pago',
        formaPagamento: 'Dinheiro',
        observacoes: '',
      });

      const transacoes = store.getState().transacoes;
      expect(transacoes).toHaveLength(6);
      expect(transacoes[5].id).toBe('6');
      expect(transacoes[5].descricao).toBe('Nova consulta');
      expect(store.getState().nextId).toBe(7);
    });

    it('deve recalcular KPIs após adicionar receita', () => {
      store.getState().addTransacao({
        descricao: 'Venda produto',
        categoria: 'Produto',
        data: '01/07',
        valor: 500.00,
        tipo: 'receita',
        status: 'Pago',
      });

      // Receita original: 890 + 180 + 349 = 1419
      // Nova receita: 1419 + 500 = 1919
      expect(store.getState().kpis.receita.valor).toBe(1919);
    });

    it('deve recalcular KPIs após adicionar despesa', () => {
      store.getState().addTransacao({
        descricao: 'Aluguel',
        categoria: 'Fixo',
        data: '01/07',
        valor: 3000.00,
        tipo: 'despesa',
        status: 'A pagar',
      });

      // Despesa original: 2340 + 1120 = 3460
      // Nova despesa: 3460 + 3000 = 6460
      expect(store.getState().kpis.despesas.valor).toBe(6460);
    });

    it('deve recalcular lucro (receitas - despesas)', () => {
      store.getState().addTransacao({
        descricao: 'Receita extra',
        categoria: 'Outros',
        data: '01/07',
        valor: 1000.00,
        tipo: 'receita',
        status: 'Pago',
      });

      const { kpis } = store.getState();
      expect(kpis.lucro.valor).toBe(kpis.receita.valor - kpis.despesas.valor);
    });

    it('deve manter formato dos campos obrigatórios', () => {
      store.getState().addTransacao({
        descricao: 'Teste',
        categoria: 'Procedimento',
        data: '01/07',
        valor: 100,
        tipo: 'receita',
        status: 'Pendente',
      });

      const nova = store.getState().transacoes[5];
      expect(nova).toHaveProperty('id');
      expect(nova).toHaveProperty('descricao');
      expect(nova).toHaveProperty('categoria');
      expect(nova).toHaveProperty('valor');
      expect(nova).toHaveProperty('tipo');
      expect(nova).toHaveProperty('status');
    });
  });

  /* ─── GET RESUMO ─── */

  describe('getResumo', () => {
    it('deve retornar total de transações, receitas e despesas', () => {
      const resumo = store.getState().getResumo();
      expect(resumo.totalTransacoes).toBe(5);
      expect(resumo.totalReceitas).toBe(890 + 180 + 349); // 1419
      expect(resumo.totalDespesas).toBe(2340 + 1120); // 3460
    });

    it('deve contar transações pendentes (Pendente + A pagar)', () => {
      const resumo = store.getState().getResumo();
      expect(resumo.pendentes).toBe(2); // Beatriz (Pendente) + Comissão (A pagar)
    });

    it('deve refletir mudanças após adicionar transação', () => {
      store.getState().addTransacao({
        descricao: 'Nova',
        categoria: 'Outros',
        data: '01/07',
        valor: 200,
        tipo: 'receita',
        status: 'Pendente',
      });

      const resumo = store.getState().getResumo();
      expect(resumo.totalTransacoes).toBe(6);
      expect(resumo.totalReceitas).toBe(1419 + 200);
      expect(resumo.pendentes).toBe(3); // +1 pendente
    });
  });

  /* ─── FILTER OPTIONS ─── */

  describe('filterOptions', () => {
    it('deve ter estrutura imutável (grupos predefinidos)', () => {
      const { filterOptions } = store.getState();
      expect(filterOptions.tipo).toBeDefined();
      expect(filterOptions.status).toBeDefined();
      expect(filterOptions.categoria).toBeDefined();
    });

    it('cada opção deve ter label e value', () => {
      const { filterOptions } = store.getState();
      Object.values(filterOptions).forEach((group) => {
        group.forEach((opt) => {
          expect(opt).toHaveProperty('label');
          expect(opt).toHaveProperty('value');
        });
      });
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   ESTOQUE STORE
   ════════════════════════════════════════════════════════════════ */

describe('useEstoqueStore', () => {
  let store;
  let initialItems;

  beforeEach(async () => {
    const mod = await import('../src/store/useEstoqueStore');
    initialItems = [
      { id: 'item1', nome: 'Toxina botulínica 100U', categoria: 'Injetáveis', qtd: 2, minimo: 5, unidade: 'un.', valorUnit: 890 },
      { id: 'item2', nome: 'Ácido hialurônico 1ml', categoria: 'Injetáveis', qtd: 3, minimo: 8, unidade: 'un.', valorUnit: 450 },
      { id: 'item3', nome: 'Máscara pós-peeling', categoria: 'Descartáveis', qtd: 14, minimo: 20, unidade: 'un.', valorUnit: 12 },
      { id: 'item4', nome: 'Sérum vitamina C 30ml', categoria: 'Cosméticos', qtd: 42, minimo: 15, unidade: 'un.', valorUnit: 89 },
      { id: 'item5', nome: 'Luvas de nitrilo (cx.)', categoria: 'Descartáveis', qtd: 58, minimo: 20, unidade: 'cx.', valorUnit: 35 },
      { id: 'item6', nome: 'Ponteira de laser CO2', categoria: 'Equipamentos', qtd: 6, minimo: 4, unidade: 'un.', valorUnit: 1200 },
    ];
    store = resetStoreData(mod.useEstoqueStore, {
      items: initialItems.map((i) => ({ ...i })),
      entries: [],
      searchTerm: '',
      activeFilters: {},
      categorias: ['Injetáveis', 'Descartáveis', 'Cosméticos', 'Equipamentos', 'Outros'],
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 6 itens iniciais', () => {
      expect(store.getState().items).toHaveLength(6);
    });

    it('deve iniciar com entries vazio', () => {
      expect(store.getState().entries).toHaveLength(0);
    });

    it('deve ter 5 categorias', () => {
      expect(store.getState().categorias).toHaveLength(5);
      expect(store.getState().categorias).toContain('Injetáveis');
      expect(store.getState().categorias).toContain('Outros');
    });

    it('cada item deve ter id, nome, categoria, qtd e minimo', () => {
      store.getState().items.forEach((item) => {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('nome');
        expect(item).toHaveProperty('categoria');
        expect(typeof item.qtd).toBe('number');
        expect(typeof item.minimo).toBe('number');
      });
    });
  });

  /* ─── SEARCH ─── */

  describe('setSearchTerm', () => {
    it('deve atualizar searchTerm', () => {
      store.getState().setSearchTerm('toxina');
      expect(store.getState().searchTerm).toBe('toxina');
    });

    it('deve limpar searchTerm com string vazia', () => {
      store.getState().setSearchTerm('laser');
      store.getState().setSearchTerm('');
      expect(store.getState().searchTerm).toBe('');
    });
  });

  /* ─── FILTERS ─── */

  describe('filtros (setFilter / clearFilters)', () => {
    it('deve definir filtro de categoria', () => {
      store.getState().setFilter('categoria', 'Injetáveis');
      expect(store.getState().activeFilters.categoria).toBe('Injetáveis');
    });

    it('deve definir filtro de status', () => {
      store.getState().setFilter('status', 'critico');
      expect(store.getState().activeFilters.status).toBe('critico');
    });

    it('deve remover filtro ao passar null', () => {
      store.getState().setFilter('categoria', 'Cosméticos');
      store.getState().setFilter('categoria', null);
      expect(store.getState().activeFilters).toEqual({});
    });

    it('deve limpar todos os filtros', () => {
      store.getState().setFilter('categoria', 'Descartáveis');
      store.getState().setFilter('status', 'normal');
      store.getState().clearFilters();
      expect(store.getState().activeFilters).toEqual({});
    });
  });

  /* ─── GET FILTERED ITEMS ─── */

  describe('getFilteredItems', () => {
    it('deve retornar todos os itens sem filtros', () => {
      expect(store.getState().getFilteredItems()).toHaveLength(6);
    });

    it('deve filtrar por nome (case-insensitive)', () => {
      store.getState().setSearchTerm('TOXINA');
      const result = store.getState().getFilteredItems();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item1');
    });

    it('deve filtrar por categoria', () => {
      store.getState().setSearchTerm('injetáveis');
      const result = store.getState().getFilteredItems();
      expect(result).toHaveLength(2);
      result.forEach((i) => expect(i.categoria).toBe('Injetáveis'));
    });

    it('deve filtrar por categoria via filtro ativo', () => {
      store.getState().setFilter('categoria', 'Descartáveis');
      const result = store.getState().getFilteredItems();
      expect(result).toHaveLength(2); // Máscara + Luvas
    });

    it('deve filtrar status "critico" (qtd < minimo * 0.5)', () => {
      store.getState().setFilter('status', 'critico');
      const result = store.getState().getFilteredItems();
      // item1: 2/5 = 0.4 < 0.5 → critico
      // item2: 3/8 = 0.375 < 0.5 → critico
      expect(result).toHaveLength(2);
      expect(result.map((i) => i.id)).toEqual(['item1', 'item2']);
    });

    it('deve filtrar status "baixo" (qtd >= minimo * 0.5 e < minimo)', () => {
      store.getState().setFilter('status', 'baixo');
      const result = store.getState().getFilteredItems();
      // item3: 14/20 = 0.7 → baixo
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item3');
    });

    it('deve filtrar status "normal" (qtd >= minimo)', () => {
      store.getState().setFilter('status', 'normal');
      const result = store.getState().getFilteredItems();
      // item4: 42 >= 15, item5: 58 >= 20, item6: 6 >= 4
      expect(result).toHaveLength(3);
    });

    it('deve combinar busca + filtro categoria + filtro status', () => {
      store.getState().setSearchTerm('vitamina');
      store.getState().setFilter('categoria', 'Cosméticos');
      store.getState().setFilter('status', 'normal');
      const result = store.getState().getFilteredItems();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('item4');
    });

    it('deve retornar lista vazia se nada corresponder', () => {
      store.getState().setSearchTerm('zzzzzzz');
      expect(store.getState().getFilteredItems()).toHaveLength(0);
    });
  });

  /* ─── ADD ENTRADA ─── */

  describe('addEntrada', () => {
    it('deve adicionar entrada no log', () => {
      store.getState().addEntrada({
        itemId: 'item1',
        quantidade: 5,
        valorUnitario: 890,
        fornecedor: 'Fornecedor A',
      });

      expect(store.getState().entries).toHaveLength(1);
      expect(store.getState().entries[0].itemId).toBe('item1');
      expect(store.getState().entries[0].quantidade).toBe(5);
    });

    it('deve gerar id e createdAt para a entrada', () => {
      store.getState().addEntrada({
        itemId: 'item2',
        quantidade: 3,
        valorUnitario: 450,
      });

      const entry = store.getState().entries[0];
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('createdAt');
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(5);
    });

    it('deve atualizar a quantidade do item correspondente', () => {
      const qtdAntes = store.getState().items.find((i) => i.id === 'item1').qtd;
      store.getState().addEntrada({ itemId: 'item1', quantidade: 5 });
      const qtdDepois = store.getState().items.find((i) => i.id === 'item1').qtd;
      expect(qtdDepois).toBe(qtdAntes + 5);
    });

    it('não deve alterar quantidade de outros itens', () => {
      const qtdOriginal = store.getState().items.find((i) => i.id === 'item2').qtd;
      store.getState().addEntrada({ itemId: 'item1', quantidade: 10 });
      const qtdInalterada = store.getState().items.find((i) => i.id === 'item2').qtd;
      expect(qtdInalterada).toBe(qtdOriginal);
    });

    it('deve preservar entradas anteriores ao adicionar nova', () => {
      store.getState().addEntrada({ itemId: 'item1', quantidade: 5 });
      store.getState().addEntrada({ itemId: 'item2', quantidade: 3 });
      expect(store.getState().entries).toHaveLength(2);
    });
  });

  /* ─── UPDATE QUANTIDADE ─── */

  describe('updateQuantidade', () => {
    it('deve adicionar quantidade positiva ao item', () => {
      store.getState().updateQuantidade('item3', 10);
      expect(store.getState().items.find((i) => i.id === 'item3').qtd).toBe(24);
    });

    it('deve subtrair quantidade negativa', () => {
      store.getState().updateQuantidade('item4', -5);
      expect(store.getState().items.find((i) => i.id === 'item4').qtd).toBe(37);
    });

    it('não deve permitir quantidade negativa (floor em 0)', () => {
      store.getState().updateQuantidade('item1', -10);
      expect(store.getState().items.find((i) => i.id === 'item1').qtd).toBe(0);
    });

    it('não deve quebrar ao atualizar item inexistente', () => {
      expect(() => {
        store.getState().updateQuantidade('inexistente', 5);
      }).not.toThrow();
    });

    it('deve funcionar com zero (sem alteração)', () => {
      const qtdAntes = store.getState().items.find((i) => i.id === 'item5').qtd;
      store.getState().updateQuantidade('item5', 0);
      expect(store.getState().items.find((i) => i.id === 'item5').qtd).toBe(qtdAntes);
    });
  });

  /* ─── GET RESUMO ─── */

  describe('getResumo', () => {
    it('deve contar total de itens', () => {
      expect(store.getState().getResumo().total).toBe(6);
    });

    it('deve contar itens críticos (qtd < minimo * 0.5)', () => {
      const resumo = store.getState().getResumo();
      // item1: 2 < 2.5 → crítico, item2: 3 < 4 → crítico
      expect(resumo.criticos).toBe(2);
    });

    it('deve contar itens baixos (qtd >= minimo * 0.5 e qtd < minimo)', () => {
      const resumo = store.getState().getResumo();
      // item3: 14 >= 10 e 14 < 20 → baixo
      expect(resumo.baixos).toBe(1);
    });

    it('deve contar itens normais (qtd >= minimo)', () => {
      const resumo = store.getState().getResumo();
      // item4: 42 >= 15, item5: 58 >= 20, item6: 6 >= 4
      expect(resumo.normais).toBe(3);
    });

    it('deve refletir entradas registradas', () => {
      const resumoAntes = store.getState().getResumo();
      expect(resumoAntes.totalEntradas).toBe(0);

      store.getState().addEntrada({ itemId: 'item1', quantidade: 5 });
      expect(store.getState().getResumo().totalEntradas).toBe(1);
    });

    it('deve atualizar contagens após entrada de estoque', () => {
      // item2 é crítico (3 / 8 = 37.5%)
      store.getState().addEntrada({ itemId: 'item2', quantidade: 10 });
      // agora item2 tem 13, que é >= 8 → normal
      const resumo = store.getState().getResumo();
      expect(resumo.criticos).toBe(1); // só item1
      expect(resumo.normais).toBe(4); // item2 agora normal
    });
  });

  /* ─── GET ITEM BY ID ─── */

  describe('getItemById', () => {
    it('deve retornar item pelo ID', () => {
      const item = store.getState().getItemById('item3');
      expect(item).toBeDefined();
      expect(item.nome).toContain('Máscara');
    });

    it('deve retornar undefined para ID inexistente', () => {
      const item = store.getState().getItemById('nao-existe');
      expect(item).toBeUndefined();
    });

    it('deve refletir atualizações de quantidade', () => {
      store.getState().addEntrada({ itemId: 'item6', quantidade: 2 });
      const item = store.getState().getItemById('item6');
      expect(item.qtd).toBe(8);
    });
  });

  /* ─── CATEGORIAS ─── */

  describe('categorias', () => {
    it('deve ter categorias disponíveis', () => {
      expect(store.getState().categorias).toContain('Injetáveis');
      expect(store.getState().categorias).toContain('Descartáveis');
      expect(store.getState().categorias).toContain('Cosméticos');
      expect(store.getState().categorias).toContain('Equipamentos');
      expect(store.getState().categorias).toContain('Outros');
    });
  });

  /* ─── EDGE CASES ─── */

  describe('edge cases', () => {
    it('deve lidar com busca por termo que não está em nome nem categoria', () => {
      store.getState().setSearchTerm('fornecedor');
      expect(store.getState().getFilteredItems()).toHaveLength(0);
    });

    it('deve retornar itens ordenados por inserção (não embaralhar)', () => {
      const result = store.getState().getFilteredItems();
      expect(result[0].id).toBe('item1');
      expect(result[5].id).toBe('item6');
    });

    it('addEntrada com quantidade zero não deve alterar estoque', () => {
      const qtdAntes = store.getState().items.find((i) => i.id === 'item4').qtd;
      store.getState().addEntrada({ itemId: 'item4', quantidade: 0 });
      expect(store.getState().items.find((i) => i.id === 'item4').qtd).toBe(qtdAntes);
      expect(store.getState().entries).toHaveLength(1);
    });
  });
});
