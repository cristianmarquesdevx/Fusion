/** @format */

import React from 'react';
import { Helpers } from '../../utils/helpers';

export default function KPICard({ label, value, trend, format, delta, deltaType = 'up' }) {
  const formattedValue = React.useMemo(() => {
    if (format === 'currency') return Helpers.formatCurrency(value);
    if (format === 'percent') return `${value}%`;
    return Helpers.formatNumber(value);
  }, [value, format]);

  return (
    <div className="card p-4 sm:p-5">
      <div className="text-xs text-ink-soft dark:text-ink-dark-soft mb-2.5 font-medium">
        {label}
      </div>
      <div className="font-mono text-2xl sm:text-3xl font-medium tracking-tight text-ink dark:text-ink-dark">
        {formattedValue}
      </div>
      {delta && (
        <div
          className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold ${
            deltaType === 'up'
              ? 'text-sage dark:text-sage-dark'
              : 'text-rose dark:text-rose-dark'
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="w-2.5 h-2.5"
          >
            {deltaType === 'up' ? (
              <path d="M6 15l6-6 6 6" />
            ) : (
              <path d="M6 9l6 6 6-6" />
            )}
          </svg>
          {delta}
        </div>
      )}
    </div>
  );
}
