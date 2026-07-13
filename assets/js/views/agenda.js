/**
 * Fusion ERP - View: Agenda
 * Modal: Novo Agendamento (+ openModalAgenda global para uso de outros módulos)
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  window.FusionViews.agenda = function() {
    // ---- MODAL NOVO AGENDAMENTO ----
    var agendaModal = Helpers.initModal('modalAgendamento', {
      openBtn: 'btnNovoAgenda',
      closeBtn: 'closeModalAgenda',
      cancelBtn: 'cancelModalAgenda',
      saveBtn: 'saveModalAgenda',
      formId: 'formAgenda',
      onOpen: function() {
        var hoje = new Date();
        var dataStr = hoje.getFullYear() + '-' +
          String(hoje.getMonth() + 1).padStart(2, '0') + '-' +
          String(hoje.getDate()).padStart(2, '0');
        document.getElementById('agendaData').value = dataStr;
        document.getElementById('agendaHora').value = '09:00';
      },
      onSave: function(close) {
        var cliente = document.getElementById('agendaCliente').value;
        var prof = document.getElementById('agendaProf').value;
        var servico = document.getElementById('agendaServico').value;
        var data = document.getElementById('agendaData').value;
        var hora = document.getElementById('agendaHora').value;
        if (!cliente || !prof || !servico || !data || !hora) {
          Helpers.showToast('Preencha todos os campos obrigat\u00f3rios.', 'error');
          return;
        }
        var nomeCliente = document.getElementById('agendaCliente').options[document.getElementById('agendaCliente').selectedIndex].text;
        var duracao = document.getElementById('agendaDuracao').value;
        var obs = document.getElementById('agendaObs').value.trim();
        var appt = {
          cliente: cliente,
          clienteNome: nomeCliente,
          profissional: prof,
          servico: servico,
          data: data,
          hora: hora,
          duracao: parseInt(duracao, 10),
          observacoes: obs,
          status: 'confirmado'
        };
        if (typeof Fusion !== 'undefined' && Fusion._modules['agenda']) {
          Fusion.commit('agenda/addAgendamento', appt);
        }
        Helpers.showToast('Agendamento de "' + servico + '" para ' + nomeCliente + ' criado!', 'success');
        close();
      }
    });

    // Expe openModalAgenda global (usado por prontuario.js)
    window.openModalAgenda = function(prefilled) {
      agendaModal.open();
      if (prefilled) {
        var sel = document.getElementById('agendaCliente');
        if (sel) {
          for (var i = 0; i < sel.options.length; i++) {
            if (sel.options[i].value === prefilled) { sel.value = prefilled; break; }
          }
        }
      }
    };

    // Botão "Novo agendamento" dentro do prontModal
    var btnNovoAgendaPront = document.querySelector('#prontModal .pront-head-actions .btn');
    if (btnNovoAgendaPront) {
      btnNovoAgendaPront.addEventListener('click', function(e) {
        e.preventDefault();
        var nomeCliente = document.getElementById('prontName').textContent.trim();
        window.openModalAgenda(nomeCliente);
      });
    }
  };
})();
