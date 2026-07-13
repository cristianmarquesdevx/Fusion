/**
 * Fusion ERP - View: Pacotes
 * Renderiza tabela e KPIs dinamicamente a partir da store
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.pacotes = function() {
    var tbody = document.querySelector('[data-view="pacotes"] .table-wrap tbody');

    if (!tbody) return;

    // ---- Helpers ----
    function formatCurrency(val) {
      return 'R$ ' + val.toFixed(2).replace('.', ',');
    }

    function getStatusChip(pacote) {
      if (pacote.promocao) return '<span class="status-chip warn">Promo\u00e7\u00e3o</span>';
      return '<span class="status-chip ok">Ativo</span>';
    }

    // ---- Renderiza a tabela ---- 
    function renderPacotes() {
      if (typeof Fusion === 'undefined' || !Fusion._modules['pacotes']) return;
      var list = Fusion._modules['pacotes'].state.list || [];

      tbody.innerHTML = '';
      list.forEach(function(p) {
        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td class="cell-primary">' + p.nome + '</td>' +
          '<td>' + (p.servico || '\u2014') + '</td>' +
          '<td>' + p.sessoes + '</td>' +
          '<td>' + formatCurrency(p.valor) + '</td>' +
          '<td>' + p.validadeMeses + ' meses</td>' +
          '<td>' + (p.ativos || 0) + '</td>' +
          '<td>' + getStatusChip(p) + '</td>';
        tbody.appendChild(tr);
      });

      updateKpis(list);
    }

    // ---- Atualiza KPIs ----
    function updateKpis(list) {
      var totalAtivos = list.length;
      var totalSessoes = list.reduce(function(sum, p) { return sum + (p.ativos || 0) * (p.sessoes || 0); }, 0);
      var receitaPacotes = list.reduce(function(sum, p) { return sum + (p.ativos || 0) * (p.valor || 0); }, 0);
      var ticketMedio = totalAtivos > 0 ? receitaPacotes / totalAtivos : 0;

      var view = document.querySelector('[data-view="pacotes"]');
      if (!view) return;

      var kpiValues = view.querySelectorAll('.kpi-card .kpi-value');
      if (kpiValues.length >= 4) {
        kpiValues[0].textContent = totalAtivos;
        kpiValues[1].textContent = totalSessoes;
        kpiValues[2].textContent = formatCurrency(receitaPacotes);
        kpiValues[3].textContent = formatCurrency(ticketMedio);
      }
    }

    // ---- Filtros por período ---- 
    var periodBtns = document.querySelectorAll('[data-view="pacotes"] .report-period-btn');
    periodBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        periodBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var label = btn.textContent.trim();
        var list = (typeof Fusion !== 'undefined' && Fusion._modules['pacotes'])
          ? Fusion._modules['pacotes'].state.list : [];

        var filtered = list;
        if (label === 'Promo\u00e7\u00f5es') {
          filtered = list.filter(function(p) { return p.promocao; });
        } else if (label === 'Expirados') {
          filtered = [];
        }

        // Re-renderiza
        tbody.innerHTML = '';
        filtered.forEach(function(p) {
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td class="cell-primary">' + p.nome + '</td>' +
            '<td>' + (p.servico || '\u2014') + '</td>' +
            '<td>' + p.sessoes + '</td>' +
            '<td>' + formatCurrency(p.valor) + '</td>' +
            '<td>' + p.validadeMeses + ' meses</td>' +
            '<td>' + (p.ativos || 0) + '</td>' +
            '<td>' + getStatusChip(p) + '</td>';
          tbody.appendChild(tr);
        });
      });
    });

    // ---- Subscribe para mudanças na store ----
    if (typeof Fusion !== 'undefined' && Fusion._modules['pacotes']) {
      Fusion.subscribe('pacotes', function() {
        renderPacotes();
      });
    }

    // ---- MODAL NOVO PACOTE ----
    Helpers.initModal('modalNovoPacote', {
      openBtn: 'btnNovoPacote',
      closeBtn: 'closeModalPacote',
      saveBtn: document.querySelector('#modalNovoPacote .modal-footer .btn:last-child'),
      formId: 'formPacote',
      onSave: function(close) {
        var nome = document.getElementById('pacoteNome').value.trim();
        var sessoes = document.getElementById('pacoteSessoes').value;
        var valor = document.getElementById('pacoteValor').value.trim();
        if (!nome || !sessoes || !valor) {
          Helpers.showToast('Preencha nome, sess\u00f5es e valor do pacote.', 'error');
          return;
        }
        if (typeof Fusion !== 'undefined' && Fusion._modules['pacotes']) {
          Fusion.commit('pacotes/add', {
            nome: nome,
            servico: document.getElementById('pacoteServico').value || '\u2014',
            sessoes: parseInt(sessoes, 10),
            valor: parseFloat(valor.replace(',', '.')),
            validadeMeses: parseInt(document.getElementById('pacoteValidade').value, 10) || 12,
            ativos: 0,
            promocao: false
          });
        }
        Helpers.showToast('Pacote "' + nome + '" criado com sucesso!', 'success');
        close();
      }
    });

    // ---- Render inicial ----
    renderPacotes();
  };
})();
