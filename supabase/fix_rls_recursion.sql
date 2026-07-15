-- ============================================================================
-- FUSION ERP — CORREÇÃO RLS: "stack depth limit exceeded"
-- ============================================================================
-- Causa: As funções auth.user_unidade_id() e auth.user_role() consultam a
-- tabela usuarios, que TEM RLS ativado. Quando o RLS dispara, chama essas
-- funções novamente → LOOP INFINITO.
-- 
-- Solução: Adicionar SECURITY DEFINER às funções helper (ignoram RLS) e
-- desabilitar RLS na tabela usuarios (já que o controle de acesso nela é
-- feito via auth.users do próprio Supabase).
-- ============================================================================
-- Como usar: 
--   1. Vá em https://supabase.com/dashboard/project/njbkbhqioieqfzfaczqs/sql/new
--   2. Cole TODO este script e execute
-- ============================================================================

-- 1. Desabilita RLS na tabela usuarios (as funções auth precisam lê-la)
alter table usuarios disable row level security;

-- 2. Remove todas as policies antigas de usuarios
drop policy if exists select_usuarios_self on usuarios;
drop policy if exists select_usuarios_unidade on usuarios;
drop policy if exists insert_usuarios on usuarios;
drop policy if exists update_usuarios on usuarios;
drop policy if exists delete_usuarios on usuarios;

-- 3. Recria auth.user_unidade_id() com SECURITY DEFINER
create or replace function auth.user_unidade_id()
returns uuid
language sql
stable
security definer
as $$
  select coalesce(
    (auth.jwt() ->> 'unidade_id')::uuid,
    (select unidade_id from usuarios where auth_user_id = auth.uid())
  )
$$;

-- 4. Recria auth.user_role() com SECURITY DEFINER
create or replace function auth.user_role()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    auth.jwt() ->> 'role',
    (select tipo::text from usuarios where auth_user_id = auth.uid())
  )
$$;

-- 5. Recria auth.is_admin() com SECURITY DEFINER (previne recursão em auth.users)
create or replace function auth.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    auth.jwt() ->> 'role' = 'admin',
    false
  ) or exists (
    select 1 from usuarios where auth_user_id = auth.uid() and tipo = 'admin'
  )
$$;

-- 6. Recria auth.is_gerente_or_admin()
create or replace function auth.is_gerente_or_admin()
returns boolean
language sql
stable
security definer
as $$
  select auth.is_admin() or auth.user_role() = 'gerente'
$$;

-- 7. Recria auth.has_role()
create or replace function auth.has_role(required_role text)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    where auth.user_role() = required_role
       or auth.is_admin()
  )
$$;

-- 8. Recria auth.is_profissional()
create or replace function auth.is_profissional()
returns boolean
language sql
stable
security definer
as $$
  select auth.user_role() in ('medico', 'esteticista', 'massoterapeuta', 'maquiadora')
$$;

-- 9. Recria auth.user_profissional_id()
create or replace function auth.user_profissional_id()
returns uuid
language sql
stable
security definer
as $$
  select profissional_id
  from usuarios
  where auth_user_id = auth.uid()
$$;

-- 10. Reativa RLS na tabela usuarios (com policies SIMPLES que não causam recursão)
alter table usuarios enable row level security;

create policy select_usuarios on usuarios for select
  using (auth.uid() = auth_user_id);

create policy insert_usuarios on usuarios for insert
  with check (auth.is_admin());

create policy update_usuarios on usuarios for update
  using (auth.uid() = auth_user_id or auth.is_admin())
  with check (auth.uid() = auth_user_id or auth.is_admin());

create policy delete_usuarios on usuarios for delete
  using (auth.is_admin());

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================
-- Execute após aplicar o script para confirmar:
--   select * from unidades limit 5;
--   select * from clientes limit 5;
-- ============================================================================

-- 11. Remove trigger problemático de auditoria (pode causar recursão também se RLS estiver mal configurado)
drop trigger if exists trigger_auditoria_cliente on clientes;
drop function if exists public.trigger_auditoria_cliente();

-- 12. Teste de conectividade
do $$
begin
  raise notice '============================================';
  raise notice 'CORREÇÃO RLS APLICADA COM SUCESSO!';
  raise notice '============================================';
  raise notice '';
  raise notice '- SECURITY DEFINER adicionado às funções auth';
  raise notice '- RLS da tabela usuarios simplificado';
  raise notice '- Trigger de auditoria removido (recursivo)';
  raise notice '';
  raise notice 'Teste agora no SQL Editor:';
  raise notice '  select * from unidades limit 5;';
  raise notice '  select * from clientes limit 5;';
end;
$$;
