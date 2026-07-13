/** @format */

import React, { useState } from 'react';
import { useAgendaStore } from '../../store/useAgendaStore';
import Modal from '../ui/Modal';

const emptyForm = {
  client: '',
  profissional: '',
  servico: '',
  data: new Date().toISOString().split('T')[0],
  hora: '09:00',
  duracao: '60',
  observacoes: '',
};

export default function AgendamentoModal({ open, onClose }) {
  const { professionals, services, addAppointment } = useAgendaStore();
  const [form, setForm] = useState(emptyForm);

  const [toast, setToast] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const { client, profissional, servico, data, hora } = form;
    if (!client.trim() || !profissional || !servico || !data || !hora) {
      setToast({ type: 'error', msg: 'Preencha todos os campos obrigatórios.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const prof = professionals.find((p) => p.id === profissional);
    const svc = services.find((s) => s.id === servico);

    addAppointment({
      client: form.client,
      profissional: prof?.nome || profissional,
      servico: svc?.nome || servico,
      data: form.data,
      hora: form.hora,
      duracao: parseInt(form.duracao, 10),
      observacoes: form.observacoes.trim(),
      status: 'confirmado',
    });

    setToast({ type: 'success', msg: `Agendamento de "${svc?.nome || servico}" criado!` });
    setTimeout(() => {
      setToast(null);
      onClose();
    }, 1200);
  };

  const selectedProf = professionals.find((p) => p.id === form.profissional);

  return (
    <Modal open={open} onClose={onClose} title="Novo agendamento" width="520px">
      {/* Toast */}
      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-sm text-sm font-medium animate-slide-down ${
            toast.type === 'success'
              ? 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark'
              : 'bg-rose-soft dark:bg-rose-dark-soft text-rose dark:text-rose-dark'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
        className="space-y-4"
      >
        {/* Cliente */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Cliente <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <input
            type="text"
            value={form.client}
            onChange={(e) => handleChange('client', e.target.value)}
            placeholder="Nome da cliente"
            className="input"
            autoFocus
          />
        </div>

        {/* Professional + Service row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Profissional <span className="text-rose dark:text-rose-dark">*</span>
            </label>
            <select
              value={form.profissional}
              onChange={(e) => handleChange('profissional', e.target.value)}
              className="input"
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.cargo}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Serviço <span className="text-rose dark:text-rose-dark">*</span>
            </label>
            <select
              value={form.servico}
              onChange={(e) => handleChange('servico', e.target.value)}
              className="input"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.duracao}min)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Time + Duration row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Data <span className="text-rose dark:text-rose-dark">*</span>
            </label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => handleChange('data', e.target.value)}
              className="input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Horário <span className="text-rose dark:text-rose-dark">*</span>
            </label>
            <input
              type="time"
              value={form.hora}
              onChange={(e) => handleChange('hora', e.target.value)}
              className="input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Duração
            </label>
            <select
              value={form.duracao}
              onChange={(e) => handleChange('duracao', e.target.value)}
              className="input"
            >
              <option value="30">30 min</option>
              <option value="60">60 min</option>
              <option value="90">90 min</option>
              <option value="120">120 min</option>
            </select>
          </div>
        </div>

        {/* Professional indicator */}
        {selectedProf && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm bg-surface-2 dark:bg-surface-dark-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: selectedProf.cor }}
            />
            <span className="text-ink-soft dark:text-ink-dark-soft">
              Agendamento com <strong className="text-ink dark:text-ink-dark">{selectedProf.nome}</strong>
            </span>
          </div>
        )}

        {/* Observations */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Observações
          </label>
          <textarea
            value={form.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            placeholder="Observações sobre o agendamento…"
            rows={3}
            className="input resize-vertical min-h-[60px]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" className="btn">
            Salvar agendamento
          </button>
        </div>
      </form>
    </Modal>
  );
}
