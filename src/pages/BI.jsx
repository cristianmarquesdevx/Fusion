/** @format */

import React from 'react';
import { useBIStore } from '../store';
import { Helpers } from '../utils';

/* ─── Barra de serviço (hbars) ─── */
function ServiceBar({ name, pct, value, cor, idx }) {
  return (
    <div className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
      <span className="text-xs font-medium text-ink dark:text-ink-dark min-w-[100px] truncate shrink-0">{name}</span>
      <div className="flex-1 h-3 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, backgroundColor: cor }}
        />
      </div>
      <span className="font-mono text-xs font-bold text-ink dark:text-ink-dark tabular-nums min-w-[36px] text-right shrink-0">{value}</span>
    </div>
  );
}

/* ─── Barra de receita mensal ─── */
function RevenueBar({ data, maxRevenue }) {
  return (
    <div className="flex items-end gap-1.5 sm:gap-2 h-[140px] pt-5">
      {data.map((d, i) => {
        const pct = maxRevenue > 0 ? (d.revenue / maxRevenue) * 100 : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
            <span className="text-[9px] font-mono text-ink-faint dark:text-ink-dark-faint opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
              {Helpers.formatCompactCurrency(d.revenue)}
            </span>
            <div
              className={`w-full rounded-[4px_4px_2px_2px] transition-all duration-500 ease-out ${
                d.today ? 'bg-gold dark:bg-gold-dark' : 'bg-brand-soft dark:bg-brand-dark-soft hover:bg-brand dark:hover:bg-brand-dark'
              }`}
              style={{ height: `${pct}%`, maxWidth: 40 }}
            />
            <span className="text-[9px] text-ink-faint dark:text-ink-dark-faint">{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Cartão profissional ─── */
function ProfessionalCard({ prof, idx }) {
  return (
    <div className="card p-3.5 animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
      <div className="flex items-center gap-2">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: prof.cor }}
        >
          {Helpers.getInitials(prof.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-ink dark:text-ink-dark truncate">{prof.name}</div>
          <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint">{prof.atendimentos} atendimentos</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs font-bold text-ink dark:text-ink-dark">{Helpers.formatCompactCurrency(prof.receita)}</div>
        </div>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 mt-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(prof.receita / 28450) * 100}%`, backgroundColor: prof.cor }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/*  PÁGINA PRINCIPAL                    */
/* ════════════════════════════════════ */

export default function BI() {
  const { period, metrics, revenueData, servicesData, professionalsData, growthData, setPeriod, getPeriodLabel } = useBIStore();

  const maxRevenue = Math.max(...revenueData.map((d) => d.revenue), 1);

  const periods = [
    { key: 'week', label: 'Esta semana' },
    { key: 'month', label: 'Este mês' },
    { key: 'quarter', label: 'Este trim.' },
    { key: 'year', label: 'Este ano' },
  ];

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Business Intelligence
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          {getPeriodLabel()} · Receita total: <strong className="text-ink dark:text-ink-dark">{Helpers.formatCurrency(metrics.receita)}</strong>
        </p>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-2 mb-6">
        {periods.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
              period === p.key
                ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink'
                : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Receita', value: metrics.receita, format: 'currency', color: 'text-gold dark:text-gold-dark' },
          { label: 'Ticket Médio', value: metrics.ticketMedio, format: 'currency', color: 'text-sage dark:text-sage-dark' },
          { label: 'Clientes Ativas', value: metrics.clientesAtivas, format: 'number', color: 'text-blue-500' },
          { label: 'Sessões Realizadas', value: metrics.sessoes, format: 'number', color: 'text-amber-500' },
        ].map((kpi, i) => (
          <div key={i} className="card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-2">{kpi.label}</div>
            <div className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${kpi.color}`}>
              {kpi.format === 'currency' ? Helpers.formatCurrency(kpi.value) : kpi.value.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 lg:gap-5">
        {/* ── COLUNA ESQUERDA ── */}
        <div className="space-y-4">
          {/* Revenue chart */}
          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">Faturamento mensal</h2>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-2 h-2 rounded-full bg-brand-soft dark:bg-brand-dark-soft" />
                <span className="text-ink-faint dark:text-ink-dark-faint">Receita</span>
                <span className="w-2 h-2 rounded-full bg-gold dark:bg-gold-dark" />
                <span className="text-ink-faint dark:text-ink-dark-faint">Mês atual</span>
              </div>
            </div>
            <RevenueBar data={revenueData} maxRevenue={maxRevenue} />
          </div>

          {/* Growth chart */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-4">Crescimento</h2>
            <div className="space-y-3">
              {growthData.map((d, i) => {
                const maxReceita = Math.max(...growthData.map((g) => g.receita), 1);
                const maxClientes = Math.max(...growthData.map((g) => g.clientes), 1);
                return (
                  <div key={i} className="flex items-center gap-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                    <span className="text-[11px] font-semibold text-ink dark:text-ink-dark w-8 shrink-0">{d.mes}</span>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                          <div className="h-full rounded-full bg-brand-soft dark:bg-brand-dark-soft" style={{ width: `${(d.receita / maxReceita) * 100}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-ink-faint dark:text-ink-dark-faint tabular-nums">{Helpers.formatCompactCurrency(d.receita)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                          <div className="h-full rounded-full bg-sage dark:bg-sage-dark" style={{ width: `${(d.clientes / maxClientes) * 100}%`, opacity: 0.5 }} />
                        </div>
                        <span className="font-mono text-[9px] text-ink-faint dark:text-ink-dark-faint tabular-nums">{d.clientes} clientes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div className="space-y-4">
          {/* Services distribution */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-4">Distribuição de serviços</h2>
            <div className="space-y-3">
              {servicesData.map((s, i) => (
                <ServiceBar key={i} name={s.name} pct={s.pct} value={s.value} cor={s.cor} idx={i} />
              ))}
            </div>
          </div>

          {/* Professional performance */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-3">Performance por profissional</h2>
            <div className="space-y-2.5">
              {professionalsData.map((p, i) => (
                <ProfessionalCard key={i} prof={p} idx={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
