/** @format */

import React, { useState, useEffect } from 'react';
import { useEstoqueStore } from '../../store/useEstoqueStore';
import { Modal, ConfirmDialog } from '../ui';

export default function EditItemModal({ open, onClose, editingItem }) {
  const updateItem = useEstoqueStore((s) => s.updateItem);
  const deleteItem = useEstoqueStore((s) => s.deleteItem);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    categoria: '',
    qtd: '',
    minimo: '',
    unidade: 'un.',
    valorUnit: '',
  });
  const [toast, setToast] = useState(null);
  const isEditing = !!editingItem;

  // Preenche formulário quando edita
  useEffect(() => {
    if (editingItem) {
      setForm({
        nome: editingItem.nome || '',
        categoria: editingItem.categoria || '',
        qtd: String(editingItem.qtd || ''),
        minimo: String(editingItem.minimo || ''),
        unidade: editingItem.unidade || 'un.',
        valorUnit: String(editingItem.valorUnit || ''),
      });
    }
  }, [editingItem, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!form.nome.trim()) {
      setToast({ type: 'error', msg: 'Preencha o nome do item.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const data = {
      nome: form.nome.trim(),
      categoria: form.categoria || 'Outros',
      qtd: parseInt(form.qtd) || 0,
      minimo: parseInt(form.minimo) || 0,
      unidade: form.unidade || 'un.',
      valorUnit: parseFloat(form.valorUnit) || 0,
    };

    if (isEditing) {
      updateItem(editingItem.id, data);
      setToast({ type: 'success', msg: `Item "${form.nome.trim()}" atualizado.` });
    }

    setTimeout(() => {
      setToast(null);
      onClose();
    }, 1200);
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar item' : 'Novo item'} width="480px">
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
        {/* Nome */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Nome do item <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            placeholder="Ex: Toxina botulínica 100U"
            className="input"
            autoFocus
          />
        </div>

        {/* Categoria + Unidade */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Categoria
            </label>
            <select
              value={form.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="input"
            >
              <option value="Injetáveis">Injetáveis</option>
              <option value="Descartáveis">Descartáveis</option>
              <option value="Cosméticos">Cosméticos</option>
              <option value="Equipamentos">Equipamentos</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Unidade
            </label>
            <select
              value={form.unidade}
              onChange={(e) => handleChange('unidade', e.target.value)}
              className="input"
            >
              <option value="un.">un.</option>
              <option value="cx.">cx.</option>
              <option value="pct.">pct.</option>
              <option value="ml">ml</option>
              <option value="g">g</option>
            </select>
          </div>
        </div>

        {/* Quantidade + Mínimo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Quantidade atual
            </label>
            <input
              type="number"
              min="0"
              value={form.qtd}
              onChange={(e) => handleChange('qtd', e.target.value)}
              className="input"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Estoque mínimo
            </label>
            <input
              type="number"
              min="0"
              value={form.minimo}
              onChange={(e) => handleChange('minimo', e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Valor unitário */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Valor unitário (R$)
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

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border dark:border-border-dark">
          <div>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn-ghost btn-sm text-rose dark:text-rose-dark"
                aria-label="Excluir item"
              >
                Excluir item
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn">
              {isEditing ? 'Salvar alterações' : 'Criar item'}
            </button>
          </div>
        </div>
      </form>

      {/* Confirmar exclusão */}
      <ConfirmDialog
        open={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={() => {
          if (editingItem) {
            deleteItem(editingItem.id);
          }
          setShowConfirmDelete(false);
          setToast(null);
          onClose();
        }}
        title="Excluir item?"
        message={`Tem certeza que deseja excluir "${editingItem?.nome || ''}" do estoque? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </Modal>
  );
}
