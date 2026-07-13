/** @format */

/**
 * Fusion ERP v2 — Store do Módulo Financeiro
 */

import { create } from 'zustand';

const initialTransactions = [
  { id: '1', descricao: 'Sessão · Juliana Prado', categoria: 'Procedimento', data: '30/06', valor: 890.00, tipo: 'receita', status: 'Pago', formaPagamento: 'Crédito', observacoes: '' },
  { id: '2', descricao: 'Compra de insumos · Distribuidora Bela Pele', categoria: 'Estoque', data: '29/06', valor: 2340.00, tipo: 'despesa', status: 'Pago', formaPagamento: 'PIX', observacoes: 'NF 4521' },
  { id: '3', descricao: 'Sessão · Beatriz Lima', categoria: 'Procedimento', data: '30/06', valor: 180.00, tipo: 'receita', status: 'Pendente', formaPagamento: '', observacoes: '' },
  { id: '4', descricao: 'Comissão · Dra. Camila', categoria: 'Comissão', data: '28/06', valor: 1120.00, tipo: 'despesa', status: 'A pagar', formaPagamento: '', observacoes: 'Ref. junho' },
  { id: '5', descricao: 'Plano recorrente · Renata Alves', categoria: 'Assinatura', data: '27/06', valor: 349.00, tipo: 'receita', status: 'Pago', formaPagamento: 'Débito automático', observacoes: '' },
];

const kpisIniciais = {
  receita: { valor: 86420, tendencia: 9, label: 'Receita do mês', descricao: '+9% vs. maio' },
  despesas: { valor: 31150, tendencia: -3, label: 'Despesas do mês', descricao: '-3% vs. maio' },
  lucro: { valor: 55270, tendencia: 14, label: 'Lucro líquido', descricao: '+14% vs. maio' },
  comissoes: { valor: 8940, tendencia: 0, label: 'Comissões a pagar', descricao: 'Fecha em 5 dias' },
};

const filterOptions = {
  tipo: [
    { label: 'Receita', value: 'receita' },
    { label: 'Despesa', value: 'despesa' },
  ],
  status: [
    { label: 'Pago', value: 'Pago' },
    { label: 'Pendente', value: 'Pendente' },
    { label: 'A pagar', value: 'A pagar' },
  ],
  categoria: [
    { label: 'Procedimento', value: 'Procedimento' },
    { label: 'Estoque', value: 'Estoque' },
    { label: 'Comissão', value: 'Comissão' },
    { label: 'Assinatura', value: 'Assinatura' },
  ],
};

export const useFinanceiroStore = create((set, get) => ({
  transacoes: initialTransactions,
  searchTerm: '',
  activeFilters: {},
  nextId: 6,
  kpis: kpisIniciais,
  filterOptions,

  setSearchTerm: (term) => set({ searchTerm: term }),

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: value
        ? { ...state.activeFilters, [key]: value }
        : Object.fromEntries(Object.entries(state.activeFilters).filter(([k]) => k !== key)),
    })),

  clearFilters: () => set({ activeFilters: {} }),

  addTransacao: (transacao) =>
    set((state) => {
      const newId = String(state.nextId);
      const nova = { id: newId, ...transacao };
      const receitas = [...state.transacoes, nova]
        .filter((t) => t.tipo === 'receita')
        .reduce((sum, t) => sum + t.valor, 0);
      const despesas = [...state.transacoes, nova]
        .filter((t) => t.tipo === 'despesa')
        .reduce((sum, t) => sum + t.valor, 0);
      return {
        transacoes: [...state.transacoes, nova],
        nextId: state.nextId + 1,
        kpis: {
          ...state.kpis,
          receita: { ...state.kpis.receita, valor: receitas },
          despesas: { ...state.kpis.despesas, valor: despesas },
          lucro: { ...state.kpis.lucro, valor: receitas - despesas },
        },
      };
    }),

  getFilteredTransacoes: () => {
    const { transacoes, searchTerm, activeFilters } = get();
    let filtered = [...transacoes];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (t) =>
          t.descricao.toLowerCase().includes(term) ||
          t.categoria.toLowerCase().includes(term) ||
          t.status.toLowerCase().includes(term)
      );
    }

    if (activeFilters.tipo) {
      filtered = filtered.filter((t) => t.tipo === activeFilters.tipo);
    }
    if (activeFilters.status) {
      filtered = filtered.filter((t) => t.status === activeFilters.status);
    }
    if (activeFilters.categoria) {
      filtered = filtered.filter((t) => t.categoria === activeFilters.categoria);
    }

    return filtered.sort((a, b) => {
      const [dA, mA] = a.data.split('/').map(Number);
      const [dB, mB] = b.data.split('/').map(Number);
      return (mB * 100 + dB) - (mA * 100 + dA);
    });
  },

  getResumo: () => {
    const { transacoes } = get();
    const receitas = transacoes.filter((t) => t.tipo === 'receita');
    const despesas = transacoes.filter((t) => t.tipo === 'despesa');
    const pendentes = transacoes.filter((t) => t.status === 'Pendente' || t.status === 'A pagar');
    return {
      totalTransacoes: transacoes.length,
      totalReceitas: receitas.reduce((s, t) => s + t.valor, 0),
      totalDespesas: despesas.reduce((s, t) => s + t.valor, 0),
      pendentes: pendentes.length,
    };
  },
}));
