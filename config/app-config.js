/**
 * Fusion ERP SaaS - Configuração Global do Aplicativo (LEGADO)
 * @author Cristian Marques
 * @version 1.0.0
 *
 * ⚠️ DEPRECIADO — Mantido apenas para compatibilidade com assets/js/.
 * Para novas implementações, importe de `src/utils/constants.js`.
 *
 * As credenciais do Supabase podem vir de:
 * 1. Variáveis de ambiente injetadas via config/env.generated.js (produção no Vercel)
 * 2. Fallback para valores hardcoded (desenvolvimento local)
 */

// Carrega variáveis de ambiente (geradas pelo script de build, se existirem)
var ENV_SUPABASE_URL = (typeof window !== 'undefined' && window.__SUPABASE_URL__) || null;
var ENV_SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__) || null;

const APP_CONFIG = {
  name: 'Fusion ERP',
  version: '1.0.0',
  description: 'Sistema Premium para Centros de Estética Avançada',
  company: 'Fusion Technologies',
  author: 'Cristian Marques',
  
  // Tema padrão
  theme: {
    default: 'dark',
    storageKey: 'fusion_theme',
    available: ['light', 'dark', 'system']
  },

  // Armazenamento
  storage: {
    prefix: 'fusion_',
    type: 'localStorage' // localStorage | supabase (futuro)
  },

  // Multi-tenant
  multiTenant: {
    enabled: true,
    storageKey: 'fusion_tenant'
  },

  // Sessão
  session: {
    storageKey: 'fusion_session',
    keepAlive: true,
    timeout: 1440 // minutos (24h)
  },

  // API (Supabase)
  api: {
    baseUrl: '',
    supabaseUrl: ENV_SUPABASE_URL || 'https://njbkbhqioieqfzfaczqs.supabase.co',
    supabaseAnonKey: ENV_SUPABASE_ANON_KEY || 'sb_publishable_xwEa8eGaBM4JedwDj8uTRg_WxPRuYJk',
    timeout: 30000,
    // UUID da unidade demo para testes (gerado pela migration 001)
    demoUnidadeId: 'a0000000-0000-0000-0000-000000000001'
  },

  // Supabase
  supabase: {
    enabled: true,
    storageKey: 'fusion_supabase_auth',
    autoLoadStore: true,
    realtime: {
      tables: ['sessoes_fila', 'salas', 'clientes', 'agendamentos'],
      eventsPerSecond: 10
    }
  },

  // Paginação padrão
  pagination: {
    defaultPageSize: 20,
    pageSizes: [10, 20, 50, 100]
  },

  // Moeda e localização
  locale: {
    currency: 'BRL',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'HH:mm',
    datetimeFormat: 'DD/MM/YYYY HH:mm'
  },

  // Notificações
  notifications: {
    position: 'top-right',
    duration: 5000,
    maxOnScreen: 5,
    sound: true
  },

  // Gráficos
  charts: {
    animationDuration: 600,
    defaultColors: [
      '#6C5CE7', '#00B894', '#FDCB6E', '#E17055',
      '#0984E3', '#A29BFE', '#55EFC4', '#FAB1A0',
      '#74B9FF', '#81ECEC', '#FD79A8', '#636E72'
    ]
  },

  // Módulos do sistema
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
    configuracoes: { name: 'Configurações', icon: 'settings', enabled: true, order: 22 }
  },

  // Recursos premium
  premium: {
    maxClients: Infinity,
    maxEmployees: Infinity,
    maxUnits: Infinity,
    storageLimit: '100GB',
    support: 'prioritario',
    features: ['all']
  },

  // Auditoria
  audit: {
    enabled: true,
    storageKey: 'fusion_audit_log',
    retentionDays: 365,
    maxEntries: 100000
  },

  // Versão do banco de dados
  dbVersion: 1
};

// Congelar configuração para evitar mutações acidentais
if (typeof Object.freeze === 'function') {
  Object.freeze(APP_CONFIG);
}
