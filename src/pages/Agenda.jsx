/** @format */

import React, { useState } from 'react';
import { useAgendaStore } from '../store/useAgendaStore';
import { Helpers } from '../utils/helpers';
import WeekGrid from '../components/agenda/WeekGrid';
import AgendamentoModal from '../components/agenda/AgendamentoModal';

export default function Agenda() {
  const { timeSlots, weekDays, weekGrid, professionals, viewMode, setViewMode, moveAppointment } = useAgendaStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const metrics = {
    total: () => weekGrid.flat().filter(Boolean).length,
    today: () => {
      const today = weekGrid[1] || [];
      const total = today.filter(Boolean).length;
      const revenue = today.reduce((sum, appt) => {
        if (!appt) return sum;
        // Simple revenue estimation
        const val = appt.color === 'c2' ? 890 : appt.color === 'c3' ? 1200 : 180;
        return sum + val;
      }, 0);
      return { total, revenue };
    },
  };

  const t = metrics.today();

  const handleCellClick = (time, dayIdx) => {
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };



  return (
    <div className="animate-fade-in">
      {/* Page head */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Atendimento
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-1.5">
          Agenda inteligente
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft max-w-[520px]">
          O sistema bloqueia automaticamente conflitos de sala, profissional e equipamento.
        </p>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">
            Agendamentos na semana
          </div>
          <div className="font-mono text-2xl font-medium tracking-tight text-ink dark:text-ink-dark">
            {metrics.total()}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">
            Hoje (Ter)
          </div>
          <div className="font-mono text-2xl font-medium tracking-tight text-ink dark:text-ink-dark">
            {t.total}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">
            Faturamento hoje
          </div>
          <div className="font-mono text-2xl font-medium tracking-tight text-sage dark:text-sage-dark">
            {Helpers.formatCurrency(t.revenue)}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">
            Profissionais
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {professionals.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 text-sm text-ink-soft dark:text-ink-dark-soft"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: p.cor }}
                />
                <span className="text-xs">{p.nome.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-sm font-medium text-ink-soft dark:text-ink-dark-soft">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
            <rect x="3" y="4.5" width="18" height="16" rx="2" />
            <path d="M3 9.5h18M8 3v3M16 3v3" />
          </svg>
          Semana de 29 de jun a 4 de jul
        </div>

        <div className="flex-1 min-w-0" />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-sm bg-surface dark:bg-surface-dark border border-border dark:border-border-dark">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
              viewMode === 'week'
                ? 'bg-surface-2 dark:bg-surface-dark-2 text-ink dark:text-ink-dark'
                : 'text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setViewMode('room')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-sm transition-colors ${
              viewMode === 'room'
                ? 'bg-surface-2 dark:bg-surface-dark-2 text-ink dark:text-ink-dark'
                : 'text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            Por sala
          </button>
        </div>

        {/* Novo agendamento button */}
        <button onClick={() => setModalOpen(true)} className="btn whitespace-nowrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo agendamento
        </button>
      </div>

      {/* Week Grid */}
      <WeekGrid
        timeSlots={timeSlots}
        weekDays={weekDays}
        weekGrid={weekGrid}
        onCellClick={handleCellClick}
        onMoveAppointment={moveAppointment}
      />

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-ink-faint dark:text-ink-dark-faint">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-sage-soft dark:bg-sage-dark-soft border border-sage dark:border-sage-dark" />
          Procedimento padrão
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-gold-soft dark:bg-gold-dark-soft border border-gold dark:border-gold-dark" />
          Alto valor
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-soft/60 dark:bg-rose-dark-soft/60 border border-rose/40 dark:border-rose-dark/40" />
          Laser
        </span>
      </div>

      {/* Modal */}
      <AgendamentoModal key={modalKey} open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
