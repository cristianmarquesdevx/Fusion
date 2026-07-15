/** @format */

import React, { useState } from 'react';
import { useClientStore, useUIStore } from '../store';
import { SearchInput } from '../components/ui';
import { ProntuarioModal, AnamneseForm } from '../components/clientes';
import Modal from '../components/ui/Modal';

/* ─── Card de cliente compacto ─── */
function ClientCard({ cliente, onClick, idx }) {
  const initials = cliente.nome
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?';

  return (
    <button
      onClick={onClick}
      className="card p-3.5 text-left animate-fade-in-up hover:ring-1 hover:ring-brand/30 dark:hover:ring-brand-dark/30 transition-all active:scale-[0.98]"
      style={{ animationDelay: `${idx * 0.04}s` }}
    >
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-soft to-brand-dark-soft flex items-center justify-center text-[11px] font-bold text-brand dark:text-brand-dark shrink-0">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-ink dark:text-ink-dark truncate">
            {cliente.nome}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-ink-faint dark:text-ink-dark-faint mt-0.5">
            <span>{cliente.tel}</span>
            <span className="w-1 h-1 rounded-full bg-border dark:bg-border-dark" />
            <span className={`tag text-[9px] font-semibold ${
              cliente.status === 'Em dia'
                ? 'bg-sage-soft/20 dark:bg-sage-dark-soft/20 text-sage dark:text-sage-dark'
                : 'bg-gold-soft/20 dark:bg-gold-dark-soft/20 text-gold dark:text-gold-dark'
            }`}>
              {cliente.status}
            </span>
          </div>
        </div>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-ink-faint dark:text-ink-dark-faint shrink-0">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}

/* ════════════════════════════════════ */
export default function Prontuario() {
  const { clients, searchTerm, setSearchTerm, prontData, saveAnamnese } = useClientStore();
  const addNotification = useUIStore((s) => s.addNotification);
  const [selectedClient, setSelectedClient] = useState(null);
  const [novaAnamneseOpen, setNovaAnamneseOpen] = useState(false);
  const [selectedClientForAnamnese, setSelectedClientForAnamnese] = useState(null);

  // Search logic (same as Clientes page)
  const filtered = searchTerm?.trim()
    ? clients.filter((c) =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.tel.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : clients;

  const handleClientClick = (cliente) => {
    const pront = prontData[cliente.nome];
    if (pront) {
      setSelectedClient(pront);
    }
  };

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="flex items-start gap-5 mb-8">
        <img
          src="/LOGO.png"
          alt="Fusion ERP"
          className="w-14 h-14 object-contain rounded-2xl shadow-md ring-1 ring-black/5 shrink-0 mt-1"
        />
        <div>
          <div className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-[1.2px] mb-1.5">
            Atendimento
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
            Prontuário Eletrônico
          </h1>
          <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
            Selecione um cliente abaixo para visualizar o prontuário completo com dados pessoais, histórico, pacotes e anotações.
          </p>
        </div>
      </div>

      {/* Search + New Anamnese Button */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="max-w-md flex-1 min-w-[200px]">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar cliente por nome ou telefone…"
          />
        </div>
        <button
          onClick={() => setNovaAnamneseOpen(true)}
          className="btn whitespace-nowrap"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo Prontuário / Anamnese
        </button>
      </div>

      {/* Client grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.length > 0 ? filtered.map((cliente, i) => (
          <ClientCard
            key={cliente.id}
            cliente={cliente}
            onClick={() => handleClientClick(cliente)}
            idx={i}
          />
        )) : (
          <div className="card col-span-full py-16 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
            {searchTerm?.trim()
              ? 'Nenhum cliente encontrado com este nome ou telefone.'
              : 'Nenhum cliente cadastrado.'}
          </div>
        )}
      </div>

      {/* Prontuário Modal */}
      {selectedClient && (
        <ProntuarioModal
          open={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          data={selectedClient}
        />
      )}

      {/* Nova Anamnese Modal — selecionar cliente e abrir formulário */}
      <Modal
        open={novaAnamneseOpen}
        onClose={() => { setNovaAnamneseOpen(false); setSelectedClientForAnamnese(null); }}
        title="Nova Anamnese / Prontuário"
        width="600px"
      >
        {!selectedClientForAnamnese ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft dark:text-ink-dark-soft mb-4">
              Selecione o cliente para criar um novo prontuário/anamnese:
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
              {clients.length > 0 ? clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientForAnamnese(c)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border dark:border-border-dark hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-all text-left w-full"
                >
                  <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-soft to-brand-dark-soft flex items-center justify-center text-xs font-bold text-brand dark:text-brand-dark">
                    {c.nome?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '?'}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-ink dark:text-ink-dark">{c.nome}</div>
                    <div className="text-xs text-ink-faint dark:text-ink-dark-faint">{c.tel}</div>
                  </div>
                  <svg className="w-4 h-4 text-ink-faint ml-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )) : (
                <p className="text-sm text-ink-faint dark:text-ink-dark-faint text-center py-8">
                  Nenhum cliente cadastrado. Cadastre um cliente primeiro.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border dark:border-border-dark">
              <button
                onClick={() => setSelectedClientForAnamnese(null)}
                className="text-xs text-brand dark:text-brand-dark font-semibold hover:underline"
              >
                &larr; Voltar
              </button>
              <span className="text-sm font-semibold text-ink dark:text-ink-dark">
                {selectedClientForAnamnese.nome}
              </span>
            </div>
            <AnamneseForm
              clientName={selectedClientForAnamnese.nome}
              onSave={() => {
                addNotification({
                  type: 'success',
                  title: 'Anamnese salva!',
                  message: `Anamnese de ${selectedClientForAnamnese.nome} registrada com sucesso.`,
                });
                setNovaAnamneseOpen(false);
                setSelectedClientForAnamnese(null);
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
