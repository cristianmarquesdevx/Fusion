/** @format */

/**
 * Fusion ERP v2 — Store do Módulo Clientes
 */

import { create } from 'zustand';

const initialClients = [
  { id: '1', nome: 'Marina Costa', tel: '(11) 98221-4410', email: 'marina.costa@email.com', desde: '2022', ultima: 'Hoje, 09:00', pacote: 'Limpeza facial · 4/10 sessões', status: 'Em dia' },
  { id: '2', nome: 'Renata Alves', tel: '(11) 99110-2287', email: 'renata.alves@email.com', desde: '2021', ultima: 'Hoje, 10:00', pacote: 'Peeling · 2/6 sessões', status: 'Em dia' },
  { id: '3', nome: 'Juliana Prado', tel: '(11) 98833-7765', email: 'juliana.prado@email.com', desde: '2023', ultima: 'Hoje, 11:30', pacote: 'Plano recorrente Premium', status: 'Em dia' },
  { id: '4', nome: 'Beatriz Lima', tel: '(11) 97744-9021', email: 'beatriz.lima@email.com', desde: '2020', ultima: 'Hoje, 12:15', pacote: 'Drenagem · 6/8 sessões', status: 'Pagamento pendente' },
  { id: '5', nome: 'Larissa Teixeira', tel: '(11) 96652-3398', email: 'larissa.teixeira@email.com', desde: '2024', ultima: '18 de junho', pacote: 'Sem pacote ativo', status: 'Fidelidade expirando' },
  { id: '6', nome: 'Patrícia Nogueira', tel: '(11) 98123-5567', email: 'patricia.nogueira@email.com', desde: '2019', ultima: 'Hoje, 14:30', pacote: 'Laser CO2 · 1/5 sessões', status: 'Em dia' },
];

const prontData = {
  'Marina Costa': {
    initials: 'MC', name: 'Marina Costa',
    meta: 'Cliente desde 2022 · CPF: 123.456.789-00 · 34 anos',
    cpf: '123.456.789-00', nasc: '15/03/1990 (34 anos)', tel: '(11) 98221-4410',
    email: 'marina.costa@email.com', end: 'Rua Oscar Freire, 500 — Jardins, SP',
    desde: 'Março de 2022', fid: 'Nível Ouro · 320 pts',
    pacotes: [
      { nome: 'Limpeza facial', utilizado: 4, total: 10, valido: '12/2026' },
      { nome: 'Peeling de diamante', utilizado: 2, total: 6, valido: '10/2026' }
    ],
    fidBars: { bronze: 100, prata: 100, ouro: 40, platina: 0 },
    notes: 'Cliente prefere horários pela manhã. Alergia a ácido salicílico (anotado no prontuário físico). Já fez procedimentos com Dra. Camila e com Fernanda. Indicou 2 amigas que se tornaram clientes.',
    historico: [
      ['30/06', 'Limpeza de pele profunda', 'Fernanda', 'R$ 180,00', 'Concluído'],
      ['15/06', 'Hidratação facial', 'Fernanda', 'R$ 120,00', 'Concluído'],
      ['02/06', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Concluído'],
      ['20/05', 'Peeling de diamante', 'Dra. Camila', 'R$ 250,00', 'Concluído'],
      ['10/05', 'Consulta avaliação', 'Dra. Camila', 'R$ 0,00', 'Concluído']
    ]
  },
  'Renata Alves': {
    initials: 'RA', name: 'Renata Alves',
    meta: 'Cliente desde 2021 · CPF: 987.654.321-00 · 28 anos',
    cpf: '987.654.321-00', nasc: '22/11/1996 (28 anos)', tel: '(11) 99110-2287',
    email: 'renata.alves@email.com', end: 'Alameda Santos, 800 — Cerqueira César, SP',
    desde: 'Agosto de 2021', fid: 'Nível Prata · 180 pts',
    pacotes: [
      { nome: 'Plano recorrente Premium', utilizado: 6, total: 12, valido: 'Recorrente' }
    ],
    fidBars: { bronze: 100, prata: 30, ouro: 0, platina: 0 },
    notes: 'Cliente tem plano recorrente Premium. Prefere atendimento à tarde. Já fez peeling com Dra. Camila e gostou muito.',
    historico: [
      ['30/06', 'Peeling de diamante', 'Dra. Camila', 'R$ 250,00', 'Concluído'],
      ['27/06', 'Plano recorrente (mensal)', '—', 'R$ 349,00', 'Pago'],
      ['15/06', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Concluído'],
      ['01/06', 'Avaliação mensal', 'Dra. Camila', 'R$ 0,00', 'Concluído']
    ]
  },
  'Juliana Prado': {
    initials: 'JP', name: 'Juliana Prado',
    meta: 'Cliente desde 2023 · CPF: 456.789.123-00 · 41 anos',
    cpf: '456.789.123-00', nasc: '03/07/1983 (41 anos)', tel: '(11) 98833-7765',
    email: 'juliana.prado@email.com', end: 'Rua Haddock Lobo, 1200 — Jardins, SP',
    desde: 'Janeiro de 2023', fid: 'Nível Ouro · 350 pts',
    pacotes: [
      { nome: 'Toxina botulínica', utilizado: 2, total: 4, valido: '06/2026' }
    ],
    fidBars: { bronze: 100, prata: 100, ouro: 50, platina: 0 },
    notes: 'Cliente fidelizada. Prefere Dra. Camila para todos os procedimentos. Já indicou 4 clientes.',
    historico: [
      ['30/06', 'Toxina botulínica', 'Dra. Camila', 'R$ 890,00', 'Em atendimento'],
      ['15/05', 'Toxina botulínica (retoque)', 'Dra. Camila', 'R$ 350,00', 'Concluído'],
      ['10/03', 'Toxina botulínica', 'Dra. Camila', 'R$ 890,00', 'Concluído'],
      ['05/01', 'Avaliação inicial', 'Dra. Camila', 'R$ 0,00', 'Concluído']
    ]
  },
  'Beatriz Lima': {
    initials: 'BL', name: 'Beatriz Lima',
    meta: 'Cliente desde 2020 · CPF: 321.654.987-00 · 45 anos',
    cpf: '321.654.987-00', nasc: '18/12/1979 (45 anos)', tel: '(11) 97744-9021',
    email: 'beatriz.lima@email.com', end: 'Av. Brigadeiro Faria Lima, 2000 — Pinheiros, SP',
    desde: 'Fevereiro de 2020', fid: 'Nível Platina · 620 pts',
    pacotes: [
      { nome: 'Drenagem linfática', utilizado: 6, total: 8, valido: '03/2027' }
    ],
    fidBars: { bronze: 100, prata: 100, ouro: 100, platina: 40 },
    notes: 'Cliente antiga, bastante fiel. Pagamento pendente da última sessão. Prefere horários após as 10h.',
    historico: [
      ['30/06', 'Drenagem linfática', 'Fernanda', 'R$ 180,00', 'Atrasado'],
      ['20/06', 'Massagem modeladora', 'Carlos', 'R$ 200,00', 'Concluído'],
      ['10/06', 'Drenagem linfática', 'Fernanda', 'R$ 180,00', 'Concluído'],
      ['28/05', 'Massagem relaxante', 'Carlos', 'R$ 200,00', 'Concluído'],
      ['15/05', 'Drenagem linfática', 'Fernanda', 'R$ 180,00', 'Concluído']
    ]
  },
  'Larissa Teixeira': {
    initials: 'LT', name: 'Larissa Teixeira',
    meta: 'Cliente desde 2024 · CPF: 159.753.468-00 · 26 anos',
    cpf: '159.753.468-00', nasc: '08/09/1998 (26 anos)', tel: '(11) 96652-3398',
    email: 'larissa.teixeira@email.com', end: 'Rua Augusta, 1500 — Consolação, SP',
    desde: 'Abril de 2024', fid: 'Nível Bronze · 80 pts',
    pacotes: [],
    fidBars: { bronze: 30, prata: 0, ouro: 0, platina: 0 },
    notes: 'Cliente nova. Veio por indicação. Interessada em botox e preenchimento. Fidelidade próxima de expirar por inatividade.',
    historico: [
      ['18/06', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Concluído'],
      ['02/06', 'Consulta avaliação', 'Dra. Camila', 'R$ 0,00', 'Concluído'],
      ['15/04', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Concluído']
    ]
  },
  'Patrícia Nogueira': {
    initials: 'PN', name: 'Patrícia Nogueira',
    meta: 'Cliente desde 2019 · CPF: 753.951.852-00 · 38 anos',
    cpf: '753.951.852-00', nasc: '22/04/1986 (38 anos)', tel: '(11) 98123-5567',
    email: 'patricia.nogueira@email.com', end: 'Rua da Consolação, 3000 — Consolação, SP',
    desde: 'Setembro de 2019', fid: 'Nível Diamante · 1050 pts',
    pacotes: [
      { nome: 'Laser CO2 fracionado', utilizado: 4, total: 5, valido: '12/2026' }
    ],
    fidBars: { bronze: 100, prata: 100, ouro: 100, platina: 100 },
    notes: 'Cliente top. Já fez todos os tipos de procedimento. Prefere horários fixos (terça 14:30). Maior ticket da clínica.',
    historico: [
      ['30/06', 'Laser CO2 fracionado', 'Dra. Camila', 'R$ 1.200,00', 'Aguardando'],
      ['15/06', 'Toxina botulínica', 'Dra. Camila', 'R$ 890,00', 'Concluído'],
      ['01/06', 'Preenchimento labial', 'Dra. Camila', 'R$ 950,00', 'Concluído'],
      ['15/05', 'Laser CO2 (sessão 3/5)', 'Dra. Camila', 'R$ 1.200,00', 'Concluído'],
      ['01/05', 'Laser CO2 (sessão 2/5)', 'Dra. Camila', 'R$ 1.200,00', 'Concluído'],
      ['15/04', 'Laser CO2 (sessão 1/5)', 'Dra. Camila', 'R$ 1.200,00', 'Concluído']
    ]
  }
};

const filterOptions = {
  status: [
    { label: 'Em dia', value: 'Em dia' },
    { label: 'Pagamento pendente', value: 'Pagamento pendente' },
    { label: 'Fidelidade expirando', value: 'Fidelidade expirando' }
  ]
};

export const useClientStore = create((set, get) => ({
  clients: initialClients,
  searchTerm: '',
  activeFilters: {},
  nextId: 7,
  total: 328,
  prontData,
  filterOptions,

  setSearchTerm: (term) => set({ searchTerm: term }),

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: value
        ? { ...state.activeFilters, [key]: value }
        : Object.fromEntries(Object.entries(state.activeFilters).filter(([k]) => k !== key))
    })),

  clearFilters: () => set({ activeFilters: {} }),

  addClient: (cliente) =>
    set((state) => {
      const newId = String(state.nextId);
      const newClient = { id: newId, ...cliente };
      return {
        clients: [...state.clients, newClient],
        nextId: state.nextId + 1,
        total: state.total + 1,
      };
    }),

  getFilteredClients: () => {
    const { clients, searchTerm, activeFilters } = get();
    let filtered = [...clients];

    // Apply search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.nome.toLowerCase().includes(term) ||
          c.tel.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          (c.cpf && c.cpf.toLowerCase().includes(term))
      );
    }

    // Apply filters
    if (activeFilters.status) {
      filtered = filtered.filter((c) => c.status === activeFilters.status);
    }

    return filtered;
  },


}));
