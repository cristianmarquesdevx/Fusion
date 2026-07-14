/**
 * Fusion ERP v2 — ConfirmDialog Acessível
 *
 * Modal de confirmação com role="alertdialog" e aria-describedby,
 * próprio para ações destrutivas (excluir, cancelar, etc.).
 *
 * Uso:
 *   <ConfirmDialog
 *     open={open}
 *     onClose={() => setOpen(false)}
 *     onConfirm={handleConfirm}
 *     title="Excluir cliente?"
 *     message="Esta ação não pode ser desfeita."
 *     confirmLabel="Sim, excluir"
 *     cancelLabel="Cancelar"
 *     variant="danger"
 *   />
 */

import React, { useRef } from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja realizar esta ação?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'info'
}) {
  const descId = useRef(`confirm-desc-${Math.random().toString(36).slice(2, 8)}`).current;
  const confirmBtnRef = useRef(null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="400px"
      showClose={false}
      closeOnOverlay={false}
      role="alertdialog"
      description={message}
      descId={descId}
    >
      {/* Mensagem visível */}
      <p className="text-sm text-ink-soft dark:text-ink-dark-soft leading-relaxed">
        {message}
      </p>

      {/* Ações */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border dark:border-border-dark">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-ghost"
        >
          {cancelLabel}
        </button>
        <button
          ref={confirmBtnRef}
          type="button"
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
          className={`btn ${
            variant === 'danger'
              ? 'bg-rose text-white hover:bg-rose-dark active:bg-rose-darker shadow-lg shadow-rose/20 dark:shadow-rose/30'
              : variant === 'warning'
              ? 'bg-gold text-white hover:bg-gold-dark active:bg-gold-darker shadow-lg shadow-gold/20 dark:shadow-gold/30'
              : ''
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
