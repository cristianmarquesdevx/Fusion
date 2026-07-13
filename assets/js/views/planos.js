/**
 * Fusion ERP - View: Planos Recorrentes
 * Renderiza cards de plano e KPIs dinamicamente a partir da store
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.planos = function() {
    var cardsContainer = document.querySelector('[data-view="planos-recorrentes"] .product-grid');

    if (!cardsContainer) return;

    // ---- Helpers ----
    function formatCurrency(val) {
      return 'R$ ' + val.toFixed(2).replace('.', ',');
    }

    // ---- Renderiza os cards de planos ----
    function renderPlanos() {
      if (typeof Fusion === 'undefined' || !Fusion._modules['planosRecorrentes']) return;
      var planos = Fusion._modules['planosRecorrentes'].state.planos || [];

      if (planos.length === 0) {
        cardsContainer.innerHTML = '<div class="panel" style="grid-column:1/-1;padding:40px;text-align:center;color:var(--ink-faint);">Nenhum plano cadastrado.</div>';
        return;
      }

      cardsContainer.innerHTML = '';
      planos.forEach(function(plano, idx) {
        var isPremium = idx === 0 && (plano.assinantes || 0) >= (planos[1]?.assinantes || 0);
        var chipHtml = isPremium ? '<span class="status-chip ok" style="margin-bottom:10px;">Mais popular</span>' : '';

        var card = document.createElement('div');
        card.className = 'product-card' + (isPremium ? '' : '');
        if (isPremium) card.style.borderColor = 'var(--gold)';

        card.innerHTML =
          chipHtml +
          '<div class="p-name" style="font-size:17px;margin-bottom:4px;">' + plano.nome + '</div>' +
          '<div class="p-price" style="font-size:22px;font-weight:700;color:var(--ink);">' +
            formatCurrency(plano.valor) +
            '<small style="font-size:13px;font-weight:400;color:var(--ink-faint);">/m\u00eas</small>' +
          '</div>' +
          '<div style="margin-top:12px;font-size:13px;color:var(--ink-soft);">' +
            (plano.descricao || (plano.beneficios && plano.beneficios.length > 0
              ? plano.beneficios.slice(0, 3).join(' \u00b7 ')
              : 'Benef\u00edcios exclusivos')) +
          '</div>' +
          '<div style="margin-top:12px;font-size:12px;color:var(--ink-faint);">' +
            (plano.assinantes || 0) + ' assinantes ativos' +
          '</div>';

        cardsContainer.appendChild(card);
      });

      updateKpis(planos);
    }

    // ---- Atualiza KPIs ----
    function updateKpis(planos) {
      var view = document.querySelector('[data-view="planos-recorrentes"]');
      if (!view) return;
      var kpiValues = view.querySelectorAll('.kpi-row .kpi-card .kpi-value');
      if (kpiValues.length < 4) return;

      var totalAssinantes = planos.reduce(function(s, p) { return s + (p.assinantes || 0); }, 0);
      var mrr = planos.reduce(function(s, p) { return s + ((p.assinantes || 0) * (p.valor || 0)); }, 0);
      var retencao = 94; // mock
      var cancelamentos = 2; // mock

      kpiValues[0].textContent = totalAssinantes;
      kpiValues[1].textContent = formatCurrency(mrr);
      kpiValues[2].textContent = retencao + '%';
      kpiValues[3].textContent = cancelamentos;
    }

    // ---- Subscribe para mudanças na store ----
    if (typeof Fusion !== 'undefined' && Fusion._modules['planosRecorrentes']) {
      Fusion.subscribe('planosRecorrentes', function() {
        renderPlanos();
      });
    }

    // ---- MODAL NOVO PLANO ----
    Helpers.initModal('modalNovoPlano', {
      openBtn: 'btnNovoPlano',
      closeBtn: 'closeModalNovoPlano',
      saveBtn: 'saveModalPlano',
      formId: 'formNovoPlano',
      onSave: function(close) {
        var nome = document.getElementById('planoNome').value.trim();
        var valor = document.getElementById('planoValor').value.trim();
        if (!nome || !valor) {
          Helpers.showToast('Preencha nome e valor do plano.', 'error');
          return;
        }
        if (typeof Fusion !== 'undefined' && Fusion._modules['planosRecorrentes']) {
          Fusion.commit('planosRecorrentes/add', {
            nome: nome,
            valor: parseFloat(valor.replace(',', '.')),
            assinantes: 0,
            descricao: document.getElementById('planoDescricao').value || 'Benef\u00edcios exclusivos',
            beneficios: []
          });
        }
        Helpers.showToast('Plano "' + nome + '" criado com sucesso!', 'success');
        close();
      }
    });

    // ---- Render inicial ----
    renderPlanos();
  };
})();
