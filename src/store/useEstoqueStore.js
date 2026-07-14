/** @format */

/**
 * Fusion ERP v2 — Store do Módulo Estoque
 */

import { create } from 'zustand';
import { Helpers } from '../utils';
import { supabaseData } from '../services/supabase-data';
import { withSupabaseFallback, trySync } from '../hooks/useSupabaseInit';

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
  supabaseLoaded: false,

  loadFromSupabase: async () => {
    const data = await withSupabaseFallback(
      () => supabaseData.estoqueItems.load({ order: { field: 'nome', ascending: true } }),
      null
    );
    if (data && Array.isArray(data) && data.length > 0) {
      const mapped = data.map((item, i) => ({
        id: String(item.id || `item${i + 1}`),
        nome: item.nome || item.name || '',
        categoria: item.categoria || item.category || 'Outros',
        qtd: Number(item.quantidade || item.qtd || 0),
        minimo: Number(item.minimo || item.min || 0),
        unidade: item.unidade || item.unit || 'un.',
        valorUnit: Number(item.valor_unitario || item.valorUnit || 0),
      }));
      set({ items: mapped, supabaseLoaded: true });
    } else {
      set({ supabaseLoaded: false });
    }
  },

  setSearchTerm: (term) => set({ searchTerm: term }),

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: value
        ? { ...state.activeFilters, [key]: value }
        : Object.fromEntries(Object.entries(state.activeFilters).filter(([k]) => k !== key)),
    })),

  clearFilters: () => set({ activeFilters: {} }),

  addEntrada: (entrada) => {
    const newEntry = {
      ...entrada,
      id: Helpers.generateId(),
      createdAt: new Date().toISOString(),
    };
    trySync(() => supabaseData.estoqueEntradas.save(entrada));
    set((state) => ({
      entries: [...state.entries, newEntry],
      items: state.items.map((item) =>
        item.id === entrada.itemId
          ? { ...item, qtd: item.qtd + entrada.quantidade }
          : item
      ),
    }));
  },

  updateItem: (id, data) => {
    trySync(() => supabaseData.estoqueItems.update(id, data));
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    }));
  },

  deleteItem: (id) => {
    trySync(() => supabaseData.estoqueItems.remove(id));
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  addItem: (item) => {
    const state = get();
    const newId = `item${state.items.length + 1}`;
    trySync(() => supabaseData.estoqueItems.save(item));
    set({ items: [...state.items, { id: newId, ...item }] });
  },

  updateQuantidade: (itemId, quantidade) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, qtd: Math.max(0, item.qtd + quantidade) } : item
      ),
    }));
  },

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
    if (activeFilters.categoria) filtered = filtered.filter((i) => i.categoria === activeFilters.categoria);
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
    return { total: items.length, criticos, baixos, normais, totalEntradas: entries.length };
  },

  getItemById: (id) => get().items.find((i) => i.id === id),
}));
