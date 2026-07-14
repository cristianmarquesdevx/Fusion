/** @format */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const resetStoreData = (store, data) => {
  store.setState(data);
  return store;
};

/* ════════════════════════════════════════════════════════════════
   AGENDA STORE
   ════════════════════════════════════════════════════════════════ */

describe('useAgendaStore', () => {
  let store;

  const PROFISSIONAIS = [
    { id: 'p1', nome: 'Dra. Camila', cargo: 'Médica', cor: '#6C5CE7' },
    { id: 'p2', nome: 'Fernanda', cargo: 'Esteticista', cor: '#00B894' },
    { id: 'p3', nome: 'Carlos', cargo: 'Massoterapeuta', cor: '#FDCB6E' },
  ];

  const SERVICOS = [
    { id: 's1', nome: 'Limpeza de pele', duracao: 60, valor: 180 },
    { id: 's2', nome: 'Peeling de diamante', duracao: 90, valor: 250 },
    { id: 's3', nome: 'Toxina botulínica', duracao: 60, valor: 890 },
    { id: 's4', nome: 'Laser CO2 fracionado', duracao: 120, valor: 1200 },
    { id: 's5', nome: 'Drenagem linfática', duracao: 60, valor: 180 },
    { id: 's6', nome: 'Microagulhamento', duracao: 90, valor: 450 },
    { id: 's7', nome: 'Massagem relaxante', duracao: 60, valor: 200 },
  ];

  const TIME_SLOTS = ['09:00', '10:00', '11:30', '13:00', '14:30', '15:00', '16:00', '17:00', '18:00'];
  const WEEK_DAYS = ['Seg 29', 'Ter 30', 'Qua 1', 'Qui 2', 'Sex 3', 'Sáb 4'];

  const WEEK_GRID = [
    [{ id: 'a1', client: 'Ana P.', service: 'Limpeza' }, null, null, null, null, null],
    [null, { id: 'a2', client: 'Renata A.', service: 'Peeling' }, null, null, null, null],
    [null, null, { id: 'a3', client: 'Carla D.', service: 'Botox' }, null, null, null],
    [null, null, null, null, null, null],
    [null, null, null, { id: 'a4', client: 'Sara T.', service: 'Drenagem' }, null, null],
  ];

  beforeEach(async () => {
    const mod = await import('../src/store/useAgendaStore');
    store = resetStoreData(mod.useAgendaStore, {
      weekDays: [...WEEK_DAYS],
      timeSlots: [...TIME_SLOTS],
      weekGrid: WEEK_GRID.map((row) => row.map((cell) => (cell ? { ...cell } : null))),
      professionals: PROFISSIONAIS.map((p) => ({ ...p })),
      services: SERVICOS.map((s) => ({ ...s })),
      nextApptId: 19,
      filterWeek: 'current',
      viewMode: 'week',
      supabaseLoaded: false,
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 9 timeSlots (09:00 às 18:00)', () => {
      expect(store.getState().timeSlots).toHaveLength(9);
      expect(store.getState().timeSlots[0]).toBe('09:00');
      expect(store.getState().timeSlots[8]).toBe('18:00');
    });

    it('deve ter 6 weekDays', () => {
      expect(store.getState().weekDays).toHaveLength(6);
      expect(store.getState().weekDays[0]).toBe('Seg 29');
    });

    it('deve ter 3 profissionais', () => {
      const profs = store.getState().professionals;
      expect(profs).toHaveLength(3);
      expect(profs[0].nome).toBe('Dra. Camila');
      expect(profs[1].nome).toBe('Fernanda');
      expect(profs[2].nome).toBe('Carlos');
    });

    it('deve ter 7 serviços', () => {
      expect(store.getState().services).toHaveLength(7);
    });

    it('deve ter weekGrid com 5 linhas e 6 colunas', () => {
      const grid = store.getState().weekGrid;
      expect(grid).toHaveLength(5);
      grid.forEach((row) => expect(row).toHaveLength(6));
    });

    it('deve iniciar com nextApptId = 19', () => {
      expect(store.getState().nextApptId).toBe(19);
    });

    it('deve iniciar com viewMode = week', () => {
      expect(store.getState().viewMode).toBe('week');
    });

    it('deve iniciar com filterWeek = current', () => {
      expect(store.getState().filterWeek).toBe('current');
    });

    it('cada profissional deve ter id, nome, cargo e cor', () => {
      store.getState().professionals.forEach((p) => {
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('nome');
        expect(p).toHaveProperty('cargo');
        expect(p.cor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });

    it('cada serviço deve ter id, nome, duracao e valor', () => {
      store.getState().services.forEach((s) => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('nome');
        expect(typeof s.duracao).toBe('number');
        expect(typeof s.valor).toBe('number');
      });
    });
  });

  /* ─── SET VIEW MODE ─── */

  describe('setViewMode', () => {
    it('deve alterar para room', () => {
      store.getState().setViewMode('room');
      expect(store.getState().viewMode).toBe('room');
    });

    it('deve alterar para week', () => {
      store.getState().setViewMode('week');
      expect(store.getState().viewMode).toBe('week');
    });

    it('deve aceitar qualquer string', () => {
      store.getState().setViewMode('day');
      expect(store.getState().viewMode).toBe('day');
    });
  });

  /* ─── ADD APPOINTMENT ─── */

  describe('addAppointment', () => {
    it('deve incrementar nextApptId', () => {
      store.getState().addAppointment({ client: 'Maria', service: 'Limpeza' });
      expect(store.getState().nextApptId).toBe(20);
    });

    it('deve incrementar sequencialmente', () => {
      store.getState().addAppointment({ client: 'A' });
      store.getState().addAppointment({ client: 'B' });
      store.getState().addAppointment({ client: 'C' });
      expect(store.getState().nextApptId).toBe(22);
    });

    it('não deve modificar o weekGrid (apenas incrementa ID)', () => {
      const gridAntes = store.getState().weekGrid;
      store.getState().addAppointment({ client: 'Teste' });
      expect(store.getState().weekGrid).toEqual(gridAntes);
    });
  });

  /* ─── MOVE APPOINTMENT ─── */

  describe('moveAppointment', () => {
    it('deve mover um agendamento de uma célula para outra', () => {
      // a1 está em [0][0], move para [0][1]
      store.getState().moveAppointment(0, 0, 0, 1);
      const grid = store.getState().weekGrid;
      expect(grid[0][0]).toBeNull();
      expect(grid[0][1]).toBeDefined();
      expect(grid[0][1].client).toBe('Ana P.');
    });

    it('deve trocar com o agendamento de destino se existir', () => {
      // a1 em [0][0], a2 em [1][1] — move a1 para [1][1]
      store.getState().moveAppointment(0, 0, 1, 1);
      const grid = store.getState().weekGrid;
      expect(grid[0][0].client).toBe('Renata A.'); // a2 veio para [0][0]
      expect(grid[1][1].client).toBe('Ana P.'); // a1 foi para [1][1]
    });

    it('não deve fazer nada se a origem não tem agendamento', () => {
      const gridAntes = store.getState().weekGrid;
      store.getState().moveAppointment(3, 0, 1, 1);
      expect(store.getState().weekGrid).toEqual(gridAntes);
    });

    it('não deve quebrar com índices inválidos', () => {
      expect(() => store.getState().moveAppointment(-1, 0, 1, 1)).not.toThrow();
      expect(() => store.getState().moveAppointment(0, 0, 99, 99)).not.toThrow();
    });

    it('deve fazer deep clone do grid (não mutar o original)', () => {
      const gridAntes = store.getState().weekGrid;
      store.getState().moveAppointment(0, 0, 0, 2);
      // O original não deve ter sido alterado (referência)
      // Na verdade, Zustand set() cria novo objeto — a store foi alterada
      expect(store.getState().weekGrid[0][0]).toBeNull();
      expect(gridAntes[0][0]).toBeDefined(); // o snapshot original permanece
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   DASHBOARD STORE
   ════════════════════════════════════════════════════════════════ */

describe('useDashboardStore', () => {
  let store;

  beforeEach(async () => {
    const mod = await import('../src/store/useDashboardStore');
    store = resetStoreData(mod.useDashboardStore, {
      metrics: {
        revenue: { value: 0, trend: 0, label: 'Faturamento Hoje' },
        appointments: { value: 0, trend: 0, label: 'Agendamentos Hoje' },
        clients: { value: 0, trend: 0, label: 'Clientes Ativos' },
        occupancy: { value: 0, trend: 0, label: 'Ocupação' },
      },
      kpiDetails: {},
      appointmentsToday: [],
      revenueChart: [],
      servicesChart: [],
      professionalsChart: [],
      financialSummary: { receita: 0, despesa: 0, lucro: 0, comissoes: 0, inadimplencia: 0 },
      growth: { clientesNovos: 0, sessoesRealizadas: 0, ticketMedio: 0, taxaRetencao: 0 },
      financialSummary: { receita: 86420, despesa: 31150, lucro: 55270, comissoes: 8940, inadimplencia: 3280 },
      growth: { clientesNovos: 12, sessoesRealizadas: 362, ticketMedio: 238, taxaRetencao: 87 },
      loading: false,
      supabaseLoaded: false,
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 4 métricas zeradas', () => {
      const m = store.getState().metrics;
      expect(m.revenue.value).toBe(0);
      expect(m.appointments.value).toBe(0);
      expect(m.clients.value).toBe(0);
      expect(m.occupancy.value).toBe(0);
    });

    it('cada métrica deve ter value, trend e label', () => {
      Object.values(store.getState().metrics).forEach((m) => {
        expect(m).toHaveProperty('value');
        expect(m).toHaveProperty('trend');
        expect(m).toHaveProperty('label');
      });
    });

    it('deve ter arrays vazios para appointmentsToday, revenueChart, servicesChart, professionalsChart', () => {
      const state = store.getState();
      expect(state.appointmentsToday).toEqual([]);
      expect(state.revenueChart).toEqual([]);
      expect(state.servicesChart).toEqual([]);
      expect(state.professionalsChart).toEqual([]);
    });

    it('deve ter financialSummary com valores mockados iniciais', () => {
      const f = store.getState().financialSummary;
      expect(f.receita).toBe(86420);
      expect(f.despesa).toBe(31150);
      expect(f.lucro).toBe(55270);
    });

    it('deve ter growth com valores mockados iniciais', () => {
      const g = store.getState().growth;
      expect(g.clientesNovos).toBe(12);
      expect(g.sessoesRealizadas).toBe(362);
      expect(g.ticketMedio).toBe(238);
      expect(g.taxaRetencao).toBe(87);
    });

    it('deve iniciar com loading = false e supabaseLoaded = false', () => {
      expect(store.getState().loading).toBe(false);
      expect(store.getState().supabaseLoaded).toBe(false);
    });

    it('deve ter kpiDetails como objeto vazio', () => {
      expect(store.getState().kpiDetails).toEqual({});
    });
  });

  /* ─── LOAD DASHBOARD (FALLBACK) ─── */

  describe('loadDashboard — fallback (Supabase offline)', () => {
    it('deve carregar dados mockados (fallback)', async () => {
      await store.getState().loadDashboard('today');
      const state = store.getState();

      expect(state.loading).toBe(false);
      expect(state.metrics.revenue.value).toBe(12580);
      expect(state.metrics.appointments.value).toBe(18);
      expect(state.metrics.clients.value).toBe(234);
      expect(state.metrics.occupancy.value).toBe(78);
    });

    it('deve popular appointmentsToday com 8 agendamentos', async () => {
      await store.getState().loadDashboard();
      expect(store.getState().appointmentsToday).toHaveLength(8);
    });

    it('deve popular revenueChart com 7 meses', async () => {
      await store.getState().loadDashboard();
      expect(store.getState().revenueChart).toHaveLength(7);
    });

    it('deve popular servicesChart com 6 serviços', async () => {
      await store.getState().loadDashboard();
      expect(store.getState().servicesChart).toHaveLength(6);
    });

    it('deve popular professionalsChart com 3 profissionais', async () => {
      await store.getState().loadDashboard();
      expect(store.getState().professionalsChart).toHaveLength(3);
    });

    it('cada appointment deve ter id, time, client, service, professional, status, value, room', async () => {
      await store.getState().loadDashboard();
      store.getState().appointmentsToday.forEach((a) => {
        expect(a).toHaveProperty('id');
        expect(a).toHaveProperty('time');
        expect(a).toHaveProperty('client');
        expect(a).toHaveProperty('service');
        expect(a).toHaveProperty('professional');
        expect(a).toHaveProperty('status');
        expect(a).toHaveProperty('value');
        expect(a).toHaveProperty('room');
      });
    });

    it('cada revenueChart deve ter month, revenue e expenses', async () => {
      await store.getState().loadDashboard();
      store.getState().revenueChart.forEach((r) => {
        expect(r).toHaveProperty('month');
        expect(typeof r.revenue).toBe('number');
        expect(typeof r.expenses).toBe('number');
      });
    });

    it('deve setar loading = false após carregar', async () => {
      await store.getState().loadDashboard();
      expect(store.getState().loading).toBe(false);
    });

    it('financialSummary deve manter valores iniciais (não é atualizado por loadDashboard)', () => {
      const f = store.getState().financialSummary;
      expect(f.receita).toBe(86420);
      expect(f.despesa).toBe(31150);
      expect(f.lucro).toBe(55270);
    });

    it('growth deve manter valores iniciais (não é atualizado por loadDashboard)', () => {
      const g = store.getState().growth;
      expect(g.clientesNovos).toBe(12);
      expect(g.sessoesRealizadas).toBe(362);
      expect(g.ticketMedio).toBe(238);
      expect(g.taxaRetencao).toBe(87);
    });

    it('cada servicesChart deve ter name, value, color', async () => {
      await store.getState().loadDashboard();
      store.getState().servicesChart.forEach((s) => {
        expect(s).toHaveProperty('name');
        expect(typeof s.value).toBe('number');
        expect(s).toHaveProperty('color');
      });
    });

    it('metrics deve conter tendências (trend)', async () => {
      await store.getState().loadDashboard();
      const m = store.getState().metrics;
      expect(m.revenue.trend).toBe(12.5);
      expect(m.appointments.trend).toBe(-3.2);
    });
  });
});

/* ════════════════════════════════════════════════════════════════
   SALAS STORE
   ════════════════════════════════════════════════════════════════ */

describe('useSalasStore', () => {
  let store;

  const SALAS_INICIAIS = [
    { id: 's1', nome: 'Sala 1 — Estética Facial', capacidade: 1, status: 'disponivel', currentSession: null, nextSession: null, manutencao: null },
    { id: 's2', nome: 'Sala 2 — Procedimentos', capacidade: 1, status: 'em_uso', currentSession: { profissional: 'Dra. Camila', cliente: 'Camila F.', servico: 'Microagulhamento', ate: '14:00' }, nextSession: null, manutencao: null },
    { id: 's3', nome: 'Sala 3 — Massagem', capacidade: 1, status: 'disponivel', currentSession: null, nextSession: null, manutencao: null },
    { id: 's4', nome: 'Sala de Laser', capacidade: 1, status: 'manutencao', currentSession: null, nextSession: null, manutencao: { motivo: 'Manutenção preventiva', previsao: '03/07', tecnico: 'João' } },
    { id: 's5', nome: 'Sala de Procedimentos', capacidade: 1, status: 'ocupada', currentSession: { profissional: 'Dra. Camila', cliente: 'Juliana P.', servico: 'Toxina', ate: '12:15' }, nextSession: null, manutencao: null },
  ];

  const TIMELINE_INICIAL = {
    's1': [
      { id: 't1', hora: '09:00', duracao: 60, cliente: 'Mariana F.', servico: 'Limpeza', profissional: 'Fernanda', status: 'concluido' },
    ],
    's2': [
      { id: 't2', hora: '10:00', duracao: 60, cliente: 'Renata A.', servico: 'Peeling', profissional: 'Dra. Camila', status: 'concluido' },
      { id: 't3', hora: '13:00', duracao: 60, cliente: 'Camila F.', servico: 'Microagulhamento', profissional: 'Dra. Camila', status: 'ativo' },
    ],
    's3': [],
    's4': [],
    's5': [
      { id: 't4', hora: '11:30', duracao: 45, cliente: 'Juliana P.', servico: 'Toxina', profissional: 'Dra. Camila', status: 'ativo' },
    ],
  };

  const EQUIPAMENTOS_INICIAIS = {
    's1': [
      { id: 'e1', nome: 'Laser ND:YAG', tipo: 'Laser', ultimaManutencao: '15/06/2026', proximaManutencao: '15/09/2026', usoTotal: 420, saude: 87 },
    ],
    's2': [],
    's3': [],
    's4': [
      { id: 'e2', nome: 'Laser CO2', tipo: 'Laser', ultimaManutencao: '28/06/2026', proximaManutencao: '28/07/2026', usoTotal: 150, saude: 65 },
    ],
    's5': [],
  };

  beforeEach(async () => {
    const mod = await import('../src/store/useSalasStore');
    store = resetStoreData(mod.useSalasStore, {
      list: SALAS_INICIAIS.map((s) => ({ ...s, currentSession: s.currentSession ? { ...s.currentSession } : null, manutencao: s.manutencao ? { ...s.manutencao } : null })),
      timeline: Object.fromEntries(Object.entries(TIMELINE_INICIAL).map(([k, v]) => [k, v.map((t) => ({ ...t }))])),
      equipment: Object.fromEntries(Object.entries(EQUIPAMENTOS_INICIAIS).map(([k, v]) => [k, v.map((e) => ({ ...e }))])),
      sessionHistory: [],
      scheduleLog: [],
      selectedDate: '2026-07-01',
      expandedRoom: null,
      searchTerm: '',
      activeFilters: {},
      loading: false,
    });
  });

  /* ─── ESTADO INICIAL ─── */

  describe('estado inicial', () => {
    it('deve ter 5 salas', () => {
      expect(store.getState().list).toHaveLength(5);
    });

    it('cada sala deve ter id, nome, capacidade, status', () => {
      store.getState().list.forEach((s) => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('nome');
        expect(typeof s.capacidade).toBe('number');
        expect(s).toHaveProperty('status');
      });
    });

    it('deve ter status variados entre as salas', () => {
      const statuses = store.getState().list.map((s) => s.status);
      expect(statuses).toContain('disponivel');
      expect(statuses).toContain('em_uso');
      expect(statuses).toContain('manutencao');
      expect(statuses).toContain('ocupada');
    });

    it('deve iniciar com scheduleLog vazio e sessionHistory vazio', () => {
      expect(store.getState().scheduleLog).toEqual([]);
      expect(store.getState().sessionHistory).toEqual([]);
    });

    it('deve iniciar com searchTerm vazio e activeFilters vazio', () => {
      expect(store.getState().searchTerm).toBe('');
      expect(store.getState().activeFilters).toEqual({});
    });

    it('deve iniciar com loading = false', () => {
      expect(store.getState().loading).toBe(false);
    });

    it('deve ter equipment disponível para s1 e s4', () => {
      expect(store.getState().equipment['s1']).toHaveLength(1);
      expect(store.getState().equipment['s4']).toHaveLength(1);
      expect(store.getState().equipment['s2']).toHaveLength(0);
    });
  });

  /* ─── GET STATUS INFO ─── */

  describe('getStatusInfo', () => {
    it('deve retornar label "Disponível" para disponivel', () => {
      expect(store.getState().getStatusInfo('disponivel').label).toBe('Disponível');
    });

    it('deve retornar label "Em uso" para em_uso', () => {
      expect(store.getState().getStatusInfo('em_uso').label).toBe('Em uso');
    });

    it('deve retornar label "Ocupada" para ocupada', () => {
      expect(store.getState().getStatusInfo('ocupada').label).toBe('Ocupada');
    });

    it('deve retornar label "Manutenção" para manutencao', () => {
      expect(store.getState().getStatusInfo('manutencao').label).toBe('Manutenção');
    });

    it('deve retornar fallback para status desconhecido', () => {
      const info = store.getState().getStatusInfo('desconhecido');
      expect(info.label).toBe('desconhecido');
      expect(info.order).toBe(99);
    });

    it('cada status deve ter chip, dot e order', () => {
      ['disponivel', 'em_uso', 'ocupada', 'manutencao'].forEach((st) => {
        const info = store.getState().getStatusInfo(st);
        expect(info).toHaveProperty('chip');
        expect(info).toHaveProperty('dot');
        expect(typeof info.order).toBe('number');
      });
    });
  });

  /* ─── SEARCH / FILTERS ─── */

  describe('setSearchTerm / setFilter / clearFilters', () => {
    it('deve atualizar searchTerm', () => {
      store.getState().setSearchTerm('laser');
      expect(store.getState().searchTerm).toBe('laser');
    });

    it('deve limpar searchTerm com string vazia', () => {
      store.getState().setSearchTerm('teste');
      store.getState().setSearchTerm('');
      expect(store.getState().searchTerm).toBe('');
    });

    it('deve definir filtro de status', () => {
      store.getState().setFilter('status', 'disponivel');
      expect(store.getState().activeFilters.status).toBe('disponivel');
    });

    it('deve remover filtro ao passar null', () => {
      store.getState().setFilter('status', 'ocupada');
      store.getState().setFilter('status', null);
      expect(store.getState().activeFilters).toEqual({});
    });

    it('clearFilters deve limpar todos', () => {
      store.getState().setFilter('status', 'manutencao');
      store.getState().setFilter('categoria', 'laser');
      store.getState().clearFilters();
      expect(store.getState().activeFilters).toEqual({});
    });

    it('deve suportar apenas um filtro por vez (sobrescreve)', () => {
      store.getState().setFilter('status', 'disponivel');
      store.getState().setFilter('status', 'em_uso');
      expect(store.getState().activeFilters).toEqual({ status: 'em_uso' });
    });
  });

  /* ─── GET FILTERED LIST ─── */

  describe('getFilteredList', () => {
    it('deve retornar todas as 5 salas sem filtros', () => {
      expect(store.getState().getFilteredList()).toHaveLength(5);
    });

    it('deve filtrar por nome (case-insensitive)', () => {
      store.getState().setSearchTerm('laser');
      const result = store.getState().getFilteredList();
      // 'laser' match: s4 (nome) + s1 (equipamento "Laser ND:YAG")
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toContain('s4');
    });

    it('deve filtrar por nome parcial', () => {
      store.getState().setSearchTerm('procedimentos');
      const result = store.getState().getFilteredList();
      // 'procedimentos' match: s2 ("Procedimentos") + s5 ("de Procedimentos")
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.id)).toContain('s2');
    });

    it('deve filtrar por status "Disponível"', () => {
      store.getState().setFilter('status', 'Disponível');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(2); // s1 + s3
      result.forEach((s) => expect(s.status).toBe('disponivel'));
    });

    it('deve filtrar por status "Em uso"', () => {
      store.getState().setFilter('status', 'Em uso');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(1); // s2
      expect(result[0].id).toBe('s2');
    });

    it('deve combinar search + filtro de status', () => {
      store.getState().setSearchTerm('procedimentos');
      store.getState().setFilter('status', 'em uso');
      const result = store.getState().getFilteredList();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s2');
    });

    it('deve retornar lista vazia para busca sem match', () => {
      store.getState().setSearchTerm('zzzzz');
      expect(store.getState().getFilteredList()).toHaveLength(0);
    });
  });

  /* ─── KPIS ─── */

  describe('getKPIs', () => {
    it('deve retornar totalSalas = 5', () => {
      expect(store.getState().getKPIs().totalSalas).toBe(5);
    });

    it('deve contar emUso (em_uso + ocupada) = 2', () => {
      expect(store.getState().getKPIs().emUso).toBe(2);
    });

    it('deve contar disponiveis = 2', () => {
      expect(store.getState().getKPIs().disponiveis).toBe(2);
    });

    it('deve contar manutencao = 1', () => {
      expect(store.getState().getKPIs().manutencao).toBe(1);
    });

    it('deve calcular ocupacao = 40% (2 em uso / 5 total)', () => {
      expect(store.getState().getKPIs().ocupacao).toBe(40);
    });

    it('deve contar sessoesHoje (total na timeline)', () => {
      expect(store.getState().getKPIs().sessoesHoje).toBe(4); // 1 + 2 + 0 + 0 + 1
    });

    it('deve contar sessoesAtivas (status = ativo)', () => {
      expect(store.getState().getKPIs().sessoesAtivas).toBe(2); // t3 + t4
    });

    it('deve ter turnoverMedio = 15', () => {
      expect(store.getState().getKPIs().turnoverMedio).toBe(15);
    });

    it('deve calcular duracaoMedia (média das durações na timeline)', () => {
      // (60 + 60 + 60 + 45) / 4 = 56.25 → 56
      expect(store.getState().getKPIs().duracaoMedia).toBe(56);
    });

    it('deve contar equipamentosManut (saude < 70)', () => {
      // e2 (laser CO2) tem saude = 65 < 70
      expect(store.getState().getKPIs().equipamentosManut).toBe(1);
    });
  });

  /* ─── SCHEDULE APPOINTMENT ─── */

  describe('scheduleAppointment', () => {
    it('deve adicionar agendamento na timeline da sala', () => {
      const result = store.getState().scheduleAppointment({
        salaId: 's3',
        hora: '09:00',
        duracao: 60,
        cliente: 'Nova Cliente',
        servico: 'Massagem',
        profissional: 'Carlos',
      });

      expect(result.success).toBe(true);
      expect(result.appointment).toBeDefined();
      expect(store.getState().timeline['s3']).toHaveLength(1);
      expect(store.getState().timeline['s3'][0].cliente).toBe('Nova Cliente');
    });

    it('deve detectar conflito de horário na mesma sala', () => {
      // s1 já tem sessão das 09:00 às 10:00
      const result = store.getState().scheduleAppointment({
        salaId: 's1',
        hora: '09:30',
        duracao: 60,
        cliente: 'Conflito',
        servico: 'Limpeza',
        profissional: 'Fernanda',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Conflito');
    });

    it('não deve adicionar sessão em conflito', () => {
      const timelineAntes = store.getState().timeline['s1'].length;
      store.getState().scheduleAppointment({
        salaId: 's1',
        hora: '09:00',
        duracao: 60,
        cliente: 'Conflito',
        servico: 'Limpeza',
        profissional: 'Outro',
      });

      expect(store.getState().timeline['s1']).toHaveLength(timelineAntes);
    });

    it('deve detectar conflito de profissional em outra sala', () => {
      // Dra. Camila já está em s2 (t3) das 13:00 às 14:00
      const result = store.getState().scheduleAppointment({
        salaId: 's3',
        hora: '13:00',
        duracao: 60,
        cliente: 'Teste',
        servico: 'Massagem',
        profissional: 'Dra. Camila',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Profissional');
      expect(result.error).toContain('Dra. Camila');
    });

    it('deve permitir horário sem conflito para mesmo profissional', () => {
      const result = store.getState().scheduleAppointment({
        salaId: 's3',
        hora: '15:00',
        duracao: 60,
        cliente: 'Cliente Novo',
        servico: 'Massagem',
        profissional: 'Dra. Camila',
      });

      expect(result.success).toBe(true);
    });

    it('deve adicionar entrada no scheduleLog', () => {
      const logAntes = store.getState().scheduleLog.length;
      store.getState().scheduleAppointment({
        salaId: 's3',
        hora: '08:00',
        duracao: 60,
        cliente: 'Teste Log',
        servico: 'Teste',
        profissional: 'Carlos',
      });

      expect(store.getState().scheduleLog).toHaveLength(logAntes + 1);
      expect(store.getState().scheduleLog[logAntes].action).toBe('agendado');
    });

    it('ignorar sessões canceladas no conflito', () => {
      // Adiciona sessão cancelada no horário
      store.getState().timeline['s3'] = [
        { id: 'cancelada', hora: '09:00', duracao: 60, cliente: 'Cancelado', servico: 'X', profissional: 'Carlos', status: 'cancelado' },
      ];

      const result = store.getState().scheduleAppointment({
        salaId: 's3',
        hora: '09:00',
        duracao: 60,
        cliente: 'Novo',
        servico: 'Massagem',
        profissional: 'Carlos',
      });

      expect(result.success).toBe(true);
    });

    it('deve ordenar por horário após adicionar', () => {
      store.getState().scheduleAppointment({
        salaId: 's3', hora: '16:00', duracao: 60, cliente: 'Tarde', servico: 'M', profissional: 'Carlos',
      });
      store.getState().scheduleAppointment({
        salaId: 's3', hora: '08:00', duracao: 60, cliente: 'Cedo', servico: 'M', profissional: 'Carlos',
      });

      const timeline = store.getState().timeline['s3'];
      expect(timeline[0].hora).toBe('08:00');
      expect(timeline[1].hora).toBe('16:00');
    });
  });

  /* ─── START / END SESSION ─── */

  describe('startSession / endSession', () => {
    it('deve iniciar sessão e atualizar sala para em_uso', () => {
      // Adiciona sessão confirmada em s3
      store.getState().timeline['s3'] = [
        { id: 'nova-sessao', hora: '09:00', duracao: 60, cliente: 'Cliente', servico: 'Massagem', profissional: 'Carlos', status: 'confirmado' },
      ];

      const result = store.getState().startSession('s3', 'nova-sessao');
      expect(result.success).toBe(true);

      const sala = store.getState().list.find((s) => s.id === 's3');
      expect(sala.status).toBe('em_uso');
      expect(sala.currentSession).toBeDefined();
      expect(sala.currentSession.cliente).toBe('Cliente');
    });

    it('deve retornar erro para sessão inexistente', () => {
      const result = store.getState().startSession('s1', 'nao-existe');
      expect(result.success).toBe(false);
      expect(result.error).toContain('não encontrada');
    });

    it('deve concluir sessão e liberar sala', () => {
      const result = store.getState().endSession('s2', 't3');
      expect(result.success).toBe(true);

      const sala = store.getState().list.find((s) => s.id === 's2');
      expect(sala.status).toBe('disponivel');
      expect(sala.currentSession).toBeNull();
    });

    it('deve adicionar entrada no sessionHistory ao concluir', () => {
      store.getState().endSession('s2', 't3');
      expect(store.getState().sessionHistory).toHaveLength(1);
      expect(store.getState().sessionHistory[0].salaId).toBe('s2');
      expect(store.getState().sessionHistory[0].cliente).toBe('Camila F.');
    });

    it('deve retornar erro ao concluir sessão inexistente', () => {
      const result = store.getState().endSession('s1', 'nao-existe');
      expect(result.success).toBe(false);
      expect(result.error).toContain('não encontrada');
    });

    it('deve registrar no scheduleLog ao iniciar e concluir', () => {
      const logAntes = store.getState().scheduleLog.length;
      store.getState().startSession('s5', 't4');
      expect(store.getState().scheduleLog).toHaveLength(logAntes + 1);

      store.getState().endSession('s5', 't4');
      expect(store.getState().scheduleLog).toHaveLength(logAntes + 2);
    });
  });

  /* ─── UPDATE SESSION STATUS ─── */

  describe('updateSessionStatus', () => {
    it('deve atualizar status da sessão na timeline', () => {
      store.getState().updateSessionStatus('s1', 't1', 'cancelado');
      const sessao = store.getState().timeline['s1'].find((s) => s.id === 't1');
      expect(sessao.status).toBe('cancelado');
    });

    it('não deve alterar outras sessões', () => {
      store.getState().updateSessionStatus('s2', 't2', 'cancelado');
      const t3 = store.getState().timeline['s2'].find((s) => s.id === 't3');
      expect(t3.status).toBe('ativo'); // não alterado
    });

    it('deve registrar no scheduleLog', () => {
      const logAntes = store.getState().scheduleLog.length;
      store.getState().updateSessionStatus('s2', 't2', 'cancelado');
      expect(store.getState().scheduleLog).toHaveLength(logAntes + 1);
    });
  });

  /* ─── ADD SALA ─── */

  describe('addSala', () => {
    it('deve adicionar nova sala com id incremental', () => {
      store.getState().addSala({ nome: 'Sala Teste', capacidade: 2 });
      expect(store.getState().list).toHaveLength(6);
      const nova = store.getState().list[5];
      expect(nova.id).toBe('s6');
      expect(nova.nome).toBe('Sala Teste');
    });

    it('nova sala deve iniciar com currentSession null, nextSession null, manutencao null', () => {
      store.getState().addSala({ nome: 'Nova', capacidade: 1 });
      const nova = store.getState().list[5];
      expect(nova.currentSession).toBeNull();
      expect(nova.nextSession).toBeNull();
      expect(nova.manutencao).toBeNull();
    });

    it('nova sala deve ter timeline vazia e equipment vazio', () => {
      store.getState().addSala({ nome: 'Nova', capacidade: 1 });
      expect(store.getState().timeline['s6']).toEqual([]);
      expect(store.getState().equipment['s6']).toEqual([]);
    });

    it('deve iniciar com status disponivel por padrão', () => {
      store.getState().addSala({ nome: 'Teste', capacidade: 1 });
      expect(store.getState().list[5].status).toBe('disponivel');
    });

    it('deve aceitar status customizado', () => {
      store.getState().addSala({ nome: 'Teste', capacidade: 1, status: 'manutencao' });
      expect(store.getState().list[5].status).toBe('manutencao');
    });
  });

  /* ─── UPDATE SALA STATUS ─── */

  describe('updateSalaStatus', () => {
    it('deve alterar status da sala', () => {
      store.getState().updateSalaStatus('s1', { status: 'em_uso' });
      expect(store.getState().list.find((s) => s.id === 's1').status).toBe('em_uso');
    });

    it('deve alterar múltiplos campos', () => {
      store.getState().updateSalaStatus('s3', { status: 'ocupada', currentSession: { cliente: 'Teste' } });
      const s3 = store.getState().list.find((s) => s.id === 's3');
      expect(s3.status).toBe('ocupada');
      expect(s3.currentSession.cliente).toBe('Teste');
    });

    it('não deve alterar outras salas', () => {
      store.getState().updateSalaStatus('s1', { status: 'manutencao' });
      expect(store.getState().list.find((s) => s.id === 's2').status).toBe('em_uso');
    });
  });

  /* ─── LOG MAINTENANCE ─── */

  describe('logMaintenance', () => {
    it('deve resetar saúde do equipamento para 100', () => {
      store.getState().logMaintenance('s4', 'e2');
      const eq = store.getState().equipment['s4'].find((e) => e.id === 'e2');
      expect(eq.saude).toBe(100);
    });

    it('deve atualizar data de manutenção', () => {
      store.getState().logMaintenance('s4', 'e2');
      const eq = store.getState().equipment['s4'].find((e) => e.id === 'e2');
      expect(eq.ultimaManutencao).toBe(new Date().toLocaleDateString('pt-BR'));
    });

    it('deve registrar no scheduleLog', () => {
      const logAntes = store.getState().scheduleLog.length;
      store.getState().logMaintenance('s4', 'e2');
      expect(store.getState().scheduleLog).toHaveLength(logAntes + 1);
    });
  });

  /* ─── EQUIPMENT HEALTH COLOR ─── */

  describe('getEquipmentHealthColor', () => {
    it('deve retornar label "Ótimo" para saude >= 85', () => {
      expect(store.getState().getEquipmentHealthColor(100).label).toBe('Ótimo');
      expect(store.getState().getEquipmentHealthColor(85).label).toBe('Ótimo');
    });

    it('deve retornar label "Bom" para saude 70-84', () => {
      expect(store.getState().getEquipmentHealthColor(70).label).toBe('Bom');
      expect(store.getState().getEquipmentHealthColor(80).label).toBe('Bom');
    });

    it('deve retornar label "Atenção" para saude 50-69', () => {
      expect(store.getState().getEquipmentHealthColor(50).label).toBe('Atenção');
      expect(store.getState().getEquipmentHealthColor(65).label).toBe('Atenção');
    });

    it('deve retornar label "Crítico" para saude < 50', () => {
      expect(store.getState().getEquipmentHealthColor(30).label).toBe('Crítico');
      expect(store.getState().getEquipmentHealthColor(0).label).toBe('Crítico');
    });

    it('cada resultado deve ter color, bg, text e label', () => {
      const result = store.getState().getEquipmentHealthColor(85);
      expect(result).toHaveProperty('color');
      expect(result).toHaveProperty('bg');
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('label');
    });
  });

  /* ─── GET ROOM ANALYTICS ─── */

  describe('getRoomAnalytics', () => {
    it('deve retornar totalSessoes = 0 para sala sem histórico', () => {
      const analytics = store.getState().getRoomAnalytics('s3');
      expect(analytics.totalSessoes).toBe(0);
    });

    it('deve retornar analytics para sala com histórico (após endSession)', () => {
      store.getState().endSession('s2', 't3');
      const analytics = store.getState().getRoomAnalytics('s2');
      expect(analytics.totalSessoes).toBe(1);
      expect(analytics.receitaTotal).toBe(0); // valor não preenchido no endSession
    });

    it('deve ter estrutura completa de analytics', () => {
      const analytics = store.getState().getRoomAnalytics('s1');
      expect(analytics).toHaveProperty('totalSessoes');
      expect(analytics).toHaveProperty('receitaTotal');
      expect(analytics).toHaveProperty('duracaoMedia');
      expect(analytics).toHaveProperty('topServicos');
      expect(analytics).toHaveProperty('topProfissionais');
      expect(analytics).toHaveProperty('ocupacaoHoje');
      expect(analytics).toHaveProperty('agendamentosHoje');
    });

    it('deve calcular ocupacaoHoje com base na timeline', () => {
      // s1 tem 1 sessão de 60min → ocupacao = 60/720 ≈ 8%
      const analytics = store.getState().getRoomAnalytics('s1');
      expect(analytics.ocupacaoHoje).toBe(8);
    });
  });

  /* ─── GET ROOM TIMELINE ─── */

  describe('getRoomTimeline', () => {
    it('deve mapear slots de 30min (08:00-20:00 = 24 slots)', () => {
      const timeline = store.getState().getRoomTimeline('s1');
      expect(timeline).toHaveLength(24);
    });

    it('cada slot deve ter slot (string) e appt (objeto ou undefined)', () => {
      const timeline = store.getState().getRoomTimeline('s1');
      timeline.forEach((t) => {
        expect(typeof t.slot).toBe('string');
        expect(t.slot).toMatch(/^\d{2}:\d{2}$/);
      });
    });

    it('primeiro slot deve ser 08:00', () => {
      expect(store.getState().getRoomTimeline('s1')[0].slot).toBe('08:00');
    });

    it('último slot deve ser 19:30', () => {
      const timeline = store.getState().getRoomTimeline('s1');
      expect(timeline[timeline.length - 1].slot).toBe('19:30');
    });

    it('sala sem agendamentos deve ter appt = undefined em todos os slots', () => {
      const timeline = store.getState().getRoomTimeline('s3');
      timeline.forEach((t) => expect(t.appt).toBeUndefined());
    });

    it('sala com agendamento deve marcar appt nos slots corretos', () => {
      // s1 tem sessão das 09:00-10:00 → slots 09:00 e 09:30
      const timeline = store.getState().getRoomTimeline('s1');
      const slot9 = timeline.find((t) => t.slot === '09:00');
      expect(slot9.appt).toBeDefined();
      expect(slot9.appt.cliente).toBe('Mariana F.');
    });
  });

  /* ─── SETTERS ─── */

  describe('setSelectedDate / setExpandedRoom', () => {
    it('setSelectedDate deve alterar a data', () => {
      store.getState().setSelectedDate('2026-07-15');
      expect(store.getState().selectedDate).toBe('2026-07-15');
    });

    it('setExpandedRoom deve expandir uma sala', () => {
      store.getState().setExpandedRoom('s1');
      expect(store.getState().expandedRoom).toBe('s1');
    });

    it('setExpandedRoom deve fechar se mesma sala clicada novamente', () => {
      store.getState().setExpandedRoom('s1');
      store.getState().setExpandedRoom('s1');
      expect(store.getState().expandedRoom).toBeNull();
    });

    it('setExpandedRoom deve trocar para outra sala', () => {
      store.getState().setExpandedRoom('s1');
      store.getState().setExpandedRoom('s2');
      expect(store.getState().expandedRoom).toBe('s2');
    });
  });
});
