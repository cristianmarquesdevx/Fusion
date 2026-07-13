/**
 * Fusion ERP - View: Clientes
 * Modal: Nova Cliente
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.clientes = function() {
    // ---- FILTRO AVANÇADO DE CLIENTES ----
    Helpers.initFilterPanel('btnFiltrarClientes', {
      viewName: 'clientes',
      container: '[data-view="clientes"] .table-wrap table',
      counterId: 'counterClientes',
      groups: [
        {
          key: 'status',
          label: 'Status',
          items: [
            { label: 'Em dia', value: 'Em dia' },
            { label: 'Pagamento pendente', value: 'Pagamento pendente' },
            { label: 'Fidelidade expirando', value: 'Fidelidade expirando' }
          ]
        }
      ]
    });

    // ---- BUSCA NA TABELA DE CLIENTES ----
    Helpers.initSearch('searchClientes', {
      container: '[data-view="clientes"] .table-wrap table',
      counterId: 'counterClientes'
    });

    // ---- MODAL NOVA CLIENTE ----
    var inputTel = document.getElementById('inputTel');
    var inputCpf = document.getElementById('inputCpf');

    if (inputTel) { inputTel.addEventListener('input', function() { Validators.maskPhone(this); }); }
    if (inputCpf) { inputCpf.addEventListener('input', function() { Validators.maskCPF(this); }); }

    Helpers.initModal('modalCliente', {
      openBtn: 'btnNovaCliente',
      closeBtn: 'closeModalCliente',
      cancelBtn: 'cancelModalCliente',
      saveBtn: 'saveModalCliente',
      formId: 'formCliente',
      onSave: function(close) {
        var nome = document.getElementById('inputNome').value.trim();
        var tel = document.getElementById('inputTel').value.trim();
        if (!nome || !tel) {
          Helpers.showToast('Preencha nome e telefone para cadastrar.', 'error');
          return;
        }
        var cliente = {
          nome: nome,
          tel: tel,
          email: document.getElementById('inputEmail').value.trim(),
          cpf: document.getElementById('inputCpf').value.trim(),
          desde: String(new Date().getFullYear()),
          ultima: '\u2014',
          pacote: 'Sem pacote ativo',
          status: 'Em dia'
        };
        if (typeof Fusion !== 'undefined' && Fusion._modules['clientes']) {
          Fusion.commit('clientes/addCliente', cliente);
        }
        Helpers.showToast('Cliente "' + nome + '" cadastrada com sucesso!', 'success');
        close();
      }
    });

  };
})();
