/** @format */

import { create } from 'zustand';
import { Helpers } from '../utils/helpers';

const initialState = {
  list: [
    { id: 'l1', nome: 'Larissa Teixeira', tel: '(11) 96652-3398', servico: 'Toxina botulínica', preferencia: 'Manhã', desde: '28/06' },
    { id: 'l2', nome: 'Rafael Gomes', tel: '(11) 95551-2222', servico: 'Limpeza de pele', preferencia: 'Qualquer horário', desde: '29/06' },
    { id: 'l3', nome: 'Sofia Ribeiro', tel: '(11) 94443-3333', servico: 'Massagem relaxante', preferencia: 'Tarde', desde: '29/06' },
    { id: 'l4', nome: 'Tais Ferreira', tel: '(11) 93332-4444', servico: 'Peeling de diamante', preferencia: 'Manhã', desde: '30/06' },
    { id: 'l5', nome: 'Bianca Oliveira', tel: '(11) 92221-5555', servico: 'Drenagem linfática', preferencia: 'Qualquer', desde: 'Hoje' },
  ],
  activeFilter: 'todos',
  searchTerm: '',
  loading: false,
};

export const useListaEsperaStore = create((set, get) => ({
  ...initialState,

  addToWaitlist: (entry) => {
    const state = get();
    const newEntry = { ...entry, id: Helpers.generateId() };
    set({ list: [...state.list, newEntry] });
  },

  removeFromWaitlist: (id) => {
    set((state) => ({ list: state.list.filter((e) => e.id !== id) }));
  },

  setActiveFilter: (filter) => set({ activeFilter: filter }),
  setSearchTerm: (term) => set({ searchTerm: term }),

  getFilteredList() {
    const { list, searchTerm, activeFilter } = get();
    let filtered = [...list];

    const term = searchTerm?.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter((e) =>
        e.nome.toLowerCase().includes(term) ||
        e.servico?.toLowerCase().includes(term) ||
        e.tel?.includes(term)
      );
    }

    if (activeFilter === 'manha') {
      filtered = filtered.filter((e) => (e.preferencia || '').toLowerCase().includes('manh'));
    } else if (activeFilter === 'tarde') {
      filtered = filtered.filter((e) => (e.preferencia || '').toLowerCase().includes('tarde'));
    }

    return filtered;
  },

  getDaysSince(desde) {
    if (!desde || desde === 'Hoje') return 0;
    const parts = desde.split('/');
    if (parts.length !== 3) return 0;
    const data = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return Math.floor((Date.now() - data.getTime()) / 86400000);
  },
}));
