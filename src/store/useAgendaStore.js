/** @format */

/**
 * Fusion ERP v2 — Store do Módulo Agenda
 */

import { create } from 'zustand';

const timeSlots = [
  '09:00', '10:00', '11:30', '13:00', '14:30', '15:00', '16:00', '17:00', '18:00'
];

const weekDays = ['Seg 29', 'Ter 30', 'Qua 1', 'Qui 2', 'Sex 3', 'Sáb 4'];

const weekGrid = [
  [
    { id: 'a1', client: 'Ana P.', service: 'Limpeza', profissional: 'Fernanda', sala: 'Sala 1', color: 'c1' },
    { id: 'a2', client: 'Marina C.', service: 'Limpeza', profissional: 'Fernanda', sala: 'Sala 1', color: 'c1' },
    null,
    { id: 'a3', client: 'Sofia R.', service: 'Botox', profissional: 'Dra. Camila', sala: 'Sala 2', color: 'c2' },
    null,
    { id: 'a4', client: 'Bia S.', service: 'Drenagem', profissional: 'Carlos', sala: 'Sala 3', color: 'c1' },
  ],
  [
    null,
    { id: 'a5', client: 'Renata A.', service: 'Peeling', profissional: 'Dra. Camila', sala: 'Sala 2', color: 'c1' },
    { id: 'a6', client: 'Laura M.', service: 'Laser', profissional: 'Dra. Camila', sala: 'Sala de Laser', color: 'c3' },
    null,
    { id: 'a7', client: 'Tais F.', service: 'Limpeza', profissional: 'Fernanda', sala: 'Sala 1', color: 'c1' },
    null,
  ],
  [
    { id: 'a8', client: 'Carla D.', service: 'Botox', profissional: 'Dra. Camila', sala: 'Sala 2', color: 'c2' },
    { id: 'a9', client: 'Juliana P.', service: 'Botox', profissional: 'Dra. Camila', sala: 'Sala de Procedimentos', color: 'c2' },
    null,
    { id: 'a10', client: 'Nina K.', service: 'Micro.', profissional: 'Carlos', sala: 'Sala 3', color: 'c1' },
    { id: 'a11', client: 'Vera L.', service: 'Laser', profissional: 'Dra. Camila', sala: 'Sala de Laser', color: 'c3' },
    null,
  ],
  [
    { id: 'a12', client: 'Elis M.', service: 'Micro.', profissional: 'Carlos', sala: 'Sala 3', color: 'c1' },
    { id: 'a13', client: 'Camila F.', service: 'Micro.', profissional: 'Carlos', sala: 'Sala 3', color: 'c1' },
    { id: 'a14', client: 'Duda A.', service: 'Botox', profissional: 'Dra. Camila', sala: 'Sala 2', color: 'c2' },
    null,
    null,
    { id: 'a15', client: 'Iris B.', service: 'Peeling', profissional: 'Fernanda', sala: 'Sala 1', color: 'c1' },
  ],
  [
    null,
    { id: 'a16', client: 'Patrícia N.', service: 'Laser', profissional: 'Dra. Camila', sala: 'Sala de Laser', color: 'c3' },
    null,
    { id: 'a17', client: 'Sara T.', service: 'Drenagem', profissional: 'Carlos', sala: 'Sala 3', color: 'c1' },
    { id: 'a18', client: 'Bruna O.', service: 'Botox', profissional: 'Dra. Camila', sala: 'Sala 2', color: 'c2' },
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

export const useAgendaStore = create((set) => ({
  weekDays,
  timeSlots,
  weekGrid,
  professionals,
  services,
  nextApptId: 19,
  filterWeek: 'current',
  viewMode: 'week',

  setViewMode: (mode) => set({ viewMode: mode }),

  addAppointment: (appt) =>
    set((state) => {
      const newId = 'a' + state.nextApptId;
      return { nextApptId: state.nextApptId + 1 };
    }),

  /** Move an appointment between grid positions via drag & drop */
  moveAppointment: (fromRow, fromCol, toRow, toCol) =>
    set((state) => {
      // Clone the grid deeply
      const grid = state.weekGrid.map((row) => [...row]);
      const appt = grid[fromRow]?.[fromCol];
      if (!appt) return state;

      // Swap places if target cell has an appointment
      const target = grid[toRow]?.[toCol];

      grid[fromRow][fromCol] = target || null;
      grid[toRow][toCol] = appt;

      return { weekGrid: grid };
    }),
}));
