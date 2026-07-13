/** @format */

/**
 * Fusion ERP v2 — Store do Módulo Estoque
 */

import { create } from 'zustand';
import { Helpers } from '../utils/helpers';

const initialItems = [
  { id: 'item1', nome: 'Toxina botulínica 100U', categoria: 'Injetáveis', qtd: 2, minimo: 5, unidade: 'un.', valorUnit: 890 },
  { id: 'item2', nome: 'Ácido hialurônico 1ml', categoria: 'Injetáveis', qtd: 3, minimo: 8, unidade: 'un.', valorUnit: 450 },
  { id: 'item3', nome: 'Máscara pós-peeling', categoria: 'Descartáveis', qtd: 14, minimo: 20, unidade: 'un.', valorUnit: 12 },
  { id: 'item4', nome: 'Sérum vitamina C 30ml', categoria: 'Cosméticos', qtd: 42, minimo: 15, unidade: 'un.', valorUnit: 89 },
  { id: 'item5', nome: 'Luvas de nitrilo (cx.)', categoria: 'Descartáveis', qtd: 58, minimo: 20, unidade: 'cx.', valorUnit: 35 },
  { id: 'item6', nome: 'Ponteira de laser CO2', categoria: 'Equipamentos', qtd: 6, minimo: 4, unidade: 'un.', valorUnit: 1200 },
];

const initialEntries = [];

const categorias = ['Injetáveis', 'Descartáveis', 'Cosméticos', 'Equipamentos', 'Outros'];

export const useEstoqueStore = create((set, get) => ({
  items: initialItems,
  entries: initialEntries,
  searchTerm: '',
  activeFilters: {},
  categorias,

  setSearchTerm: (term) => set({ searchTerm: term }),

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: value
        ? { ...state.activeFilters, [key]: value }
        : Object.fromEntries(Object.entries(state.activeFilters).filter(([k]) => k !== key)),
    })),

  clearFilters: () => set({ activeFilters: {} }),

  addEntrada: (entrada) =>
    set((state) => {
      const newEntry = {
        ...entrada,
        id: Helpers.generateId(),
        createdAt: new Date().toISOString(),
      };
      return {
        entries: [...state.entries, newEntry],
        items: state.items.map((item) =>
          item.id === entrada.itemId
            ? { ...item, qtd: item.qtd + entrada.quantidade }
            : item
        ),
      };
    }),

  updateQuantidade: (itemId, quantidade) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, qtd: Math.max(0, item.qtd + quantidade) } : item
      ),
    })),

  getFilteredItems: () => {
    const { items, searchTerm, activeFilters } = get();
    let filtered = [...items];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.nome.toLowerCase().includes(term) ||
          item.categoria.toLowerCase().includes(term)
      );
    }

    if (activeFilters.categoria) {
      filtered = filtered.filter((i) => i.categoria === activeFilters.categoria);
    }
    if (activeFilters.status) {
      filtered = filtered.filter((i) => {
        const ratio = i.qtd / i.minimo;
        if (activeFilters.status === 'critico') return ratio < 0.5;
        if (activeFilters.status === 'baixo') return ratio >= 0.5 && ratio < 1;
        if (activeFilters.status === 'normal') return ratio >= 1;
        return true;
      });
    }

    return filtered;
  },

  getResumo: () => {
    const { items, entries } = get();
    const criticos = items.filter((i) => i.qtd < i.minimo * 0.5).length;
    const baixos = items.filter((i) => i.qtd >= i.minimo * 0.5 && i.qtd < i.minimo).length;
    const normais = items.filter((i) => i.qtd >= i.minimo).length;
    return {
      total: items.length,
      criticos,
      baixos,
      normais,
      totalEntradas: entries.length,
    };
  },

  getItemById: (id) => get().items.find((i) => i.id === id),
}));
