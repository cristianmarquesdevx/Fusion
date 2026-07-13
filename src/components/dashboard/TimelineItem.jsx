/** @format */

import React from 'react';

export default function TimelineItem({ time, client, service, professional, status, room, delay }) {
  const getDotStyle = () => {
    switch (status) {
      case 'concluido':
        return { borderColor: '#9C7A3E', background: '#9C7A3E' };
      case 'ativo':
        return { borderColor: '#4C7A5E', background: '#4C7A5E' };
      case 'atrasado':
        return { borderColor: '#B14E3D', background: '#B14E3D' };
      default:
        return { borderColor: '#8A9186', background: 'transparent' };
    }
  };

  const getTagInfo = () => {
    switch (status) {
      case 'concluido':
        return { label: 'Concluído', cls: 'bg-gold-soft dark:bg-gold-dark-soft text-gold dark:text-gold-dark' };
      case 'ativo':
        return { label: 'Em atendimento', cls: 'bg-sage-soft dark:bg-sage-dark-soft text-sage dark:text-sage-dark' };
      case 'atrasado':
        return { label: `Atrasado ${delay || 12} min`, cls: 'bg-rose-soft dark:bg-rose-dark-soft text-rose dark:text-rose-dark' };
      default:
        return { label: 'Aguardando', cls: 'bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft' };
    }
  };

  const dot = getDotStyle();
  const tag = getTagInfo();

  return (
    <div className="grid grid-cols-[40px_20px_1fr_auto] gap-x-3.5 py-2.5 border-b border-border dark:border-border-dark last:border-b-0">
      {/* Time */}
      <div className="font-mono text-xs text-ink-soft dark:text-ink-dark-soft text-right">
        {time}
      </div>

      {/* Dot */}
      <div className="flex justify-center relative">
        <span
          className="w-2.5 h-2.5 rounded-full z-[1]"
          style={{
            border: `2px solid ${dot.borderColor}`,
            backgroundColor: dot.background,
          }}
        />
        {status === 'ativo' && (
          <span
            className="absolute inset-[-4px] rounded-full animate-pulse-dot"
            style={{ border: `2px solid #4C7A5E`, opacity: 0.5 }}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink dark:text-ink-dark truncate">
          {client}
        </div>
        <div className="text-xs text-ink-soft dark:text-ink-dark-soft mt-0.5 truncate">
          {service} · {professional}
        </div>
      </div>

      {/* Tags */}
      <div className="flex items-start gap-1.5 flex-shrink-0">
        <span className="tag tag-room text-[10px]">{room}</span>
        <span className={`tag text-[10px] ${tag.cls}`}>{tag.label}</span>
      </div>
    </div>
  );
}
