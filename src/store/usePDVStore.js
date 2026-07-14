/** @format */

import { create } from 'zustand';
import { Helpers } from '../utils';

const initialState = {
  cart: [],
  products: [
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
  ],
  searchTerm: '',
  discount: { type: null, value: 0, label: '' },
  paymentMethod: 'credito',
  clientName: '',
  notes: '',
  loading: false,
};

export const usePDVStore = create((set, get) => ({
  ...initialState,

  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find((i) => i.id === item.id);
    if (existing) {
      set({ cart: cart.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i) });
    } else {
      set({ cart: [...cart, { ...item, qty: 1 }] });
    }
  },

  removeFromCart: (itemId) => {
    set({ cart: get().cart.filter((i) => i.id !== itemId) });
  },

  updateQty: (itemId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(itemId);
      return;
    }
    set({ cart: get().cart.map((i) => i.id === itemId ? { ...i, qty } : i) });
  },

  clearCart: () => set({ cart: [], discount: { type: null, value: 0, label: '' }, clientName: '', notes: '' }),

  setDiscount: (discount) => set({ discount }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setClientName: (name) => set({ clientName: name }),
  setNotes: (notes) => set({ notes }),
  setSearchTerm: (term) => set({ searchTerm: term }),

  getFilteredProducts() {
    const term = get().searchTerm?.toLowerCase();
    if (!term) return get().products;
    return get().products.filter((p) =>
      p.nome.toLowerCase().includes(term) || p.tipo.toLowerCase().includes(term)
    );
  },

  getCartTotal() {
    const subtotal = get().cart.reduce((sum, i) => sum + i.valor * i.qty, 0);
    const discount = get().discount?.value || 0;
    return Math.max(subtotal - discount, 0);
  },

  getCartSummary() {
    const subtotal = get().cart.reduce((sum, i) => sum + i.valor * i.qty, 0);
    const discount = get().discount?.value || 0;
    const total = Math.max(subtotal - discount, 0);
    const itens = get().cart.reduce((sum, i) => sum + i.qty, 0);
    return { subtotal, discount, total, itens };
  },

  finalizeSale: () => {
    const summary = get().getCartSummary();
    if (summary.itens === 0) return { success: false, error: 'Carrinho vazio' };

    // Simula finalização (futuramente: Supabase)
    const sale = {
      id: Helpers.generateId(),
      itens: [...get().cart],
      total: summary.total,
      discount: summary.discount,
      paymentMethod: get().paymentMethod,
      clientName: get().clientName,
      notes: get().notes,
      createdAt: new Date().toISOString(),
    };

    get().clearCart();
    return { success: true, sale };
  },
}));
