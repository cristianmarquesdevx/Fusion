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

function MiniSparkline({ data = [], color = '#4C7A5E', width = 60, height = 20 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={`sparkFill-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" points={pts} />
    </svg>
  );
}

const KPI_ICONS = {
  revenue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  appointments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  occupancy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

const KPI_COLORS = {
  revenue: { dot: 'bg-gold dark:bg-gold-dark', text: 'text-gold dark:text-gold-dark', bg: 'bg-gold-soft/10 dark:bg-gold-dark-soft/10', stroke: '#9C7A3E' },
  appointments: { dot: 'bg-sage dark:bg-sage-dark', text: 'text-sage dark:text-sage-dark', bg: 'bg-sage-soft/10 dark:bg-sage-dark-soft/10', stroke: '#4C7A5E' },
  clients: { dot: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-50/10 dark:bg-blue-900/10', stroke: '#6C5CE7' },
  occupancy: { dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-50/10 dark:bg-amber-900/10', stroke: '#F59E0B' },
};

export default function KPICard({
  kpiKey,
  label,
  value,
  format,
  delta,
  deltaType = 'up',
  sparkline = [],
  icon = true,
  onClick,
  isExpanded = false,
}) {
  const colors = KPI_COLORS[kpiKey] || KPI_COLORS.revenue;

  return (
    <button
      onClick={onClick}
      className="card p-4 sm:p-5 w-full text-left group relative overflow-hidden cursor-pointer
        hover:shadow-lg dark:hover:shadow-dark-lg
        transition-all duration-300 ease-out
        active:scale-[0.98]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:focus-visible:outline-brand-dark"
    >
      {/* Background glow */}
      <div
        className={`absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 dark:group-hover:opacity-10 transition-opacity duration-500 blur-2xl ${colors.bg}`}
      />

      {/* Top row: icon + label + expand arrow */}
      <div className="flex items-center justify-between mb-2.5 relative z-[1]">
        <div className="flex items-center gap-2">
          {icon && (
            <span className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${colors.bg} ${colors.text}`}>
              {KPI_ICONS[kpiKey] || KPI_ICONS.revenue}
            </span>
          )}
          <div className="text-xs text-ink-soft dark:text-ink-dark-soft font-medium">
            {label}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Status dot */}
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} transition-all duration-300 ${isExpanded ? 'scale-125' : 'group-hover:scale-125'}`} />
          {/* Expand arrow */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3 h-3 text-ink-faint dark:text-ink-dark-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          >
            <path d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </div>
      </div>

      {/* Value + sparkline row */}
      <div className="flex items-end gap-3 relative z-[1]">
        <div className="min-w-0 flex-1">
          <div className="font-mono text-2xl sm:text-3xl font-medium tracking-tight text-ink dark:text-ink-dark tabular-nums">
            <AnimatedNumber value={value} format={format} />
          </div>
        </div>
        {sparkline.length > 0 && (
          <div className="shrink-0 pb-1 opacity-40 group-hover:opacity-70 transition-opacity duration-300">
            <MiniSparkline data={sparkline} color={colors.stroke} width={64} height={24} />
          </div>
        )}
      </div>

      {/* Delta + meta row */}
      <div className="flex items-center gap-2 mt-2.5 relative z-[1]">
        {delta && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-semibold ${
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
        <span className="text-[10px] text-ink-faint dark:text-ink-dark-faint ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          Clique para detalhes →
        </span>
      </div>

      {/* Bottom accent bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-500 ${colors.bg}`}>
        <div
          className={`h-full ${colors.dot} transition-all duration-700 ${isExpanded ? 'w-full' : 'w-0 group-hover:w-1/3'}`}
          style={{ backgroundColor: KPI_COLORS[kpiKey]?.stroke || '#9C7A3E' }}
        />
      </div>
    </button>
  );
}
