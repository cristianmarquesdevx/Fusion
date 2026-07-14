/** @format */

/**
 * Fusion ERP v2 — Store do Módulo Agenda
 */

import { create } from 'zustand';
import { supabaseData } from '../services/supabase-data';
import { withSupabaseFallback, trySync } from '../hooks/useSupabaseInit';
import { scheduleLocalNotification, cancelScheduledNotification } from '../services/push-notifications';
import { useClientStore } from './useClientStore';
import { useFidelidadeStore } from './useFidelidadeStore';

const timeSlots = [
  '09:00', '10:00', '11:30', '13:00', '14:30', '15:00', '16:00', '17:00', '18:00'
];

const weekDays = ['Seg 29', 'Ter 30', 'Qua 1', 'Qui 2', 'Sex 3', 'Sáb 4'];

// Mapa de clientes reais para enriquecer os agendamentos com dados de fidelidade, pacotes, etc.
const apptClientMap = {
  'a1': { nomeFiltro: 'Ana', clienteNome: 'Ana Paula Souza', status: 'Em dia' },
  'a2': { nomeFiltro: 'Marina C.', clienteNome: 'Marina Costa', status: 'Em dia' },
  'a3': { nomeFiltro: 'Sofia R.', clienteNome: 'Sofia Ribeiro', status: 'Em dia' },
  'a4': { nomeFiltro: 'Bia S.', clienteNome: 'Beatriz Lima', status: 'Pagamento pendente' },
  'a5': { nomeFiltro: 'Renata A.', clienteNome: 'Renata Alves', status: 'Em dia' },
  'a6': { nomeFiltro: 'Laura M.', clienteNome: 'Laura Martins', status: 'Em dia' },
  'a7': { nomeFiltro: 'Tais F.', clienteNome: 'Tais Ferreira', status: 'Em dia' },
  'a8': { nomeFiltro: 'Carla D.', clienteNome: 'Carla Dias', status: 'Em dia' },
  'a9': { nomeFiltro: 'Juliana P.', clienteNome: 'Juliana Prado', status: 'Em dia' },
  'a10': { nomeFiltro: 'Nina K.', clienteNome: 'Nina Kogut', status: 'Em dia' },
  'a11': { nomeFiltro: 'Vera L.', clienteNome: 'Vera Lucia', status: 'Em dia' },
  'a12': { nomeFiltro: 'Elis M.', clienteNome: 'Elis Marina', status: 'Em dia' },
  'a13': { nomeFiltro: 'Camila F.', clienteNome: 'Camila Ferreira', status: 'Em dia' },
  'a14': { nomeFiltro: 'Duda A.', clienteNome: 'Maria Eduarda Alves', status: 'Fidelidade expirando' },
  'a15': { nomeFiltro: 'Iris B.', clienteNome: 'Iris Barbosa', status: 'Em dia' },
  'a16': { nomeFiltro: 'Patrícia N.', clienteNome: 'Patrícia Nogueira', status: 'Em dia' },
  'a17': { nomeFiltro: 'Sara T.', clienteNome: 'Sara Tavares', status: 'Pagamento pendente' },
  'a18': { nomeFiltro: 'Bruna O.', clienteNome: 'Bruna Oliveira', status: 'Em dia' },
};

const weekGrid = [
  [
    { id: 'a1', client: 'Ana P.', clienteNome: 'Ana Paula Souza', service: 'Limpeza de pele', servicoId: 's1', profissional: 'Fernanda', profissionalId: 'p2', sala: 'Sala 1', hora: '09:00', duracao: 60, valor: 180, color: 'c1', status: 'confirmado' },
    { id: 'a2', client: 'Marina C.', clienteNome: 'Marina Costa', service: 'Limpeza de pele', servicoId: 's1', profissional: 'Fernanda', profissionalId: 'p2', sala: 'Sala 1', hora: '10:00', duracao: 60, valor: 180, color: 'c1', status: 'confirmado' },
    null,
    { id: 'a3', client: 'Sofia R.', clienteNome: 'Sofia Ribeiro', service: 'Toxina botulínica', servicoId: 's3', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala 2', hora: '11:30', duracao: 60, valor: 890, color: 'c2', status: 'confirmado' },
    null,
    { id: 'a4', client: 'Bia S.', clienteNome: 'Beatriz Lima', service: 'Drenagem linfática', servicoId: 's5', profissional: 'Carlos', profissionalId: 'p3', sala: 'Sala 3', hora: '13:00', duracao: 60, valor: 180, color: 'c1', status: 'confirmado' },
  ],
  [
    null,
    { id: 'a5', client: 'Renata A.', clienteNome: 'Renata Alves', service: 'Peeling de diamante', servicoId: 's2', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala 2', hora: '09:00', duracao: 90, valor: 250, color: 'c1', status: 'em_atendimento' },
    { id: 'a6', client: 'Laura M.', clienteNome: 'Laura Martins', service: 'Laser CO2 fracionado', servicoId: 's4', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala de Laser', hora: '10:00', duracao: 120, valor: 1200, color: 'c3', status: 'confirmado' },
    null,
    { id: 'a7', client: 'Tais F.', clienteNome: 'Tais Ferreira', service: 'Limpeza de pele', servicoId: 's1', profissional: 'Fernanda', profissionalId: 'p2', sala: 'Sala 1', hora: '14:30', duracao: 60, valor: 180, color: 'c1', status: 'confirmado' },
    null,
  ],
  [
    { id: 'a8', client: 'Carla D.', clienteNome: 'Carla Dias', service: 'Toxina botulínica', servicoId: 's3', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala 2', hora: '09:00', duracao: 60, valor: 890, color: 'c2', status: 'confirmado' },
    { id: 'a9', client: 'Juliana P.', clienteNome: 'Juliana Prado', service: 'Toxina botulínica', servicoId: 's3', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala de Procedimentos', hora: '10:00', duracao: 60, valor: 890, color: 'c2', status: 'em_atendimento' },
    null,
    { id: 'a10', client: 'Nina K.', clienteNome: 'Nina Kogut', service: 'Microagulhamento', servicoId: 's6', profissional: 'Carlos', profissionalId: 'p3', sala: 'Sala 3', hora: '13:00', duracao: 90, valor: 450, color: 'c1', status: 'confirmado' },
    { id: 'a11', client: 'Vera L.', clienteNome: 'Vera Lucia', service: 'Laser CO2 fracionado', servicoId: 's4', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala de Laser', hora: '15:00', duracao: 120, valor: 1200, color: 'c3', status: 'confirmado' },
    null,
  ],
  [
    { id: 'a12', client: 'Elis M.', clienteNome: 'Elis Marina', service: 'Microagulhamento', servicoId: 's6', profissional: 'Carlos', profissionalId: 'p3', sala: 'Sala 3', hora: '09:00', duracao: 90, valor: 450, color: 'c1', status: 'confirmado' },
    { id: 'a13', client: 'Camila F.', clienteNome: 'Camila Ferreira', service: 'Microagulhamento', servicoId: 's6', profissional: 'Carlos', profissionalId: 'p3', sala: 'Sala 3', hora: '10:00', duracao: 90, valor: 450, color: 'c1', status: 'confirmado' },
    { id: 'a14', client: 'Duda A.', clienteNome: 'Maria Eduarda Alves', service: 'Toxina botulínica', servicoId: 's3', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala 2', hora: '11:30', duracao: 60, valor: 890, color: 'c2', status: 'confirmado' },
    null,
    null,
    { id: 'a15', client: 'Iris B.', clienteNome: 'Iris Barbosa', service: 'Peeling de diamante', servicoId: 's2', profissional: 'Fernanda', profissionalId: 'p2', sala: 'Sala 1', hora: '17:00', duracao: 90, valor: 250, color: 'c1', status: 'confirmado' },
  ],
  [
    null,
    { id: 'a16', client: 'Patrícia N.', clienteNome: 'Patrícia Nogueira', service: 'Laser CO2 fracionado', servicoId: 's4', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala de Laser', hora: '09:00', duracao: 120, valor: 1200, color: 'c3', status: 'confirmado' },
    null,
    { id: 'a17', client: 'Sara T.', clienteNome: 'Sara Tavares', service: 'Drenagem linfática', servicoId: 's5', profissional: 'Carlos', profissionalId: 'p3', sala: 'Sala 3', hora: '14:30', duracao: 60, valor: 180, color: 'c1', status: 'confirmado' },
    { id: 'a18', client: 'Bruna O.', clienteNome: 'Bruna Oliveira', service: 'Toxina botulínica', servicoId: 's3', profissional: 'Dra. Camila', profissionalId: 'p1', sala: 'Sala 2', hora: '16:00', duracao: 60, valor: 890, color: 'c2', status: 'confirmado' },
    null,
  ],
];

const professionals = [
  { id: 'p1', nome: 'Dra. Camila', cargo: 'Médica', cor: '#6C5CE7' },
  { id: 'p2', nome: 'Fernanda', cargo: 'Esteticista', cor: '#00B894' },
  { id: 'p3', nome: 'Carlos', cargo: 'Massoterapeuta', cor: '#FDCB6E' },
];

const services = [
  { id: 's1', nome: 'Limpeza de pele', duracao: 60, valor: 180 },
  { id: 's2', nome: 'Peeling de diamante', duracao: 90, valor: 250 },
  { id: 's3', nome: 'Toxina botulínica', duracao: 60, valor: 890 },
  { id: 's4', nome: 'Laser CO2 fracionado', duracao: 120, valor: 1200 },
  { id: 's5', nome: 'Drenagem linfática', duracao: 60, valor: 180 },
  { id: 's6', nome: 'Microagulhamento', duracao: 90, valor: 450 },
  { id: 's7', nome: 'Massagem relaxante', duracao: 60, valor: 200 },
];

export const useAgendaStore = create((set, get) => ({
  weekDays,
  timeSlots,
  weekGrid,
  professionals,
  services,
  nextApptId: 19,
  filterWeek: 'current',
  viewMode: 'week',
  supabaseLoaded: false,

  loadFromSupabase: async () => {
    const data = await withSupabaseFallback(
      () => supabaseData.agendamentos.load({
        order: { field: 'hora', ascending: true },
      }),
      null
    );
    if (data && Array.isArray(data) && data.length > 0) {
      set({ supabaseLoaded: true, nextApptId: data.length + 19 });
    } else {
      set({ supabaseLoaded: false });
    }
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  addAppointment: (appt) => {
    const state = get();
    const newId = 'a' + state.nextApptId;
    trySync(() => supabaseData.agendamentos.save(appt));

    // Agenda notificação push 30min antes do horário
    if (appt.data && appt.hora) {
      const dataStr = typeof appt.data === 'string' && appt.data.includes('/')
        ? appt.data.split('/').reverse().join('-')  // DD/MM/AAAA → AAAA-MM-DD
        : appt.data;
      try {
        const scheduledDate = new Date(`${dataStr}T${appt.hora}:00`);
        const reminderTime = new Date(scheduledDate.getTime() - 30 * 60 * 1000);

        if (reminderTime > new Date()) {
          scheduleLocalNotification({
            id: `appt-${newId}`,
            title: 'Lembrete de agendamento',
            body: `${appt.client || 'Cliente'} — ${appt.servico || 'Procedimento'} às ${appt.hora}`,
            scheduledAt: reminderTime.toISOString(),
            type: 'appointment',
            data: { url: '/agenda', appointmentId: newId },
          });
        }
      } catch (_) {
        // Data inválida — não agenda notificação
      }
    }

    set({ nextApptId: state.nextApptId + 1 });
  },

  /** Remove notificações de lembrete para um agendamento */
  cancelAppointmentReminder: (apptId) => {
    cancelScheduledNotification(`appt-${apptId}`);
  },

  /** Busca dados completos do cliente vinculado ao agendamento */
  getAppointmentClientData: (apptId) => {
    const state = get();
    for (const row of state.weekGrid) {
      for (const cell of row) {
        if (cell && cell.id === apptId) {
          const clientName = cell.clienteNome || cell.client;
          try {
            const clientData = useClientStore.getState()?.clients?.find(c => c.nome === clientName) || null;
            const fidelityData = useFidelidadeStore.getState()?.clientes?.find(c => c.nome === clientName) || null;
            const prontData = useClientStore.getState()?.prontData?.[clientName] || null;
            return { appt: cell, client: clientData, fidelity: fidelityData, prontuario: prontData };
          } catch {
            return { appt: cell, client: null, fidelity: null, prontuario: null };
          }
        }
      }
    }
    return null;
  },

  /** Atualiza status de um agendamento */
  updateAppointmentStatus: (apptId, newStatus) =>
    set((state) => ({
      weekGrid: state.weekGrid.map((row) =>
        row.map((cell) =>
          cell && cell.id === apptId ? { ...cell, status: newStatus } : cell
        )
      ),
    })),

  /** Remove um agendamento */
  removeAppointment: (apptId) =>
    set((state) => ({
      weekGrid: state.weekGrid.map((row) =>
        row.map((cell) =>
          cell && cell.id === apptId ? null : cell
        )
      ),
    })),

  moveAppointment: (fromRow, fromCol, toRow, toCol) =>
    set((state) => {
      if (fromRow < 0 || fromCol < 0 || toRow < 0 || toCol < 0) return state;
      if (fromRow >= state.weekGrid.length || toRow >= state.weekGrid.length) return state;
      if (fromCol >= state.weekGrid[0].length || toCol >= state.weekGrid[0].length) return state;
      const grid = state.weekGrid.map((row) => [...row]);
      const appt = grid[fromRow]?.[fromCol];
      if (!appt) return state;
      const target = grid[toRow]?.[toCol];
      grid[fromRow][fromCol] = target || null;
      grid[toRow][toCol] = appt;
      return { weekGrid: grid };
    }),
}));
