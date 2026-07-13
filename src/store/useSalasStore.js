/** @format */

import { create } from 'zustand';

// ─── Helpers internos ───
const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
const parseMin = (hora) => { const [h, m] = hora.split(':').map(Number); return h * 60 + m; };
const formatMin = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// ─── Intervalos de 30min das 08:00 às 20:00 ───
const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => formatMin(i * 30 + 480)); // 480 = 08:00

const initialState = {
  list: [
    { id: 's1', nome: 'Sala 1 — Estética Facial', capacidade: 1, status: 'disponivel', currentSession: null, nextSession: { profissional: 'Fernanda', hora: '15:00', servico: 'Limpeza de pele', cliente: 'Marina Costa' }, manutencao: null },
    { id: 's2', nome: 'Sala 2 — Procedimentos', capacidade: 1, status: 'em_uso', currentSession: { profissional: 'Dra. Camila', cliente: 'Camila Ferreira', servico: 'Microagulhamento', ate: '14:00' }, nextSession: null, manutencao: null },
    { id: 's3', nome: 'Sala 3 — Massagem', capacidade: 1, status: 'disponivel', currentSession: null, nextSession: { profissional: 'Carlos', hora: '16:00', servico: 'Massagem relaxante', cliente: 'Sofia Ribeiro' }, manutencao: null },
    { id: 's4', nome: 'Sala de Laser', capacidade: 1, status: 'manutencao', currentSession: null, nextSession: null, manutencao: { motivo: 'Manutenção preventiva programada', previsao: '03/07', tecnico: 'João' } },
    { id: 's5', nome: 'Sala de Procedimentos', capacidade: 1, status: 'ocupada', currentSession: { profissional: 'Dra. Camila', cliente: 'Juliana Prado', servico: 'Toxina botulínica', ate: '12:15' }, nextSession: null, manutencao: null },
  ],

  // ─── Timeline: sessões do dia por sala ───
  timeline: {
    's1': [
      { id: 't1', hora: '09:00', duracao: 60, cliente: 'Mariana F.', servico: 'Limpeza de pele', profissional: 'Fernanda', status: 'concluido' },
      { id: 't2', hora: '11:00', duracao: 90, cliente: 'Carla D.', servico: 'Peeling', profissional: 'Fernanda', status: 'concluido' },
      { id: 't3', hora: '15:00', duracao: 60, cliente: 'Marina Costa', servico: 'Limpeza de pele', profissional: 'Fernanda', status: 'confirmado' },
    ],
    's2': [
      { id: 't4', hora: '10:00', duracao: 60, cliente: 'Renata A.', servico: 'Peeling', profissional: 'Dra. Camila', status: 'concluido' },
      { id: 't5', hora: '13:00', duracao: 60, cliente: 'Camila F.', servico: 'Microagulhamento', profissional: 'Dra. Camila', status: 'ativo' },
    ],
    's3': [
      { id: 't6', hora: '14:00', duracao: 60, cliente: 'Sofia R.', servico: 'Massagem relaxante', profissional: 'Carlos', status: 'confirmado' },
      { id: 't7', hora: '16:00', duracao: 60, cliente: 'Sofia Ribeiro', servico: 'Massagem relaxante', profissional: 'Carlos', status: 'confirmado' },
    ],
    's4': [],
    's5': [
      { id: 't8', hora: '11:30', duracao: 45, cliente: 'Juliana Prado', servico: 'Toxina botulínica', profissional: 'Dra. Camila', status: 'ativo' },
    ],
  },

  // ─── Equipamentos por sala ───
  equipment: {
    's1': [
      { id: 'e1', nome: 'Laser ND:YAG', tipo: 'Laser', ultimaManutencao: '15/06/2026', proximaManutencao: '15/09/2026', usoTotal: 420, saude: 87 },
      { id: 'e2', nome: 'Microdermoabrasão', tipo: 'Mecânico', ultimaManutencao: '20/05/2026', proximaManutencao: '20/08/2026', usoTotal: 180, saude: 92 },
      { id: 'e3', nome: 'Luz Intensa Pulsada', tipo: 'Laser', ultimaManutencao: '01/06/2026', proximaManutencao: '01/09/2026', usoTotal: 310, saude: 78 },
    ],
    's2': [
      { id: 'e4', nome: 'Cama Hidráulica Elétrica', tipo: 'Móvel', ultimaManutencao: '10/04/2026', proximaManutencao: '10/10/2026', usoTotal: 560, saude: 95 },
      { id: 'e5', nome: 'Painel LED Terapêutico', tipo: 'LED', ultimaManutencao: '05/06/2026', proximaManutencao: '05/09/2026', usoTotal: 240, saude: 88 },
    ],
    's3': [
      { id: 'e6', nome: 'Maca Elétrica', tipo: 'Móvel', ultimaManutencao: '22/03/2026', proximaManutencao: '22/09/2026', usoTotal: 680, saude: 82 },
      { id: 'e7', nome: 'Difusor Aromaterapia', tipo: 'Elétrico', ultimaManutencao: '01/05/2026', proximaManutencao: '01/08/2026', usoTotal: 190, saude: 96 },
    ],
    's4': [
      { id: 'e8', nome: 'Laser CO2 Fracionado', tipo: 'Laser', ultimaManutencao: '28/06/2026', proximaManutencao: '28/07/2026', usoTotal: 150, saude: 65 },
      { id: 'e9', nome: 'Luz Pulsada Intensa', tipo: 'Laser', ultimaManutencao: '28/06/2026', proximaManutencao: '28/08/2026', usoTotal: 280, saude: 72 },
    ],
    's5': [
      { id: 'e10', nome: 'Cama Cirúrgica Elétrica', tipo: 'Móvel', ultimaManutencao: '15/05/2026', proximaManutencao: '15/11/2026', usoTotal: 420, saude: 90 },
      { id: 'e11', nome: 'Monitor Multiparâmetros', tipo: 'Monitor', ultimaManutencao: '10/06/2026', proximaManutencao: '10/12/2026', usoTotal: 110, saude: 98 },
      { id: 'e12', nome: 'Aspirador Cirúrgico', tipo: 'Elétrico', ultimaManutencao: '10/04/2026', proximaManutencao: '10/10/2026', usoTotal: 85, saude: 85 },
    ],
  },

  // ─── Sessões concluídas (histórico) ───
  sessionHistory: [
    { id: 'h1', salaId: 's1', hora: '09:00', duracao: 60, cliente: 'Mariana F.', servico: 'Limpeza de pele', profissional: 'Fernanda', data: '30/06', valor: 180 },
    { id: 'h2', salaId: 's1', hora: '11:00', duracao: 90, cliente: 'Carla D.', servico: 'Peeling', profissional: 'Fernanda', data: '30/06', valor: 250 },
    { id: 'h3', salaId: 's2', hora: '10:00', duracao: 60, cliente: 'Renata A.', servico: 'Peeling', profissional: 'Dra. Camila', data: '30/06', valor: 250 },
    { id: 'h4', salaId: 's5', hora: '11:30', duracao: 45, cliente: 'Juliana Prado', servico: 'Toxina botulínica', profissional: 'Dra. Camila', data: '30/06', valor: 890 },
    { id: 'h5', salaId: 's2', hora: '09:00', duracao: 60, cliente: 'Ana Paula', servico: 'Limpeza', profissional: 'Fernanda', data: '29/06', valor: 180 },
    { id: 'h6', salaId: 's3', hora: '14:00', duracao: 60, cliente: 'Bianca O.', servico: 'Massagem', profissional: 'Carlos', data: '29/06', valor: 200 },
    { id: 'h7', salaId: 's1', hora: '15:00', duracao: 60, cliente: 'Marina Costa', servico: 'Limpeza', profissional: 'Fernanda', data: '28/06', valor: 180 },
    { id: 'h8', salaId: 's4', hora: '10:00', duracao: 60, cliente: 'Tais F.', servico: 'Laser CO2', profissional: 'Dra. Camila', data: '27/06', valor: 1200 },
  ],

  scheduleLog: [],
  selectedDate: new Date().toISOString().split('T')[0],
  expandedRoom: null,
  searchTerm: '',
  activeFilters: {},
  loading: false,
};

export const useSalasStore = create((set, get) => ({
  ...initialState,

  /* ═══════════════════════════════════════════════════════
     STATUS INFO
     ═══════════════════════════════════════════════════════ */
  getStatusInfo(status) {
    const map = {
      disponivel: { label: 'Disponível', chip: 'bg-sage-soft/20 dark:bg-sage-dark-soft/20 text-sage dark:text-sage-dark', dot: 'bg-sage dark:bg-sage-dark', order: 0 },
      em_uso: { label: 'Em uso', chip: 'bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark', dot: 'bg-gold dark:bg-gold-dark', order: 1 },
      ocupada: { label: 'Ocupada', chip: 'bg-rose-soft/20 dark:bg-rose-dark-soft/20 text-rose dark:text-rose-dark', dot: 'bg-rose dark:bg-rose-dark', order: 2 },
      manutencao: { label: 'Manutenção', chip: 'bg-rose-soft/30 dark:bg-rose-dark-soft/30 text-rose dark:text-rose-dark', dot: 'bg-rose dark:bg-rose-dark', order: 3 },
    };
    return map[status] || { label: status, chip: 'bg-surface-2', dot: 'bg-ink-faint', order: 99 };
  },

  /* ═══════════════════════════════════════════════════════
     FILTROS / BUSCA
     ═══════════════════════════════════════════════════════ */
  setSearchTerm: (term) => set({ searchTerm: term }),
  setFilter: (key, value) => set((state) => ({
    activeFilters: value
      ? { ...state.activeFilters, [key]: value }
      : Object.fromEntries(Object.entries(state.activeFilters).filter(([k]) => k !== key)),
  })),
  clearFilters: () => set({ activeFilters: {} }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setExpandedRoom: (id) => set({ expandedRoom: get().expandedRoom === id ? null : id }),

  getFilteredList() {
    const { list, searchTerm, activeFilters } = get();
    let filtered = [...list];
    const term = searchTerm?.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter((s) =>
        s.nome.toLowerCase().includes(term) ||
        Object.values(get().equipment[s.id] || {}).some((eq) => eq.nome?.toLowerCase().includes(term))
      );
    }
    if (activeFilters.status) {
      filtered = filtered.filter((s) => {
        const info = get().getStatusInfo(s.status);
        return info.label.toLowerCase() === activeFilters.status.toLowerCase();
      });
    }
    return filtered;
  },

  /* ═══════════════════════════════════════════════════════
     KPIs AVANÇADOS
     ═══════════════════════════════════════════════════════ */
  getKPIs() {
    const { list, timeline, sessionHistory } = get();
    const totalSalas = list.length;
    const emUso = list.filter((s) => s.status === 'em_uso' || s.status === 'ocupada').length;
    const disponiveis = list.filter((s) => s.status === 'disponivel').length;
    const manutencao = list.filter((s) => s.status === 'manutencao').length;
    const ocupacao = totalSalas > 0 ? Math.round((emUso / totalSalas) * 100) : 0;

    // Sessões hoje
    const sessoesHoje = Object.values(timeline).flat().length;
    const sessoesAtivas = Object.values(timeline).flat().filter((s) => s.status === 'ativo').length;

    // Receita do dia (baseada nas sessões concluídas + ativas)
    const receitaHoje = sessionHistory
      .filter((h) => h.data === '30/06')
      .reduce((sum, h) => sum + (h.valor || 0), 0);

    // Média de duração (min)
    const duracoes = Object.values(timeline).flat().map((s) => s.duracao);
    const duracaoMedia = duracoes.length > 0
      ? Math.round(duracoes.reduce((a, b) => a + b, 0) / duracoes.length)
      : 0;

    // Tempo de setup estimado entre sessões
    const turnoverMedio = 15; // minutos

    // Equipamentos em manutenção
    const equipamentosManut = Object.values(get().equipment).flat().filter((eq) => eq.saude < 70).length;

    return {
      totalSalas, emUso, disponiveis, manutencao, ocupacao,
      sessoesHoje, sessoesAtivas, receitaHoje, duracaoMedia,
      turnoverMedio, equipamentosManut, totalProfissionais: 3,
    };
  },

  /* ═══════════════════════════════════════════════════════
     TIMELINE — GERENCIAMENTO DE SESSÕES
     ═══════════════════════════════════════════════════════ */
  scheduleAppointment({ salaId, hora, duracao, cliente, servico, profissional }) {
    const state = get();
    const roomTimeline = state.timeline[salaId] || [];

    // ─── Detecção de conflito de horário ───
    const novoInicio = parseMin(hora);
    const novoFim = novoInicio + duracao;

    for (const appt of roomTimeline) {
      if (appt.status === 'cancelado') continue;
      const apptInicio = parseMin(appt.hora);
      const apptFim = apptInicio + appt.duracao;
      if (novoInicio < apptFim && novoFim > apptInicio) {
        return {
          success: false,
          error: `Conflito de horário com "${appt.cliente}" (${appt.hora} - ${formatMin(apptFim)})`,
        };
      }
    }

    // ─── Conflito de profissional (mesmo horário em outra sala) ───
    for (const [sid, apps] of Object.entries(state.timeline)) {
      if (sid === salaId) continue;
      for (const appt of apps) {
        if (appt.profissional === profissional && appt.status !== 'cancelado') {
          const apptInicio = parseMin(appt.hora);
          const apptFim = apptInicio + appt.duracao;
          if (novoInicio < apptFim && novoFim > apptInicio) {
            return {
              success: false,
              error: `Profissional "${profissional}" já tem sessão na ${get().list.find((s) => s.id === sid)?.nome || sid} às ${appt.hora}`,
            };
          }
        }
      }
    }

    const newAppt = {
      id: generateId(),
      hora, duracao, cliente, servico, profissional,
      status: 'confirmado',
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      timeline: {
        ...state.timeline,
        [salaId]: [...(state.timeline[salaId] || []), newAppt].sort((a, b) => parseMin(a.hora) - parseMin(b.hora)),
      },
      scheduleLog: [...state.scheduleLog, { ...newAppt, action: 'agendado', timestamp: new Date().toISOString() }],
    }));

    return { success: true, appointment: newAppt };
  },

  updateSessionStatus(salaId, sessionId, status) {
    set((state) => ({
      timeline: {
        ...state.timeline,
        [salaId]: (state.timeline[salaId] || []).map((s) =>
          s.id === sessionId ? { ...s, status } : s
        ),
      },
      scheduleLog: [...state.scheduleLog, { sessionId, action: `status:${status}`, timestamp: new Date().toISOString() }],
    }));
  },

  startSession(salaId, sessionId) {
    const state = get();
    const session = state.timeline[salaId]?.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Sessão não encontrada' };

    // Atualiza sala para em_uso
    set((state) => ({
      timeline: {
        ...state.timeline,
        [salaId]: (state.timeline[salaId] || []).map((s) =>
          s.id === sessionId ? { ...s, status: 'ativo', inicioReal: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } : s
        ),
      },
      list: state.list.map((s) =>
        s.id === salaId ? {
          ...s,
          status: 'em_uso',
          currentSession: {
            profissional: session.profissional,
            cliente: session.cliente,
            servico: session.servico,
            inicio: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            ate: formatMin(parseMin(session.hora) + session.duracao),
          },
        } : s
      ),
      scheduleLog: [...state.scheduleLog, { sessionId, action: 'iniciado', timestamp: new Date().toISOString() }],
    }));
    return { success: true };
  },

  endSession(salaId, sessionId) {
    const state = get();
    const session = state.timeline[salaId]?.find((s) => s.id === sessionId);
    if (!session) return { success: false, error: 'Sessão não encontrada' };

    const fimReal = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Move para histórico
    const historyEntry = {
      id: generateId(),
      salaId,
      hora: session.hora,
      duracao: session.duracao,
      cliente: session.cliente,
      servico: session.servico,
      profissional: session.profissional,
      data: new Date().toLocaleDateString('pt-BR'),
      valor: 0, // será preenchido pelo financeiro
      inicioReal: session.inicioReal,
      fimReal,
    };

    set((state) => ({
      timeline: {
        ...state.timeline,
        [salaId]: (state.timeline[salaId] || []).map((s) =>
          s.id === sessionId ? { ...s, status: 'concluido', fimReal } : s
        ),
      },
      list: state.list.map((s) =>
        s.id === salaId ? { ...s, status: 'disponivel', currentSession: null } : s
      ),
      sessionHistory: [...state.sessionHistory, historyEntry],
      scheduleLog: [...state.scheduleLog, { sessionId, action: 'concluido', timestamp: new Date().toISOString() }],
    }));
    return { success: true, historyEntry };
  },

  /* ═══════════════════════════════════════════════════════
     EQUIPAMENTOS
     ═══════════════════════════════════════════════════════ */
  logMaintenance(salaId, equipId) {
    set((state) => ({
      equipment: {
        ...state.equipment,
        [salaId]: (state.equipment[salaId] || []).map((eq) =>
          eq.id === equipId ? {
            ...eq,
            saude: 100,
            ultimaManutencao: new Date().toLocaleDateString('pt-BR'),
            proximaManutencao: new Date(Date.now() + 90 * 86400000).toLocaleDateString('pt-BR'),
          } : eq
        ),
      },
      scheduleLog: [...state.scheduleLog, { equipId, action: 'manutencao', timestamp: new Date().toISOString() }],
    }));
  },

  getEquipmentHealthColor(saude) {
    if (saude >= 85) return { color: '#4C7A5E', bg: 'bg-sage-soft/20', text: 'text-sage', label: 'Ótimo' };
    if (saude >= 70) return { color: '#9C7A3E', bg: 'bg-gold-soft/20', text: 'text-gold', label: 'Bom' };
    if (saude >= 50) return { color: '#B14E3D', bg: 'bg-rose-soft/20', text: 'text-rose', label: 'Atenção' };
    return { color: '#D63031', bg: 'bg-rose-soft/30', text: 'text-rose', label: 'Crítico' };
  },

  /* ═══════════════════════════════════════════════════════
     SALAS — CRUD
     ═══════════════════════════════════════════════════════ */
  addSala: (sala) => set((state) => {
    const newId = `s${state.list.length + 1}`;
    return {
      list: [...state.list, {
        id: newId, ...sala, status: sala.status || 'disponivel',
        currentSession: null, nextSession: null, manutencao: null,
      }],
      timeline: { ...state.timeline, [newId]: [] },
      equipment: { ...state.equipment, [newId]: [] },
    };
  }),

  updateSalaStatus: (id, params) => set((state) => ({
    list: state.list.map((s) => s.id === id ? { ...s, ...params } : s),
  })),

  /* ═══════════════════════════════════════════════════════
     ANÁLISE POR SALA
     ═══════════════════════════════════════════════════════ */
  getRoomAnalytics(salaId) {
    const { sessionHistory, timeline } = get();
    const historico = sessionHistory.filter((h) => h.salaId === salaId);
    const timelineHoje = timeline[salaId] || [];

    const totalSessoes = historico.length;
    const receitaTotal = historico.reduce((sum, h) => sum + (h.valor || 0), 0);
    const duracaoMedia = totalSessoes > 0
      ? Math.round(historico.reduce((sum, h) => sum + h.duracao, 0) / totalSessoes)
      : 0;

    // Serviços mais comuns
    const servicos = {};
    historico.forEach((h) => { servicos[h.servico] = (servicos[h.servico] || 0) + 1; });
    const topServicos = Object.entries(servicos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nome, count]) => ({ nome, count }));

    // Profissionais que mais usam
    const profs = {};
    historico.forEach((h) => { profs[h.profissional] = (profs[h.profissional] || 0) + 1; });
    const topProfissionais = Object.entries(profs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([nome, count]) => ({ nome, count }));

    // Ocupação da timeline hoje
    const slotsOcupados = timelineHoje.reduce((sum, s) => sum + s.duracao, 0);
    const slotsDisponiveis = 720 - slotsOcupados; // 12h = 720min (08:00-20:00)
    const ocupacaoHoje = Math.round((slotsOcupados / 720) * 100);

    return {
      totalSessoes, receitaTotal, duracaoMedia,
      topServicos, topProfissionais,
      slotsOcupados, slotsDisponiveis, ocupacaoHoje,
      agendamentosHoje: timelineHoje.length,
    };
  },

  /* ═══════════════════════════════════════════════════════
     TIMELINE — DADOS VISUAIS
     ═══════════════════════════════════════════════════════ */
  getRoomTimeline(salaId) {
    const appts = get().timeline[salaId] || [];
    // Mapeia cada slot de 30min (08:00-20:00 = 24 slots)
    return TIME_SLOTS.map((slot) => {
      const appt = appts.find((a) => {
        const aInicio = parseMin(a.hora);
        const aFim = aInicio + a.duracao;
        const slotMin = parseMin(slot);
        return slotMin >= aInicio && slotMin < aFim;
      });
      return { slot, appt };
    });
  },
}));
