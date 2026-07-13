/**
 * Fusion ERP - View: PDV
 * Event listeners para Finalizar cobrança e Salvar carrinho
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.pdv = function() {
    // ---- BUSCA DE PRODUTOS/SERVIÇOS ----
    Helpers.initSearch('searchPdv', {
      container: '[data-view="pdv"] .product-grid',
      counterId: 'counterPdv',
      childSelector: '.product-card',
      filterMode: 'cards'
    });

    var btnFinalizar = document.getElementById('btnFinalizarCobranca');
    var btnSalvar = document.getElementById('btnSalvarCarrinho');

    if (btnFinalizar) {
      btnFinalizar.addEventListener('click', function(e) {
        e.preventDefault();
        // Simula finalização da venda
        var totalEl = document.querySelector('.cart-total-row .val');
        var total = totalEl ? totalEl.textContent.trim() : 'R$ 0,00';
        Helpers.showToast(
          'Venda finalizada com sucesso! Total: ' + total + '. Nota fiscal enviada por e-mail.',
          'success'
        );
      });
    }

    if (btnSalvar) {
      btnSalvar.addEventListener('click', function(e) {
        e.preventDefault();
        Helpers.showToast(
          'Carrinho salvo como rascunho. Você pode retomar depois em "Vendas pendentes".',
          'info'
        );
      });
    }


  };
})();
