/**
 * Fusion ERP - Agendamento Público
 * Multi-step booking form with addEventListener instead of inline onclick
 */
(function() {
  'use strict';

  var currentStep = 1;
  var selectedServico = 'Limpeza de pele profunda';
  var selectedHora = '';

  // ---- Set min date to tomorrow ----
  (function() {
    var d = new Date();
    d.setDate(d.getDate() + 1);
    var el = document.getElementById('dataAgendamento');
    if (el) {
      el.value = d.toISOString().slice(0, 10);
      el.setAttribute('min', d.toISOString().slice(0, 10));
    }
  })();

  // ---- Service card selection ----
  document.querySelectorAll('.service-card').forEach(function(card) {
    card.addEventListener('click', function() {
      document.querySelectorAll('.service-card').forEach(function(c) { c.classList.remove('selected'); });
      this.classList.add('selected');
      selectedServico = this.getAttribute('data-servico');
    });
  });

  // ---- Time slot selection ----
  document.querySelectorAll('.time-slot').forEach(function(slot) {
    slot.addEventListener('click', function() {
      if (this.classList.contains('unavailable')) return;
      document.querySelectorAll('.time-slot').forEach(function(s) { s.classList.remove('selected'); });
      this.classList.add('selected');
      selectedHora = this.getAttribute('data-hora');
    });
  });

  // ---- Navigation functions ----
  function nextStep(step) {
    var nome = document.getElementById('nome').value.trim();
    var tel = document.getElementById('tel').value.trim();
    if (currentStep === 1 && (!nome || !tel)) {
      alert('Preencha nome e telefone para continuar.');
      return;
    }
    if (currentStep === 3 && !selectedHora) {
      alert('Selecione um horário disponível antes de continuar.');
      return;
    }
    if (step === 4) {
      var prof = document.getElementById('profissional');
      document.getElementById('resumoNome').textContent = nome;
      document.getElementById('resumoTel').textContent = tel;
      document.getElementById('resumoEmail').textContent = document.getElementById('email').value.trim() || '—';
      document.getElementById('resumoServico').textContent = selectedServico;
      document.getElementById('resumoProf').textContent = prof.options[prof.selectedIndex].text;
      document.getElementById('resumoData').textContent = document.getElementById('dataAgendamento').value;
      document.getElementById('resumoHora').textContent = selectedHora || 'Não selecionado';
    }
    goToStep(step);
  }

  function prevStep(step) { goToStep(step); }

  function goToStep(step) {
    currentStep = step;
    document.querySelectorAll('.step-content').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.step').forEach(function(s) {
      s.classList.remove('active', 'done');
      var n = parseInt(s.getAttribute('data-step'));
      if (n === step) s.classList.add('active');
      else if (n < step) s.classList.add('done');
    });
    var el = document.querySelector('.step-content[data-step="' + step + '"]');
    if (el) el.classList.add('active');
  }

  function confirmarAgendamento() {
    if (!selectedHora) {
      alert('Selecione um horário.');
      goToStep(3);
      return;
    }
    goToStep('success');
  }

  // ---- Wire up buttons with addEventListener ----
  document.addEventListener('DOMContentLoaded', function() {

    var btnStep1Avancar = document.getElementById('btnStep1Avancar');
    if (btnStep1Avancar) {
      btnStep1Avancar.addEventListener('click', function(e) {
        e.preventDefault();
        nextStep(2);
      });
    }

    var btnStep2Voltar = document.getElementById('btnStep2Voltar');
    if (btnStep2Voltar) {
      btnStep2Voltar.addEventListener('click', function(e) {
        e.preventDefault();
        prevStep(1);
      });
    }

    var btnStep2Avancar = document.getElementById('btnStep2Avancar');
    if (btnStep2Avancar) {
      btnStep2Avancar.addEventListener('click', function(e) {
        e.preventDefault();
        nextStep(3);
      });
    }

    var btnStep3Voltar = document.getElementById('btnStep3Voltar');
    if (btnStep3Voltar) {
      btnStep3Voltar.addEventListener('click', function(e) {
        e.preventDefault();
        prevStep(2);
      });
    }

    var btnStep3Avancar = document.getElementById('btnStep3Avancar');
    if (btnStep3Avancar) {
      btnStep3Avancar.addEventListener('click', function(e) {
        e.preventDefault();
        nextStep(4);
      });
    }

    var btnStep4Voltar = document.getElementById('btnStep4Voltar');
    if (btnStep4Voltar) {
      btnStep4Voltar.addEventListener('click', function(e) {
        e.preventDefault();
        prevStep(3);
      });
    }

    var btnConfirmarAgendamento = document.getElementById('btnConfirmarAgendamento');
    if (btnConfirmarAgendamento) {
      btnConfirmarAgendamento.addEventListener('click', function(e) {
        e.preventDefault();
        confirmarAgendamento();
      });
    }

    var btnNovoAgendamento = document.getElementById('btnNovoAgendamento');
    if (btnNovoAgendamento) {
      btnNovoAgendamento.addEventListener('click', function(e) {
        e.preventDefault();
        location.reload();
      });
    }

    // ---- Filtro por texto no select de profissional ----
    if (typeof Helpers !== 'undefined' && Helpers.initSearch) {
      Helpers.initSearch('searchProfissional', {
        filterMode: 'dropdown',
        selectEl: 'profissional',
        onSelect: function(value) {
          // Auto-selecionou um profissional — não precisa fazer nada extra
        },
        onEmpty: function() {
          // Busca limpa — volta para o placeholder
          var sel = document.getElementById('profissional');
          if (sel) sel.value = '';
        }
      });
    }

  });

})();
