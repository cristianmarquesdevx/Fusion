/** @format */

import React, { useState } from 'react';
import { useSalasStore } from '../store';
import { Helpers } from '../utils';
import { SearchInput, Modal } from '../components/ui';

/* ─── BARRA DE TIMELINE ─── */
function TimelineBar({ salaId, compact = false }) {
  const { getRoomTimeline, timeline } = useSalasStore();
  const data = getRoomTimeline(salaId);

  const statusColor = {
    concluido: { bg: 'bg-sage/60 dark:bg-sage-dark/60', text: 'text-sage dark:text-sage-dark' },
    ativo: { bg: 'bg-gold dark:bg-gold-dark', text: 'text-gold dark:text-gold-dark' },
    confirmado: { bg: 'bg-ink-faint/30 dark:bg-ink-dark-faint/30', text: 'text-ink-faint dark:text-ink-dark-faint' },
    cancelado: { bg: 'bg-rose-soft/30 dark:bg-rose-dark-soft/30', text: 'text-rose dark:text-rose-dark' },
  };

  // Group contiguous appointment slots
  const appts = timeline[salaId] || [];
  const hours = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

  return (
    <div className={`${compact ? 'space-y-0.5' : 'space-y-1'}`}>
      {/* Hour labels */}
      <div className="flex gap-0">
        {hours.map((h) => (
          <div key={h} className={`text-center text-[9px] text-ink-faint dark:text-ink-dark-faint font-mono ${compact ? 'w-6' : 'w-8'}`}>
            {h}
          </div>
        ))}
      </div>
      {/* Timeline track */}
      <div className="flex gap-0 relative h-5 rounded-sm bg-surface-2/50 dark:bg-surface-dark-2/50 overflow-hidden">
        {hours.map((h, i) => {
          const appt = appts.find((a) => a.hora.startsWith(h));
          const info = appt ? statusColor[appt.status] || statusColor.confirmado : null;
          const span = appt ? Math.ceil(appt.duracao / 60) : 0;
          return (
            <div key={h} className={`relative border-r border-border/30 dark:border-border-dark/30 ${compact ? 'w-6' : 'w-8'}`}>
              {appt && i === hours.indexOf(appt.hora.substring(0, 2) + ':00') && (
                <div
                  className={`absolute inset-y-0 left-0 rounded-sm ${info.bg} ${
                    appt.status === 'ativo' ? 'animate-pulse ring-1 ring-gold dark:ring-gold-dark' : ''
                  }`}
                  style={{ width: `${span * (compact ? 6 : 8)}px`, zIndex: 2 }}
                  title={`${appt.cliente} — ${appt.servico} (${appt.hora})`}
                />
              )}
            </div>
          );
        })}
        {/* Linha do "agora" */}
        {(() => {
          const now = new Date();
          const min = now.getHours() * 60 + now.getMinutes();
          const pct = Math.max(0, Math.min(100, ((min - 480) / 720) * 100));
          return (
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose/70 dark:bg-rose-dark/70 z-10"
              style={{ left: `${pct}%` }}
            />
          );
        })()}
      </div>
    </div>
  );
}

/* ─── BADGE DE SAÚDE DO EQUIPAMENTO ─── */
function HealthBadge({ saude, size = 'sm' }) {
  const getColor = (s) => {
    if (s >= 85) return { dot: 'bg-sage dark:bg-sage-dark', text: 'text-sage dark:text-sage-dark', label: 'Ótimo' };
    if (s >= 70) return { dot: 'bg-gold dark:bg-gold-dark', text: 'text-gold dark:text-gold-dark', label: 'Bom' };
    if (s >= 50) return { dot: 'bg-rose dark:bg-rose-dark', text: 'text-rose dark:text-rose-dark', label: 'Atenção' };
    return { dot: 'bg-rose dark:bg-rose-dark', text: 'text-rose dark:text-rose-dark', label: 'Crítico' };
  };
  const c = getColor(saude);
  return (
    <span className={`inline-flex items-center gap-1 ${size === 'sm' ? 'text-[9px]' : 'text-[10px]'} font-semibold ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${saude < 50 ? 'animate-pulse' : ''}`} />
      {c.label} ({saude}%)
    </span>
  );
}

/* ─── PAINEL DE SALA EXPANDIDO ─── */
function SalaPanel({ sala, idx }) {
  const {
    getStatusInfo, getRoomAnalytics, equipment, expandedRoom, setExpandedRoom,
    startSession, endSession, logMaintenance, timeline,
  } = useSalasStore();
  const info = getStatusInfo(sala.status);
  const isExpanded = expandedRoom === sala.id;
  const analytics = getRoomAnalytics(sala.id);
  const equipList = equipment[sala.id] || [];
  const timelineData = timeline[sala.id] || [];

  return (
    <div className={`card animate-fade-in-up transition-all duration-300 ${isExpanded ? 'col-span-full row-span-2' : ''}`}
      style={{ animationDelay: `${idx * 0.06}s` }}
    >
      {/* ─── HEADER (sempre visível) ─── */}
      <button
        onClick={() => setExpandedRoom(sala.id)}
        className="w-full flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-border dark:border-border-dark text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-base font-semibold text-ink dark:text-ink-dark truncate">
              {sala.nome}
            </h3>
            {sala.status === 'em_uso' && (
              <span className="w-2 h-2 rounded-full bg-sage dark:bg-sage-dark animate-pulse shrink-0" />
            )}
          </div>
          <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint mt-0.5 truncate">
            Cap.: {sala.capacidade} · {equipList.length} equip.
            {analytics.agendamentosHoje > 0 ? ` · ${analytics.agendamentosHoje} hoje` : ''}
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${info.chip} shrink-0`}>
          <span className={`w-1.5 h-1.5 rounded-full ${info.dot} ${sala.status === 'em_uso' ? 'animate-pulse' : ''}`} />
          {info.label}
        </div>
      </button>

      {/* ─── TIMELINE ─── */}
      <div className="px-5 pt-3 pb-2">
        <TimelineBar salaId={sala.id} compact={!isExpanded} />
      </div>

      {/* ─── BODY (colapsado) ─── */}
      <div className="px-5 py-2 flex items-center justify-between text-[11px] text-ink-faint dark:text-ink-dark-faint">
        <span>
          {analytics.agendamentosHoje > 0
            ? `${analytics.agendamentosHoje} agend. · ${analytics.ocupacaoHoje}% ocupado`
            : 'Nenhum agendamento hoje'}
        </span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>

      {/* ─── CONTEÚDO EXPANDIDO ─── */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-5 animate-fade-in border-t border-border dark:border-border-dark pt-4">
          {/* Próximas sessões */}
          <div>
            <h4 className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2">
              Sessões de hoje
            </h4>
            {timelineData.length > 0 ? (
              <div className="space-y-1.5">
                {timelineData.map((sess) => (
                  <div key={sess.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-surface-2/50 dark:bg-surface-dark-2/50">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono text-[11px] font-semibold text-ink dark:text-ink-dark shrink-0 w-10">
                        {sess.hora}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-ink dark:text-ink-dark truncate">{sess.cliente}</div>
                        <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint truncate">
                          {sess.servico} · {sess.profissional} · {sess.duracao}min
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {sess.status === 'confirmado' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); startSession(sala.id, sess.id); }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-sage-soft/20 dark:bg-sage-dark-soft/20 text-sage dark:text-sage-dark hover:bg-sage-soft/40 dark:hover:bg-sage-dark-soft/40 transition-colors"
                        >
                          Iniciar
                        </button>
                      )}
                      {sess.status === 'ativo' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); endSession(sala.id, sess.id); }}
                          className="text-[10px] font-semibold px-2 py-1 rounded-md bg-rose-soft/20 dark:bg-rose-dark-soft/20 text-rose dark:text-rose-dark hover:bg-rose-soft/40 dark:hover:bg-rose-dark-soft/40 transition-colors"
                        >
                          Concluir
                        </button>
                      )}
                      <span className={`tag text-[9px] font-semibold ${
                        sess.status === 'concluido' ? 'bg-sage-soft/20 text-sage' :
                        sess.status === 'ativo' ? 'bg-gold-soft/20 text-gold animate-pulse' :
                        sess.status === 'cancelado' ? 'bg-rose-soft/20 text-rose' :
                        'bg-surface-2 text-ink-faint'
                      }`}>
                        {sess.status === 'ativo' ? 'Em andamento' :
                         sess.status === 'confirmado' ? 'Confirmado' :
                         sess.status === 'concluido' ? 'Concluído' : sess.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-[11px] text-ink-faint dark:text-ink-dark-faint">
                Nenhuma sessão agendada para hoje.
              </div>
            )}
          </div>

          {/* Equipamentos */}
          {equipList.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2">
                Equipamentos
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {equipList.map((eq) => (
                  <div key={eq.id} className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-surface-2/30 dark:bg-surface-dark-2/30">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-ink dark:text-ink-dark truncate">{eq.nome}</div>
                      <div className="text-[9px] text-ink-faint dark:text-ink-dark-faint mt-0.5">
                        Última: {eq.ultimaManutencao} · {eq.usoTotal} usos
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <HealthBadge saude={eq.saude} />
                      {eq.saude < 70 && (
                        <button
                          onClick={(e) => { e.stopPropagation(); logMaintenance(sala.id, eq.id); }}
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-rose-soft/20 text-rose hover:bg-rose-soft/40 transition-colors"
                        >
                          Manutenção
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics */}
          <div>
            <h4 className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-2">
              Analytics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Sessões (hist.)', value: analytics.totalSessoes },
                { label: 'Receita total', value: Helpers.formatCurrency(analytics.receitaTotal), mono: true },
                { label: 'Duração média', value: `${analytics.duracaoMedia}min` },
                { label: 'Ocupação hoje', value: `${analytics.ocupacaoHoje}%` },
              ].map((m, i) => (
                <div key={i} className="py-2 px-3 rounded-lg bg-surface-2/30 dark:bg-surface-dark-2/30 text-center">
                  <div className="text-[9px] text-ink-faint dark:text-ink-dark-faint">{m.label}</div>
                  <div className={`text-xs font-bold text-ink dark:text-ink-dark tabular-nums mt-0.5 ${m.mono ? 'font-mono' : ''}`}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>
            {/* Top serviços */}
            {analytics.topServicos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {analytics.topServicos.map((s, i) => (
                  <span key={i} className="tag text-[9px] px-2 py-0.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint">
                    {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}{s.nome} ({s.count}x)
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── PAINEL DE COMPARAÇÃO ─── */
function ComparisonBar({ rooms, analytics }) {
  const maxReceita = Math.max(...Object.values(analytics).map((a) => a.receitaTotal), 1);
  const maxSessoes = Math.max(...Object.values(analytics).map((a) => a.totalSessoes), 1);
  const maxOcupacao = Math.max(...Object.values(analytics).map((a) => a.ocupacaoHoje), 1);

  return (
    <div className="card p-5">
      <h3 className="font-display text-sm font-semibold text-ink dark:text-ink-dark mb-4">
        Comparativo de Salas
      </h3>
      <div className="space-y-3">
        {rooms.map((sala, i) => {
          const a = analytics[sala.id];
          if (!a) return null;
          return (
            <div key={sala.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-[11px] font-semibold text-ink dark:text-ink-dark min-w-[120px] truncate">
                  {sala.nome.split('—')[1] || sala.nome}
                </span>
                <div className="flex-1 flex items-center gap-4">
                  {/* Barra de receita */}
                  <div className="flex-1 h-2 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                    <div className="h-full rounded-full bg-gold dark:bg-gold-dark transition-all duration-700"
                      style={{ width: `${(a.receitaTotal / maxReceita) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[10px] font-semibold text-ink dark:text-ink-dark tabular-nums min-w-[50px] text-right">
                    {Helpers.formatCompactCurrency(a.receitaTotal)}
                  </span>
                  <span className="font-mono text-[10px] text-ink-faint dark:text-ink-dark-faint min-w-[32px] text-right">
                    {a.agendamentosHoje}
                  </span>
                  <div className="w-10 h-2 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
                    <div className="h-full rounded-full bg-sage dark:bg-sage-dark transition-all duration-700"
                      style={{ width: `${(a.ocupacaoHoje / maxOcupacao) * 100}%` }} />
                  </div>
                  <span className="font-mono text-[10px] text-ink-faint dark:text-ink-dark-faint min-w-[28px] text-right">
                    {a.ocupacaoHoje}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[9px] text-ink-faint dark:text-ink-dark-faint">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gold dark:bg-gold-dark" /> Receita</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-ink-faint/50" /> Sessões</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sage dark:bg-sage-dark" /> Ocupação</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
export default function Salas() {
  const {
    list, searchTerm, activeFilters,
    setSearchTerm, setFilter, clearFilters, getFilteredList, getKPIs, getStatusInfo, addSala,
    getRoomAnalytics, equipment, selectedDate, setSelectedDate,
  } = useSalasStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', capacidade: 1, equipamentos: '' });

  const filtered = getFilteredList();
  const kpis = getKPIs();

  // Analytics por sala para comparativo
  const analytics = {};
  filtered.forEach((s) => { analytics[s.id] = getRoomAnalytics(s.id); });

  const handleCreate = () => {
    if (!form.nome) return;
    addSala({
      nome: form.nome,
      capacidade: Number(form.capacidade) || 1,
      equipamentos: form.equipamentos || 'Nenhum',
    });
    setModalOpen(false);
    setForm({ nome: '', capacidade: 1, equipamentos: '' });
  };

  const statusFilters = [
    { key: 'disponivel', label: 'Disponível' },
    { key: 'em_uso', label: 'Em uso' },
    { key: 'ocupada', label: 'Ocupada' },
    { key: 'manutencao', label: 'Manutenção' },
  ];

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Operações
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Gestão de Salas
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          {kpis.totalSalas} salas · {kpis.ocupacao}% ocupação · {kpis.sessoesHoje} sessões hoje · {kpis.equipamentosManut} equip. em manutenção
        </p>
      </div>

      {/* KPIs Avançados */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total de Salas', value: kpis.totalSalas, color: 'text-ink dark:text-ink-dark' },
          { label: 'Ocupação', value: kpis.ocupacao, suffix: '%', color: 'text-gold dark:text-gold-dark' },
          { label: 'Disponíveis', value: kpis.disponiveis, color: 'text-sage dark:text-sage-dark' },
          { label: 'Sessões Hoje', value: kpis.sessoesHoje, color: 'text-blue-500' },
          { label: 'Duração Média', value: `${kpis.duracaoMedia}min`, color: 'text-ink dark:text-ink-dark' },
          { label: 'Eq. Manutenção', value: kpis.equipamentosManut, color: kpis.equipamentosManut > 0 ? 'text-rose dark:text-rose-dark' : 'text-ink-faint' },
        ].map((kpi, i) => (
          <div key={i} className="card p-3 animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="text-[10px] text-ink-soft dark:text-ink-dark-soft font-medium mb-1">{kpi.label}</div>
            <div className={`font-mono text-lg sm:text-xl font-bold tabular-nums ${kpi.color}`}>
              {kpi.value}{kpi.suffix || ''}
            </div>
            {kpi.label === 'Disponíveis' && kpis.disponiveis > 0 && (
              <div className="text-[9px] text-ink-faint dark:text-ink-dark-faint mt-0.5">
                {list.filter((s) => s.status === 'disponivel').slice(0, 2).map((s) => s.nome.split('—')[0].trim()).join(' e ')} livres
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Seletor de data + Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-surface dark:bg-surface-dark border border-border dark:border-border-dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3 h-3 text-ink-faint dark:text-ink-dark-faint">
              <rect x="3" y="4.5" width="18" height="16" rx="2" />
              <path d="M3 9.5h18M8 3v3M16 3v3" />
            </svg>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-[11px] font-semibold bg-transparent border-none outline-none text-ink dark:text-ink-dark w-[120px]"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={clearFilters}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                !activeFilters.status
                  ? 'bg-brand-soft/20 dark:bg-brand-dark-soft/20 text-brand dark:text-brand-dark'
                  : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              Todas
            </button>
            {statusFilters.map((sf) => {
              const info = getStatusInfo(sf.key);
              const isActive = activeFilters.status === info.label;
              return (
                <button
                  key={sf.key}
                  onClick={() => setFilter('status', isActive ? null : info.label)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                    isActive
                      ? `${info.chip} ring-1 ring-inset ring-current/20`
                      : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark'
                  }`}
                >
                  {sf.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar sala ou equipamento…" className="w-40" />
          <button onClick={() => setModalOpen(true)} className="btn btn-sm whitespace-nowrap">
            + Nova sala
          </button>
        </div>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {filtered.length > 0 ? filtered.map((sala, i) => (
          <SalaPanel key={sala.id} sala={sala} idx={i} />
        )) : (
          <div className="card col-span-full py-16 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
            Nenhuma sala encontrada.
          </div>
        )}
      </div>

      {/* Comparativo */}
      {filtered.length > 0 && <ComparisonBar rooms={filtered} analytics={analytics} />}

      {/* Modal Nova Sala */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Sala" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Nome da sala</label>
              <input type="text" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Sala 6 — Terapia" className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Capacidade</label>
              <input type="number" min={1} value={form.capacidade} onChange={(e) => setForm({ ...form, capacidade: Math.max(1, Number(e.target.value)) })} className="input" />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Equipamentos</label>
              <input type="text" value={form.equipamentos} onChange={(e) => setForm({ ...form, equipamentos: e.target.value })} placeholder="Ex: Maca, Laser, LED" className="input" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nome} className="btn btn-sm">Criar sala</button>
            </div>
          </div>
        </Modal>
    </div>
  );
}
