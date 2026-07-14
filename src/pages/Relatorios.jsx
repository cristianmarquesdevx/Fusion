/** @format */

import React, { useState } from 'react';
import { Helpers } from '../utils';
import { useFinanceiroStore, useEstoqueStore } from '../store';

/* ─── KPI Card ─── */
function KPIBlock({ label, value, sub, color = 'text-ink dark:text-ink-dark' }) {
  return (
    <div className="card p-4">
      <div className="text-[10px] text-ink-soft dark:text-ink-dark-soft font-medium mb-1.5">{label}</div>
      <div className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint mt-0.5">{sub}</div>}
    </div>
  );
}

/* ─── Donut gauge (SVG) ─── */
function DonutGauge({ pct, label, value, color = '#4C7A5E' }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={72} height={72} viewBox="0 0 72 72" className="transform -rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-surface-2 dark:text-surface-dark-2" />
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="font-mono text-lg font-bold text-ink dark:text-ink-dark" style={{ marginTop: -8 }}>{value}</span>
      <span className="text-[9px] text-ink-faint dark:text-ink-dark-faint">{label}</span>
    </div>
  );
}

/* ─── Tabela ─── */
function SimpleTable({ headers, rows }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="stagger-enter">
          {rows.map((row, ri) => (
            <tr key={ri} className="transition-colors hover:bg-surface-2 dark:hover:bg-surface-dark-2">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-3 py-3 text-sm border-b border-border dark:border-border-dark ${
                  ci === 0 ? 'font-semibold text-ink dark:text-ink-dark' : 'text-ink-soft dark:text-ink-dark-soft'
                } ${typeof cell === 'string' && cell.startsWith('R$') ? 'font-mono font-semibold' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
                Nenhum dado disponível para o período selecionado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════════════════════════ */
export default function Relatorios() {
  const [activeTab, setActiveTab] = useState('financeiro');
  const transacoes = useFinanceiroStore((s) => s.transacoes);
  const items = useEstoqueStore((s) => s.items);

  // ─── Dados financeiros ───
  const receitas = transacoes.filter((t) => t.tipo === 'receita');
  const despesas = transacoes.filter((t) => t.tipo === 'despesa');
  const totalReceita = receitas.reduce((s, t) => s + t.valor, 0);
  const totalDespesa = despesas.reduce((s, t) => s + t.valor, 0);
  const lucro = totalReceita - totalDespesa;
  const margem = totalReceita > 0 ? ((lucro / totalReceita) * 100).toFixed(1) : '0.0';

  // ─── Categorias financeiras ───
  const catReceita = {};
  receitas.forEach((t) => { catReceita[t.categoria] = (catReceita[t.categoria] || 0) + t.valor; });
  const catDespesa = {};
  despesas.forEach((t) => { catDespesa[t.categoria] = (catDespesa[t.categoria] || 0) + t.valor; });

  // ─── Estoque ───
  const criticos = items.filter((i) => i.qtd < i.minimo * 0.5);
  const baixos = items.filter((i) => i.qtd >= i.minimo * 0.5 && i.qtd < i.minimo);

  const tabs = [
    { id: 'financeiro', label: 'Financeiro', icon: '💰' },
    { id: 'estoque', label: 'Estoque', icon: '📦' },
    { id: 'operacional', label: 'Operacional', icon: '📊' },
  ];

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Gestão
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Relatórios
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          Relatórios financeiros, operacionais e de estoque consolidados.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-0.5 rounded-sm bg-surface-2 dark:bg-surface-dark-2 border border-border dark:border-border-dark max-w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-sm transition-colors ${
              activeTab === tab.id
                ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-sm'
                : 'text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB: FINANCEIRO ═══════════ */}
      {activeTab === 'financeiro' && (
        <div className="space-y-5 animate-fade-in">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPIBlock label="Receita Total" value={Helpers.formatCurrency(totalReceita)} sub={`${receitas.length} transações`} color="text-sage dark:text-sage-dark" />
            <KPIBlock label="Despesas" value={Helpers.formatCurrency(totalDespesa)} sub={`${despesas.length} transações`} color="text-rose dark:text-rose-dark" />
            <KPIBlock label="Lucro Líquido" value={Helpers.formatCurrency(lucro)} sub={`Margem: ${margem}%`} color={lucro >= 0 ? 'text-sage dark:text-sage-dark' : 'text-rose dark:text-rose-dark'} />
            <KPIBlock label="Ticket Médio" value={Helpers.formatCurrency(totalReceita > 0 ? totalReceita / receitas.length : 0)} sub="por receita" color="text-gold dark:text-gold-dark" />
          </div>

          {/* Donuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Receita por categoria */}
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark mb-4">Receita por Categoria</h3>
              {Object.keys(catReceita).length > 0 ? (
                <div className="space-y-2.5">
                  {Object.entries(catReceita).sort((a, b) => b[1] - a[1]).map(([cat, val], i) => {
                    const pct = ((val / totalReceita) * 100).toFixed(1);
                    const maxVal = Math.max(...Object.values(catReceita), 1);
                    return (
                      <div key={cat} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-medium text-ink dark:text-ink-dark">{cat}</span>
                          <span className="font-mono font-semibold text-sage dark:text-sage-dark">{Helpers.formatCurrency(val)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                          <div className="h-full rounded-full bg-sage dark:bg-sage-dark transition-all duration-700" style={{ width: `${(val / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-[9px] text-ink-faint dark:text-ink-dark-faint">{pct}% da receita</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-ink-faint dark:text-ink-dark-faint">Nenhuma receita registrada.</div>
              )}
            </div>

            {/* Despesa por categoria */}
            <div className="card p-5">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark mb-4">Despesas por Categoria</h3>
              {Object.keys(catDespesa).length > 0 ? (
                <div className="space-y-2.5">
                  {Object.entries(catDespesa).sort((a, b) => b[1] - a[1]).map(([cat, val], i) => {
                    const pct = ((val / totalDespesa) * 100).toFixed(1);
                    const maxVal = Math.max(...Object.values(catDespesa), 1);
                    return (
                      <div key={cat} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-medium text-ink dark:text-ink-dark">{cat}</span>
                          <span className="font-mono font-semibold text-rose dark:text-rose-dark">{Helpers.formatCurrency(val)}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                          <div className="h-full rounded-full bg-rose dark:bg-rose-dark transition-all duration-700" style={{ width: `${(val / maxVal) * 100}%` }} />
                        </div>
                        <span className="text-[9px] text-ink-faint dark:text-ink-dark-faint">{pct}% das despesas</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-ink-faint dark:text-ink-dark-faint">Nenhuma despesa registrada.</div>
              )}
            </div>
          </div>

          {/* Tabela de transações */}
          <div className="card">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark">Todas as Transações</h3>
              <span className="text-[10px] text-ink-faint dark:text-ink-dark-faint">{transacoes.length} registros</span>
            </div>
            <div className="px-5 pb-5">
              <SimpleTable
                headers={['Descrição', 'Categoria', 'Tipo', 'Valor', 'Data', 'Status']}
                rows=              {[...transacoes].sort((a, b) => {
                  const [dA, mA] = a.data.split('/').map(Number);
                  const [dB, mB] = b.data.split('/').map(Number);
                  return (mB * 100 + dB) - (mA * 100 + dA);
                }).map((t) => [
                  t.descricao,
                  t.categoria,
                  t.tipo === 'receita'
                    ? <span className="text-sage dark:text-sage-dark font-semibold">Receita</span>
                    : <span className="text-rose dark:text-rose-dark font-semibold">Despesa</span>,
                  <span className={t.tipo === 'receita' ? 'text-sage dark:text-sage-dark' : 'text-rose dark:text-rose-dark'}>
                    {Helpers.formatCurrency(t.valor)}
                  </span>,
                  t.data,
                  t.status,
                ])}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: ESTOQUE ═══════════ */}
      {activeTab === 'estoque' && (
        <div className="space-y-5 animate-fade-in">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPIBlock label="Total de Itens" value={items.length} sub="cadastrados" />
            <KPIBlock label="Estoque OK" value={items.filter((i) => i.qtd >= i.minimo).length} color="text-sage dark:text-sage-dark" />
            <KPIBlock label="Estoque Baixo" value={baixos.length} color={baixos.length > 0 ? 'text-gold dark:text-gold-dark' : 'text-ink-faint'} />
            <KPIBlock label="Estoque Crítico" value={criticos.length} color={criticos.length > 0 ? 'text-rose dark:text-rose-dark' : 'text-ink-faint'} />
          </div>

          {/* Itens críticos */}
          {criticos.length > 0 && (
            <div className="card p-5 border-l-4 border-l-rose dark:border-l-rose-dark">
              <h3 className="font-display text-sm font-semibold text-rose dark:text-rose-dark mb-3 flex items-center gap-2">
                <span>⚠️ Itens com Estoque Crítico</span>
                <span className="text-[10px] font-mono bg-rose-soft/20 dark:bg-rose-dark-soft/20 px-2 py-0.5 rounded-full">{criticos.length}</span>
              </h3>
              <SimpleTable
                headers={['Item', 'Categoria', 'Atual', 'Mínimo', 'Situação']}
                rows={criticos.map((i) => [
                  i.nome,
                  i.categoria,
                  <span className="text-rose dark:text-rose-dark font-bold">{i.qtd} {i.unidade}</span>,
                  `${i.minimo} ${i.unidade}`,
                  <span className="tag text-[10px] bg-rose-soft/20 text-rose">Crítico</span>,
                ])}
              />
            </div>
          )}

          {/* Itens baixos */}
          {baixos.length > 0 && (
            <div className="card p-5 border-l-4 border-l-gold dark:border-l-gold-dark">
              <h3 className="font-display text-sm font-semibold text-gold dark:text-gold-dark mb-3 flex items-center gap-2">
                <span>⚡ Itens com Estoque Baixo</span>
                <span className="text-[10px] font-mono bg-gold-soft/20 dark:bg-gold-dark-soft/20 px-2 py-0.5 rounded-full">{baixos.length}</span>
              </h3>
              <SimpleTable
                headers={['Item', 'Categoria', 'Atual', 'Mínimo', 'Situação']}
                rows={baixos.map((i) => [
                  i.nome,
                  i.categoria,
                  <span className="text-gold dark:text-gold-dark font-bold">{i.qtd} {i.unidade}</span>,
                  `${i.minimo} ${i.unidade}`,
                  <span className="tag text-[10px] bg-gold-soft/20 text-gold">Baixo</span>,
                ])}
              />
            </div>
          )}

          {/* Todos os itens */}
          <div className="card">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
              <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark">Inventário Completo</h3>
              <span className="text-[10px] text-ink-faint dark:text-ink-dark-faint">{items.length} itens</span>
            </div>
            <div className="px-5 pb-5">
              <SimpleTable
                headers={['Item', 'Categoria', 'Qtd', 'Mínimo', 'Valor Unit.', 'Valor Total']}
                rows={items.map((i) => [
                  i.nome,
                  i.categoria,
                  <span className={`font-bold ${i.qtd < i.minimo * 0.5 ? 'text-rose' : i.qtd < i.minimo ? 'text-gold' : 'text-ink dark:text-ink-dark'}`}>
                    {i.qtd} {i.unidade}
                  </span>,
                  `${i.minimo} ${i.unidade}`,
                  Helpers.formatCurrency(i.valorUnit || 0),
                  Helpers.formatCurrency((i.valorUnit || 0) * i.qtd),
                ])}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: OPERACIONAL ═══════════ */}
      {activeTab === 'operacional' && (
        <div className="space-y-5 animate-fade-in">
          {/* Gauge summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <DonutGauge pct={totalReceita > 0 ? ((lucro / totalReceita) * 100) : 0} label="Margem Líquida" value={`${margem}%`} color="#4C7A5E" />
            <DonutGauge pct={items.length > 0 ? ((items.filter((i) => i.qtd >= i.minimo).length / items.length) * 100) : 0} label="Estoque OK" value={`${items.length > 0 ? Math.round((items.filter((i) => i.qtd >= i.minimo).length / items.length) * 100) : 0}%`} color="#9C7A3E" />
            <DonutGauge pct={totalReceita > 0 ? ((totalDespesa / totalReceita) * 100) : 0} label="Taxa de Despesas" value={`${totalReceita > 0 ? ((totalDespesa / totalReceita) * 100).toFixed(0) : 0}%`} color="#B14E3D" />
            <DonutGauge pct={transacoes.length > 0 ? ((receitas.length / transacoes.length) * 100) : 0} label="Receitas vs Total" value={`${transacoes.length > 0 ? Math.round((receitas.length / transacoes.length) * 100) : 0}%`} color="#6C5CE7" />
          </div>

          {/* Indicadores */}
          <div className="card p-5">
            <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark mb-4">Indicadores Operacionais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Receita / Despesa', value: `R$ ${(totalReceita / Math.max(totalDespesa, 1)).toFixed(2)}`, sub: `${Helpers.formatCurrency(totalReceita)} / ${Helpers.formatCurrency(totalDespesa)}`, hint: 'Quanto maior, melhor' },
                { label: 'Custo por Transação', value: Helpers.formatCurrency(transacoes.length > 0 ? totalDespesa / transacoes.length : 0), sub: `${transacoes.length} transações`, hint: 'Custo operacional médio' },
                { label: 'Eficiência Estoque', value: `${items.length > 0 ? Math.round((items.filter((i) => i.qtd >= i.minimo).length / items.length) * 100) : 0}%`, sub: `${criticos.length + baixos.length} itens para repor`, hint: 'Itens dentro do nível ideal' },
                { label: 'Ticket por Categoria', value: `${Object.keys(catReceita).length} categorias`, sub: `Maior: ${Object.entries(catReceita).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'}`, hint: 'Distribuição de receita' },
                { label: 'Valor Estoque Total', value: Helpers.formatCurrency(items.reduce((s, i) => s + (i.valorUnit || 0) * i.qtd, 0)), sub: `${items.length} itens`, hint: 'Valor total em inventário' },
                { label: 'Proporção Receita', value: `${((receitas.length / Math.max(despesas.length, 1))).toFixed(1)}x`, sub: `${receitas.length} receitas · ${despesas.length} despesas`, hint: 'Quantas receitas para cada despesa' },
              ].map((ind, i) => (
                <div key={i} className="p-3.5 rounded-lg bg-surface-2/30 dark:bg-surface-dark-2/30 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint mb-1">{ind.label}</div>
                  <div className="font-mono text-lg font-bold text-ink dark:text-ink-dark tabular-nums">{ind.value}</div>
                  <div className="text-[10px] text-ink-soft dark:text-ink-dark-soft mt-0.5">{ind.sub}</div>
                  <div className="text-[8px] text-ink-faint dark:text-ink-dark-faint mt-0.5 italic">{ind.hint}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo geral */}
          <div className="card p-5">
            <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark mb-3">Resumo Geral</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Receita Total', value: Helpers.formatCurrency(totalReceita) },
                { label: 'Despesas Totais', value: Helpers.formatCurrency(totalDespesa) },
                { label: 'Lucro', value: Helpers.formatCurrency(lucro) },
                { label: 'Itens em Estoque', value: String(items.length) },
              ].map((r, i) => (
                <div key={i} className="p-4 rounded-lg bg-surface-2/50 dark:bg-surface-dark-2/50 text-center">
                  <div className="text-[9px] text-ink-faint dark:text-ink-dark-faint uppercase tracking-wider">{r.label}</div>
                  <div className="font-mono text-base font-bold text-ink dark:text-ink-dark mt-1">{r.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
