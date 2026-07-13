/** @format */

import React, { useEffect, useRef, useState } from 'react';
import { Helpers } from '../../utils/helpers';

export default function ProfessionalsBarChart({ data = [] }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setWidth(Math.max(containerRef.current.offsetWidth, 200));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(timer);
  }, []);

  if (!data.length) {
    return (
      <div ref={containerRef} className="w-full h-[160px] flex items-center justify-center text-ink-faint dark:text-ink-dark-faint text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((d) => d.receita), 1);
  const maxAtendimentos = Math.max(...data.map((d) => d.atendimentos), 1);
  const barHeight = 32;
  const gap = 8;
  const totalHeight = data.length * (barHeight + gap) + 20;
  const chartHeight = Math.max(totalHeight, 80);

  return (
    <div ref={containerRef} className="w-full select-none" style={{ height: chartHeight }}>
      <svg width={width} height={chartHeight} viewBox={`0 0 ${width} ${chartHeight}`}>
        {data.map((d, i) => {
          const y = i * (barHeight + gap);
          const barWidth = (d.receita / maxRevenue) * (width - 180);
          const showWidth = animated ? barWidth : 0;

          return (
            <g key={i} className="transition-opacity duration-500">
              {/* Label */}
              <text
                x={0}
                y={y + 12}
                className="fill-ink dark:fill-ink-dark font-semibold"
                fontSize="12"
                fontFamily="inherit"
              >
                {d.name}
              </text>
              <text
                x={0}
                y={y + 23}
                className="fill-ink-faint dark:fill-ink-dark-faint"
                fontSize="10"
                fontFamily="inherit"
              >
                {d.atendimentos} atendimentos
              </text>

              {/* Bar background */}
              <rect
                x={145}
                y={y + 2}
                width={width - 180}
                height={barHeight - 4}
                rx={6}
                className="fill-surface-2 dark:fill-surface-dark-2"
              />

              {/* Bar fill */}
              <rect
                x={145}
                y={y + 2}
                width={showWidth}
                height={barHeight - 4}
                rx={6}
                fill={d.cor || '#6C5CE7'}
                className="transition-all duration-1000"
                style={{ transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
              />

              {/* Value label */}
              <text
                x={width - 30}
                y={y + 18}
                textAnchor="end"
                className="fill-ink dark:fill-ink-dark font-semibold tabular-nums"
                fontSize="12"
                fontFamily="inherit"
                opacity={animated ? 1 : 0}
                style={{ transition: 'opacity 0.5s ease', transitionDelay: `${0.6 + i * 0.1}s` }}
              >
                {Helpers.formatCompactCurrency(d.receita)}
              </text>

              {/* Mini progress bar for atendimentos */}
              <rect
                x={145}
                y={y + barHeight - 6}
                width={((d.atendimentos / maxAtendimentos) * (width - 180)) || 0}
                height={3}
                rx={1.5}
                fill="currentColor"
                className="text-ink-faint dark:text-ink-dark-faint"
                opacity={0.25}
                style={{ transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)', transitionDelay: `${0.3 + i * 0.1}s` }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
