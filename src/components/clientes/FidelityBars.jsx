/** @format */

import React from 'react';

const levels = [
  { label: 'Bronze' },
  { label: 'Prata' },
  { label: 'Ouro' },
  { label: 'Platina' },
];

export default function FidelityBars({ bars }) {
  if (!bars) return null;

  return (
    <div className="space-y-2.5">
      {levels.map((lvl) => {
        const pct = bars[lvl.label.toLowerCase()] || 0;
        const filled = pct >= 100;
        return (
          <div key={lvl.label} className="flex items-center gap-3">
            <span className="text-xs font-medium text-ink-soft dark:text-ink-dark-soft w-14 shrink-0">
              {lvl.label}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: filled ? 'var(--gold, #D8B677)' : 'var(--gold-soft, rgba(216, 182, 119, 0.25))',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
