/**
 * Fusion ERP - View: Fila de Atendimento
 * Timeline dinâmica com dados da store, filtros e atualização de status
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.filaAtendimento = function() {
    var timelineEl = document.getElementById('filaTimeline');
    var panelHeadSub = document.querySelector('[data-view=\"fila-atendimento\"] .panel-head .sub');
    var panelHeadStatus = document.querySelector('[data-view=\"fila-atendimento\"] .panel-head .stock-qty');

    if (!timelineEl) return;

    // ---- Helper: classe CSS do dot ---- 
    function getDotClass(status) {
      switch (status) {
        case 'concluido': return 'done';
        case 'ativo': return 'active';
        case 'atrasado': return 'late';
        case 'aguardando': return 'waiting';
        default: return 'waiting';
      }
    }

    // ---- Helper: label e classe do status tag ----
    function getStatusTag(status, atrasoMin) {
      switch (status) {
        case 'concluido': return { label: 'Concluído', cls: 'status-done' };
        case 'ativo': return { label: 'Em atendimento', cls: 'status-active' };
        case 'atrasado': return { label: 'Atrasado ' + (atrasoMin || 0) + ' min', cls: 'status-late' };
        case 'aguardando': return { label: 'Aguardando', cls: 'status-waiting' };
        case 'confirmado': return { label: 'Confirmado', cls: 'status-waiting' };
        default: return { label: status, cls: 'status-waiting' };
      }
    }

    // ---- Renderiza a timeline ----
    function renderTimeline() {
      if (typeof Fusion === 'undefined' || !Fusion._modules['filaAtendimento']) return;
      var state = Fusion._modules['filaAtendimento'].state;
      var sessions = state.sessions || [];
      var filter = state.filter || 'agora';

      // Aplica filtro
      var filtered = sessions;
      var now = new Date();
      var currentHour = now.getHours();
      var currentMin = now.getMinutes();

      if (filter === 'agora') {
        // Mostra sessões ativas e próximas (até 2h à frente)
        filtered = sessions.filter(function(s) {
          if (s.status === 'concluido') return false;
          var parts = s.hora.split(':');
          var h = parseInt(parts[0], 10);
          var m = parseInt(parts[1], 10);
          var diffMin = (h * 60 + m) - (currentHour * 60 + currentMin);
          return diffMin >= -120 && diffMin <= 120;
        });
      } else if (filter === 'proximas-2h') {
        var limite = (currentHour + 2) * 60 + currentMin;
        filtered = sessions.filter(function(s) {
          var parts = s.hora.split(':');
          var totalMin = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
          return totalMin > (currentHour * 60 + currentMin) && totalMin <= limite;
        });
      } else if (filter === 'manha') {
        filtered = sessions.filter(function(s) {
          var parts = s.hora.split(':');
          var h = parseInt(parts[0], 10);
          return h >= 6 && h < 12;
        });
      } else if (filter === 'tarde') {
        filtered = sessions.filter(function(s) {
          var parts = s.hora.split(':');
          var h = parseInt(parts[0], 10);
          return h >= 12 && h < 18;
        });
      }

      // Ordena por horário
      filtered.sort(function(a, b) {
        return a.hora.localeCompare(b.hora);
      });

      // Renderiza
      timelineEl.innerHTML = '';
      filtered.forEach(function(session) {
        var dotClass = getDotClass(session.status);
        var tag = getStatusTag(session.status, session.atrasoMin);
        var salaAbrev = session.sala.replace(/Sala /, 'Sala ').substring(0, 10);

        var row = document.createElement('div');
        row.className = 'tl-row';
        row.innerHTML =
          '<div class=\"tl-time\">' + session.hora + '</div>' +
          '<div class=\"tl-dot-wrap\"><span class=\"tl-dot ' + dotClass + '\"></span></div>' +
          '<div class=\"tl-info\"><div class=\"cliente\">' + session.cliente + '</div><div class=\"detalhe\">' + session.servico + ' \\u00b7 ' + session.profissional + '</div></div>' +
          '<div class=\"tl-tags\"><span class=\"tag room\">' + session.sala + '</span><span class=\"tag ' + tag.cls + '\">' + tag.label + '</span></div>';
        timelineEl.appendChild(row);
      });

      // Atualiza cabeçalho
      if (panelHeadSub) {
        var total = sessions.length;
        panelHeadSub.textContent = 'Ordenado por hor\\u00e1rio \\u2014 ' + total + ' sess\\u00f5es programadas';
      }
      if (panelHeadStatus) {
        var concluidas = sessions.filter(function(s) { return s.status === 'concluido'; }).length;
        var emAndamento = sessions.filter(function(s) { return s.status === 'ativo'; }).length;
        panelHeadStatus.textContent = concluidas + ' conclu\\u00eddas \\u00b7 ' + emAndamento + ' em andamento';
        panelHeadStatus.className = 'stock-qty' + (emAndamento > 0 ? ' ok' : '');
      }
    }

    // ---- Filtros ----
    var filterBtns = document.querySelectorAll('[data-view=\"fila-atendimento\"] .report-period-btn');
    filterBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        filterBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var map = {
          'Agora': 'agora',
          'Pr\\u00f3ximas 2h': 'proximas-2h',
          'Manh\\u00e3': 'manha',
          'Tarde': 'tarde'
        };
        // Pega o label do botão ignorando possíveis ícones
        var label = btn.textContent.trim();
        var filterVal = map[label] || 'agora';

        if (typeof Fusion !== 'undefined' && Fusion._modules['filaAtendimento']) {
          Fusion.commit('filaAtendimento/setFilter', filterVal);
        }
        renderTimeline();
      });
    });

    // ---- Botão "Ver timeline completa" ----
    var btnVerCompleta = document.querySelector('[data-view=\"fila-atendimento\"] .btn.ghost');
    if (btnVerCompleta) {
      btnVerCompleta.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof Fusion !== 'undefined' && Fusion._modules['filaAtendimento']) {
          Fusion.commit('filaAtendimento/setFilter', 'all');
          // Força visual: remove active de todos e marca como "mostrando todos"
          filterBtns.forEach(function(b) { b.classList.remove('active'); });
        }
        renderTimeline();
      });
    }

    // ---- Subscribe para mudanças na store ----
    if (typeof Fusion !== 'undefined' && Fusion._modules['filaAtendimento']) {
      Fusion.subscribe('filaAtendimento', function() {
        renderTimeline();
      });
    }

    // ---- Render inicial ----
    renderTimeline();

    // ---- Simula atualização periódica (a cada 30s) ----
    setInterval(function() {
      // Verifica se a view está ativa
      var view = document.querySelector('[data-view=\"fila-atendimento\"]');
      if (view && view.classList.contains('active')) {
        renderTimeline();
      }
    }, 30000);
  };
})();
