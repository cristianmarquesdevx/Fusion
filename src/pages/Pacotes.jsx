/** @format */

import React, { useState } from 'react';
import { usePacotesStore } from '../store/usePacotesStore';
import { Helpers } from '../utils/helpers';
import SearchInput from '../components/ui/SearchInput';
import Modal from '../components/ui/Modal';

export default function Pacotes() {
  const {
    list, filterPeriod, searchTerm,
    setFilterPeriod, setSearchTerm, addPacote, getKPIs, getFilteredList,
  } = usePacotesStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', servico: '', sessoes: 6, valor: '', validadeMeses: 12 });

  const filtered = getFilteredList();
  const kpis = getKPIs();

  const handleCreate = () => {
    if (!form.nome || !form.sessoes || !form.valor) return;
    addPacote({
      nome: form.nome,
      servico: form.servico || '—',
      sessoes: Number(form.sessoes),
      valor: Number(form.valor.replace(',', '.')),
      validadeMeses: Number(form.validadeMeses),
    });
    setModalOpen(false);
    setForm({ nome: '', servico: '', sessoes: 6, valor: '', validadeMeses: 12 });
  };

  const periods = [
    { key: 'todos', label: 'Todos' },
    { key: 'promocoes', label: 'Promoções' },
    { key: 'expirados', label: 'Expirados' },
  ];

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Pacotes de Sessões
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          {list.length} pacotes ativos · {kpis.totalSessoes.toLocaleString('pt-BR')} sessões contratadas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Pacotes Ativos', value: kpis.totalAtivos, color: 'text-sage dark:text-sage-dark' },
          { label: 'Sessões Contratadas', value: kpis.totalSessoes, color: 'text-gold dark:text-gold-dark' },
          { label: 'Receita de Pacotes', value: kpis.receitaPacotes, format: 'currency', color: 'text-ink dark:text-ink-dark' },
          { label: 'Ticket Médio', value: kpis.ticketMedio, format: 'currency', color: 'text-blue-500' },
        ].map((kpi, i) => (
          <div key={i} className="card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-2">{kpi.label}</div>
            <div className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${kpi.color}`}>
              {kpi.format === 'currency' ? Helpers.formatCurrency(kpi.value) : kpi.value.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
            Lista de pacotes
          </h2>
          <div className="flex items-center gap-2">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setFilterPeriod(p.key)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all active:scale-95 ${
                  filterPeriod === p.key
                    ? 'bg-brand-soft/20 dark:bg-brand-dark-soft/20 text-brand dark:text-brand-dark'
                    : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                {p.label}
              </button>
            ))}
            <div className="w-px h-5 bg-border dark:bg-border-dark" />
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar…" className="w-36" />
            <button onClick={() => setModalOpen(true)} className="btn btn-sm whitespace-nowrap">
              + Novo pacote
            </button>
          </div>
        </div>
        <div className="overflow-x-auto px-5 pb-5">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Pacote', 'Serviço', 'Sessões', 'Valor', 'Validade', 'Ativos', 'Status'].map((h) => (
                  <th key={h} className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="stagger-enter">
              {filtered.length > 0 ? filtered.map((p, i) => (
                <tr key={p.id} className="transition-colors hover:bg-surface-2 dark:hover:bg-surface-dark-2">
                  <td className="px-3 py-3.5 text-sm font-semibold text-ink dark:text-ink-dark border-b border-border dark:border-border-dark">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.cor }} />
                      {p.nome}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">{p.servico}</td>
                  <td className="px-3 py-3.5 font-mono text-sm font-semibold text-ink dark:text-ink-dark border-b border-border dark:border-border-dark tabular-nums">{p.sessoes}</td>
                  <td className="px-3 py-3.5 font-mono text-sm font-semibold text-ink dark:text-ink-dark border-b border-border dark:border-border-dark tabular-nums">{Helpers.formatCurrency(p.valor)}</td>
                  <td className="px-3 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">{p.validadeMeses} meses</td>
                  <td className="px-3 py-3.5 font-mono text-sm font-semibold text-ink dark:text-ink-dark border-b border-border dark:border-border-dark tabular-nums">{p.ativos}</td>
                  <td className="px-3 py-3.5 border-b border-border dark:border-border-dark">
                    <span className={`tag text-[10px] font-semibold ${p.promocao ? 'bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark' : 'bg-sage-soft/20 dark:bg-sage-dark-soft/20 text-sage dark:text-sage-dark'}`}>
                      {p.promocao ? 'Promoção' : 'Ativo'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-ink-faint dark:text-ink-dark-faint text-sm">
                    Nenhum pacote encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Pacote */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title="Novo Pacote" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            {[
              { id: 'nome', label: 'Nome do pacote', type: 'text', placeholder: 'Ex: Limpeza facial' },
              { id: 'servico', label: 'Serviço vinculado', type: 'text', placeholder: 'Ex: Limpeza de pele' },
              { id: 'sessoes', label: 'Quantidade de sessões', type: 'number', min: 1 },
              { id: 'valor', label: 'Valor total (R$)', type: 'text', placeholder: 'Ex: 1600.00' },
              { id: 'validadeMeses', label: 'Validade (meses)', type: 'number', min: 1 },
            ].map((field) => (
              <div key={field.id}>
                <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">{field.label}</label>
                {field.type === 'text' ? (
                  <input
                    type="text"
                    value={form[field.id]}
                    onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                    placeholder={field.placeholder}
                    className="input"
                  />
                ) : (
                  <input
                    type="number"
                    min={field.min || 1}
                    value={form[field.id]}
                    onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                    className="input"
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nome || !form.sessoes || !form.valor} className="btn btn-sm">
                Criar pacote
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
