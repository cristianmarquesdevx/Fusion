/**
 * Fusion ERP - View: Business Intelligence
 * Renderiza gráficos, serviços e KPIs dinamicamente a partir da store
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.bi = function() {
    var chartContainer = document.querySelector('[data-view="bi"] .report-chart');
    var hbarContainer = document.querySelectorAll('[data-view="bi"] .report-hbar');

    if (!chartContainer) return;

    var servicesHbar = hbarContainer.length > 0 ? hbarContainer[0] : null;

    // ---- Dados mockados para BI (padrão) ----
    var defaultRevenueData = [
      { month: 'Jan', revenue: 28500, pct: 69 },
      { month: 'Fev', revenue: 32000, pct: 78 },
      { month: 'Mar', revenue: 29800, pct: 72 },
      { month: 'Abr', revenue: 35600, pct: 86 },
      { month: 'Mai', revenue: 41200, pct: 90 },
      { month: 'Jun', revenue: 38900, pct: 85 },
      { month: 'Jul', revenue: 86420, pct: 100, today: true }
    ];

    var defaultServices = [
      { name: 'Limpeza de pele', pct: 100, value: '25%' },
      { name: 'Massagem',       pct: 80,  value: '20%' },
      { name: 'Botox',          pct: 72,  value: '18%' },
      { name: 'Maquiagem',      pct: 60,  value: '15%' },
      { name: 'Laser',          pct: 48,  value: '12%' },
      { name: 'Outros',         pct: 40,  value: '10%' }
    ];

    // ---- Formata moeda ----
    function formatCurrency(val) {
      if (val >= 1000) {
        return (val / 1000).toFixed(1).replace('.', ',') + 'k';
      }
      return val.toFixed(0);
    }

    // ---- Renderiza gráfico de receita ----
    function renderChart(data) {
      chartContainer.innerHTML = '';
      data.forEach(function(d) {
        var wrap = document.createElement('div');
        wrap.className = 'rc-bar-wrap';
        wrap.innerHTML =
          '<span class="rc-val">' + formatCurrency(d.revenue) + '</span>' +
          '<div class="rc-bar' + (d.today ? ' today' : '') + '" style="height:' + d.pct + '%;"></div>' +
          '<span class="rc-label">' + d.month + (d.today ? ' *' : '') + '</span>';
        chartContainer.appendChild(wrap);
      });
    }

    // ---- Renderiza gráfico de serviços ----
    function renderServices(data) {
      if (!servicesHbar) return;
      servicesHbar.innerHTML = '';
      data.forEach(function(s) {
        var row = document.createElement('div');
        row.className = 'hb-row';
        row.innerHTML =
          '<span class="hb-label">' + s.name + '</span>' +
          '<div class="hb-bar-wrap"><div class="hb-bar" style="width:' + s.pct + '%;background:var(--brand);"></div></div>' +
          '<span class="hb-value">' + s.value + '</span>';
        servicesHbar.appendChild(row);
      });
    }

    // ---- Renderiza KPIs ----
    function updateKpis(state) {
      var view = document.querySelector('[data-view="bi"]');
      if (!view) return;
      var kpiValues = view.querySelectorAll('.kpi-row .kpi-card .kpi-value');
      if (kpiValues.length < 4) return;

      var m = state.metrics || {};
      kpiValues[0].textContent = 'R$ ' + (m.receita || 86420).toLocaleString('pt-BR');
      kpiValues[1].textContent = 'R$ ' + (m.ticketMedio || 238).toFixed(0);
      kpiValues[2].textContent = (m.clientesAtivas || 328).toLocaleString('pt-BR');
      kpiValues[3].textContent = (m.sessoes || 362).toLocaleString('pt-BR');
    }

    // ---- Render completa do BI ----
    function renderBI() {
      if (typeof Fusion === 'undefined' || !Fusion._modules['bi']) return;
      var state = Fusion._modules['bi'].state;

      // Renderiza gráfico de receita
      renderChart(defaultRevenueData);

      // Renderiza serviços
      renderServices(defaultServices);

      // Atualiza KPIs
      updateKpis(state);
    }

    // ---- Filtros por período ----
    var periodBtns = document.querySelectorAll('[data-view="bi"] .report-period-btn');
    periodBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        periodBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var label = btn.textContent.trim();

        // Atualiza o período na store
        if (typeof Fusion !== 'undefined' && Fusion._modules['bi']) {
          Fusion.commit('bi/setPeriod', label.toLowerCase());
        }

        // Renderiza novamente (dados mockados por enquanto)
        renderBI();
      });
    });

    // ---- Subscribe para mudanças na store ----
    if (typeof Fusion !== 'undefined' && Fusion._modules['bi']) {
      Fusion.subscribe('bi', function() {
        renderBI();
      });
    }

    // ---- Render inicial ----
    renderBI();
  };
})();
