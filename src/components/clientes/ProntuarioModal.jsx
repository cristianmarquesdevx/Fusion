/** @format */

import React, { useState } from 'react';
import Modal from '../ui/Modal';
import StatusChip from '../ui/StatusChip';
import FidelityBars from './FidelityBars';
import AnamneseForm from './AnamneseForm';

const tabs = [
  { id: 'dados', label: 'Dados pessoais' },
  { id: 'anamnese', label: 'Anamnese' },
  { id: 'historico', label: 'Histórico' },
  { id: 'pacotes', label: 'Pacotes' },
  { id: 'anotacoes', label: 'Anotações' },
];

function getStatusClass(status) {
  if (status === 'Concluído' || status === 'Pago') return 'ok';
  if (status === 'Em atendimento' || status === 'Aguardando') return 'warn';
  if (status === 'Atrasado' || status === 'Pendente') return 'crit';
  return 'default';
}

export default function ProntuarioModal({ open, onClose, data }) {
  const [activeTab, setActiveTab] = useState('dados');

  if (!open || !data) return null;

  return (
    <Modal open={open} onClose={onClose} title={data?.name || 'Prontuário'} width={activeTab === 'anamnese' ? '900px' : '680px'} description="Prontuário do cliente com dados pessoais, histórico, pacotes e anotações">
      {/* Tabs */}
      <div className="flex gap-0 -mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 mb-4 border-b border-border dark:border-border-dark shrink-0 overflow-x-auto sticky top-0 bg-surface dark:bg-surface-dark z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-brand dark:border-brand-dark text-ink dark:text-ink-dark'
                : 'border-transparent text-ink-faint dark:text-ink-dark-faint hover:text-ink-soft dark:hover:text-ink-dark-soft'
            }`}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? 'true' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ANAMNESE */}
      {activeTab === 'anamnese' && data && (
        <div className="animate-fade-in">
          <AnamneseForm clientName={data.name} />
        </div>
      )}

      {/* DADOS PESSOAIS */}
      {activeTab === 'dados' && data && (
        <div className="space-y-3 animate-fade-in">
          <Field label="Nome completo" value={data.name} />
          <Field label="CPF" value={data.cpf} />
          <Field label="Data de nasc." value={data.nasc} />
          <Field label="Telefone" value={data.tel} />
          <Field label="Email" value={data.email} />
          <Field label="Endereço" value={data.end} />
          <Field label="Cliente desde" value={data.desde} />
          <Field
            label="Fidelidade"
            value={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark">
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {data.fid}
              </span>
            }
          />
        </div>
      )}

      {/* HISTÓRICO */}
      {activeTab === 'historico' && data && (
        <div className="animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Data', 'Serviço', 'Profissional', 'Valor', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs uppercase tracking-wider text-ink-faint dark:text-ink-dark-faint font-semibold px-3 pb-3 border-b border-border dark:border-border-dark"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.historico || []).map((row, i) => (
                  <tr key={i} className="transition-colors duration-150 hover:bg-surface-2 dark:hover:bg-surface-dark-2">
                    {row.map((cell, j) => (
                      <td key={j} className="px-3 py-3.5 text-sm border-b border-border dark:border-border-dark">
                        {j === 4 ? (
                          <StatusChip status={getStatusClass(cell)} />
                        ) : (
                          <span className="text-ink dark:text-ink-dark">{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PACOTES + FIDELIDADE */}
      {activeTab === 'pacotes' && data && (
        <div className="animate-fade-in">
          {data.pacotes && data.pacotes.length > 0 ? (
            <div className="space-y-2">
              {data.pacotes.map((pkg, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-4 py-3 rounded-sm bg-surface-2 dark:bg-surface-dark-2"
                >
                  <div>
                    <div className="text-sm font-medium text-ink dark:text-ink-dark">{pkg.nome}</div>
                    <div className="text-xs text-ink-faint dark:text-ink-dark-faint mt-0.5">
                      {pkg.utilizado} de {pkg.total} sessões utilizadas · Válido até {pkg.valido}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-sage dark:text-sage-dark">
                    {pkg.utilizado}/{pkg.total}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-ink-faint dark:text-ink-dark-faint">
              Nenhum pacote ativo no momento.
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border dark:border-border-dark">
            <div className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mb-3">
              Fidelidade
            </div>
            <FidelityBars bars={data.fidBars} />
          </div>
        </div>
      )}

      {/* ANOTAÇÕES */}
      {activeTab === 'anotacoes' && data && (
        <div className="animate-fade-in">
          <textarea
            readOnly
            value={data.notes}
            className="w-full min-h-[140px] p-4 rounded-sm border border-border dark:border-border-dark bg-surface-2 dark:bg-surface-dark-2 text-sm text-ink dark:text-ink-dark placeholder:text-ink-faint dark:placeholder:text-ink-dark-faint resize-vertical focus:outline-none focus:ring-2 focus:ring-brand dark:focus:ring-brand-dark transition-colors"
            placeholder="Adicionar anotação sobre a cliente…"
            aria-label="Anotações do cliente"
          />
        </div>
      )}
    </Modal>
  );
}

function Field({ label, value }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b border-border dark:border-border-dark last:border-b-0">
      <span className="text-xs font-semibold text-ink-faint dark:text-ink-dark-faint w-36 shrink-0 pt-0.5 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm text-ink dark:text-ink-dark break-words flex-1">
        {value}
      </span>
    </div>
  );
}
