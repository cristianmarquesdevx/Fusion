/** @format */

import React, { useState } from 'react';
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

export default function CadastroModal({ open, onClose }) {
  const addClient = useClientStore((s) => s.addClient);
  const [form, setForm] = useState({
    nome: '',
    tel: '',
    email: '',
    cpf: '',
  });
  const [toast, setToast] = useState(null);

  const handleChange = (field, value) => {
    if (field === 'tel') value = maskPhone(value);
    if (field === 'cpf') value = maskCPF(value);
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.tel.trim()) {
      setToast({ type: 'error', msg: 'Preencha nome e telefone para cadastrar.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    addClient({
      nome: form.nome.trim(),
      tel: form.tel.trim(),
      email: form.email.trim(),
      cpf: form.cpf.trim(),
      desde: String(new Date().getFullYear()),
      ultima: '—',
      pacote: 'Sem pacote ativo',
      status: 'Em dia',
    });
    setToast({ type: 'success', msg: `Cliente "${form.nome.trim()}" cadastrada com sucesso!` });
    setTimeout(() => {
      setToast(null);
      setForm({ nome: '', tel: '', email: '', cpf: '' });
      onClose();
    }, 1200);
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova cliente" width="480px">
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
          <button type="submit" className="btn">
            Cadastrar cliente
          </button>
        </div>
      </form>
    </Modal>
  );
}
