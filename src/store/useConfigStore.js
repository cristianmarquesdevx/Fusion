/** @format */

import { create } from 'zustand';

const initialState = {
  companyInfo: {
    nome: 'Vitta Jardins',
    razaoSocial: 'Vitta Jardins Estética Ltda.',
    cnpj: '00.000.000/0001-00',
    endereco: 'Av. Ibirapuera, 3.500 · Moema · SP',
    telefone: '(11) 97777-6666',
    email: 'contato@vittajardins.com.br',
    site: 'www.vittajardins.com.br',
    logo: null,
  },
  units: [
    { id: 'u1', nome: 'Vitta Jardins — Moema', endereco: 'Av. Ibirapuera, 3.500', telefone: '(11) 97777-6666', status: 'ativa', clientesAtivos: 187 },
    { id: 'u2', nome: 'Vitta Jardins — Vila Olímpia', endereco: 'Rua Olimpíadas, 200', telefone: '(11) 96666-5555', status: 'ativa', clientesAtivos: 92 },
    { id: 'u3', nome: 'Vitta Jardins — Pinheiros', endereco: 'Rua dos Pinheiros, 800', telefone: '(11) 95555-4444', status: 'inativa', clientesAtivos: 45 },
  ],
  team: [
    { id: 'm1', nome: 'Ana Souza', cargo: 'Gerente', email: 'ana@vittajardins.com.br', telefone: '(11) 98888-7777', ativo: true },
    { id: 'm2', nome: 'Dra. Camila Mendes', cargo: 'Médica', email: 'camila@vittajardins.com.br', telefone: '(11) 97777-6666', ativo: true },
    { id: 'm3', nome: 'Fernanda Lima', cargo: 'Esteticista', email: 'fernanda@vittajardins.com.br', telefone: '(11) 96666-5555', ativo: true },
    { id: 'm4', nome: 'Carlos Oliveira', cargo: 'Massoterapeuta', email: 'carlos@vittajardins.com.br', telefone: '(11) 95555-4444', ativo: true },
    { id: 'm5', nome: 'Marina Costa', cargo: 'Recepcionista', email: 'marina@vittajardins.com.br', telefone: '(11) 94444-3333', ativo: true },
  ],
  nextUnitId: 'u4',
  nextMemberId: 'm6',
  activeTab: 'unidade',
  loading: false,
};

export const useConfigStore = create((set, get) => ({
  ...initialState,

  setActiveTab: (tab) => set({ activeTab: tab }),

  addUnit: (unit) => {
    const state = get();
    unit.id = state.nextUnitId;
    unit.status = 'ativa';
    unit.clientesAtivos = 0;
    const num = parseInt(state.nextUnitId.replace('u', ''), 10) + 1;
    set({ units: [...state.units, unit], nextUnitId: `u${num}` });
  },

  addMember: (member) => {
    const state = get();
    member.id = state.nextMemberId;
    member.ativo = true;
    const num = parseInt(state.nextMemberId.replace('m', ''), 10) + 1;
    set({ team: [...state.team, member], nextMemberId: `m${num}` });
  },

  toggleMemberStatus: (id) => {
    set((state) => ({
      team: state.team.map((m) =>
        m.id === id ? { ...m, ativo: !m.ativo } : m
      ),
    }));
  },
}));
