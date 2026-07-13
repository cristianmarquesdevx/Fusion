/** @format */

import React from 'react';

const statusStyles = {
  'Em dia': 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark',
  ok: 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark',
  'Pagamento pendente': 'bg-gold-soft dark:bg-gold-dark-soft text-gold dark:text-gold-dark',
  warn: 'bg-gold-soft dark:bg-gold-dark-soft text-gold dark:text-gold-dark',
  'Fidelidade expirando': 'bg-rose-soft dark:bg-rose-dark-soft text-rose dark:text-rose-dark',
  crit: 'bg-rose-soft dark:bg-rose-dark-soft text-rose dark:text-rose-dark',
  success: 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark',
  warning: 'bg-gold-soft dark:bg-gold-dark-soft text-gold dark:text-gold-dark',
  danger: 'bg-rose-soft dark:bg-rose-dark-soft text-rose dark:text-rose-dark',
  default: 'bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft',
};

export default function StatusChip({ status, className = '' }) {
  const style = statusStyles[status] || statusStyles.default;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${style} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
