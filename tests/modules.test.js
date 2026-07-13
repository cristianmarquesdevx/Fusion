import { describe, it, expect, vi, beforeEach } from 'vitest';

// FusionStore class is loaded as a global via setup.js

describe('Módulos da Store (registrados em app.js)', () => {
  let store;

  beforeEach(() => {
    store = new FusionStore();
    // Mock StorageService para evitar persistência real
    vi.spyOn(StorageService, 'set').mockImplementation(() => {});
  });

  // ---- Módulo Fidelidade ----  
  describe('módulo fidelidade', () => {
    function freshFidelidade() {
      return {
        state: {
          clientes: [],
          niveis: [
            { nome: 'Bronze', pontosMin: 0, cor: '#CD7F32' },
            { nome: 'Prata', pontosMin: 100, cor: '#C0C0C0' },
            { nome: 'Ouro', pontosMin: 300, cor: '#FFD700' },
            { nome: 'Platina', pontosMin: 600, cor: '#E5E4E2' },
            { nome: 'Diamante', pontosMin: 1000, cor: '#B9F2FF' }
          ],
          totalPontos: 18420
        },
        mutations: {
          addPontos: function(state, { clienteId, pontos }) {
            state.totalPontos += pontos;
          }
        },
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('fidelidade', freshFidelidade());
    });

    it('deve ter estado inicial', () => {
      expect(store.getState('fidelidade.totalPontos')).toBe(18420);
      expect(store.getState('fidelidade.niveis')).toHaveLength(5);
      expect(store.getState('fidelidade.niveis.0.nome')).toBe('Bronze');
      expect(store.getState('fidelidade.niveis.4.nome')).toBe('Diamante');
    });

    it('deve adicionar pontos via addPontos', () => {
      store.commit('fidelidade/addPontos', { clienteId: '1', pontos: 150 });
      expect(store.getState('fidelidade.totalPontos')).toBe(18570);
    });

    it('deve aceitar múltiplas adições de pontos', () => {
      store.commit('fidelidade/addPontos', { clienteId: '1', pontos: 100 });
      store.commit('fidelidade/addPontos', { clienteId: '2', pontos: 200 });
      store.commit('fidelidade/addPontos', { clienteId: '3', pontos: 50 });
      expect(store.getState('fidelidade.totalPontos')).toBe(18770);
    });

    it('deve notificar listeners ao adicionar pontos', () => {
      const listener = vi.fn();
      store.subscribe('fidelidade', listener);
      store.commit('fidelidade/addPontos', { clienteId: '1', pontos: 100 });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].totalPontos).toBe(18520);
    });
  });

  // ---- Módulo Clientes ----
  describe('módulo clientes', () => {
    function freshClientes() {
      return {
        state: {
          list: [
            { id: '1', nome: 'Marina Costa', tel: '(11) 98221-4410', email: 'marina.costa@email.com', desde: '2022', ultima: 'Hoje, 09:00', pacote: 'Limpeza facial · 4/10 sessões', status: 'Em dia' },
            { id: '2', nome: 'Renata Alves', tel: '(11) 99110-2287', email: 'renata.alves@email.com', desde: '2021', ultima: 'Hoje, 10:00', pacote: 'Peeling · 2/6 sessões', status: 'Em dia' }
          ],
          nextId: 7,
          total: 328
        },
        mutations: {
          addCliente: function(state, cliente) {
            cliente.id = String(state.nextId++);
            state.list.push(cliente);
            state.total++;
          }
        },
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('clientes', freshClientes());
    });

    it('deve ter estado inicial com 2 clientes', () => {
      expect(store.getState('clientes.list')).toHaveLength(2);
      expect(store.getState('clientes.total')).toBe(328);
      expect(store.getState('clientes.nextId')).toBe(7);
    });

    it('deve adicionar cliente via addCliente', () => {
      store.commit('clientes/addCliente', {
        nome: 'Nova Cliente',
        tel: '(11) 99999-0000',
        email: 'nova@email.com',
        cpf: '123.456.789-00',
        desde: '2024',
        ultima: '—',
        pacote: 'Sem pacote ativo',
        status: 'Em dia'
      });

      const clientes = store.getState('clientes.list');
      expect(clientes).toHaveLength(3);
      expect(clientes[2].nome).toBe('Nova Cliente');
      expect(clientes[2].id).toBe('7');
      expect(store.getState('clientes.total')).toBe(329);
      expect(store.getState('clientes.nextId')).toBe(8);
    });

    it('deve incrementar nextId a cada adição', () => {
      store.commit('clientes/addCliente', { nome: 'Cliente A', tel: '(11) 11111-1111' });
      store.commit('clientes/addCliente', { nome: 'Cliente B', tel: '(11) 22222-2222' });
      expect(store.getState('clientes.nextId')).toBe(9);
      expect(store.getState('clientes.list')).toHaveLength(4);
      expect(store.getState('clientes.list.2.id')).toBe('7');
      expect(store.getState('clientes.list.3.id')).toBe('8');
    });
  });

  // ---- Módulo Agenda ----
  describe('módulo agenda', () => {
    function freshAgenda() {
      return {
        state: {
          appointments: [],
          nextId: 1
        },
        mutations: {
          addAgendamento: function(state, appt) {
            appt.id = String(state.nextId++);
            appt.createdAt = new Date().toISOString();
            state.appointments.push(appt);
          }
        },
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('agenda', freshAgenda());
    });

    it('deve iniciar com lista vazia', () => {
      expect(store.getState('agenda.appointments')).toEqual([]);
      expect(store.getState('agenda.nextId')).toBe(1);
    });

    it('deve adicionar agendamento com timestamp', () => {
      const before = Date.now();
      store.commit('agenda/addAgendamento', {
        cliente: '1',
        clienteNome: 'Marina Costa',
        profissional: 'Dra. Camila',
        servico: 'Limpeza de pele',
        data: '2024-07-06',
        hora: '09:00',
        duracao: 60,
        status: 'confirmado'
      });

      const appts = store.getState('agenda.appointments');
      expect(appts).toHaveLength(1);
      expect(appts[0].clienteNome).toBe('Marina Costa');
      expect(appts[0].id).toBe('1');
      expect(appts[0].createdAt).toBeDefined();
      expect(new Date(appts[0].createdAt).getTime()).toBeGreaterThanOrEqual(before);
      expect(store.getState('agenda.nextId')).toBe(2);
    });

    it('deve incrementar IDs sequencialmente', () => {
      store.commit('agenda/addAgendamento', { clienteNome: 'Ana' });
      store.commit('agenda/addAgendamento', { clienteNome: 'Bia' });
      store.commit('agenda/addAgendamento', { clienteNome: 'Carla' });
      const appts = store.getState('agenda.appointments');
      expect(appts[0].id).toBe('1');
      expect(appts[1].id).toBe('2');
      expect(appts[2].id).toBe('3');
    });
  });

  // ---- Módulo Financeiro ----
  describe('módulo financeiro', () => {
    function freshFinanceiro() {
      return {
        state: {
          transacoes: [
            { id: '1', descricao: 'Sessão · Juliana Prado', categoria: 'Procedimento', data: '30/06', valor: 890.00, tipo: 'receita', status: 'Pago' }
          ],
          nextId: 6
        },
        mutations: {
          addTransacao: function(state, transacao) {
            transacao.id = String(state.nextId++);
            transacao.createdAt = new Date().toISOString();
            state.transacoes.push(transacao);
          }
        },
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('financeiro', freshFinanceiro());
    });

    it('deve começar com transação inicial', () => {
      expect(store.getState('financeiro.transacoes')).toHaveLength(1);
      expect(store.getState('financeiro.nextId')).toBe(6);
    });

    it('deve adicionar transação financeira', () => {
      store.commit('financeiro/addTransacao', {
        descricao: 'Nova venda',
        categoria: 'Produto',
        data: '06/07',
        valor: 150.00,
        tipo: 'receita',
        status: 'Pago'
      });

      const transacoes = store.getState('financeiro.transacoes');
      expect(transacoes).toHaveLength(2);
      expect(transacoes[1].descricao).toBe('Nova venda');
      expect(transacoes[1].id).toBe('6');
      expect(transacoes[1].createdAt).toBeDefined();
    });

    it('deve adicionar despesa', () => {
      store.commit('financeiro/addTransacao', {
        descricao: 'Compra material',
        categoria: 'Estoque',
        data: '06/07',
        valor: 500.00,
        tipo: 'despesa',
        status: 'Pendente'
      });

      const transacoes = store.getState('financeiro.transacoes');
      expect(transacoes[1].tipo).toBe('despesa');
      expect(transacoes[1].status).toBe('Pendente');
    });
  });

  // ---- Módulo Estoque ----
  describe('módulo estoque', () => {
    function freshEstoque() {
      return {
        state: {
          items: [
            { id: 'item1', nome: 'Toxina botulínica 100U', categoria: 'Injetáveis', qtd: 2, minimo: 5 },
            { id: 'item2', nome: 'Ácido hialurônico 1ml', categoria: 'Injetáveis', qtd: 3, minimo: 8 }
          ],
          entries: [],
          _entryCounter: 0
        },
        mutations: {
          addEntrada: function(state, entry) {
            state._entryCounter++;
            entry.id = 'entry-' + state._entryCounter;
            entry.createdAt = new Date().toISOString();
            state.entries.push(entry);
          },
          updateQuantidade: function(state, { itemId, quantidade }) {
            var item = state.items.find(function(i) { return i.id === itemId; });
            if (item) {
              item.qtd += quantidade;
            }
          }
        },
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('estoque', freshEstoque());
    });

    it('deve iniciar com 2 itens', () => {
      expect(store.getState('estoque.items')).toHaveLength(2);
      expect(store.getState('estoque.entries')).toHaveLength(0);
    });

    it('deve registrar entrada no estoque', () => {
      store.commit('estoque/addEntrada', {
        item: 'item1',
        itemNome: 'Toxina botulínica 100U',
        quantidade: 5,
        valorUnitario: 350.00,
        total: 1750.00,
        fornecedor: 'Fornecedor A',
        data: '2024-07-06',
        notaFiscal: 'NF-12345'
      });

      const entries = store.getState('estoque.entries');
      expect(entries).toHaveLength(1);
      expect(entries[0].itemNome).toBe('Toxina botulínica 100U');
      expect(entries[0].quantidade).toBe(5);
      expect(entries[0].total).toBe(1750.00);
    });

    it('deve atualizar quantidade do item', () => {
      store.commit('estoque/updateQuantidade', { itemId: 'item1', quantidade: 5 });
      const item = store.getState('estoque.items').find(i => i.id === 'item1');
      expect(item.qtd).toBe(7);
    });

    it('não deve quebrar ao atualizar item inexistente', () => {
      expect(() => {
        store.commit('estoque/updateQuantidade', { itemId: 'inexistente', quantidade: 10 });
      }).not.toThrow();
    });

    it('deve encadear addEntrada + updateQuantidade', () => {
      store.commit('estoque/addEntrada', {
        item: 'item2',
        itemNome: 'Ácido hialurônico 1ml',
        quantidade: 10,
        valorUnitario: 200.00,
        total: 2000.00
      });
      store.commit('estoque/updateQuantidade', { itemId: 'item2', quantidade: 10 });

      expect(store.getState('estoque.entries')).toHaveLength(1);
      const item = store.getState('estoque.items').find(i => i.id === 'item2');
      expect(item.qtd).toBe(13);
    });

    it('deve suportar múltiplas entradas do mesmo item', () => {
      store.commit('estoque/updateQuantidade', { itemId: 'item1', quantidade: 5 });
      store.commit('estoque/updateQuantidade', { itemId: 'item1', quantidade: 3 });
      const item = store.getState('estoque.items').find(i => i.id === 'item1');
      expect(item.qtd).toBe(10);
    });
  });

  // ---- Módulo Lista de Espera ----
  describe('módulo listaEspera', () => {
    function freshListaEspera() {
      return {
        state: {
          list: [],
          _idCounter: 0
        },
        mutations: {
          addToWaitlist: function(state, entry) {
            state._idCounter++;
            entry.id = 'wait-' + state._idCounter;
            state.list.push(entry);
          },
          removeFromWaitlist: function(state, id) {
            state.list = state.list.filter(function(e) { return e.id !== id; });
          }
        },
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('listaEspera', freshListaEspera());
    });

    it('deve iniciar com lista vazia', () => {
      expect(store.getState('listaEspera.list')).toEqual([]);
    });

    it('deve adicionar à lista de espera', () => {
      store.commit('listaEspera/addToWaitlist', {
        nome: 'Larissa Teixeira',
        tel: '(11) 96652-3398',
        servico: 'Toxina botulínica',
        preferencia: 'Manhã',
        desde: '28/06'
      });

      expect(store.getState('listaEspera.list')).toHaveLength(1);
      expect(store.getState('listaEspera.list.0.nome')).toBe('Larissa Teixeira');
    });

    it('deve remover da lista de espera por ID', () => {
      store.commit('listaEspera/addToWaitlist', { nome: 'Cliente 1' });
      store.commit('listaEspera/addToWaitlist', { nome: 'Cliente 2' });
      store.commit('listaEspera/addToWaitlist', { nome: 'Cliente 3' });

      expect(store.getState('listaEspera.list')).toHaveLength(3);

      store.commit('listaEspera/removeFromWaitlist', 'wait-1');

      const list = store.getState('listaEspera.list');
      expect(list).toHaveLength(2);
      expect(list.every(function(e) { return e.id !== 'wait-1'; })).toBe(true);
    });

    it('removeFromWaitlist deve remover apenas o item específico', () => {
      store.commit('listaEspera/addToWaitlist', { nome: 'A' });
      store.commit('listaEspera/addToWaitlist', { nome: 'B' });
      store.commit('listaEspera/addToWaitlist', { nome: 'C' });
      store.commit('listaEspera/removeFromWaitlist', 'wait-2');
      const remaining = store.getState('listaEspera.list');
      expect(remaining).toHaveLength(2);
      expect(remaining.map(function(e) { return e.nome; }).sort()).toEqual(['A', 'C']);
    });

    it('removeFromWaitlist não deve quebrar se ID não existir', () => {
      store.commit('listaEspera/addToWaitlist', { nome: 'Cliente' });
      expect(() => {
        store.commit('listaEspera/removeFromWaitlist', 'non-existent');
      }).not.toThrow();
      expect(store.getState('listaEspera.list')).toHaveLength(1);
    });
  });

  // ---- Módulo Salas ----
  describe('módulo salas', () => {
    function freshSalas() {
      return {
        state: {
          list: [
            { id: 's1', nome: 'Sala 1 — Estética Facial', equipamentos: 'Laser, Microdermo, Luz Intensa', capacidade: 1 },
            { id: 's2', nome: 'Sala 2 — Procedimentos', equipamentos: 'Cama hidráulica, LED', capacidade: 1 }
          ]
        },
        mutations: {},
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('salas', freshSalas());
    });

    it('deve ter estado inicial com 2 salas', () => {
      expect(store.getState('salas.list')).toHaveLength(2);
      expect(store.getState('salas.list.0.nome')).toContain('Sala 1');
      expect(store.getState('salas.list.1.capacidade')).toBe(1);
    });

    it('deve manter estado após snapshot', () => {
      const snap = store.snapshot();
      expect(snap.salas.list).toHaveLength(2);
      snap.salas.list.push({ id: 's3', nome: 'Sala 3' });
      expect(store.getState('salas.list')).toHaveLength(2); // não alterado
    });
  });

  // ---- Módulo Pacotes ----
  describe('módulo pacotes', () => {
    function freshPacotes() {
      return {
        state: {
          list: [
            { id: 'p1', nome: 'Limpeza facial', servico: 'Limpeza de pele', sessoes: 10, valor: 1600.00, validadeMeses: 12, ativos: 12 },
            { id: 'p2', nome: 'Peeling de diamante', servico: 'Peeling de diamante', sessoes: 6, valor: 1350.00, validadeMeses: 12, ativos: 8 }
          ]
        },
        mutations: {},
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('pacotes', freshPacotes());
    });

    it('deve ter estado inicial', () => {
      const list = store.getState('pacotes.list');
      expect(list).toHaveLength(2);
      expect(list[0].nome).toBe('Limpeza facial');
      expect(list[0].valor).toBe(1600.00);
      expect(list[1].sessoes).toBe(6);
    });
  });

  // ---- Módulo Planos Recorrentes ----
  describe('módulo planosRecorrentes', () => {
    function freshPlanos() {
      return {
        state: {
          planos: [
            { id: 'pr1', nome: 'Plano Premium', valor: 349, assinantes: 22 },
            { id: 'pr2', nome: 'Plano Essencial', valor: 149, assinantes: 12 },
            { id: 'pr3', nome: 'Plano VIP', valor: 599, assinantes: 4 }
          ]
        },
        mutations: {},
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('planosRecorrentes', freshPlanos());
    });

    it('deve ter 3 planos cadastrados', () => {
      const planos = store.getState('planosRecorrentes.planos');
      expect(planos).toHaveLength(3);
      expect(planos[0].nome).toBe('Plano Premium');
      expect(planos[0].valor).toBe(349);
      expect(planos[1].assinantes).toBe(12);
      expect(planos[2].assinantes).toBe(4);
    });

    it('deve ter plano mais caro como VIP', () => {
      const planos = store.getState('planosRecorrentes.planos');
      const maisCaro = planos.reduce(function(max, p) { return p.valor > max.valor ? p : max; }, planos[0]);
      expect(maisCaro.nome).toBe('Plano VIP');
      expect(maisCaro.valor).toBe(599);
    });
  });

  // ---- Módulo BI ----
  describe('módulo bi', () => {
    function freshBI() {
      return {
        state: {
          period: 'month',
          metrics: {
            receita: 86420,
            ticketMedio: 238,
            clientesAtivas: 328,
            sessoes: 362
          }
        },
        mutations: {
          setPeriod: function(state, period) { state.period = period; }
        },
        persist: false
      };
    }

    beforeEach(() => {
      store.registerModule('bi', freshBI());
    });

    it('deve ter período inicial month', () => {
      expect(store.getState('bi.period')).toBe('month');
    });

    it('deve ter métricas iniciais', () => {
      const metrics = store.getState('bi.metrics');
      expect(metrics.receita).toBe(86420);
      expect(metrics.ticketMedio).toBe(238);
      expect(metrics.clientesAtivas).toBe(328);
      expect(metrics.sessoes).toBe(362);
    });

    it('deve alterar período via setPeriod', () => {
      store.commit('bi/setPeriod', 'year');
      expect(store.getState('bi.period')).toBe('year');
      store.commit('bi/setPeriod', 'week');
      expect(store.getState('bi.period')).toBe('week');
    });
  });

  // ---- Teste integrado: múltiplos módulos ----
  describe('integração entre módulos', () => {
    it('deve gerenciar estado de múltiplos módulos simultaneamente', () => {
      store.registerModule('clientes', {
        state: { list: [], total: 0, nextId: 1 },
        mutations: {
          addCliente: function(state, c) {
            c.id = String(state.nextId++);
            state.list.push(c);
            state.total++;
          }
        },
        persist: false
      });

      store.registerModule('financeiro', {
        state: { transacoes: [], nextId: 1 },
        mutations: {
          addTransacao: function(state, t) {
            t.id = String(state.nextId++);
            state.transacoes.push(t);
          }
        },
        persist: false
      });

      store.registerModule('agenda', {
        state: { appointments: [], nextId: 1 },
        mutations: {
          addAgendamento: function(state, a) {
            a.id = String(state.nextId++);
            state.appointments.push(a);
          }
        },
        persist: false
      });

      // Adiciona dados em todos os módulos
      store.commit('clientes/addCliente', { nome: 'Ana', tel: '(11) 11111-1111' });
      store.commit('financeiro/addTransacao', { descricao: 'Venda', valor: 100, tipo: 'receita' });
      store.commit('agenda/addAgendamento', { clienteNome: 'Ana', servico: 'Limpeza' });

      expect(store.getState('clientes.list')).toHaveLength(1);
      expect(store.getState('financeiro.transacoes')).toHaveLength(1);
      expect(store.getState('agenda.appointments')).toHaveLength(1);
      expect(store.snapshot().clientes.list[0].nome).toBe('Ana');
    });
  });
});
