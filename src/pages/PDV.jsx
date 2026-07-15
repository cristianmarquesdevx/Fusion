/** @format */

import React, { useState, useCallback } from 'react';
import { usePDVStore, useConfigStore } from '../store';
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
    setSearchTerm, setDiscount, setPaymentMethod, setClientName, setNotes, clearCart,
  } = usePDVStore();

  const [discountModal, setDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState('porcentagem');
  const [discountValue, setDiscountValue] = useState(0);
  const getAbacatepayApiKey = useConfigStore((s) => s.getAbacatepayApiKey);
  const [paymentModal, setPaymentModal] = useState({ open: false, loading: false, type: null, data: null });
  const [toast, setToast] = useState(null);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

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

  // ─── Finalizar venda com AbacatePay ───────────────────────
  const handleFinalize = useCallback(async () => {
    if (cart.length === 0) {
      showToast('error', 'Carrinho vazio');
      return;
    }

    const total = summary.total;
    const nome = clientName.trim() || 'Cliente PDV';

    if (paymentMethod === 'pix') {
      // ─── PIX Dinâmico ──────────────────────────────────────
      setPaymentModal({ open: true, loading: true, type: 'pix', data: null });
      try {
        const apiKey = getAbacatepayApiKey();
        const res = await fetch('/api/abacatepay/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: nome, cellphone: '' },
            value: total,
            description: `Venda PDV: ${cart.map(i => i.nome).join(', ')}`,
            ...(apiKey ? { apiKey } : {}),
          }),
        });
        const result = await res.json();
        if (result.success && result.data) {
          setPaymentModal({
            open: true,
            loading: false,
            type: 'pix',
            data: result.data,
          });
        } else {
          setPaymentModal({ open: false, loading: false, type: null, data: null });
          showToast('error', result.error || 'Erro ao gerar PIX');
        }
      } catch (err) {
        setPaymentModal({ open: false, loading: false, type: null, data: null });
        showToast('error', 'Erro de conexão ao gerar PIX');
      }
    } else if (paymentMethod === 'maquininha' || paymentMethod === 'credito' || paymentMethod === 'debito') {
      // ─── Checkout hospedado (maquininha / cartão) ──────────
      setPaymentModal({ open: true, loading: true, type: 'checkout', data: null });
      try {
        const items = cart.map(i => ({ name: i.nome, quantity: i.qty, value: i.valor }));
        const apiKey = getAbacatepayApiKey();
        const res = await fetch('/api/abacatepay/create-hosted-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: nome },
            value: total,
            description: `Venda PDV - ${nome}`,
            items,
            returnUrl: window.location.origin + '/pdv',
            ...(apiKey ? { apiKey } : {}),
          }),
        });
        const result = await res.json();
        if (result.success && result.data?.url) {
          setPaymentModal({
            open: true,
            loading: false,
            type: 'checkout',
            data: result.data,
          });
        } else {
          setPaymentModal({ open: false, loading: false, type: null, data: null });
          showToast('error', result.error || 'Erro ao criar checkout');
        }
      } catch (err) {
        setPaymentModal({ open: false, loading: false, type: null, data: null });
        showToast('error', 'Erro de conexão ao criar checkout');
      }
    } else {
      // ─── Dinheiro (offline) ────────────────────────────────
      showToast('success', `Venda finalizada! Total: ${Helpers.formatCurrency(total)}`);
      clearCart();
    }
  }, [cart, summary, paymentMethod, clientName, showToast, clearCart]);

  // ─── Confirma pagamento manual (após PIX ou maquininha) ─────
  const handlePaymentConfirmed = () => {
    showToast('success', `Pagamento confirmado! Total: ${Helpers.formatCurrency(summary.total)}`);
    setPaymentModal({ open: false, loading: false, type: null, data: null });
    clearCart();
  };

  // ─── Copiar código PIX ───────────────────────────────────────
  const copyPixCode = () => {
    const code = paymentModal.data?.brCode || paymentModal.data?.pixQrCode || '';
    if (!code) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        showToast('success', 'Código PIX copiado!');
      }).catch(() => {});
    }
  };

  return (
    <div className="animate-fade-in pb-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink dark:text-ink-dark">
          PDV — Ponto de Venda
        </h1>
        <p className="text-sm text-ink-soft dark:text-ink-dark-soft mt-1.5">
          Cobrança integrada ao prontuário · PIX Dinâmico · Maquininha · cada venda já desconta do estoque e credita fidelidade
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
                <option value="pix">PIX Dinâmico</option>
                <option value="maquininha">Maquininha</option>
                <option value="credito">Cartão Crédito</option>
                <option value="debito">Cartão Débito</option>
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
                {paymentMethod === 'pix' ? 'Gerar PIX' :
                 paymentMethod === 'maquininha' ? 'Abrir na Maquininha' :
                 'Finalizar venda'}
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

      {/* ─── Modal Pagamento PIX ───────────────────────────────── */}
      <Modal
        open={paymentModal.open && paymentModal.type === 'pix'}
        onClose={() => !paymentModal.loading && setPaymentModal({ open: false, loading: false, type: null, data: null })}
        title="PIX Dinâmico"
        maxWidth="max-w-sm"
      >
        <div className="p-4 text-center space-y-4">
          {paymentModal.loading ? (
            <>
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-12 w-12 text-brand" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm text-ink-soft">Gerando PIX Dinâmico...</p>
            </>
          ) : paymentModal.data ? (
            <>
              <div className="flex justify-center">
                <span className="px-3 py-1 text-[10px] font-bold rounded-full bg-brand-soft/20 text-brand uppercase tracking-wider">
                  PIX Dinâmico
                </span>
              </div>

              <div className="font-mono text-2xl font-bold text-ink tabular-nums">
                {Helpers.formatCurrency(summary.total)}
              </div>

              {/* QR Code */}
              <div className="qr-wrapper bg-white rounded-xl p-3 inline-block shadow-sm border border-border">
                {paymentModal.data.brCodeBase64 || paymentModal.data.pixQrCodeImage ? (
                  <img
                    src={paymentModal.data.brCodeBase64 || paymentModal.data.pixQrCodeImage}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-surface-2 rounded-lg text-ink-faint text-sm">
                    QR Code
                  </div>
                )}
              </div>

              {/* Código copia-e-cola */}
              <div
                onClick={copyPixCode}
                className="pix-code bg-surface-2 border border-dashed border-border rounded-lg p-3 text-xs font-mono break-all cursor-pointer hover:border-brand transition-colors text-ink-soft"
              >
                {paymentModal.data.brCode || paymentModal.data.pixQrCode || '---'}
              </div>
              <p className="text-[10px] text-ink-faint -mt-2">Clique para copiar o código PIX</p>

              {/* Ações */}
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={handlePaymentConfirmed} className="btn btn-sm">
                  ✅ Pagamento confirmado
                </button>
                <button
                  onClick={() => setPaymentModal({ open: false, loading: false, type: null, data: null })}
                  className="btn-ghost btn-sm"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      {/* ─── Modal Checkout (Maquininha / Cartão) ──────────────── */}
      <Modal
        open={paymentModal.open && paymentModal.type === 'checkout'}
        onClose={() => !paymentModal.loading && setPaymentModal({ open: false, loading: false, type: null, data: null })}
        title="Pagamento"
        maxWidth="max-w-sm"
      >
        <div className="p-4 text-center space-y-4">
          {paymentModal.loading ? (
            <>
              <div className="flex justify-center py-8">
                <svg className="animate-spin h-12 w-12 text-brand" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-sm text-ink-soft">Criando checkout seguro...</p>
            </>
          ) : paymentModal.data ? (
            <>
              <div className="text-4xl mb-2">
                {paymentMethod === 'maquininha' ? '💳' : '🛒'}
              </div>
              <h3 className="font-display text-lg font-semibold">
                {paymentMethod === 'maquininha' ? 'Pagamento na Maquininha' : 'Checkout'}
              </h3>
              <div className="font-mono text-2xl font-bold text-ink tabular-nums">
                {Helpers.formatCurrency(summary.total)}
              </div>
              <p className="text-sm text-ink-soft">
                {paymentMethod === 'maquininha'
                  ? 'Abra o link abaixo na maquininha de cartão para processar o pagamento.'
                  : 'Você será redirecionado para o checkout seguro.'}
              </p>

              <div className="flex flex-col gap-2 pt-2">
                <a
                  href={paymentModal.data.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                >
                  {paymentMethod === 'maquininha' ? 'Abrir na Maquininha' : 'Ir para o pagamento'}
                </a>
                <button onClick={handlePaymentConfirmed} className="btn-ghost btn-sm">
                  ✅ Pagamento confirmado
                </button>
                <button
                  onClick={() => setPaymentModal({ open: false, loading: false, type: null, data: null })}
                  className="text-xs text-ink-faint underline hover:text-ink-soft"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

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
    </div>
  );
}
