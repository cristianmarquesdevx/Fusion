/** @format */

/**
 * Fusion ERP v2 — Store do Dashboard Executivo
 * Dados simulados de alta fidelidade para o cockpit premium
 */

import { create } from 'zustand';

const initialState = {
  // KPI principals
  metrics: {
    revenue: { value: 0, trend: 0, label: 'Faturamento Hoje' },
    appointments: { value: 0, trend: 0, label: 'Agendamentos Hoje' },
    clients: { value: 0, trend: 0, label: 'Clientes Ativos' },
    occupancy: { value: 0, trend: 0, label: 'Ocupação' },
  },

  // Expansão de KPI com dados secundários
  kpiDetails: {
    revenue: {
      value: 12580, trend: 12.5, label: 'Faturamento Hoje',
      meta: 'R$ 4.280 em procedimentos · R$ 8.300 em pacotes',
      delta: '+12% vs. terça passada', deltaType: 'up',
      sparkline: [4200, 3800, 5100, 4600, 5800, 5200, 6280],
      expanded: {
        breakdown: [
          { name: 'Procedimentos', value: 4280, pct: 34 },
          { name: 'Pacotes', value: 5500, pct: 44 },
          { name: 'Produtos', value: 1800, pct: 14 },
          { name: 'Consultas', value: 1000, pct: 8 },
        ],
        dailyTrend: [5220, 4800, 6100, 5800, 7200, 6280, 5480],
        dailyLabels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
        target: 15000,
        targetPct: 84,
        comparison: { label: 'Semana passada', value: 11200, delta: 12.3 },
        historico: [
          { mes: 'Jan', valor: 68500 },
          { mes: 'Fev', valor: 72300 },
          { mes: 'Mar', valor: 69800 },
          { mes: 'Abr', valor: 75600 },
          { mes: 'Mai', valor: 81200 },
          { mes: 'Jun', valor: 78900 },
          { mes: 'Jul', valor: 86420 },
        ],
      },
    },
    appointments: {
      value: 18, trend: -3.2, label: 'Agendamentos Hoje',
      meta: '15 confirmados · 3 pendentes',
      delta: '3 encaixes confirmados', deltaType: 'up',
      sparkline: [12, 15, 14, 18, 16, 20, 18],
      expanded: {
        breakdown: [
          { name: 'Confirmados', value: 15, color: '#4C7A5E' },
          { name: 'Pendentes', value: 3, color: '#9C7A3E' },
          { name: 'Em andamento', value: 2, color: '#6C5CE7' },
          { name: 'Atrasados', value: 1, color: '#B14E3D' },
        ],
        byProfessional: [
          { name: 'Dra. Camila', value: 8 },
          { name: 'Fernanda', value: 6 },
          { name: 'Carlos', value: 4 },
        ],
        byRoom: [
          { name: 'Sala 1', value: 5 },
          { name: 'Sala 2', value: 4 },
          { name: 'Sala de Laser', value: 3 },
          { name: 'Sala 3', value: 3 },
          { name: 'Sala de Procedimentos', value: 3 },
        ],
        slotsDisponiveis: 4,
        totalSlots: 22,
      },
    },
    clients: {
      value: 234, trend: 8.1, label: 'Clientes Ativas no Mês',
      meta: '12 novas este mês · 87% retenção',
      delta: '+8% vs. mês passado', deltaType: 'up',
      sparkline: [198, 205, 212, 208, 220, 227, 234],
      expanded: {
        breakdown: [
          { name: 'Ativas', value: 187, color: '#4C7A5E' },
          { name: 'Novas', value: 12, color: '#6C5CE7' },
          { name: 'Inativas', value: 28, color: '#8A9186' },
          { name: 'Bloqueadas', value: 7, color: '#B14E3D' },
        ],
        retencao: 87,
        ticketMedio: 238,
        frequenciaMedia: '2.8 visitas/mês',
        topServicos: ['Limpeza de Pele', 'Massagem', 'Toxina Botulínica'],
        novosPorMes: [8, 10, 7, 14, 9, 12],
      },
    },
    occupancy: {
      value: 78, trend: 5.4, label: 'Ocupação das Salas',
      meta: 'Sala de Laser livre às 15h · Sala 3 disponível agora',
      delta: 'Sala de Laser livre às 15h', deltaType: 'down',
      sparkline: [72, 75, 80, 82, 78, 76, 78],
      expanded: {
        rooms: [
          { name: 'Sala 1', ocupacao: 85, proximoHorario: '16:00', status: 'ocupada' },
          { name: 'Sala 2', ocupacao: 70, proximoHorario: '14:30', status: 'ocupada' },
          { name: 'Sala de Laser', ocupacao: 45, proximoHorario: '—', status: 'livre' },
          { name: 'Sala 3', ocupacao: 60, proximoHorario: '15:00', status: 'disponivel' },
          { name: 'Sala de Procedimentos', ocupacao: 90, proximoHorario: '13:00', status: 'ocupada' },
        ],
        horarioPico: '10h-12h',
        horarioVale: '14h-16h',
        mediaOcupacao: 78,
      },
    },
  },

  ticketMedio: { value: 238, meta: '8% acima da meta', deltaType: 'up' },

  // Timeline do dia
  appointmentsToday: [],

  // Gráfico de faturamento anual
  revenueChart: [],

  // Distribuição de serviços
  servicesChart: [],

  // Performance por profissional
  professionalsChart: [],

  // Receita vs Despesa
  financialSummary: {
    receita: 86420,
    despesa: 31150,
    lucro: 55270,
    comissoes: 8940,
    inadimplencia: 3280,
  },

  // Métricas de crescimento
  growth: {
    clientesNovos: 12,
    sessoesRealizadas: 362,
    ticketMedio: 238,
    taxaRetencao: 87,
  },

  loading: false,
};

export const useDashboardStore = create((set) => ({
  ...initialState,

  loadDashboard: async (period = 'today') => {
    set({ loading: true });

    // Simula latência de rede (futuramente: Supabase RPC)
    await new Promise((r) => setTimeout(r, 600));

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
        { id: '7', time: '15:00', client: 'Sofia Ribeiro', service: 'Massagem Relaxante', professional: 'Carlos', status: 'confirmado', value: 200, room: 'Sala 3' },
        { id: '8', time: '16:00', client: 'Larissa Teixeira', service: 'Limpeza de Pele', professional: 'Fernanda', status: 'confirmado', value: 180, room: 'Sala 1' },
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
        { name: 'Limpeza de Pele', value: 25, color: '#2F4A3E' },
        { name: 'Massagem', value: 20, color: '#4C7A5E' },
        { name: 'Toxina Botulínica', value: 18, color: '#9C7A3E' },
        { name: 'Laser', value: 15, color: '#B14E3D' },
        { name: 'Drenagem', value: 12, color: '#6FA084' },
        { name: 'Outros', value: 10, color: '#8A9186' },
      ],
      professionalsChart: [
        { name: 'Dra. Camila', atendimentos: 48, receita: 28450, cor: '#6C5CE7' },
        { name: 'Fernanda', atendimentos: 32, receita: 12800, cor: '#00B894' },
        { name: 'Carlos', atendimentos: 18, receita: 7200, cor: '#FDCB6E' },
      ],
      loading: false,
    });
  },
}));
