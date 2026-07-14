/** @format */

/**
 * Fusion ERP v2 — SessaoDetailModal
 *
 * Modal de detalhes do agendamento. Exibe dados do cliente,
 * procedimento, profissional, sala, fidelidade, pacotes e ações rápidas.
 * Conecta dados entre AgendaStore, ClientStore e FidelidadeStore.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgendaStore } from '../../store/useAgendaStore';
import { useClientStore } from '../../store/useClientStore';
import { useFidelidadeStore } from '../../store/useFidelidadeStore';
import { useUIStore } from '../../store/useUIStore';
import { Helpers } from '../../utils/helpers';
import { FIDELIDADE_NIVEIS } from '../../utils/constants';
import Modal from '../ui/Modal';

/* ─── Badge de status ─── */
function StatusBadge({ status }) {
  const config = {
    confirmado: { bg: 'bg-sage-soft/20 dark:bg-sage-dark-soft/20', text: 'text-sage dark:text-sage-dark', dot: 'bg-sage dark:bg-sage-dark', label: 'Confirmado' },
    em_atendimento: { bg: 'bg-blue-50/20 dark:bg-blue-900/20', text: 'text-blue-500', dot: 'bg-blue-500', label: 'Em atendimento' },
    concluido: { bg: 'bg-sage-soft/10 dark:bg-sage-dark-soft/10', text: 'text-ink-faint dark:text-ink-dark-faint', dot: 'bg-ink-faint dark:bg-ink-dark-faint', label: 'Concluído' },
    cancelado: { bg: 'bg-rose-soft/20 dark:bg-rose-dark-soft/20', text: 'text-rose dark:text-rose-dark', dot: 'bg-rose dark:bg-rose-dark', label: 'Cancelado' },
    aguardando: { bg: 'bg-gold-soft/20 dark:bg-gold-dark-soft/20', text: 'text-gold dark:text-gold-dark', dot: 'bg-gold dark:bg-gold-dark', label: 'Aguardando' },
  };
  const c = config[status] || config.confirmado;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'em_atendimento' ? 'animate-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

/* ─── Badge de nível de fidelidade ─── */
function FidelityBadge({ nivel }) {
  const colors = {
    Bronze: { bg: 'bg-amber-700/10', text: 'text-amber-700', border: 'border-amber-700/20', icon: '🥉' },
    Prata: { bg: 'bg-slate-300/20', text: 'text-slate-600', border: 'border-slate-300/30', icon: '🥈' },
    Ouro: { bg: 'bg-yellow-500/15', text: 'text-yellow-600', border: 'border-yellow-500/25', icon: '🥇' },
    Platina: { bg: 'bg-gray-200/20', text: 'text-gray-700', border: 'border-gray-300/30', icon: '💎' },
    Diamante: { bg: 'bg-cyan-300/20', text: 'text-cyan-600', border: 'border-cyan-300/30', icon: '👑' },
  };
  const c = colors[nivel] || colors.Bronze;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className="text-[13px]">{c.icon}</span>
      {nivel}
    </span>
  );
}

/* ─── Barra de progresso ─── */
function ProgressBar({ value, max, label, color = 'bg-brand dark:bg-brand-dark' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-ink-soft dark:text-ink-dark-soft">{label}</span>
        <span className="font-mono font-semibold text-ink dark:text-ink-dark">{value}/{max}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-surface-2 dark:bg-surface-dark-2 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── Info row ─── */
function InfoRow({ icon, label, value, highlight }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-2/50 dark:hover:bg-surface-dark-2/50 transition-colors">
      <span className="w-8 h-8 rounded-lg bg-surface-2 dark:bg-surface-dark-2 flex items-center justify-center text-ink-faint dark:text-ink-dark-faint shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-ink-faint dark:text-ink-dark-faint">{label}</div>
        <div className={`text-sm font-semibold ${highlight ? 'text-brand dark:text-brand-dark' : 'text-ink dark:text-ink-dark'} truncate`}>
          {value || '—'}
        </div>
      </div>
    </div>
  );
}

/* ─── Detail card ─── */
function DetailCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-border dark:border-border-dark overflow-hidden ${className}`}>
      <div className="px-4 py-2.5 bg-surface-2/50 dark:bg-surface-dark-2/50 border-b border-border dark:border-border-dark">
        <h4 className="text-[11px] font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider">{title}</h4>
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function SessaoDetailModal({ open, onClose, appointment }) {
  const navigate = useNavigate();
  const { services, professionals, updateAppointmentStatus, removeAppointment } = useAgendaStore();
  const clients = useClientStore((s) => s.clients);
  const prontData = useClientStore((s) => s.prontData);
  const fidelityClientes = useFidelidadeStore((s) => s.clientes);
  const addNotification = useUIStore((s) => s.addNotification);

  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  if (!open || !appointment) return null;

  // ─── Resolve dados do cliente ───
  const clientName = appointment.clienteNome || appointment.client;
  const clientRecord = clients.find((c) => c.nome === clientName);
  const prontRecord = prontData[clientName];
  const fidelityRecord = fidelityClientes.find((c) => c.nome === clientName);

  // ─── Resolve dados do serviço ───
  const svc = services.find((s) => s.id === appointment.servicoId)
    || services.find((s) => s.nome === appointment.service);

  // ─── Resolve dados do profissional ───
  const prof = professionals.find((p) => p.id === appointment.profissionalId)
    || professionals.find((p) => p.nome === appointment.profissional);

  // ─── Nível de fidelidade ───
  const fidNivel = fidelityRecord?.nivel || 'Bronze';
  const fidPontos = fidelityRecord?.pontos || 0;
  const fidNivelConfig = FIDELIDADE_NIVEIS.find((n) => n.nome === fidNivel) || FIDELIDADE_NIVEIS[0];

  // ─── Próximo nível ───
  const currentIdx = FIDELIDADE_NIVEIS.findIndex((n) => n.nome === fidNivel);
  const nextNivel = currentIdx < FIDELIDADE_NIVEIS.length - 1 ? FIDELIDADE_NIVEIS[currentIdx + 1] : null;
  const pontosProximoNivel = nextNivel ? nextNivel.pontosMin - fidPontos : 0;

  // ─── Pacotes do cliente ───
  const pacotes = prontRecord?.pacotes || [];

  // ─── Anamnese existente? ───
  const temAnamnese = !!useClientStore.getState()?.anamneseData?.[clientName];

  // ─── Ações ───
  const handleAbrirProntuario = () => {
    onClose();
    // Navega para clientes e armazena cliente selecionado
    navigate('/clientes');
    setTimeout(() => {
      const el = document.querySelector(`[data-client="${clientName}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  const handleAbrirAnamnese = () => {
    onClose();
    navigate('/prontuario');
  };

  const handleStatusChange = (newStatus) => {
    updateAppointmentStatus(appointment.id, newStatus);
    addNotification({
      type: 'success',
      title: 'Status atualizado',
      message: `${appointment.client} agora está como "${newStatus === 'em_atendimento' ? 'Em atendimento' : newStatus === 'concluido' ? 'Concluído' : newStatus}".`,
    });
  };

  const handleCancelar = () => {
    updateAppointmentStatus(appointment.id, 'cancelado');
    addNotification({
      type: 'warning',
      title: 'Agendamento cancelado',
      message: `O agendamento de ${appointment.client} foi cancelado.`,
    });
    setShowConfirmCancel(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="" width="780px" showClose>
      <div className="space-y-5 -mt-2">
        {/* ─── HEADER ─── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center text-white font-display font-bold text-lg shrink-0 shadow-md">
              {Helpers.getInitials(appointment.client)}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-ink dark:text-ink-dark truncate">
                {appointment.client}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={appointment.status || 'confirmado'} />
                <FidelityBadge nivel={fidNivel} />
                {clientRecord?.status === 'Pagamento pendente' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-soft/20 dark:bg-rose-dark-soft/20 text-rose dark:text-rose-dark">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    Pagamento pendente
                  </span>
                )}
              </div>
              {clientRecord && (
                <p className="text-[11px] text-ink-faint dark:text-ink-dark-faint mt-1">
                  Cliente desde {clientRecord.desde} · {prontRecord?.cpf || '—'} · {fidPontos} pts fidelidade
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ─── GRID PRINCIPAL: 2 colunas ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">

          {/* ── COLUNA ESQUERDA: Dados da Sessão ── */}
          <div className="space-y-3">
            <DetailCard title="Sessão">
              <div className="space-y-0.5 -mx-1">
                <InfoRow
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>}
                  label="Serviço"
                  value={`${appointment.service}${svc ? ` · ${svc.duracao}min` : ''}`}
                  highlight
                />
                <InfoRow
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>}
                  label="Profissional"
                  value={`${appointment.profissional}${prof ? ` (${prof.cargo})` : ''}`}
                />
                <InfoRow
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9.5h18M8 3v3M16 3v3" /></svg>}
                  label="Data e Horário"
                  value={`${appointment.data || 'Hoje'} às ${appointment.hora}`}
                />
                <InfoRow
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>}
                  label="Sala"
                  value={appointment.sala || 'Não definida'}
                />
                <InfoRow
                  icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>}
                  label="Valor do procedimento"
                  value={Helpers.formatCurrency(appointment.valor || 0)}
                  highlight
                />
              </div>
            </DetailCard>

            {/* ─── Anamnese Status ─── */}
            <DetailCard title="Ficha de Anamnese">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {temAnamnese ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-sage dark:bg-sage-dark" />
                      <span className="text-sm font-medium text-sage dark:text-sage-dark">Preenchida</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-gold dark:bg-gold-dark animate-pulse" />
                      <span className="text-sm font-medium text-gold dark:text-gold-dark">Pendente</span>
                    </>
                  )}
                </div>
                <button
                  onClick={handleAbrirAnamnese}
                  className="text-[11px] font-semibold text-brand dark:text-brand-dark hover:underline underline-offset-2"
                >
                  {temAnamnese ? 'Visualizar' : 'Preencher agora'}
                </button>
              </div>
            </DetailCard>
          </div>

          {/* ── COLUNA DIREITA: Fidelidade + Pacotes ── */}
          <div className="space-y-3">
            {/* Fidelidade */}
            <DetailCard title="Fidelidade">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-ink dark:text-ink-dark font-mono">{fidPontos.toLocaleString('pt-BR')}</div>
                    <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint">pontos acumulados</div>
                  </div>
                  <div className="text-right">
                    <FidelityBadge nivel={fidNivel} />
                    <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint mt-0.5">
                      Meta: {fidNivelConfig.pontosMin}+ pts
                    </div>
                  </div>
                </div>

                {/* Barra progresso próximo nível */}
                {nextNivel && (
                  <ProgressBar
                    value={fidPontos - fidNivelConfig.pontosMin}
                    max={nextNivel.pontosMin - fidNivelConfig.pontosMin}
                    label={`Progresso para ${nextNivel.nome}`}
                    color="bg-gold dark:bg-gold-dark"
                  />
                )}

                {/* Benefícios do nível */}
                {fidNivelConfig.beneficios && fidNivelConfig.beneficios.length > 0 && (
                  <div className="pt-2 border-t border-border dark:border-border-dark">
                    <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint mb-1.5 uppercase tracking-wider font-semibold">
                      Benefícios {fidNivel}
                    </div>
                    <div className="space-y-0.5">
                      {fidNivelConfig.beneficios.slice(0, 3).map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-ink-soft dark:text-ink-dark-soft">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 text-sage dark:text-sage-dark shrink-0">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {b}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Faltam pontos */}
                {nextNivel && pontosProximoNivel > 0 && (
                  <div className="text-center py-2 px-3 rounded-lg bg-gold-soft/10 dark:bg-gold-dark-soft/10 border border-gold/10 dark:border-gold-dark/10">
                    <span className="text-[11px] text-gold dark:text-gold-dark font-semibold">
                      Faltam {pontosProximoNivel} pts para {nextNivel.nome}
                    </span>
                  </div>
                )}
              </div>
            </DetailCard>

            {/* Pacotes */}
            <DetailCard title="Pacotes Ativos">
              {pacotes.length > 0 ? (
                <div className="space-y-2.5">
                  {pacotes.map((pkg, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-ink dark:text-ink-dark truncate">{pkg.nome}</span>
                        <span className="font-mono text-xs font-semibold text-ink dark:text-ink-dark ml-2">{pkg.utilizado}/{pkg.total}</span>
                      </div>
                      <ProgressBar
                        value={pkg.utilizado}
                        max={pkg.total}
                        label="Sessões utilizadas"
                        color={pkg.utilizado >= pkg.total * 0.8 ? 'bg-rose dark:bg-rose-dark' : 'bg-brand dark:bg-brand-dark'}
                      />
                      {pkg.valido && (
                        <div className="text-[10px] text-ink-faint dark:text-ink-dark-faint mt-0.5">
                          Válido até {pkg.valido}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-ink-faint dark:text-ink-dark-faint">
                  Nenhum pacote ativo no momento.
                </div>
              )}
            </DetailCard>
          </div>
        </div>

        {/* ─── CONTATO RÁPIDO ─── */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-surface-2/50 dark:bg-surface-dark-2/50 border border-border dark:border-border-dark">
          <span className="text-[11px] font-semibold text-ink-soft dark:text-ink-dark-soft uppercase tracking-wider mr-1">Contato:</span>
          {prontRecord?.tel && (
            <a href={`tel:${prontRecord.tel.replace(/\D/g, '')}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface dark:bg-surface-dark border border-border dark:border-border-dark hover:border-brand dark:hover:border-brand-dark hover:text-brand dark:hover:text-brand-dark transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" /></svg>
              {prontRecord.tel}
            </a>
          )}
          {prontRecord?.email && (
            <a href={`mailto:${prontRecord.email}`} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface dark:bg-surface-dark border border-border dark:border-border-dark hover:border-brand dark:hover:border-brand-dark hover:text-brand dark:hover:text-brand-dark transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
              {prontRecord.email}
            </a>
          )}
        </div>

        {/* ─── AÇÕES RÁPIDAS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {appointment.status !== 'em_atendimento' && appointment.status !== 'concluido' && appointment.status !== 'cancelado' && (
            <button
              onClick={() => handleStatusChange('em_atendimento')}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-blue-50/20 dark:bg-blue-900/20 border border-blue-200/30 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/40 transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span className="text-[10px] font-semibold">Iniciar</span>
            </button>
          )}
          {appointment.status === 'em_atendimento' && (
            <button
              onClick={() => handleStatusChange('concluido')}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-sage-soft/20 dark:bg-sage-dark-soft/20 border border-sage/30 dark:border-sage-dark/30 text-sage dark:text-sage-dark hover:bg-sage-soft/40 dark:hover:bg-sage-dark-soft/40 transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span className="text-[10px] font-semibold">Concluir</span>
            </button>
          )}
          <button
            onClick={handleAbrirProntuario}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-brand-soft/10 dark:bg-brand-dark-soft/10 border border-brand/20 dark:border-brand-dark/20 text-brand dark:text-brand-dark hover:bg-brand-soft/20 dark:hover:bg-brand-dark-soft/20 transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>
            <span className="text-[10px] font-semibold">Prontuário</span>
          </button>
          <button
            onClick={handleAbrirAnamnese}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-gold-soft/10 dark:bg-gold-dark-soft/10 border border-gold/20 dark:border-gold-dark/20 text-gold dark:text-gold-dark hover:bg-gold-soft/20 dark:hover:bg-gold-dark-soft/20 transition-all active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            <span className="text-[10px] font-semibold">Anamnese</span>
          </button>
          {appointment.status !== 'cancelado' && appointment.status !== 'concluido' && (
            <button
              onClick={() => setShowConfirmCancel(true)}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-rose-soft/10 dark:bg-rose-dark-soft/10 border border-rose/20 dark:border-rose-dark/20 text-rose dark:text-rose-dark hover:bg-rose-soft/20 dark:hover:bg-rose-dark-soft/20 transition-all active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
              <span className="text-[10px] font-semibold">Cancelar</span>
            </button>
          )}
        </div>

        {/* ─── CONFIRMAR CANCELAMENTO ─── */}
        {showConfirmCancel && (
          <div className="p-4 rounded-xl bg-rose-soft/10 dark:bg-rose-dark-soft/10 border border-rose/20 dark:border-rose-dark/20 animate-fade-in">
            <p className="text-sm font-semibold text-rose dark:text-rose-dark mb-3">
              Tem certeza que deseja cancelar este agendamento?
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowConfirmCancel(false)} className="btn-ghost btn-sm">
                Manter agendamento
              </button>
              <button onClick={handleCancelar} className="btn btn-sm" style={{ backgroundColor: '#B14E3D', color: '#fff' }}>
                Sim, cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
