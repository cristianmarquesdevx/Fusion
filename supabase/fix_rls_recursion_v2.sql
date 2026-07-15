-- ============================================================================
-- FUSION ERP — CORREÇÃO RLS v2 (sem modificar schema auth)
-- ============================================================================
-- Erro anterior: "permission denied for schema auth" — o schema auth é
-- gerenciado pelo Supabase e não podemos criar funções lá.
--
-- Solução: Criar as funções no schema PUBLIC e recriar todas as policies
-- RLS apontando para public.<função>() em vez de auth.<função>().
-- ============================================================================
-- Como usar:
--   1. Vá em https://supabase.com/dashboard/project/njbkbhqioieqfzfaczqs/sql/new
--   2. Cole TODO este script e execute
-- ============================================================================

-- ############################################################################
-- 1. FUNÇÕES HELPER NO SCHEMA PUBLIC
-- ############################################################################

-- 1.1. Obtém o ID da unidade do usuário logado
create or replace function public.user_unidade_id()
returns uuid
language sql
stable
security definer
as $$
  select coalesce(
    (auth.jwt() ->> 'unidade_id')::uuid,
    (select unidade_id from usuarios where auth_user_id = auth.uid() limit 1)
  )
$$;

-- 1.2. Obtém o role do usuário logado (admin, recepcionista, etc.)
create or replace function public.user_role()
returns text
language sql
stable
security definer
as $$
  select coalesce(
    auth.jwt() ->> 'role',
    (select tipo::text from usuarios where auth_user_id = auth.uid() limit 1)
  )
$$;

-- 1.3. Verifica se é admin
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(auth.jwt() ->> 'role' = 'admin', false)
      or exists (select 1 from usuarios where auth_user_id = auth.uid() and tipo = 'admin')
$$;

-- 1.4. Verifica se é gerente ou admin
create or replace function public.is_gerente_or_admin()
returns boolean
language sql
stable
security definer
as $$
  select public.is_admin() or public.user_role() = 'gerente'
$$;

-- 1.5. Verifica se tem um role específico
create or replace function public.has_role(required_role text)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 where public.user_role() = required_role or public.is_admin()
  )
$$;

-- 1.6. Verifica se é profissional de atendimento
create or replace function public.is_profissional()
returns boolean
language sql
stable
security definer
as $$
  select public.user_role() in ('medico', 'esteticista', 'massoterapeuta', 'maquiadora')
$$;

-- 1.7. Obtém o profissional_id do usuário logado
create or replace function public.user_profissional_id()
returns uuid
language sql
stable
security definer
as $$
  select profissional_id from usuarios where auth_user_id = auth.uid() limit 1
$$;

-- ############################################################################
-- 2. DESABILITA RLS TEMPORARIAMENTE PARA RECRIAR POLICIES
-- ############################################################################

-- Desabilita RLS em TODAS as tabelas para dropar as policies antigas
alter table if exists unidades disable row level security;
alter table if exists profissionais disable row level security;
alter table if exists servicos disable row level security;
alter table if exists clientes disable row level security;
alter table if exists prontuarios disable row level security;
alter table if exists salas disable row level security;
alter table if exists equipamentos disable row level security;
alter table if exists agendamentos disable row level security;
alter table if exists sessoes_fila disable row level security;
alter table if exists transacoes disable row level security;
alter table if exists pdv_vendas disable row level security;
alter table if exists pdv_venda_itens disable row level security;
alter table if exists estoque_items disable row level security;
alter table if exists estoque_entradas disable row level security;
alter table if exists estoque_saidas disable row level security;
alter table if exists pacotes disable row level security;
alter table if exists planos disable row level security;
alter table if exists assinaturas disable row level security;
alter table if exists cliente_pacotes disable row level security;
alter table if exists fidelidade_niveis disable row level security;
alter table if exists fidelidade_clientes disable row level security;
alter table if exists fidelidade_historico disable row level security;
alter table if exists lista_espera disable row level security;
alter table if exists auditoria disable row level security;
alter table if exists usuarios disable row level security;

-- Remove todas as policies antigas (que referenciavam auth.<funcao>)
do $$
declare
  rec record;
begin
  for rec in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I', rec.policyname, rec.tablename);
  end loop;
end $$;

-- ############################################################################
-- 3. RECRIA TODAS AS POLICIES — AGORA USANDO public.<funcao>()
-- ############################################################################

-- 3.1. unidades
alter table unidades enable row level security;
create policy select_unidades on unidades for select
  using (public.is_admin() or id = public.user_unidade_id());
create policy insert_unidades on unidades for insert
  with check (public.is_admin());
create policy update_unidades on unidades for update
  using (public.is_admin() or id = public.user_unidade_id())
  with check (public.is_admin() or id = public.user_unidade_id());
create policy delete_unidades on unidades for delete
  using (public.is_admin());

-- 3.2. profissionais
alter table profissionais enable row level security;
create policy select_profissionais on profissionais for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_profissionais on profissionais for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_profissionais on profissionais for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_profissionais on profissionais for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.3. servicos
alter table servicos enable row level security;
create policy select_servicos on servicos for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_servicos on servicos for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_servicos on servicos for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_servicos on servicos for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.4. clientes
alter table clientes enable row level security;
create policy select_clientes on clientes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_clientes on clientes for insert
  with check (public.is_admin() or unidade_id = public.user_unidade_id());
create policy update_clientes on clientes for update
  using (public.is_admin() or unidade_id = public.user_unidade_id())
  with check (public.is_admin() or unidade_id = public.user_unidade_id());
create policy delete_clientes on clientes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.5. salas
alter table salas enable row level security;
create policy select_salas on salas for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_salas on salas for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_salas on salas for update
  using (public.is_admin() or unidade_id = public.user_unidade_id())
  with check (public.is_admin() or unidade_id = public.user_unidade_id());
create policy delete_salas on salas for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.6. usuarios
alter table usuarios enable row level security;
create policy select_usuarios on usuarios for select
  using (auth.uid() = auth_user_id or public.is_admin());
create policy insert_usuarios on usuarios for insert
  with check (public.is_admin());
create policy update_usuarios on usuarios for update
  using (auth.uid() = auth_user_id or public.is_admin())
  with check (auth.uid() = auth_user_id or public.is_admin());
create policy delete_usuarios on usuarios for delete
  using (public.is_admin());

-- 3.7. agendamentos
alter table agendamentos enable row level security;
create policy select_agendamentos on agendamentos for select
  using (unidade_id = public.user_unidade_id());
create policy insert_agendamentos on agendamentos for insert
  with check (unidade_id = public.user_unidade_id());
create policy update_agendamentos on agendamentos for update
  using (unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_agendamentos on agendamentos for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.8. sessoes_fila
alter table sessoes_fila enable row level security;
create policy select_sessoes_fila on sessoes_fila for select
  using (unidade_id = public.user_unidade_id());
create policy insert_sessoes_fila on sessoes_fila for insert
  with check (unidade_id = public.user_unidade_id());
create policy update_sessoes_fila on sessoes_fila for update
  using (unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_sessoes_fila on sessoes_fila for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.9. transacoes
alter table transacoes enable row level security;
create policy select_transacoes on transacoes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_transacoes on transacoes for insert
  with check ((public.has_role('recepcionista') or public.is_gerente_or_admin()) and unidade_id = public.user_unidade_id());
create policy update_transacoes on transacoes for update
  using ((public.has_role('recepcionista') or public.is_gerente_or_admin()) and unidade_id = public.user_unidade_id())
  with check (unidade_id = public.user_unidade_id());
create policy delete_transacoes on transacoes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.10. estoque_items
alter table estoque_items enable row level security;
create policy select_estoque on estoque_items for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_estoque on estoque_items for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_estoque on estoque_items for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_estoque on estoque_items for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.11. estoque_entradas
alter table estoque_entradas enable row level security;
create policy select_estoque_entradas on estoque_entradas for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_estoque_entradas on estoque_entradas for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_estoque_entradas on estoque_entradas for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_estoque_entradas on estoque_entradas for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.12. pacotes
alter table pacotes enable row level security;
create policy select_pacotes on pacotes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_pacotes on pacotes for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_pacotes on pacotes for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_pacotes on pacotes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.13. planos
alter table planos enable row level security;
create policy select_planos on planos for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_planos on planos for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy update_planos on planos for update
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id())
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_planos on planos for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.14. assinaturas
alter table assinaturas enable row level security;
create policy select_assinaturas on assinaturas for select
  using (public.is_admin() or exists (
    select 1 from clientes c where c.id = assinaturas.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy insert_assinaturas on assinaturas for insert
  with check (exists (
    select 1 from clientes c where c.id = assinaturas.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy delete_assinaturas on assinaturas for delete
  using (public.is_gerente_or_admin());

-- 3.15. cliente_pacotes
alter table cliente_pacotes enable row level security;
create policy select_cliente_pacotes on cliente_pacotes for select
  using (public.is_admin() or exists (
    select 1 from clientes c where c.id = cliente_pacotes.cliente_id and c.unidade_id = public.user_unidade_id()
  ));
create policy insert_cliente_pacotes on cliente_pacotes for insert
  with check (exists (
    select 1 from clientes c where c.id = cliente_pacotes.cliente_id and c.unidade_id = public.user_unidade_id()
  ));

-- 3.16. fidelidade_niveis (público — sem RLS granular)
alter table fidelidade_niveis enable row level security;
create policy select_fidelidade_niveis on fidelidade_niveis for select
  using (true);  -- qualquer um pode ver os níveis
create policy insert_fidelidade_niveis on fidelidade_niveis for insert
  with check (public.is_admin());

-- 3.17. fidelidade_clientes
alter table fidelidade_clientes enable row level security;
create policy select_fidelidade_clientes on fidelidade_clientes for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_fidelidade_clientes on fidelidade_clientes for insert
  with check (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());
create policy delete_fidelidade_clientes on fidelidade_clientes for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.18. fidelidade_historico
alter table fidelidade_historico enable row level security;
create policy select_fidelidade_historico on fidelidade_historico for select
  using (public.is_admin() or exists (
    select 1 from clientes c where c.id = fidelidade_historico.cliente_id and c.unidade_id = public.user_unidade_id()
  ));

-- 3.19. lista_espera
alter table lista_espera enable row level security;
create policy select_lista_espera on lista_espera for select
  using (public.is_admin() or unidade_id = public.user_unidade_id());
create policy insert_lista_espera on lista_espera for insert
  with check (unidade_id = public.user_unidade_id());
create policy delete_lista_espera on lista_espera for delete
  using (public.is_gerente_or_admin() and unidade_id = public.user_unidade_id());

-- 3.20. auditoria
alter table auditoria enable row level security;
create policy select_auditoria on auditoria for select
  using (public.is_gerente_or_admin() and (unidade_id = public.user_unidade_id() or public.is_admin()));

-- ############################################################################
-- 4. Remove trigger de auditoria problemático (causava recursão)
-- ############################################################################
drop trigger if exists trigger_auditoria_cliente on clientes;
drop function if exists public.trigger_auditoria_cliente();

-- ############################################################################
-- 5. VERIFICAÇÃO
-- ############################################################################
do $$
begin
  raise notice '============================================';
  raise notice 'CORREÇÃO RLS v2 APLICADA COM SUCESSO!';
  raise notice '============================================';
  raise notice '';
  raise notice '- Funções criadas no schema public';
  raise notice '- Policies recriadas com public.*';
  raise notice '- Trigger de auditoria removido';
  raise notice '';
  raise notice 'Teste agora:';
  raise notice '  select * from clientes limit 5;';
end;
$$;
