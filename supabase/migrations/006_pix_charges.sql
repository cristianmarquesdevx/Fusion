-- ============================================================================
-- Fusion ERP — Migration 006: Pix Charges Table
-- @version 1.0.0
--
-- Cria a tabela pix_charges para rastrear cobranças PIX criadas via
-- AbacatePay, com suporte a polling, webhooks e expiração automática.
-- ============================================================================

-- ############################################################################
-- 1. ENUM — Status da cobrança PIX
-- ############################################################################
do $$ begin
  create type pix_charge_status as enum (
    'PENDING',
    'PAID',
    'FAILED',
    'EXPIRED',
    'CANCELLED',
    'REFUNDED',
    'DISPUTED'
  );
exception when duplicate_object then null;
end $$;

-- ############################################################################
-- 2. TABELA — pix_charges
-- ############################################################################
-- Armazena cada cobrança PIX gerada pelo sistema e seu ciclo de vida.
-- A correlação com a AbacatePay é feita via external_id (nosso UUID local)
-- e abacatepay_id (ID da cobrança na AbacatePay).
create table if not exists pix_charges (
  id                  uuid                primary key default gen_random_uuid(),
  unidade_id          uuid                references unidades(id) on delete set null,

  -- Identificação externa (enviado como externalId para AbacatePay)
  external_id         text                not null unique,

  -- ID da cobrança na AbacatePay (preenchido após criação)
  abacatepay_id       text,

  -- Metadados do cliente
  customer_name       text                not null,
  customer_email      text,
  customer_cellphone  text,

  -- Valores (em centavos para compatibilidade com a AbacatePay)
  amount_cents        integer             not null check (amount_cents > 0),
  amount              decimal(10,2)       not null,
  description         text,

  -- QR Code PIX
  br_code             text,               -- Código copia-e-cola
  br_code_base64      text,               -- Imagem QR Code em base64

  -- Ciclo de vida
  status              pix_charge_status   not null default 'PENDING',
  paid_at             timestamptz,

  -- Origem: 'public_booking' | 'pdv' | 'planos' | 'subscription' | 'manual'
  source              text                not null default 'manual',

  -- IDs de referência no sistema (opcionais)
  agendamento_id      uuid                references agendamentos(id) on delete set null,
  venda_id            uuid                references pdv_vendas(id) on delete set null,
  assinatura_id       uuid                references assinaturas(id) on delete set null,

  -- Payload completo recebido nos webhooks (para auditoria)
  last_webhook_payload jsonb,

  -- Expiração
  expires_at          timestamptz,
  expired_at          timestamptz,

  -- Metadados extras
  metadata            jsonb               default '{}'::jsonb,

  created_at          timestamptz         not null default now(),
  updated_at          timestamptz         not null default now()
);

-- ############################################################################
-- 3. ÍNDICES
-- ############################################################################
create index if not exists idx_pix_charges_external_id on pix_charges(external_id);
create index if not exists idx_pix_charges_abacatepay_id on pix_charges(abacatepay_id);
create index if not exists idx_pix_charges_status on pix_charges(status);
create index if not exists idx_pix_charges_unidade on pix_charges(unidade_id);
create index if not exists idx_pix_charges_created on pix_charges(created_at desc);
create index if not exists idx_pix_charges_expires on pix_charges(expires_at) where status = 'PENDING';

-- ############################################################################
-- 4. TRIGGER — updated_at automático
-- ############################################################################
drop trigger if exists set_updated_at on pix_charges;
create trigger set_updated_at
  before update on pix_charges
  for each row execute function trigger_set_updated_at();

-- ############################################################################
-- 5. RLS — Apenas service_role (backend) pode manipular pix_charges
-- ############################################################################
alter table pix_charges enable row level security;

-- Admins podem ver todas as cobranças da própria unidade
create policy select_pix_charges on pix_charges for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());

-- Apenas backend (service_role) pode inserir/atualizar
-- Policies são bypassed pela service_role, então essas são só para segurança
-- extra em caso de acesso direto via anon key

-- Clientes anônimos (agendamento público) não devem ver pix_charges
create policy no_insert_pix_charges on pix_charges for insert
  with check (false);

create policy no_update_pix_charges on pix_charges for update
  using (false)
  with check (false);

create policy no_delete_pix_charges on pix_charges for delete
  using (false);

-- ############################################################################
-- 6. FUNÇÃO — Buscar cobrança pendente por external_id
-- ############################################################################
create or replace function public.get_pix_charge(external_id text)
returns setof pix_charges
language sql
stable
as $$
  select * from pix_charges
  where pix_charges.external_id = get_pix_charge.external_id
  limit 1;
$$;

-- ############################################################################
-- 7. FUNÇÃO — Atualizar status da cobrança (usada pelo webhook/backend)
-- ############################################################################
create or replace function public.update_pix_charge_status(
  p_external_id text,
  p_status pix_charge_status,
  p_abacatepay_id text default null,
  p_paid_at timestamptz default null,
  p_webhook_payload jsonb default null
) returns pix_charges
language plpgsql
as $$
declare
  v_charge pix_charges;
begin
  update pix_charges
  set
    status = p_status,
    abacatepay_id = coalesce(p_abacatepay_id, abacatepay_id),
    paid_at = coalesce(p_paid_at, case when p_status = 'PAID' then now() else paid_at end),
    expired_at = case when p_status = 'EXPIRED' then now() else expired_at end,
    last_webhook_payload = coalesce(p_webhook_payload, last_webhook_payload),
    updated_at = now()
  where external_id = p_external_id
  returning * into v_charge;

  return v_charge;
end;
$$;
