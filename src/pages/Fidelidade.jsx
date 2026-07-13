/** @format */

import React, { useState } from 'react';
import { useFidelidadeStore } from '../store/useFidelidadeStore';
import SearchInput from '../components/ui/SearchInput';
import Modal from '../components/ui/Modal';

/* ─── Barra de nível horizontal ─── */
function LevelBar({ nome, pontos, count, maxCount, cor, idx }) {
  if (!count && count !== 0) return null;
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  const bgMap = {
    '#CD7F32': 'from-amber-700/60 to-amber-600/40',
    '#C0C0C0': 'from-slate-300/60 to-slate-200/40',
    '#FFD700': 'from-yellow-500/60 to-yellow-400/40',
    '#E5E4E2': 'from-gray-200/60 to-gray-100/40',
    '#B9F2FF': 'from-cyan-300/60 to-cyan-200/40',
  };
  const bgGrad = bgMap[cor] || 'from-brand-soft/60';
  const medalha = ['🥉', '🥈', '🥇', '💎', '👑'][idx] || '';

  return (
    <div className="group animate-fade-in-up" style={{ animationDelay: `${idx * 0.06}s` }}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-ink dark:text-ink-dark min-w-[80px]">{medalha} {nome}</span>
        <span className="text-[10px] text-ink-faint dark:text-ink-dark-faint">{pontos} pts</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-3 sm:h-4 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${bgGrad} transition-all duration-1000 ease-out`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-xs font-semibold text-ink dark:text-ink-dark tabular-nums min-w-[24px] text-right">
          {count}
        </span>
      </div>
    </div>
  );
}

/* ─── Mini cartão de nível ─── */
function LevelCard({ nivel, stats, idx }) {
  const medalha = ['🥉', '🥈', '🥇', '💎', '👑'][idx] || '';
  return (
    <div className="card p-4 text-center animate-fade-in-up" style={{ animationDelay: `${idx * 0.08}s` }}>
      <div className="text-2xl mb-1">{medalha}</div>
      <div className="text-sm font-bold text-ink dark:text-ink-dark">{nivel.nome}</div>
      <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint mt-0.5">{nivel.pontosMin === 0 ? '0+' : `${nivel.pontosMin}+`} pts</div>
      <div className="mt-2 font-mono text-lg font-bold text-ink dark:text-ink-dark tabular-nums">{stats[nivel.nome] || 0}</div>
      <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint">clientes</div>
      <ul className="mt-2 space-y-0.5">
        {nivel.beneficios && nivel.beneficios.map((b, i) => (
          <li key={i} className="text-[10px] text-ink-soft dark:text-ink-dark-soft">✓ {b}</li>
        ))}
      </ul>
    </div>
  );
}

/* ════════════════════════════════════ */
/*  PÁGINA PRINCIPAL                    */
/* ════════════════════════════════════ */

export default function Fidelidade() {
  const {
    niveis, totalPontos, resgateMes, ticketMedio,
    searchTerm, activeFilter,
    setSearchTerm, setActiveFilter, addPontos, getFilteredClientes, getDistribuicao,
  } = useFidelidadeStore();

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addCliente, setAddCliente] = useState('');
  const [addQtd, setAddQtd] = useState(100);

  const clientes = getFilteredClientes();
  const dist = getDistribuicao();
  const maxCount = Math.max(...Object.values(dist), 1);

  const handleAddPontos = () => {
    if (!addCliente || !addQtd) return;
    addPontos(addCliente, Number(addQtd));
    const nome = useFidelidadeStore.getState().clientes.find((c) => c.id === addCliente)?.nome || '';
    setAddModalOpen(false);
    setAddCliente('');
    setAddQtd(100);
  };

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark">
            ★ Fidelidade
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Programa de Fidelidade
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          {totalPontos.toLocaleString('pt-BR')} pontos distribuídos · {useFidelidadeStore.getState().clientes.length} clientes ativos
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total de Pontos', value: totalPontos, format: (v) => v.toLocaleString('pt-BR'), color: 'text-gold dark:text-gold-dark' },
          { label: 'Clientes Ativos', value: useFidelidadeStore.getState().clientes.length, format: (v) => v, color: 'text-sage dark:text-sage-dark' },
          { label: 'Resgates no Mês', value: resgateMes, format: (v) => `R$ ${v.toFixed(0).replace('.', ',')}`, color: 'text-blue-500' },
          { label: 'Ticket Fidelidade', value: ticketMedio, format: (v) => `R$ ${v.toFixed(0).replace('.', ',')}`, color: 'text-amber-500' },
        ].map((kpi, i) => (
          <div key={i} className="card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-2">{kpi.label}</div>
            <div className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${kpi.color}`}>
              {kpi.format(kpi.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Níveis - Cards + Barras */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-4 mb-6">
        {/* Level cards */}
        <div className="grid grid-cols-5 gap-2">
          {niveis.map((nivel, i) => (
            <LevelCard key={i} nivel={nivel} stats={dist} idx={i} />
          ))}
        </div>

        {/* Distribution bars */}
        <div className="card p-5">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-4">
            Distribuição por nível
          </h2>
          <div className="space-y-3">
            {niveis.map((nivel, i) => (
              <LevelBar
                key={i}
                nome={nivel.nome}
                pontos={nivel.pontosMin === 0 ? '0-99' : nivel.pontosMin === 100 ? '100-299' : nivel.pontosMin === 300 ? '300-599' : nivel.pontosMin === 600 ? '600-999' : '1000+'}
                count={dist[nivel.nome] || 0}
                maxCount={maxCount}
                cor={nivel.cor}
                idx={i}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Top clientes table */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-5 pt-5 pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
              Clientes por pontuação
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            {/* Filter buttons */}
            <div className="flex gap-1">
              {['Todos', ...niveis.map((n) => n.nome)].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f === 'Todos' ? null : f)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                    (f === 'Todos' && !activeFilter) || activeFilter === f
                      ? 'bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark'
                      : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar cliente…" className="w-44" />
            <button
              onClick={() => setAddModalOpen(true)}
              className="btn btn-sm whitespace-nowrap"
            >
              + Adicionar pontos
            </button>
          </div>
        </div>
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Cliente', 'Nível', 'Pontos', 'Última visita'].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="stagger-enter">
              {clientes.length > 0 ? clientes.map((c, i) => {
                const nivel = niveis.find((n) => n.nome === c.nivel) || niveis[0];
                return (
                  <tr key={c.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-surface-dark-2">
                    <td className="cell-primary px-3 py-3.5 text-sm font-semibold text-ink dark:text-ink-dark border-b border-border dark:border-border-dark">
                      {c.nome}
                    </td>
                    <td className="px-3 py-3.5 border-b border-border dark:border-border-dark">
                      <span className="tag text-[10px] font-semibold" style={{
                        backgroundColor: `${nivel.cor}22`,
                        color: nivel.cor,
                        border: `1px solid ${nivel.cor}44`,
                      }}>
                        {c.nivel}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-sm font-bold text-ink dark:text-ink-dark border-b border-border dark:border-border-dark tabular-nums">
                      {c.pontos.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-3 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                      {c.ultima}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center text-ink-faint dark:text-ink-dark-faint text-sm">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Pontos */}
      {addModalOpen && (
        <Modal onClose={() => setAddModalOpen(false)} title="Adicionar Pontos" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Cliente</label>
              <select
                value={addCliente}
                onChange={(e) => setAddCliente(e.target.value)}
                className="input"
              >
                <option value="">Selecione um cliente</option>
                {useFidelidadeStore.getState().clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome} ({c.nivel} · {c.pontos} pts)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Quantidade de pontos</label>
              <input
                type="number"
                min={1}
                value={addQtd}
                onChange={(e) => setAddQtd(Math.max(1, Number(e.target.value)))}
                className="input"
              />
            </div>
            <div className="p-3 rounded-lg bg-surface-2/50 dark:bg-surface-dark-2/50 text-xs text-ink-soft dark:text-ink-dark-soft">
              {addCliente ? (() => {
                const c = useFidelidadeStore.getState().clientes.find((c) => c.id === addCliente);
                if (!c) return 'Selecione um cliente para ver o preview.';
                const total = c.pontos + addQtd;
                const nivel = useFidelidadeStore.getState().getNivelByPontos(total);
                return (
                  <>
                    <strong className="text-ink dark:text-ink-dark">{c.nome}</strong>
                    {` terá ${total.toLocaleString('pt-BR')} pts → `}
                    <span style={{ color: nivel.cor, fontWeight: 700 }}>{nivel.nome}</span>
                  </>
                );
              })() : 'Selecione um cliente para ver o preview.'}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setAddModalOpen(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleAddPontos} disabled={!addCliente || !addQtd} className="btn btn-sm">
                Adicionar pontos
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
