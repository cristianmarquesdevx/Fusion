/** @format */

import { create } from 'zustand';
import { FIDELIDADE_NIVEIS } from '../utils/constants';

const initialState = {
  niveis: FIDELIDADE_NIVEIS.map((n, i) => ({
    ...n,
    codigo: ['BRZ', 'PRT', 'OUR', 'PLT', 'DMT'][i] || '',
    beneficios: [
      'Acúmulo de pontos',
      'Desconto progressivo',
      'Prioridade de agendamento',
      'Acesso a eventos exclusivos',
      'Brinde de aniversário',
    ].slice(0, i + 1),
  })),
  clientes: [
    { id: '1', nome: 'Patrícia Nogueira', nivel: 'Diamante', pontos: 1050, ultima: 'Hoje, 14:30' },
    { id: '2', nome: 'Beatriz Lima', nivel: 'Platina', pontos: 620, ultima: 'Hoje, 12:15' },
    { id: '3', nome: 'Juliana Prado', nivel: 'Ouro', pontos: 350, ultima: 'Hoje, 11:30' },
    { id: '4', nome: 'Marina Costa', nivel: 'Ouro', pontos: 320, ultima: 'Hoje, 09:00' },
    { id: '5', nome: 'Renata Alves', nivel: 'Prata', pontos: 180, ultima: 'Hoje, 10:00' },
    { id: '6', nome: 'Larissa Teixeira', nivel: 'Bronze', pontos: 45, ultima: '18 de junho' },
    { id: '7', nome: 'Camila Ferreira', nivel: 'Bronze', pontos: 20, ultima: '22 de junho' },
    { id: '8', nome: 'Sofia Ribeiro', nivel: 'Prata', pontos: 120, ultima: '15 de junho' },
  ],
  totalPontos: 18420,
  resgateMes: 3240,
  ticketMedio: 312,
  searchTerm: '',
  activeFilter: null,
  loading: false,
};

export const useFidelidadeStore = create((set, get) => ({
  ...initialState,

  getDistribuicao() {
    const dist = {};
    get().niveis.forEach((n) => { dist[n.nome] = 0; });
    get().clientes.forEach((c) => {
      if (dist.hasOwnProperty(c.nivel)) dist[c.nivel]++;
    });
    return dist;
  },

  getTopClientes() {
    return [...get().clientes].sort((a, b) => b.pontos - a.pontos);
  },

  getNivelByPontos(pontos) {
    const niveis = get().niveis;
    for (let i = niveis.length - 1; i >= 0; i--) {
      if (pontos >= niveis[i].pontosMin) return niveis[i];
    }
    return niveis[0];
  },

  addPontos: (clienteId, pontos) => {
    const state = get();
    const cliente = state.clientes.find((c) => c.id === clienteId);
    if (!cliente) return;
    const novosPontos = cliente.pontos + pontos;
    const novoNivel = state.getNivelByPontos(novosPontos);
    set({
      clientes: state.clientes.map((c) =>
        c.id === clienteId
          ? { ...c, pontos: novosPontos, nivel: novoNivel.nome }
          : c
      ),
      totalPontos: state.totalPontos + pontos,
    });
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setActiveFilter: (filter) => set({ activeFilter: filter }),

  getFilteredClientes() {
    let list = get().clientes;
    const term = get().searchTerm?.toLowerCase();
    if (term) {
      list = list.filter((c) => c.nome.toLowerCase().includes(term));
    }
    if (get().activeFilter) {
      list = list.filter((c) => c.nivel === get().activeFilter);
    }
    return list;
  },
}));
