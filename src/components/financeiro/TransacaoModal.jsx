/** @format */

import React, { useState } from 'react';
import { useFinanceiroStore } from '../../store/useFinanceiroStore';
import Modal from '../ui/Modal';

const emptyForm = {
  tipo: 'receita',
  descricao: '',
  categoria: 'Procedimento',
  valor: '',
  formaPagamento: '',
  data: new Date().toISOString().split('T')[0],
  status: 'Pago',
  observacoes: '',
};

export default function TransacaoModal({ open, onClose }) {
  const addTransacao = useFinanceiroStore((s) => s.addTransacao);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const { tipo, descricao, categoria, valor, data } = form;
    if (!tipo || !descricao.trim() || !categoria || !valor || !data) {
      setToast({ type: 'error', msg: 'Preencha tipo, valor, descrição e categoria.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      setToast({ type: 'error', msg: 'Informe um valor válido.' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const dataParts = data.split('-');
    const dataBr = `${dataParts[2]}/${dataParts[1]}`;

    const transacao = {
      descricao: descricao.trim(),
      categoria,
      data: dataBr,
      valor: valorNum,
      tipo,
      status: form.status,
      formaPagamento: form.formaPagamento || null,
      observacoes: form.observacoes.trim() || '',
    };

    addTransacao(transacao);

    const sinal = tipo === 'receita' ? 'R$' : '− R$';
    setToast({
      type: 'success',
      msg: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} • ${descricao.trim()} • ${sinal} ${valorNum.toFixed(2)}`,
    });
    setTimeout(() => {
      setToast(null);
      setForm(emptyForm);
      onClose();
    }, 1200);
  };

  return (
    <Modal open={open} onClose={onClose} title="Nova transação" width="520px">
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
        {/* Tipo toggle */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Tipo <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <div className="flex gap-2 p-0.5 rounded-sm bg-surface-2 dark:bg-surface-dark-2 border border-border dark:border-border-dark">
            <button
              type="button"
              onClick={() => handleChange('tipo', 'receita')}
              className={`flex-1 px-3 py-2 text-sm font-semibold rounded-sm transition-colors ${
                form.tipo === 'receita'
                  ? 'bg-sage dark:bg-sage-dark text-white'
                  : 'text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Receita
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleChange('tipo', 'despesa')}
              className={`flex-1 px-3 py-2 text-sm font-semibold rounded-sm transition-colors ${
                form.tipo === 'despesa'
                  ? 'bg-rose dark:bg-rose-dark text-white'
                  : 'text-ink-soft dark:text-ink-dark-soft hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              <span className="flex items-center justify-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Despesa
              </span>
            </button>
          </div>
        </div>

        {/* Descrição */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Descrição <span className="text-rose dark:text-rose-dark">*</span>
          </label>
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => handleChange('descricao', e.target.value)}
            placeholder="Ex: Sessão · Maria Silva"
            className="input"
            autoFocus
          />
        </div>

        {/* Categoria + Valor */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Categoria <span className="text-rose dark:text-rose-dark">*</span>
            </label>
            <select
              value={form.categoria}
              onChange={(e) => handleChange('categoria', e.target.value)}
              className="input"
            >
              <option value="Procedimento">Procedimento</option>
              <option value="Estoque">Estoque</option>
              <option value="Comissão">Comissão</option>
              <option value="Assinatura">Assinatura</option>
              <option value="Produto">Produto</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
              Valor <span className="text-rose dark:text-rose-dark">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint dark:text-ink-dark-faint font-mono">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                placeholder="0,00"
                className="input pl-10"
              />
            </div>
          </div>
        </div>

        {/* Data + Status */}
        <div className="grid grid-cols-2 gap-3">
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
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="input"
            >
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="A pagar">A pagar</option>
            </select>
          </div>
        </div>

        {/* Forma de pagamento */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Forma de pagamento
          </label>
          <select
            value={form.formaPagamento}
            onChange={(e) => handleChange('formaPagamento', e.target.value)}
            className="input"
          >
            <option value="">Selecione…</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Crédito">Cartão de crédito</option>
            <option value="Débito">Cartão de débito</option>
            <option value="PIX">PIX</option>
            <option value="Boleto">Boleto</option>
            <option value="Débito automático">Débito automático</option>
          </select>
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">
            Observações
          </label>
          <textarea
            value={form.observacoes}
            onChange={(e) => handleChange('observacoes', e.target.value)}
            placeholder="Informações adicionais…"
            rows={2}
            className="input resize-vertical min-h-[50px]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border dark:border-border-dark">
          <button type="button" onClick={onClose} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" className="btn">
            Salvar transação
          </button>
        </div>
      </form>
    </Modal>
  );
}
