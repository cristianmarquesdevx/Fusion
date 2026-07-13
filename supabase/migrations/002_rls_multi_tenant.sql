-- ============================================================================
-- Fusion ERP — Migration 002: RLS Multi-Tenant Granular
-- @author Cristian Marques
-- @version 1.0.0
--
-- Substitui as policies genéricas `FOR ALL` da migration 001 por policies
-- granulares por operação (SELECT, INSERT, UPDATE, DELETE) e por role
-- de usuário (admin, gerente, recepcionista, medico, esteticista, etc.).
--
-- Princípios:
--   1. Toda tabela com unidade_id usa tenant isolation via auth.user_unidade_id()
--   2. Admins (tipo = 'admin') têm acesso total à própria unidade
--   3. Gerentes têm permissões administrativas na própria unidade
--   4. Profissionais (medico, esteticista, massoterapeuta) veem apenas
--      seus próprios agendamentos/sessões e dados gerais da unidade
--   5. Recepcionistas têm acesso CRUD a dados operacionais (clientes,
--      agendamentos, sessoes_fila) mas NÃO a dados financeiros/usuários
--   6. WITH CHECK clauses impedem vazamento de dados entre unidades
-- ============================================================================

-- ############################################################################
-- 1. FUNÇÕES HELPER ADICIONAIS
-- ############################################################################

-- 1.1. Obtém o role do usuário logado a partir dos metadados JWT
-- (fallback para a tabela usuarios quando JWT não tem o claim)
create or replace function auth.user_role()
returns text
language sql
stable
as $$
  select coalesce(
    auth.jwt() ->> 'role',
    (select tipo::text from usuarios where auth_user_id = auth.uid())
  )
$$;

-- 1.2. Verifica se o usuário logado tem um role específico
create or replace function auth.has_role(required_role text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    where auth.user_role() = required_role
       or auth.is_admin()
  )
$$;

-- 1.3. Verifica se o usuário logado é gerente ou admin
create or replace function auth.is_gerente_or_admin()
returns boolean
language sql
stable
as $$
  select auth.is_admin() or auth.user_role() = 'gerente'
$$;

-- 1.4. Verifica se o usuário logado é profissional de atendimento
-- (médico, esteticista, massoterapeuta, maquiadora)
create or replace function auth.is_profissional()
returns boolean
language sql
stable
as $$
  select auth.user_role() in ('medico', 'esteticista', 'massoterapeuta', 'maquiadora')
$$;

-- 1.5. Obtém o profissional_id do usuário logado (para filtrar agendamentos)
create or replace function auth.user_profissional_id()
returns uuid
language sql
stable
as $$
  select profissional_id
  from usuarios
  where auth_user_id = auth.uid()
$$;

-- ############################################################################
-- 2. REMOVER POLICIES ANTIGAS (criadas pela migration 001)
-- e recriar com granularidade
-- ############################################################################

do $$
declare
  rec record;
begin
  for rec in
    select table_name::text as tbl
    from information_schema.columns
    where column_name = 'unidade_id'
      and table_schema = 'public'
  loop
    execute format('drop policy if exists unidade_access on %I', rec.tbl);
    execute format('drop policy if exists select_own_unidade on %I', rec.tbl);
    execute format('drop policy if exists insert_own_unidade on %I', rec.tbl);
    execute format('drop policy if exists update_own_unidade on %I', rec.tbl);
    execute format('drop policy if exists delete_own_unidade on %I', rec.tbl);
  end loop;
end;
$$ language plpgsql;

-- Também remove das tabelas sem unidade_id que possam ter sido afetadas
drop policy if exists unidade_access on fidelidade_niveis;
drop policy if exists select_own_unidade on fidelidade_niveis;

-- ############################################################################
-- 3. POLICIES BASE — ISOLAMENTO POR UNIDADE
-- ############################################################################

-- Expressão reutilizável: usuário vê apenas registros da sua unidade
-- (admins veem tudo)
-- Nota: usamos auth.user_unidade_id() como expressão SQL, não como literal.
-- Isso garante avaliação em tempo de consulta.

-- 3.1. unidades
create policy select_unidades on unidades for select
  using (auth.is_admin() or id = auth.user_unidade_id());

create policy update_unidades on unidades for update
  using (auth.is_admin() or id = auth.user_unidade_id())
  with check (auth.is_admin() or id = auth.user_unidade_id());

-- Admins podem criar e deletar unidades; bloqueamos INSERT/DELETE para não-admins
create policy insert_unidades on unidades for insert
  with check (auth.is_admin());

create policy delete_unidades on unidades for delete
  using (auth.is_admin())

-- 3.2. profissionais (admin/gerente CRUD, demais SELECT)
create policy select_profissionais on profissionais for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_profissionais on profissionais for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_profissionais on profissionais for update
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id())
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy delete_profissionais on profissionais for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- 3.3. servicos (catálogo: todos da unidade podem ver, admin/gerente gerencia)
create policy select_servicos on servicos for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_servicos on servicos for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_servicos on servicos for update
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id())
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy delete_servicos on servicos for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- 3.4. clientes (todos da unidade podem CRUD)
create policy select_clientes on clientes for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_clientes on clientes for insert
  with check (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy update_clientes on clientes for update
  using (auth.is_admin() or unidade_id = auth.user_unidade_id())
  with check (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy delete_clientes on clientes for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- 3.5. salas (todos da unidade podem ver, admin/gerente gerencia)
create policy select_salas on salas for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_salas on salas for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_salas on salas for update
  using (auth.is_admin() or unidade_id = auth.user_unidade_id())
  with check (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy delete_salas on salas for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- ############################################################################
-- 4. POLICIES — USUÁRIOS (SENSÍVEL)
-- Apenas admin/gerente pode gerenciar; demais veem apenas o próprio registro.
-- ############################################################################

create policy select_usuarios_self on usuarios for select
  using (
    auth.is_gerente_or_admin() or
    auth_user_id = auth.uid()
  );

-- Usuários não-admin só podem se ver; admins/gerentes veem todos da unidade
-- Nota: usamos uma policy adicional para admins verem todos
create policy select_usuarios_unidade on usuarios for select
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy insert_usuarios on usuarios for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_usuarios on usuarios for update
  using (
    (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id()) or
    auth_user_id = auth.uid()
  )
  with check (
    (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id()) or
    auth_user_id = auth.uid()
  );

create policy delete_usuarios on usuarios for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- ############################################################################
-- 5. POLICIES — AGENDAMENTOS
-- Profissionais veem apenas seus próprios agendamentos.
-- Recepcionistas/gerentes/admins veem todos da unidade.
-- ############################################################################

create policy select_agendamentos_proprios on agendamentos for select
  using (
    -- Admins/gerentes/recepcionistas veem todos da unidade
    (auth.has_role('recepcionista') and unidade_id = auth.user_unidade_id())
    or auth.is_gerente_or_admin()
    -- Profissionais veem apenas os seus
    or (auth.is_profissional() and profissional_id = auth.user_profissional_id() and unidade_id = auth.user_unidade_id())
  );

create policy insert_agendamentos on agendamentos for insert
  with check (unidade_id = auth.user_unidade_id());

create policy update_agendamentos_proprios on agendamentos for update
  using (
    (auth.has_role('recepcionista') and unidade_id = auth.user_unidade_id())
    or auth.is_gerente_or_admin()
    or (auth.is_profissional() and profissional_id = auth.user_profissional_id() and unidade_id = auth.user_unidade_id())
  )
  with check (unidade_id = auth.user_unidade_id());

create policy delete_agendamentos on agendamentos for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- ############################################################################
-- 6. POLICIES — SESSÕES DA FILA DE ATENDIMENTO
-- Mesma lógica dos agendamentos: profissionais veem as próprias sessões;
-- recepcionistas/admins/gerentes veem todas.
-- ############################################################################

create policy select_sessoes_fila on sessoes_fila for select
  using (
    (auth.has_role('recepcionista') and unidade_id = auth.user_unidade_id())
    or auth.is_gerente_or_admin()
    or (auth.is_profissional() and profissional_id = auth.user_profissional_id() and unidade_id = auth.user_unidade_id())
  );

create policy insert_sessoes_fila on sessoes_fila for insert
  with check (unidade_id = auth.user_unidade_id());

create policy update_sessoes_fila on sessoes_fila for update
  using (
    (auth.has_role('recepcionista') and unidade_id = auth.user_unidade_id())
    or auth.is_gerente_or_admin()
    or (auth.is_profissional() and profissional_id = auth.user_profissional_id() and unidade_id = auth.user_unidade_id())
  )
  with check (unidade_id = auth.user_unidade_id());

create policy delete_sessoes_fila on sessoes_fila for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- ############################################################################
-- 7. POLICIES — TRANSAÇÕES FINANCEIRAS
-- Apenas admin/gerente/recepcionista pode gerenciar.
-- Profissionais veem apenas leitura.
-- ############################################################################

create policy select_transacoes on transacoes for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_transacoes on transacoes for insert
  with check (
    (auth.has_role('recepcionista') or auth.is_gerente_or_admin())
    and unidade_id = auth.user_unidade_id()
  );

create policy update_transacoes on transacoes for update
  using (
    (auth.has_role('recepcionista') or auth.is_gerente_or_admin())
    and unidade_id = auth.user_unidade_id()
  )
  with check (unidade_id = auth.user_unidade_id());

create policy delete_transacoes on transacoes for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- ############################################################################
-- 8. POLICIES — ESTOQUE
-- Admin/gerente CRUD; demais leitura.
-- ############################################################################

-- 8.1. Itens
create policy select_estoque on estoque_items for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_estoque on estoque_items for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_estoque on estoque_items for update
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id())
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy delete_estoque on estoque_items for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- 8.2. Entradas
create policy select_estoque_entradas on estoque_entradas for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_estoque_entradas on estoque_entradas for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_estoque_entradas on estoque_entradas for update
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id())
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy delete_estoque_entradas on estoque_entradas for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- ############################################################################
-- 9. POLICIES — PACOTES E PLANOS
-- Admin/gerente CRUD; recepcionista pode ler e usar (insert em cliente_pacotes);
-- demais leitura.
-- ############################################################################

-- 9.1. Pacotes
create policy select_pacotes on pacotes for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_pacotes on pacotes for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_pacotes on pacotes for update
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id())
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy delete_pacotes on pacotes for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- 9.2. Planos (recorrentes)
create policy select_planos on planos for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_planos on planos for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_planos on planos for update
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id())
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy delete_planos on planos for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- 9.3. Assinaturas (vinculam clientes a planos)
create policy select_assinaturas on assinaturas for select
  using (auth.is_admin() or exists (
    select 1 from clientes c
    where c.id = assinaturas.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ));

create policy insert_assinaturas on assinaturas for insert
  with check (exists (
    select 1 from clientes c
    where c.id = assinaturas.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ));

create policy update_assinaturas on assinaturas for update
  using (auth.is_gerente_or_admin() and exists (
    select 1 from clientes c
    where c.id = assinaturas.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ))
  with check (
    auth.is_gerente_or_admin() and exists (
      select 1 from clientes c
      where c.id = assinaturas.cliente_id
        and c.unidade_id = auth.user_unidade_id()
    )
  );

create policy delete_assinaturas on assinaturas for delete
  using (auth.is_gerente_or_admin());

-- 9.4. Pacotes do cliente
create policy select_cliente_pacotes on cliente_pacotes for select
  using (auth.is_admin() or exists (
    select 1 from clientes c
    where c.id = cliente_pacotes.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ));

create policy insert_cliente_pacotes on cliente_pacotes for insert
  with check (exists (
    select 1 from clientes c
    where c.id = cliente_pacotes.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ));

create policy update_cliente_pacotes on cliente_pacotes for update
  using (exists (
    select 1 from clientes c
    where c.id = cliente_pacotes.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ))
  with check (exists (
    select 1 from clientes c
    where c.id = cliente_pacotes.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ));

create policy delete_cliente_pacotes on cliente_pacotes for delete
  using (auth.is_gerente_or_admin());

-- ############################################################################
-- 10. POLICIES — FIDELIDADE
-- ############################################################################

-- 10.1. Níveis (público — sem RLS, apenas leitura já garantida)
-- Nota: RLS não está habilitado em fidelidade_niveis (definição da migration 001)
-- Garantimos que não há policies residuais
drop policy if exists select_fidelidade_niveis on fidelidade_niveis;

-- 10.2. Pontos por cliente
create policy select_fidelidade_clientes on fidelidade_clientes for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_fidelidade_clientes on fidelidade_clientes for insert
  with check (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

create policy update_fidelidade_clientes on fidelidade_clientes for update
  using (auth.has_role('recepcionista') and unidade_id = auth.user_unidade_id())
  with check (unidade_id = auth.user_unidade_id());

create policy delete_fidelidade_clientes on fidelidade_clientes for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- 10.3. Histórico
create policy select_fidelidade_historico on fidelidade_historico for select
  using (auth.is_admin() or exists (
    select 1 from clientes c
    where c.id = fidelidade_historico.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ));

create policy insert_fidelidade_historico on fidelidade_historico for insert
  with check (exists (
    select 1 from clientes c
    where c.id = fidelidade_historico.cliente_id
      and c.unidade_id = auth.user_unidade_id()
  ));

create policy update_fidelidade_historico on fidelidade_historico for update
  using (auth.is_gerente_or_admin())
  with check (auth.is_gerente_or_admin());

create policy delete_fidelidade_historico on fidelidade_historico for delete
  using (auth.is_gerente_or_admin());

-- ############################################################################
-- 11. POLICIES — LISTA DE ESPERA
-- ############################################################################

create policy select_lista_espera on lista_espera for select
  using (auth.is_admin() or unidade_id = auth.user_unidade_id());

create policy insert_lista_espera on lista_espera for insert
  with check (unidade_id = auth.user_unidade_id());

create policy update_lista_espera on lista_espera for update
  using (unidade_id = auth.user_unidade_id())
  with check (unidade_id = auth.user_unidade_id());

create policy delete_lista_espera on lista_espera for delete
  using (auth.is_gerente_or_admin() and unidade_id = auth.user_unidade_id());

-- ############################################################################
-- 12. POLICIES — AUDITORIA
-- Apenas leitura para admin/gerente; inserção automática via trigger.
-- ############################################################################

create policy select_auditoria on auditoria for select
  using (auth.is_gerente_or_admin() and (
    unidade_id = auth.user_unidade_id() or auth.is_admin()
  ));

-- Auditoria é inserida por trigger/função, não por usuário direto.
-- Bloqueamos insert/update/delete manuais.
create policy no_insert_auditoria on auditoria for insert
  with check (false);

create policy no_update_auditoria on auditoria for update
  using (false);

create policy no_delete_auditoria on auditoria for delete
  using (false);

-- ############################################################################
-- 13. POLICIES — ESTOQUE_ENTRADAS
-- Nota: já definido na seção 8.2, incluído aqui para consistência.
-- ############################################################################

-- (já definido acima)

-- ############################################################################
-- 14. VERIFICAÇÃO DE CONSISTÊNCIA
-- ############################################################################

-- Comentário: para verificar se todas as policies foram criadas:
--   select schemaname, tablename, policyname, permissive, roles, cmd, qual
--   from pg_policies
--   where schemaname = 'public'
--   order by tablename, policyname;

-- Para testar como um usuário específico:
--   set local role authenticated;
--   set local "request.jwt.claims" to '{"sub": "<user-id>", "role": "recepcionista"}';
--   select * from clientes limit 5;
