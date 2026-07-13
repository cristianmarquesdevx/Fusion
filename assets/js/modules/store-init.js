/**
 * Fusion ERP - Store Module Registration
 * Registra todos os módulos da FusionStore com seus estados iniciais.
 * Carregado depois de store.js e antes de app.js.
 */
(function() {
  if (typeof Fusion === 'undefined' || !Fusion.registerModule) return;

  // Módulo Clientes
  if (!Fusion._modules['clientes']) {
    Fusion.registerModule('clientes', {
      state: {
        list: [
          { id: '1', nome: 'Marina Costa', tel: '(11) 98221-4410', email: 'marina.costa@email.com', desde: '2022', ultima: 'Hoje, 09:00', pacote: 'Limpeza facial \u00b7 4/10 sess\u00f5es', status: 'Em dia' },
          { id: '2', nome: 'Renata Alves', tel: '(11) 99110-2287', email: 'renata.alves@email.com', desde: '2021', ultima: 'Hoje, 10:00', pacote: 'Peeling \u00b7 2/6 sess\u00f5es', status: 'Em dia' },
          { id: '3', nome: 'Juliana Prado', tel: '(11) 98833-7765', email: 'juliana.prado@email.com', desde: '2023', ultima: 'Hoje, 11:30', pacote: 'Plano recorrente Premium', status: 'Em dia' },
          { id: '4', nome: 'Beatriz Lima', tel: '(11) 97744-9021', email: 'beatriz.lima@email.com', desde: '2020', ultima: 'Hoje, 12:15', pacote: 'Drenagem \u00b7 6/8 sess\u00f5es', status: 'Pagamento pendente' },
          { id: '5', nome: 'Larissa Teixeira', tel: '(11) 96652-3398', email: 'larissa.teixeira@email.com', desde: '2024', ultima: '18 de junho', pacote: 'Sem pacote ativo', status: 'Fidelidade expirando' },
          { id: '6', nome: 'Patr\u00edcia Nogueira', tel: '(11) 98123-5567', email: 'patricia.nogueira@email.com', desde: '2019', ultima: 'Hoje, 14:30', pacote: 'Laser CO2 \u00b7 1/5 sess\u00f5es', status: 'Em dia' }
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
      persist: true
    });
  }

  // Módulo Agenda
  if (!Fusion._modules['agenda']) {
    Fusion.registerModule('agenda', {
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
      persist: true
    });
  }

  // Módulo Financeiro
  if (!Fusion._modules['financeiro']) {
    Fusion.registerModule('financeiro', {
      state: {
        transacoes: [
          { id: '1', descricao: 'Sess\u00e3o \u00b7 Juliana Prado', categoria: 'Procedimento', data: '30/06', valor: 890.00, tipo: 'receita', status: 'Pago' },
          { id: '2', descricao: 'Compra de insumos \u00b7 Distribuidora Bela Pele', categoria: 'Estoque', data: '29/06', valor: 2340.00, tipo: 'despesa', status: 'Pago' },
          { id: '3', descricao: 'Sess\u00e3o \u00b7 Beatriz Lima', categoria: 'Procedimento', data: '30/06', valor: 180.00, tipo: 'receita', status: 'Pendente' },
          { id: '4', descricao: 'Comiss\u00e3o \u00b7 Dra. Camila', categoria: 'Comiss\u00e3o', data: '28/06', valor: 1120.00, tipo: 'despesa', status: 'A pagar' },
          { id: '5', descricao: 'Plano recorrente \u00b7 Renata Alves', categoria: 'Assinatura', data: '27/06', valor: 349.00, tipo: 'receita', status: 'Pago' }
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
      persist: true
    });
  }

  // Módulo Estoque
  if (!Fusion._modules['estoque']) {
    Fusion.registerModule('estoque', {
      state: {
        items: [
          { id: 'item1', nome: 'Toxina botul\u00ednica 100U', categoria: 'Injet\u00e1veis', qtd: 2, minimo: 5 },
          { id: 'item2', nome: '\u00c1cido hialur\u00f4nico 1ml', categoria: 'Injet\u00e1veis', qtd: 3, minimo: 8 },
          { id: 'item3', nome: 'M\u00e1scara p\u00f3s-peeling', categoria: 'Descart\u00e1veis', qtd: 14, minimo: 20 },
          { id: 'item4', nome: 'S\u00e9rum vitamina C 30ml', categoria: 'Cosm\u00e9ticos', qtd: 42, minimo: 15 },
          { id: 'item5', nome: 'Luvas de nitrilo (cx.)', categoria: 'Descart\u00e1veis', qtd: 58, minimo: 20 },
          { id: 'item6', nome: 'Ponteira de laser CO2', categoria: 'Equipamentos', qtd: 6, minimo: 4 }
        ],
        entries: []
      },
      mutations: {
        addEntrada: function(state, entry) {
          entry.id = Helpers.generateId();
          entry.createdAt = new Date().toISOString();
          state.entries.push(entry);
        },
        updateQuantidade: function(state, params) {
          var item = state.items.find(function(i) { return i.id === params.itemId; });
          if (item) {
            item.qtd += params.quantidade;
          }
        }
      },
      persist: true
    });
  }

  // Módulo Fidelidade
  if (!Fusion._modules['fidelidade']) {
    Fusion.registerModule('fidelidade', {
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
        addPontos: function(state, params) {
          state.totalPontos += params.pontos;
        }
      },
      persist: true
    });
  }

  // Módulo Salas
  if (!Fusion._modules['salas']) {
    Fusion.registerModule('salas', {
      state: {
        list: [
          { id: 's1', nome: 'Sala 1 \u2014 Est\u00e9tica Facial', equipamentos: 'Laser, Microdermo, Luz Intensa', capacidade: 1 },
          { id: 's2', nome: 'Sala 2 \u2014 Procedimentos', equipamentos: 'Cama hidr\u00e1ulica, LED', capacidade: 1 },
          { id: 's3', nome: 'Sala 3 \u2014 Massagem', equipamentos: 'Maca, Aromaterapia', capacidade: 1 },
          { id: 's4', nome: 'Sala de Laser', equipamentos: 'Laser CO2 Fracionado, Luz Pulsada', capacidade: 1 },
          { id: 's5', nome: 'Sala de Procedimentos', equipamentos: 'Cama cir\u00fargica, Monitor, Aspirador', capacidade: 1 }
        ]
      },
      mutations: {},
      persist: true
    });
  }

  // Módulo Pacotes
  if (!Fusion._modules['pacotes']) {
    Fusion.registerModule('pacotes', {
      state: {
        list: [
          { id: 'p1', nome: 'Limpeza facial', servico: 'Limpeza de pele', sessoes: 10, valor: 1600.00, validadeMeses: 12, ativos: 12 },
          { id: 'p2', nome: 'Peeling de diamante', servico: 'Peeling de diamante', sessoes: 6, valor: 1350.00, validadeMeses: 12, ativos: 8 },
          { id: 'p3', nome: 'Drenagem linf\u00e1tica', servico: 'Drenagem linf\u00e1tica', sessoes: 8, valor: 1280.00, validadeMeses: 12, ativos: 6 }
        ],
        nextId: 'p4'
      },
      mutations: {
        add: function(state, pacote) {
          pacote.id = state.nextId;
          state.nextId = String(parseInt(state.nextId.replace('p', ''), 10) + 1);
          state.nextId = 'p' + state.nextId;
          state.list.push(pacote);
        }
      },
      persist: true
    });
  }

  // Módulo Planos Recorrentes
  if (!Fusion._modules['planosRecorrentes']) {
    Fusion.registerModule('planosRecorrentes', {
      state: {
        planos: [
          { id: 'pr1', nome: 'Plano Premium', valor: 349, assinantes: 22 },
          { id: 'pr2', nome: 'Plano Essencial', valor: 149, assinantes: 12 },
          { id: 'pr3', nome: 'Plano VIP', valor: 599, assinantes: 4 }
        ],
        nextId: 'pr4'
      },
      mutations: {
        add: function(state, plano) {
          plano.id = state.nextId;
          state.nextId = 'pr' + (parseInt(state.nextId.replace('pr', ''), 10) + 1);
          state.planos.push(plano);
        }
      },
      persist: true
    });
  }

  // Módulo Lista de Espera
  if (!Fusion._modules['listaEspera']) {
    Fusion.registerModule('listaEspera', {
      state: {
        list: [
          { id: 'l1', nome: 'Larissa Teixeira', tel: '(11) 96652-3398', servico: 'Toxina botul\u00ednica', preferencia: 'Manh\u00e3', desde: '28/06' },
          { id: 'l2', nome: 'Rafael Gomes', tel: '(11) 95551-2222', servico: 'Limpeza de pele', preferencia: 'Qualquer hor\u00e1rio', desde: '29/06' },
          { id: 'l3', nome: 'Sofia Ribeiro', tel: '(11) 94443-3333', servico: 'Massagem relaxante', preferencia: 'Tarde', desde: '29/06' },
          { id: 'l4', nome: 'Tais Ferreira', tel: '(11) 93332-4444', servico: 'Peeling de diamante', preferencia: 'Manh\u00e3', desde: '30/06' },
          { id: 'l5', nome: 'Bianca Oliveira', tel: '(11) 92221-5555', servico: 'Drenagem linf\u00e1tica', preferencia: 'Qualquer', desde: 'Hoje' }
        ]
      },
      mutations: {
        addToWaitlist: function(state, entry) {
          entry.id = Helpers.generateId();
          state.list.push(entry);
        },
        removeFromWaitlist: function(state, id) {
          state.list = state.list.filter(function(e) { return e.id !== id; });
        }
      },
      persist: true
    });
  }

  // Módulo BI
  if (!Fusion._modules['bi']) {
    Fusion.registerModule('bi', {
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
    });
  }

  // =====================================================================
  // MÓDULO FILA DE ATENDIMENTO
  // =====================================================================
  if (!Fusion._modules['filaAtendimento']) {
    Fusion.registerModule('filaAtendimento', {
      state: {
        filter: 'agora',
        sessions: [
          { id: 's1', hora: '09:00', cliente: 'Marina Costa', servico: 'Limpeza de pele profunda', profissional: 'Fernanda', sala: 'Sala 1', status: 'concluido', atrasoMin: 0 },
          { id: 's2', hora: '10:00', cliente: 'Renata Alves', servico: 'Peeling de diamante', profissional: 'Dra. Camila', sala: 'Sala 2', status: 'concluido', atrasoMin: 0 },
          { id: 's3', hora: '11:30', cliente: 'Juliana Prado', servico: 'Toxina botul\u00ednica', profissional: 'Dra. Camila', sala: 'Sala de Procedimentos', status: 'ativo', atrasoMin: 0 },
          { id: 's4', hora: '12:15', cliente: 'Beatriz Lima', servico: 'Drenagem linf\u00e1tica', profissional: 'Fernanda', sala: 'Sala 1', status: 'atrasado', atrasoMin: 12 },
          { id: 's5', hora: '13:00', cliente: 'Camila Ferreira', servico: 'Microagulhamento', profissional: 'Dra. Camila', sala: 'Sala 2', status: 'aguardando', atrasoMin: 0 },
          { id: 's6', hora: '14:30', cliente: 'Patr\u00edcia Nogueira', servico: 'Laser CO2 fracionado', profissional: 'Dra. Camila', sala: 'Sala de Laser', status: 'aguardando', atrasoMin: 0 },
          { id: 's7', hora: '15:00', cliente: 'Sofia Ribeiro', servico: 'Massagem relaxante', profissional: 'Carlos', sala: 'Sala 3', status: 'confirmado', atrasoMin: 0 },
          { id: 's8', hora: '16:00', cliente: 'Larissa Teixeira', servico: 'Limpeza de pele', profissional: 'Fernanda', sala: 'Sala 1', status: 'confirmado', atrasoMin: 0 }
        ]
      },
      mutations: {
        setFilter: function(state, filter) {
          state.filter = filter;
        },
        updateSessionStatus: function(state, params) {
          var session = state.sessions.find(function(s) { return s.id === params.id; });
          if (session) {
            session.status = params.status;
            if (params.atrasoMin !== undefined) session.atrasoMin = params.atrasoMin;
          }
        },
        setSessions: function(state, sessions) {
          state.sessions = sessions;
        }
      },
      persist: false
    });
  }

  // =====================================================================
  // MÓDULO GESTÃO DE SALAS (aprimorado)
  // =====================================================================
  if (Fusion._modules['salas']) {
    // Já registrado, apenas expande o estado com campos dinâmicos
    var salasState = Fusion._modules['salas'].state;
    salasState.ocupacao = 82;
    salasState.totalSalas = 5;
    salasState.emUso = 3;
    salasState.disponiveisAgora = 2;
    salasState.manutencaoPendente = 1;

    // Adiciona status e sessões para cada sala (se não existirem)
    var statusMap = {
      's1': { status: 'disponivel', currentSession: null, nextSession: { profissional: 'Fernanda', hora: '15:00', servico: 'Limpeza de pele', cliente: 'Marina Costa' } },
      's2': { status: 'em_uso', currentSession: { profissional: 'Dra. Camila', cliente: 'Camila Ferreira', servico: 'Microagulhamento', ate: '14:00' }, nextSession: null },
      's3': { status: 'disponivel', currentSession: null, nextSession: { profissional: 'Carlos', hora: '16:00', servico: 'Massagem relaxante', cliente: 'Sofia Ribeiro' } },
      's4': { status: 'manutencao', currentSession: null, nextSession: null, manutencao: { motivo: 'Manuten\u00e7\u00e3o preventiva programada', previsao: '03/07', tecnico: 'Jo\u00e3o' } },
      's5': { status: 'ocupada', currentSession: { profissional: 'Dra. Camila', cliente: 'Juliana Prado', servico: 'Toxina botul\u00ednica', ate: '12:15' }, nextSession: null }
    };

    salasState.list.forEach(function(sala) {
      var extra = statusMap[sala.id] || {};
      sala.status = extra.status || 'disponivel';
      sala.currentSession = extra.currentSession || null;
      sala.nextSession = extra.nextSession || null;
      sala.manutencao = extra.manutencao || null;
    });

    // Adiciona mutações se ainda não existirem
    if (!Fusion._modules['salas'].mutations) {
      Fusion._modules['salas'].mutations = {};
    }
    if (!Fusion._modules['salas'].mutations.addSala) {
      Fusion._modules['salas'].mutations.addSala = function(state, sala) {
        sala.id = 's' + (state.list.length + 1);
        sala.status = sala.status || 'disponivel';
        sala.currentSession = null;
        sala.nextSession = null;
        sala.manutencao = null;
        state.list.push(sala);
        state.totalSalas = state.list.length;
        state.disponiveisAgora = state.list.filter(function(s) { return s.status === 'disponivel'; }).length;
      };
    }
    if (!Fusion._modules['salas'].mutations.updateSalaStatus) {
      Fusion._modules['salas'].mutations.updateSalaStatus = function(state, params) {
        var sala = state.list.find(function(s) { return s.id === params.id; });
        if (sala) {
          sala.status = params.status;
          if (params.currentSession !== undefined) sala.currentSession = params.currentSession;
          if (params.nextSession !== undefined) sala.nextSession = params.nextSession;
        }
        // Recalcula KPIs
        state.emUso = state.list.filter(function(s) { return s.status === 'em_uso' || s.status === 'ocupada'; }).length;
        state.disponiveisAgora = state.list.filter(function(s) { return s.status === 'disponivel'; }).length;
        state.manutencaoPendente = state.list.filter(function(s) { return s.status === 'manutencao'; }).length;
        state.ocupacao = Math.round((state.emUso / state.totalSalas) * 100);
      };
    }
  }

  // =====================================================================
  // SUPABASE — REAL-TIME SUBSCRIPTIONS
  // =====================================================================
  if (typeof SupabaseService !== 'undefined' && APP_CONFIG?.supabase?.realtime) {
    var realtimeTables = APP_CONFIG.supabase.realtime.tables || [];

    realtimeTables.forEach(function(table) {
      // Mapeia tabela para módulo da store
      var moduleMap = {
        'sessoes_fila': 'filaAtendimento',
        'salas': 'salas',
        'clientes': 'clientes',
        'agendamentos': 'agenda'
      };
      var moduleName = moduleMap[table];
      if (!moduleName || !Fusion._modules[moduleName]) return;

      SupabaseService.subscribeToTable(table, '*', function(payload) {
        var eventType = payload.eventType;
        var newRecord = payload.new;
        var oldRecord = payload.old;

        // Tenta inicializar Supabase se ainda não estiver pronto
        if (!SupabaseService.isReady()) {
          SupabaseService.init();
        }

        switch (eventType) {
          case 'INSERT':
            if (moduleName === 'clientes' && Fusion._modules.clientes.mutations.addCliente) {
              Fusion.commit('clientes/addCliente', newRecord);
            }
            if (moduleName === 'agenda' && Fusion._modules.agenda.mutations.addAgendamento) {
              Fusion.commit('agenda/addAgendamento', newRecord);
            }
            break;
          case 'UPDATE':
            if (moduleName === 'salas' && Fusion._modules.salas.mutations.updateSalaStatus) {
              Fusion.commit('salas/updateSalaStatus', {
                id: newRecord.id,
                status: newRecord.status,
                currentSession: newRecord.current_session,
                nextSession: newRecord.next_session
              });
            }
            if (moduleName === 'filaAtendimento' && Fusion._modules.filaAtendimento.mutations.updateSessionStatus) {
              Fusion.commit('filaAtendimento/updateSessionStatus', {
                id: newRecord.id,
                status: newRecord.status,
                atrasoMin: newRecord.atraso_min
              });
            }
            break;
          case 'DELETE':
            // Para deleções, recarrega toda a lista da tabela
            if (SupabaseService.isReady()) {
              SupabaseService.select(table).then(function(result) {
                if (result.data && Fusion._modules[moduleName]) {
                  var stateKey = (moduleName === 'filaAtendimento') ? 'sessions' :
                                 (moduleName === 'agenda') ? 'appointments' : 'list';
                  // Atualiza diretamente o state key correto
                  var modState = Fusion._state[moduleName];
                  if (modState && modState.hasOwnProperty(stateKey)) {
                    modState[stateKey] = result.data;
                    Fusion._persist(moduleName);
                  }
                }
              });
            }
            break;
        }
      });
    });
  }

})();
