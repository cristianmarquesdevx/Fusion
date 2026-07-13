/**
 * Fusion ERP - Constantes e Enums do Sistema
 * @author Cristian Marques
 */

const CONSTANTS = {
  // Status de agendamento
  AGENDAMENTO_STATUS: {
    PENDENTE: 'pendente',
    CONFIRMADO: 'confirmado',
    EM_ATENDIMENTO: 'em_atendimento',
    CONCLUIDO: 'concluido',
    CANCELADO: 'cancelado',
    FALTOU: 'faltou',
    REMARCADO: 'remarcado'
  },

  // Status de cliente
  CLIENTE_STATUS: {
    ATIVO: 'ativo',
    INATIVO: 'inativo',
    BLOQUEADO: 'bloqueado',
    VIP: 'vip'
  },

  // Status de pagamento
  PAGAMENTO_STATUS: {
    PENDENTE: 'pendente',
    PARCIAL: 'parcial',
    PAGO: 'pago',
    ATRASADO: 'atrasado',
    CANCELADO: 'cancelado',
    REEMBOLSADO: 'reembolsado'
  },

  // Formas de pagamento
  FORMAS_PAGAMENTO: {
    DINHEIRO: 'dinheiro',
    CARTAO_CREDITO: 'cartao_credito',
    CARTAO_DEBITO: 'cartao_debito',
    PIX: 'pix',
    BOLETO: 'boleto',
    TRANSFERENCIA: 'transferencia',
    CREDITO_CLIENTE: 'credito_cliente'
  },

  // Tipos de transação
  TRANSACAO_TIPO: {
    RECEITA: 'receita',
    DESPESA: 'despesa',
    CREDITO: 'credito',
    DEBITO: 'debito',
    ESTORNO: 'estorno'
  },

  // Status de estoque
  ESTOQUE_STATUS: {
    DISPONIVEL: 'disponivel',
    BAIXO_ESTOQUE: 'baixo_estoque',
    ESGOTADO: 'esgotado',
    VALIDADE_PROXIMA: 'validade_proxima',
    VENCIDO: 'vencido'
  },

  // Categorias de produto
  PRODUTO_CATEGORIA: {
    COSMETICOS: 'cosmeticos',
    EQUIPAMENTOS: 'equipamentos',
    DESCARTAVEIS: 'descarteis',
    MEDICAMENTOS: 'medicamentos',
    UNIFORMES: 'uniformes',
    LIMPEZA: 'limpeza',
    OUTROS: 'outros'
  },

  // Tipos de serviço
  SERVICO_TIPO: {
    ESTETICA_FACIAL: 'estetica_facial',
    ESTETICA_CORPORAL: 'estetica_corporal',
    DEPILACAO: 'depilacao',
    MASSAGEM: 'massagem',
    CAPILAR: 'capilar',
    MAQUIAGEM: 'maquiagem',
    LASER: 'laser',
    CONSULTA: 'consulta',
    OUTROS: 'outros'
  },

  // Cargos / Permissões
  CARGOS: {
    ADMIN: 'admin',
    GERENTE: 'gerente',
    RECEPCIONISTA: 'recepcionista',
    PROFISSIONAL: 'profissional',
    ESTAGIARIO: 'estagiario',
    FINANCEIRO: 'financeiro'
  },

  // Status de fidelidade
  FIDELIDADE_NIVEL: {
    BRONZE: { nome: 'Bronze', pontosMin: 0, cor: '#CD7F32' },
    PRATA: { nome: 'Prata', pontosMin: 100, cor: '#C0C0C0' },
    OURO: { nome: 'Ouro', pontosMin: 300, cor: '#FFD700' },
    PLATINA: { nome: 'Platina', pontosMin: 600, cor: '#E5E4E2' },
    DIAMANTE: { nome: 'Diamante', pontosMin: 1000, cor: '#B9F2FF' }
  },

  // Intervalos de tempo (minutos)
  TEMPO_SLOTS: [15, 20, 30, 40, 45, 60, 90, 120],

  // Dias da semana
  DIAS_SEMANA: [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ],

  DIAS_SEMANA_ABREV: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],

  // Meses
  MESES: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],

  // Limites
  LIMITES: {
    MAX_AGENDAMENTOS_POR_DIA: 50,
    MAX_CLIENTES_POR_PROFISSIONAL: 500,
    MAX_SERVICOS_POR_AGENDAMENTO: 10,
    TOLERANCIA_ATRASO_MIN: 15,
    INTERVALO_MIN_AGENDAMENTO_MIN: 30
  },

  // Estados brasileiros
  ESTADOS: [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ]
};

// Tipos de notificação
CONSTANTS.NOTIFICACAO_TIPO = {
  SUCESSO: 'success',
  ERRO: 'error',
  AVISO: 'warning',
  INFO: 'info'
};

// Ações de auditoria
CONSTANTS.AUDITORIA_ACAO = {
  CRIAR: 'create',
  ATUALIZAR: 'update',
  EXCLUIR: 'delete',
  VISUALIZAR: 'view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  EXPORTAR: 'export',
  IMPORTAR: 'import'
};
