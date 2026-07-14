/**
 * Fusion ERP v2 — Modal Acessível
 *
 * Implementa:
 *  - Focus trap cíclico (Tab / Shift+Tab)
 *  - Fechamento com Escape
 *  - Scrollbar lock com compensação de largura
 *  - inert / aria-hidden em elementos irmãos quando aberto
 *  - aria-modal, aria-labelledby, aria-describedby
 *  - Restauração de foco ao fechar
 *  - Backdrop click para fechar
 */

import React, { useEffect, useCallback, useRef } from 'react';

/* ─── Calcula largura da scrollbar ─── */
function getScrollbarWidth() {
  if (typeof document === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

/* ─── Obtém elementos focáveis dentro de um container ─── */
function getFocusableElements(container) {
  if (!container) return [];
  const SELECTOR = [
    'a[href]',
    'button:not([disabled]):not([aria-hidden="true"])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])',
    'details summary',
  ].join(', ');
  return Array.from(container.querySelectorAll(SELECTOR));
}

/* ─── Torna irmãos inertes (aria-hidden) ─── */
function setSiblingsInert(el, isInert) {
  if (!el || typeof document === 'undefined') return;
  const parent = el.parentElement;
  if (!parent) return;
  const hasInert = typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;
  Array.from(parent.children).forEach((child) => {
    if (child !== el && !child.hasAttribute('data-modal-portal')) {
      child.setAttribute('aria-hidden', String(isInert));
      if (hasInert) {
        child.inert = isInert;
      }
    }
  });
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = '560px',
  showClose = true,
  closeOnOverlay = true,
  role = 'dialog',
  descId: externalDescId,
}) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const siblingsParentRef = useRef(null);
  onCloseRef.current = onClose;
  const titleId = useRef(`modal-title-${Math.random().toString(36).slice(2, 8)}`).current;
  const descId = externalDescId || useRef(`modal-desc-${Math.random().toString(36).slice(2, 8)}`).current;
  const scrollbarWidth = useRef(0);

  // ─── Abrir modal ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      // Restaura foco ao fechar
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
      // Remove aria-hidden dos irmãos
      if (modalRef.current) {
        setSiblingsInert(modalRef.current, false);
      }
      // Restaura scroll
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      return;
    }

    // Salva foco anterior
    previousFocusRef.current = document.activeElement;

    // Scrollbar compensation
    scrollbarWidth.current = getScrollbarWidth();
    if (scrollbarWidth.current > 0) {
      document.body.style.paddingRight = `${scrollbarWidth.current}px`;
    }
    document.body.style.overflow = 'hidden';

    // Torna irmãos inertes
    if (modalRef.current) {
      siblingsParentRef.current = modalRef.current.parentElement;
      setSiblingsInert(modalRef.current, true);
    }

    // Foca no primeiro elemento focável após animação
    requestAnimationFrame(() => {
      if (modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    });

    return () => {
      // Remove aria-hidden dos irmãos (usa referência capturada do parentElement)
      if (siblingsParentRef.current) {
        const hasInert = typeof HTMLElement !== 'undefined' && 'inert' in HTMLElement.prototype;
        Array.from(siblingsParentRef.current.children).forEach((child) => {
          if (!child.hasAttribute('data-modal-portal')) {
            child.setAttribute('aria-hidden', 'false');
            if (hasInert && 'inert' in child) {
              child.inert = false;
            }
          }
        });
        siblingsParentRef.current = null;
      }
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [open]);

  // ─── Key handlers ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e) => {
      if (!open) return;

      if (e.key === 'Escape' && onCloseRef.current) {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusable = getFocusableElements(modalRef.current);
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first || document.activeElement === modalRef.current) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    },
    [open]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => {
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [open, handleKeyDown]);

  // ─── Render nothing ─────────────────────────────────────────────────────
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role={role}
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      aria-label={!title ? (description || 'Modal') : undefined}
      ref={modalRef}
      tabIndex={-1}
      data-modal-portal
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] sm:backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-scale-in w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-auto outline-none"
        style={{ maxWidth: width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border dark:border-border-dark shrink-0">
          <h2 id={titleId} className="font-display text-base sm:text-lg font-semibold text-ink dark:text-ink-dark truncate pr-2">
            {title}
          </h2>
          {showClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors active:scale-95 shrink-0"
              aria-label="Fechar modal"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-4.5 sm:h-4.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Description (aria-describedby) */}
        {description && (
          <p id={descId} className="sr-only">
            {description}
          </p>
        )}

        {/* Content (scrollable) */}
        <div className="overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
