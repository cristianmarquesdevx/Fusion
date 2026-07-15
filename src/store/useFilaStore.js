/** @format */

/**
 * Fusion ERP v2 — Store do Módulo Fila de Atendimento
 */

import { create } from 'zustand';

const initialSessions = [
  { id: 's1', hora: '09:00', cliente: 'Marina Costa', servico: 'Limpeza de pele profunda', profissional: 'Fernanda', sala: 'Sala 1', status: 'concluido', atrasoMin: 0 },
  { id: 's2', hora: '10:00', cliente: 'Renata Alves', servico: 'Peeling de diamante', profissional: 'Dra. Camila', sala: 'Sala 2', status: 'concluido', atrasoMin: 0 },
  { id: 's3', hora: '11:30', cliente: 'Juliana Prado', servico: 'Toxina botulínica', profissional: 'Dra. Camila', sala: 'Sala de Procedimentos', status: 'ativo', atrasoMin: 0 },
  { id: 's4', hora: '12:15', cliente: 'Beatriz Lima', servico: 'Drenagem linfática', profissional: 'Fernanda', sala: 'Sala 1', status: 'atrasado', atrasoMin: 12 },
  { id: 's5', hora: '13:00', cliente: 'Camila Ferreira', servico: 'Microagulhamento', profissional: 'Dra. Camila', sala: 'Sala 2', status: 'aguardando', atrasoMin: 0 },
  { id: 's6', hora: '14:30', cliente: 'Patrícia Nogueira', servico: 'Laser CO2 fracionado', profissional: 'Dra. Camila', sala: 'Sala de Laser', status: 'aguardando', atrasoMin: 0 },
  { id: 's7', hora: '15:00', cliente: 'Sofia Ribeiro', servico: 'Massagem relaxante', profissional: 'Carlos', sala: 'Sala 3', status: 'confirmado', atrasoMin: 0 },
  { id: 's8', hora: '16:00', cliente: 'Larissa Teixeira', servico: 'Limpeza de pele', profissional: 'Fernanda', sala: 'Sala 1', status: 'confirmado', atrasoMin: 0 },
];

const filterOptions = [
  { id: 'agora', label: 'Agora' },
  { id: 'proximas-2h', label: 'Próximas 2h' },
  { id: 'manha', label: 'Manhã' },
  { id: 'tarde', label: 'Tarde' },
];

export const useFilaStore = create((set, get) => ({
  sessions: initialSessions,
  activeFilter: 'all',
  filterOptions,

  setFilter: (filter) => set({ activeFilter: filter }),

  updateSessionStatus: (id, status, atrasoMin) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, status, atrasoMin: atrasoMin ?? s.atrasoMin } : s
      ),
    })),

  getFilteredSessions: () => {
    const { sessions, activeFilter } = get();
    const now = new Date();
    const currentMinTotal = now.getHours() * 60 + now.getMinutes();

    let filtered = [...sessions];

    switch (activeFilter) {
      case 'agora':
        filtered = sessions.filter((s) => {
          if (s.status === 'concluido') return false;
          const [h, m] = s.hora.split(':').map(Number);
          const sessionMinTotal = h * 60 + m;
          const diff = sessionMinTotal - currentMinTotal;
          return diff >= -120 && diff <= 120;
        });
        break;
      case 'proximas-2h': {
        const limite = currentMinTotal + 120;
        filtered = sessions.filter((s) => {
          const [h, m] = s.hora.split(':').map(Number);
          const totalMin = h * 60 + m;
          return totalMin > currentMinTotal && totalMin <= limite;
        });
        break;
      }
      case 'manha':
        filtered = sessions.filter((s) => {
          const h = parseInt(s.hora.split(':')[0], 10);
          return h >= 6 && h < 12;
        });
        break;
      case 'tarde':
        filtered = sessions.filter((s) => {
          const h = parseInt(s.hora.split(':')[0], 10);
          return h >= 12 && h < 18;
        });
        break;
      default:
        break;
    }

    return filtered.sort((a, b) => a.hora.localeCompare(b.hora));
  },

  getSummary: () => {
    const { sessions } = get();
    const concluidas = sessions.filter((s) => s.status === 'concluido').length;
    const emAndamento = sessions.filter((s) => s.status === 'ativo').length;
    const atrasadas = sessions.filter((s) => s.status === 'atrasado').length;
    return { total: sessions.length, concluidas, emAndamento, atrasadas };
  },

  /** Busca sessões da fila no Supabase */
  loadFromSupabase: async () => {
    return true; // mantém dados iniciais enquanto Supabase não tem dados da fila
  },

  /** Adiciona uma sessão */
  addSession: (session) =>
    set((state) => ({
      sessions: [...state.sessions, { id: `s${Date.now()}`, ...session }],
    })),
}));
