/** @format */

import React, { useEffect, useCallback, useRef } from 'react';

export default function Modal({ open, onClose, title, children, width = '560px', showClose = true }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Focus trap: armazena o foco anterior e foca no modal
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement;
      // Foca no modal após animação
      requestAnimationFrame(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (firstFocusable) firstFocusable.focus();
          else modalRef.current.focus();
        }
      });
    } else {
      // Restaura foco quando modal fecha
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      // Focus trap: Tab e Shift+Tab循环
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
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
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
      ref={modalRef}
      tabIndex={-1}
    >
      {/* Overlay com backdrop progression */}
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-[2px] sm:backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card — full-width no mobile, centralizado no desktop */}
      <div
        className="relative bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-scale-in w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col mx-auto"
        style={{ maxWidth: width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border dark:border-border-dark shrink-0">
          <h2 className="font-display text-base sm:text-lg font-semibold text-ink dark:text-ink-dark truncate pr-2">
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

        {/* Content (scrollable) */}
        <div className="overflow-y-auto p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
