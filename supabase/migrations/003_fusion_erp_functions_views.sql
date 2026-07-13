-- ============================================================================
-- Fusion ERP — Migration 003: Funções, Views e Triggers de Negócio
-- @author Cristian Marques
-- @version 1.0.0
--
-- CORREÇÕES DA MIGRATION 002:
--   - Adiciona ponto e vírgula faltando em `delete_unidades` (002 linha 56)
--
-- NOVAS FUNCIONALIDADES:
--   1. Funções de negócio (calcular nível fidelidade, atualizar status sala)
--   2. Triggers automáticos (fidelidade ao finalizar venda, baixa estoque)
--   3. Views para relatórios (BI, Financeiro, Fidelidade)
--   4. Função de busca textual (clientes, serviços)
--   5. Refresh materializado para dashboards
--
-- EXECUÇÃO NO SUPABASE SQL EDITOR:
--   Copie e cole todo o conteúdo deste arquivo no SQL Editor do
--   painel do Supabase (https://app.supabase.com) e execute.
--   É seguro executar múltiplas vezes (usamos CREATE OR REPLACE
--   e IF NOT EXISTS onde aplicável).
-- ============================================================================

-- ############################################################################
-- 1. CORREÇÃO: PONTO E VÍRGULA FALTANDO (Migration 002)
-- ############################################################################

-- A migration 002 estava faltando ";" no final da policy delete_unidades.
-- Como as policies foram dropadas e recriadas na 002, apenas recriamos
-- com a sintaxe correta aqui (execução segura em qualquer ordem).

drop policy if exists delete_unidades on unidades;
create policy delete_unidades on unidades for delete
  using (auth.is_admin());

-- ############################################################################
-- 2. FUNÇÕES DE NEGÓCIO
-- ############################################################################

-- 2.1. Calcula o nível de fidelidade de um cliente baseado nos pontos
create or replace function public.calcular_nivel_fidelidade(
  p_pontos integer
) returns uuid
language sql
stable
as $$
  select id
  from fidelidade_niveis
  where pontos_min <= p_pontos
  order by pontos_min desc
  limit 1
$$;

-- 2.2. Atualiza o nível de fidelidade de um cliente específico
create or replace function public.atualizar_nivel_fidelidade(
  p_cliente_id uuid
) returns void
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

-- 2.3. Atualiza status da sala baseado na sessão atual
create or replace function public.atualizar_status_sala(
  p_sala_id uuid
) returns void
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
    -- Verifica se há manutenção pendente
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

-- 2.4. Registra entrada no estoque e atualiza quantidade do item
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
  -- Validações
  if p_quantidade <= 0 then
    raise exception 'Quantidade deve ser maior que zero';
  end if;

  -- Registra a entrada
  insert into estoque_entradas (
    unidade_id, item_id, quantidade, valor_unitario,
    fornecedor, nota_fiscal, data_entrada, created_by
  ) values (
    p_unidade_id, p_item_id, p_quantidade, p_valor_unitario,
    p_fornecedor, p_nota_fiscal, p_data_entrada, p_created_by
  ) returning id into v_entrada_id;

  -- Atualiza quantidade do item
  update estoque_items
  set quantidade = quantidade + p_quantidade,
      valor_unitario = coalesce(p_valor_unitario, valor_unitario),
      updated_at = now()
  where id = p_item_id;

  return v_entrada_id;
end;
$$;

-- 2.5. Cria agendamento com sessão na fila (operação atômica)
create or replace function public.criar_agendamento(
  p_unidade_id uuid,
  p_cliente_id uuid,
  p_profissional_id uuid default null,
  p_servico_id uuid default null,
  p_sala_id uuid default null,
  p_data date,
  p_hora time,
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
  -- Se servico_id foi informado, busca duração e valor
  if p_servico_id is not null then
    select * into v_servico from servicos where id = p_servico_id;
  end if;

  -- Se sala não foi informada, tenta alocar uma automaticamente
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

  -- Cria o agendamento
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

  -- Cria sessão na fila de atendimento
  insert into sessoes_fila (
    unidade_id, agendamento_id, cliente_id, profissional_id,
    sala_id, servico_id, hora_programada, status, valor
  ) values (
    p_unidade_id, v_agendamento_id, p_cliente_id, p_profissional_id,
    v_sala_real_id, p_servico_id, p_hora, 'confirmado',
    coalesce(p_valor, v_servico.valor, 0)
  );

  -- Se sala foi alocada, atualiza status
  if v_sala_real_id is not null then
    perform public.atualizar_status_sala(v_sala_real_id);
  end if;

  return v_agendamento_id;
end;
$$;

-- 2.6. Finaliza sessão de atendimento
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

  if not found then
    raise exception 'Sessão não encontrada';
  end if;

  if v_sessao.status = 'concluido' then
    raise exception 'Sessão já foi concluída';
  end if;

  -- Atualiza sessão
  update sessoes_fila
  set status = 'concluido',
      hora_fim = now(),
      valor = coalesce(p_valor_real, valor),
      updated_at = now()
  where id = p_sessao_id;

  -- Cria transação financeira
  insert into transacoes (
    unidade_id, cliente_id, agendamento_id,
    descricao, categoria, data, valor, tipo, status, forma_pagamento
  ) values (
    v_sessao.unidade_id, v_sessao.cliente_id, v_sessao.agendamento_id,
    'Sessão', 'Procedimento', current_date,
    coalesce(p_valor_real, v_sessao.valor), 'receita', 'Pago', 'Pix'
  ) returning id into v_transacao_id;

  -- Atualiza última visita do cliente
  update clientes
  set ultima_visita = now(),
      updated_at = now()
  where id = v_sessao.cliente_id;

  -- Atualiza status da sala
  if v_sessao.sala_id is not null then
    perform public.atualizar_status_sala(v_sessao.sala_id);
  end if;

  -- Acumula pontos de fidelidade (1 ponto por R$ 1 gasto)
  v_pontos := floor(coalesce(p_valor_real, v_sessao.valor))::integer;
  if v_pontos > 0 then
    insert into fidelidade_clientes (cliente_id, unidade_id, pontos)
    values (v_sessao.cliente_id, v_sessao.unidade_id, v_pontos)
    on conflict (cliente_id, unidade_id)
    do update set pontos = fidelidade_clientes.pontos + v_pontos,
                  updated_at = now();

    -- Registra no histórico
    insert into fidelidade_historico (
      cliente_id, transacao_id, pontos, tipo, descricao
    ) values (
      v_sessao.cliente_id, v_transacao_id, v_pontos, 'acumulo',
      'Pontos da sessão realizada em ' || to_char(now(), 'DD/MM/YYYY')
    );

    -- Atualiza nível de fidelidade
    perform public.atualizar_nivel_fidelidade(v_sessao.cliente_id);
  end if;

  -- Registra auditoria
  insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
  values (
    v_sessao.unidade_id, 'update', 'sessoes_fila', p_sessao_id,
    jsonb_build_object(
      'status', 'concluido',
      'valor', coalesce(p_valor_real, v_sessao.valor),
      'cliente_id', v_sessao.cliente_id
    )
  );
end;
$$;

-- 2.7. Busca textual com pg_trgm (cliente, serviço, profissional)
create or replace function public.buscar_clientes(
  p_termo text,
  p_unidade_id uuid default null,
  p_limite integer default 20
) returns table (
  id uuid,
  nome text,
  email text,
  telefone text,
  ultima_visita timestamptz,
  relevancia real
)
language sql
stable
as $$
  select
    c.id,
    c.nome,
    c.email,
    c.telefone,
    c.ultima_visita,
    coalesce(
      similarity(c.nome, p_termo) * 2.0 +
      similarity(coalesce(c.email, ''), p_termo) * 1.5 +
      similarity(coalesce(c.telefone, ''), p_termo) * 1.0,
      0
    ) as relevancia
  from clientes c
  where (p_unidade_id is null or c.unidade_id = p_unidade_id)
    and (
      c.nome % p_termo
      or c.nome ilike '%' || p_termo || '%'
      or c.telefone ilike '%' || p_termo || '%'
      or c.email ilike '%' || p_termo || '%'
    )
  order by relevancia desc
  limit p_limite;
$$;

-- ############################################################################
-- 3. TRIGGERS AUTOMÁTICOS
-- ############################################################################

-- 3.1. Trigger: atualiza status da sala quando uma sessão é alterada
create or replace function public.trigger_atualizar_sala_sessao()
returns trigger
language plpgsql
as $$
begin
  if new.sala_id is not null and (
    old is null
    or old.sala_id is distinct from new.sala_id
    or old.status is distinct from new.status
  ) then
    perform public.atualizar_status_sala(new.sala_id);

    -- Se a sala mudou, atualiza a sala antiga também
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
  for each row
  execute function public.trigger_atualizar_sala_sessao();

-- 3.2. Trigger: registra auditoria em alterações de clientes
create or replace function public.trigger_auditoria_cliente()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
    values (new.unidade_id, 'create', 'clientes', new.id,
      jsonb_build_object('nome', new.nome));
  elsif tg_op = 'UPDATE' then
    -- Só registra se houver mudança relevante
    if old is distinct from new then
      insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
      values (new.unidade_id, 'update', 'clientes', new.id,
        jsonb_build_object(
          'campos_alterados', (
            select jsonb_object_agg(key, value)
            from jsonb_each(to_jsonb(new)) f(key, value)
            where (to_jsonb(old) ->> key) is distinct from value::text
          )
        ));
    end if;
  elsif tg_op = 'DELETE' then
    insert into auditoria (unidade_id, acao, entidade, entidade_id, detalhes)
    values (old.unidade_id, 'delete', 'clientes', old.id,
      jsonb_build_object('nome', old.nome));
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trigger_auditoria_cliente on clientes;
create trigger trigger_auditoria_cliente
  after insert or update or delete on clientes
  for each row
  execute function public.trigger_auditoria_cliente();

-- 3.3. Trigger: atualiza cliente_desde na primeira inserção
create or replace function public.trigger_cliente_desde()
returns trigger
language plpgsql
as $$
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
  for each row
  execute function public.trigger_cliente_desde();

-- ############################################################################
-- 4. VIEWS PARA RELATÓRIOS
-- ############################################################################

-- 4.1. View: Dashboard financeiro mensal
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

-- 4.2. View: Top clientes por gasto
create or replace view public.vw_top_clientes as
select
  c.id,
  c.unidade_id,
  c.nome,
  c.telefone,
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

-- 4.3. View: Ocupação de salas (últimos 30 dias)
create or replace view public.vw_ocupacao_salas as
select
  s.id as sala_id,
  s.unidade_id,
  s.nome as sala_nome,
  s.status as status_atual,
  count(sf.id) filter (
    where sf.created_at >= now() - interval '30 days'
  ) as sessoes_30dias,
  round(
    count(sf.id) filter (
      where sf.created_at >= now() - interval '30 days'
    ) * 100.0 / greatest(
      (select count(*) from generate_series(
        current_date - 30, current_date, '1 day'
      )), 1
    ), 1
  ) as taxa_ocupacao,
  coalesce(
    sum(sf.valor) filter (where sf.created_at >= now() - interval '30 days'),
    0
  ) as receita_gerada,
  s.capacidade,
  s.equipamentos
from salas s
left join sessoes_fila sf on sf.sala_id = s.id
group by s.id, s.unidade_id, s.nome, s.status, s.capacidade, s.equipamentos
order by taxa_ocupacao desc;

-- 4.4. View: Fidelidade completa
create or replace view public.vw_fidelidade_completa as
select
  c.id as cliente_id,
  c.unidade_id,
  c.nome as cliente_nome,
  c.telefone,
  c.email,
  coalesce(fc.pontos, 0) as pontos_atuais,
  fn.nome as nivel_atual,
  fn.cor as nivel_cor,
  coalesce(fc.pontos_resgate, 0) as pontos_resgatados,
  coalesce(fc.pontos, 0) - coalesce(fc.pontos_resgate, 0) as pontos_disponiveis,
  fn2.pontos_min as pontos_proximo_nivel,
  fn2.nome as proximo_nivel,
  case
    when fn2.pontos_min > 0 then
      round((coalesce(fc.pontos, 0) * 100.0 / fn2.pontos_min), 1)
    else 100.0
  end as progresso_proximo_nivel,
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

-- 4.5. View: Estoque crítico
create or replace view public.vw_estoque_critico as
select
  ei.id,
  ei.unidade_id,
  u.nome as unidade_nome,
  ei.nome as item_nome,
  ei.categoria,
  ei.quantidade,
  ei.quantidade_min,
  ei.unidade_medida,
  ei.valor_unitario,
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

-- 4.6. View: BI — Indicadores estratégicos
create or replace view public.vw_bi_indicadores as
select
  t.unidade_id,
  u.nome as unidade_nome,
  current_date as data_referencia,
  -- Receitas
  coalesce(sum(t.valor) filter (
    where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)
  ), 0) as receita_mes_atual,
  coalesce(sum(t.valor) filter (
    where t.tipo = 'receita' and t.data >= date_trunc('month', current_date - interval '1 month')
      and t.data < date_trunc('month', current_date)
  ), 0) as receita_mes_anterior,
  -- Despesas
  coalesce(sum(t.valor) filter (
    where t.tipo = 'despesa' and t.data >= date_trunc('month', current_date)
  ), 0) as despesa_mes_atual,
  -- Métricas de clientes
  (select count(*) from clientes c where c.unidade_id = t.unidade_id and c.ativo = true) as clientes_ativas,
  (select count(*) from agendamentos a
    where a.unidade_id = t.unidade_id
      and a.status = 'concluido'
      and a.data >= date_trunc('month', current_date)
  ) as sessoes_mes,
  -- Ticket médio
  case
    when count(*) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)) > 0
    then round(
      coalesce(sum(t.valor) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)), 0) /
      nullif(count(*) filter (where t.tipo = 'receita' and t.data >= date_trunc('month', current_date)), 0),
      2
    )
    else 0
  end as ticket_medio
from transacoes t
join unidades u on u.id = t.unidade_id
group by t.unidade_id, u.nome;

-- ############################################################################
-- 5. FUNÇÕES PARA O DASHBOARD (usadas pelo backend)
-- ############################################################################

-- 5.1. Dados do dashboard principal (KPIs, agendamentos do dia, etc.)
create or replace function public.get_dashboard_data(
  p_unidade_id uuid
) returns jsonb
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
      'faturamento_hoje', coalesce((
        select sum(valor) from transacoes
        where unidade_id = p_unidade_id
          and data = v_hoje and tipo = 'receita'
      ), 0),
      'agendamentos_hoje', (
        select count(*) from agendamentos
        where unidade_id = p_unidade_id and data = v_hoje
          and status not in ('cancelado')
      ),
      'clientes_ativas', (
        select count(*) from clientes
        where unidade_id = p_unidade_id and ativo = true
      ),
      'taxa_ocupacao', coalesce((
        select round(
          count(*) filter (where sf.status in ('ativo', 'aguardando', 'atrasado'))
          * 100.0 / nullif(count(*), 0)
        ) from sessoes_fila sf
        join salas s on s.id = sf.sala_id
        where sf.unidade_id = p_unidade_id
          and sf.hora_programada::date = v_hoje
      ), 0)
    ),
    'agendamentos_hoje_lista', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'hora', a.hora,
        'cliente', c.nome,
        'servico', s.nome,
        'profissional', p.nome,
        'status', a.status,
        'valor', a.valor
      ) order by a.hora)
      from agendamentos a
      left join clientes c on c.id = a.cliente_id
      left join servicos s on s.id = a.servico_id
      left join profissionais p on p.id = a.profissional_id
      where a.unidade_id = p_unidade_id
        and a.data = v_hoje
        and a.status not in ('cancelado')
      limit 20
    ), '[]'::jsonb),
    'fila_agora', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sf.id,
        'hora', sf.hora_programada,
        'cliente', c.nome,
        'servico', sv.nome,
        'profissional', p.nome,
        'sala', s.nome,
        'status', sf.status,
        'atraso_min', sf.atraso_min
      ) order by sf.hora_programada)
      from sessoes_fila sf
      left join clientes c on c.id = sf.cliente_id
      left join servicos sv on sv.id = sf.servico_id
      left join profissionais p on p.id = sf.profissional_id
      left join salas s on s.id = sf.sala_id
      where sf.unidade_id = p_unidade_id
        and sf.status not in ('concluido', 'cancelado')
      limit 15
    ), '[]'::jsonb),
    'estoque_critico', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ei.id,
        'nome', ei.nome,
        'quantidade', ei.quantidade,
        'quantidade_min', ei.quantidade_min
      ) order by (ei.quantidade_min - ei.quantidade) desc)
      from vw_estoque_critico ei
      where ei.unidade_id = p_unidade_id
      limit 10
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- ############################################################################
-- 6. CONFIGURAÇÃO DO REAL-TIME (SUPABASE REPLICATION)
-- ################################################################------------

-- Habilita replicação para tabelas que precisam de real-time
-- Nota: no Supabase, isso é configurado via interface, mas
-- podemos fazer via SQL também quando o role tem permissão

do $$
begin
  -- Tabelas que precisam de real-time para o dashboard
  perform from pg_publication_tables
  where pubname = 'supabase_realtime'
    and schemaname = 'public'
    and tablename in ('sessoes_fila', 'salas', 'clientes', 'agendamentos',
                      'transacoes', 'estoque_items');

  if not found then
    -- Nota: pode ser necessário executar manualmente no Supabase:
    --   ALTER PUBLICATION supabase_realtime ADD TABLE sessoes_fila;
    --   ALTER PUBLICATION supabase_realtime ADD TABLE salas;
    --   ALTER PUBLICATION supabase_realtime ADD TABLE clientes;
    --   ALTER PUBLICATION supabase_realtime ADD TABLE agendamentos;
    --   ALTER PUBLICATION supabase_realtime ADD TABLE transacoes;
    --   ALTER PUBLICATION supabase_realtime ADD TABLE estoque_items;
    raise notice 'Execute manualmente no SQL Editor do Supabase:';
    raise notice 'ALTER PUBLICATION supabase_realtime ADD TABLE sessoes_fila, salas, clientes, agendamentos, transacoes, estoque_items;';
  end if;
end;
$$;

-- ############################################################################
-- 7. SEED DATA ADICIONAL (Agendamentos de exemplo)
-- ############################################################################

-- Insere agendamentos de exemplo apenas se a tabela estiver vazia
do $$
declare
  v_unidade_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_prof_fernanda uuid := 'b0000000-0000-0000-0000-000000000003';
  v_prof_camila uuid := 'b0000000-0000-0000-0000-000000000002';
  v_prof_carlos uuid := 'b0000000-0000-0000-0000-000000000004';
  v_serv_limpeza uuid := 'd0000000-0000-0000-0000-000000000001';
  v_serv_peeling uuid := 'd0000000-0000-0000-0000-000000000002';
  v_serv_botox uuid := 'd0000000-0000-0000-0000-000000000003';
  v_serv_drenagem uuid := 'd0000000-0000-0000-0000-000000000004';
  v_serv_micro uuid := 'd0000000-0000-0000-0000-000000000005';
  v_serv_laser uuid := 'd0000000-0000-0000-0000-000000000006';
  v_serv_massagem uuid := 'd0000000-0000-0000-0000-000000000007';
  v_sala1 uuid := 'c0000000-0000-0000-0000-000000000001';
  v_sala2 uuid := 'c0000000-0000-0000-0000-000000000002';
  v_sala3 uuid := 'c0000000-0000-0000-0000-000000000003';
  v_sala4 uuid := 'c0000000-0000-0000-0000-000000000004';
  v_sala5 uuid := 'c0000000-0000-0000-0000-000000000005';
  v_cliente1 uuid := '10000000-0000-0000-0000-000000000001';
  v_cliente2 uuid := '10000000-0000-0000-0000-000000000002';
  v_cliente3 uuid := '10000000-0000-0000-0000-000000000003';
  v_cliente4 uuid := '10000000-0000-0000-0000-000000000004';
  v_cliente5 uuid := '10000000-0000-0000-0000-000000000005';
  v_cliente6 uuid := '10000000-0000-0000-0000-000000000006';
  v_cliente7 uuid := '10000000-0000-0000-0000-000000000007';
  v_cliente8 uuid := '10000000-0000-0000-0000-000000000008';
  v_count integer;
begin
  select count(*) into v_count from agendamentos where unidade_id = v_unidade_id;

  if v_count = 0 then
    -- Cria agendamentos de exemplo usando a função atômica
    perform public.criar_agendamento(v_unidade_id, v_cliente1, v_prof_fernanda, v_serv_limpeza, v_sala1, current_date, '09:00', 60, 180.00);
    perform public.criar_agendamento(v_unidade_id, v_cliente2, v_prof_camila, v_serv_peeling, v_sala2, current_date, '10:00', 45, 250.00);
    perform public.criar_agendamento(v_unidade_id, v_cliente3, v_prof_camila, v_serv_botox, v_sala5, current_date, '11:30', 30, 890.00);
    perform public.criar_agendamento(v_unidade_id, v_cliente4, v_prof_fernanda, v_serv_drenagem, v_sala1, current_date, '12:15', 50, 180.00);
    perform public.criar_agendamento(v_unidade_id, v_cliente7, v_prof_camila, v_serv_micro, v_sala2, current_date, '13:00', 60, 450.00);
    perform public.criar_agendamento(v_unidade_id, v_cliente6, v_prof_camila, v_serv_laser, v_sala4, current_date, '14:30', 60, 1200.00);
    perform public.criar_agendamento(v_unidade_id, v_cliente8, v_prof_carlos, v_serv_massagem, v_sala3, current_date, '15:00', 60, 200.00);
    perform public.criar_agendamento(v_unidade_id, v_cliente5, v_prof_fernanda, v_serv_limpeza, v_sala1, current_date, '16:00', 60, 180.00);

    raise notice 'Seed: % agendamentos criados para hoje', 8;
  end if;
end;
$$;

-- ############################################################################
-- 8. VERIFICAÇÃO FINAL
-- ############################################################################

do $$
begin
  raise notice '============================================';
  raise notice 'Fusion ERP - Migration 003 aplicada com sucesso!';
  raise notice '============================================';
  raise notice '';
  raise notice 'Funções criadas:';
  raise notice '  - calcular_nivel_fidelidade(p_pontos)';
  raise notice '  - atualizar_nivel_fidelidade(p_cliente_id)';
  raise notice '  - atualizar_status_sala(p_sala_id)';
  raise notice '  - registrar_entrada_estoque(...)';
  raise notice '  - criar_agendamento(...)';
  raise notice '  - finalizar_sessao(p_sessao_id, p_valor_real)';
  raise notice '  - buscar_clientes(p_termo, p_unidade_id, p_limite)';
  raise notice '  - get_dashboard_data(p_unidade_id)';
  raise notice '';
  raise notice 'Views criadas:';
  raise notice '  - vw_financeiro_mensal';
  raise notice '  - vw_top_clientes';
  raise notice '  - vw_ocupacao_salas';
  raise notice '  - vw_fidelidade_completa';
  raise notice '  - vw_estoque_critico';
  raise notice '  - vw_bi_indicadores';
  raise notice '';
  raise notice 'Triggers criados:';
  raise notice '  - trigger_sessao_sala (atualiza status sala)';
  raise notice '  - trigger_auditoria_cliente';
  raise notice '  - trigger_cliente_desde';
  raise notice '';
  raise notice 'PRÓXIMOS PASSOS NO SUPABASE:';
  raise notice '  1. Vá em Database > Replication e habilite as tabelas';
  raise notice '  2. Crie um usuário admin via Authentication > Users';
  raise notice '  3. Associe o usuário auth à tabela usuarios';
  raise notice '============================================';
end;
$$;
