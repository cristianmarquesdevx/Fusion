/**
 * Fusion ERP - View: Financeiro
 * Modal: Nova Transação
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.financeiro = function() {
    // ---- FILTRO AVANÇADO DE TRANSAÇÕES ----
    Helpers.initFilterPanel('btnFiltrarFinanceiro', {
      viewName: 'financeiro',
      container: '[data-view="financeiro"] .table-wrap table',
      counterId: 'counterFinanceiro',
      dateFilterKey: 'periodo',
      groups: [
        {
          key: 'tipo',
          label: 'Tipo',
          items: [
            { label: 'Receita', value: 'R$' },
            { label: 'Despesa', value: '− R$' }
          ]
        },
        {
          key: 'status',
          label: 'Status',
          items: [
            { label: 'Pago', value: 'Pago' },
            { label: 'Pendente', value: 'Pendente' },
            { label: 'A pagar', value: 'A pagar' }
          ]
        },
        {
          key: 'periodo',
          label: 'Período',
          items: [
            { label: 'Hoje', value: 'hoje' },
            { label: 'Esta semana', value: 'semana' },
            { label: 'Este mês', value: 'mes' }
          ]
        }
      ]
    });

    // ---- BUSCA NA TABELA DE TRANSAÇÕES ----
    Helpers.initSearch('searchFinanceiro', {
      container: '[data-view="financeiro"] .table-wrap table',
      counterId: 'counterFinanceiro'
    });

    // ---- MODAL NOVA TRANSAÇÃO (FINANCEIRO) ----
    Helpers.initModal('modalTransacao', {
      openBtn: 'btnNovaTransacao',
      closeBtn: 'closeModalTransacao',
      cancelBtn: 'cancelModalTransacao',
      saveBtn: 'saveModalTransacao',
      formId: 'formTransacao',
      onOpen: function() {
        var hoje = new Date();
        var dataStr = hoje.getFullYear() + '-' +
          String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
          String(hoje.getDate()).padStart(2, '0');
        document.getElementById('transData').value = dataStr;
        document.getElementById('transStatus').value = 'Pago';
      },
      onSave: function(close) {
        var tipo = document.getElementById('transTipo').value;
        var valor = document.getElementById('transValor').value;
        var desc = document.getElementById('transDesc').value.trim();
        var categoria = document.getElementById('transCategoria').value;
        if (!tipo || !valor || !desc || !categoria) {
          Helpers.showToast('Preencha tipo, valor, descri\u00e7\u00e3o e categoria.', 'error');
          return;
        }
        var pagamento = document.getElementById('transPagamento').value;
        var data = document.getElementById('transData').value;
        var status = document.getElementById('transStatus').value;
        var obs = document.getElementById('transObs').value.trim();
        var valorNum = parseFloat(valor);
        var transacao = {
          descricao: desc,
          categoria: categoria,
          data: data ? data.split('-').reverse().slice(0, 2).join('/') : new Date().toLocaleDateString('pt-BR').slice(0, 5),
          valor: valorNum,
          tipo: tipo,
          status: status,
          formaPagamento: pagamento || null,
          observacoes: obs || ''
        };
        if (typeof Fusion !== 'undefined' && Fusion._modules['financeiro']) {
          Fusion.commit('financeiro/addTransacao', transacao);
        }
        var sinal = tipo === 'receita' ? 'R$' : '\u2212 R$';
        Helpers.showToast(tipo.charAt(0).toUpperCase() + tipo.slice(1) + ' \u2022 ' + desc + ' \u2022 ' + sinal + ' ' + valorNum.toFixed(2), 'success');
        close();
      }
    });


  };
})();
