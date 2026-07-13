/** @format */

import React, { useEffect, useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Helpers } from '../utils/helpers';
import KPICard from '../components/dashboard/KPICard';
import TimelineItem from '../components/dashboard/TimelineItem';
import RevenueAreaChart from '../components/dashboard/RevenueAreaChart';
import ServicesChart from '../components/dashboard/ServicesChart';
import ProfessionalsBarChart from '../components/dashboard/ProfessionalsBarChart';
import KPIExpandedModal from '../components/dashboard/KPIExpandedModal';
import DashboardSkeleton from '../components/dashboard/Skeleton';

const stockItems = [
  { name: 'Toxina botulínica 100U', min: 5, qty: 2, critical: true, category: 'Injetáveis' },
  { name: 'Ácido hialurônico 1ml', min: 8, qty: 3, critical: true, category: 'Injetáveis' },
  { name: 'Máscara pós-peeling', min: 20, qty: 14, critical: false, category: 'Cosméticos' },
  { name: 'Lâminas de bisturi', min: 15, qty: 9, critical: false, category: 'Instrumentais' },
];

const waitlistItems = [
  { initials: 'LT', name: 'Larissa Teixeira', detail: 'Botox · prefere manhã', priority: 'alta' },
  { initials: 'RG', name: 'Rafael Gomes', detail: 'Limpeza de pele · qualquer horário', priority: 'media' },
  { initials: 'AN', name: 'Ana Paula Souza', detail: 'Laser CO2 · após 14h', priority: 'baixa' },
];

export default function Dashboard() {
  const {
    kpiDetails,
    appointmentsToday,
    revenueChart,
    servicesChart,
    professionalsChart,
    financialSummary,
    growth,
    loadDashboard,
    loading,
  } = useDashboardStore();

  const [loaded, setLoaded] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null); // KPI key when modal is open

  useEffect(() => {
    if (!loaded && !loading) {
      loadDashboard().then(() => setLoaded(true));
    }
  }, [loaded, loading, loadDashboard]);

  if (loading && !loaded) {
    return <DashboardSkeleton />;
  }

  const now = new Date();
  const dayName = Helpers.getDayName(now);
  const monthName = Helpers.getMonthName(now);
  const greeting = Helpers.getGreeting();

  return (
    <div className="animate-fade-in pb-6">
      {/* ═══ HEADER PREMIUM ═══ */}
      <div className="mb-7">
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1.5 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark animate-fade-in-up">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {dayName}, {now.getDate()} de {monthName.toLowerCase()}
          </span>
          <span className="w-1 h-1 rounded-full bg-border dark:bg-border-dark" />
          <span className="text-[11.5px] text-ink-faint dark:text-ink-dark-faint font-mono font-medium">
            {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
          </span>
          <span className="w-1 h-1 rounded-full bg-border dark:bg-border-dark" />
          <span className="text-[11.5px] text-sage dark:text-sage-dark font-semibold animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {kpiDetails.occupancy?.value || 78}% de ocupação
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-ink dark:text-ink-dark leading-tight">
          {greeting}, Ana. <span className="text-gold dark:text-gold-dark">Vitta Jardins</span> está pulsando.
        </h1>
        <p className="text-sm sm:text-[15px] text-ink-soft dark:text-ink-dark-soft mt-2 max-w-[600px] leading-relaxed">
          <span className="font-semibold text-ink dark:text-ink-dark">{appointmentsToday.filter(a => a.status === 'concluido').length} clientes</span> já passaram pela recepção hoje ·{' '}
          <span className="font-semibold text-ink dark:text-ink-dark">{appointmentsToday.filter(a => a.status === 'ativo' || a.status === 'aguardando').length} em andamento</span> ·{' '}
          <span className="font-semibold text-ink dark:text-ink-dark">{growth.clientesNovos} novas clientes</span> este mês
        </p>
      </div>

      {/* ═══ KPI CARDS CLICÁVEIS ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {(['revenue', 'appointments', 'clients', 'occupancy']).map((key, idx) => {
          const kpi = kpiDetails[key];
          if (!kpi) return null;
          return (
            <div
              key={key}
              className="relative animate-fade-in-up"
              style={{ animationDelay: `${idx * 0.08}s` }}
            >
              <KPICard
                kpiKey={key}
                label={kpi.label}
                value={kpi.value}
                format={key === 'occupancy' ? 'percent' : key === 'revenue' ? 'currency' : 'number'}
                delta={kpi.delta}
                deltaType={kpi.deltaType}
                sparkline={kpi.sparkline}
                onClick={() => setSelectedKPI(key)}
                isExpanded={selectedKPI === key}
              />
            </div>
          );
        })}
      </div>

      {/* ═══ DASHBOARD GRID PRINCIPAL ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4 lg:gap-5">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex flex-col gap-4">

          {/* ── TIMELINE ── */}
          <div className="card overflow-hidden">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark flex items-center gap-2">
                  Fila de atendimento
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark">
                    {appointmentsToday.length} hoje
                  </span>
                </h2>
                <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                  Ordem cronológica por sala e profissional
                </div>
              </div>
              <button className="text-xs font-semibold text-brand dark:text-brand-dark whitespace-nowrap hover:underline underline-offset-2 transition-all group flex items-center gap-1">
                Ver agenda
                <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="px-5 pb-5">
              {appointmentsToday.length > 0 ? (
                <div className="relative pl-0.5 stagger-enter">
                  <div className="absolute left-[44px] top-[6px] bottom-[6px] w-px bg-gradient-to-b from-gold/30 via-border dark:via-border-dark to-transparent" style={{ pointerEvents: 'none' }} />
                  {appointmentsToday.slice(0, 7).map((appt, index) => (
                    <div key={appt.id}>
                      <TimelineItem
                        time={appt.time}
                        client={appt.client}
                        service={appt.service}
                        professional={appt.professional}
                        status={appt.status}
                        room={appt.room}
                        delay={12}
                        index={index}
                      />
                    </div>
                  ))}
                  {appointmentsToday.length > 7 && (
                    <button className="w-full text-center text-xs font-semibold text-ink-faint dark:text-ink-dark-faint hover:text-brand dark:hover:text-brand-dark py-2 transition-colors">
                      + {appointmentsToday.length - 7} agendamentos
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-ink-faint dark:text-ink-dark-faint text-sm">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center">
                    <svg className="w-6 h-6 text-ink-faint dark:text-ink-dark-faint" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                  </div>
                  Nenhum agendamento para hoje.
                </div>
              )}
            </div>
          </div>

          {/* ── PROFISSIONAIS ── */}
          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
                  Performance dos profissionais
                </h2>
                <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                  Receita gerada este mês
                </div>
              </div>
            </div>
            <ProfessionalsBarChart data={professionalsChart} />
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div className="flex flex-col gap-4">

          {/* ── FATURAMENTO CHART ── */}
          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark flex items-center gap-2">
                  Faturamento
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark">
                    {new Date().getFullYear()}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-gold dark:bg-gold-dark" />
                  <span className="text-ink-faint dark:text-ink-dark-faint">Receita</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose dark:bg-rose-dark" />
                  <span className="text-ink-faint dark:text-ink-dark-faint">Despesas</span>
                </div>
              </div>
            </div>
            <RevenueAreaChart data={revenueChart} />
          </div>

          {/* ── SERVIÇOS ── */}
          <div className="card p-5">
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
                  Distribuição de serviços
                </h2>
                <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                  Mais realizados no mês
                </div>
              </div>
            </div>
            <ServicesChart data={servicesChart} />
          </div>

          {/* ── ESTOQUE CRÍTICO ── */}
          <div className="card">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark flex items-center gap-2">
                  Estoque crítico
                  {stockItems.filter((i) => i.critical).length > 0 && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-soft dark:bg-rose-dark-soft text-rose dark:text-rose-dark animate-pulse">
                      {stockItems.filter((i) => i.critical).length} urgente
                    </span>
                  )}
                </h2>
                <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                  Itens abaixo do estoque mínimo de segurança
                </div>
              </div>
              <button className="text-xs font-semibold text-brand dark:text-brand-dark whitespace-nowrap hover:underline underline-offset-2 transition-all">
                Repor tudo
              </button>
            </div>
            <div className="px-5 pb-5">
              {stockItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2.5 py-2.5 border-b border-border dark:border-border-dark last:border-b-0 group/item hover:bg-surface-2 dark:hover:bg-surface-dark-2 -mx-5 px-5 transition-all duration-200 rounded-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.critical ? 'bg-rose dark:bg-rose-dark animate-pulse' : 'bg-gold dark:bg-gold-dark'}`} />
                      <div className="text-sm font-semibold text-ink dark:text-ink-dark truncate">
                        {item.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5 ml-3.5">
                      <span className="tag tag-room text-[9px]">{item.category}</span>
                      <span>Mín: {item.min} un.</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <div className="w-16 h-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${item.critical ? 'bg-rose dark:bg-rose-dark' : 'bg-gold dark:bg-gold-dark'
                          }`}
                        style={{ width: `${Math.min((item.qty / item.min) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={`font-mono text-sm font-semibold tabular-nums ${item.critical ? 'text-rose dark:text-rose-dark' : 'text-gold dark:text-gold-dark'
                      }`}>
                      {item.qty}/{item.min}
                    </span>
                    <button className="text-[11px] font-semibold py-1 px-2 rounded-md border border-border dark:border-border-dark text-ink-faint dark:text-ink-dark-faint hover:border-brand dark:hover:border-brand-dark hover:text-brand dark:hover:text-brand-dark transition-all opacity-0 group-hover/item:opacity-100 active:scale-95">
                      Repor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── LISTA DE ESPERA ── */}
          <div className="card">
            <div className="px-5 pt-5 pb-3">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
                Lista de espera
              </h2>
              <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                Encaixe automático quando houver vaga
              </div>
            </div>
            <div className="px-5 pb-5">
              {waitlistItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2.5 py-2.5 border-b border-border dark:border-border-dark last:border-b-0 group/wait hover:bg-surface-2 dark:hover:bg-surface-dark-2 -mx-5 px-5 transition-all duration-200 rounded-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 transition-transform duration-200 group-hover/wait:scale-110"
                      style={{
                        backgroundColor: Helpers.getAvatarColor(item.name),
                        color: '#fff',
                      }}
                    >
                      {item.initials}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink dark:text-ink-dark truncate">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">
                        <span>{item.detail}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.priority === 'alta' ? 'bg-rose dark:bg-rose-dark animate-pulse' :
                            item.priority === 'media' ? 'bg-gold dark:bg-gold-dark' : 'bg-sage dark:bg-sage-dark'
                          }`} />
                      </div>
                    </div>
                  </div>
                  <button className="text-[11.5px] font-semibold py-1.5 px-3 rounded-full border border-border dark:border-border-dark text-ink-soft dark:text-ink-dark-soft hover:border-brand dark:hover:border-brand-dark hover:text-brand dark:hover:text-brand-dark hover:bg-brand-soft/10 dark:hover:bg-brand-dark-soft/10 transition-all duration-200 flex-shrink-0 active:scale-95">
                    Encaixar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FOOTER — RESUMO FINANCEIRO ═══ */}
      <div className="mt-6 card p-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
            Resumo financeiro — Julho
          </h2>
          <button className="text-xs font-semibold text-brand dark:text-brand-dark hover:underline underline-offset-2 transition-all">
            Ver detalhes →
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: 'Receita', value: financialSummary?.receita || 86420, color: 'text-sage dark:text-sage-dark', format: 'currency' },
            { label: 'Despesas', value: financialSummary?.despesa || 31150, color: 'text-rose dark:text-rose-dark', format: 'currency' },
            { label: 'Lucro', value: financialSummary?.lucro || 55270, color: 'text-gold dark:text-gold-dark', format: 'currency' },
            { label: 'Comissões', value: financialSummary?.comissoes || 8940, color: 'text-ink dark:text-ink-dark', format: 'currency' },
            { label: 'Inadimplência', value: financialSummary?.inadimplencia || 3280, color: 'text-rose-soft dark:text-rose-dark-soft', format: 'currency' },
          ].map((item, i) => (
            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint font-medium mb-1">{item.label}</div>
              <div className={`font-mono text-lg sm:text-xl font-semibold tabular-nums ${item.color}`}>
                {item.format === 'currency' ? Helpers.formatCurrency(item.value) : item.value}
              </div>
              <div className="w-full h-1 rounded-full bg-surface-2 dark:bg-surface-dark-2 mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${item.color.replace('text-', 'bg-')}`}
                  style={{
                    width: `${Math.min((item.value / (financialSummary?.receita || 86420)) * 100, 100)}%`,
                    opacity: 0.3,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* ═══ MODAL DE DETALHES DO KPI ═══ */}
      {selectedKPI && kpiDetails[selectedKPI] && (
        <KPIExpandedModal
          kpiKey={selectedKPI}
          data={kpiDetails[selectedKPI]}
          onClose={() => setSelectedKPI(null)}
        />
      )}
    </div>
  );
}
