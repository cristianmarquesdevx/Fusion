-- ============================================================================
-- Fusion ERP — Migration 001: Schema Completo
-- @author Cristian Marques
-- @version 1.0.0
-- 
-- Este migration cria todas as tabelas, índices, triggers, RLS policies
-- e seed data para o sistema Fusion ERP no Supabase.
-- 
-- Ordem de execução segura (gerenciada pelo Supabase):
--   1. Extensions
--   2. Enums / tipos
--   3. Tabelas core (unidades, profissionais, usuarios, servicos)
--   4. Tabelas de negócio (clientes, salas, pacotes, planos)
--   5. Tabelas de operação (agendamentos, sessoes_fila, transacoes, estoque)
--   6. Tabelas de relacionamento (fidelidade, lista_espera, auditoria)
--   7. Índices
--   8. Triggers (updated_at automático)
--   9. RLS Policies
--  10. Seed data
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

create type status_sala as enum ('disponivel', 'em_uso', 'ocupada', 'manutencao');
create type status_sessao as enum ('confirmado', 'aguardando', 'ativo', 'atrasado', 'concluido', 'cancelado');
create type tipo_transacao as enum ('receita', 'despesa');
create type status_transacao as enum ('Pago', 'Pendente', 'A pagar', 'Cancelado');
create type tipo_usuario as enum ('admin', 'recepcionista', 'medico', 'esteticista', 'massoterapeuta', 'maquiadora', 'gerente');
create type periodo_preferencia as enum ('Manhã', 'Tarde', 'Qualquer', 'Qualquer horário');

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
  ativo       boolean     not null default true,
  logo_url    text,
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

-- 4.2. Salas
create table if not exists salas (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  equipamentos    text,
  capacidade      integer         not null default 1,
  status          status_sala     not null default 'disponivel',
  sessao_atual_id uuid, -- FK adicionada via ALTER TABLE após criação de sessoes_fila
  manutencao_motivo text,
  manutencao_previsao date,
  manutencao_tecnico text,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.3. Pacotes de sessões
create table if not exists pacotes (
  id                uuid            primary key default gen_random_uuid(),
  unidade_id        uuid            not null references unidades(id) on delete cascade,
  servico_id        uuid            references servicos(id) on delete set null,
  nome              text            not null,
  sessoes_total     integer         not null default 1,
  valor             decimal(10,2)   not null default 0,
  validade_meses    integer         not null default 12,
  promocao          boolean         not null default false,
  ativo             boolean         not null default true,
  created_at        timestamptz     not null default now(),
  updated_at        timestamptz     not null default now()
);

-- 4.4. Planos recorrentes (assinaturas)
create table if not exists planos (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  descricao       text,
  valor           decimal(10,2)   not null default 0,
  beneficios      jsonb           default '[]'::jsonb,
  ativo           boolean         not null default true,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.5. Assinaturas (clientes vinculados a planos)
create table if not exists assinaturas (
  id              uuid            primary key default gen_random_uuid(),
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  plano_id        uuid            not null references planos(id) on delete cascade,
  data_inicio     date            not null default current_date,
  data_fim        date,
  ativa           boolean         not null default true,
  renovacao_auto  boolean         not null default true,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 4.6. Pacotes do cliente (pacotes comprados por cliente)
create table if not exists cliente_pacotes (
  id              uuid            primary key default gen_random_uuid(),
  cliente_id      uuid            not null references clientes(id) on delete cascade,
  pacote_id       uuid            not null references pacotes(id) on delete cascade,
  sessoes_usadas  integer         not null default 0,
  sessoes_total   integer         not null,
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
  status          text            not null default 'confirmado',
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

-- 5.4. Estoque — Itens
create table if not exists estoque_items (
  id              uuid            primary key default gen_random_uuid(),
  unidade_id      uuid            not null references unidades(id) on delete cascade,
  nome            text            not null,
  categoria       text            not null,
  quantidade      integer         not null default 0,
  quantidade_min  integer         not null default 0,
  unidade_medida  text            default 'un',
  valor_unitario  decimal(10,2)   default 0,
  created_at      timestamptz     not null default now(),
  updated_at      timestamptz     not null default now()
);

-- 5.5. Estoque — Log de entradas
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

-- ############################################################################
-- 6. TABELAS DE RELACIONAMENTO
-- ############################################################################

-- 6.1. Fidelidade — Níveis
create table if not exists fidelidade_niveis (
  id              uuid            primary key default gen_random_uuid(),
  nome            text            not null,
  pontos_min      integer         not null default 0,
  cor             text            default '#CD7F32',
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
  tipo            text            not null,  -- 'acumulo', 'resgate', 'bonus', 'expiracao'
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
-- 7. ÍNDICES
-- ############################################################################

-- Clientes
create index idx_clientes_unidade on clientes(unidade_id);
create index idx_clientes_nome on clientes using gin(nome gin_trgm_ops);
create index idx_clientes_telefone on clientes(telefone);
create index idx_clientes_ativo on clientes(unidade_id, ativo);

-- Profissionais
create index idx_profissionais_unidade on profissionais(unidade_id);
create index idx_profissionais_ativo on profissionais(unidade_id, ativo);

-- Usuários
create index idx_usuarios_unidade on usuarios(unidade_id);
create index idx_usuarios_auth on usuarios(auth_user_id);
create index idx_usuarios_email on usuarios(email);

-- Agendamentos
create index idx_agendamentos_unidade on agendamentos(unidade_id);
create index idx_agendamentos_cliente on agendamentos(cliente_id);
create index idx_agendamentos_data on agendamentos(unidade_id, data);
create index idx_agendamentos_profissional on agendamentos(profissional_id);
create index idx_agendamentos_sala on agendamentos(sala_id);
create index idx_agendamentos_status on agendamentos(unidade_id, status);

-- FK da sala para sessão atual (adição tardia pois salas foi criada antes de sessoes_fila)
alter table salas add constraint fk_salas_sessao_atual
  foreign key (sessao_atual_id) references sessoes_fila(id) on delete set null;

-- Sessões Fila
create index idx_sessoes_fila_unidade on sessoes_fila(unidade_id);
create index idx_sessoes_fila_data on sessoes_fila(unidade_id, hora_programada);
create index idx_sessoes_fila_sala on sessoes_fila(sala_id);
create index idx_sessoes_fila_status on sessoes_fila(status);

-- Transações
create index idx_transacoes_unidade on transacoes(unidade_id);
create index idx_transacoes_cliente on transacoes(cliente_id);
create index idx_transacoes_data on transacoes(unidade_id, data);
create index idx_transacoes_tipo on transacoes(unidade_id, tipo);

-- Estoque
create index idx_estoque_unidade on estoque_items(unidade_id);
create index idx_estoque_categoria on estoque_items(unidade_id, categoria);
create index idx_estoque_critico on estoque_items(unidade_id) where quantidade <= quantidade_min;
create index idx_estoque_entradas_item on estoque_entradas(item_id);
create index idx_estoque_entradas_data on estoque_entradas(unidade_id, data_entrada);

-- Fidelidade
create index idx_fidelidade_cliente on fidelidade_clientes(cliente_id);
create index idx_fidelidade_pontos on fidelidade_clientes(unidade_id, pontos desc);

-- Lista de Espera
create index idx_lista_espera_unidade on lista_espera(unidade_id);
create index idx_lista_espera_ativo on lista_espera(unidade_id, ativo);

-- Auditoria
create index idx_auditoria_unidade on auditoria(unidade_id);
create index idx_auditoria_data on auditoria(unidade_id, created_at desc);
create index idx_auditoria_entidade on auditoria(entidade, entidade_id);

-- ############################################################################
-- 8. TRIGGERS (updated_at automático)
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
      and table_name not in ('auditoria', 'fidelidade_historico', 'estoque_entradas')
  loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function trigger_set_updated_at()',
      t
    );
  end loop;
end;
$$ language plpgsql;

-- ############################################################################
-- 9. RLS (ROW LEVEL SECURITY) POLICIES
-- ############################################################################

-- 9.1. Habilitar RLS em todas as tabelas
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

-- 9.2. Função helper para obter unidade do usuário logado
create or replace function auth.user_unidade_id()
returns uuid
language sql
stable
as $$
  select coalesce(unidade_id, (select unidade_id from profissionais where id = (
    select profissional_id from usuarios where auth_user_id = auth.uid()
  )))
  from usuarios
  where auth_user_id = auth.uid()
$$;

-- 9.3. Função helper para verificar se é admin
create or replace function auth.is_admin()
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

-- 9.4. Aplicar policies básicas nas tabelas com unidade_id
-- Cada policy usa uma expressão SQL avaliada em tempo de consulta:
-- admins veem tudo; demais usuários veem apenas registros da própria unidade.
-- NOTA: usamos auth.user_unidade_id() como expressão SQL na policy,
-- NÃO como literal. Isso garante que cada usuário veja apenas sua
-- unidade no momento da consulta, não no momento da criação da policy.
do $$
declare
  rec record;
  policy_expr text;
begin
  for rec in
    select table_name::text as tbl
    from information_schema.columns
    where column_name = 'unidade_id'
      and table_schema = 'public'
      and table_name not in ('fidelidade_niveis')
  loop
    -- Expressão única avaliada em tempo de consulta: admins veem tudo,
    -- demais usuários veem apenas registros da própria unidade
    policy_expr := '(auth.is_admin() or unidade_id = auth.user_unidade_id())';

    execute format(
      'drop policy if exists unidade_access on %I', rec.tbl
    );
    execute format(
      'create policy unidade_access on %I for all using (%s) with check (%s)',
      rec.tbl, policy_expr, policy_expr
    );
  end loop;
end;
$$ language plpgsql;

-- ############################################################################
-- 10. SEED DATA
-- ############################################################################

-- 10.1. Unidades
insert into unidades (id, nome, cnpj, endereco, cidade, uf, telefone, whatsapp, email)
values
  ('a0000000-0000-0000-0000-000000000001', 'Centro Vitta — Unidade Jardins', '12.345.678/0001-90', 'Av. Paulista, 1.234', 'São Paulo', 'SP', '(11) 99999-8888', '(11) 98888-7777', 'contato@vittajardins.com.br'),
  ('a0000000-0000-0000-0000-000000000002', 'Centro Vitta — Moema', '12.345.678/0002-71', 'Av. Ibirapuera, 3.500', 'São Paulo', 'SP', '(11) 97777-6666', '(11) 97777-6667', 'moema@vittajardins.com.br'),
  ('a0000000-0000-0000-0000-000000000003', 'Centro Vitta — Pinheiros', '12.345.678/0003-52', 'Rua dos Pinheiros, 500', 'São Paulo', 'SP', '(11) 96666-5555', null, 'pinheiros@vittajardins.com.br')
on conflict (cnpj) do nothing;

-- 10.2. Profissionais
insert into profissionais (id, unidade_id, nome, cargo, tipo, email, telefone, ativo) values
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ana Souza', 'Recepcionista', 'recepcionista', 'ana@vitta.com', '(11) 97777-1111', true),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Camila Mendes', 'Médica', 'medico', 'camila@vitta.com', '(11) 97777-2222', true),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Fernanda Lima', 'Esteticista', 'esteticista', 'fernanda@vitta.com', '(11) 97777-3333', true),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Carlos Oliveira', 'Massoterapeuta', 'massoterapeuta', 'carlos@vitta.com', '(11) 97777-4444', true),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Julia Santos', 'Maquiadora', 'maquiadora', 'julia@vitta.com', '(11) 97777-5555', true)
on conflict (id) do nothing;

-- 10.3. Salas
insert into salas (id, unidade_id, nome, equipamentos, capacidade, status) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Sala 1 — Estética Facial', 'Laser, Microdermo, Luz Intensa', 1, 'disponivel'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Sala 2 — Procedimentos', 'Cama hidráulica, LED', 1, 'em_uso'),
  ('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Sala 3 — Massagem', 'Maca, Aromaterapia', 1, 'disponivel'),
  ('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sala de Laser', 'Laser CO2 Fracionado, Luz Pulsada', 1, 'manutencao'),
  ('c0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Sala de Procedimentos', 'Cama cirúrgica, Monitor, Aspirador', 1, 'ocupada')
on conflict (id) do nothing;

-- 10.4. Serviços
insert into servicos (id, unidade_id, nome, descricao, categoria, valor, duracao_min) values
  ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Limpeza de pele profunda', 'Limpeza facial completa com extração e máscara', 'Procedimento', 180.00, 60),
  ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Peeling de diamante', 'Esfoliação mecânica com ponteira de diamante', 'Procedimento', 250.00, 45),
  ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Toxina botulínica', 'Aplicação de toxina botulínica para tratamento de linhas de expressão', 'Procedimento', 890.00, 30),
  ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Drenagem linfática', 'Drenagem linfática manual corporal', 'Procedimento', 180.00, 50),
  ('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Microagulhamento', 'Microagulhamento com roller para estímulo de colágeno', 'Procedimento', 450.00, 60),
  ('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Laser CO2 fracionado', 'Laser fracionado para rejuvenescimento facial', 'Procedimento', 1200.00, 60),
  ('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Massagem relaxante', 'Massagem corporal relaxante com óleos essenciais', 'Procedimento', 200.00, 60),
  ('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Hidratação facial', 'Hidratação profunda com ácido hialurônico', 'Procedimento', 120.00, 40)
on conflict (id) do nothing;

-- 10.5. Pacotes
insert into pacotes (id, unidade_id, servico_id, nome, sessoes_total, valor, validade_meses) values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Limpeza facial', 10, 1600.00, 12),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'Peeling de diamante', 6, 1350.00, 12),
  ('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000004', 'Drenagem linfática', 8, 1280.00, 12),
  ('e0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000006', 'Laser CO2', 5, 5400.00, 18),
  ('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'Microagulhamento', 4, 1600.00, 12)
on conflict (id) do nothing;

-- 10.6. Planos
insert into planos (id, unidade_id, nome, descricao, valor, beneficios) values
  ('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Plano Premium', '1 sessão de limpeza de pele · 20% off em procedimentos · 2x pontos fidelidade · Prioridade na agenda', 349.00, '["1 sessão de limpeza de pele por mês", "20% off em procedimentos", "2x pontos fidelidade", "Prioridade na agenda"]'::jsonb),
  ('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Plano Essencial', '1 sessão de massagem · 10% off em produtos · 1.5x pontos fidelidade', 149.00, '["1 sessão de massagem por mês", "10% off em produtos", "1.5x pontos fidelidade"]'::jsonb),
  ('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Plano VIP', '2 sessões mensais · 30% off em procedimentos · 3x pontos · Agendamento prioritário · Brinde mensal', 599.00, '["2 sessões mensais", "30% off em procedimentos", "3x pontos fidelidade", "Agendamento prioritário", "Brinde mensal"]'::jsonb)
on conflict (id) do nothing;

-- 10.7. Clientes
insert into clientes (id, unidade_id, nome, email, telefone, cliente_desde, ultima_visita, observacoes) values
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Marina Costa', 'marina.costa@email.com', '(11) 98221-4410', '2022-03-01', now(), 'Cliente prefere horários pela manhã. Alergia a ácido salicílico.'),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Renata Alves', 'renata.alves@email.com', '(11) 99110-2287', '2021-06-15', now(), null),
  ('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Juliana Prado', 'juliana.prado@email.com', '(11) 98833-7765', '2023-01-10', now(), 'Plano recorrente Premium. Plano recorrente Premium'),
  ('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Beatriz Lima', 'beatriz.lima@email.com', '(11) 97744-9021', '2020-08-20', now(), null),
  ('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Larissa Teixeira', 'larissa.teixeira@email.com', '(11) 96652-3398', '2024-02-05', null, 'Sem pacote ativo. Fidelidade expirando.'),
  ('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Patrícia Nogueira', 'patricia.nogueira@email.com', '(11) 98123-5567', '2019-11-30', now(), null),
  ('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Camila Ferreira', null, '(11) 95551-1111', '2023-05-18', null, null),
  ('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Sofia Ribeiro', null, '(11) 94443-3333', '2024-04-12', null, null)
on conflict (id) do nothing;

-- 10.8. Fidelidade — Níveis
insert into fidelidade_niveis (id, nome, pontos_min, cor) values
  ('g0000000-0000-0000-0000-000000000001', 'Bronze', 0, '#CD7F32'),
  ('g0000000-0000-0000-0000-000000000002', 'Prata', 100, '#C0C0C0'),
  ('g0000000-0000-0000-0000-000000000003', 'Ouro', 300, '#FFD700'),
  ('g0000000-0000-0000-0000-000000000004', 'Platina', 600, '#E5E4E2'),
  ('g0000000-0000-0000-0000-000000000005', 'Diamante', 1000, '#B9F2FF')
on conflict (id) do nothing;

-- 10.9. Fidelidade — Pontos dos clientes
insert into fidelidade_clientes (cliente_id, unidade_id, pontos, nivel_id, pontos_resgate)
select
  c.id,
  c.unidade_id,
  case
    when c.id = '10000000-0000-0000-0000-000000000006' then 1050
    when c.id = '10000000-0000-0000-0000-000000000004' then 620
    when c.id = '10000000-0000-0000-0000-000000000003' then 350
    when c.id = '10000000-0000-0000-0000-000000000001' then 320
    when c.id = '10000000-0000-0000-0000-000000000002' then 180
    else 0
  end,
  case
    when c.id = '10000000-0000-0000-0000-000000000006' then 'g0000000-0000-0000-0000-000000000005'
    when c.id = '10000000-0000-0000-0000-000000000004' then 'g0000000-0000-0000-0000-000000000004'
    when c.id = '10000000-0000-0000-0000-000000000003' then 'g0000000-0000-0000-0000-000000000003'
    when c.id = '10000000-0000-0000-0000-000000000001' then 'g0000000-0000-0000-0000-000000000003'
    when c.id = '10000000-0000-0000-0000-000000000002' then 'g0000000-0000-0000-0000-000000000002'
    else 'g0000000-0000-0000-0000-000000000001'
  end,
  0
from clientes c
where c.unidade_id = 'a0000000-0000-0000-0000-000000000001'
on conflict (cliente_id, unidade_id) do nothing;

-- 10.10. Estoque — Itens
insert into estoque_items (id, unidade_id, nome, categoria, quantidade, quantidade_min, valor_unitario) values
  ('h0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Toxina botulínica 100U', 'Injetáveis', 2, 5, 320.00),
  ('h0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ácido hialurônico 1ml', 'Injetáveis', 3, 8, 180.00),
  ('h0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Máscara pós-peeling', 'Descartáveis', 14, 20, 12.50),
  ('h0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Sérum vitamina C 30ml', 'Cosméticos', 42, 15, 89.00),
  ('h0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Luvas de nitrilo (cx.)', 'Descartáveis', 58, 20, 24.00),
  ('h0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Ponteira de laser CO2', 'Equipamentos', 6, 4, 350.00)
on conflict (id) do nothing;
