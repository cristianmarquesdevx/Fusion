/** @format */

import React, { useEffect, useRef, useState } from 'react';

export default function ServicesChart({ data = [] }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 200 });
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth;
        setDimensions({ width: Math.max(w, 160), height: 200 });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const { width } = dimensions;
  const size = Math.min(width - 120, 160);
  const cx = 80;
  const cy = 100;
  const radius = 60;
  const strokeWidth = 28;

  if (!data.length) {
    return (
      <div ref={containerRef} className="w-full h-[200px] flex items-center justify-center text-ink-faint dark:text-ink-dark-faint text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  const slices = data.map((d, i) => {
    const percent = d.value / total;
    const startPercent = cumulativePercent;
    const endPercent = cumulativePercent + percent;
    cumulativePercent = endPercent;

    const startAngle = startPercent * 360 - 90;
    const endAngle = endPercent * 360 - 90;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const largeArc = percent > 0.5 ? 1 : 0;

    const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

    // Para stroke-dasharray precisamos do comprimento do arco
    const arcLength = circumference * percent;

    return { ...d, percent, arcLength, startPercent, endPercent };
  });

  return (
    <div ref={containerRef} className="w-full h-[200px] relative">
      <svg width={width} height={200} viewBox={`0 0 ${width} 200`}>
        <defs />

        {/* Background circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-surface-2 dark:text-surface-dark-2"
          strokeWidth={strokeWidth}
        />

        {/* Donut slices com animação */}
        {slices.map((d, i) => {
          const offset = circumference * (1 - d.startPercent);
          const drawnLength = animated ? d.arcLength : 0;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth={hoveredSlice === i ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${d.arcLength} ${circumference - d.arcLength}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-700 cursor-pointer"
              style={{
                transformOrigin: 'center',
                transform: hoveredSlice === i ? 'scale(1.04)' : 'scale(1)',
                transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.3s ease, transform 0.3s ease',
              }}
              onMouseEnter={() => setHoveredSlice(i)}
              onMouseLeave={() => setHoveredSlice(null)}
            />
          );
        })}

        {/* Center value */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-ink dark:fill-ink-dark"
          fontSize="18"
          fontWeight="700"
          fontFamily="inherit"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          className="fill-ink-faint dark:fill-ink-dark-faint"
          fontSize="9"
          fontFamily="inherit"
        >
          serviços
        </text>

        {/* Legend */}
        <g transform={`translate(${cx + radius + 24}, ${cy - 50})`}>
          {slices.map((d, i) => {
            const isHovered = hoveredSlice === i;
            return (
              <g
                key={i}
                transform={`translate(0, ${i * 21})`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredSlice(i)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <rect
                  x={0}
                  y={0}
                  width={8}
                  height={8}
                  rx={2}
                  fill={d.color}
                  className="transition-transform duration-200"
                  style={{ transform: isHovered ? 'scale(1.2)' : 'scale(1)' }}
                />
                <text
                  x={14}
                  y={7}
                  className={`fill-ink dark:fill-ink-dark text-[11px] transition-all duration-200`}
                  fontWeight={isHovered ? '700' : '500'}
                  fontFamily="inherit"
                >
                  {d.name}
                </text>
                <text
                  x={14}
                  y={18}
                  className="fill-ink-faint dark:fill-ink-dark-faint text-[10px]"
                  fontFamily="inherit"
                >
                  {(d.percent * 100).toFixed(0)}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
