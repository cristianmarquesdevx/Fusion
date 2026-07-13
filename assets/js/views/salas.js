/**
 * Fusion ERP - View: Salas (Gestão de Salas)
 * Renderização dinâmica dos painéis de sala + KPI + Modal Nova Sala
 * Filtros e busca integrados
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.salas = function() {
    var roomsGrid = document.getElementById('roomsGrid');
    var searchInput = document.getElementById('searchSalas');

    if (!roomsGrid) return;

    // ---- Helper: classe de status chip ----
    function getStatusInfo(status) {
      switch (status) {
        case 'disponivel': return { label: 'Disponível', cls: 'ok' };
        case 'em_uso': return { label: 'Em uso', cls: 'warn' };
        case 'ocupada': return { label: 'Ocupada', cls: 'warn' };
        case 'manutencao': return { label: 'Manutenção', cls: 'crit' };
        default: return { label: status, cls: 'ok' };
      }
    }

    // ---- Renderiza todos os painéis de sala ----
    function renderRooms() {
      if (typeof Fusion === 'undefined' || !Fusion._modules['salas']) return;
      var state = Fusion._modules['salas'].state;
      var rooms = state.list || [];
      var query = searchInput ? searchInput.value.toLowerCase().trim() : '';

      roomsGrid.innerHTML = '';
      rooms.forEach(function(sala) {
        // Filtro por busca
        if (query && sala.nome.toLowerCase().indexOf(query) === -1) {
          return;
        }

        var statusInfo = getStatusInfo(sala.status);
        var equipamentos = sala.equipamentos || '';
        var capacidade = sala.capacidade || 1;
        var sub = 'Capacidade: ' + capacidade + ' cliente' + (capacidade > 1 ? 's' : '') + (equipamentos ? ' \\u00b7 Equipamentos: ' + equipamentos : '');

        var panel = document.createElement('div');
        panel.className = 'panel';

        // HEAD
        var head = document.createElement('div');
        head.className = 'panel-head';
        head.innerHTML = '<div><h2>' + sala.nome + '</h2><div class="sub">' + sub + '</div></div>' +
          '<span class="status-chip ' + statusInfo.cls + '">' + statusInfo.label + '</span>';
        panel.appendChild(head);

        // BODY
        var body = document.createElement('div');
        body.className = 'panel-body';

        if (sala.status === 'manutencao' && sala.manutencao) {
          // Manutenção
          var manRow = document.createElement('div');
          manRow.className = 'list-row';
          manRow.innerHTML = '<div><div class="li-name">' + (sala.manutencao.motivo || 'Manuten\\u00e7\\u00e3o programada') + '</div>' +
            '<div class="li-sub">Previs\\u00e3o de retorno: ' + (sala.manutencao.previsao || '\\u2014') + ' \\u00b7 T\\u00e9cnico: ' + (sala.manutencao.tecnico || '\\u2014') + '</div></div>' +
            '<span class="stock-qty" style="color:var(--rose);font-size:12px;">Em manuten\\u00e7\\u00e3o</span>';
          body.appendChild(manRow);
        } else if (sala.status === 'disponivel') {
          // Disponível
          var dispRow = document.createElement('div');
          dispRow.className = 'list-row';
          if (sala.nextSession) {
            dispRow.innerHTML = '<div><div class="li-name">Pr\\u00f3ximo agendamento</div>' +
              '<div class="li-sub">' + sala.nextSession.profissional + ' \\u00b7 ' + sala.nextSession.hora + ' \\u00b7 ' + sala.nextSession.servico + '</div></div>' +
              '<span class="stock-qty" style="color:var(--ink-faint);font-size:12px;">Livre at\\u00e9 ' + sala.nextSession.hora + '</span>';
          } else {
            dispRow.innerHTML = '<div><div class="li-name">Dispon\\u00edvel para encaixes</div>' +
              '<div class="li-sub">Nenhum agendamento pendente</div></div>' +
              '<span class="stock-qty" style="color:var(--sage);font-size:12px;">Livre agora</span>';
          }
          body.appendChild(dispRow);
        } else if (sala.currentSession) {
          // Em uso / Ocupada
          var sessionRow = document.createElement('div');
          sessionRow.className = 'list-row';
          var ate = sala.currentSession.ate || '';
          sessionRow.innerHTML = '<div><div class="li-name">' + sala.currentSession.profissional + '</div>' +
            '<div class="li-sub">' + sala.currentSession.servico + ' \\u00b7 ' + sala.currentSession.cliente + (ate ? ' \\u00b7 at\\u00e9 ' + ate : '') + '</div></div>' +
            '<span class="stock-qty" style="color:var(--sage);font-size:12px;">' + (sala.currentSession.inicio || '') + (ate ? '-' + ate : '') + '</span>';
          body.appendChild(sessionRow);
        }

        panel.appendChild(body);
        roomsGrid.appendChild(panel);
      });

      // Atualiza KPIs
      updateKpis(state);
      updateCounter();
    }

    // ---- Atualiza KPIs ----
    function updateKpis(state) {
      var totalEl = document.querySelector('[data-view="salas"] .kpi-row .kpi-card:nth-child(1) .kpi-value');
      var ocupEl = document.querySelector('[data-view="salas"] .kpi-row .kpi-card:nth-child(2) .kpi-value');
      var dispEl = document.querySelector('[data-view="salas"] .kpi-row .kpi-card:nth-child(3) .kpi-value');
      var manutEl = document.querySelector('[data-view="salas"] .kpi-row .kpi-card:nth-child(4) .kpi-value');

      if (totalEl) totalEl.textContent = state.totalSalas || state.list.length;
      if (ocupEl) ocupEl.textContent = (state.ocupacao || 0) + '%';
      if (dispEl) dispEl.textContent = state.disponiveisAgora || 0;
      if (manutEl) manutEl.textContent = state.manutencaoPendente || 0;

      // Atualiza deltas
      var deltaDisp = document.querySelector('[data-view="salas"] .kpi-row .kpi-card:nth-child(3) .kpi-delta');
      if (deltaDisp) {
        var salasDisp = state.list.filter(function(s) { return s.status === 'disponivel'; });
        var nomes = salasDisp.map(function(s) { return s.nome; });
        deltaDisp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 15l6-6 6 6"/></svg>' +
          (nomes.length > 0 ? nomes.slice(0, 2).join(' e ') + ' livres' : 'Nenhuma dispon\\u00edvel');
      }

      var deltaManut = document.querySelector('[data-view="salas"] .kpi-row .kpi-card:nth-child(4) .kpi-delta');
      if (deltaManut) {
        var salasManut = state.list.filter(function(s) { return s.status === 'manutencao'; });
        deltaManut.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 9l6 6 6-6"/></svg>' +
          (salasManut.length > 0 ? salasManut[0].nome + ' em manuten\\u00e7\\u00e3o' : 'Nenhuma');
      }
    }

    // ---- Atualiza contador ----
    function updateCounter() {
      var counterEl = document.getElementById('counterSalas');
      if (!counterEl) return;
      var panels = roomsGrid.querySelectorAll('.panel');
      var total = Fusion._modules['salas'].state.list.length;
      var visible = panels.length;
      counterEl.innerHTML = (visible === total)
        ? '<b>' + total + '</b>'
        : '<b>' + visible + '</b> de ' + total;
    }

    // ---- FILTRO AVANÇADO ----
    Helpers.initFilterPanel('btnFiltrarSalas', {
      viewName: 'salas',
      container: '#roomsGrid',
      counterId: 'counterSalas',
      childSelector: '.panel',
      groups: [
        {
          key: 'status',
          label: 'Status da sala',
          items: [
            { label: 'Disponível', value: 'Disponível' },
            { label: 'Em uso', value: 'Em uso' },
            { label: 'Manutenção', value: 'Manutenção' },
            { label: 'Ocupada', value: 'Ocupada' }
          ]
        }
      ],
      onApply: function(filters) {
        // Filtra painéis pela store, depois renderiza
        var state = Fusion._modules['salas'].state;
        var rooms = state.list;
        var hasFilters = Object.keys(filters).length > 0 && filters.status && filters.status.length > 0;

        // Renderiza com filtro visual
        roomsGrid.innerHTML = '';
        rooms.forEach(function(sala) {
          if (hasFilters) {
            var statusInfo = getStatusInfo(sala.status);
            var match = filters.status.some(function(v) {
              return statusInfo.label.toLowerCase() === v.toLowerCase();
            });
            if (!match) return;
          }
          // Reusa a renderização
          var query = searchInput ? searchInput.value.toLowerCase().trim() : '';
          if (query && sala.nome.toLowerCase().indexOf(query) === -1) return;

          var statusInfo = getStatusInfo(sala.status);
          // ... (mesmo código de renderRooms)
          var panel = document.createElement('div');
          panel.className = 'panel';
          var head = document.createElement('div');
          head.className = 'panel-head';
          head.innerHTML = '<div><h2>' + sala.nome + '</h2><div class="sub">Capacidade: ' + (sala.capacidade || 1) + ' cliente' + ((sala.capacidade || 1) > 1 ? 's' : '') + (sala.equipamentos ? ' \\u00b7 Equipamentos: ' + sala.equipamentos : '') + '</div></div>' +
            '<span class="status-chip ' + statusInfo.cls + '">' + statusInfo.label + '</span>';
          panel.appendChild(head);
          var body = document.createElement('div');
          body.className = 'panel-body';
          if (sala.status === 'manutencao' && sala.manutencao) {
            body.innerHTML = '<div class="list-row"><div><div class="li-name">' + (sala.manutencao.motivo || 'Manutenção') + '</div><div class="li-sub">Previsão: ' + (sala.manutencao.previsao || '—') + ' · Técnico: ' + (sala.manutencao.tecnico || '—') + '</div></div><span class="stock-qty" style="color:var(--rose);font-size:12px;">Em manutenção</span></div>';
          } else if (sala.status === 'disponivel') {
            body.innerHTML = '<div class="list-row"><div><div class="li-name">' + (sala.nextSession ? 'Próximo agendamento' : 'Disponível para encaixes') + '</div><div class="li-sub">' + (sala.nextSession ? sala.nextSession.profissional + ' · ' + sala.nextSession.hora + ' · ' + sala.nextSession.servico : 'Nenhum agendamento pendente') + '</div></div><span class="stock-qty" style="color:var(--ink-faint);font-size:12px;">' + (sala.nextSession ? 'Livre até ' + sala.nextSession.hora : 'Livre agora') + '</span></div>';
          } else if (sala.currentSession) {
            body.innerHTML = '<div class="list-row"><div><div class="li-name">' + sala.currentSession.profissional + '</div><div class="li-sub">' + sala.currentSession.servico + ' · ' + sala.currentSession.cliente + (sala.currentSession.ate ? ' · até ' + sala.currentSession.ate : '') + '</div></div><span class="stock-qty" style="color:var(--sage);font-size:12px;">' + (sala.currentSession.inicio || '') + (sala.currentSession.ate ? '-' + sala.currentSession.ate : '') + '</span></div>';
          }
          panel.appendChild(body);
          roomsGrid.appendChild(panel);
        });
        updateCounter();
      }
    });

    // ---- BUSCA NOS PAINÉIS ----
    if (searchInput) {
      searchInput.addEventListener('input', Helpers.debounce(function() {
        renderRooms();
      }, 200));
    }

    // ---- MODAL NOVA SALA ----
    Helpers.initModal('modalNovaSala', {
      openBtn: 'btnNovaSala',
      closeBtn: 'closeModalSala',
      saveBtn: document.querySelector('#modalNovaSala .modal-footer .btn:last-child'),
      formId: 'formSala',
      onSave: function(close) {
        var nome = document.getElementById('salaNome').value.trim();
        if (!nome) {
          Helpers.showToast('Informe o nome da sala.', 'error');
          return;
        }
        var capacidade = parseInt(document.getElementById('salaCapacidade').value, 10) || 1;
        var equipamentos = document.getElementById('salaEquipamentos').value.trim();

        if (typeof Fusion !== 'undefined' && Fusion._modules['salas']) {
          Fusion.commit('salas/addSala', {
            nome: nome,
            capacidade: capacidade,
            equipamentos: equipamentos || 'Nenhum',
            status: 'disponivel'
          });
        }
        Helpers.showToast('Sala \"' + nome + '\" cadastrada com sucesso!', 'success');
        renderRooms();
        close();
      }
    });

    // ---- Subscribe para mudanças na store ----
    if (typeof Fusion !== 'undefined' && Fusion._modules['salas']) {
      Fusion.subscribe('salas', function() {
        renderRooms();
      });
    }

    // ---- Render inicial ----
    renderRooms();
  };
})();
