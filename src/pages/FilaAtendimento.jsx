/** @format */

import React, { useEffect, useState } from 'react';
import { useFilaStore } from '../store';
import { TimelineItem } from '../components/dashboard';

export default function FilaAtendimento() {
  const { activeFilter, setFilter, filterOptions, getFilteredSessions, getSummary } = useFilaStore();
  const [, forceUpdate] = useState(0);

  // Auto-refresh every 30s to re-evaluate filters
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate((n) => n + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredSessions = getFilteredSessions();
  const summary = getSummary();

  return (
    <div className="animate-fade-in">
      {/* Page head */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Atendimento
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-1.5">
          Fila de Atendimento
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft max-w-[600px]">
          Acompanhamento em tempo real de todos os atendimentos de hoje. Status, sala
          e profissional atualizados automaticamente.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {filterOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`px-3.5 py-2 rounded-sm text-sm font-medium transition-all duration-150 ${
              activeFilter === opt.id
                ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink shadow-sm'
                : 'bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-ink-soft dark:text-ink-dark-soft hover:bg-surface-2 dark:hover:bg-surface-dark-2'
            }`}
          >
            {opt.label}
          </button>
        ))}

        <div className="flex-1 min-w-0" />

        {/* Ver timeline completa */}
        <button
          onClick={() => setFilter('all')}
          className="text-xs font-semibold text-brand dark:text-brand-dark whitespace-nowrap hover:underline underline-offset-2"
        >
          Ver timeline completa &rarr;
        </button>
      </div>

      {/* Timeline card */}
      <div className="card">
        <div className="flex items-baseline justify-between px-5 pt-5 pb-3.5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
              Sessões de hoje
            </h2>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
              Ordenado por horário — {summary.total} sessões programadas
            </div>
          </div>
          <span
            className={`text-xs font-semibold ${
              summary.emAndamento > 0
                ? 'text-sage dark:text-sage-dark'
                : 'text-ink-faint dark:text-ink-dark-faint'
            }`}
          >
            {summary.concluidas} concluídas · {summary.emAndamento} em andamento
          </span>
        </div>

        <div className="px-5 pb-5">
          {filteredSessions.length > 0 ? (
            <div className="relative pl-0.5">
              {/* Timeline vertical line */}
              <div
                className="absolute left-[44px] top-[6px] bottom-[6px] w-px bg-border dark:bg-border-dark"
                style={{ pointerEvents: 'none' }}
              />
              {filteredSessions.map((session) => (
                <TimelineItem
                  key={session.id}
                  time={session.hora}
                  client={session.cliente}
                  service={session.servico}
                  professional={session.profissional}
                  status={session.status}
                  room={session.sala}
                  delay={session.atrasoMin}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
              <div className="flex justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4l3 3" />
                </svg>
              </div>
              Nenhuma sessão encontrada para este filtro.
            </div>
          )}
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mt-4 text-xs text-ink-faint dark:text-ink-dark-faint">
        <span className="relative flex w-2 h-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sage dark:bg-sage-dark opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sage dark:bg-sage-dark" />
        </span>
        Atualizado automaticamente a cada 30 segundos
      </div>
    </div>
  );
}
