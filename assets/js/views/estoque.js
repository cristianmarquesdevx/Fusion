/**
 * Fusion ERP - View: Estoque
 * Modal: Registrar Entrada
 * Tabela principal + Log de entradas + Subscriptions
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.estoque = function() {
    // ---- FILTRO AVANÇADO DE ESTOQUE ----
    Helpers.initFilterPanel('btnFiltrarEstoque', {
      viewName: 'estoque',
      container: '[data-view="estoque"] .table-wrap table',
      counterId: 'counterEstoque',
      groups: [
        {
          key: 'categoria',
          label: 'Categoria',
          items: [
            { label: 'Injetáveis', value: 'Injetáveis' },
            { label: 'Descartáveis', value: 'Descartáveis' },
            { label: 'Cosméticos', value: 'Cosméticos' },
            { label: 'Equipamentos', value: 'Equipamentos' }
          ]
        },
        {
          key: 'status',
          label: 'Status',
          items: [
            { label: 'Normal', value: 'Normal' },
            { label: 'Baixo', value: 'Baixo' },
            { label: 'Crítico', value: 'Crítico' }
          ]
        }
      ]
    });

    // ---- BUSCA NA TABELA DE ESTOQUE ----
    var refreshEstoque = Helpers.initSearch('searchEstoque', {
      container: '[data-view="estoque"] .table-wrap table',
      counterId: 'counterEstoque'
    });

    // ---- MODAL REGISTRAR ENTRADA (ESTOQUE) ----
    Helpers.initModal('modalEntradaEstoque', {
      openBtn: 'btnRegistrarEntrada',
      closeBtn: 'closeModalEstoque',
      cancelBtn: 'cancelModalEstoque',
      saveBtn: 'saveModalEstoque',
      formId: 'formEntradaEstoque',
      onOpen: function() {
        var hoje = new Date();
        var dataStr = hoje.getFullYear() + '-' +
          String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
          String(hoje.getDate()).padStart(2, '0');
        document.getElementById('entradaData').value = dataStr;
        document.getElementById('entradaQtd').value = 1;
      },
      onSave: function(close) {
        var item = document.getElementById('entradaItem').value;
        var qtd = document.getElementById('entradaQtd').value;
        var valor = document.getElementById('entradaValor').value;
        var fornecedor = document.getElementById('entradaFornecedor').value.trim();
        if (!item || !qtd || !valor) {
          Helpers.showToast('Preencha item, quantidade e valor para registrar.', 'error');
          return;
        }
        var qtdNum = parseInt(qtd, 10);
        var valorNum = parseFloat(valor);
        var total = (qtdNum * valorNum).toFixed(2);
        var itemNome = document.getElementById('entradaItem').options[document.getElementById('entradaItem').selectedIndex].text;
        var data = document.getElementById('entradaData').value;
        var nf = document.getElementById('entradaNF').value.trim();
        var obs = document.getElementById('entradaObs').value.trim();
        var entry = {
          item: item,
          itemNome: itemNome,
          quantidade: qtdNum,
          valorUnitario: valorNum,
          total: parseFloat(total),
          fornecedor: fornecedor,
          data: data,
          notaFiscal: nf,
          observacoes: obs
        };
        if (typeof Fusion !== 'undefined' && Fusion._modules['estoque']) {
          Fusion.commit('estoque/addEntrada', entry);
          var estoqueState = Fusion._modules['estoque'].state;
          var targetItem = estoqueState.items.find(function(i) { return i.nome === item; });
          if (targetItem) {
            Fusion.commit('estoque/updateQuantidade', { itemId: targetItem.id, quantidade: qtdNum });
          }
        }
        var msg = qtdNum + ' un. de "' + itemNome + '" registrada' + (fornecedor ? ' (' + fornecedor + ')' : '') + '. Total: R$ ' + total;
        Helpers.showToast(msg, 'success');
        close();
      }
    });

    // ---- TABELA PRINCIPAL DE ESTOQUE ----
    var estoqueTbody = document.getElementById('estoqueTbody');

    function getStatusClass(item) {
      if (item.qtd <= 0) return 'crit';
      if (item.qtd < item.minimo) return item.qtd <= item.minimo / 2 ? 'crit' : 'warn';
      return 'ok';
    }

    function getStatusLabel(item) {
      if (item.qtd <= 0) return 'Esgotado';
      if (item.qtd < item.minimo) return item.qtd <= item.minimo / 2 ? 'Cr\u00edtico' : 'Baixo';
      return 'Normal';
    }

    function renderTabelaEstoque() {
      if (!estoqueTbody || typeof Fusion === 'undefined' || !Fusion._modules['estoque']) return;
      var items = Fusion._modules['estoque'].state.items;
      estoqueTbody.innerHTML = '';
      items.forEach(function(item) {
        var tr = document.createElement('tr');
        var statusClass = getStatusClass(item);
        var statusLabel = getStatusLabel(item);
        var qtdUn = item.nome.indexOf('(cx.)') > -1 ? 'cx.' : 'un.';
        tr.innerHTML = '<td class="cell-primary">' + item.nome + '</td>' +
          '<td>' + item.categoria + '</td>' +
          '<td>' + item.qtd + ' ' + qtdUn + '</td>' +
          '<td>' + item.minimo + ' ' + qtdUn + '</td>' +
          '<td><span class="status-chip ' + statusClass + '">' + statusLabel + '</span></td>';
        estoqueTbody.appendChild(tr);
      });
    }
    renderTabelaEstoque();

    // ---- LOG DE ENTRADAS (ESTOQUE) ----
    var entradasTbody = document.getElementById('entradasTbody');
    var entradasSub = document.getElementById('entradasSub');
    var entradasTableWrap = document.getElementById('entradasTableWrap');
    var entradasEmpty = document.getElementById('entradasEmpty');
    var totalEntradasEl = document.getElementById('totalEntradas');

    function renderEntradasLog() {
      if (!entradasTbody || typeof Fusion === 'undefined' || !Fusion._modules['estoque']) return;
      var entries = Fusion._modules['estoque'].state.entries;
      var total = 0;
      entradasTbody.innerHTML = '';
      if (!entries || entries.length === 0) {
        entradasTableWrap.style.display = 'none';
        entradasEmpty.style.display = '';
        entradasSub.textContent = 'Nenhuma entrada registrada ainda';
        totalEntradasEl.textContent = '';
        return;
      }
      var sorted = entries.slice().sort(function(a, b) {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
      sorted.forEach(function(entry) {
        var tr = document.createElement('tr');
        var valorUnitStr = 'R$ ' + (entry.valorUnitario || 0).toFixed(2);
        var totalStr = 'R$ ' + (entry.total || 0).toFixed(2);
        var dataStr = entry.data;
        if (dataStr && dataStr.indexOf('-') > 0) {
          var partes = dataStr.split('-');
          dataStr = partes[2] + '/' + partes[1] + '/' + partes[0];
        }
        tr.innerHTML = '<td class="cell-primary">' + (entry.itemNome || entry.item || '\u2014') + '</td>' +
          '<td>' + entry.quantidade + ' un.</td>' +
          '<td>' + valorUnitStr + '</td>' +
          '<td><strong>' + totalStr + '</strong></td>' +
          '<td>' + (entry.fornecedor || '\u2014') + '</td>' +
          '<td>' + (dataStr || '\u2014') + '</td>' +
          '<td>' + (entry.notaFiscal || '\u2014') + '</td>';
        total += entry.total || 0;
        entradasTbody.appendChild(tr);
      });
      entradasTableWrap.style.display = '';
      entradasEmpty.style.display = 'none';
      var plural = entries.length === 1 ? 'entrada registrada' : 'entradas registradas';
      entradasSub.textContent = entries.length + ' ' + plural;
      totalEntradasEl.textContent = 'Total: R$ ' + total.toFixed(2);
    }
    renderEntradasLog();

    // Subscribe para atualizações
    if (typeof Fusion !== 'undefined' && Fusion._modules['estoque']) {
      Fusion.subscribe('estoque', function() {
        renderEntradasLog();
        renderTabelaEstoque();
        if (refreshEstoque) refreshEstoque();
      });
    }

  };
})();
