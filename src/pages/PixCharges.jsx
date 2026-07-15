/** @format */

import React, { useState, useEffect, useRef } from 'react';
import { usePixChargesStore, getStatusInfo, useUIStore, useAuthStore } from '../store';
import { SearchInput, StatusChip, Pagination, Modal } from '../components/ui';
import { Helpers } from '../utils';
import { exportToCSV } from '../utils/export';

/** Formata data ISO para exibição */
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formata valor em reais */
function formatAmount(amount) {
  return Helpers.formatCurrency(Number(amount) || 0);
}

/** Badge de fonte */
function SourceBadge({ source }) {
  const colors = {
    public_booking: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    pdv: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    planos: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    manual: 'bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft',
    test: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
    test_integracao: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300',
  };
  const colorClass = colors[source] || colors.manual;
  const label = {
    public_booking: 'Agendamento',
    pdv: 'PDV',
    planos: 'Planos',
    manual: 'Manual',
    test: 'Teste',
    test_integracao: 'Teste',
  }[source] || source;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colorClass}`}>
      {label}
    </span>
  );
}

/** Modal de detalhes da cobrança */
function ChargeDetailModal({ charge, open, onClose }) {
  if (!charge) return null;
  const statusInfo = getStatusInfo(charge.status);

  const fields = [
    { label: 'ID Externo', value: charge.external_id, mono: true },
    { label: 'ID AbacatePay', value: charge.abacatepay_id || '—', mono: true },
    { label: 'Cliente', value: charge.customer_name || '—' },
    { label: 'Email', value: charge.customer_email || '—' },
    { label: 'Telefone', value: charge.customer_cellphone || '—' },
    { label: 'Valor', value: formatAmount(charge.amount), highlight: true },
    { label: 'Descrição', value: charge.description || '—' },
    { label: 'Status', value: statusInfo.label, chip: true, color: statusInfo.color },
    { label: 'Fonte', value: charge.source || '—' },
    { label: 'Criada em', value: formatDate(charge.created_at) },
    { label: 'Paga em', value: formatDate(charge.paid_at) },
    { label: 'Expira em', value: formatDate(charge.expires_at) },
    { label: 'Expirada em', value: formatDate(charge.expired_at) },
    { label: 'Agendamento', value: charge.agendamento_id || '—', mono: true },
    { label: 'Venda PDV', value: charge.venda_id || '—', mono: true },
    { label: 'Assinatura', value: charge.assinatura_id || '—', mono: true },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Detalhes da Cobrança PIX">
      <div className="space-y-0 max-h-[60vh] overflow-y-auto pr-1">
        {fields.map((f) => (
          <div
            key={f.label}
            className="flex items-start gap-4 py-2.5 border-b border-border dark:border-border-dark last:border-0"
          >
            <span className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint w-28 flex-shrink-0 pt-0.5">
              {f.label}
            </span>
            <div className="flex-1 min-w-0">
              {f.chip ? (
                <StatusChip status={f.value} />
              ) : (
                <span
                  className={`text-sm text-ink dark:text-ink-dark break-words ${
                    f.highlight ? 'font-semibold text-brand dark:text-brand-dark text-base' : ''
                  } ${f.mono ? 'font-mono text-xs' : ''}`}
                >
                  {f.value}
                </span>
              )}
            </div>
          </div>
        ))}

        {charge.last_webhook_payload && (
          <div className="pt-3">
            <span className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint block mb-1.5">
              Último Webhook
            </span>
            <pre className="text-[11px] font-mono bg-surface-2 dark:bg-surface-dark-2 rounded-sm p-3 overflow-x-auto text-ink-soft dark:text-ink-dark-soft max-h-32">
              {typeof charge.last_webhook_payload === 'string'
                ? charge.last_webhook_payload
                : JSON.stringify(charge.last_webhook_payload, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border dark:border-border-dark">
        {charge.br_code && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(charge.br_code);
            }}
            className="btn-ghost btn-sm"
          >
            Copiar PIX
          </button>
        )}
        <button onClick={onClose} className="btn btn-sm">
          Fechar
        </button>
      </div>
    </Modal>
  );
}

export default function PixCharges() {
  const {
    charges,
    loading,
    error,
    filters,
    setFilter,
    clearFilters,
    getFilteredCharges,
    getResumo,
    getSources,
    loadCharges,
    updateStatus,
  } = usePixChargesStore();

  const addNotification = useUIStore((s) => s.addNotification);
  const user = useAuthStore((s) => s.user);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const filterRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    loadCharges();
  }, [loadCharges]);

  // Close filter menu on click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [filters]);

  const filteredCharges = getFilteredCharges();
  const resumo = getResumo();
  const sources = getSources();

  const paginatedCharges = filteredCharges.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredCharges.length / pageSize);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const openDetail = (charge) => {
    setSelectedCharge(charge);
    setDetailOpen(true);
  };

  const handleRefresh = async () => {
    await loadCharges();
    addNotification({ type: 'info', title: 'Atualizado', message: 'Lista de cobranças atualizada.' });
  };

  return (
    <div className="animate-fade-in">
      {/* Page head */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Gestão
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-1.5">
          Cobranças PIX
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft max-w-[600px]">
          Acompanhe todas as cobranças PIX geradas pelo sistema. Status atualizado em tempo real via webhook.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wide mb-1">
            Total
          </div>
          <div className="font-display text-xl font-semibold text-ink dark:text-ink-dark">
            {resumo.total}
          </div>
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">
            {Helpers.formatCurrency(resumo.totalAmount)} em cobranças
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wide mb-1">
            Pendentes
          </div>
          <div className="font-display text-xl font-semibold text-amber-600 dark:text-amber-400">
            {resumo.pending}
          </div>
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">
            Aguardando pagamento
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wide mb-1">
            Pagos
          </div>
          <div className="font-display text-xl font-semibold text-sage dark:text-sage-dark">
            {resumo.paid}
          </div>
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">
            Confirmados via webhook
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wide mb-1">
            Falhas
          </div>
          <div className="font-display text-xl font-semibold text-rose dark:text-rose-dark">
            {resumo.failed}
          </div>
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5">
            Expirados ou com falha
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-sm bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-sm text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput
          value={filters.searchTerm}
          onChange={(v) => setFilter('searchTerm', v)}
          placeholder="Buscar por cliente, ID ou descrição"
          className="max-w-xs w-full"
        />

        {/* Filter button */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-sm text-sm font-medium border transition-colors ${
              activeFilterCount > 0
                ? 'border-brand dark:border-brand-dark text-brand dark:text-brand-dark bg-brand-soft/10 dark:bg-brand-dark-soft/10'
                : 'border-border dark:border-border-dark text-ink-soft dark:text-ink-dark-soft bg-surface dark:bg-surface-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <path d="M4 6h16M8 12h8M11 18h2" />
            </svg>
            Filtrar
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {filterMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-30 w-64 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-scale-in">
              {/* Status */}
              <div className="p-3 border-b border-border dark:border-border-dark">
                <label className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint mb-1.5 block">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilter('status', e.target.value)}
                  className="w-full rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2.5 py-1.5 text-sm text-ink dark:text-ink-dark"
                >
                  <option value="">Todos</option>
                  <option value="PENDING">Pendente</option>
                  <option value="PAID">Pago</option>
                  <option value="FAILED">Falhou</option>
                  <option value="EXPIRED">Expirado</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="REFUNDED">Reembolsado</option>
                </select>
              </div>

              {/* Source */}
              {sources.length > 0 && (
                <div className="p-3 border-b border-border dark:border-border-dark">
                  <label className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint mb-1.5 block">
                    Origem
                  </label>
                  <select
                    value={filters.source}
                    onChange={(e) => setFilter('source', e.target.value)}
                    className="w-full rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2.5 py-1.5 text-sm text-ink dark:text-ink-dark"
                  >
                    <option value="">Todas</option>
                    {sources.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date range */}
              <div className="p-3 border-b border-border dark:border-border-dark space-y-2">
                <label className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint block">
                  Período
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilter('dateFrom', e.target.value)}
                    className="w-full rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2.5 py-1.5 text-sm text-ink dark:text-ink-dark"
                    placeholder="De"
                  />
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilter('dateTo', e.target.value)}
                    className="w-full rounded-sm border border-border dark:border-border-dark bg-surface dark:bg-surface-dark px-2.5 py-1.5 text-sm text-ink dark:text-ink-dark"
                    placeholder="Até"
                  />
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="p-2">
                  <button
                    onClick={() => { clearFilters(); setFilterMenuOpen(false); }}
                    className="w-full text-center px-3 py-2 rounded-sm text-sm text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Result counter */}
        <span className="text-xs text-ink-faint dark:text-ink-dark-faint">
          {filteredCharges.length} de {charges.length}
        </span>

        <div className="flex-1 min-w-0" />

        {/* Refresh button */}
        <button onClick={handleRefresh} disabled={loading} className="btn-ghost btn-sm whitespace-nowrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}>
            <path d="M1 4v6h6M23 20v-6h-6" />
            <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
          </svg>
          Atualizar
        </button>

        {/* Export button */}
        <button
          onClick={() => {
            const rows = filteredCharges.map((c) => ({
              'ID Externo': c.external_id,
              Cliente: c.customer_name,
              'Valor (R$)': (Number(c.amount) || 0).toFixed(2),
              Status: getStatusInfo(c.status).label,
              Origem: c.source,
              Criada: formatDate(c.created_at),
              Paga: formatDate(c.paid_at),
              Descrição: c.description,
            }));
            exportToCSV(rows, `cobrancas-pix-${new Date().toISOString().split('T')[0]}.csv`);
            addNotification({ type: 'success', title: 'Exportado!', message: 'CSV gerado com sucesso.' });
          }}
          disabled={filteredCharges.length === 0}
          className="btn-ghost btn-sm whitespace-nowrap"
          title="Exportar CSV"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Exportar
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
              Cobranças PIX
            </h2>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
              {filteredCharges.length} cobrança{filteredCharges.length !== 1 ? 's' : ''} encontrada{filteredCharges.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="text-xs font-semibold text-brand dark:text-brand-dark whitespace-nowrap hover:underline underline-offset-2 transition-all"
          >
            {loading ? 'Carregando…' : 'Atualizar lista →'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Cliente', 'Valor', 'Status', 'Origem', 'Data', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-4 pb-3 pt-0 border-b border-border dark:border-border-dark"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="stagger-enter">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-brand" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Carregando cobranças…
                    </div>
                  </td>
                </tr>
              ) : filteredCharges.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
                    {activeFilterCount > 0
                      ? 'Nenhuma cobrança encontrada com os filtros atuais.'
                      : 'Nenhuma cobrança PIX registrada. As cobranças aparecerão aqui quando clientes realizarem agendamentos.'}
                  </td>
                </tr>
              ) : (
                paginatedCharges.map((charge) => (
                  <tr
                    key={charge.id || charge.external_id}
                    className="transition-colors duration-150 hover:bg-surface-2 dark:hover:bg-surface-dark-2 cursor-pointer"
                    onClick={() => openDetail(charge)}
                  >
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <div className="text-sm font-medium text-ink dark:text-ink-dark">
                        {charge.customer_name || '—'}
                      </div>
                      {charge.description && (
                        <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5 truncate max-w-[200px]">
                          {charge.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-mono font-semibold text-ink dark:text-ink-dark border-b border-border dark:border-border-dark">
                      {formatAmount(charge.amount)}
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <StatusChip status={getStatusInfo(charge.status).label} />
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <SourceBadge source={charge.source} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark font-mono whitespace-nowrap">
                      {formatDate(charge.created_at)}
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); openDetail(charge); }}
                        className="w-7 h-7 flex items-center justify-center rounded-sm text-ink-faint dark:text-ink-dark-faint hover:text-brand dark:hover:text-brand-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                        aria-label="Ver detalhes"
                        title="Detalhes"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredCharges.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
        />
      </div>

      {/* Detail Modal */}
      <ChargeDetailModal
        charge={selectedCharge}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedCharge(null); }}
      />
    </div>
  );
}
