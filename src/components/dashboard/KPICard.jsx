/** @format */

import React, { useEffect, useRef, useState } from 'react';
import { Helpers } from '../../utils/helpers';

function AnimatedNumber({ value, format }) {
  const [display, setDisplay] = useState(0);
  const prevValueRef = useRef(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    const startFrom = prevValueRef.current;
    if (startFrom === value) return;
    const duration = 800;
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(startFrom + (value - startFrom) * eased);
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  if (format === 'currency') return Helpers.formatCurrency(display);
  if (format === 'percent') return `${display}%`;
  return Helpers.formatNumber(display);
}

export default function KPICard({ label, value, format, delta, deltaType = 'up' }) {
  return (
    <div className="card p-4 sm:p-5 hover:shadow-md dark:hover:shadow-dark-md transition-shadow duration-300 group">
      <div className="flex items-center justify-between mb-2.5">
        <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium">
          {label}
        </div>
        {/* Mini sparkle indicator */}
        <span className="w-1.5 h-1.5 rounded-full bg-sage dark:bg-sage-dark opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="font-mono text-2xl sm:text-3xl font-medium tracking-tight text-ink dark:text-ink-dark tabular-nums">
        <AnimatedNumber value={value} format={format} />
      </div>

      {delta && (
        <div
          className={`inline-flex items-center gap-1 mt-2 text-xs font-semibold transition-opacity ${
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
            className={`w-2.5 h-2.5 transition-transform duration-300 ${
              deltaType === 'up' ? 'group-hover:-translate-y-0.5' : 'group-hover:translate-y-0.5'
            }`}
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
