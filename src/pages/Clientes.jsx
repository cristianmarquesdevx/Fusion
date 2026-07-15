/** @format */

import React, { useState, useEffect, useRef } from 'react';
import { useClientStore, useUIStore, useAuthStore } from '../store';
import { SearchInput, StatusChip, Pagination, ConfirmDialog } from '../components/ui';
import { CadastroModal, ProntuarioModal } from '../components/clientes';
import { exportToCSV } from '../utils/export';

export default function Clientes() {
  const {
    searchTerm,
    setSearchTerm,
    activeFilters,
    setFilter,
    clearFilters,
    getFilteredClients,
    filterOptions,
    prontData,
    total,
    loadFromSupabase,
  } = useClientStore();

  const user = useAuthStore((s) => s.user);
  const filteredClients = useClientStore((s) => s.getFilteredClients());
  const deleteClient = useClientStore((s) => s.deleteClient);
  const addNotification = useUIStore((s) => s.addNotification);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [prontOpen, setProntOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const filterRef = useRef(null);

  // Carrega clientes do Supabase com fallback garantido para dados locais
  useEffect(() => {
    loadFromSupabase().catch(() => {
      // Fallback silencioso — dados locais sempre disponíveis
    });
  }, [loadFromSupabase]);

  // Close filter menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setFilterMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleRowClick = (client) => {
    const pront = prontData[client.nome];
    if (pront) {
      setSelectedClient(pront);
      setProntOpen(true);
    }
  };

  const handleEdit = (e, client) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditModalOpen(true);
  };

  const handleDelete = async (e, id, nome) => {
    e.stopPropagation();
    setConfirmDelete({ id, nome });
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    deleteClient(confirmDelete.id);
    addNotification({ type: 'success', title: 'Cliente excluído', message: `${confirmDelete.nome} foi removido(a).` });
    setConfirmDelete(null);
  };

  const handleExport = () => {
    const rows = filteredClients.map((c) => ({
      Nome: c.nome,
      Telefone: c.tel,
      Email: c.email,
      'Última Visita': c.ultima,
      'Pacote Ativo': c.pacote,
      Status: c.status,
    }));
    exportToCSV(rows, `clientes-${new Date().toISOString().split('T')[0]}.csv`, ['Nome', 'Telefone', 'Email', 'Última Visita', 'Pacote Ativo', 'Status']);
    addNotification({ type: 'success', title: 'Exportado!', message: 'Arquivo CSV gerado com sucesso.' });
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / pageSize);
  const paginatedClients = filteredClients.slice(page * pageSize, (page + 1) * pageSize);
  useEffect(() => { setPage(0); }, [searchTerm, activeFilters]);

  return (
    <div className="animate-fade-in">
      {/* Page head */}
      <div className="mb-7">
        <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
          Atendimento
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink dark:text-ink-dark mb-1.5">
          Clientes
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft">
          {total} clientes cadastradas em {user?.company || 'Vitta Jardins'}. Toque em uma linha para abrir o prontuário completo.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar por nome, telefone ou CPF"
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

          {/* Filter dropdown */}
          {filterMenuOpen && (
            <div className="absolute top-full left-0 mt-1.5 z-30 w-56 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] animate-scale-in">
              <div className="p-3 border-b border-border dark:border-border-dark">
                <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wider">
                  Status
                </div>
              </div>
              <div className="p-2 space-y-0.5">
                {filterOptions.status.map((opt) => {
                  const isActive = activeFilters.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setFilter('status', isActive ? null : opt.value)}
                      className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                        isActive
                          ? 'bg-brand-soft/10 dark:bg-brand-dark-soft/10 text-brand dark:text-brand-dark font-medium'
                          : 'text-ink dark:text-ink-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
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
          )}
        </div>

        {/* Result counter */}
        <span className="text-xs text-ink-faint dark:text-ink-dark-faint">
          {filteredClients.length} de {total}
        </span>

        <div className="flex-1 min-w-0" />

        {/* Export button */}
        <button
          onClick={handleExport}
          disabled={filteredClients.length === 0}
          className="btn-ghost btn-sm whitespace-nowrap"
          title="Exportar CSV"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          Exportar
        </button>

        {/* Nova cliente button */}
        <button onClick={() => setCadastroOpen(true)} className="btn whitespace-nowrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nova cliente
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Cliente', 'Contato', 'Última visita', 'Pacote ativo', 'Status', ''].map((h) => (
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
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
                    {searchTerm || activeFilterCount > 0
                      ? 'Nenhum cliente encontrado com os critérios de busca.'
                      : 'Nenhum cliente cadastrado.'}
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => handleRowClick(client)}
                    className="transition-colors duration-150 hover:bg-surface-2 dark:hover:bg-surface-dark-2 cursor-pointer"
                  >
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <div className="text-sm font-medium text-ink dark:text-ink-dark">
                        {client.nome}
                      </div>
                      <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                        Cliente desde {client.desde}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                      {client.tel}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark">
                      {client.ultima}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-ink-soft dark:text-ink-dark-soft border-b border-border dark:border-border-dark max-w-[200px] truncate">
                      {client.pacote}
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark">
                      <StatusChip status={client.status} />
                    </td>
                    <td className="px-4 py-3.5 border-b border-border dark:border-border-dark text-right">
                      <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleEdit(e, client)}
                          className="w-7 h-7 flex items-center justify-center rounded-sm text-ink-faint dark:text-ink-dark-faint hover:text-brand dark:hover:text-brand-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                          aria-label={`Editar ${client.nome}`}
                          title="Editar"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, client.id, client.nome)}
                          className="w-7 h-7 flex items-center justify-center rounded-sm text-ink-faint dark:text-ink-dark-faint hover:text-rose dark:hover:text-rose-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
                          aria-label={`Excluir ${client.nome}`}
                          title="Excluir"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
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
          totalItems={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(0); }}
        />
      </div>

      {/* Cadastro Modal */}
      <CadastroModal open={cadastroOpen} onClose={() => setCadastroOpen(false)} />

      {/* Editar Modal */}
      <CadastroModal
        open={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingClient(null); }}
        editingClient={editingClient}
      />

      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Excluir cliente?"
        message={confirmDelete ? `Tem certeza que deseja excluir ${confirmDelete.nome}? Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Prontuário Modal */}
      <ProntuarioModal
        open={prontOpen}
        onClose={() => {
          setProntOpen(false);
          setSelectedClient(null);
        }}
        data={selectedClient}
      />
    </div>
  );
}
