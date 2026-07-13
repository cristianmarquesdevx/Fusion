/**
 * Fusion ERP - View: Lista de Espera
 * Renderiza tabela e contadores dinamicamente a partir da store
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.listaEspera = function() {
    var tbody = document.querySelector('[data-view="lista-espera"] .table-wrap tbody');
    var headSub = document.querySelector('[data-view="lista-espera"] .panel-head .sub');

    if (!tbody) return;

    // ---- Helpers ----
    function getTimeClass(dias) {
      if (dias >= 3) return 'crit';
      if (dias >= 2) return 'warn';
      return 'ok';
    }

    function getTimeLabel(dias) {
      if (dias <= 0) return 'Hoje';
      if (dias === 1) return '1 dia';
      return dias + ' dias';
    }

    function getPreferencia(entrada) {
      return entrada.preferencia || 'Qualquer hor\u00e1rio';
    }

    // ---- Renderiza a tabela ----
    function renderListaEspera() {
      if (typeof Fusion === 'undefined' || !Fusion._modules['listaEspera']) return;
      var list = Fusion._modules['listaEspera'].state.list || [];

      tbody.innerHTML = '';
      list.forEach(function(entry) {
        // Calcula tempo em dias desde que entrou na lista
        var dias = 0;
        if (entry.desde) {
          var parts = entry.desde.split('/');
          if (parts.length === 3) {
            var data = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
            dias = Math.floor((Date.now() - data.getTime()) / 86400000);
          } else if (entry.desde === 'Hoje') {
            dias = 0;
          }
        }

        var iniciais = entry.nome ? entry.nome.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase() : '';
        var tel = entry.tel || '';

        var tr = document.createElement('tr');
        tr.innerHTML =
          '<td><div class="cell-primary">' + entry.nome + '</div><div class="cell-sub">' +
            iniciais + (tel ? ' \u00b7 ' + tel : '') + '</div></td>' +
          '<td>' + (entry.servico || '\u2014') + '</td>' +
          '<td>' + getPreferencia(entry) + '</td>' +
          '<td>' + (entry.desde || '\u2014') + '</td>' +
          '<td><span class="status-chip ' + getTimeClass(dias) + '">' + getTimeLabel(dias) + '</span></td>' +
          '<td><button class="pill-btn encaixar-btn" data-id="' + (entry.id || '') + '">Encaixar</button></td>';

        tbody.appendChild(tr);
      });

      // Atualiza cabeçalho
      if (headSub) {
        headSub.textContent = list.length + ' clientes na fila de espera';
      }

      updateCounter();
    }

    // ---- Atualiza contador ----
    function updateCounter() {
      var counter = document.getElementById('counterListaEspera');
      if (!counter) return;
      var rows = tbody.querySelectorAll('tr');
      counter.innerHTML = '<b>' + rows.length + '</b> de ' +
        ((typeof Fusion !== 'undefined' && Fusion._modules['listaEspera'])
          ? Fusion._modules['listaEspera'].state.list.length : rows.length);
    }

    // ---- Filtros por período ----
    var periodBtns = document.querySelectorAll('[data-view="lista-espera"] .report-period-btn');
    periodBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        periodBtns.forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var label = btn.textContent.trim();
        var list = (typeof Fusion !== 'undefined' && Fusion._modules['listaEspera'])
          ? Fusion._modules['listaEspera'].state.list : [];

        var filtered = list;
        if (label === 'Manh\u00e3') {
          filtered = list.filter(function(e) {
            var pref = (e.preferencia || '').toLowerCase();
            return pref.indexOf('manh') >= 0;
          });
        } else if (label === 'Tarde') {
          filtered = list.filter(function(e) {
            var pref = (e.preferencia || '').toLowerCase();
            return pref.indexOf('tarde') >= 0;
          });
        }

        // Re-renderiza
        tbody.innerHTML = '';
        filtered.forEach(function(entry) {
          var dias = 0;
          if (entry.desde) {
            var parts = entry.desde.split('/');
            if (parts.length === 3) {
              var data = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
              dias = Math.floor((Date.now() - data.getTime()) / 86400000);
            } else if (entry.desde === 'Hoje') {
              dias = 0;
            }
          }
          var iniciais = entry.nome ? entry.nome.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase() : '';
          var tel = entry.tel || '';
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td><div class="cell-primary">' + entry.nome + '</div><div class="cell-sub">' + iniciais + (tel ? ' \u00b7 ' + tel : '') + '</div></td>' +
            '<td>' + (entry.servico || '\u2014') + '</td>' +
            '<td>' + getPreferencia(entry) + '</td>' +
            '<td>' + (entry.desde || '\u2014') + '</td>' +
            '<td><span class="status-chip ' + getTimeClass(dias) + '">' + getTimeLabel(dias) + '</span></td>' +
            '<td><button class="pill-btn encaixar-btn">Encaixar</button></td>';
          tbody.appendChild(tr);
        });
        if (headSub) {
          headSub.textContent = filtered.length + ' clientes na fila de espera';
        }
        updateCounter();
      });
    });

    // ---- Ação nos botões Encaixar ----
    document.addEventListener('click', function(e) {
      var btn = e.target.closest('.encaixar-btn');
      if (btn && document.querySelector('[data-view="lista-espera"]')?.classList.contains('active')) {
        e.preventDefault();
        var nome = btn.closest('tr')?.querySelector('.cell-primary')?.textContent || 'Cliente';
        if (typeof Fusion !== 'undefined' && Fusion._modules['listaEspera']) {
          var id = btn.getAttribute('data-id');
          if (id) {
            Fusion.commit('listaEspera/removeFromWaitlist', id);
          }
        }
        Helpers.showToast('Encaixe para ' + nome + ' realizado!', 'success');
        var row = btn.closest('tr');
        if (row) row.remove();
        updateCounter();
      }
    });

    // ---- Subscribe para mudanças na store ----
    if (typeof Fusion !== 'undefined' && Fusion._modules['listaEspera']) {
      Fusion.subscribe('listaEspera', function() {
        renderListaEspera();
      });
    }

    // ---- BUSCA NA TABELA ----
    Helpers.initSearch('searchListaEspera', {
      container: '[data-view="lista-espera"] .table-wrap table',
      counterId: 'counterListaEspera'
    });

    // ---- MODAL ADICIONAR À LISTA ----
    Helpers.initModal('modalListaEspera', {
      openBtn: 'btnAdicionarLista',
      closeBtn: 'closeModalListaEspera',
      saveBtn: document.querySelector('#modalListaEspera .modal-footer .btn:last-child'),
      formId: 'formListaEspera',
      onSave: function(close) {
        var cliente = document.getElementById('esperaCliente').value;
        var servico = document.getElementById('esperaServico').value;
        if (!cliente || !servico) {
          Helpers.showToast('Selecione cliente e servi\u00e7o desejado.', 'error');
          return;
        }
        var nomeCliente = document.getElementById('esperaCliente').options[
          document.getElementById('esperaCliente').selectedIndex
        ].text;
        if (typeof Fusion !== 'undefined' && Fusion._modules['listaEspera']) {
          Fusion.commit('listaEspera/addToWaitlist', {
            nome: nomeCliente,
            servico: servico,
            preferencia: document.getElementById('esperaPreferencia')?.value || 'Qualquer',
            desde: 'Hoje',
            tel: '',
            id: Helpers.generateId()
          });
        }
        Helpers.showToast(nomeCliente + ' adicionado \u00e0 lista de espera!', 'success');
        close();
      }
    });

    // ---- Render inicial ----
    renderListaEspera();
  };
})();
