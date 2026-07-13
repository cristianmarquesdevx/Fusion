/**
 * Fusion ERP - View: Fidelidade
 * Renderiza níveis, top clientes e KPIs dinamicamente a partir da store
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.fidelidade = function() {
    var hbarContainer = document.querySelector('[data-view="fidelidade"] .report-hbar');
    var topTbody = document.querySelector('[data-view="fidelidade"] .report-grid .panel:last-child .table-wrap tbody');

    if (!hbarContainer || !topTbody) return;

    // ---- Renderiza gráfico de níveis e top clientes ----
    function renderFidelidade() {
      if (typeof Fusion === 'undefined' || !Fusion._modules['fidelidade']) return;
      var state = Fusion._modules['fidelidade'].state;
      var niveis = state.niveis || [];
      var clientes = state.clientes || [];

      // Calcula distribuição dos clientes por nível
      var dist = {};
      niveis.forEach(function(n) { dist[n.nome] = 0; });
      clientes.forEach(function(c) {
        var nivel = c.nivel || 'Bronze';
        if (dist.hasOwnProperty(nivel)) dist[nivel]++;
      });

      // Se não houver clientes na store, usa dados mockados
      var usarMock = clientes.length === 0;
      if (usarMock) {
        dist = { Bronze: 82, Prata: 68, Ouro: 52, Platina: 28, Diamante: 6 };
      }

      // Renderiza hbars
      var maxCount = Math.max.apply(null, Object.values(dist).concat([1]));
      hbarContainer.innerHTML = '';
      niveis.forEach(function(nivel) {
        var count = dist[nivel.nome] || 0;
        var pct = Math.round((count / maxCount) * 100);
        var cor = nivel.cor === '#CD7F32' ? 'var(--gold-soft)' :
                  nivel.cor === '#C0C0C0' ? 'var(--gold-soft)' :
                  nivel.cor === '#FFD700' ? 'var(--gold)' :
                  nivel.cor === '#E5E4E2' ? 'var(--gold)' :
                  nivel.cor === '#B9F2FF' ? 'var(--brand)' : 'var(--gold-soft)';
        var nome = nivel.nome;
        var pontos = nivel.pontosMin === 0 ? '0-99 pts' :
                     nivel.nome === 'Prata' ? '100-299 pts' :
                     nivel.nome === 'Ouro' ? '300-599 pts' :
                     nivel.nome === 'Platina' ? '600-999 pts' :
                     nivel.nome === 'Diamante' ? '1000+ pts' : nivel.pontosMin + '+ pts';

        var row = document.createElement('div');
        row.className = 'hb-row';
        row.innerHTML =
          '<span class="hb-label">' + nome + ' (' + pontos + ')</span>' +
          '<div class="hb-bar-wrap"><div class="hb-bar" style="width:' + pct + '%;background:' + cor + ';"></div></div>' +
          '<span class="hb-value">' + count + '</span>';
        hbarContainer.appendChild(row);
      });

      // Renderiza top clientes na tabela
      var topClientes = usarMock
        ? [
            { nome: 'Patr\u00edcia Nogueira', nivel: 'Diamante', cor: '#B9F2FF', pontos: 1050, ultima: 'Hoje, 14:30' },
            { nome: 'Beatriz Lima',       nivel: 'Platina',  cor: '#E5E4E2', pontos: 620,  ultima: 'Hoje, 12:15' },
            { nome: 'Juliana Prado',       nivel: 'Ouro',     cor: '#FFD700', pontos: 350,  ultima: 'Hoje, 11:30' },
            { nome: 'Marina Costa',        nivel: 'Ouro',     cor: '#FFD700', pontos: 320,  ultima: 'Hoje, 09:00' },
            { nome: 'Renata Alves',        nivel: 'Prata',    cor: '#C0C0C0', pontos: 180,  ultima: 'Hoje, 10:00' }
          ]
        : clientes.slice(0, 5);

      topTbody.innerHTML = '';
      topClientes.forEach(function(c) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td class="cell-primary">' + c.nome + '</td>' +
          '<td><span class="status-chip ok">' + c.nivel + '</span></td>' +
          '<td>' + (c.pontos || 0).toLocaleString('pt-BR') + '</td>' +
          '<td>' + (c.ultima || '\u2014') + '</td>';
        topTbody.appendChild(tr);
      });

      // Atualiza KPIs
      updateKpis(state, usarMock);
    }

    // ---- Atualiza KPIs ----
    function updateKpis(state, usarMock) {
      var view = document.querySelector('[data-view="fidelidade"]');
      if (!view) return;
      var kpiValues = view.querySelectorAll('.kpi-row .kpi-card .kpi-value');
      if (kpiValues.length < 4) return;

      var totalPontos = usarMock ? 18420 : (state.totalPontos || 0);
      var totalClientes = usarMock ? 236 : ((state.clientes || []).length || 236);
      var resgateMes = usarMock ? 3240 : (state.resgateMes || 3240);
      var ticketFid = usarMock ? 312 : (state.ticketMedio || 312);

      kpiValues[0].textContent = totalPontos.toLocaleString('pt-BR');
      kpiValues[1].textContent = totalClientes;
      kpiValues[2].textContent = resgateMes.toLocaleString('pt-BR');
      kpiValues[3].textContent = 'R$ ' + ticketFid.toFixed(0).replace('.', ',');
    }

    // ---- Subscribe para mudanças na store ----
    if (typeof Fusion !== 'undefined' && Fusion._modules['fidelidade']) {
      Fusion.subscribe('fidelidade', function() {
        renderFidelidade();
      });
    }

    // ---- FILTRO AVANÇADO DE FIDELIDADE ----
    Helpers.initFilterPanel('btnFiltrarFidelidade', {
      viewName: 'fidelidade',
      container: '[data-view="fidelidade"] .table-wrap table',
      counterId: 'counterFidelidade',
      groups: [
        {
          key: 'nivel',
          label: 'N\u00edvel',
          items: [
            { label: 'Bronze', value: 'Bronze' },
            { label: 'Prata', value: 'Prata' },
            { label: 'Ouro', value: 'Ouro' },
            { label: 'Platina', value: 'Platina' },
            { label: 'Diamante', value: 'Diamante' }
          ]
        }
      ]
    });

    // ---- BUSCA NA TABELA DE FIDELIDADE ----
    Helpers.initSearch('searchFidelidade', {
      container: '[data-view="fidelidade"] .table-wrap table',
      counterId: 'counterFidelidade'
    });

    // ---- MODAL ADICIONAR PONTOS ----
    Helpers.initModal('modalAddPontos', {
      openBtn: 'btnAddPontos',
      closeBtn: 'closeModalPontos',
      saveBtn: 'saveModalPontos',
      formId: 'formPontos',
      onOpen: function() {
        document.getElementById('pontosQtd').value = 100;
      },
      onSave: function(close) {
        var cliente = document.getElementById('pontosCliente').value;
        var qtd = document.getElementById('pontosQtd').value;
        if (!cliente || !qtd) {
          Helpers.showToast('Selecione cliente e quantidade de pontos.', 'error');
          return;
        }
        var nomeCliente = document.getElementById('pontosCliente').options[
          document.getElementById('pontosCliente').selectedIndex
        ].text;
        Helpers.showToast(qtd + ' pontos adicionados para ' + nomeCliente + '!', 'success');
        if (typeof Fusion !== 'undefined' && Fusion._modules['fidelidade']) {
          Fusion.commit('fidelidade/addPontos', { clienteId: cliente, pontos: parseInt(qtd, 10) });
        }
        close();
      }
    });

    // ---- Render inicial ----
    renderFidelidade();
  };
})();
