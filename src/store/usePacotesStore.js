/** @format */

import { create } from 'zustand';
import { Helpers } from '../utils/helpers';

const initialState = {
  list: [
    { id: 'p1', nome: 'Limpeza facial', servico: 'Limpeza de pele', sessoes: 10, valor: 1600.00, validadeMeses: 12, ativos: 12, promocao: false, cor: '#4C7A5E' },
    { id: 'p2', nome: 'Peeling de diamante', servico: 'Peeling de diamante', sessoes: 6, valor: 1350.00, validadeMeses: 12, ativos: 8, promocao: false, cor: '#6C5CE7' },
    { id: 'p3', nome: 'Drenagem linfática', servico: 'Drenagem linfática', sessoes: 8, valor: 1280.00, validadeMeses: 12, ativos: 6, promocao: false, cor: '#00B894' },
    { id: 'p4', nome: 'Laser CO2 completo', servico: 'Laser CO2 fracionado', sessoes: 5, valor: 5400.00, validadeMeses: 12, ativos: 3, promocao: true, cor: '#B14E3D' },
    { id: 'p5', nome: 'Massagem relaxante', servico: 'Massagem relaxante', sessoes: 8, valor: 1100.00, validadeMeses: 6, ativos: 10, promocao: false, cor: '#9C7A3E' },
  ],
  filterPeriod: 'todos',
  searchTerm: '',
  nextId: 'p6',
  loading: false,
};

export const usePacotesStore = create((set, get) => ({
  ...initialState,

  getKPIs() {
    const list = get().list;
    const totalAtivos = list.length;
    const totalSessoes = list.reduce((sum, p) => sum + (p.ativos || 0) * (p.sessoes || 0), 0);
    const receitaPacotes = list.reduce((sum, p) => sum + (p.ativos || 0) * (p.valor || 0), 0);
    const ticketMedio = totalAtivos > 0 ? receitaPacotes / totalAtivos : 0;
    return { totalAtivos, totalSessoes, receitaPacotes, ticketMedio };
  },

  addPacote: (pacote) => {
    const state = get();
    pacote.id = state.nextId;
    pacote.ativos = 0;
    pacote.promocao = false;
    const num = parseInt(state.nextId.replace('p', ''), 10) + 1;
    set({ list: [...state.list, pacote], nextId: `p${num}` });
  },

  setFilterPeriod: (period) => set({ filterPeriod: period }),
  setSearchTerm: (term) => set({ searchTerm: term }),

  getFilteredList() {
    let list = get().list;
    const filter = get().filterPeriod;
    if (filter === 'promocoes') list = list.filter((p) => p.promocao);
    else if (filter === 'expirados') list = [];
    const term = get().searchTerm?.toLowerCase();
    if (term) list = list.filter((p) => p.nome.toLowerCase().includes(term) || p.servico?.toLowerCase().includes(term));
    return list;
  },
}));
