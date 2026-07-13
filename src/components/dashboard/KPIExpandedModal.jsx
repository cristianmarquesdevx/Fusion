/** @format */

import React from 'react';
import { Helpers } from '../../utils/helpers';
import Modal from '../ui/Modal';

/* ─── Mini chart reutilizável ─── */
function MiniBarChart({ data = [], color = '#4C7A5E', height = 80, format = 'currency' }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value || d), 1);
  return (
    <div className="flex items-end gap-1.5 h-[80px] pt-4">
      {data.map((d, i) => {
        const val = typeof d === 'number' ? d : d.value;
        const label = typeof d === 'object' && d.label ? d.label : (typeof d === 'object' && d.mes ? d.mes : '');
        const pct = (val / max) * 100;
        const isLatest = i === data.length - 1;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/bar">
            <span className="text-[9px] font-mono text-ink-faint dark:text-ink-dark-faint opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
              {format === 'currency' ? Helpers.formatCompactCurrency(val) : val}
            </span>
            <div
              className={`w-full rounded-[4px_4px_2px_2px] transition-all duration-500 ease-out ${
                isLatest ? 'opacity-100' : 'opacity-60 hover:opacity-90'
              }`}
              style={{
                height: `${pct}%`,
                backgroundColor: isLatest ? color : `${color}99`,
                maxWidth: 28,
              }}
            />
            {label && (
              <span className="text-[9px] text-ink-faint dark:text-ink-dark-faint">{label.slice(0, 3)}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Barra de progresso horizontal ─── */
function ProgressBar({ value, max, color = '#4C7A5E', label, valueLabel, size = 'sm' }) {
  const pct = Math.min((value / (max || 1)) * 100, 100);
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs text-ink-soft dark:text-ink-dark-soft min-w-[80px] shrink-0">{label}</span>
      <div className={`flex-1 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden ${size === 'sm' ? 'h-2' : 'h-3'}`}>
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className={`font-mono text-xs font-semibold tabular-nums text-ink dark:text-ink-dark shrink-0 ${size === 'sm' ? 'min-w-[50px] text-right' : ''}`}>
        {valueLabel || value}
      </span>
    </div>
  );
}

/* ─── Gauge circular minimalista ─── */
function MiniGauge({ value, max = 100, color = '#4C7A5E', size = 80, label }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-surface-2 dark:text-surface-dark-2" strokeWidth="6" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
          style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
        />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" className="fill-ink dark:fill-ink-dark font-bold" fontSize="16" fontFamily="inherit">
          {Math.round(pct * 100)}%
        </text>
        <text x={size / 2} y={size / 2 + 12} textAnchor="middle" className="fill-ink-faint dark:fill-ink-dark-faint" fontSize="8" fontFamily="inherit">
          {label || ''}
        </text>
      </svg>
    </div>
  );
}

/* ════════════════════════════════════ */
/*  MODAL PRINCIPAL                     */
/* ════════════════════════════════════ */

export default function KPIExpandedModal({ kpiKey, data, onClose }) {
  if (!data || !kpiKey) return null;

  const renderContent = () => {
    switch (kpiKey) {
      case 'revenue':
        return <RevenueDetail data={data} />;
      case 'appointments':
        return <AppointmentsDetail data={data} />;
      case 'clients':
        return <ClientsDetail data={data} />;
      case 'occupancy':
        return <OccupancyDetail data={data} />;
      default:
        return <div className="text-ink-faint dark:text-ink-dark-faint">Detalhes indisponíveis</div>;
    }
  };

  const titles = {
    revenue: 'Detalhes de Faturamento',
    appointments: 'Detalhes de Agendamentos',
    clients: 'Detalhes de Clientes',
    occupancy: 'Detalhes de Ocupação',
  };

  return (
    <Modal open={true} onClose={onClose} title={titles[kpiKey] || 'Detalhes'} maxWidth="max-w-2xl">
      <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto">
        {renderContent()}
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════ */
/*  PAINEL — FATURAMENTO               */
/* ════════════════════════════════════ */
function RevenueDetail({ data }) {
  const { breakdown = [], dailyTrend = [], dailyLabels = [], target = 15000, targetPct = 84, comparison, historico = [] } = data.expanded || {};

  const dailyData = dailyTrend.map((v, i) => ({ value: v, label: dailyLabels[i] || '' }));

  return (
    <div className="space-y-5">
      {/* Target gauge + comparison */}
      <div className="flex items-center justify-around gap-4 p-4 rounded-xl bg-surface-2/50 dark:bg-surface-dark-2/50">
        <div className="text-center">
          <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint font-medium mb-1">Hoje</div>
          <div className="font-mono text-2xl font-bold text-ink dark:text-ink-dark tabular-nums">
            {Helpers.formatCompactCurrency(data.value)}
          </div>
        </div>
        <div className="w-px h-12 bg-border dark:bg-border-dark" />
        <MiniGauge value={data.value} max={target} color="#9C7A3E" size={80} label="meta" />
        <div className="w-px h-12 bg-border dark:bg-border-dark" />
        <div className="text-center">
          <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint font-medium mb-1">vs. sem. passada</div>
          <div className="font-mono text-lg font-bold text-sage dark:text-sage-dark tabular-nums">
            +{comparison?.delta || 0}%
          </div>
          <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint">
            {comparison ? Helpers.formatCompactCurrency(comparison.value) : ''}
          </div>
        </div>
      </div>

      {/* Breakdown by category */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2.5">Distribuição por categoria</h3>
        <div className="space-y-2.5">
          {breakdown.map((item, i) => (
            <ProgressBar
              key={i}
              label={item.name}
              value={item.value}
              max={data.value}
              valueLabel={Helpers.formatCurrency(item.value)}
              color={i === 0 ? '#9C7A3E' : i === 1 ? '#4C7A5E' : i === 2 ? '#6C5CE7' : '#8A9186'}
            />
          ))}
        </div>
      </div>

      {/* Daily trend */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2">Tendência diária</h3>
        <div className="card p-3 bg-surface-2/30 dark:bg-surface-dark-2/30">
          <MiniBarChart data={dailyData} color="#9C7A3E" />
        </div>
      </div>

      {/* Monthly historical */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2">Histórico mensal</h3>
        <div className="card p-3 bg-surface-2/30 dark:bg-surface-dark-2/30">
          <MiniBarChart data={historico} color="#4C7A5E" format="currency" />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/*  PAINEL — AGENDAMENTOS              */
/* ════════════════════════════════════ */
function AppointmentsDetail({ data }) {
  const { breakdown = [], byProfessional = [], byRoom = [], slotsDisponiveis = 0, totalSlots = 22 } = data.expanded || {};

  return (
    <div className="space-y-5">
      {/* Status overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {breakdown.map((item, i) => (
          <div key={i} className="card p-3 text-center bg-surface-2/30 dark:bg-surface-dark-2/30">
            <div className="text-lg font-bold font-mono text-ink dark:text-ink-dark tabular-nums">{item.value}</div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-ink-faint dark:text-ink-dark-faint">{item.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Available slots */}
      <div className="p-4 rounded-xl bg-surface-2/50 dark:bg-surface-dark-2/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-ink dark:text-ink-dark">Slots disponíveis</span>
          <span className="font-mono text-sm font-bold text-ink dark:text-ink-dark">
            {slotsDisponiveis}/{totalSlots}
          </span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
          <div
            className="h-full rounded-full bg-sage dark:bg-sage-dark transition-all duration-700"
            style={{ width: `${((totalSlots - slotsDisponiveis) / totalSlots) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-ink-faint dark:text-ink-dark-faint mt-1">
          <span>{totalSlots - slotsDisponiveis} ocupados</span>
          <span>{slotsDisponiveis} livres</span>
        </div>
      </div>

      {/* By professional */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2.5">Por profissional</h3>
        <div className="space-y-2">
          {byProfessional.map((item, i) => (
            <ProgressBar
              key={i}
              label={item.name}
              value={item.value}
              max={Math.max(...byProfessional.map((p) => p.value), 1)}
              valueLabel={`${item.value} ag.`}
              color={['#6C5CE7', '#00B894', '#FDCB6E'][i] || '#8A9186'}
            />
          ))}
        </div>
      </div>

      {/* By room */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2.5">Por sala</h3>
        <div className="space-y-1.5">
          {byRoom.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border dark:border-border-dark last:border-b-0">
              <span className="text-xs text-ink-soft dark:text-ink-dark-soft">{item.name}</span>
              <span className="font-mono text-xs font-semibold text-ink dark:text-ink-dark">{item.value} agendamentos</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/*  PAINEL — CLIENTES                  */
/* ════════════════════════════════════ */
function ClientsDetail({ data }) {
  const { breakdown = [], retencao = 87, ticketMedio = 238, frequenciaMedia = '2.8 visitas/mês', topServicos = [], novosPorMes = [] } = data.expanded || {};

  const novosData = novosPorMes.map((v, i) => ({ value: v, label: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i] || '' }));

  return (
    <div className="space-y-5">
      {/* Status overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {breakdown.map((item, i) => (
          <div key={i} className="card p-3 text-center bg-surface-2/30 dark:bg-surface-dark-2/30">
            <div className="text-lg font-bold font-mono text-ink dark:text-ink-dark tabular-nums">{item.value}</div>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[11px] text-ink-faint dark:text-ink-dark-faint">{item.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Retention + Ticket */}
      <div className="flex items-center justify-around gap-4 p-4 rounded-xl bg-surface-2/50 dark:bg-surface-dark-2/50">
        <MiniGauge value={retencao} max={100} color="#4C7A5E" size={80} label="retenção" />
        <div className="w-px h-14 bg-border dark:bg-border-dark" />
        <div className="text-center">
          <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint font-medium">Ticket médio</div>
          <div className="font-mono text-xl font-bold text-ink dark:text-ink-dark tabular-nums">{Helpers.formatCurrency(ticketMedio)}</div>
        </div>
        <div className="w-px h-14 bg-border dark:bg-border-dark" />
        <div className="text-center">
          <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint font-medium">Frequência</div>
          <div className="font-mono text-lg font-bold text-ink dark:text-ink-dark tabular-nums">{frequenciaMedia.split(' ')[0]}</div>
          <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint">visitas/mês</div>
        </div>
      </div>

      {/* Top services */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2.5">Serviços mais procurados</h3>
        <div className="flex flex-wrap gap-2">
          {topServicos.map((s, i) => (
            <span key={i} className="tag text-[11px] px-3 py-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 text-ink-soft dark:text-ink-dark-soft">
              {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : '🥉 '}
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* New clients trend */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2">Novas clientes por mês</h3>
        <div className="card p-3 bg-surface-2/30 dark:bg-surface-dark-2/30">
          <MiniBarChart data={novosData} color="#6C5CE7" format="number" />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ */
/*  PAINEL — OCUPAÇÃO                  */
/* ════════════════════════════════════ */
function OccupancyDetail({ data }) {
  const { rooms = [], horarioPico = '', horarioVale = '', mediaOcupacao = 78 } = data.expanded || {};

  const getRoomStatus = (status) => {
    switch (status) {
      case 'ocupada': return { color: '#B14E3D', bg: 'bg-rose-soft/20 dark:bg-rose-dark-soft/20', text: 'text-rose dark:text-rose-dark', label: 'Ocupada' };
      case 'livre': return { color: '#4C7A5E', bg: 'bg-sage-soft/20 dark:bg-sage-dark-soft/20', text: 'text-sage dark:text-sage-dark', label: 'Livre' };
      case 'disponivel': return { color: '#9C7A3E', bg: 'bg-gold-soft/20 dark:bg-gold-dark-soft/20', text: 'text-gold dark:text-gold-dark', label: 'Disponível' };
      default: return { color: '#8A9186', bg: 'bg-surface-2/30', text: 'text-ink-faint', label: status };
    }
  };

  return (
    <div className="space-y-5">
      {/* Overall gauge */}
      <div className="flex items-center justify-around gap-4 p-4 rounded-xl bg-surface-2/50 dark:bg-surface-dark-2/50">
        <MiniGauge value={mediaOcupacao} max={100} color="#F59E0B" size={90} label="ocupação" />
        <div className="w-px h-14 bg-border dark:bg-border-dark" />
        <div className="text-center">
          <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint font-medium">Horário de pico</div>
          <div className="font-mono text-lg font-bold text-ink dark:text-ink-dark">{horarioPico}</div>
        </div>
        <div className="w-px h-14 bg-border dark:bg-border-dark" />
        <div className="text-center">
          <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint font-medium">Horário vale</div>
          <div className="font-mono text-lg font-bold text-ink dark:text-ink-dark">{horarioVale}</div>
        </div>
      </div>

      {/* Rooms table */}
      <div>
        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-2.5">Ocupação por sala</h3>
        <div className="space-y-2">
          {rooms.map((room, i) => {
            const status = getRoomStatus(room.status);
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-2/30 dark:bg-surface-dark-2/30 hover:bg-surface-2/50 dark:hover:bg-surface-dark-2/50 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: status.color }} />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-ink dark:text-ink-dark">{room.name}</div>
                  <div className="flex items-center gap-2 text-[10px] text-ink-faint dark:text-ink-dark-faint">
                    <span>Próx: {room.proximoHorario}</span>
                  </div>
                </div>
                <div className="w-16 h-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${room.ocupacao}%`, backgroundColor: status.color }}
                  />
                </div>
                <span className={`text-[11px] font-semibold ${status.text} shrink-0 min-w-[60px] text-right`}>
                  {room.ocupacao}%
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.text} shrink-0`}>
                  {status.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
