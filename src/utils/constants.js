/** @format */

/**
 * Fusion ERP v2 — Constantes e Enums do Sistema
 * Migrado por Cristian Marques
 */

/**
 * Fusion ERP v2 — Configuração Global do Aplicativo
 *
 * Fonte Única de Verdade (Single Source of Truth).
 * NOTA: O arquivo legado `config/app-config.js` está DEPRECIADO.
 * Todas as novas funcionalidades devem importar daqui.
 *
 * @see config/app-config.js (legado — mantido para compatibilidade com assets/js/)
 */
export const APP_CONFIG = {
  name: 'Fusion ERP',
  version: '2.0.0',
  description: 'Sistema Premium para Centros de Estética Avançada',
  company: 'Fusion Technologies',
  author: 'Cristian Marques',

  storage: {
    prefix: 'fusion_',
    type: 'localStorage',
  },

  session: {
    storageKey: 'fusion_session',
    keepAlive: true,
    timeout: 1440, // minutos (24h)
  },

  // Multi-tenant
  multiTenant: {
    enabled: true,
    storageKey: 'fusion_tenant',
  },

  supabase: {
    enabled: true,
    storageKey: 'fusion_supabase_auth',
    autoLoadStore: true,
    url: import.meta.env.VITE_SUPABASE_URL || 'https://njbkbhqioieqfzfaczqs.supabase.co',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xwEa8eGaBM4JedwDj8uTRg_WxPRuYJk',
    timeout: 30000,
    demoUnidadeId: 'a0000000-0000-0000-0000-000000000001',
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
    sound: true,
  },

  // Gráficos
  charts: {
    animationDuration: 600,
    defaultColors: [
      '#6C5CE7', '#00B894', '#FDCB6E', '#E17055',
      '#0984E3', '#A29BFE', '#55EFC4', '#FAB1A0',
      '#74B9FF', '#81ECEC', '#FD79A8', '#636E72',
    ],
  },

  // Feature flags dos módulos
  modules: {
    dashboard: { name: 'Dashboard Executivo', icon: 'layout-dashboard', enabled: true, order: 0 },
    clientes: { name: 'Clientes', icon: 'users', enabled: true, order: 1 },
    agenda: { name: 'Agenda Inteligente', icon: 'calendar', enabled: true, order: 2 },
    agendamento: { name: 'Agendamento Público', icon: 'calendar-plus', enabled: true, order: 3 },
    portalCliente: { name: 'Portal do Cliente', icon: 'user-circle', enabled: true, order: 4 },
    prontuario: { name: 'Prontuário Eletrônico', icon: 'file-text', enabled: true, order: 5 },
    estoque: { name: 'Controle de Estoque', icon: 'package', enabled: true, order: 6 },
    financeiro: { name: 'Financeiro', icon: 'wallet', enabled: true, order: 7 },
    pdv: { name: 'PDV Integrado', icon: 'shopping-cart', enabled: true, order: 8 },
    fidelidade: { name: 'Programa de Fidelidade', icon: 'award', enabled: true, order: 9 },
    pacotes: { name: 'Pacotes de Sessões', icon: 'layers', enabled: true, order: 10 },
    listaEspera: { name: 'Lista de Espera', icon: 'clock', enabled: true, order: 11 },
    confirmacao: { name: 'Confirmação WhatsApp', icon: 'message-circle', enabled: true, order: 12 },
    salas: { name: 'Gestão de Salas', icon: 'door-open', enabled: true, order: 13 },
    filaAtendimento: { name: 'Fila de Atendimento', icon: 'list-ordered', enabled: true, order: 14 },
    planosRecorrentes: { name: 'Planos Recorrentes', icon: 'repeat', enabled: true, order: 15 },
    bi: { name: 'Business Intelligence', icon: 'bar-chart-3', enabled: true, order: 16 },
    notificacoes: { name: 'Central de Notificações', icon: 'bell', enabled: true, order: 17 },
    multiunidade: { name: 'Multiunidade', icon: 'building', enabled: true, order: 18 },
    permissoes: { name: 'Permissões Granulares', icon: 'shield', enabled: true, order: 19 },
    auditoria: { name: 'Auditoria Completa', icon: 'clipboard-list', enabled: true, order: 20 },
    seguranca: { name: 'Segurança LGPD', icon: 'lock', enabled: true, order: 21 },
    configuracoes: { name: 'Configurações', icon: 'settings', enabled: true, order: 22 },
  },

  // Recursos premium
  premium: {
    maxClients: Infinity,
    maxEmployees: Infinity,
    maxUnits: Infinity,
    storageLimit: '100GB',
    support: 'prioritario',
    features: ['all'],
  },

  // Auditoria
  audit: {
    enabled: true,
    storageKey: 'fusion_audit_log',
    retentionDays: 365,
    maxEntries: 100000,
  },

  dbVersion: 1,

  // Usuários demo para fallback offline
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
  { id: 'agendamento', nome: 'Agendamento Público', icone: 'calendar', grupo: 'Atendimento', externo: 'agendar.html' },
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
