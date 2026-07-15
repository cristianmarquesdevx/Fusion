/** @format */

import React, { useState, useCallback } from 'react';
import { usePlanosStore, useConfigStore } from '../store';
import { Helpers } from '../utils';
import { Modal, SearchInput } from '../components/ui';

/* ─── Card de plano ─── */
function PlanoCard({ plano, idx, isPopular, onAssinar, onSync }) {
  const [loading, setLoading] = useState(false);

  const handleAssinar = async () => {
    setLoading(true);
    await onAssinar(plano);
    setLoading(false);
  };

  return (
    <div
      className={`card p-5 animate-fade-in-up flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer select-none ${
        isPopular ? 'ring-2 ring-gold dark:ring-gold-dark' : ''
      }`}
      style={{ animationDelay: `${idx * 0.08}s` }}
      onClick={handleAssinar}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleAssinar(); } }}
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

      {/* Botão Assinar */}
      <button
        onClick={(e) => { e.stopPropagation(); handleAssinar(); }}
        disabled={loading}
        className="btn btn-sm w-full mb-3"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processando...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Assinar agora
          </span>
        )}
      </button>

      {/* Status do produto no gateway */}
      <div className="flex items-center justify-between text-xs text-ink-faint dark:text-ink-dark-faint pt-3 border-t border-border dark:border-border-dark mt-auto">
        <span>
          <span className="font-semibold text-ink dark:text-ink-dark">{plano.assinantes}</span> assinantes
        </span>
        {plano.abacatepayProductId ? (
          <span className="flex items-center gap-1 text-sage dark:text-sage-dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Sincronizado
          </span>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onSync(plano); }}
            className="text-ink-faint hover:text-brand dark:hover:text-brand-dark underline"
          >
            Sincronizar
          </button>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
export default function PlanosRecorrentes() {
  const { planos, addPlano, getKPIs, updatePlanoProductId, addSubscription } = usePlanosStore();
  const getAbacatepayApiKey = useConfigStore((s) => s.getAbacatepayApiKey);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: '', valor: '', descricao: '' });
  const [subscriptionModal, setSubscriptionModal] = useState({ open: false, plano: null, loading: false, url: '' });
  const [toast, setToast] = useState(null);
  const kpis = getKPIs();

  const showToast = useCallback((type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

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
    showToast('success', 'Plano criado com sucesso!');
  };

  const handleSync = async (plano) => {
    if (plano.abacatepayProductId) {
      showToast('info', 'Plano já sincronizado com o gateway.');
      return;
    }
    try {
      const apiKey = getAbacatepayApiKey();
      const res = await fetch('/api/abacatepay/create-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: plano.nome,
          price: plano.valor,
          externalId: `fusion-plano-${plano.id}`,
          cycle: 'MONTHLY',
          ...(apiKey ? { apiKey } : {}),
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.id) {
        updatePlanoProductId(plano.id, result.data.id);
        showToast('success', `Plano "${plano.nome}" sincronizado com o gateway!`);
      } else {
        showToast('error', result.error || 'Erro ao sincronizar plano.');
      }
    } catch (err) {
      showToast('error', 'Erro de conexão ao sincronizar plano.');
    }
  };

  const handleAssinar = async (plano) => {
    // Se não sincronizado, sincroniza primeiro
    if (!plano.abacatepayProductId) {
      showToast('info', 'Sincronizando plano com o gateway...');
      try {
        const apiKey = getAbacatepayApiKey();
        const res = await fetch('/api/abacatepay/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: plano.nome,
            price: plano.valor,
            externalId: `fusion-plano-${plano.id}`,
            cycle: 'MONTHLY',
            ...(apiKey ? { apiKey } : {}),
          }),
        });
        const result = await res.json();
        if (result.success && result.data?.id) {
          updatePlanoProductId(plano.id, result.data.id);
          plano.abacatepayProductId = result.data.id;
        } else {
          showToast('error', 'Erro ao sincronizar plano. Tente novamente.');
          return;
        }
      } catch (err) {
        showToast('error', 'Erro de conexão. Tente novamente.');
        return;
      }
    }

    // Cria assinatura
    setSubscriptionModal({ open: true, plano, loading: true, url: '' });

    try {
      const clientName = prompt('Nome do cliente para a assinatura:') || 'Cliente Fusion';
      const apiKey = getAbacatepayApiKey();
      const res = await fetch('/api/abacatepay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: plano.abacatepayProductId,
          customer: { name: clientName },
          planName: plano.nome,
          returnUrl: window.location.origin + '/planos-recorrentes',
          ...(apiKey ? { apiKey } : {}),
        }),
      });
      const result = await res.json();
      if (result.success && result.data?.url) {
        addSubscription({
          planId: plano.id,
          abacatepaySubscriptionId: result.data.id,
          clientName: clientName,
          status: result.data.status || 'pending',
        });
        setSubscriptionModal({ open: true, plano, loading: false, url: result.data.url });
        showToast('success', 'Assinatura criada! Redirecionando para pagamento...');
        // Redireciona para o checkout AbacatePay
        setTimeout(() => {
          window.open(result.data.url, '_blank');
        }, 1500);
      } else {
        setSubscriptionModal({ open: false, plano: null, loading: false, url: '' });
        showToast('error', result.error || 'Erro ao criar assinatura.');
      }
    } catch (err) {
      setSubscriptionModal({ open: false, plano: null, loading: false, url: '' });
      showToast('error', 'Erro de conexão ao criar assinatura.');
    }
  };

  return (
    <div className="animate-fade-in pb-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-semibold flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-sage dark:bg-sage-dark text-white'
              : toast.type === 'info'
                ? 'bg-gold dark:bg-gold-dark text-white'
                : 'bg-rose dark:bg-rose-dark text-white'
          }`}>
            <span>{toast.type === 'success' ? '✅' : toast.type === 'info' ? 'ℹ️' : '⚠️'}</span>
            {toast.msg}
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

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
            onAssinar={handleAssinar}
            onSync={handleSync}
          />
        ))}
        {planos.length === 0 && (
          <div className="card col-span-full py-16 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
            Nenhum plano cadastrado. Crie o primeiro plano!
          </div>
        )}
      </div>

      {/* Modal Novo Plano */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Plano Recorrente" maxWidth="max-w-sm">
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

      {/* Subscription Modal */}
      <Modal open={subscriptionModal.open} onClose={() => setSubscriptionModal({ open: false, plano: null, loading: false, url: '' })} title="Assinar Plano" maxWidth="max-w-sm">
        <div className="p-5 text-center space-y-4">
          {subscriptionModal.loading ? (
            <>
              <div className="flex justify-center">
                <svg className="animate-spin h-10 w-10 text-brand" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm text-ink-soft">Criando assinatura no gateway de pagamento...</p>
            </>
          ) : subscriptionModal.url ? (
            <>
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="font-display text-lg font-semibold">Assinatura criada!</h3>
              <p className="text-sm text-ink-soft">
                Redirecionando para o checkout seguro da AbacatePay para concluir o pagamento.
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={subscriptionModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                >
                  Ir para o pagamento
                </a>
                <button
                  onClick={() => setSubscriptionModal({ open: false, plano: null, loading: false, url: '' })}
                  className="btn-ghost btn-sm"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
