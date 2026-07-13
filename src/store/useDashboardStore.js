/** @format */

/**
 * Fusion ERP v2 — Store do Dashboard
 */

import { create } from 'zustand';

const initialState = {
  metrics: {
    revenue: { value: 0, trend: 0, label: 'Faturamento Hoje' },
    appointments: { value: 0, trend: 0, label: 'Agendamentos Hoje' },
    clients: { value: 0, trend: 0, label: 'Clientes Ativos' },
    occupancy: { value: 0, trend: 0, label: 'Ocupação' },
  },
  appointmentsToday: [],
  revenueChart: [],
  servicesChart: [],
  professionalsChart: [],
  loading: false,
};

export const useDashboardStore = create((set) => ({
  ...initialState,

  loadDashboard: async (period = 'today') => {
    set({ loading: true });

    // Simula carga de dados (futuramente: Supabase RPC)
    await new Promise((r) => setTimeout(r, 500));

    set({
      metrics: {
        revenue: { value: 12580, trend: 12.5, label: 'Faturamento Hoje' },
        appointments: { value: 18, trend: -3.2, label: 'Agendamentos Hoje' },
        clients: { value: 234, trend: 8.1, label: 'Clientes Ativos' },
        occupancy: { value: 78, trend: 5.4, label: 'Ocupação' },
      },
      appointmentsToday: [
        { id: '1', time: '09:00', client: 'Marina Costa', service: 'Limpeza de Pele Profunda', professional: 'Fernanda', status: 'concluido', value: 180, room: 'Sala 1' },
        { id: '2', time: '10:00', client: 'Renata Alves', service: 'Peeling de Diamante', professional: 'Dra. Camila', status: 'concluido', value: 250, room: 'Sala 2' },
        { id: '3', time: '11:30', client: 'Juliana Prado', service: 'Toxina Botulínica', professional: 'Dra. Camila', status: 'ativo', value: 890, room: 'Sala de Procedimentos' },
        { id: '4', time: '12:15', client: 'Beatriz Lima', service: 'Drenagem Linfática', professional: 'Fernanda', status: 'atrasado', value: 180, room: 'Sala 1' },
        { id: '5', time: '13:00', client: 'Camila Ferreira', service: 'Microagulhamento', professional: 'Dra. Camila', status: 'aguardando', value: 450, room: 'Sala 2' },
        { id: '6', time: '14:30', client: 'Patrícia Nogueira', service: 'Laser CO2 Fracionado', professional: 'Dra. Camila', status: 'aguardando', value: 1200, room: 'Sala de Laser' },
      ],
      revenueChart: [
        { month: 'Jan', revenue: 28500, expenses: 18200 },
        { month: 'Fev', revenue: 32000, expenses: 19500 },
        { month: 'Mar', revenue: 29800, expenses: 17800 },
        { month: 'Abr', revenue: 35600, expenses: 21000 },
        { month: 'Mai', revenue: 41200, expenses: 22500 },
        { month: 'Jun', revenue: 38900, expenses: 19800 },
        { month: 'Jul', revenue: 86420, expenses: 31150 },
      ],
      servicesChart: [
        { name: 'Limpeza de Pele', value: 25 },
        { name: 'Massagem', value: 20 },
        { name: 'Depilação', value: 18 },
        { name: 'Laser', value: 15 },
        { name: 'Maquiagem', value: 12 },
        { name: 'Outros', value: 10 },
      ],
      loading: false,
    });
  },
}));
