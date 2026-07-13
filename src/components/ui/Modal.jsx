/** @format */

import React, { useEffect, useCallback } from 'react';

export default function Modal({ open, onClose, title, children, width = '560px', showClose = true }) {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape' && onClose) onClose();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] animate-scale-in w-full max-h-[90vh] flex flex-col"
        style={{ maxWidth: width }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border-dark shrink-0">
          <h2 className="font-display text-lg font-semibold text-ink dark:text-ink-dark">
            {title}
          </h2>
          {showClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-sm hover:bg-surface-2 dark:hover:bg-surface-dark-2 transition-colors"
              aria-label="Fechar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content (scrollable) */}
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
