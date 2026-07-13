/** @format */

import React, { useState } from 'react';
import { usePlanosStore } from '../store/usePlanosStore';
import { Helpers } from '../utils/helpers';
import Modal from '../components/ui/Modal';

/* ─── Card de plano ─── */
function PlanoCard({ plano, idx, isPopular }) {
  return (
    <div
      className={`card p-5 animate-fade-in-up flex flex-col ${isPopular ? 'ring-2 ring-gold dark:ring-gold-dark' : ''}`}
      style={{ animationDelay: `${idx * 0.08}s` }}
    >
      {isPopular && (
        <span className="self-start text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark mb-3">
          ★ Mais popular
        </span>
      )}

      <h3 className="font-display text-lg font-semibold text-ink dark:text-ink-dark mb-1">
        {plano.nome}
      </h3>

      <div className="font-mono text-2xl font-bold text-ink dark:text-ink-dark tabular-nums mb-3">
        {Helpers.formatCurrency(plano.valor)}
        <small className="text-sm font-normal text-ink-faint dark:text-ink-dark-faint">/mês</small>
      </div>

      <p className="text-xs text-ink-soft dark:text-ink-dark-soft mb-4 leading-relaxed">
        {plano.descricao || 'Benefícios exclusivos'}
      </p>

      {plano.beneficios && plano.beneficios.length > 0 && (
        <ul className="space-y-1.5 mb-4 flex-1">
          {plano.beneficios.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-ink-soft dark:text-ink-dark-soft">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 flex-shrink-0 text-sage dark:text-sage-dark">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      )}

      <div className="text-xs text-ink-faint dark:text-ink-dark-faint pt-3 border-t border-border dark:border-border-dark mt-auto">
        <span className="font-semibold text-ink dark:text-ink-dark">{plano.assinantes}</span> assinantes ativos
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
export default function PlanosRecorrentes() {
  const { planos, addPlano, getKPIs } = usePlanosStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', valor: '', descricao: '' });
  const kpis = getKPIs();

  // Find the most popular plan
  const maxAssinantes = Math.max(...planos.map((p) => p.assinantes || 0));

  const handleCreate = () => {
    if (!form.nome || !form.valor) return;
    addPlano({
      nome: form.nome,
      valor: Number(form.valor.replace(',', '.')),
      descricao: form.descricao || 'Benefícios exclusivos',
    });
    setModalOpen(false);
    setForm({ nome: '', valor: '', descricao: '' });
  };

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Assinaturas
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          Planos Recorrentes
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          {kpis.totalAssinantes} assinantes · MRR de {Helpers.formatCurrency(kpis.mrr)}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Total de Assinantes', value: kpis.totalAssinantes, format: 'number', color: 'text-sage dark:text-sage-dark' },
          { label: 'MRR', value: kpis.mrr, format: 'currency', color: 'text-gold dark:text-gold-dark' },
          { label: 'Taxa de Retenção', value: kpis.retencao, format: 'percent', color: 'text-ink dark:text-ink-dark' },
          { label: 'Cancelamentos (mês)', value: kpis.cancelamentos, format: 'number', color: 'text-rose dark:text-rose-dark' },
        ].map((kpi, i) => (
          <div key={i} className="card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-2">{kpi.label}</div>
            <div className={`font-mono text-xl sm:text-2xl font-bold tabular-nums ${kpi.color}`}>
              {kpi.format === 'currency'
                ? Helpers.formatCurrency(kpi.value)
                : kpi.format === 'percent'
                  ? `${kpi.value}%`
                  : kpi.value.toLocaleString('pt-BR')}
            </div>
          </div>
        ))}
      </div>

      {/* Planos grid */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
          Planos disponíveis
        </h2>
        <button onClick={() => setModalOpen(true)} className="btn btn-sm whitespace-nowrap">
          + Novo plano
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {planos.map((plano, i) => (
          <PlanoCard
            key={plano.id}
            plano={plano}
            idx={i}
            isPopular={(plano.assinantes || 0) === maxAssinantes && i === 0}
          />
        ))}
        {planos.length === 0 && (
          <div className="card col-span-full py-16 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
            Nenhum plano cadastrado. Crie o primeiro plano!
          </div>
        )}
      </div>

      {/* Modal Novo Plano */}
      {modalOpen && (
        <Modal onClose={() => setModalOpen(false)} title="Novo Plano Recorrente" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Nome do plano</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Plano Premium"
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Valor mensal (R$)</label>
              <input
                type="text"
                value={form.valor}
                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                placeholder="Ex: 349.00"
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Benefícios e detalhes do plano"
                className="input min-h-[80px] resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nome || !form.valor} className="btn btn-sm">
                Criar plano
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
