/** @format */

import React, { useState, useCallback, useRef } from 'react';

const colorMap = {
  c1: {
    bg: 'bg-sage-soft dark:bg-sage-dark-soft',
    border: 'border-sage dark:border-sage-dark',
    text: 'text-sage dark:text-sage-dark',
  },
  c2: {
    bg: 'bg-gold-soft dark:bg-gold-dark-soft',
    border: 'border-gold dark:border-gold-dark',
    text: 'text-gold dark:text-gold-dark',
  },
  c3: {
    bg: 'bg-rose-soft/60 dark:bg-rose-dark-soft/60',
    border: 'border-rose/40 dark:border-rose-dark/40',
    text: 'text-rose dark:text-rose-dark',
  },
};

export default function WeekGrid({ timeSlots, weekDays, weekGrid, onCellClick, onMoveAppointment, onAppointmentClick }) {
  const [dragState, setDragState] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const dragRef = useRef(null);

  const handleDragStart = useCallback((e, rowIdx, colIdx) => {
    const appt = weekGrid[rowIdx]?.[colIdx];
    if (!appt) return;

    // Set drag data
    e.dataTransfer.setData('text/plain', JSON.stringify({ row: rowIdx, col: colIdx }));
    e.dataTransfer.effectAllowed = 'move';

    // Allow a small delay for the drag image to render
    requestAnimationFrame(() => {
      setDragState({ row: rowIdx, col: colIdx, appt });
    });

    // Reduce opacity of the source element
    if (e.target) {
      e.target.style.opacity = '0.4';
    }
  }, [weekGrid]);

  const handleDragEnd = useCallback((e) => {
    setDragState(null);
    setDropTarget(null);
    if (e.target) {
      e.target.style.opacity = '';
    }
  }, []);

  const handleDragOver = useCallback((e, rowIdx, colIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget({ row: rowIdx, col: colIdx });
  }, []);

  const handleDragLeave = useCallback(() => {
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback((e, toRow, toCol) => {
    e.preventDefault();
    setDropTarget(null);

    const data = e.dataTransfer.getData('text/plain');
    if (!data) return;

    const { row: fromRow, col: fromCol } = JSON.parse(data);
    if (fromRow === toRow && fromCol === toCol) return;

    onMoveAppointment?.(fromRow, fromCol, toRow, toCol);
  }, [onMoveAppointment]);

  const isOver = (rowIdx, colIdx) =>
    dropTarget?.row === rowIdx && dropTarget?.col === colIdx;

  const isDragging = (rowIdx, colIdx) =>
    dragState?.row === rowIdx && dragState?.col === colIdx;

  return (      <div className="card overflow-hidden select-none">
      {/* Grid header */}
      <div className="grid grid-cols-[64px_repeat(6,1fr)] border-b border-border dark:border-border-dark">
        <div className="px-3 py-3 text-xs font-semibold text-ink-faint dark:text-ink-dark-faint uppercase tracking-wider">
          Horário
        </div>
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`px-3 py-3 text-xs font-semibold text-center border-l border-border dark:border-border-dark ${
              i === 1 ? 'text-brand dark:text-brand-dark' : 'text-ink-soft dark:text-ink-dark-soft'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid body */}
      {timeSlots.map((time, rowIdx) => (
        <div
          key={time}
          className={`grid grid-cols-[64px_repeat(6,1fr)] border-b border-border dark:border-border-dark last:border-b-0 transition-colors duration-150 ${
            dragState ? 'bg-surface-2/60 dark:bg-surface-dark-2/40' : 'hover:bg-surface-2/50 dark:hover:bg-surface-dark-2/30'
          }`}
        >
          {/* Time label */}
          <div className="px-3 py-3.5 text-[11px] font-mono text-ink-soft dark:text-ink-dark-soft flex items-start justify-end pr-4">
            {time}
          </div>

          {/* Cells */}
          {weekDays.map((_, colIdx) => {
            const appt = weekGrid[rowIdx]?.[colIdx];
            const colors = appt ? colorMap[appt.color] || colorMap.c1 : null;
            const dragging = isDragging(rowIdx, colIdx);
            const hovering = isOver(rowIdx, colIdx);

            return (
              <div
                key={colIdx}
                className={`relative px-1.5 py-1.5 border-l border-border dark:border-border-dark min-h-[52px] flex items-start transition-all duration-150 ${
                  hovering && !dragging
                    ? 'bg-brand-soft/15 dark:bg-brand-dark-soft/20 shadow-[inset_0_0_0_1.5px_rgba(156,122,62,0.3)] dark:shadow-[inset_0_0_0_1.5px_rgba(216,182,119,0.3)]'
                    : ''
                }`}
                onDragOver={(e) => handleDragOver(e, rowIdx, colIdx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, rowIdx, colIdx)}
                onClick={() => {
                  if (!dragState) {
                    if (appt && onAppointmentClick) {
                      onAppointmentClick(appt);
                    } else if (!appt) {
                      onCellClick?.(time, colIdx);
                    }
                  }
                }}
              >
                {appt ? (
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, rowIdx, colIdx)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!dragState) onAppointmentClick?.(appt);
                    }}
                    className={`
                      w-full rounded-md px-2 py-1.5 border-l-2 cursor-pointer active:cursor-grabbing
                      transition-all duration-150
                      ${dragging ? 'opacity-30 scale-95 shadow-none' : 'hover:shadow-md active:scale-[0.98]'}
                      ${hovering && !dragging ? 'ring-2 ring-brand/30 dark:ring-brand-dark/30' : ''}
                      ${colors?.bg} ${colors?.border || ''}
                    `}
                    style={
                      dragging
                        ? { transform: 'rotate(2deg)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
                        : {}
                    }
                  >
                    <div className="text-[12.5px] font-semibold text-ink dark:text-ink-dark truncate leading-tight">
                      {appt.client}
                    </div>
                    <div className={`text-[10.5px] font-medium ${colors?.text || ''} truncate leading-tight mt-0.5`}>
                      {appt.service}
                    </div>
                    {appt.status === 'em_atendimento' && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-semibold text-blue-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Em atendimento
                      </span>
                    )}
                    {appt.valor && (
                      <div className="text-[10px] font-mono font-medium text-ink-faint dark:text-ink-dark-faint mt-0.5">
                        R$ {appt.valor}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    className={`w-full h-full min-h-[36px] rounded-md border border-dashed transition-all duration-150 flex items-center justify-center
                      ${hovering
                        ? 'border-brand dark:border-brand-dark bg-brand-soft/20 dark:bg-brand-dark-soft/20 opacity-100'
                        : dragging
                          ? 'border-brand/40 dark:border-brand-dark/40 opacity-100'
                          : 'border-border dark:border-border-dark opacity-0 group-hover:opacity-100'
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!dragState) onCellClick?.(time, colIdx);
                    }}
                    onDragOver={(e) => handleDragOver(e, rowIdx, colIdx)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, rowIdx, colIdx)}
                  >
                    {hovering || !dragState ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-ink-faint dark:text-ink-dark-faint">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-brand dark:text-brand-dark animate-fade-in">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Drag helper — mostra info do item sendo arrastado */}
      {dragState && (
        <div className="px-5 py-2.5 border-t border-border dark:border-border-dark bg-surface-2 dark:bg-surface-dark-2 text-xs text-ink-soft dark:text-ink-dark-soft flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-brand dark:bg-brand-dark animate-pulse" />
          Arrastando: <strong className="text-ink dark:text-ink-dark">{dragState.appt.client}</strong>
          <span className="text-ink-faint dark:text-ink-dark-faint">·</span>
          {dragState.appt.service}
          <span className="text-ink-faint dark:text-ink-dark-faint">·</span>
          {timeSlots[dragState.row]}
          <span className="ml-auto text-ink-faint dark:text-ink-dark-faint">
            Solte sobre uma célula para mover
          </span>
        </div>
      )}
    </div>
  );
}
