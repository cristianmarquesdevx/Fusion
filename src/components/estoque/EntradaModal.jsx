/** @format */

import React, { useState } from 'react';
import { useEstoqueStore } from '../../store/useEstoqueStore';
import Modal from '../ui/Modal';

const emptyForm = {
  itemId: '',
  quantidade: '',
  valorUnit: '',
  fornecedor: '',
  notaFiscal: '',
};

export default function EntradaModal({ open, onClose }) {
  const items = useEstoqueStore((s) => s.items);
  const getItemById = useEstoqueStore((s) => s.getItemById);
  const addEntrada = useEstoqueStore((s) => s.addEntrada);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectedItem = form.itemId ? getItemById(form.itemId) : null;

  const handleSave = () => {
    const { itemId, quantidade } = form;
    if (!itemId || !quantidade) {
      setToast({ type: 'error', msg: 'Selecione um item e informe a quantidade.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const qtd = parseInt(quantidade, 10);
    if (isNaN(qtd) || qtd <= 0) {
      setToast({ type: 'error', msg: 'Informe uma quantidade válida.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const item = getItemById(itemId);
    const valorUnit = form.valorUnit ? parseFloat(form.valorUnit) : null;

    addEntrada({
      itemId,
      itemNome: item?.nome || itemId,
      quantidade: qtd,
      valorUnit: valorUnit || null,
      fornecedor: form.fornecedor.trim() || '',
      notaFiscal: form.notaFiscal.trim() || '',
    });

    setToast({
      type: 'success',
      msg: `Entrada registrada: +${qtd} ${item?.nome || ''}`,
    });
    setTimeout(() => {
      setToast(null);
      setForm(emptyForm);
      onClose();
    }, 1200);
  };

  return (
    <Modal open={open} onClose={onClose} title="Registrar entrada" width="480px">
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
        {/* Item selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Item <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <select
            value={form.itemId}
            onChange={(e) => handleChange('itemId', e.target.value)}
            className="input"
            autoFocus
          >
            <option value="">Selecione um item…</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome} ({item.qtd} {item.unidade} em estoque)
              </option>
            ))}
          </select>
        </div>

        {/* Current stock info */}
        {selectedItem && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-sm bg-surface-2 dark:bg-surface-dark-2 text-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                selectedItem.qtd < selectedItem.minimo * 0.5
                  ? 'bg-rose dark:bg-rose-dark'
                  : selectedItem.qtd < selectedItem.minimo
                  ? 'bg-gold dark:bg-gold-dark'
                  : 'bg-sage dark:bg-sage-dark'
              }`}
            />
            <span className="text-ink-soft dark:text-ink-dark-soft">
              Estoque atual: <strong className="text-ink dark:text-ink-dark">{selectedItem.qtd} {selectedItem.unidade}</strong>
              {' · '}Mínimo: {selectedItem.minimo} {selectedItem.unidade}
            </span>
          </div>
        )}

        {/* Quantidade */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Quantidade <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={form.quantidade}
            onChange={(e) => handleChange('quantidade', e.target.value)}
            placeholder="Ex: 10"
            className="input"
          />
        </div>

        {/* Valor unitário */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Valor unitário (opcional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint dark:text-ink-dark-faint font-mono">
              R$
            </span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.valorUnit}
              onChange={(e) => handleChange('valorUnit', e.target.value)}
              placeholder="0,00"
              className="input pl-10"
            />
          </div>
        </div>

        {/* Fornecedor + NF */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Fornecedor
            </label>
            <input
              type="text"
              value={form.fornecedor}
              onChange={(e) => handleChange('fornecedor', e.target.value)}
              placeholder="Nome do fornecedor"
              className="input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Nota fiscal
            </label>
            <input
              type="text"
              value={form.notaFiscal}
              onChange={(e) => handleChange('notaFiscal', e.target.value)}
              placeholder="Nº da NF"
              className="input"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" className="btn">
            Registrar entrada
          </button>
        </div>
      </form>
    </Modal>
  );
}
