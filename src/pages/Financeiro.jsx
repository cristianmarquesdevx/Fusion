/** @format */

import React, { useState, useEffect, useRef } from 'react';
import { useFinanceiroStore, useUIStore, useAuthStore } from '../store';
import { Helpers } from '../utils';
import { SearchInput, StatusChip, Pagination, ConfirmDialog } from '../components/ui';
import { KPICard, FinanceiroSkeleton } from '../components/dashboard';
import { TransacaoModal } from '../components/financeiro';
import { exportToCSV, confirmAction } from '../utils/export';

export default function Financeiro() {
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setFilter,
    clearFilters,
    kpis,
    filterOptions,
  } = useFinanceiroStore();

  const filteredTransacoes = useFinanceiroStore((s) => s.getFilteredTransacoes());
  const resumo = useFinanceiroStore((s) => s.getResumo());
  const deleteTransacao = useFinanceiroStore((s) => s.deleteTransacao);
  const loadFromSupabase = useFinanceiroStore((s) => s.loadFromSupabase);
  const addNotification = useUIStore((s) => s.addNotification);
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterSection, setFilterSection] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const filterRef = useRef(null);

  // Load from Supabase on mount
  useEffect(() => { loadFromSupabase(); }, [loadFromSupabase]);

  // Simula carregamento inicial
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterMenuOpen(false);
        setFilterSection(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Reset to page 0 when filters change
  useEffect(() => { setPage(0); }, [searchTerm, activeFilters]);

  // Pagination
  const paginatedTransacoes = filteredTransacoes.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredTransacoes.length / pageSize);

  if (loading) return <FinanceiroSkeleton />;

  const activeFilterCount = Object.keys(activeFilters).length;

  const handleFilterSection = (section) => {
    setFilterSection(filterSection === section ? null : section);
  };

  const renderFilterDropdown = () => {
    if (!filterMenuOpen) return null;
    return (
      <div className="absolute top-full left-0 mt-1.5 z-30 w-64 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-scale-in">
        {/* Tipo */}
        <div className="border-b border-border dark:border-border-dark">
          <button
            onClick={() => handleFilterSection('tipo')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
              filterSection === 'tipo' ? 'bg-surface-2 dark:bg-surface-dark-2' : ''
            } ${activeFilters.tipo ? 'text-brand dark:text-brand-dark' : 'text-ink dark:text-ink-dark'}`}
          >
            Tipo
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`w-3.5 h-3.5 transition-transform ${filterSection === 'tipo' ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {filterSection === 'tipo' && (
            <div className="px-3 pb-3 space-y-0.5">
              {filterOptions.tipo.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter('tipo', activeFilters.tipo === opt.value ? null : opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                    activeFilters.tipo === opt.value
                      ? 'bg-brand-soft/10 dark:bg-brand-dark-soft/10 text-brand dark:text-brand-dark font-medium'
                      : 'text-ink dark:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="border-b border-border dark:border-border-dark">
          <button
            onClick={() => handleFilterSection('status')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
              filterSection === 'status' ? 'bg-surface-2 dark:bg-surface-dark-2' : ''
            } ${activeFilters.status ? 'text-brand dark:text-brand-dark' : 'text-ink dark:text-ink-dark'}`}
          >
            Status
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`w-3.5 h-3.5 transition-transform ${filterSection === 'status' ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {filterSection === 'status' && (
            <div className="px-3 pb-3 space-y-0.5">
              {filterOptions.status.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter('status', activeFilters.status === opt.value ? null : opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                    activeFilters.status === opt.value
                      ? 'bg-brand-soft/10 dark:bg-brand-dark-soft/10 text-brand dark:text-brand-dark font-medium'
                      : 'text-ink dark:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categoria */}
        <div>
          <button
            onClick={() => handleFilterSection('categoria')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors ${
              filterSection === 'categoria' ? 'bg-surface-2 dark:bg-surface-dark-2' : ''
            } ${activeFilters.categoria ? 'text-brand dark:text-brand-dark' : 'text-ink dark:text-ink-dark'}`}
          >
            Categoria
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={`w-3.5 h-3.5 transition-transform ${filterSection === 'categoria' ? 'rotate-180' : ''}`}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {filterSection === 'categoria' && (
            <div className="px-3 pb-3 space-y-0.5">
              {filterOptions.categoria.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter('categoria', activeFilters.categoria === opt.value ? null : opt.value)}
                  className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                    activeFilters.categoria === opt.value
                      ? 'bg-brand-soft/10 dark:bg-brand-dark-soft/10 text-brand dark:text-brand-dark font-medium'
                      : 'text-ink dark:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {activeFilterCount > 0 && (
          <div className="p-2 border-t border-border dark:border-border-dark">
            <button
              onClick={() => { clearFilters(); setFilterMenuOpen(false); }}
              className="w-full text-center px-3 py-2 rounded-sm text-sm text-ink-faint dark:text-ink-dark-faint hover:text-ink dark:hover:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* Page head */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Gestão
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-1.5">
          Financeiro
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft max-w-[600px]">
          Visão consolidada de entradas, saídas e comissões de {user?.company || 'Vitta Jardins'} em {Helpers.getMonthName(new Date()).toLowerCase()}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <KPICard
          label={kpis.receita.label}
          value={kpis.receita.valor}
          format="currency"
          delta={kpis.receita.descricao}
          deltaType="up"
        />
        <KPICard
          label={kpis.despesas.label}
          value={kpis.despesas.valor}
          format="currency"
          delta={kpis.despesas.descricao}
          deltaType="down"
        />
        <KPICard
          label={kpis.lucro.label}
          value={kpis.lucro.valor}
          format="currency"
          delta={kpis.lucro.descricao}
          deltaType="up"
        />
        <KPICard
          label={kpis.comissoes.label}
          value={kpis.comissoes.valor}
          format="currency"
          delta={kpis.comissoes.descricao}
          deltaType="down"
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar transação"
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
          {renderFilterDropdown()}
        </div>

        {/* Result counter */}
        <span className="text-xs text-ink-faint dark:text-ink-dark-faint">
          {filteredTransacoes.length} de {resumo.totalTransacoes}
        </span>

        <div className="flex-1 min-w-0" />

        {/* Export button */}
        <button
          onClick={() => {
            const rows = filteredTransacoes.map((t) => ({
              Descrição: t.descricao,
              Categoria: t.categoria,
              Tipo: t.tipo === 'receita' ? 'Receita' : 'Despesa',
              Valor: t.valor.toFixed(2),
              Data: t.data,
              Status: t.status,
            }));
            exportToCSV(rows, `financeiro-${new Date().toISOString().split('T')[0]}.csv`);
            addNotification({ type: 'success', title: 'Exportado!', message: 'Arquivo CSV gerado com sucesso.' });
          }}
          disabled={filteredTransacoes.length === 0}
          className="btn-ghost btn-sm whitespace-nowrap"
          title="Exportar CSV"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Exportar
        </button>

        {/* Nova transação button */}
        <button onClick={() => setModalOpen(true)} className="btn whitespace-nowrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova transação
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
              Últimas transações
            </h2>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
              {filteredTransacoes.length} transações encontradas
            </div>
          </div>
          <button className="text-xs font-semibold text-brand dark:text-brand-dark whitespace-nowrap hover:underline underline-offset-2 transition-all">
            Exportar extrato &rarr;
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Descrição', 'Categoria', 'Data', 'Valor', 'Status', ''].map((h) => (
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
              {              filteredTransacoes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
                    {searchTerm || activeFilterCount > 0
                      ? 'Nenhuma transação encontrada com os critérios de busca.'
                      : 'Nenhuma transação registrada.'}
                  </td>
                </tr>
              ) : (
                paginatedTransacoes.map((transacao) => {
                  const isReceita = transacao.tipo === 'receita';
                  return (
                    <tr
                      key={transacao.id}
                      className="transition-colors duration-150 hover:bg-surface-2 dark:hover:bg-surface-dark-2"
                    >
                      <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                        <div className="text-sm font-medium text-ink dark:text-ink-dark flex items-center gap-2">
                          <span
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              isReceita ? 'bg-sage dark:bg-sage-dark' : 'bg-rose dark:bg-rose-dark'
                            }`}
                          />
                          {transacao.descricao}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                        {transacao.categoria}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark font-mono">
                        {transacao.data}
                      </td>
                      <td className={`px-4 py-3.5 text-sm font-mono font-semibold border-b border-border dark:border-border-dark ${
                        isReceita ? 'text-sage dark:text-sage-dark' : 'text-rose dark:text-rose-dark'
                      }`}>
                        {isReceita ? '' : '− '}{Helpers.formatCurrency(transacao.valor)}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <StatusChip status={transacao.status} />
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => { setEditingTransacao(transacao); setEditModalOpen(true); }}
                          className="w-7 h-7 flex items-center justify-center rounded-sm text-ink-faint dark:text-ink-dark-faint hover:text-brand dark:hover:text-brand-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                          aria-label={`Editar ${transacao.descricao}`}
                          title="Editar"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmDelete({ id: transacao.id, descricao: transacao.descricao })}
                          className="w-7 h-7 flex items-center justify-center rounded-sm text-ink-faint dark:text-ink-dark-faint hover:text-rose dark:hover:text-rose-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                          aria-label={`Excluir ${transacao.descricao}`}
                          title="Excluir"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filteredTransacoes.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
        />
      </div>

      {/* Modal — Nova transação */}
      <TransacaoModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Modal — Editar transação */}
      <TransacaoModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingTransacao(null); }}
        editingTransacao={editingTransacao}
      />

      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          deleteTransacao(confirmDelete.id);
          addNotification({ type: 'success', title: 'Excluído', message: 'Transação removida.' });
        }}
        title="Excluir transação?"
        message={confirmDelete ? `Tem certeza que deseja excluir a transação "${confirmDelete.descricao}"? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
