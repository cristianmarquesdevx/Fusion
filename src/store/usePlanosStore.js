/** @format */

import { create } from 'zustand';
import { Helpers } from '../utils';

const initialState = {
  planos: [
    { id: 'pr1', nome: 'Plano Premium', valor: 349, assinantes: 22, descricao: 'Acesso ilimitado a procedimentos estéticos · Prioridade total', beneficios: ['Agendamento prioritário', 'Desconto em procedimentos', 'Brinde mensal'], cor: '#9C7A3E' },
    { id: 'pr2', nome: 'Plano Essencial', valor: 149, assinantes: 12, descricao: '4 procedimentos por mês · Horário comercial', beneficios: ['4 sessões/mês', 'Horário comercial', 'Chat exclusivo'], cor: '#4C7A5E' },
    { id: 'pr3', nome: 'Plano VIP', valor: 599, assinantes: 4, descricao: 'Experiência premium ilimitada · Home care incluso', beneficios: ['Ilimitado', 'Home care grátis', 'Dra. exclusiva', 'Eventos VIP'], cor: '#6C5CE7' },
  ],
  nextId: 'pr4',
  loading: false,
};

export const usePlanosStore = create((set, get) => ({
  ...initialState,

  getKPIs() {
    const { planos } = get();
    const totalAssinantes = planos.reduce((s, p) => s + (p.assinantes || 0), 0);
    const mrr = planos.reduce((s, p) => s + ((p.assinantes || 0) * (p.valor || 0)), 0);
    const retencao = 94;
    const cancelamentos = 2;
    return { totalAssinantes, mrr, retencao, cancelamentos };
  },

  addPlano: (plano) => {
    const state = get();
    plano.id = state.nextId;
    plano.assinantes = 0;
    plano.beneficios = [];
    const num = parseInt(state.nextId.replace('pr', ''), 10) + 1;
    set({ planos: [...state.planos, plano], nextId: `pr${num}` });
  },

  getPlanoById: (id) => get().planos.find((p) => p.id === id),
}));
