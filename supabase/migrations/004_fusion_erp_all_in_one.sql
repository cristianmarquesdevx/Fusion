-- ============================================================================
-- FUSION ERP — MIGRAÇÃO COMPLETA (ALL-IN-ONE)
-- ============================================================================
-- Este script unifica as migrations 001, 002 e 003 + novas tabelas.
-- Pode ser executado com segurança no SQL Editor do Supabase.
-- Use: https://app.supabase.com -> SQL Editor -> Cole e execute.
-- ============================================================================
-- @author Cristian Marques
-- @version 2.0.0
-- ============================================================================

-- ############################################################################
-- 1. EXTENSIONS
-- ############################################################################
create extension if not exists "pgcrypto" with schema "extensions";
create extension if not exists "uuid-ossp" with schema "extensions";
create extension if not exists "pg_trgm";

-- ############################################################################
-- 2. ENUMS
-- ############################################################################
do $$ begin
  create type status_sala as enum ('disponivel', 'em_uso', 'ocupada', 'manutencao');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type status_sessao as enum ('confirmado', 'aguardando', 'ativo', 'atrasado', 'concluido', 'cancelado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tipo_transacao as enum ('receita', 'despesa');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type status_transacao as enum ('Pago', 'Pendente', 'A pagar', 'Cancelado');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tipo_usuario as enum ('admin', 'recepcionista', 'medico', 'esteticista', 'massoterapeuta', 'maquiadora', 'gerente');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type periodo_preferencia as enum ('Manhã', 'Tarde', 'Qualquer', 'Qualquer horário');
exception when duplicate_object then null;
end $$;

-- ############################################################################
-- 3. TABELAS CORE
-- ############################################################################

-- 3.1. Unidades (multi-tenant)
create table if not exists unidades (
  id          uuid        primary key default gen_random_uuid(),
  nome        text        not null,
  cnpj        text        unique,
  endereco    text,
  cidade      text,
  uf          char(2),
  telefone    text,
  whatsapp    text,
  email       text,
  logo_url    text,
  ativo       boolean     not null default true,
  metadata    jsonb       default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3.2. Profissionais (equipe)
create table if not exists profissionais (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  cargo           text,
  tipo            tipo_usuario    not null default 'recepcionista',
  email           text,
  telefone        text,
  avatar_url      text,
  ativo           boolean         not null default true,
  ferias          boolean         not null default false,
  data_inicio     date,
  cor_tag         text            default '#6C5CE7',
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 3.3. Usuários do sistema (auth)
create table if not exists usuarios (
  id              uuid            primary key default gen_random_uuid(),
  auth_user_id    uuid            unique references auth.users(id) on delete cascade,
  unidade_id      uuid            references unidades(id) on delete set null,
  profissional_id uuid            references profissionais(id) on delete set null,
  nome            text            not null,
  email           text            not null unique,
  tipo            tipo_usuario    not null default 'recepcionista',
  avatar_url      text,
  ativo           boolean         not null default true,
  ultimo_login    timestamptz,
  metadata        jsonb           default '{}'::jsonb,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 3.4. Serviços (catálogo)
create table if not exists servicos (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  descricao       text,
  categoria       text,
  valor           decimal(10,2)   not null default 0,
  duracao_min     integer         not null default 60,
  comissao_pct    decimal(5,2)    default 0,
  ativo           boolean         not null default true,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- ############################################################################
-- 4. TABELAS DE NEGÓCIO
-- ############################################################################

-- 4.1. Clientes
create table if not exists clientes (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  email           text,
  telefone        text,
  cpf             text,
  data_nascimento date,
  endereco        text,
  cliente_desde   date            not null default current_date,
  ultima_visita   timestamptz,
  observacoes     text,
  indicado_por    text,
  ativo           boolean         not null default true,
  metadata        jsonb           default '{}'::jsonb,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.2. Prontuários (histórico clínico)
create table if not exists prontuarios (
  id              uuid            primary key default gen_random_uuid(),
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  tipo            text            not null default 'consulta',  -- 'consulta', 'procedimento', 'evolucao', 'receita', 'exame'
  profissional_id uuid            references profissionais(id) on delete set null,
  data            timestamptz     not null default now(),
  titulo          text            not null,
  descricao       text,
  anotacoes       text,
  anexos          jsonb           default '[]'::jsonb,
  created_by      uuid            references usuarios(id) on delete set null,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.3. Salas
create table if not exists salas (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  equipamentos_desc text,
  capacidade      integer         not null default 1,
  status          status_sala     not null default 'disponivel',
  sessao_atual_id uuid,
  manutencao_motivo text,
  manutencao_previsao date,
  manutencao_tecnico text,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.4. Equipamentos (por sala)
create table if not exists equipamentos (
  id                  uuid            primary key default gen_random_uuid(),
  sala_id             uuid            not null references salas(id) on delete cascade,
  unidade_id          uuid            not null references unidades(id) on delete cascade,
  nome                text            not null,
  tipo                text,            -- 'Laser', 'Mecânico', 'LED', 'Monitor', 'Móvel', etc
  fabricante          text,
  modelo              text,
  numero_serie        text,
  data_aquisicao      date,
  ultima_manutencao   date,
  proxima_manutencao  date,
  uso_total_horas     integer         default 0,
  saude_pct           integer         default 100 check (saude_pct >= 0 and saude_pct <= 100),
  observacoes         text,
  ativo               boolean         not null default true,
  created_at          timestamptz     not null default now(),
  updated_at          timestamptz     not null default now()
);

-- 4.5. Pacotes de sessões
create table if not exists pacotes (
  id                uuid            primary key default gen_random_uuid(),
  unidade_id        uuid            not null references unidades(id) on delete cascade,
  servico_id        uuid            references servicos(id) on delete set null,
  nome              text            not null,
  descricao         text,
  sessoes_total     integer         not null default 1,
  valor             decimal(10,2)   not null default 0,
  validade_meses    integer         not null default 12,
  promocao          boolean         not null default false,
  cor_tag           text            default '#4C7A5E',
  ativo             boolean         not null default true,
  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now()
);

-- 4.6. Planos recorrentes (assinaturas)
create table if not exists planos (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  descricao       text,
  valor           decimal(10,2)   not null default 0,
  beneficios      jsonb           default '[]'::jsonb,
  cor_tag         text            default '#9C7A3E',
  ativo           boolean         not null default true,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.7. Assinaturas (clientes vinculados a planos)
create table if not exists assinaturas (
  id              uuid            primary key default gen_random_uuid(),
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  plano_id        uuid            not null references planos(id) on delete cascade,
  data_inicio     date            not null default current_date,
  data_fim        date,
  valor_cobrado   decimal(10,2),
  dia_cobranca    integer         default 1,
  ativa           boolean         not null default true,
  renovacao_auto  boolean         not null default true,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.8. Pacotes do cliente (pacotes comprados por cliente)
create table if not exists cliente_pacotes (
  id              uuid            primary key default gen_random_uuid(),
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  pacote_id       uuid            not null references pacotes(id) on delete cascade,
  sessoes_usadas  integer         not null default 0,
  sessoes_total   integer         not null,
  valor_pago      decimal(10,2)   default 0,
  data_aquisicao  date            not null default current_date,
  data_validade   date,
  ativo           boolean         not null default true,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- ############################################################################
-- 5. TABELAS DE OPERAÇÃO
-- ############################################################################

-- 5.1. Agendamentos
create table if not exists agendamentos (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  profissional_id uuid            references profissionais(id) on delete set null,
  servico_id      uuid            references servicos(id) on delete set null,
  sala_id         uuid            references salas(id) on delete set null,
  cliente_pacote_id uuid          references cliente_pacotes(id) on delete set null,
  data            date            not null,
  hora            time            not null,
  duracao_min     integer         not null default 60,
  valor           decimal(10,2)   not null default 0,
  status          text            not null default 'confirmado'
                                  check (status in ('pendente','confirmado','em_atendimento','concluido','cancelado','faltou','remarcado')),
  observacoes     text,
  origem          text            default 'interno',   -- 'interno', 'publico', 'whatsapp'
  created_by      uuid            references usuarios(id) on delete set null,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 5.2. Sessões da fila de atendimento
create table if not exists sessoes_fila (
  id                uuid            primary key default gen_random_uuid(),
  unidade_id        uuid            not null references unidades(id) on delete cascade,
  agendamento_id    uuid            references agendamentos(id) on delete set null,
  cliente_id        uuid            not null references clientes(id) on delete cascade,
  profissional_id   uuid            references profissionais(id) on delete set null,
  sala_id           uuid            references salas(id) on delete set null,
  servico_id        uuid            references servicos(id) on delete set null,
  cliente_pacote_id uuid            references cliente_pacotes(id) on delete set null,
  hora_programada   time            not null,
  hora_inicio       timestamptz,
  hora_fim          timestamptz,
  status            status_sessao   not null default 'confirmado',
  atraso_min        integer         not null default 0,
  valor             decimal(10,2)   not null default 0,
  observacoes       text,
  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now()
);

-- 5.3. Transações financeiras
create table if not exists transacoes (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  cliente_id      uuid            references clientes(id) on delete set null,
  agendamento_id  uuid            references agendamentos(id) on delete set null,
  descricao       text            not null,
  categoria       text            not null,
  data            date            not null default current_date,
  valor           decimal(10,2)   not null,
  tipo            tipo_transacao  not null,
  status          status_transacao not null default 'Pendente',
  forma_pagamento text,
  parcelas        integer         default 1,
  created_by      uuid            references usuarios(id) on delete set null,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 5.4. PDV — Vendas
create table if not exists pdv_vendas (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  cliente_id      uuid            references clientes(id) on delete set null,
  cliente_nome    text,
  valor_subtotal  decimal(10,2)   not null default 0,
  valor_desconto  decimal(10,2)   default 0,
  valor_total     decimal(10,2)   not null default 0,
  forma_pagamento text,
  parcelas        integer         default 1,
  observacoes     text,
  status          text            not null default 'concluida'
                                  check (status in ('concluida','cancelada','pendente')),
  created_by      uuid            references usuarios(id) on delete set null,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 5.5. PDV — Itens da venda
create table if not exists pdv_venda_itens (
  id              uuid            primary key default gen_random_uuid(),
  venda_id        uuid            not null references pdv_vendas(id) on delete cascade,
  tipo_item       text            not null check (tipo_item in ('servico', 'produto')),
  item_id         uuid,            -- references servicos(id) or estoque_items(id)
  nome            text            not null,
  quantidade      integer         not null default 1,
  valor_unitario  decimal(10,2)   not null,
  valor_total     decimal(10,2)   generated always as (quantidade * valor_unitario) stored,
  created_at      timestamptz     not null default now()
);

-- 5.6. Estoque — Itens
create table if not exists estoque_items (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  categoria       text            not null,
  descricao       text,
  quantidade      integer         not null default 0,
  quantidade_min  integer         not null default 0,
  unidade_medida  text            default 'un',
  valor_unitario  decimal(10,2)   default 0,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 5.7. Estoque — Entradas
create table if not exists estoque_entradas (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  item_id         uuid            not null references estoque_items(id) on delete cascade,
  quantidade      integer         not null,
  valor_unitario  decimal(10,2)   default 0,
  valor_total     decimal(10,2)   generated always as (quantidade * coalesce(valor_unitario, 0)) stored,
  fornecedor      text,
  nota_fiscal     text,
  data_entrada    date            not null default current_date,
  created_by      uuid            references usuarios(id) on delete set null,
  created_at      timestamptz     not null default now()
);

-- 5.8. Estoque — Saídas (uso interno / baixa)
create table if not exists estoque_saidas (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  item_id         uuid            not null references estoque_items(id) on delete cascade,
  quantidade      integer         not null,
  motivo          text            not null,  -- 'uso', 'perda', 'vencimento', 'transferencia'
  observacoes     text,
  data_saida      date            not null default current_date,
  created_by      uuid            references usuarios(id) on delete set null,
  created_at      timestamptz     not null default now()
);

-- ############################################################################
-- 6. TABELAS DE RELACIONAMENTO
-- ############################################################################

-- 6.1. Fidelidade — Níveis
create table if not exists fidelidade_niveis (
  id              uuid            primary key default gen_random_uuid(),
  nome            text            not null unique,
  pontos_min      integer         not null default 0,
  cor             text            default '#CD7F32',
  beneficios      jsonb           default '[]'::jsonb,
  created_at      timestamptz     not null default now()
);

-- 6.2. Fidelidade — Pontos por cliente
create table if not exists fidelidade_clientes (
  id              uuid            primary key default gen_random_uuid(),
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  pontos          integer         not null default 0,
  nivel_id        uuid            references fidelidade_niveis(id) on delete set null,
  pontos_resgate  integer         not null default 0,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now(),
  unique(cliente_id, unidade_id)
);

-- 6.3. Fidelidade — Histórico de pontos
create table if not exists fidelidade_historico (
  id              uuid            primary key default gen_random_uuid(),
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  transacao_id    uuid            references transacoes(id) on delete set null,
  pontos          integer         not null,
  tipo            text            not null check (tipo in ('acumulo', 'resgate', 'bonus', 'expiracao')),
  descricao       text,
  created_at      timestamptz     not null default now()
);

-- 6.4. Lista de Espera
create table if not exists lista_espera (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  servico_id      uuid            references servicos(id) on delete set null,
  profissional_id uuid            references profissionais(id) on delete set null,
  preferencia     periodo_preferencia not null default 'Qualquer',
  desde           timestamptz     not null default now(),
  agendamento_id  uuid            references agendamentos(id) on delete set null,
  ativo           boolean         not null default true,
  observacoes     text,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 6.5. Auditoria (log de ações)
create table if not exists auditoria (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            references unidades(id) on delete set null,
  usuario_id      uuid            references usuarios(id) on delete set null,
  acao            text            not null,   -- 'login', 'create', 'update', 'delete', 'view', 'export'
  entidade        text            not null,   -- 'clientes', 'agendamentos', etc.
  entidade_id     uuid,
  detalhes        jsonb           default '{}'::jsonb,
  ip_address      text,
  created_at      timestamptz     not null default now()
);

-- ############################################################################
-- 7. FOREIGN KEY — SALA -> SESSAO ATUAL
-- ############################################################################
-- FK adicionada após criação de sessoes_fila
do $$ begin
  alter table salas add constraint fk_salas_sessao_atual
    foreign key (sessao_atual_id) references sessoes_fila(id) on delete set null;
exception when duplicate_object then null;
end $$;

-- ############################################################################
-- 8. ÍNDICES
-- ############################################################################

-- Clientes
create index if not exists idx_clientes_unidade on clientes(unidade_id);
create index if not exists idx_clientes_nome on clientes using gin(nome gin_trgm_ops);
create index if not exists idx_clientes_telefone on clientes(telefone);
create index if not exists idx_clientes_ativo on clientes(unidade_id, ativo);

-- Profissionais
create index if not exists idx_profissionais_unidade on profissionais(unidade_id);
create index if not exists idx_profissionais_ativo on profissionais(unidade_id, ativo);

-- Usuários
create index if not exists idx_usuarios_unidade on usuarios(unidade_id);
create index if not exists idx_usuarios_auth on usuarios(auth_user_id);
create index if not exists idx_usuarios_email on usuarios(email);

-- Prontuários
create index if not exists idx_prontuarios_cliente on prontuarios(cliente_id);
create index if not exists idx_prontuarios_data on prontuarios(cliente_id, data desc);

-- Agendamentos
create index if not exists idx_agendamentos_unidade on agendamentos(unidade_id);
create index if not exists idx_agendamentos_cliente on agendamentos(cliente_id);
create index if not exists idx_agendamentos_data on agendamentos(unidade_id, data);
create index if not exists idx_agendamentos_profissional on agendamentos(profissional_id);
create index if not exists idx_agendamentos_sala on agendamentos(sala_id);
create index if not exists idx_agendamentos_status on agendamentos(unidade_id, status);

-- Sessões Fila
create index if not exists idx_sessoes_fila_unidade on sessoes_fila(unidade_id);
create index if not exists idx_sessoes_fila_data on sessoes_fila(unidade_id, hora_programada);
create index if not exists idx_sessoes_fila_sala on sessoes_fila(sala_id);
create index if not exists idx_sessoes_fila_status on sessoes_fila(status);

-- Transações
create index if not exists idx_transacoes_unidade on transacoes(unidade_id);
create index if not exists idx_transacoes_cliente on transacoes(cliente_id);
create index if not exists idx_transacoes_data on transacoes(unidade_id, data);
create index if not exists idx_transacoes_tipo on transacoes(unidade_id, tipo);

-- PDV
create index if not exists idx_pdv_vendas_unidade on pdv_vendas(unidade_id);
create index if not exists idx_pdv_vendas_data on pdv_vendas(unidade_id, created_at desc);
create index if not exists idx_pdv_vendas_cliente on pdv_vendas(cliente_id);

-- Estoque
create index if not exists idx_estoque_unidade on estoque_items(unidade_id);
create index if not exists idx_estoque_categoria on estoque_items(unidade_id, categoria);
create index if not exists idx_estoque_critico on estoque_items(unidade_id) where quantidade <= quantidade_min;
create index if not exists idx_estoque_entradas_item on estoque_entradas(item_id);
create index if not exists idx_estoque_entradas_data on estoque_entradas(unidade_id, data_entrada);
create index if not exists idx_estoque_saidas_item on estoque_saidas(item_id);
create index if not exists idx_estoque_saidas_data on estoque_saidas(unidade_id, data_saida);

-- Fidelidade
create index if not exists idx_fidelidade_cliente on fidelidade_clientes(cliente_id);
create index if not exists idx_fidelidade_pontos on fidelidade_clientes(unidade_id, pontos desc);
create index if not exists idx_fidelidade_historico_cliente on fidelidade_historico(cliente_id);

-- Lista de Espera
create index if not exists idx_lista_espera_unidade on lista_espera(unidade_id);
create index if not exists idx_lista_espera_ativo on lista_espera(unidade_id, ativo);

-- Auditoria
create index if not exists idx_auditoria_unidade on auditoria(unidade_id);
create index if not exists idx_auditoria_data on auditoria(unidade_id, created_at desc);
create index if not exists idx_auditoria_entidade on auditoria(entidade, entidade_id);

-- Equipamentos
create index if not exists idx_equipamentos_sala on equipamentos(sala_id);
create index if not exists idx_equipamentos_unidade on equipamentos(unidade_id);

-- ############################################################################
-- 9. TRIGGERS (updated_at automático)
-- ############################################################################

create or replace function trigger_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select table_name::text
    from information_schema.columns
    where column_name = 'updated_at'
      and table_schema = 'public'
      and table_name not in ('auditoria', 'fidelidade_historico', 'estoque_entradas', 'estoque_saidas', 'pdv_venda_itens')
  loop
    execute format(
      'drop trigger if exists set_updated_at on %I; create trigger set_updated_at before update on %I for each row execute function trigger_set_updated_at()',
      t, t
    );
  end loop;
end;
$$ language plpgsql;

-- ############################################################################
-- 10. ROW LEVEL SECURITY (RLS)
-- ############################################################################

-- 10.1. Habilitar RLS em todas as tabelas
do $$
declare
  t text;
begin
  for t in
    select table_name::text
    from information_schema.tables
    where table_schema = 'public'
      and table_type = 'BASE TABLE'
      and table_name not in ('fidelidade_niveis')
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end;
$$ language plpgsql;

-- 10.2. Funções helper de autenticação (no schema public)
-- NOTA: Criadas no schema public pois o schema auth é gerenciado pelo Supabase

create or replace function public.user_unidade_id()
returns uuid
language sql
stable
as $$
  select coalesce(unidade_id, (
    select unidade_id from profissionais where id = (
      select profissional_id from usuarios where auth_user_id = auth.uid()
    )
  ))
  from usuarios
  where auth_user_id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from usuarios
    where auth_user_id = auth.uid()
      and tipo = 'admin'
  )
$$;

create or replace function public.user_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'role',
    (select tipo::text from usuarios where auth_user_id = auth.uid())
  )
$$;

create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    where public.user_role() = required_role
       or public.is_admin()
  )
$$;

create or replace function public.is_gerente_or_admin()
returns boolean
language sql
stable
as $$
  select public.is_admin() or public.user_role() = 'gerente'
$$;

create or replace function public.is_profissional()
returns boolean
language sql
stable
as $$
  select public.user_role() in ('medico', 'esteticista', 'massoterapeuta', 'maquiadora')
$$;

create or replace function public.user_profissional_id()
returns uuid
language sql
stable
as $$
  select profissional_id
  from usuarios
  where auth_user_id = auth.uid()
$$;

-- 10.3. Aplicar policies (DROP + CREATE para garantir limpeza)
do $$
declare
  rec record;
begin
  -- Remove todas as policies existentes
  for rec in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  end loop;
end;
$$ language plpgsql;

-- 10.3.1. unidades
create policy select_unidades on unidades for select
  using (public.is_admin() or id = public.user_unidade_id());
create policy insert_unidades on unidades for insert
  with check (public.is_admin());
create policy update_unidades on unidades for update
  using (public.is_admin() or id = public.user_unidade_id())
  with check (public.is_admin() or id = public.user_unidade_id());
create policy delete_unidades on unidades for delete
  using (public.is_admin());

-- 10.3.2. profissionais
create policy select_profissionais on profissionais for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_profissionais on profissionais for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_profissionais on profissionais for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_profissionais on profissionais for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.3. servicos
create policy select_servicos on servicos for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_servicos on servicos for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_servicos on servicos for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_servicos on servicos for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.4. clientes
create policy select_clientes on clientes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_clientes on clientes for insert
  with check (public.is_admin() or unidade_id = public.user_unidade_id());
create policy update_clientes on clientes for update
  using (public.is_admin() or unidade_id = public.user_unidade_id())
  with check (public.is_admin() or unidade_id = public.user_unidade_id());
create policy delete_clientes on clientes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.5. prontuarios
create policy select_prontuarios on prontuarios for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_prontuarios on prontuarios for insert
  with check (unidade_id = public.user_unidade_id());
create policy update_prontuarios on prontuarios for update
  using (unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_prontuarios on prontuarios for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.6. salas
create policy select_salas on salas for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_salas on salas for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_salas on salas for update
  using (public.is_admin() or unidade_id = public.user_unidade_id())
  with check (public.is_admin() or unidade_id = public.user_unidade_id());
create policy delete_salas on salas for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.7. equipamentos
create policy select_equipamentos on equipamentos for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_equipamentos on equipamentos for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_equipamentos on equipamentos for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_equipamentos on equipamentos for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.8. usuarios
create policy select_usuarios_self on usuarios for select
  using (public.is_gerente_or_admin() or auth_user_id = auth.uid());
create policy select_usuarios_unidade on usuarios for select
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy insert_usuarios on usuarios for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_usuarios on usuarios for update
  using ((public.is_gerente_or_admin() and unidade_id = public.user_unidade_id()) or auth_user_id = auth.uid())
  with check ((public.is_gerente_or_admin() and unidade_id = public.user_unidade_id()) or auth_user_id = auth.uid());
create policy delete_usuarios on usuarios for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.9. agendamentos
create policy select_agendamentos_proprios on agendamentos for select
  using (
    (public.has_role('recepcionista') and unidade_id = public.user_unidade_id())
    or public.is_gerente_or_admin()
    or (public.is_profissional() and profissional_id = public.user_profissional_id() and unidade_id = public.user_unidade_id())
  );
create policy insert_agendamentos on agendamentos for insert
  with check (unidade_id = public.user_unidade_id());
create policy update_agendamentos_proprios on agendamentos for update
  using (
    (public.has_role('recepcionista') and unidade_id = public.user_unidade_id())
    or public.is_gerente_or_admin()
    or (public.is_profissional() and profissional_id = public.user_profissional_id() and unidade_id = public.user_unidade_id())
  )
  with check (unidade_id = public.user_unidade_id());
create policy delete_agendamentos on agendamentos for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.10. sessoes_fila
create policy select_sessoes_fila on sessoes_fila for select
  using (
    (public.has_role('recepcionista') and unidade_id = public.user_unidade_id())
    or public.is_gerente_or_admin()
    or (public.is_profissional() and profissional_id = public.user_profissional_id() and unidade_id = public.user_unidade_id())
  );
create policy insert_sessoes_fila on sessoes_fila for insert
  with check (unidade_id = public.user_unidade_id());
create policy update_sessoes_fila on sessoes_fila for update
  using (
    (public.has_role('recepcionista') and unidade_id = public.user_unidade_id())
    or public.is_gerente_or_admin()
    or (public.is_profissional() and profissional_id = public.user_profissional_id() and unidade_id = public.user_unidade_id())
  )
  with check (unidade_id = public.user_unidade_id());
create policy delete_sessoes_fila on sessoes_fila for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.11. transacoes
create policy select_transacoes on transacoes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_transacoes on transacoes for insert
  with check ((public.has_role('recepcionista') or public.is_gerente_or_admin()) and unidade_id = public.user_unidade_id());
create policy update_transacoes on transacoes for update
  using ((public.has_role('recepcionista') or public.is_gerente_or_admin()) and unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_transacoes on transacoes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.12. pdv_vendas
create policy select_pdv_vendas on pdv_vendas for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_pdv_vendas on pdv_vendas for insert
  with check (unidade_id = public.user_unidade_id());
create policy update_pdv_vendas on pdv_vendas for update
  using (unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_pdv_vendas on pdv_vendas for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.13. pdv_venda_itens
create policy select_pdv_venda_itens on pdv_venda_itens for select
  using (public.is_admin() or exists (
    select 1 from pdv_vendas v where v.id = pdv_venda_itens.venda_id and v.unidade_id = public.user_unidade_id()
  ));
create policy insert_pdv_venda_itens on pdv_venda_itens for insert
  with check (exists (
    select 1 from pdv_vendas v where v.id = pdv_venda_itens.venda_id and v.unidade_id = public.user_unidade_id()
  ));

-- 10.3.14. estoque_items
create policy select_estoque on estoque_items for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_estoque on estoque_items for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_estoque on estoque_items for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_estoque on estoque_items for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.15. estoque_entradas
create policy select_estoque_entradas on estoque_entradas for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_estoque_entradas on estoque_entradas for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.16. estoque_saidas
create policy select_estoque_saidas on estoque_saidas for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_estoque_saidas on estoque_saidas for insert
  with check (unidade_id = public.user_unidade_id());

-- 10.3.17. pacotes
create policy select_pacotes on pacotes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_pacotes on pacotes for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_pacotes on pacotes for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_pacotes on pacotes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.18. planos
create policy select_planos on planos for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_planos on planos for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_planos on planos for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_planos on planos for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.19. assinaturas
create policy select_assinaturas on assinaturas for select
  using (public.is_admin() or exists (
    select 1 from clientes c where c.id = assinaturas.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy insert_assinaturas on assinaturas for insert
  with check (exists (
    select 1 from clientes c where c.id = assinaturas.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy update_assinaturas on assinaturas for update
  using (public.is_gerente_or_admin() and exists (
    select 1 from clientes c where c.id = assinaturas.cliente_id and c.unidade_id = public.user_unidade_id()
  ))
  with check (public.is_gerente_or_admin() and exists (
    select 1 from clientes c where c.id = assinaturas.cliente_id and c.unidade_id = public.user_unidade_id()
  ));

-- 10.3.20. cliente_pacotes
create policy select_cliente_pacotes on cliente_pacotes for select
  using (public.is_admin() or exists (
    select 1 from clientes c where c.id = cliente_pacotes.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy insert_cliente_pacotes on cliente_pacotes for insert
  with check (exists (
    select 1 from clientes c where c.id = cliente_pacotes.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy update_cliente_pacotes on cliente_pacotes for update
  using (exists (
    select 1 from clientes c where c.id = cliente_pacotes.cliente_id and c.unidade_id = public.user_unidade_id()
  ))
  with check (exists (
    select 1 from clientes c where c.id = cliente_pacotes.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy delete_cliente_pacotes on cliente_pacotes for delete
  using (public.is_gerente_or_admin());

-- 10.3.21. fidelidade_clientes
create policy select_fidelidade_clientes on fidelidade_clientes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_fidelidade_clientes on fidelidade_clientes for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_fidelidade_clientes on fidelidade_clientes for update
  using (public.has_role('recepcionista') and unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_fidelidade_clientes on fidelidade_clientes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.22. fidelidade_historico
create policy select_fidelidade_historico on fidelidade_historico for select
  using (public.is_admin() or exists (
    select 1 from clientes c where c.id = fidelidade_historico.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy insert_fidelidade_historico on fidelidade_historico for insert
  with check (exists (
    select 1 from clientes c where c.id = fidelidade_historico.cliente_id and c.unidade_id = public.user_unidade_id()
  ));

-- 10.3.23. lista_espera
create policy select_lista_espera on lista_espera for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_lista_espera on lista_espera for insert
  with check (unidade_id = public.user_unidade_id());
create policy update_lista_espera on lista_espera for update
  using (unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_lista_espera on lista_espera for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 10.3.24. auditoria
create policy select_auditoria on auditoria for select
  using (public.is_gerente_or_admin() and (unidade_id = public.user_unidade_id() or public.is_admin()));
create policy no_insert_auditoria on auditoria for insert
  with check (false);
create policy no_update_auditoria on auditoria for update
  using (false);
create policy no_delete_auditoria on auditoria for delete
  using (false);

-- ############################################################################
-- 11. FUNÇÕES DE NEGÓCIO
-- ############################################################################

-- 11.1. Calcula nível de fidelidade
create or replace function public.calcular_nivel_fidelidade(p_pontos integer)
returns uuid
language sql
stable
as $$
  select id
  from fidelidade_niveis
  where pontos_min <= p_pontos
  order by pontos_min desc
  limit 1
$$;

-- 11.2. Atualiza nível de fidelidade do cliente
create or replace function public.atualizar_nivel_fidelidade(p_cliente_id uuid)
returns void
language plpgsql
as $$
declare
  v_fidelidade record;
  v_nivel_id uuid;
begin
  select * into v_fidelidade
  from fidelidade_clientes
  where cliente_id = p_cliente_id;

  if not found then
    return;
  end if;

  v_nivel_id := public.calcular_nivel_fidelidade(v_fidelidade.pontos);

  if v_nivel_id is distinct from v_fidelidade.nivel_id then
    update fidelidade_clientes
    set nivel_id = v_nivel_id,
        updated_at = now()
    where cliente_id = p_cliente_id;
  end if;
end;
$$;

-- 11.3. Atualiza status da sala baseado na sessão atual
create or replace function public.atualizar_status_sala(p_sala_id uuid)
returns void
language plpgsql
as $$
declare
  v_sessao_ativa record;
begin
  select sf.* into v_sessao_ativa
  from sessoes_fila sf
  where sf.sala_id = p_sala_id
    and sf.status in ('ativo', 'aguardando', 'atrasado')
  order by sf.hora_programada
  limit 1;

  if v_sessao_ativa.id is not null then
    update salas
    set status = case
          when v_sessao_ativa.status = 'ativo' then 'em_uso'
          when v_sessao_ativa.status = 'aguardando' then 'disponivel'
          else 'ocupada'
        end,
        sessao_atual_id = v_sessao_ativa.id,
        updated_at = now()
    where id = p_sala_id;
  else
    update salas
    set status = case
          when manutencao_previsao is not null then 'manutencao'
          else 'disponivel'
        end,
        sessao_atual_id = null,
        updated_at = now()
    where id = p_sala_id;
  end if;
end;
$$;

-- 11.4. Registrar entrada no estoque
create or replace function public.registrar_entrada_estoque(
  p_unidade_id uuid,
  p_item_id uuid,
  p_quantidade integer,
  p_valor_unitario decimal,
  p_fornecedor text default null,
  p_nota_fiscal text default null,
  p_data_entrada date default current_date,
  p_created_by uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_entrada_id uuid;
begin
  if p_quantidade <= 0 then
    raise exception 'Quantidade deve ser maior que zero';
  end if;

  insert into estoque_entradas (
    unidade_id, item_id, quantidade, valor_unitario,
    fornecedor, nota_fiscal, data_entrada, created_by
  ) values (
    p_unidade_id, p_item_id, p_quantidade, p_valor_unitario,
    p_fornecedor, p_nota_fiscal, p_data_entrada, p_created_by
  ) returning id into v_entrada_id;

  update estoque_items
  set quantidade = quantidade + p_quantidade,
      valor_unitario = coalesce(p_valor_unitario, valor_unitario),
      updated_at = now()
  where id = p_item_id;

  return v_entrada_id;
end;
$$;

-- 11.5. Registrar saída do estoque
create or replace function public.registrar_saida_estoque(
  p_unidade_id uuid,
  p_item_id uuid,
  p_quantidade integer,
  p_motivo text,
  p_observacoes text default null,
  p_data_saida date default current_date,
  p_created_by uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_saida_id uuid;
  v_qtd_atual integer;
begin
  select quantidade into v_qtd_atual
  from estoque_items where id = p_item_id;

  if v_qtd_atual < p_quantidade then
    raise exception 'Quantidade insuficiente em estoque. Disponível: %, solicitado: %', v_qtd_atual, p_quantidade;
  end if;

  insert into estoque_saidas (
    unidade_id, item_id, quantidade, motivo, observacoes, data_saida, created_by
  ) values (
    p_unidade_id, p_item_id, p_quantidade, p_motivo, p_observacoes, p_data_saida, p_created_by
  ) returning id into v_saida_id;

  update estoque_items
  set quantidade = quantidade - p_quantidade,
      updated_at = now()
  where id = p_item_id;

  return v_saida_id;
end;
$$;

-- 11.6. Criar agendamento (atômico)
create or replace function public.criar_agendamento(
  p_unidade_id uuid,
  p_cliente_id uuid,
  p_data date,
  p_hora time,
  p_profissional_id uuid default null,
  p_servico_id uuid default null,
  p_sala_id uuid default null,
  p_duracao_min integer default 60,
  p_valor decimal default 0,
  p_observacoes text default null,
  p_origem text default 'interno',
  p_created_by uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_agendamento_id uuid;
  v_sala_real_id uuid;
  v_servico record;
begin
  if p_servico_id is not null then
    select * into v_servico from servicos where id = p_servico_id;
  end if;

  if p_sala_id is null then
    select s.id into v_sala_real_id
    from salas s
    where s.unidade_id = p_unidade_id
      and s.status = 'disponivel'
      and not exists (
        select 1 from sessoes_fila sf
        where sf.sala_id = s.id
          and sf.hora_programada::time = p_hora
          and sf.status not in ('concluido', 'cancelado')
      )
    order by s.nome
    limit 1;
  else
    v_sala_real_id := p_sala_id;
  end if;

  insert into agendamentos (
    unidade_id, cliente_id, profissional_id, servico_id, sala_id,
    data, hora, duracao_min, valor, observacoes, origem, created_by
  ) values (
    p_unidade_id, p_cliente_id, p_profissional_id, p_servico_id, v_sala_real_id,
    p_data, p_hora,
    coalesce(p_duracao_min, v_servico.duracao_min, 60),
    coalesce(p_valor, v_servico.valor, 0),
    p_observacoes, p_origem, p_created_by
  ) returning id into v_agendamento_id;

  insert into sessoes_fila (
    unidade_id, agendamento_id, cliente_id, profissional_id,
    sala_id, servico_id, hora_programada, status, valor
  ) values (
    p_unidade_id, v_agendamento_id, p_cliente_id, p_profissional_id,
    v_sala_real_id, p_servico_id, p_hora, 'confirmado',
    coalesce(p_valor, v_servico.valor, 0)
  );

  if v_sala_real_id is not null then
    perform public.atualizar_status_sala(v_sala_real_id);
  end if;

  return v_agendamento_id;
end;
$$;

-- 11.7. Finalizar sessão
create or replace function public.finalizar_sessao(
  p_sessao_id uuid,
  p_valor_real decimal default null
) returns void
language plpgsql
as $$
declare
  v_sessao record;
  v_transacao_id uuid;
  v_pontos integer;
begin
  select * into v_sessao from sessoes_fila where id = p_sessao_id;
  if not found then raise exception 'Sessão não encontrada'; end if;
  if v_sessao.status = 'concluido' then raise exception 'Sessão já foi concluída'; end if;

  update sessoes_fila
  set status = 'concluido', hora_fim = now(),
      valor = coalesce(p_valor_real, valor), updated_at = now()
  where id = p_sessao_id;

  insert into transacoes (unidade_id, cliente_id, agendamento_id,
    descricao, categoria, data, valor, tipo, status, forma_pagamento)
  values (v_sessao.unidade_id, v_sessao.cliente_id, v_sessao.agendamento_id,
    'Sessão', 'Procedimento', current_date,
    coalesce(p_valor_real, v_sessao.valor), 'receita', 'Pago', 'Pix')
  returning id into v_transacao_id;

  update clientes set ultima_visita = now(), updated_at = now()
  where id = v_sessao.cliente_id;

  if v_sessao.sala_id is not null then
    perform public.atualizar_status_sala(v_sessao.sala_id);
  end if;

  v_pontos := floor(coalesce(p_valor_real, v_sessao.valor))::integer;
  if v_pontos > 0 then
    insert into fidelidade_clientes (cliente_id, unidade_id, pontos)
    values (v_sessao.cliente_id, v_sessao.unidade_id, v_pontos)
    on conflict (cliente_id, unidade_id)
    do update set pontos = fidelidade_clientes.pontos + v_pontos, updated_at = now();

    insert into fidelidade_historico (cliente_id, transacao_id, pontos, tipo, descricao)
    values (v_sessao.cliente_id, v_transacao_id, v_pontos, 'acumulo',
      'Pontos sessão ' || to_char(now(), 'DD/MM/YYYY'));

    perform public.atualizar_nivel_fidelidade(v_sessao.cliente_id);
  end if;

  insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
  values (v_sessao.unidade_id, 'update', 'sessoes_fila', p_sessao_id,
    jsonb_build_object('status', 'concluido', 'valor', coalesce(p_valor_real, v_sessao.valor)));
end;
$$;

-- 11.8. Finalizar venda no PDV
create or replace function public.finalizar_venda_pdv(
  p_unidade_id uuid,
  p_itens jsonb,
  p_valor_desconto decimal default 0,
  p_forma_pagamento text default 'credito',
  p_cliente_id uuid default null,
  p_cliente_nome text default null,
  p_observacoes text default null,
  p_created_by uuid default null
) returns uuid
language plpgsql
as $$
declare
  v_venda_id uuid;
  v_subtotal decimal := 0;
  v_item jsonb;
  v_valor_total decimal;
begin
  -- Calcula subtotal
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_subtotal := v_subtotal + (v_item->>'quantidade')::integer * (v_item->>'valor_unitario')::decimal;
  end loop;

  v_valor_total := greatest(v_subtotal - coalesce(p_valor_desconto, 0), 0);

  -- Cria venda
  insert into pdv_vendas (unidade_id, cliente_id, cliente_nome,
    valor_subtotal, valor_desconto, valor_total, forma_pagamento,
    observacoes, created_by)
  values (p_unidade_id, p_cliente_id, p_cliente_nome,
    v_subtotal, coalesce(p_valor_desconto, 0), v_valor_total,
    p_forma_pagamento, p_observacoes, p_created_by)
  returning id into v_venda_id;

  -- Insere itens
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    insert into pdv_venda_itens (venda_id, tipo_item, item_id, nome, quantidade, valor_unitario)
    values (
      v_venda_id,
      v_item->>'tipo_item',
      (v_item->>'item_id')::uuid,
      v_item->>'nome',
      (v_item->>'quantidade')::integer,
      (v_item->>'valor_unitario')::decimal
    );

    -- Se for produto, dá baixa no estoque
    if v_item->>'tipo_item' = 'produto' then
      perform public.registrar_saida_estoque(
        p_unidade_id,
        (v_item->>'item_id')::uuid,
        (v_item->>'quantidade')::integer,
        'venda',
        'Venda PDV #' || v_venda_id,
        current_date,
        p_created_by
      );
    end if;
  end loop;

  -- Registra transação financeira
  insert into transacoes (unidade_id, cliente_id, descricao,
    categoria, data, valor, tipo, status, forma_pagamento, created_by)
  values (p_unidade_id, p_cliente_id, 'Venda PDV #' || v_venda_id,
    'PDV', current_date, v_valor_total, 'receita',
    case when p_forma_pagamento in ('pix', 'dinheiro', 'debito') then 'Pago' else 'Pendente' end,
    p_forma_pagamento, p_created_by);

  return v_venda_id;
end;
$$;

-- 11.9. Busca textual
create or replace function public.buscar_clientes(
  p_termo text,
  p_unidade_id uuid default null,
  p_limite integer default 20
) returns table (
  id uuid, nome text, email text, telefone text,
  ultima_visita timestamptz, relevancia real
)
language sql
stable
as $$
  select
    c.id, c.nome, c.email, c.telefone, c.ultima_visita,
    coalesce(
      similarity(c.nome, p_termo) * 2.0 +
      similarity(coalesce(c.email, ''), p_termo) * 1.5 +
      similarity(coalesce(c.telefone, ''), p_termo) * 1.0, 0
    ) as relevancia
  from clientes c
  where (p_unidade_id is null or c.unidade_id = p_unidade_id)
    and (c.nome % p_termo or c.nome ilike '%' || p_termo || '%'
      or c.telefone ilike '%' || p_termo || '%'
      or c.email ilike '%' || p_termo || '%')
  order by relevancia desc
  limit p_limite;
$$;

-- 11.10. Dashboard KPI
create or replace function public.get_dashboard_data(p_unidade_id uuid)
returns jsonb
language plpgsql
stable
as $$
declare
  v_result jsonb;
  v_hoje date := current_date;
begin
  select jsonb_build_object(
    'data_referencia', v_hoje,
    'saudacao', case
      when extract(hour from current_time) < 12 then 'Bom dia'
      when extract(hour from current_time) < 18 then 'Boa tarde'
      else 'Boa noite'
    end,
    'metricas', jsonb_build_object(
      'faturamento_hoje', coalesce((select sum(valor) from transacoes
        where unidade_id = p_unidade_id and data = v_hoje and tipo = 'receita'), 0),
      'agendamentos_hoje', (select count(*) from agendamentos
        where unidade_id = p_unidade_id and data = v_hoje and status not in ('cancelado')),
      'clientes_ativas', (select count(*) from clientes
        where unidade_id = p_unidade_id and ativo = true),
      'taxa_ocupacao', coalesce((select round(
        count(*) filter (where sf.status in ('ativo', 'aguardando', 'atrasado'))
        * 100.0 / nullif(count(*), 0))
        from sessoes_fila sf join salas s on s.id = sf.sala_id
        where sf.unidade_id = p_unidade_id and sf.hora_programada::date = v_hoje), 0)
    ),
    'agendamentos_hoje_lista', coalesce((select jsonb_agg(jsonb_build_object(
      'id', a.id, 'hora', a.hora, 'cliente', c.nome,
      'servico', s.nome, 'profissional', p.nome,
      'status', a.status, 'valor', a.valor
    ) order by a.hora)
      from agendamentos a
      left join clientes c on c.id = a.cliente_id
      left join servicos s on s.id = a.servico_id
      left join profissionais p on p.id = a.profissional_id
      where a.unidade_id = p_unidade_id and a.data = v_hoje
        and a.status not in ('cancelado')
      limit 20), '[]'::jsonb),
    'fila_agora', coalesce((select jsonb_agg(jsonb_build_object(
      'id', sf.id, 'hora', sf.hora_programada, 'cliente', c.nome,
      'servico', sv.nome, 'profissional', p.nome,
      'sala', s.nome, 'status', sf.status, 'atraso_min', sf.atraso_min
    ) order by sf.hora_programada)
      from sessoes_fila sf
      left join clientes c on c.id = sf.cliente_id
      left join servicos sv on sv.id = sf.servico_id
      left join profissionais p on p.id = sf.profissional_id
      left join salas s on s.id = sf.sala_id
      where sf.unidade_id = p_unidade_id
        and sf.status not in ('concluido', 'cancelado')
      limit 15), '[]'::jsonb),
    'estoque_critico', coalesce((select jsonb_agg(jsonb_build_object(
      'id', ei.id, 'nome', ei.nome, 'quantidade', ei.quantidade,
      'quantidade_min', ei.quantidade_min
    ) order by (ei.quantidade_min - ei.quantidade) desc)
      from estoque_items ei
      where ei.unidade_id = p_unidade_id and ei.quantidade < ei.quantidade_min
      limit 10), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

-- ############################################################################
-- 12. VIEWS PARA RELATÓRIOS
-- ############################################################################

-- 12.1. Financeiro mensal
create or replace view public.vw_financeiro_mensal as
select
  t.unidade_id,
  date_trunc('month', t.data)::date as mes,
  u.nome as unidade_nome,
  count(*) filter (where t.tipo = 'receita') as qtd_receitas,
  count(*) filter (where t.tipo = 'despesa') as qtd_despesas,
  coalesce(sum(t.valor) filter (where t.tipo = 'receita'), 0) as total_receitas,
  coalesce(sum(t.valor) filter (where t.tipo = 'despesa'), 0) as total_despesas,
  coalesce(sum(t.valor) filter (where t.tipo = 'receita'), 0) -
    coalesce(sum(t.valor) filter (where t.tipo = 'despesa'), 0) as lucro_liquido,
  count(*) filter (where t.status = 'Pendente') as qtd_pendentes,
  coalesce(sum(t.valor) filter (where t.status = 'Pendente' and t.tipo = 'receita'), 0) as valor_a_receber,
  coalesce(sum(t.valor) filter (where t.status in ('Pendente', 'A pagar') and t.tipo = 'despesa'), 0) as valor_a_pagar
from transacoes t
join unidades u on u.id = t.unidade_id
group by t.unidade_id, date_trunc('month', t.data), u.nome
order by mes desc;

-- 12.2. Top clientes
create or replace view public.vw_top_clientes as
select
  c.id, c.unidade_id, c.nome, c.telefone,
  count(a.id) as total_sessoes,
  coalesce(sum(a.valor), 0) as total_gasto,
  coalesce(avg(a.valor), 0) as ticket_medio,
  max(a.data) as ultima_visita,
  coalesce(fc.pontos, 0) as pontos_fidelidade,
  fn.nome as nivel_fidelidade,
  row_number() over (partition by c.unidade_id order by coalesce(sum(a.valor), 0) desc) as ranking
from clientes c
left join agendamentos a on a.cliente_id = c.id and a.status = 'concluido'
left join fidelidade_clientes fc on fc.cliente_id = c.id
left join fidelidade_niveis fn on fn.id = fc.nivel_id
group by c.id, c.unidade_id, c.nome, c.telefone, fc.pontos, fn.nome
order by total_gasto desc;

-- 12.3. Ocupação de salas
create or replace view public.vw_ocupacao_salas as
select
  s.id as sala_id, s.unidade_id, s.nome as sala_nome,
  s.status as status_atual,
  count(sf.id) filter (where sf.created_at >= now() - interval '30 days') as sessoes_30dias,
  round(count(sf.id) filter (where sf.created_at >= now() - interval '30 days')
    * 100.0 / greatest((select count(*) from generate_series(current_date - 30, current_date, '1 day')), 1), 1) as taxa_ocupacao,
  coalesce(sum(sf.valor) filter (where sf.created_at >= now() - interval '30 days'), 0) as receita_gerada,
  s.capacidade, s.equipamentos_desc
from salas s
left join sessoes_fila sf on sf.sala_id = s.id
group by s.id, s.unidade_id, s.nome, s.status, s.capacidade, s.equipamentos_desc
order by taxa_ocupacao desc;

-- 12.4. Fidelidade completa
create or replace view public.vw_fidelidade_completa as
select
  c.id as cliente_id, c.unidade_id, c.nome as cliente_nome,
  c.telefone, c.email,
  coalesce(fc.pontos, 0) as pontos_atuais,
  fn.nome as nivel_atual, fn.cor as nivel_cor,
  coalesce(fc.pontos_resgate, 0) as pontos_resgatados,
  coalesce(fc.pontos, 0) - coalesce(fc.pontos_resgate, 0) as pontos_disponiveis,
  fn2.pontos_min as pontos_proximo_nivel,
  fn2.nome as proximo_nivel,
  case when fn2.pontos_min > 0 then round((coalesce(fc.pontos, 0) * 100.0 / fn2.pontos_min), 1) else 100.0 end as progresso_proximo_nivel,
  rank() over (partition by c.unidade_id order by coalesce(fc.pontos, 0) desc) as ranking
from clientes c
left join fidelidade_clientes fc on fc.cliente_id = c.id
left join fidelidade_niveis fn on fn.id = fc.nivel_id
left join lateral (
  select fn2.pontos_min, fn2.nome
  from fidelidade_niveis fn2
  where fn2.pontos_min > coalesce(fc.pontos, 0)
  order by fn2.pontos_min
  limit 1
) fn2 on true
where c.ativo = true
order by pontos_atuais desc;

-- 12.5. Estoque crítico
create or replace view public.vw_estoque_critico as
select
  ei.id, ei.unidade_id, u.nome as unidade_nome,
  ei.nome as item_nome, ei.categoria,
  ei.quantidade, ei.quantidade_min, ei.unidade_medida, ei.valor_unitario,
  (ei.quantidade_min - ei.quantidade) as quantidade_faltante,
  round(ei.valor_unitario * greatest(ei.quantidade_min - ei.quantidade, 0), 2) as valor_reposicao,
  case
    when ei.quantidade <= 0 then 'esgotado'
    when ei.quantidade <= ei.quantidade_min / 2 then 'critico'
    when ei.quantidade < ei.quantidade_min then 'baixo'
    else 'normal'
  end as status_estoque
from estoque_items ei
join unidades u on u.id = ei.unidade_id
where ei.quantidade < ei.quantidade_min
order by (ei.quantidade_min - ei.quantidade) desc;

-- 12.6. BI — Indicadores
create or replace view public.vw_bi_indicadores as
select
  t.unidade_id, u.nome as unidade_nome,
  current_date as data_referencia,
  coalesce(sum(t.valor) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)), 0) as receita_mes_atual,
  coalesce(sum(t.valor) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date - interval '1 month') and t.data < date_trunc('month', current_date)), 0) as receita_mes_anterior,
  coalesce(sum(t.valor) filter (where t.tipo = 'despesa' and t.data >= date_trunc('month', current_date)), 0) as despesa_mes_atual,
  (select count(*) from clientes c where c.unidade_id = t.unidade_id and c.ativo = true) as clientes_ativas,
  (select count(*) from agendamentos a where a.unidade_id = t.unidade_id and a.status = 'concluido' and a.data >= date_trunc('month', current_date)) as sessoes_mes,
  case when count(*) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)) > 0
    then round(coalesce(sum(t.valor) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)), 0) /
      nullif(count(*) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)), 0), 2)
    else 0
  end as ticket_medio
from transacoes t
join unidades u on u.id = t.unidade_id
group by t.unidade_id, u.nome;

-- ############################################################################
-- 13. TRIGGERS AUTOMÁTICOS
-- ############################################################################

-- 13.1. Atualiza status da sala quando sessão é alterada
create or replace function public.trigger_atualizar_sala_sessao()
returns trigger
language plpgsql as $$
begin
  if new.sala_id is not null and (old is null or old.sala_id is distinct from new.sala_id or old.status is distinct from new.status) then
    perform public.atualizar_status_sala(new.sala_id);
    if old is not null and old.sala_id is distinct from new.sala_id and old.sala_id is not null then
      perform public.atualizar_status_sala(old.sala_id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_sessao_sala on sessoes_fila;
create trigger trigger_sessao_sala
  after insert or update of sala_id, status on sessoes_fila
  for each row execute function public.trigger_atualizar_sala_sessao();

-- 13.2. Auditoria em alterações de clientes
create or replace function public.trigger_auditoria_cliente()
returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
    values (new.unidade_id, 'create', 'clientes', new.id, jsonb_build_object('nome', new.nome));
  elsif tg_op = 'UPDATE' then
    if old is distinct from new then
      insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
      values (new.unidade_id, 'update', 'clientes', new.id,
        jsonb_build_object('campos_alterados', (
          select jsonb_object_agg(key, value)
          from jsonb_each(to_jsonb(new)) f(key, value)
          where (to_jsonb(old) ->> key) is distinct from value::text
        )));
    end if;
  elsif tg_op = 'DELETE' then
    insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
    values (old.unidade_id, 'delete', 'clientes', old.id, jsonb_build_object('nome', old.nome));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trigger_auditoria_cliente on clientes;
create trigger trigger_auditoria_cliente
  after insert or update or delete on clientes
  for each row execute function public.trigger_auditoria_cliente();

-- 13.3. Define cliente_desde na primeira inserção
create or replace function public.trigger_cliente_desde()
returns trigger
language plpgsql as $$
begin
  if new.cliente_desde is null then
    new.cliente_desde := current_date;
  end if;
  return new;
end;
$$;

drop trigger if exists trigger_cliente_desde on clientes;
create trigger trigger_cliente_desde
  before insert on clientes
  for each row execute function public.trigger_cliente_desde();

-- ############################################################################
-- 14. SEED DATA
-- ############################################################################

-- 14.1. Unidades
insert into unidades (id, nome, cnpj, endereco, cidade, uf, telefone, whatsapp, email) values
  ('a0000000-0000-0000-0000-000000000001', 'Centro Vitta — Unidade Jardins', '12.345.678/0001-90', 'Av. Paulista, 1.234', 'São Paulo', 'SP', '(11) 99999-8888', '(11) 98888-7777', 'contato@vittajardins.com.br'),
  ('a0000000-0000-0000-0000-000000000002', 'Centro Vitta — Moema', '12.345.678/0002-71', 'Av. Ibirapuera, 3.500', 'São Paulo', 'SP', '(11) 97777-6666', '(11) 97777-6667', 'moema@vittajardins.com.br'),
  ('a0000000-0000-0000-0000-000000000003', 'Centro Vitta — Pinheiros', '12.345.678/0003-52', 'Rua dos Pinheiros, 500', 'São Paulo', 'SP', '(11) 96666-5555', null, 'pinheiros@vittajardins.com.br')
on conflict (cnpj) do nothing;

-- 14.2. Profissionais
insert into profissionais (id, unidade_id, nome, cargo, tipo, email, telefone, ativo, cor_tag) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ana Souza', 'Recepcionista', 'recepcionista', 'ana@vitta.com', '(11) 97777-1111', true, '#6C5CE7'),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Dra. Camila Mendes', 'Médica', 'medico', 'camila@vitta.com', '(11) 97777-2222', true, '#6C5CE7'),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Fernanda Lima', 'Esteticista', 'esteticista', 'fernanda@vitta.com', '(11) 97777-3333', true, '#00B894'),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Carlos Oliveira', 'Massoterapeuta', 'massoterapeuta', 'carlos@vitta.com', '(11) 97777-4444', true, '#FDCB6E'),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Julia Santos', 'Maquiadora', 'maquiadora', 'julia@vitta.com', '(11) 97777-5555', true, '#6C5CE7')
on conflict (id) do nothing;

-- 14.3. Salas
insert into salas (id, unidade_id, nome, equipamentos_desc, capacidade, status) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sala 1 — Estética Facial', 'Laser ND:YAG, Microdermoabrasão, Luz Intensa Pulsada', 1, 'disponivel'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Sala 2 — Procedimentos', 'Cama hidráulica, Painel LED, Maca', 1, 'em_uso'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Sala 3 — Massagem', 'Maca elétrica, Difusor aromaterapia', 1, 'disponivel'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sala de Laser', 'Laser CO2 Fracionado, Luz Pulsada Intensa', 1, 'manutencao'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Sala de Procedimentos', 'Cama cirúrgica, Monitor Multiparâmetros, Aspirador', 1, 'ocupada')
on conflict (id) do nothing;

-- 14.4. Equipamentos
insert into equipamentos (id, sala_id, unidade_id, nome, tipo, ultima_manutencao, proxima_manutencao, uso_total_horas, saude_pct) values
  ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Laser ND:YAG', 'Laser', '2026-06-15', '2026-09-15', 420, 87),
  ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Microdermoabrasão', 'Mecânico', '2026-05-20', '2026-08-20', 180, 92),
  ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Luz Intensa Pulsada', 'Laser', '2026-06-01', '2026-09-01', 310, 78),
  ('e0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Cama Hidráulica', 'Móvel', '2026-04-10', '2026-10-10', 560, 95),
  ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Painel LED Terapêutico', 'LED', '2026-06-05', '2026-09-05', 240, 88),
  ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Maca Elétrica', 'Móvel', '2026-03-22', '2026-09-22', 680, 82),
  ('e0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Difusor Aromaterapia', 'Elétrico', '2026-05-01', '2026-08-01', 190, 96),
  ('e0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Laser CO2 Fracionado', 'Laser', '2026-06-28', '2026-07-28', 150, 65),
  ('e0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Luz Pulsada Intensa', 'Laser', '2026-06-28', '2026-08-28', 280, 72),
  ('e0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Cama Cirúrgica Elétrica', 'Móvel', '2026-05-15', '2026-11-15', 420, 90),
  ('e0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Monitor Multiparâmetros', 'Monitor', '2026-06-10', '2026-12-10', 110, 98),
  ('e0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Aspirador Cirúrgico', 'Elétrico', '2026-04-10', '2026-10-10', 85, 85)
on conflict (id) do nothing;

-- 14.5. Serviços
insert into servicos (id, unidade_id, nome, descricao, categoria, valor, duracao_min) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Limpeza de pele profunda', 'Limpeza facial completa com extração e máscara', 'Procedimento', 180.00, 60),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Peeling de diamante', 'Esfoliação mecânica com ponteira de diamante', 'Procedimento', 250.00, 45),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Toxina botulínica', 'Aplicação de toxina botulínica', 'Procedimento', 890.00, 30),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Drenagem linfática', 'Drenagem linfática manual corporal', 'Procedimento', 180.00, 50),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Microagulhamento', 'Microagulhamento para estímulo de colágeno', 'Procedimento', 450.00, 60),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Laser CO2 fracionado', 'Laser fracionado para rejuvenescimento facial', 'Procedimento', 1200.00, 60),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Massagem relaxante', 'Massagem corporal relaxante com óleos essenciais', 'Procedimento', 200.00, 60),
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Hidratação facial', 'Hidratação profunda com ácido hialurônico', 'Procedimento', 120.00, 40)
on conflict (id) do nothing;

-- 14.6. Pacotes
insert into pacotes (id, unidade_id, servico_id, nome, sessoes_total, valor, validade_meses) values
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Limpeza facial', 10, 1600.00, 12),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Peeling de diamante', 6, 1350.00, 12),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'Drenagem linfática', 8, 1280.00, 12),
  ('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 'Laser CO2 completo', 5, 5400.00, 18),
  ('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'Microagulhamento', 4, 1600.00, 12),
  ('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000007', 'Massagem relaxante', 8, 1100.00, 6)
on conflict (id) do nothing;

-- 14.7. Planos
insert into planos (id, unidade_id, nome, descricao, valor, beneficios, cor_tag) values
  ('70000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Plano Premium',
    '1 sessão de limpeza de pele · 20% off em procedimentos · 2x pontos fidelidade · Prioridade na agenda',
    349.00, '["1 sessão de limpeza de pele por mês", "20% off em procedimentos", "2x pontos fidelidade", "Prioridade na agenda"]'::jsonb, '#9C7A3E'),
  ('70000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Plano Essencial',
    '1 sessão de massagem · 10% off em produtos · 1.5x pontos fidelidade',
    149.00, '["1 sessão de massagem por mês", "10% off em produtos", "1.5x pontos fidelidade"]'::jsonb, '#4C7A5E'),
  ('70000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Plano VIP',
    '2 sessões mensais · 30% off · 3x pontos · Agendamento prioritário · Brinde mensal',
    599.00, '["2 sessões mensais", "30% off em procedimentos", "3x pontos fidelidade", "Agendamento prioritário", "Brinde mensal"]'::jsonb, '#6C5CE7')
on conflict (id) do nothing;

-- 14.8. Clientes
insert into clientes (id, unidade_id, nome, email, telefone, cliente_desde, ultima_visita, observacoes) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Marina Costa', 'marina.costa@email.com', '(11) 98221-4410', '2022-03-01', now(), 'Cliente prefere horários pela manhã. Alergia a ácido salicílico.'),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Renata Alves', 'renata.alves@email.com', '(11) 99110-2287', '2021-06-15', now(), null),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Juliana Prado', 'juliana.prado@email.com', '(11) 98833-7765', '2023-01-10', now(), 'Plano recorrente Premium.'),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Beatriz Lima', 'beatriz.lima@email.com', '(11) 97744-9021', '2020-08-20', now(), null),
  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Larissa Teixeira', 'larissa.teixeira@email.com', '(11) 96652-3398', '2024-02-05', null, 'Sem pacote ativo. Fidelidade expirando.'),
  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Patrícia Nogueira', 'patricia.nogueira@email.com', '(11) 98123-5567', '2019-11-30', now(), null),
  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Camila Ferreira', null, '(11) 95551-1111', '2023-05-18', null, null),
  ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Sofia Ribeiro', null, '(11) 94443-3333', '2024-04-12', null, null)
on conflict (id) do nothing;

-- 14.9. Fidelidade — Níveis
insert into fidelidade_niveis (id, nome, pontos_min, cor, beneficios) values
  ('80000000-0000-0000-0000-000000000001', 'Bronze', 0, '#CD7F32', '["Acúmulo de pontos"]'::jsonb),
  ('80000000-0000-0000-0000-000000000002', 'Prata', 100, '#C0C0C0', '["Acúmulo de pontos", "Desconto progressivo"]'::jsonb),
  ('80000000-0000-0000-0000-000000000003', 'Ouro', 300, '#FFD700', '["Acúmulo de pontos", "Desconto progressivo", "Prioridade de agendamento"]'::jsonb),
  ('80000000-0000-0000-0000-000000000004', 'Platina', 600, '#E5E4E2', '["Acúmulo de pontos", "Desconto progressivo", "Prioridade de agendamento", "Acesso a eventos exclusivos"]'::jsonb),
  ('80000000-0000-0000-0000-000000000005', 'Diamante', 1000, '#B9F2FF', '["Acúmulo de pontos", "Desconto progressivo", "Prioridade de agendamento", "Acesso a eventos exclusivos", "Brinde de aniversário"]'::jsonb)
on conflict (id) do nothing;

-- 14.10. Fidelidade — Pontos dos clientes
insert into fidelidade_clientes (cliente_id, unidade_id, pontos, nivel_id, pontos_resgate)
select c.id, c.unidade_id,
  case c.id
    when '10000000-0000-0000-0000-000000000006' then 1050
    when '10000000-0000-0000-0000-000000000004' then 620
    when '10000000-0000-0000-0000-000000000003' then 350
    when '10000000-0000-0000-0000-000000000001' then 320
    when '10000000-0000-0000-0000-000000000002' then 180
    else 0
  end,
  case c.id
    when '10000000-0000-0000-0000-000000000006' then '80000000-0000-0000-0000-000000000005'
    when '10000000-0000-0000-0000-000000000004' then '80000000-0000-0000-0000-000000000004'
    when '10000000-0000-0000-0000-000000000003' then '80000000-0000-0000-0000-000000000003'
    when '10000000-0000-0000-0000-000000000001' then '80000000-0000-0000-0000-000000000003'
    when '10000000-0000-0000-0000-000000000002' then '80000000-0000-0000-0000-000000000002'
    else '80000000-0000-0000-0000-000000000001'
  end, 0
from clientes c
where c.unidade_id = 'a0000000-0000-0000-0000-000000000001'
on conflict (cliente_id, unidade_id) do nothing;

-- 14.11. Estoque — Itens
insert into estoque_items (id, unidade_id, nome, categoria, quantidade, quantidade_min, unidade_medida, valor_unitario) values
  ('90000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Toxina botulínica 100U', 'Injetáveis', 2, 5, 'un', 320.00),
  ('90000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ácido hialurônico 1ml', 'Injetáveis', 3, 8, 'un', 180.00),
  ('90000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Máscara pós-peeling', 'Descartáveis', 14, 20, 'un', 12.50),
  ('90000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sérum vitamina C 30ml', 'Cosméticos', 42, 15, 'un', 89.00),
  ('90000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Luvas de nitrilo (cx.)', 'Descartáveis', 58, 20, 'cx', 24.00),
  ('90000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Ponteira de laser CO2', 'Equipamentos', 6, 4, 'un', 350.00)
on conflict (id) do nothing;

-- 14.12. Agendamentos de exemplo (para hoje)
do $$
declare
  v_count integer;
begin
  select count(*) into v_count from agendamentos
  where unidade_id = 'a0000000-0000-0000-0000-000000000001'
    and data = current_date;

  if v_count = 0 then
    -- Ordem dos parâmetros: p_unidade_id, p_cliente_id, p_data, p_hora, p_profissional_id, p_servico_id, p_sala_id, p_duracao_min, p_valor
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      current_date, '09:00',
      'b0000000-0000-0000-0000-000000000003',
      'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
      60, 180.00);
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000002',
      current_date, '10:00',
      'b0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000002',
      45, 250.00);
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000003',
      current_date, '11:30',
      'b0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000005',
      30, 890.00);
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000004',
      current_date, '12:15',
      'b0000000-0000-0000-0000-000000000003',
      'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000001',
      50, 180.00);
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000007',
      current_date, '13:00',
      'b0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002',
      60, 450.00);
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000006',
      current_date, '14:30',
      'b0000000-0000-0000-0000-000000000002',
      'd0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004',
      60, 1200.00);
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000008',
      current_date, '15:00',
      'b0000000-0000-0000-0000-000000000004',
      'd0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003',
      60, 200.00);
    perform public.criar_agendamento('a0000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000005',
      current_date, '16:00',
      'b0000000-0000-0000-0000-000000000003',
      'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
      60, 180.00);
  end if;
end;
$$;

-- ############################################################################
-- 15. REAL-TIME REPLICATION
-- ############################################################################
-- Após executar, habilite no Supabase:
-- Settings > Database > Replication > Adicione as tabelas:
-- sessoes_fila, salas, clientes, agendamentos, transacoes, estoque_items

do $$
begin
  raise notice '============================================';
  raise notice 'FUSION ERP — MIGRAÇÃO COMPLETA APLICADA!';
  raise notice '============================================';
  raise notice '';
  raise notice 'Tabelas criadas: unidades, profissionais, usuarios,';
  raise notice 'servicos, clientes, prontuarios, salas, equipamentos,';
  raise notice 'pacotes, planos, assinaturas, cliente_pacotes,';
  raise notice 'agendamentos, sessoes_fila, transacoes, pdv_vendas,';
  raise notice 'pdv_venda_itens, estoque_items, estoque_entradas,';
  raise notice 'estoque_saidas, fidelidade_niveis, fidelidade_clientes,';
  raise notice 'fidelidade_historico, lista_espera, auditoria';
  raise notice '';
  raise notice 'PRÓXIMOS PASSOS:';
  raise notice '1. Vá em Authentication > Users e crie um usuário admin';
  raise notice '2. Associe o auth user à tabela usuarios:';
  raise notice '   INSERT INTO usuarios (auth_user_id, unidade_id, nome, email, tipo)';   raise notice '   VALUES (''<auth-user-id>'', ''a0000000-0000-0000-0000-000000000001'', ''Admin'', ''admin@fusion.com'', ''admin'');';
  raise notice '3. Database > Replication > Habilite as tabelas para real-time';
  raise notice '============================================';
end;
$$;
