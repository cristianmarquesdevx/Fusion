/**
 * Fusion ERP - Agendamento Público
 * Multi-step booking form with addEventListener instead of inline onclick
 * v2.1 — Adicionada etapa de Pré-Anamnese (saúde)
 */
(function() {
  'use strict';

  var currentStep = 1;
  var selectedServico = 'Limpeza de pele profunda';
  var selectedHora = '';
  var selectedPreco = 180; // valor do serviço selecionado (para pagamento)
  var paymentState = {
    id: null,
    externalId: null,
    pixQrCode: '',
    pixQrCodeImage: '',
    status: 'idle', // idle | loading | waiting | paid | error
    pollingInterval: null,
  };

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
      // Extrai o valor do preço para pagamento
      var precoStr = this.getAttribute('data-preco');
      if (precoStr) {
        selectedPreco = parseFloat(precoStr.replace('R$ ', '').replace(',', '.')) || 180;
      }
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

  // ---- Helper: get selected checkboxes values ----
  function getCheckedValues(containerId) {
    var values = [];
    var container = document.getElementById(containerId);
    if (!container) return values;
    container.querySelectorAll('input[type="checkbox"]:checked').forEach(function(cb) {
      if (cb.value && cb.value !== 'Outro') values.push(cb.value);
    });
    return values;
  }

  // ---- Helper: get selected radio value ----
  function getRadioValue(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : '';
  }

  // ---- Toggle "other" input visibility ----
  function toggleOtherInput(checkboxId, inputId) {
    var cb = document.querySelector('#' + checkboxId + ' input[value="Outro"]');
    var input = document.getElementById(inputId);
    if (!cb || !input) return;
    cb.addEventListener('change', function() {
      input.style.display = this.checked ? 'block' : 'none';
      if (!this.checked) input.value = '';
    });
  }

  // ---- Toggle text input on radio selection ----
  function toggleOnRadio(radioName, inputId, showValue) {
    document.querySelectorAll('input[name="' + radioName + '"]').forEach(function(r) {
      r.addEventListener('change', function() {
        var input = document.getElementById(inputId);
        if (input) {
          input.style.display = this.value === showValue ? 'block' : 'none';
          if (this.value !== showValue) input.value = '';
        }
      });
    });
  }

  // ---- Coleta dados da pré-anamnese ----
  function collectAnamneseData() {
    var condicoes = getCheckedValues('anamneseCondicoes');
    var outraCondicao = document.getElementById('anamneseOutraCondicao');
    if (outraCondicao && outraCondicao.style.display !== 'none' && outraCondicao.value.trim()) {
      condicoes.push(outraCondicao.value.trim());
    }

    var alergias = getCheckedValues('anamneseAlergias');
    var outraAlergia = document.getElementById('anamneseOutraAlergia');
    if (outraAlergia && outraAlergia.style.display !== 'none' && outraAlergia.value.trim()) {
      alergias.push(outraAlergia.value.trim());
    }

    var medicamentos = getRadioValue('medicamentos');
    var quaisMedicamentos = document.getElementById('anamneseQuaisMedicamentos');
    var medicamentosDetalhe = (medicamentos === 'sim' && quaisMedicamentos) ? quaisMedicamentos.value.trim() : '';

    var procAnteriores = getRadioValue('proc-anteriores');
    var quaisProcedimentos = document.getElementById('anamneseQuaisProcedimentos');
    var procDetalhe = (procAnteriores === 'sim' && quaisProcedimentos) ? quaisProcedimentos.value.trim() : '';

    var contraindicacoes = getCheckedValues('anamneseContraindicacoes');
    var observacoes = document.getElementById('anamneseObservacoes');
    var obsTexto = observacoes ? observacoes.value.trim() : '';

    return {
      condicoes: condicoes,
      alergias: alergias,
      medicamentos: medicamentos === 'sim',
      medicamentosDetalhe: medicamentosDetalhe,
      procedimentosAnteriores: procAnteriores === 'sim',
      procedimentosDetalhe: procDetalhe,
      contraindicacoes: contraindicacoes,
      observacoes: obsTexto
    };
  }

  // ---- Render payment screen (Step 6) ----
    // ---- Render payment screen (Step 6) - PIX Dinâmico ----
  function renderPaymentScreen(checkoutData) {
    var container = document.getElementById('paymentStatus');
    if (!container) return;

    // Pega brCode e a imagem base64 da API
    var pixCode = checkoutData.brCode || checkoutData.pixQrCode || '';
    var qrImage = checkoutData.brCodeBase64 || checkoutData.pixQrCodeImage || '';
    var expiresAt = checkoutData.expiresAt || null;
    paymentState.pixQrCode = pixCode;

    // Se API nÃ£o retornou imagem, gera fallback
    if (!qrImage && pixCode) {
      qrImage = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(pixCode);
    }

    container.innerHTML = '' +
      '<div class="step-content active payment-card" data-step="6">' +
        '<div class="pix-header">' +
          '<span class="pix-badge">PIX DinÃ¢mico</span>' +
          '<h3>Pague com PIX</h3>' +
          '<p>Escaneie o QR Code abaixo com o app do seu banco</p>' +
        '</div>' +
        '<div class="pix-value">' + formatCurrency(selectedPreco) + '</div>' +
        '<div class="qr-wrapper" id="qrCodeContainer">' +
          (qrImage
            ? '<img src="' + qrImage + '" alt="QR Code PIX" id="qrCodeImg">'
            : '<div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;background:#f5f5f5;border-radius:8px;font-size:13px;color:#999;">Gerando QR Code...</div>'
          ) +
        '</div>' +
        '<div class="pix-code" id="pixCodeText" onclick="if(window.copyPixCode)window.copyPixCode()">' +
          (pixCode || '---') +
        '</div>' +
        '<div style="font-size:11px;color:var(--ink-faint);margin-top:-8px;">Clique para copiar o cÃ³digo PIX</div>' +
        '<div class="pix-expiry" id="pixExpiryTimer">' +
          '<span class="timer-icon">⏱</span> ' +
          '<span id="pixTimerDisplay">Calculando...</span>' +
        '</div>' +
        '<div class="status-waiting" id="paymentStatusWaiting">' +
          '<div class="spinner"></div>' +
          '<span>Aguardando pagamento...</span>' +
        '</div>' +
        '<div class="status-paid" id="paymentStatusPaid">' +
          '<div class="check-icon">✓</div>' +
          '<span>Pagamento confirmado!</span>' +
        '</div>' +
        '<div class="payment-success" id="paymentSuccessActions">' +
          '<button class="btn btn-primary" id="btnAposPagamento">Ver agendamento</button>' +
        '</div>' +
        '<button class="btn-skip" id="btnSkipPayment">Pular pagamento (teste)</button>' +
      '</div>';

    // Wire up buttons
    document.getElementById('btnSkipPayment')?.addEventListener('click', function(e) { e.preventDefault(); goToSuccess(); });
    document.getElementById('btnAposPagamento')?.addEventListener('click', function(e) { e.preventDefault(); goToSuccess(); });

    // Inicia timer de expiraÃ§Ã£o se tiver expiresAt
    if (expiresAt) {
      startExpiryTimer(expiresAt);
    } else {
      var el = document.getElementById('pixTimerDisplay');
      if (el) el.textContent = 'Aguardando pagamento...';
    }
  }

  // ---- PIX Expiry Countdown Timer ----
  var expiryTimerInterval = null;

  function startExpiryTimer(expiresAt) {
    if (expiryTimerInterval) clearInterval(expiryTimerInterval);

    function updateTimer() {
      var el = document.getElementById('pixTimerDisplay');
      if (!el) return;

      var now = new Date();
      var expiry = new Date(expiresAt);
      var diff = expiry - now;

      if (diff <= 0) {
        el.textContent = 'PIX expirado';
        el.style.color = '#B14E3D';
        if (expiryTimerInterval) clearInterval(expiryTimerInterval);
        // Mostra botÃ£o para gerar novo PIX
        var pixExpiryEl = document.getElementById('pixExpiryTimer');
        if (pixExpiryEl && !document.getElementById('btnNewPix')) {          var newPixBtn = document.createElement('button');
          newPixBtn.id = 'btnNewPix';
          newPixBtn.className = 'btn btn-primary';
          newPixBtn.textContent = 'Gerar novo PIX';
          newPixBtn.style.cssText = 'margin-top:12px;font-size:13px;';
          newPixBtn.addEventListener('click', function(e) {
            e.preventDefault();
            stopExpiryTimer();
            document.getElementById('paymentStatus').innerHTML = '<div style="text-align:center;padding:40px;"><div class="spinner" style="margin:0 auto 12px;"></div><p style="font-size:14px;color:var(--ink-soft);">Gerando novo PIX...</p></div>';
            createPayment(function(err, newCheckout) {
              if (err) {
                alert('Erro ao gerar novo PIX. Tente novamente.');
                goToSuccess();
                return;
              }
              renderPaymentScreen(newCheckout);
              setTimeout(function() { startPolling(); }, 1000);
            });
          });
          pixExpiryEl.appendChild(newPixBtn);
        }
        return;
      }

      var minutes = Math.floor(diff / 60000);
      var seconds = Math.floor((diff % 60000) / 1000);
      el.textContent = 'Expira em ' + minutes + 'min ' + seconds + 's';
    }

    updateTimer();
    expiryTimerInterval = setInterval(updateTimer, 1000);
  }

  function stopExpiryTimer() {
    if (expiryTimerInterval) {
      clearInterval(expiryTimerInterval);
      expiryTimerInterval = null;
    }
  }
  // ---- Format currency ----
  function formatCurrency(value) {
    return 'R$ ' + value.toFixed(2).replace('.', ',');
  }

  // ---- Copy PIX code to clipboard ----
  window.copyPixCode = function() {
    var el = document.getElementById('pixCodeText');
    if (!el || !el.textContent || el.textContent === '---') return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(el.textContent).then(function() {
        el.classList.add('copied');
        el.textContent = '✓ Código copiado!';
        setTimeout(function() {
          el.classList.remove('copied');
          el.textContent = paymentState.pixQrCode;
        }, 2500);
      }).catch(function() { /* fallback */ });
    }
  };

  // ---- Create payment via AbacatePay API ----
  function createPayment(callback) {
    if (paymentState.status === 'loading' || paymentState.id) return;
    paymentState.status = 'loading';

    var nome = document.getElementById('nome').value.trim();
    var tel = document.getElementById('tel').value.trim();
    var email = document.getElementById('email').value.trim();

    // Determina a URL base da API
    var apiBase = window.location.origin;

    fetch(apiBase + '/api/abacatepay/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: nome,
          email: email || null,
          cellphone: tel || null,
        },
        value: selectedPreco,
        description: 'Agendamento: ' + selectedServico,
        bookingId: 'bk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (result.success && result.data) {
        paymentState.id = result.data.id;
        paymentState.externalId = result.data.externalId || result.data.id;
        paymentState.pixQrCode = result.data.brCode || result.data.pixQrCode || '';
        paymentState.pixQrCodeImage = result.data.brCodeBase64 || result.data.pixQrCodeImage || '';
        paymentState.pixQrCodeImage = result.data.pixQrCodeImage || '';
        paymentState.status = 'waiting';
        if (callback) callback(null, result.data);
      } else {
        paymentState.status = 'error';
        if (callback) callback(result.error || 'Erro ao criar pagamento');
      }
    })
    .catch(function(err) {
      paymentState.status = 'error';
      console.error('[Pagamento] Erro na criação:', err);
      if (callback) callback('Erro de conexão ao criar pagamento');
    });
  }

  // ---- Poll payment status ----
  function startPolling() {
    if (!paymentState.id) return;

    if (paymentState.pollingInterval) {
      clearInterval(paymentState.pollingInterval);
    }

    paymentState.pollingInterval = setInterval(function() {
      var apiBase = window.location.origin;

      fetch(apiBase + '/api/abacatepay/verify-payment?id=' + encodeURIComponent(paymentState.externalId || paymentState.id))
        .then(function(r) { return r.json(); })
        .then(function(result) {
          if (result.success && result.data) {
            var status = result.data.status;
            if (status === 'completed' || status === 'paid') {
              paymentState.status = 'paid';
              showPaymentSuccess();
              stopPolling();
            }
          }
        })
        .catch(function(err) {
          console.error('[Pagamento] Erro na verificação:', err);
        });
    }, 5000); // Poll a cada 5 segundos
  }

  // ---- Stop polling ----
  function stopPolling() {
    if (paymentState.pollingInterval) {
      clearInterval(paymentState.pollingInterval);
      paymentState.pollingInterval = null;
    }
  }

  // ---- Show payment success UI ----
  function showPaymentSuccess() {
    stopExpiryTimer();
    var waitingEl = document.getElementById('paymentStatusWaiting');
    var paidEl = document.getElementById('paymentStatusPaid');
    var successActions = document.getElementById('paymentSuccessActions');
    var skipBtn = document.getElementById('btnSkipPayment');

    if (waitingEl) waitingEl.style.display = 'none';
    if (paidEl) paidEl.style.display = 'flex';
    if (successActions) successActions.classList.add('show');
    if (skipBtn) skipBtn.style.display = 'none';
  }

  // ---- Go to success screen ----
  

  // ---- Cleanup polling on page unload ----
  window.addEventListener('beforeunload', function() {
    stopPolling();
  });
function goToSuccess() {
    stopPolling();
    stopExpiryTimer();

    var msg = document.getElementById('successMessage');
    if (msg && paymentState.status === 'paid') {
      msg.textContent = 'Pagamento confirmado! Enviamos um lembrete para o telefone informado.';
    }

    goToStep('success');
  }

  // ---- Render anamnese data in confirmation ----
  function renderAnamneseResumo(data) {
    var el = document.getElementById('resumoAnamnese');
    if (!el) return;

    var parts = [];
    if (data.condicoes.length > 0) {
      parts.push('<strong>Condições de saúde:</strong> ' + data.condicoes.join(', '));
    }
    if (data.alergias.length > 0) {
      parts.push('<strong>Alergias:</strong> ' + data.alergias.join(', '));
    }
    if (data.medicamentos) {
      parts.push('<strong>Medicamentos:</strong> ' + (data.medicamentosDetalhe || 'Sim (não especificou)'));
    }
    if (data.procedimentosAnteriores) {
      parts.push('<strong>Procedimentos anteriores:</strong> ' + (data.procedimentosDetalhe || 'Sim (não especificou)'));
    }
    if (data.contraindicacoes.length > 0) {
      parts.push('<strong>Contraindicações:</strong> ' + data.contraindicacoes.join(', '));
    }
    if (data.observacoes) {
      parts.push('<strong>Observações:</strong> ' + data.observacoes);
    }

    el.innerHTML = parts.length > 0
      ? parts.map(function(p) { return '<div style="padding:3px 0;">' + p + '</div>'; }).join('')
      : '<span style="color:var(--ink-faint);">Nenhuma informação de saúde informada.</span>';
  }

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
    if (step === 5) {
      // Step 5: Confirmação — preencher resumo
      var prof = document.getElementById('profissional');
      document.getElementById('resumoNome').textContent = nome;
      document.getElementById('resumoTel').textContent = tel;
      document.getElementById('resumoEmail').textContent = document.getElementById('email').value.trim() || '—';
      document.getElementById('resumoServico').textContent = selectedServico;
      document.getElementById('resumoProf').textContent = prof.options[prof.selectedIndex].text;
      document.getElementById('resumoData').textContent = document.getElementById('dataAgendamento').value;
      document.getElementById('resumoHora').textContent = selectedHora || 'Não selecionado';
      // Renderizar anamnese no resumo
      renderAnamneseResumo(collectAnamneseData());
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

    // Scroll to top of card on step change
    var card = document.querySelector('.booking-card');
    if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

    function salvarAgendamentoNoBanco(agendamento, callback) {
    var apiBase = window.location.origin;

    fetch(apiBase + '/api/agendamento/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: agendamento.nome,
        tel: agendamento.tel,
        email: agendamento.email,
        servico: agendamento.servico,
        profissional: agendamento.profissional,
        data: agendamento.data,
        hora: agendamento.hora,
        valor: agendamento.valor,
        anamnese: agendamento.anamnese,
      }),
    })
    .then(function(r) { return r.json(); })
    .then(function(result) {
      if (result.success) {
        console.log('[Agendamento] Salvo no banco com sucesso! ID:', result.data?.id);
        agendamento.id = result.data?.id;
        if (callback) callback(null, result.data);
      } else {
        console.warn('[Agendamento] Erro ao salvar no banco:', result.error);
        if (callback) callback(result.error || 'Erro ao salvar agendamento');
      }
    })
    .catch(function(err) {
      console.warn('[Agendamento] Erro de conexão ao salvar:', err);
      // Continua mesmo sem conseguir salvar no banco (fallback)
      if (callback) callback(null, null);
    });
  }

    function confirmarAgendamento() {
    if (!selectedHora) {
      alert('Selecione um horário.');
      goToStep(3);
      return;
    }

    // Se já está pago, vai direto pro success
    if (paymentState.status === 'paid') {
      goToSuccess();
      return;
    }

    // Coletar dados completos do agendamento + anamnese
    var agendamento = {
      nome: document.getElementById('nome').value.trim(),
      tel: document.getElementById('tel').value.trim(),
      email: document.getElementById('email').value.trim(),
      servico: selectedServico,
      profissional: document.getElementById('profissional').value,
      data: document.getElementById('dataAgendamento').value,
      hora: selectedHora,
      valor: selectedPreco,
      anamnese: collectAnamneseData(),
      timestamp: new Date().toISOString()
    };
    console.log('[Agendamento] Dados completos:', agendamento);

    try {
      sessionStorage.setItem('fusion_ultimo_agendamento', JSON.stringify(agendamento));
    } catch(e) { /* ignore */ }

    // Primeiro salva o agendamento no banco de dados
    salvarAgendamentoNoBanco(agendamento, function(saveErr, saveResult) {
      if (saveErr) {
        console.warn('[Agendamento] Não foi possível salvar no banco, mas o fluxo continua');
      }

      // Cria pagamento e vai para step 6
      createPayment(function(err, checkoutData) {
        if (err) {
          // Se API não estiver disponível, pula pagamento
          var msg = 'Sistema de pagamento temporariamente indisponível. ';
          if (!saveErr) {
            msg += 'Seu agendamento foi registrado com sucesso!';
          } else {
            msg += 'Seus dados foram salvos localmente e serão registrados em breve.';
          }
          alert(msg);
          goToSuccess();
          return;
        }

        // Renderiza tela de pagamento
        renderPaymentScreen(checkoutData);
        goToStep(6);

        // Inicia polling
        setTimeout(function() {
          startPolling();
        }, 1000);
      });
    });
  }


  // ---- Wire up buttons with addEventListener ----
  document.addEventListener('DOMContentLoaded', function() {

    // Step 1 → 2
    var btnStep1Avancar = document.getElementById('btnStep1Avancar');
    if (btnStep1Avancar) {
      btnStep1Avancar.addEventListener('click', function(e) {
        e.preventDefault();
        nextStep(2);
      });
    }

    // Step 2 ← 1
    var btnStep2Voltar = document.getElementById('btnStep2Voltar');
    if (btnStep2Voltar) {
      btnStep2Voltar.addEventListener('click', function(e) {
        e.preventDefault();
        prevStep(1);
      });
    }

    // Step 2 → 3
    var btnStep2Avancar = document.getElementById('btnStep2Avancar');
    if (btnStep2Avancar) {
      btnStep2Avancar.addEventListener('click', function(e) {
        e.preventDefault();
        nextStep(3);
      });
    }

    // Step 3 ← 2
    var btnStep3Voltar = document.getElementById('btnStep3Voltar');
    if (btnStep3Voltar) {
      btnStep3Voltar.addEventListener('click', function(e) {
        e.preventDefault();
        prevStep(2);
      });
    }

    // Step 3 → 4 (Anamnese)
    var btnStep3Avancar = document.getElementById('btnStep3Avancar');
    if (btnStep3Avancar) {
      btnStep3Avancar.addEventListener('click', function(e) {
        e.preventDefault();
        nextStep(4);
      });
    }

    // Step 4 ← 3
    var btnStep4Voltar = document.getElementById('btnStep4Voltar');
    if (btnStep4Voltar) {
      btnStep4Voltar.addEventListener('click', function(e) {
        e.preventDefault();
        prevStep(3);
      });
    }

    // Step 4 → 5 (Confirmação)
    var btnStep4Avancar = document.getElementById('btnStep4Avancar');
    if (btnStep4Avancar) {
      btnStep4Avancar.addEventListener('click', function(e) {
        e.preventDefault();
        nextStep(5);
      });
    }

    // Step 5 ← 4
    var btnStep5Voltar = document.getElementById('btnStep5Voltar');
    if (btnStep5Voltar) {
      btnStep5Voltar.addEventListener('click', function(e) {
        e.preventDefault();
        prevStep(4);
      });
    }

    // Confirmar agendamento
    var btnConfirmarAgendamento = document.getElementById('btnConfirmarAgendamento');
    if (btnConfirmarAgendamento) {
      btnConfirmarAgendamento.addEventListener('click', function(e) {
        e.preventDefault();
        confirmarAgendamento();
      });
    }

    // Novo agendamento
    var btnNovoAgendamento = document.getElementById('btnNovoAgendamento');
    if (btnNovoAgendamento) {
      btnNovoAgendamento.addEventListener('click', function(e) {
        e.preventDefault();
        location.reload();
      });
    }

    // ---- Toggle inputs ----
    toggleOtherInput('anamneseCondicoes', 'anamneseOutraCondicao');
    toggleOtherInput('anamneseAlergias', 'anamneseOutraAlergia');
    toggleOnRadio('medicamentos', 'anamneseQuaisMedicamentos', 'sim');
    toggleOnRadio('proc-anteriores', 'anamneseQuaisProcedimentos', 'sim');

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
