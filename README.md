<div align="center">
  <img src="/LOGO.png" alt="Fusion ERP" width="120" style="border-radius: 16px;" />
  <h1 align="center" style="margin-top: 8px;">Fusion ERP</h1>
  <p align="center">
    <strong>Sistema Premium de Gestão para Centros de Estética Avançada</strong>
    <br />
    Multi-tenant · Tempo Real · Completo
  </p>
  <p align="center">
    <a href="#-visão-geral">Visão Geral</a> •
    <a href="#-módulos">Módulos</a> •
    <a href="#-tecnologias">Tecnologias</a> •
    <a href="#-primeiros-passos">Primeiros Passos</a> •
    <a href="#-deploy">Deploy</a>
  </p>
</div>

---

## 📋 Visão Geral

**Fusion ERP** é um sistema completo de gestão empresarial desenvolvido especialmente para **centros de estética avançada**, clínicas e salões de beleza. O sistema oferece controle total sobre agendamentos, clientes, financeiro, estoque, equipe, fidelidade e muito mais.

### ✨ Funcionalidades Principais

- **Multi-tenant**: Suporte a múltiplas unidades/unidades com isolamento completo de dados
- **Tempo Real**: Atualizações instantâneas via WebSocket (Supabase Realtime)
- **Offline-first**: Funciona com dados mockados quando offline, sincroniza quando online
- **Responsivo**: Interface adaptável para desktop e mobile
- **Tema escuro/claro**: Alternância entre temas com persistência

---

## 🧩 Módulos

| Módulo | Descrição |
|--------|-----------|
| **📊 Dashboard Executivo** | KPIs em tempo real, faturamento, agendamentos do dia, ocupação |
| **👥 Clientes** | Cadastro completo, busca inteligente, histórico, filtros |
| **📅 Agenda Inteligente** | Visão semanal, drag & drop, conflitos, agendamento público |
| **📋 Prontuário Eletrônico** | Histórico clínico, anotações, anexos |
| **🚶 Fila de Atendimento** | Sessões em tempo real, status, atrasos |
| **🚪 Gestão de Salas** | Ocupação, equipamentos, manutenção, timeline |
| **📦 Estoque** | Controle de itens, entradas, saídas, alertas de estoque crítico |
| **💰 Financeiro** | Receitas, despesas, comissões, fluxo de caixa |
| **🛒 PDV Integrado** | Venda de produtos e serviços, desconto, formas de pagamento |
| **🏆 Fidelidade** | Programa de pontos, níveis, resgate, ranking |
| **📦 Pacotes de Sessões** | Pacotes promocionais, validade, sessões |
| **🔄 Planos Recorrentes** | Assinaturas mensais, MRR, retenção |
| **⏰ Lista de Espera** | Clientes aguardando vaga, preferências |
| **📈 Business Intelligence** | Métricas estratégicas, gráficos, tendências |
| **⚙️ Configurações** | Unidade, equipe, integrações, notificações, aparência |
| **🎯 Multiunidade** | Gerenciamento centralizado de múltiplas filiais |

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| [React](https://react.dev/) | 18+ | Framework UI |
| [Vite](https://vitejs.dev/) | 5+ | Bundler e dev server |
| [TailwindCSS](https://tailwindcss.com/) | 3+ | Estilização utilitária |
| [Zustand](https://github.com/pmndrs/zustand) | 4+ | Gerenciamento de estado |
| [React Router](https://reactrouter.com/) | 6+ | Roteamento SPA |
| [Recharts](https://recharts.org/) | 2+ | Gráficos e visualizações |

### Backend & Database
| Tecnologia | Função |
|------------|--------|
| [Supabase](https://supabase.com/) | Backend as a Service (PostgreSQL, Auth, Realtime) |
| [PostgreSQL](https://www.postgresql.org/) | Banco de dados relacional |
| [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) | Isolamento multi-tenant |
| [Supabase Realtime](https://supabase.com/docs/guides/realtime) | Atualizações em tempo real |

### Infraestrutura
| Serviço | Função |
|---------|--------|
| [Vercel](https://vercel.com/) | Hosting e deploy contínuo |
| [Supabase](https://supabase.com/) | Banco de dados, autenticação, storage |
| [GitHub](https://github.com/) | Versionamento e CI/CD |

---

## 🚀 Primeiros Passos

### Pré-requisitos

- Node.js 18+
- npm 9+
- Conta no [Supabase](https://supabase.com/) (grátis)
- Conta no [Vercel](https://vercel.com/) (grátis)

### 1. Clonar o repositório

```bash
git clone https://github.com/cristianmarquesdevx/Fusion.git
cd Fusion
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar o Supabase

1. Crie um projeto em [https://supabase.com](https://supabase.com)
2. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public key`
3. No **SQL Editor**, execute o script de migração completo:
   ```
   supabase/migrations/004_fusion_erp_all_in_one.sql
   ```
4. Vá em **Authentication > Users** e crie um usuário admin
5. Associe o usuário à tabela `usuarios`:
   ```sql
   INSERT INTO usuarios (auth_user_id, unidade_id, nome, email, tipo)
   VALUES ('<auth-user-id>', 'a0000000-0000-0000-0000-000000000001', 'Admin', 'admin@fusion.com', 'admin');
   ```
6. Vá em **Database > Replication** e habilite real-time para:
   - `sessoes_fila`, `salas`, `clientes`, `agendamentos`, `transacoes`, `estoque_items`

### 4. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Edite `.env` com suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

### 5. Iniciar desenvolvimento

```bash
npm run dev
```

O servidor será iniciado em **http://localhost:3000**.

### Credenciais de teste (modo demonstração)

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@fusion.com | admin123 | Administrador |
| ana@fusion.com | ana123 | Recepcionista |

---

## 🏗️ Estrutura do Projeto

```
Fusion/
├── public/                  # Assets estáticos
├── src/
│   ├── App.jsx             # Componente raiz com roteamento
│   ├── main.jsx            # Entry point
│   ├── index.css           # Estilos globais + Tailwind
│   ├── components/         # Componentes reutilizáveis
│   │   ├── layout/         # Sidebar, Topbar, Shell
│   │   ├── ui/             # Modal, SearchInput, StatusChip
│   │   ├── agenda/         # AgendamentoModal, WeekGrid
│   │   ├── clientes/       # CadastroModal, FidelityBars, ProntuarioModal
│   │   ├── dashboard/      # KPICard, Charts, Timeline
│   │   ├── estoque/        # EntradaModal
│   │   └── financeiro/     # TransacaoModal
│   ├── pages/              # Páginas de cada módulo
│   ├── store/              # Zustand stores com estado
│   │   ├── useAuthStore.js
│   │   ├── useAgendaStore.js
│   │   ├── useClientStore.js
│   │   ├── useDashboardStore.js
│   │   ├── ... (18 stores)
│   │   └── supabase-sync.js   # Utilitário de sincronização
│   ├── services/           # Serviços externos
│   │   ├── supabase.js     # Cliente Supabase completo
│   │   ├── storage.js      # localStorage wrapper
│   │   └── offline.js      # Service Worker
│   ├── utils/              # Constantes, helpers, validadores
│   │   ├── constants.js    # APP_CONFIG, módulos, enums
│   │   ├── helpers.js      # Funções utilitárias
│   │   └── validators.js   # Validações de formulário
│   └── hooks/              # Custom hooks
│       ├── useMediaQuery.js
│       ├── useOnlineStatus.js
│       └── useTheme.js
├── supabase/
│   └── migrations/         # Scripts SQL do banco de dados
│       ├── 001_fusion_erp_schema.sql
│       ├── 002_rls_multi_tenant.sql
│       ├── 003_fusion_erp_functions_views.sql
│       └── 004_fusion_erp_all_in_one.sql  ← Script unificado
├── tests/                  # Testes unitários (Vitest)
├── config/                 # Configurações geradas
├── scripts/                # Scripts de build
├── .env.example            # Template de variáveis de ambiente
├── vercel.json             # Configuração Vercel
├── vite.config.js          # Configuração Vite
├── tailwind.config.js      # Configuração Tailwind
└── package.json            # Dependências e scripts
```

---

## 📦 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento (porta 3000) |
| `npm run build` | Gera build de produção em `dist/` |
| `npm run preview` | Preview do build local |
| `npm run test` | Executa testes (Vitest) |
| `npm run test -- --coverage` | Testes com cobertura |
| `npm run lint` | Verifica qualidade do código (ESLint) |

---

## 🗄️ Banco de Dados

O Fusion ERP utiliza PostgreSQL via Supabase com **25+ tabelas** organizadas em:

- **Core**: unidades, profissionais, usuarios, servicos
- **Negócio**: clientes, prontuarios, salas, equipamentos, pacotes, planos, assinaturas
- **Operação**: agendamentos, sessoes_fila, transacoes, pdv_vendas, estoque
- **Relacionamento**: fidelidade, lista_espera, auditoria

### Funções e Views

| Nome | Descrição |
|------|-----------|
| `criar_agendamento()` | Cria agendamento + sessão na fila atomicamente |
| `finalizar_sessao()` | Conclui sessão, gera transação e pontos fidelidade |
| `finalizar_venda_pdv()` | Finaliza venda no PDV com baixa de estoque |
| `registrar_entrada_estoque()` | Registra entrada e atualiza quantidade |
| `get_dashboard_data()` | Retorna JSON com KPIs do dashboard |
| `vw_financeiro_mensal` | View de receitas/despesas mensais |
| `vw_fidelidade_completa` | View completa do programa de fidelidade |
| `vw_estoque_critico` | View de itens com estoque baixo |
| `vw_bi_indicadores` | Indicadores estratégicos de BI |

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com isolamento multi-tenant:
- **Admin**: Acesso total
- **Gerente**: CRUD em operações, gestão de equipe
- **Recepcionista**: CRUD em clientes, agendamentos, fila
- **Profissionais**: Acesso apenas aos próprios agendamentos/sessões

---

## 🌐 Deploy

O projeto está configurado para deploy automático no Vercel:

1. Conecte o repositório no [Vercel](https://vercel.com/)
2. Configure as variáveis de ambiente:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Faça push para a branch `main` → deploy automático

**Deploy manual:**
```bash
vercel --prod
```

### Produção

🌐 **https://fusion-erp.vercel.app**

---

## 🧪 Testes

O projeto possui **685+ testes** abrangendo:

- **Stores**: Validação de estado, ações e filtros
- **Helpers**: Funções utilitárias
- **Validators**: Validações de formulário
- **Componentes**: Sidebar, Configurações, Modais
- **Integração**: Fluxos completos entre módulos

```bash
# Executar todos os testes
npm run test

# Modo watch (desenvolvimento)
npm run test -- --watch
```

---

## 🎨 Design System

- **Paleta**: Tons neutros com acentos verde (sage), dourado, roxo e rosa
- **Tipografia**: Sistema com `font-sans`, `font-display` e `font-mono`
- **Modo escuro**: Suporte nativo com alternância
- **Animações**: Fade-in, transições suaves, micro-interações
- **Ícones**: SVG inline em cada módulo

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 👨‍💻 Autor

**Cristian Marques** — Desenvolvedor Full Stack

- GitHub: [@cristianmarquesdevx](https://github.com/cristianmarquesdevx)
- Projeto: [Fusion ERP](https://fusion-erp.vercel.app)

---

<div align="center">
  <sub>Built with ❤️ by Cristian Marques</sub>
  <br />
  <sub>Fusion ERP v2.0.0</sub>
</div>
