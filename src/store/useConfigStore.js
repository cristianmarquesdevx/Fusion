/** @format */

import { create } from 'zustand';

const initialState = {
  companyInfo: {
    nome: 'Vitta Jardins',
    razaoSocial: 'Vitta Jardins Estética Ltda.',
    cnpj: '00.000.000/0001-00',
    endereco: 'Av. Ibirapuera, 3.500 · Moema · SP',
    telefone: '(11) 97777-6666',
    email: 'contato@vittajardins.com.br',
    site: 'www.vittajardins.com.br',
    logo: null,
  },
  units: [
    { id: 'u1', nome: 'Vitta Jardins — Moema', endereco: 'Av. Ibirapuera, 3.500', telefone: '(11) 97777-6666', status: 'ativa', clientesAtivos: 187 },
    { id: 'u2', nome: 'Vitta Jardins — Vila Olímpia', endereco: 'Rua Olimpíadas, 200', telefone: '(11) 96666-5555', status: 'ativa', clientesAtivos: 92 },
    { id: 'u3', nome: 'Vitta Jardins — Pinheiros', endereco: 'Rua dos Pinheiros, 800', telefone: '(11) 95555-4444', status: 'inativa', clientesAtivos: 45 },
  ],
  team: [
    { id: 'm1', nome: 'Ana Souza', cargo: 'Gerente', email: 'ana@vittajardins.com.br', telefone: '(11) 98888-7777', ativo: true },
    { id: 'm2', nome: 'Dra. Camila Mendes', cargo: 'Médica', email: 'camila@vittajardins.com.br', telefone: '(11) 97777-6666', ativo: true },
    { id: 'm3', nome: 'Fernanda Lima', cargo: 'Esteticista', email: 'fernanda@vittajardins.com.br', telefone: '(11) 96666-5555', ativo: true },
    { id: 'm4', nome: 'Carlos Oliveira', cargo: 'Massoterapeuta', email: 'carlos@vittajardins.com.br', telefone: '(11) 95555-4444', ativo: true },
    { id: 'm5', nome: 'Marina Costa', cargo: 'Recepcionista', email: 'marina@vittajardins.com.br', telefone: '(11) 94444-3333', ativo: true },
  ],
  nextUnitId: 'u4',
  nextMemberId: 'm6',

  /* ═══ Integrações ═══ */
  integrations: {
    abacatepayApiKey: '',
    abacatepayConfigured: false,
    whatsappConfigured: true,
    emailConfigured: true,
    supabaseConfigured: true,
  },

  /* ═══ Notificações ═══ */
  notificationSettings: {
    confirmacao: true,
    lembrete: true,
    atraso: true,
    estoque: true,
    semanal: false,
  },

  /* ═══ Agendamento Público ═══ */
  publicBookingSettings: {
    active: true,
    limitProfessional: true,
    requireDeposit: false,
  },

  activeTab: 'unidade',
  loading: false,
};

export const useConfigStore = create((set, get) => ({
  ...initialState,

  /* ═══ Navegação ═══ */
  setActiveTab: (tab) => set({ activeTab: tab }),

  /* ═══ Unidade (companyInfo) ═══ */
  updateCompanyInfo: (info) =>
    set((state) => ({
      companyInfo: { ...state.companyInfo, ...info },
    })),

  /* ═══ Multiunidade ═══ */
  addUnit: (unit) => {
    const state = get();
    unit.id = state.nextUnitId;
    unit.status = 'ativa';
    unit.clientesAtivos = 0;
    const num = parseInt(state.nextUnitId.replace('u', ''), 10) + 1;
    set({ units: [...state.units, unit], nextUnitId: `u${num}` });
  },

  updateUnit: (id, data) =>
    set((state) => ({
      units: state.units.map((u) =>
        u.id === id ? { ...u, ...data } : u
      ),
    })),

  removeUnit: (id) =>
    set((state) => ({
      units: state.units.filter((u) => u.id !== id),
    })),

  /* ═══ Equipe ═══ */
  addMember: (member) => {
    const state = get();
    member.id = state.nextMemberId;
    member.ativo = true;
    const num = parseInt(state.nextMemberId.replace('m', ''), 10) + 1;
    set({ team: [...state.team, member], nextMemberId: `m${num}` });
  },

  updateMember: (id, data) =>
    set((state) => ({
      team: state.team.map((m) =>
        m.id === id ? { ...m, ...data } : m
      ),
    })),

  toggleMemberStatus: (id) =>
    set((state) => ({
      team: state.team.map((m) =>
        m.id === id ? { ...m, ativo: !m.ativo } : m
      ),
    })),

  removeMember: (id) =>
    set((state) => ({
      team: state.team.filter((m) => m.id !== id),
    })),

  /* ═══ Integrações ═══ */
  updateIntegration: (key, value) =>
    set((state) => ({
      integrations: { ...state.integrations, [key]: value },
    })),

  setAbacatepayKey: (apiKey) =>
    set((state) => ({
      integrations: {
        ...state.integrations,
        abacatepayApiKey: apiKey,
        abacatepayConfigured: !!apiKey && apiKey.length > 10,
      },
    })),

  /* ═══ Notificações ═══ */
  toggleNotification: (key) =>
    set((state) => ({
      notificationSettings: {
        ...state.notificationSettings,
        [key]: !state.notificationSettings[key],
      },
    })),

  setNotification: (key, value) =>
    set((state) => ({
      notificationSettings: { ...state.notificationSettings, [key]: value },
    })),

  /* ═══ Agendamento Público ═══ */
  togglePublicBookingSetting: (key) =>
    set((state) => ({
      publicBookingSettings: {
        ...state.publicBookingSettings,
        [key]: !state.publicBookingSettings[key],
      },
    })),

  setPublicBookingSetting: (key, value) =>
    set((state) => ({
      publicBookingSettings: { ...state.publicBookingSettings, [key]: value },
    })),

  /* ═══ Helpers ═══ */

  /** Retorna a chave da AbacatePay atual (para ser usada nas chamadas API) */
  getAbacatepayApiKey: () => get().integrations.abacatepayApiKey,

  /** Verifica se uma notificação específica está ativa */
  isNotificationActive: (key) => get().notificationSettings[key] === true,

  /** Verifica se o agendamento público está ativo */
  isPublicBookingActive: () => get().publicBookingSettings.active === true,
}));
