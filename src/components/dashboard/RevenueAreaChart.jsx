/** @format */

import React, { useEffect, useRef, useState } from 'react';
import { Helpers } from '../../utils/helpers';

export default function RevenueAreaChart({ data = [], width: svgWidth = 0 }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 200 });
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setDimensions({ width: Math.max(w, 200), height: 200 });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const { width, height } = dimensions;
  const padding = { top: 20, right: 16, bottom: 28, left: 8 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  if (!data.length || chartW < 50) {
    return (
      <div ref={containerRef} className="w-full h-[200px] flex items-center justify-center text-ink-faint dark:text-ink-dark-faint text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.expenses || 0]));
  const minVal = 0;
  const yRange = maxVal - minVal || 1;

  const xScale = (i) => padding.left + (i / (data.length - 1)) * chartW;
  const yScale = (v) => padding.top + chartH - ((v - minVal) / yRange) * chartH;

  const revenuePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.revenue).toFixed(1)}`)
    .join(' ');

  const areaPath = revenuePath
    + ` L${xScale(data.length - 1).toFixed(1)},${yScale(0).toFixed(1)}`
    + ` L${xScale(0).toFixed(1)},${yScale(0).toFixed(1)} Z`;

  const expensesPath = data[0]?.expenses !== undefined
    ? data
        .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.expenses).toFixed(1)}`)
        .join(' ')
    : '';

  const expensesArea = expensesPath
    ? expensesPath
      + ` L${xScale(data.length - 1).toFixed(1)},${yScale(0).toFixed(1)}`
      + ` L${xScale(0).toFixed(1)},${yScale(0).toFixed(1)} Z`
    : '';

  const pathLength = 800;
  const animateProps = {
    strokeDasharray: pathLength,
    strokeDashoffset: 0,
    transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)',
  };

  return (
    <div ref={containerRef} className="w-full h-[200px] relative select-none">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9C7A3E" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#9C7A3E" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="expensesGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#B14E3D" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#B14E3D" stopOpacity={0.02} />
          </linearGradient>
          <filter id="glowRevenue">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = yScale(minVal + yRange * ratio);
          return (
            <g key={ratio}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-border dark:text-border-dark"
                strokeWidth="1"
                strokeDasharray="3,4"
              />
              <text
                x={padding.left - 6}
                y={y + 3}
                textAnchor="end"
                className="fill-ink-faint dark:fill-ink-dark-faint"
                fontSize="10"
                fontFamily="inherit"
              >
                {Helpers.formatCompactCurrency(minVal + yRange * ratio)}
              </text>
            </g>
          );
        })}

        {/* Area fill - revenue */}
        <path d={areaPath} fill="url(#revenueGrad)" className="transition-all duration-500" />

        {/* Area fill - expenses */}
        {expensesArea && (
          <path d={expensesArea} fill="url(#expensesGrad)" className="transition-all duration-500" />
        )}

        {/* Revenue line */}
        <path
          d={revenuePath}
          fill="none"
          stroke="#9C7A3E"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glowRevenue)"
          style={animateProps}
        />

        {/* Expenses line */}
        {expensesPath && (
          <path
            d={expensesPath}
            fill="none"
            stroke="#B14E3D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6,3"
            style={animateProps}
          />
        )}

        {/* Data points */}
        {data.map((d, i) => {
          const cx = xScale(i);
          const cy = yScale(d.revenue);
          const isHovered = hovered === i;
          return (
            <g key={i}>
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : 3}
                fill={isHovered ? '#9C7A3E' : '#fff'}
                stroke="#9C7A3E"
                strokeWidth="2"
                className="transition-all duration-200 cursor-pointer"
                style={{ animationDelay: `${i * 80}ms`, animation: 'fadeInUp 0.4s ease both' }}
                onMouseEnter={(e) => {
                  setHovered(i);
                  setTooltipPos({ x: cx, y: cy });
                }}
                onMouseLeave={() => setHovered(null)}
              />
              {isHovered && (
                <g>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={cx}
                    y2={yScale(0)}
                    stroke="#9C7A3E"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                    opacity={0.3}
                  />
                </g>
              )}
            </g>
          );
        })}

        {/* X labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={height - 2}
            textAnchor="middle"
            className="fill-ink-faint dark:fill-ink-dark-faint"
            fontSize="10"
            fontFamily="inherit"
          >
            {d.month}
          </text>
        ))}
      </svg>

      {/* Tooltip */}
      {hovered !== null && data[hovered] && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y - 10,
            transform: tooltipPos.x > width * 0.7 ? 'translateX(-100%)' : 'none',
          }}
        >
          <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg shadow-lg px-3.5 py-2.5 min-w-[140px] backdrop-blur-sm">
            <div className="text-[11px] font-semibold text-ink dark:text-ink-dark mb-1">
              {data[hovered].month}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-gold dark:bg-gold-dark" />
              <span className="text-ink-soft dark:text-ink-dark-soft">Rec.:</span>
              <span className="font-semibold text-ink dark:text-ink-dark ml-auto">
                {Helpers.formatCurrency(data[hovered].revenue)}
              </span>
            </div>
            {data[hovered].expenses !== undefined && (
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="w-2 h-2 rounded-full bg-rose dark:bg-rose-dark" />
                <span className="text-ink-soft dark:text-ink-dark-soft">Desp.:</span>
                <span className="font-semibold text-ink dark:text-ink-dark ml-auto">
                  {Helpers.formatCurrency(data[hovered].expenses)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
