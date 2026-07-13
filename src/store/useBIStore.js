/** @format */

import { create } from 'zustand';

const initialState = {
  period: 'month',
  metrics: {
    receita: 86420,
    ticketMedio: 238,
    clientesAtivas: 328,
    sessoes: 362,
  },
  revenueData: [
    { month: 'Jan', revenue: 28500, pct: 69 },
    { month: 'Fev', revenue: 32000, pct: 78 },
    { month: 'Mar', revenue: 29800, pct: 72 },
    { month: 'Abr', revenue: 35600, pct: 86 },
    { month: 'Mai', revenue: 41200, pct: 90 },
    { month: 'Jun', revenue: 38900, pct: 85 },
    { month: 'Jul', revenue: 86420, pct: 100, today: true },
  ],
  servicesData: [
    { name: 'Limpeza de pele', pct: 100, value: '25%', cor: '#4C7A5E' },
    { name: 'Massagem', pct: 80, value: '20%', cor: '#6C5CE7' },
    { name: 'Botox', pct: 72, value: '18%', cor: '#9C7A3E' },
    { name: 'Maquiagem', pct: 60, value: '15%', cor: '#00B894' },
    { name: 'Laser', pct: 48, value: '12%', cor: '#B14E3D' },
    { name: 'Outros', pct: 40, value: '10%', cor: '#8A9186' },
  ],
  professionalsData: [
    { name: 'Dra. Camila', receita: 28450, atendimentos: 48, cor: '#6C5CE7' },
    { name: 'Fernanda', receita: 12800, atendimentos: 32, cor: '#00B894' },
    { name: 'Carlos', receita: 7200, atendimentos: 18, cor: '#FDCB6E' },
  ],
  growthData: [
    { mes: 'Fev', clientes: 10, receita: 32000 },
    { mes: 'Mar', clientes: 7, receita: 29800 },
    { mes: 'Abr', clientes: 14, receita: 35600 },
    { mes: 'Mai', clientes: 9, receita: 41200 },
    { mes: 'Jun', clientes: 12, receita: 38900 },
    { mes: 'Jul', clientes: 16, receita: 86420 },
  ],
  loading: false,
};

export const useBIStore = create((set, get) => ({
  ...initialState,

  setPeriod: (period) => {
    set({ period });
    // Simula recálculo de métricas conforme o período
    const multipliers = { week: 0.23, month: 1, year: 12, quarter: 3 };
    const m = multipliers[period] || 1;
    set({
      metrics: {
        receita: Math.round(86420 * m),
        ticketMedio: 238,
        clientesAtivas: period === 'week' ? 82 : period === 'year' ? 1280 : 328,
        sessoes: Math.round(362 * m),
      },
    });
  },

  getPeriodLabel() {
    const labels = { week: 'Esta semana', month: 'Este mês', quarter: 'Este trimestre', year: 'Este ano' };
    return labels[get().period] || 'Este mês';
  },
}));
