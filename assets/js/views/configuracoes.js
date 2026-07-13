/**
 * Fusion ERP - View: Configurações
 * Modals: Nova Unidade (Multiunidade) + Novo Membro (Equipe)
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.configuracoes = function() {
    // ---- BUSCA NA TABELA DE EQUIPE ----
    Helpers.initSearch('searchEquipe', {
      container: '[data-settings-panel="equipe"] .table-wrap table',
      counterId: 'counterEquipe'
    });

    // ---- MODAL NOVA UNIDADE (MULTIUNIDADE) ----
    Helpers.initModal('modalNovaUnidade', {
      openBtn: 'btnNovaUnidade',
      closeBtn: 'closeModalUnidade',
      saveBtn: 'saveModalUnidade',
      formId: 'formUnidade',
      onSave: function(close) {
        var nome = document.getElementById('unidadeNome').value.trim();
        if (!nome) {
          Helpers.showToast('Informe o nome da unidade.', 'error');
          return;
        }
        Helpers.showToast('Unidade "' + nome + '" criada com sucesso!', 'success');
        close();
      }
    });

    // ---- MODAL NOVO MEMBRO (EQUIPE) ----
    Helpers.initModal('modalNovoMembro', {
      openBtn: 'btnNovoMembro',
      closeBtn: 'closeModalMembro',
      saveBtn: 'saveModalMembro',
      formId: 'formMembro',
      onSave: function(close) {
        var nome = document.getElementById('membroNome').value.trim();
        var cargo = document.getElementById('membroCargo').value;
        if (!nome || !cargo) {
          Helpers.showToast('Preencha nome e cargo do membro.', 'error');
          return;
        }
        Helpers.showToast('Membro "' + nome + '" adicionado \u00e0 equipe!', 'success');
        close();
      }
    });


    // ---- BOTÃO COPIAR LINK (AGENDAMENTO PÚBLICO) ----
    var btnCopiarLink = document.getElementById('btnCopiarLink');
    if (btnCopiarLink) {
      btnCopiarLink.addEventListener('click', function(e) {
        e.preventDefault();
        var link = window.location.origin + '/' + 'agendar.html';
        Helpers.copyToClipboard(link);
        Helpers.showToast('Link de agendamento copiado para a área de transferência!', 'success');
      });
    }
  };
})();
