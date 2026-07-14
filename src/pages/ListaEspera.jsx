/** @format */

import React, { useState } from 'react';
import { useListaEsperaStore } from '../store';
import { SearchInput, Modal } from '../components/ui';

/* ─── Badge de tempo de espera ─── */
function TimeBadge({ dias }) {
  let cls = 'text-sage dark:text-sage-dark bg-sage-soft/10 dark:bg-sage-dark-soft/10';
  let label = 'Hoje';
  if (dias >= 3) { cls = 'text-rose dark:text-rose-dark bg-rose-soft/20 dark:bg-rose-dark-soft/20'; label = `${dias} dias`; }
  else if (dias >= 2) { cls = 'text-gold dark:text-gold-dark bg-gold-soft/20 dark:bg-gold-dark-soft/20'; label = `${dias} dias`; }
  else if (dias === 1) { cls = 'text-gold dark:text-gold-dark bg-gold-soft/20 dark:bg-gold-dark-soft/20'; label = '1 dia'; }

  return (
    <span className={`tag text-[10px] font-semibold ${cls}`}>
      {label}
    </span>
  );
}

/* ════════════════════════════════════ */
export default function ListaEspera() {
  const {
    list, activeFilter, searchTerm,
    setActiveFilter, setSearchTerm, addToWaitlist, removeFromWaitlist,
    getFilteredList, getDaysSince,
  } = useListaEsperaStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', servico: '', tel: '', preferencia: 'Qualquer horário' });

  const filtered = getFilteredList();

  const handleAdd = () => {
    if (!form.nome || !form.servico) return;
    addToWaitlist({
      nome: form.nome,
      servico: form.servico,
      tel: form.tel,
      preferencia: form.preferencia,
      desde: 'Hoje',
    });
    setModalOpen(false);
    setForm({ nome: '', servico: '', tel: '', preferencia: 'Qualquer horário' });
  };

  const filters = [
    { key: 'todos', label: 'Todos' },
    { key: 'manha', label: 'Manhã' },
    { key: 'tarde', label: 'Tarde' },
  ];

  const servicos = [
    'Limpeza de pele', 'Toxina botulínica', 'Peeling de diamante',
    'Massagem relaxante', 'Drenagem linfática', 'Laser CO2',
    'Microagulhamento', 'Preenchimento facial',
  ];

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Relacionamento
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Lista de Espera
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          {list.length} clientes na fila de espera
        </p>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key === 'todos' ? 'todos' : f.key)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 ${
                activeFilter === f.key
                  ? 'bg-brand-soft/20 dark:bg-brand-dark-soft/20 text-brand dark:text-brand-dark'
                  : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar cliente…" className="w-44" />
          <button onClick={() => setModalOpen(true)} className="btn btn-sm whitespace-nowrap">
            + Adicionar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Cliente', 'Serviço', 'Preferência', 'Na fila desde', 'Tempo', ''].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-4 pb-3 pt-4 border-b border-border dark:border-border-dark whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="stagger-enter">
              {filtered.length > 0 ? filtered.map((entry, i) => {
                const dias = getDaysSince(entry.desde);
                const iniciais = entry.nome
                  ?.split(' ')
                  .map((w) => w[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || '';

                return (
                  <tr
                    key={entry.id}
                    className="transition-colors hover:bg-surface-2 dark:hover:bg-surface-dark-2"
                  >
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <div className="text-sm font-semibold text-ink dark:text-ink-dark">{entry.nome}</div>
                      <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint mt-0.5">
                        {iniciais}{entry.tel ? ` · ${entry.tel}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                      {entry.servico || '—'}
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <span className="tag text-[10px] font-semibold bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft">
                        {entry.preferencia || 'Qualquer horário'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                      {entry.desde || '—'}
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <TimeBadge dias={dias} />
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark text-right">
                      <button
                        onClick={() => removeFromWaitlist(entry.id)}
                        className="text-[11px] font-semibold text-brand dark:text-brand-dark hover:underline underline-offset-2"
                      >
                        Encaixar
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-faint dark:text-ink-dark-faint text-sm">
                    Nenhum cliente na lista de espera.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Adicionar à Lista de Espera" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Nome do cliente</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Larissa Teixeira"
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Serviço desejado</label>
              <select
                value={form.servico}
                onChange={(e) => setForm({ ...form, servico: e.target.value })}
                className="input"
              >
                <option value="">Selecione um serviço</option>
                {servicos.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Telefone (opcional)</label>
              <input
                type="text"
                value={form.tel}
                onChange={(e) => setForm({ ...form, tel: e.target.value })}
                placeholder="Ex: (11) 96652-3398"
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Preferência de horário</label>
              <select
                value={form.preferencia}
                onChange={(e) => setForm({ ...form, preferencia: e.target.value })}
                className="input"
              >
                <option value="Qualquer horário">Qualquer horário</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleAdd} disabled={!form.nome || !form.servico} className="btn btn-sm">
                Adicionar
              </button>
            </div>
          </div>
        </Modal>
    </div>
  );
}
