/** @format */

import React, { useState, useCallback } from 'react';
import { usePDVStore } from '../store';
import { Helpers } from '../utils';
import { SearchInput, Modal } from '../components/ui';

/* ─── Cartão de produto/serviço ─── */
function ProductCard({ item, onAdd }) {
  const isService = item.tipo === 'Serviço';
  return (
    <button
      onClick={() => onAdd(item)}
      className="card p-3.5 text-left w-full transition-all duration-200 hover:shadow-md dark:hover:shadow-dark-md hover:-translate-y-0.5 active:scale-[0.97] group"
    >
      <div className="text-xl mb-2">{item.imagem}</div>
      <div className="text-xs font-semibold text-ink dark:text-ink-dark truncate">{item.nome}</div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="tag text-[9px] font-semibold" style={{
          backgroundColor: isService ? '#4C7A5E22' : '#6C5CE722',
          color: isService ? '#4C7A5E' : '#6C5CE7',
        }}>
          {item.tipo}
        </span>
        <span className="font-mono text-xs font-bold text-ink dark:text-ink-dark">{Helpers.formatCurrency(item.valor)}</span>
      </div>
      {!isService && (
        <div className="text-[9px] text-ink-faint dark:text-ink-dark-faint mt-1">Estoque: {item.estoque} un.</div>
      )}
      {isService && item.duracao && (
        <div className="text-[9px] text-ink-faint dark:text-ink-dark-faint mt-1">{item.duracao}</div>
      )}
    </button>
  );
}

/* ─── Item do carrinho ─── */
function CartItem({ item, onRemove, onUpdateQty }) {
  return (
    <div className="flex items-center gap-2.5 py-2.5 border-b border-border dark:border-border-dark last:border-b-0 group/cart">
      <span className="text-lg shrink-0">{item.imagem}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold text-ink dark:text-ink-dark truncate">{item.nome}</div>
        <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint">{item.tipo}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onUpdateQty(item.id, item.qty - 1)}
          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold bg-surface-2 dark:bg-surface-dark-2 hover:bg-surface-2/80 transition-colors"
        >
          −
        </button>
        <span className="font-mono text-xs font-semibold text-ink dark:text-ink-dark w-5 text-center tabular-nums">{item.qty}</span>
        <button
          onClick={() => onUpdateQty(item.id, item.qty + 1)}
          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold bg-surface-2 dark:bg-surface-dark-2 hover:bg-surface-2/80 transition-colors"
        >
          +
        </button>
      </div>
      <span className="font-mono text-xs font-bold text-ink dark:text-ink-dark min-w-[60px] text-right tabular-nums">
        {Helpers.formatCurrency(item.valor * item.qty)}
      </span>
      <button
        onClick={() => onRemove(item.id)}
        className="w-5 h-5 rounded flex items-center justify-center text-xs text-ink-faint dark:text-ink-dark-faint hover:text-rose dark:hover:text-rose-dark transition-colors opacity-0 group-hover/cart:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}

/* ════════════════════════════════════ */
/*  PÁGINA PRINCIPAL                    */
/* ════════════════════════════════════ */

export default function PDV() {
  const {
    cart, searchTerm, discount, paymentMethod, clientName, notes,
    getFilteredProducts, getCartSummary, addToCart, removeFromCart, updateQty,
    setSearchTerm, setDiscount, setPaymentMethod, setClientName, setNotes, clearCart, finalizeSale,
  } = usePDVStore();

  const [discountModal, setDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState('porcentagem');
  const [discountValue, setDiscountValue] = useState(0);

  const products = getFilteredProducts();
  const summary = getCartSummary();

  const handleAddDiscount = () => {
    if (!discountValue || discountValue <= 0) return;
    if (discountType === 'porcentagem') {
      const val = (summary.subtotal * Math.min(discountValue, 100)) / 100;
      setDiscount({ type: 'percentage', value: val, label: `${discountValue}%` });
    } else {
      setDiscount({ type: 'fixed', value: Math.min(discountValue, summary.subtotal), label: Helpers.formatCurrency(discountValue) });
    }
    setDiscountModal(false);
    setDiscountValue(0);
  };

  const [toast, setToast] = useState(null);

  const handleFinalize = useCallback(() => {
    const result = finalizeSale();
    if (result.success) {
      setToast({ type: 'success', message: `Venda finalizada! Total: ${Helpers.formatCurrency(result.sale.total)}` });
    } else {
      setToast({ type: 'error', message: result.error });
    }
    setTimeout(() => setToast(null), 4000);
  }, [finalizeSale]);

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          PDV — Ponto de Venda
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          Cobrança integrada ao prontuário · cada venda já desconta do estoque e credita fidelidade
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 lg:gap-5">
        {/* ── COLUNA ESQUERDA: Produtos ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar produto ou serviço…" className="flex-1" />
            <span className="text-xs text-ink-faint dark:text-ink-dark-faint font-medium">{products.length} itens</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {products.map((item) => (
              <ProductCard key={item.id} item={item} onAdd={addToCart} />
            ))}
          </div>
          {products.length === 0 && (
            <div className="py-16 text-center text-ink-faint dark:text-ink-dark-faint text-sm">
              Nenhum produto ou serviço encontrado.
            </div>
          )}
        </div>

        {/* ── COLUNA DIREITA: Carrinho ── */}
        <div className="card flex flex-col">
          <div className="px-5 pt-5 pb-3 border-b border-border dark:border-border-dark">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">Carrinho</h2>
              <span className="text-xs text-ink-faint dark:text-ink-dark-faint">{summary.itens} itens</span>
            </div>
            {/* Cliente + forma de pagamento */}
            <div className="flex items-center gap-2 mt-2.5">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente…"
                className="input !py-1.5 !px-2.5 text-xs flex-1"
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="input !py-1.5 !px-2.5 text-xs w-auto"
              >
                <option value="credito">Crédito</option>
                <option value="debito">Débito</option>
                <option value="pix">Pix</option>
                <option value="dinheiro">Dinheiro</option>
              </select>
            </div>
          </div>

          {/* Itens do carrinho */}
          <div className="px-5 py-2 flex-1 overflow-y-auto max-h-[320px]">
            {cart.length > 0 ? cart.map((item) => (
              <CartItem key={item.id} item={item} onRemove={removeFromCart} onUpdateQty={updateQty} />
            )) : (
              <div className="py-12 text-center text-ink-faint dark:text-ink-dark-faint text-sm">
                <div className="text-2xl mb-2">🛒</div>
                Carrinho vazio.<br />
                Clique em um produto ou serviço para adicionar.
              </div>
            )}
          </div>

          {/* Resumo + ações */}
          <div className="px-5 py-4 border-t border-border dark:border-border-dark space-y-2.5">
            {/* Desconto */}
            {discount.value > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-sage dark:text-sage-dark">Desconto ({discount.label})</span>
                <span className="font-mono font-semibold text-sage dark:text-sage-dark">−{Helpers.formatCurrency(discount.value)}</span>
              </div>
            )}
            {/* Subtotal / Total */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-soft dark:text-ink-dark-soft">Subtotal</span>
              <span className="font-mono text-sm font-semibold text-ink dark:text-ink-dark">{Helpers.formatCurrency(summary.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border dark:border-border-dark">
              <span className="text-sm font-bold text-ink dark:text-ink-dark">Total</span>
              <span className="font-mono text-xl font-bold text-ink dark:text-ink-dark tabular-nums">{Helpers.formatCurrency(summary.total)}</span>
            </div>
            {/* Observações */}
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações…"
              className="input !py-1.5 !px-2.5 text-xs"
            />
            {/* Botões */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDiscountModal(true)}
                disabled={cart.length === 0}
                className="btn-ghost btn-sm flex-1"
              >
                Desconto
              </button>
              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className="btn-ghost btn-sm flex-1"
              >
                Limpar
              </button>
              <button
                onClick={handleFinalize}
                disabled={cart.length === 0}
                className="btn btn-sm flex-[2]"
              >
                Finalizar venda
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-fade-in-up">
          <div className={`px-4 py-3 rounded-lg shadow-lg text-sm font-semibold flex items-center gap-2.5 ${
            toast.type === 'success'
              ? 'bg-sage dark:bg-sage-dark text-white'
              : 'bg-rose dark:bg-rose-dark text-white'
          }`}>
            <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
            {toast.message}
            <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">✕</button>
          </div>
        </div>
      )}

      {/* Modal Desconto */}
      <Modal open={discountModal} onClose={() => setDiscountModal(false)} title="Adicionar Desconto" maxWidth="max-w-sm">
          <div className="p-5 space-y-4">
            <div className="flex gap-2">
              {[
                { key: 'porcentagem', label: 'Porcentagem' },
                { key: 'valor', label: 'Valor fixo' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDiscountType(opt.key)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${
                    discountType === opt.key
                      ? 'bg-brand-soft/20 dark:bg-brand-dark-soft/20 text-brand dark:text-brand-dark border border-brand/30'
                      : 'bg-surface-2 dark:bg-surface-dark-2 text-ink-faint dark:text-ink-dark-faint'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-soft dark:text-ink-dark-soft mb-1.5 block">
                {discountType === 'porcentagem' ? 'Percentual (%)' : 'Valor (R$)'}
              </label>
              <input
                type="number"
                min={0}
                max={discountType === 'porcentagem' ? 100 : summary.subtotal}
                step={discountType === 'porcentagem' ? 1 : 0.01}
                value={discountValue}
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                className="input"
              />
            </div>
            {discountType === 'porcentagem' && discountValue > 0 && (
              <div className="text-xs text-ink-soft dark:text-ink-dark-soft">
                Desconto de <strong>{discountValue}%</strong> ={' '}
                <strong className="text-sage">{Helpers.formatCurrency((summary.subtotal * discountValue) / 100)}</strong>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setDiscountModal(false)} className="btn-ghost btn-sm">Cancelar</button>
              <button onClick={handleAddDiscount} disabled={!discountValue || discountValue <= 0} className="btn btn-sm">
                Aplicar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
