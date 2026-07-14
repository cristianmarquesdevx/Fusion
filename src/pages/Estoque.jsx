/** @format */

import React, { useState, useEffect, useRef } from 'react';
import { useEstoqueStore, useUIStore } from '../store';
import { SearchInput, StatusChip, ConfirmDialog } from '../components/ui';
import { EntradaModal, EditItemModal } from '../components/estoque';
import { EstoqueSkeleton } from '../components/dashboard';

function StockBar({ current, min }) {
  const ratio = Math.min(current / min, 1);
  let color = 'bg-sage dark:bg-sage-dark';
  let label = 'Normal';
  if (current < min * 0.5) {
    color = 'bg-rose dark:bg-rose-dark';
    label = 'Crítico';
  } else if (current < min) {
    color = 'bg-gold dark:bg-gold-dark';
    label = 'Baixo';
  }
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <div className="w-16 h-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(ratio * 100, 4)}%` }}
        />
      </div>
      <span className={`font-mono text-sm font-semibold ${
        current < min ? 'text-rose dark:text-rose-dark' : current < min * 1.5 ? 'text-gold dark:text-gold-dark' : 'text-ink-soft dark:text-ink-dark-soft'
      }`}>
        {current} {current === 1 ? 'un.' : 'un.'}
      </span>
    </div>
  );
}

export default function Estoque() {
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setFilter,
    clearFilters,
    categorias,
    deleteItem,
  } = useEstoqueStore();

  const filteredItems = useEstoqueStore((s) => s.getFilteredItems());
  const resumo = useEstoqueStore((s) => s.getResumo());
  const entries = useEstoqueStore((s) => s.entries);
  const loadFromSupabase = useEstoqueStore((s) => s.loadFromSupabase);
  const addNotification = useUIStore((s) => s.addNotification);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterSection, setFilterSection] = useState(null);
  const filterRef = useRef(null);

  // Load from Supabase on mount
  useEffect(() => { loadFromSupabase(); }, [loadFromSupabase]);

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

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return <EstoqueSkeleton />;

  const activeFilterCount = Object.keys(activeFilters).length;
  const hasCriticos = resumo.criticos > 0;

  const handleFilterSection = (section) => {
    setFilterSection(filterSection === section ? null : section);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditModalOpen(true);
  };

  const handleDelete = (e, item) => {
    e.stopPropagation();
    setConfirmDelete(item);
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteItem(confirmDelete.id);
    addNotification({ type: 'success', title: 'Item excluído', message: `"${confirmDelete.nome}" foi removido do estoque.` });
    setConfirmDelete(null);
  };

  const renderFilterDropdown = () => {
    if (!filterMenuOpen) return null;
    return (
      <div className="absolute top-full left-0 mt-1.5 z-30 w-60 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-scale-in">
        {/* Categoria */}
        <div className="border-b border-border dark:border-border-dark">
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
              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter('categoria', activeFilters.categoria === cat ? null : cat)}
                  className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                    activeFilters.categoria === cat
                      ? 'bg-brand-soft/10 dark:bg-brand-dark-soft/10 text-brand dark:text-brand-dark font-medium'
                      : 'text-ink dark:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
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
              {[
                { label: 'Crítico', value: 'critico' },
                { label: 'Baixo', value: 'baixo' },
                { label: 'Normal', value: 'normal' },
              ].map((opt) => (
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
          Operações
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-1.5">
          Estoque
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft max-w-[540px]">
          Baixa automática a cada procedimento registrado. {hasCriticos ? `${resumo.criticos} itens precisam de reposição.` : 'Todos os itens estão em nível adequado.'}
        </p>
      </div>

      {/* Mini KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">Total de itens</div>
          <div className="font-mono text-2xl font-medium tracking-tight text-ink dark:text-ink-dark">{resumo.total}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">Estoque normal</div>
          <div className="font-mono text-2xl font-medium tracking-tight text-sage dark:text-sage-dark">{resumo.normais}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">Estoque baixo</div>
          <div className="font-mono text-2xl font-medium tracking-tight text-gold dark:text-gold-dark">{resumo.baixos}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium mb-1">Estoque crítico</div>
          <div className="font-mono text-2xl font-medium tracking-tight text-rose dark:text-rose-dark">{resumo.criticos}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar item ou lote"
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
            Categorias
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
          {filteredItems.length} de {resumo.total}
        </span>

        <div className="flex-1 min-w-0" />

        {/* Registrar entrada button */}
        <button onClick={() => setModalOpen(true)} className="btn whitespace-nowrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Registrar entrada
        </button>
      </div>

      {/* Items table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Item', 'Categoria', 'Quantidade', 'Mínimo', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-4 pb-3 pt-4 border-b border-border dark:border-border-dark"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="stagger-enter">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
                    {searchTerm || activeFilterCount > 0
                      ? 'Nenhum item encontrado com os critérios de busca.'
                      : 'Nenhum item cadastrado no estoque.'}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const ratio = item.qtd / item.minimo;
                  let statusLabel = 'Normal';
                  let statusType = 'ok';
                  if (ratio < 0.5) { statusLabel = 'Crítico'; statusType = 'crit'; }
                  else if (ratio < 1) { statusLabel = 'Baixo'; statusType = 'warn'; }

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors duration-150 hover:bg-surface-2 dark:hover:bg-surface-dark-2"
                    >
                      <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                        <div className="text-sm font-medium text-ink dark:text-ink-dark">
                          {item.nome}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                        {item.categoria}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                        <StockBar current={item.qtd} min={item.minimo} />
                      </td>
                      <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft font-mono border-b border-border dark:border-border-dark">
                        {item.minimo} {item.unidade}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                        <StatusChip status={statusType} />
                      </td>
                      <td className="px-4 py-3.5 border-b border-border dark:border-border-dark text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handleEdit(item)}
                            className="w-7 h-7 flex items-center justify-center rounded-sm text-ink-faint dark:text-ink-dark-faint hover:text-brand dark:hover:text-brand-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                            aria-label={`Editar ${item.nome}`}
                            title="Editar"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, item)}
                            className="w-7 h-7 flex items-center justify-center rounded-sm text-ink-faint dark:text-ink-dark-faint hover:text-rose dark:hover:text-rose-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                            aria-label={`Excluir ${item.nome}`}
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
      </div>

      {/* Log de entradas */}
      <div className="card mt-5">
        <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
              Log de entradas
            </h2>
            <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
              {entries.length > 0
                ? `${entries.length} entrada(s) registrada(s)`
                : 'Nenhuma entrada registrada ainda'}
            </div>
          </div>
        </div>
        {entries.length > 0 ? (
          <div className="overflow-x-auto px-5 pb-5">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">Item</th>
                  <th className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">Quantidade</th>
                  <th className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">Valor unit.</th>
                  <th className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">Total</th>
                  <th className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">Fornecedor</th>
                  <th className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark">Data</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="transition-colors duration-150 hover:bg-surface-2 dark:hover:bg-surface-dark-2">
                    <td className="px-3 py-3 text-sm text-ink dark:text-ink-dark border-b border-border dark:border-border-dark">{entry.itemNome}</td>
                    <td className="px-3 py-3 text-sm text-ink-soft dark:text-ink-dark-soft font-mono border-b border-border dark:border-border-dark">+{entry.quantidade}</td>
                    <td className="px-3 py-3 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                      {entry.valorUnit ? `R$ ${entry.valorUnit.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-ink dark:text-ink-dark font-mono font-semibold border-b border-border dark:border-border-dark">
                      {entry.valorUnit ? `R$ ${(entry.quantidade * entry.valorUnit).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">{entry.fornecedor || '—'}</td>
                    <td className="px-3 py-3 text-sm text-ink-soft dark:text-ink-dark-soft font-mono border-b border-border dark:border-border-dark">
                      {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 pb-5">
            <div className="py-8 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
              <div className="flex justify-center mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                  <path d="M21 8l-9-5-9 5 9 5 9-5z" />
                  <path d="M3 8v9l9 5 9-5V8M12 13v9" />
                </svg>
              </div>
              Nenhuma entrada registrada ainda.
              <div className="mt-1">Use o botão "Registrar entrada" para adicionar itens ao estoque.</div>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <EntradaModal open={modalOpen} onClose={() => setModalOpen(false)} />
      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir item?"
        message={confirmDelete ? `Tem certeza que deseja excluir "${confirmDelete.nome}" do estoque? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

      <EditItemModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingItem(null); }}
        editingItem={editingItem}
      />
    </div>
  );
}
