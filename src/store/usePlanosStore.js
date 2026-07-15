/** @format */

import { create } from 'zustand';
import { Helpers } from '../utils';

const initialState = {
  planos: [
    { id: 'pr1', nome: 'Plano Premium', valor: 349, assinantes: 22, descricao: 'Acesso ilimitado a procedimentos estéticos · Prioridade total', beneficios: ['Agendamento prioritário', 'Desconto em procedimentos', 'Brinde mensal'], cor: '#9C7A3E', abacatepayProductId: null },
    { id: 'pr2', nome: 'Plano Essencial', valor: 149, assinantes: 12, descricao: '4 procedimentos por mês · Horário comercial', beneficios: ['4 sessões/mês', 'Horário comercial', 'Chat exclusivo'], cor: '#4C7A5E', abacatepayProductId: null },
    { id: 'pr3', nome: 'Plano VIP', valor: 599, assinantes: 4, descricao: 'Experiência premium ilimitada · Home care incluso', beneficios: ['Ilimitado', 'Home care grátis', 'Dra. exclusiva', 'Eventos VIP'], cor: '#6C5CE7', abacatepayProductId: null },
  ],
  nextId: 'pr4',
  subscriptions: [], // { planId, abacatepaySubscriptionId, clientName, status, createdAt }
  loading: false,
};

export const usePlanosStore = create((set, get) => ({
  ...initialState,

  getKPIs() {
    const { planos, subscriptions } = get();
    const totalAssinantes = subscriptions.filter(s => s.status === 'active' || s.status === 'completed').length;
    // MRR: soma o valor de cada assinatura ativa
    const mrr = subscriptions
      .filter(s => s.status === 'active' || s.status === 'completed')
      .reduce((sum, s) => {
        const plano = planos.find(p => p.id === s.planId);
        return sum + (plano?.valor || 0);
      }, 0);
    const retencao = 94;
    const cancelamentos = subscriptions.filter(s => s.status === 'cancelled').length;
    return { totalAssinantes, mrr, retencao, cancelamentos };
  },

  addPlano: (plano) => {
    const state = get();
    plano.id = state.nextId;
    plano.assinantes = 0;
    plano.beneficios = [];
    plano.abacatepayProductId = null;
    const num = parseInt(state.nextId.replace('pr', ''), 10) + 1;
    set({ planos: [...state.planos, plano], nextId: `pr${num}` });
  },

  updatePlanoProductId: (planoId, productId) => {
    set((state) => ({
      planos: state.planos.map(p =>
        p.id === planoId ? { ...p, abacatepayProductId: productId } : p
      ),
    }));
  },

  addSubscription: (sub) => {
    set((state) => ({
      subscriptions: [...state.subscriptions, { ...sub, createdAt: new Date().toISOString() }],
    }));
  },

  updateSubscriptionStatus: (abacatepayId, status) => {
    set((state) => ({
      subscriptions: state.subscriptions.map(s =>
        s.abacatepaySubscriptionId === abacatepayId ? { ...s, status } : s
      ),
    }));
  },

  getPlanoById: (id) => get().planos.find((p) => p.id === id),

  getSubscriptionsByPlano: (planoId) =>
    get().subscriptions.filter(s => s.planId === planoId),
}));
