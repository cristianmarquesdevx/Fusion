/** @format */

import React, { useState, useEffect } from 'react';
import { useClientStore } from '../../store/useClientStore';
import Modal from '../ui/Modal';

function maskPhone(value) {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
}

function maskCPF(value) {
  const cleaned = value.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
}

const emptyForm = {
  nome: '', tel: '', email: '', cpf: '',
};

export default function CadastroModal({ open, onClose, editingClient }) {
  const addClient = useClientStore((s) => s.addClient);
  const updateClient = useClientStore((s) => s.updateClient);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const isEditing = !!editingClient;

  // Preenche formulário quando edita
  useEffect(() => {
    if (editingClient) {
      setForm({
        nome: editingClient.nome || '',
        tel: editingClient.tel || '',
        email: editingClient.email || '',
        cpf: editingClient.cpf || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingClient, open]);

  const handleChange = (field, value) => {
    if (field === 'tel') value = maskPhone(value);
    if (field === 'cpf') value = maskCPF(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.tel.trim()) {
      setToast({ type: 'error', msg: 'Preencha nome e telefone para cadastrar.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSaving(true);

    const data = {
      nome: form.nome.trim(),
      tel: form.tel.trim(),
      email: form.email.trim(),
      cpf: form.cpf.trim(),
    };

    if (isEditing) {
      await updateClient(editingClient.id, data);
      setToast({ type: 'success', msg: `Cliente "${form.nome.trim()}" atualizada com sucesso!` });
    } else {
      await addClient({
        ...data,
        desde: String(new Date().getFullYear()),
        ultima: '—',
        pacote: 'Sem pacote ativo',
        status: 'Em dia',
      });
      setToast({ type: 'success', msg: `Cliente "${form.nome.trim()}" cadastrada com sucesso!` });
    }

    setSaving(false);

    setTimeout(() => {
      setToast(null);
      setForm(emptyForm);
      onClose();
    }, 1200);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar cliente' : 'Nova cliente'} width="480px">
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
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Nome completo <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            placeholder="Ex: Maria Silva"
            className="input"
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Telefone <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <input
            type="text"
            value={form.tel}
            onChange={(e) => handleChange('tel', e.target.value)}
            placeholder="(11) 99999-8888"
            className="input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="maria@email.com"
            className="input"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            CPF
          </label>
          <input
            type="text"
            value={form.cpf}
            onChange={(e) => handleChange('cpf', e.target.value)}
            placeholder="123.456.789-00"
            className="input"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Salvando…
              </span>
            ) : (
              isEditing ? 'Salvar alterações' : 'Cadastrar cliente'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
