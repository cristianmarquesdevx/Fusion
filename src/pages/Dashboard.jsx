/** @format */

import React, { useEffect } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import { Helpers } from '../utils/helpers';
import KPICard from '../components/dashboard/KPICard';
import TimelineItem from '../components/dashboard/TimelineItem';
import DashboardSkeleton from '../components/dashboard/Skeleton';

const stockItems = [
  { name: 'Toxina botulínica 100U', min: 5, qty: 2, critical: true },
  { name: 'Ácido hialurônico 1ml', min: 8, qty: 3, critical: true },
  { name: 'Máscara pós-peeling', min: 20, qty: 14, critical: false },
];

const waitlistItems = [
  { initials: 'LT', name: 'Larissa Teixeira', detail: 'Botox · prefere manhã' },
  { initials: 'RG', name: 'Rafael Gomes', detail: 'Limpeza de pele · qualquer horário' },
];

export default function Dashboard() {
  const metrics = useDashboardStore((s) => s.metrics);
  const appointmentsToday = useDashboardStore((s) => s.appointmentsToday);
  const revenueChart = useDashboardStore((s) => s.revenueChart);
  const loadDashboard = useDashboardStore((s) => s.loadDashboard);
  const loading = useDashboardStore((s) => s.loading);

  useEffect(() => {
    if (!appointmentsToday.length && !loading) {
      loadDashboard();
    }
  }, []);

  if (loading && !appointmentsToday.length) {
    return <DashboardSkeleton />;
  }

  const now = new Date();
  const dayName = Helpers.getDayName(now);
  const monthName = Helpers.getMonthName(now);
  const greeting = Helpers.getGreeting();

  const maxRevenue = Math.max(...revenueChart.map((d) => d.revenue), 1);

  return (
    <div className="animate-fade-in">
      {/* Page header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark">
            {dayName}, {now.getDate()} de {monthName.toLowerCase()}
          </span>
          <span className="w-1 h-1 rounded-full bg-border dark:bg-border-dark" />
          <span className="text-[11.5px] text-ink-faint dark:text-ink-dark-faint font-medium">
            {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          {greeting}, Ana. O Vitta Jardins está a 82% da agenda hoje.
        </h1>
        <p className="text-sm sm:text-[14.5px] text-ink-soft dark:text-ink-dark-soft mt-1.5 max-w-[560px]">
          12 clientes já passaram pela recepção, 6 estão a caminho e 2 aguardam
          vaga na fila de espera.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPICard
          label={metrics.revenue.label}
          value={metrics.revenue.value}
          format="currency"
          delta="12% vs. terça passada"
          deltaType="up"
        />
        <KPICard
          label={metrics.appointments.label}
          value={metrics.appointments.value}
          format="number"
          delta="3 encaixes confirmados"
          deltaType="up"
        />
        <KPICard
          label={metrics.occupancy.label}
          value={metrics.occupancy.value}
          format="percent"
          delta="Sala de Laser livre às 15h"
          deltaType="down"
        />
        <KPICard
          label="Ticket médio"
          value={238}
          format="currency"
          delta="8% acima da meta"
          deltaType="up"
        />
      </div>

      {/* Dashboard grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 lg:gap-5">
        {/* Timeline panel */}
        <div className="card">
          <div className="flex items-baseline justify-between px-5 pt-5 pb-3.5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
                Fila de atendimento — agora
              </h2>
              <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                Ordem cronológica das sessões de hoje, por sala e profissional
              </div>
            </div>
            <button className="text-xs font-semibold text-brand dark:text-brand-dark whitespace-nowrap hover:underline underline-offset-2 transition-all">
              Ver agenda completa &rarr;
            </button>
          </div>
          <div className="px-5 pb-5">
            {appointmentsToday.length > 0 ? (
              <div className="relative pl-0.5">
                {/* Timeline vertical line */}
                <div
                  className="absolute left-[44px] top-[6px] bottom-[6px] w-px bg-border dark:bg-border-dark"
                  style={{ pointerEvents: 'none' }}
                />
                {appointmentsToday.map((appt, index) => (
                  <TimelineItem
                    key={appt.id}
                    time={appt.time}
                    client={appt.client}
                    service={appt.service}
                    professional={appt.professional}
                    status={appt.status}
                    room={appt.room}
                    delay={12}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-ink-faint dark:text-ink-dark-faint text-sm">
                Nenhum agendamento para hoje.
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Revenue mini chart */}
          <div className="card p-5">
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-4">
              Faturamento — últimos meses
            </h2>
            <div className="flex items-end gap-2 h-[120px] pt-2">
              {revenueChart.map((d, i) => {
                const height = Math.max((d.revenue / maxRevenue) * 100, 4);
                const isLatest = i === revenueChart.length - 1;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2 h-full justify-end relative group/chart"
                  >
                    <span className="text-[10px] font-mono text-ink-faint dark:text-ink-dark-faint absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/chart:opacity-100 transition-opacity">
                      {Helpers.formatCurrency(d.revenue).replace('R$ ', '')}
                    </span>
                    <div
                      className={`w-full max-w-[30px] rounded-[6px_6px_3px_3px] transition-all duration-500 ease-out cursor-pointer
                        ${isLatest
                          ? 'bg-gold dark:bg-gold-dark'
                          : 'bg-brand-soft dark:bg-brand-dark-soft hover:bg-brand dark:hover:bg-brand-dark'
                        }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[11px] text-ink-soft dark:text-ink-dark-soft">
                      {d.month.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Critical stock */}
          <div className="card">
            <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
                  Estoque crítico
                </h2>
                <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                  {stockItems.filter((i) => i.critical).length} itens abaixo do mínimo
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
                  className="flex items-center justify-between gap-2.5 py-2.5 border-b border-border dark:border-border-dark last:border-b-0 group/item hover:bg-surface-2 dark:hover:bg-surface-dark-2 -mx-5 px-5 transition-colors rounded-sm"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink dark:text-ink-dark truncate">
                      {item.name}
                    </div>
                    <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">
                      Mínimo: {item.min} unidades
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-16 h-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.critical ? 'bg-rose dark:bg-rose-dark' : 'bg-gold dark:bg-gold-dark'
                        }`}
                        style={{ width: `${Math.min((item.qty / item.min) * 100, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        item.critical
                          ? 'text-rose dark:text-rose-dark'
                          : 'text-gold dark:text-gold-dark'
                      }`}
                    >
                      {item.qty} un.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Waitlist */}
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
                  className="flex items-center justify-between gap-2.5 py-2.5 border-b border-border dark:border-border-dark last:border-b-0 group/wait hover:bg-surface-2 dark:hover:bg-surface-dark-2 -mx-5 px-5 transition-colors rounded-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0 transition-transform group-hover/wait:scale-105"
                      style={{
                        backgroundColor: '#E7EDE6',
                        color: '#2F4A3E',
                      }}
                    >
                      {item.initials}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink dark:text-ink-dark truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5 truncate">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                  <button className="text-[11.5px] font-semibold py-1.5 px-2.5 rounded-full border border-border dark:border-border-dark text-ink-soft dark:text-ink-dark-soft hover:border-brand dark:hover:border-brand-dark hover:text-brand dark:hover:text-brand-dark hover:bg-brand-soft/10 dark:hover:bg-brand-dark-soft/10 transition-all flex-shrink-0 active:scale-95">
                    Encaixar
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
