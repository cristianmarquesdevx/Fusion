/** @format */

import React from 'react';

export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, onPageSizeChange }) {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const pages = [];
  const maxVisible = 5;
  let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible);
  if (end - start < maxVisible) {
    start = Math.max(0, end - maxVisible);
  }

  for (let i = start; i < end; i++) {
    pages.push(i);
  }

  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-border dark:border-border-dark">
      <div className="flex items-center gap-2 text-xs text-ink-faint dark:text-ink-dark-faint">
        <span>
          {(currentPage * pageSize) + 1}–{Math.min((currentPage + 1) * pageSize, totalItems)} de {totalItems}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="ml-2 px-2 py-1 rounded-sm bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-xs font-medium text-ink dark:text-ink-dark outline-none"
            aria-label="Itens por página"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>{size} itens</option>
            ))}
          </select>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-2 dark:hover:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft"
            aria-label="Primeira página"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M18 17l-5-5 5-5M6 17V7" />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="w-7 h-7 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-2 dark:hover:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft"
            aria-label="Página anterior"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {start > 0 && (
            <>
              <button
                onClick={() => onPageChange(0)}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors hover:bg-surface-2 dark:hover:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft"
              >
                1
              </button>
              <span className="px-1 text-ink-faint dark:text-ink-dark-faint text-xs">…</span>
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors ${
                page === currentPage
                  ? 'bg-brand dark:bg-brand-dark text-brand-ink dark:text-brand-dark-ink'
                  : 'hover:bg-surface-2 dark:hover:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft'
              }`}
              aria-label={`Página ${page + 1}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page + 1}
            </button>
          ))}

          {end < totalPages && (
            <>
              <span className="px-1 text-ink-faint dark:text-ink-dark-faint text-xs">…</span>
              <button
                onClick={() => onPageChange(totalPages - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors hover:bg-surface-2 dark:hover:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-2 dark:hover:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft"
            aria-label="Próxima página"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            className="w-7 h-7 flex items-center justify-center rounded-sm text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-2 dark:hover:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft"
            aria-label="Última página"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M6 17l5-5-5-5M18 17V7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
