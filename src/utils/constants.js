/** @format */

/**
 * Fusion ERP v2 — Constantes e Enums do Sistema
 * Migrado por Cristian Marques
 */

export const APP_CONFIG = {
  name: 'Fusion ERP',
  version: '2.0.0',
  description: 'Sistema Premium para Centros de Estética Avançada',

  storage: {
    prefix: 'fusion_',
    type: 'localStorage',
  },

  session: {
    storageKey: 'fusion_session',
    keepAlive: true,
    timeout: 1440,
  },

  supabase: {
    enabled: true,
    storageKey: 'fusion_supabase_auth',
    autoLoadStore: true,
    url: import.meta.env.VITE_SUPABASE_URL || 'https://njbkbhqioieqfzfaczqs.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xwEa8eGaBM4JedwDj8uTRg_WxPRuYJk',
    realtime: {
      tables: ['sessoes_fila', 'salas', 'clientes', 'agendamentos'],
      eventsPerSecond: 10,
    },
  },

  theme: {
    default: 'dark',
    storageKey: 'fusion_theme',
    available: ['light', 'dark', 'system'],
  },

  pagination: {
    defaultPageSize: 20,
    pageSizes: [10, 20, 50, 100],
  },

  locale: {
    currency: 'BRL',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    datetimeFormat: 'DD/MM/YYYY HH:mm',
  },

  notifications: {
    position: 'top-right',
    duration: 5000,
    maxOnScreen: 5,
  },

  demoUsers: [
    { email: 'admin@fusion.com', password: 'admin123', name: 'Cristian Marques', role: 'admin' },
    { email: 'ana@fusion.com', password: 'ana123', name: 'Ana Souza', role: 'recepcionista' },
  ],
};

export const STATUS = {
  AGENDAMENTO: {
    PENDENTE: 'pendente',
    CONFIRMADO: 'confirmado',
    EM_ATENDIMENTO: 'em_atendimento',
    CONCLUIDO: 'concluido',
    CANCELADO: 'cancelado',
    FALTOU: 'faltou',
    REMARCADO: 'remarcado',
  },
  CLIENTE: {
    ATIVO: 'ativo',
    INATIVO: 'inativo',
    BLOQUEADO: 'bloqueado',
    VIP: 'vip',
  },
  PAGAMENTO: {
    PENDENTE: 'pendente',
    PARCIAL: 'parcial',
    PAGO: 'pago',
    ATRASADO: 'atrasado',
    CANCELADO: 'cancelado',
    REEMBOLSADO: 'reembolsado',
  },
};

export const CARGOS = {
  ADMIN: 'admin',
  GERENTE: 'gerente',
  RECEPCIONISTA: 'recepcionista',
  PROFISSIONAL: 'profissional',
};

export const FIDELIDADE_NIVEIS = [
  { nome: 'Bronze', pontosMin: 0, cor: '#CD7F32' },
  { nome: 'Prata', pontosMin: 100, cor: '#C0C0C0' },
  { nome: 'Ouro', pontosMin: 300, cor: '#FFD700' },
  { nome: 'Platina', pontosMin: 600, cor: '#E5E4E2' },
  { nome: 'Diamante', pontosMin: 1000, cor: '#B9F2FF' },
];

export const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const DIAS_SEMANA = [
  'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado',
];

export const MODULOS = [
  { id: 'dashboard', nome: 'Painel do dia', icone: 'dashboard', grupo: 'Visão geral' },
  { id: 'clientes', nome: 'Clientes', icone: 'users', grupo: 'Atendimento' },
  { id: 'agenda', nome: 'Agenda Inteligente', icone: 'calendar', grupo: 'Atendimento' },
  { id: 'prontuario', nome: 'Prontuário Eletrônico', icone: 'file-text', grupo: 'Atendimento' },
  { id: 'fila-atendimento', nome: 'Fila de Atendimento', icone: 'list', grupo: 'Atendimento' },
  { id: 'estoque', nome: 'Estoque', icone: 'package', grupo: 'Operações' },
  { id: 'pdv', nome: 'PDV', icone: 'shopping-cart', grupo: 'Operações' },
  { id: 'salas', nome: 'Gestão de Salas', icone: 'door', grupo: 'Operações' },
  { id: 'pacotes', nome: 'Pacotes de Sessões', icone: 'layers', grupo: 'Operações' },
  { id: 'fidelidade', nome: 'Fidelidade', icone: 'award', grupo: 'Relacionamento' },
  { id: 'planos-recorrentes', nome: 'Planos Recorrentes', icone: 'repeat', grupo: 'Relacionamento' },
  { id: 'lista-espera', nome: 'Lista de Espera', icone: 'clock', grupo: 'Relacionamento' },
  { id: 'bi', nome: 'Business Intelligence', icone: 'chart', grupo: 'Inteligência' },
  { id: 'financeiro', nome: 'Financeiro', icone: 'wallet', grupo: 'Gestão' },
  { id: 'relatorios', nome: 'Relatórios', icone: 'file', grupo: 'Gestão' },
  { id: 'configuracoes', nome: 'Configurações', icone: 'settings', grupo: 'Gestão' },
];
