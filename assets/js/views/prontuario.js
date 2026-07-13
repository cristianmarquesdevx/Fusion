/**
 * Fusion ERP - View: Prontuário (Modal + View dedicada)
 * Dados compartilhados, modal de prontuário na view Clientes,
 * e view completa de Prontuário Eletrônico.
 */
(function() {
  if (typeof window.FusionViews === 'undefined') window.FusionViews = {};

  // =====================================================================
  // DADOS COMPARTILHADOS DO PRONTUÁRIO (usado pelo modal e pela view)
  // =====================================================================
  window.prontData = {
    'Marina Costa': {
      initials: 'MC', name: 'Marina Costa', since: 'Cliente desde 2022',
      meta: 'Cliente desde 2022 \u00b7 CPF: 123.456.789-00 \u00b7 34 anos',
      cpf: '123.456.789-00', nasc: '15/03/1990 (34 anos)', tel: '(11) 98221-4410',
      email: 'marina.costa@email.com', end: 'Rua Oscar Freire, 500 \u2014 Jardins, SP',
      desde: 'Mar\u00e7o de 2022', fid: 'N\u00edvel Ouro \u00b7 320 pts',
      pacotes: [
        { nome: 'Limpeza facial', utilizado: 4, total: 10, valido: '12/2026' },
        { nome: 'Peeling de diamante', utilizado: 2, total: 6, valido: '10/2026' }
      ],
      fidBars: { bronze: 100, prata: 100, ouro: 40, platina: 0 },
      notes: 'Cliente prefere hor\u00e1rios pela manh\u00e3. Alergia a \u00e1cido salic\u00edlico (anotado no prontu\u00e1rio f\u00edsico). J\u00e1 fez procedimentos com Dra. Camila e com Fernanda. Indicou 2 amigas que se tornaram clientes.',
      historico: [
        ['30/06', 'Limpeza de pele profunda', 'Fernanda', 'R$ 180,00', 'Conclu\u00eddo'],
        ['15/06', 'Hidrata\u00e7\u00e3o facial', 'Fernanda', 'R$ 120,00', 'Conclu\u00eddo'],
        ['02/06', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Conclu\u00eddo'],
        ['20/05', 'Peeling de diamante', 'Dra. Camila', 'R$ 250,00', 'Conclu\u00eddo'],
        ['10/05', 'Consulta avalia\u00e7\u00e3o', 'Dra. Camila', 'R$ 0,00', 'Conclu\u00eddo']
      ]
    },
    'Renata Alves': {
      initials: 'RA', name: 'Renata Alves', since: 'Cliente desde 2021',
      meta: 'Cliente desde 2021 \u00b7 CPF: 987.654.321-00 \u00b7 28 anos',
      cpf: '987.654.321-00', nasc: '22/11/1996 (28 anos)', tel: '(11) 99110-2287',
      email: 'renata.alves@email.com', end: 'Alameda Santos, 800 \u2014 Cerqueira C\u00e9sar, SP',
      desde: 'Agosto de 2021', fid: 'N\u00edvel Prata \u00b7 180 pts',
      pacotes: [
        { nome: 'Plano recorrente Premium', utilizado: 6, total: 12, valido: 'Recorrente' }
      ],
      fidBars: { bronze: 100, prata: 30, ouro: 0, platina: 0 },
      notes: 'Cliente tem plano recorrente Premium. Prefere atendimento \u00e0 tarde. J\u00e1 fez peeling com Dra. Camila e gostou muito.',
      historico: [
        ['30/06', 'Peeling de diamante', 'Dra. Camila', 'R$ 250,00', 'Conclu\u00eddo'],
        ['27/06', 'Plano recorrente (mensal)', '\u2014', 'R$ 349,00', 'Pago'],
        ['15/06', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Conclu\u00eddo'],
        ['01/06', 'Avalia\u00e7\u00e3o mensal', 'Dra. Camila', 'R$ 0,00', 'Conclu\u00eddo']
      ]
    },
    'Juliana Prado': {
      initials: 'JP', name: 'Juliana Prado', since: 'Cliente desde 2023',
      meta: 'Cliente desde 2023 \u00b7 CPF: 456.789.123-00 \u00b7 41 anos',
      cpf: '456.789.123-00', nasc: '03/07/1983 (41 anos)', tel: '(11) 98833-7765',
      email: 'juliana.prado@email.com', end: 'Rua Haddock Lobo, 1200 \u2014 Jardins, SP',
      desde: 'Janeiro de 2023', fid: 'N\u00edvel Ouro \u00b7 350 pts',
      pacotes: [
        { nome: 'Toxina botul\u00ednica', utilizado: 2, total: 4, valido: '06/2026' }
      ],
      fidBars: { bronze: 100, prata: 100, ouro: 50, platina: 0 },
      notes: 'Cliente fidelizada. Prefere Dra. Camila para todos os procedimentos. J\u00e1 indicou 4 clientes.',
      historico: [
        ['30/06', 'Toxina botul\u00ednica', 'Dra. Camila', 'R$ 890,00', 'Em atendimento'],
        ['15/05', 'Toxina botul\u00ednica (retoque)', 'Dra. Camila', 'R$ 350,00', 'Conclu\u00eddo'],
        ['10/03', 'Toxina botul\u00ednica', 'Dra. Camila', 'R$ 890,00', 'Conclu\u00eddo'],
        ['05/01', 'Avalia\u00e7\u00e3o inicial', 'Dra. Camila', 'R$ 0,00', 'Conclu\u00eddo']
      ]
    },
    'Beatriz Lima': {
      initials: 'BL', name: 'Beatriz Lima', since: 'Cliente desde 2020',
      meta: 'Cliente desde 2020 \u00b7 CPF: 321.654.987-00 \u00b7 45 anos',
      cpf: '321.654.987-00', nasc: '18/12/1979 (45 anos)', tel: '(11) 97744-9021',
      email: 'beatriz.lima@email.com', end: 'Av. Brigadeiro Faria Lima, 2000 \u2014 Pinheiros, SP',
      desde: 'Fevereiro de 2020', fid: 'N\u00edvel Platina \u00b7 620 pts',
      pacotes: [
        { nome: 'Drenagem linf\u00e1tica', utilizado: 6, total: 8, valido: '03/2027' }
      ],
      fidBars: { bronze: 100, prata: 100, ouro: 100, platina: 40 },
      notes: 'Cliente antiga, bastante fiel. Pagamento pendente da \u00faltima sess\u00e3o. Prefere hor\u00e1rios ap\u00f3s as 10h.',
      historico: [
        ['30/06', 'Drenagem linf\u00e1tica', 'Fernanda', 'R$ 180,00', 'Atrasado'],
        ['20/06', 'Massagem modeladora', 'Carlos', 'R$ 200,00', 'Conclu\u00eddo'],
        ['10/06', 'Drenagem linf\u00e1tica', 'Fernanda', 'R$ 180,00', 'Conclu\u00eddo'],
        ['28/05', 'Massagem relaxante', 'Carlos', 'R$ 200,00', 'Conclu\u00eddo'],
        ['15/05', 'Drenagem linf\u00e1tica', 'Fernanda', 'R$ 180,00', 'Conclu\u00eddo']
      ]
    },
    'Larissa Teixeira': {
      initials: 'LT', name: 'Larissa Teixeira', since: 'Cliente desde 2024',
      meta: 'Cliente desde 2024 \u00b7 CPF: 159.753.468-00 \u00b7 26 anos',
      cpf: '159.753.468-00', nasc: '08/09/1998 (26 anos)', tel: '(11) 96652-3398',
      email: 'larissa.teixeira@email.com', end: 'Rua Augusta, 1500 \u2014 Consola\u00e7\u00e3o, SP',
      desde: 'Abril de 2024', fid: 'N\u00edvel Bronze \u00b7 80 pts',
      pacotes: [],
      fidBars: { bronze: 30, prata: 0, ouro: 0, platina: 0 },
      notes: 'Cliente nova. Veio por indica\u00e7\u00e3o. Interessada em botox e preenchimento. Fidelidade pr\u00f3xima de expirar por inatividade.',
      historico: [
        ['18/06', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Conclu\u00eddo'],
        ['02/06', 'Consulta avalia\u00e7\u00e3o', 'Dra. Camila', 'R$ 0,00', 'Conclu\u00eddo'],
        ['15/04', 'Limpeza de pele', 'Fernanda', 'R$ 180,00', 'Conclu\u00eddo']
      ]
    },
    'Patr\u00edcia Nogueira': {
      initials: 'PN', name: 'Patr\u00edcia Nogueira', since: 'Cliente desde 2019',
      meta: 'Cliente desde 2019 \u00b7 CPF: 753.951.852-00 \u00b7 38 anos',
      cpf: '753.951.852-00', nasc: '22/04/1986 (38 anos)', tel: '(11) 98123-5567',
      email: 'patricia.nogueira@email.com', end: 'Rua da Consola\u00e7\u00e3o, 3000 \u2014 Consola\u00e7\u00e3o, SP',
      desde: 'Setembro de 2019', fid: 'N\u00edvel Diamante \u00b7 1050 pts',
      pacotes: [
        { nome: 'Laser CO2 fracionado', utilizado: 4, total: 5, valido: '12/2026' }
      ],
      fidBars: { bronze: 100, prata: 100, ouro: 100, platina: 100 },
      notes: 'Cliente top. J\u00e1 fez todos os tipos de procedimento. Prefere hor\u00e1rios fixos (ter\u00e7a 14:30). Maior ticket da cl\u00ednica.',
      historico: [
        ['30/06', 'Laser CO2 fracionado', 'Dra. Camila', 'R$ 1.200,00', 'Aguardando'],
        ['15/06', 'Toxina botul\u00ednica', 'Dra. Camila', 'R$ 890,00', 'Conclu\u00eddo'],
        ['01/06', 'Preenchimento labial', 'Dra. Camila', 'R$ 950,00', 'Conclu\u00eddo'],
        ['15/05', 'Laser CO2 (sess\u00e3o 3/5)', 'Dra. Camila', 'R$ 1.200,00', 'Conclu\u00eddo'],
        ['01/05', 'Laser CO2 (sess\u00e3o 2/5)', 'Dra. Camila', 'R$ 1.200,00', 'Conclu\u00eddo'],
        ['15/04', 'Laser CO2 (sess\u00e3o 1/5)', 'Dra. Camila', 'R$ 1.200,00', 'Conclu\u00eddo']
      ]
    }
  };

  window.FusionViews.prontuario = function() {
    // =====================================================================
    // PRONTUÁRIO MODAL (dentro da view Clientes)
    // =====================================================================
    var prontModal = document.getElementById('prontModal');
    var prontOverlay = document.getElementById('prontOverlay');
    var prontClose = document.getElementById('prontClose');

    if (prontModal && prontOverlay && prontClose) {

      function closePront() {
        prontModal.classList.remove('open');
        document.body.style.overflow = '';
      }
      prontOverlay.addEventListener('click', closePront);
      prontClose.addEventListener('click', closePront);

      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && prontModal.classList.contains('open')) {
          closePront();
        }
      });

      // Clique nas linhas da tabela de clientes abre o modal
      var clientTable = document.querySelector('[data-view="clientes"] table tbody');
      if (clientTable) {
        clientTable.addEventListener('click', function(e) {
          var tr = e.target.closest('tr');
          if (!tr) return;
          var nameEl = tr.querySelector('.cell-primary');
          if (!nameEl) return;
          var clientName = nameEl.textContent.trim();
          var data = window.prontData[clientName];
          if (!data) return;

          document.getElementById('prontAvatar').textContent = data.initials;
          document.getElementById('prontName').textContent = data.name;
          document.getElementById('prontMeta').textContent = data.meta;

          document.getElementById('pdNome').textContent = data.name;
          document.getElementById('pdCpf').textContent = data.cpf;
          document.getElementById('pdNasc').textContent = data.nasc;
          document.getElementById('pdTel').textContent = data.tel;
          document.getElementById('pdEmail').textContent = data.email;
          document.getElementById('pdEnd').textContent = data.end;
          document.getElementById('pdDesde').textContent = data.desde;
          document.getElementById('pdFid').innerHTML = '<span class="status-chip ok" style="font-size:12px;">' + data.fid + '</span>';

          var tbody = document.getElementById('prontHistorico');
          tbody.innerHTML = '';
          data.historico.forEach(function(row) {
            var tr2 = document.createElement('tr');
            row.forEach(function(cell, i) {
              var td = document.createElement('td');
              if (i === 4) {
                var cls = 'ok';
                if (cell === 'Em atendimento') cls = 'warn';
                if (cell === 'Atrasado' || cell === 'Pendente') cls = 'crit';
                td.innerHTML = '<span class="status-chip ' + cls + '">' + cell + '</span>';
              } else {
                td.textContent = cell;
              }
              tr2.appendChild(td);
            });
            tbody.appendChild(tr2);
          });

          document.getElementById('prontNotas').value = data.notes;

          document.querySelectorAll('.pront-tab').forEach(function(t) { t.classList.remove('active'); });
          document.querySelector('.pront-tab[data-ptab="dados"]').classList.add('active');
          document.querySelectorAll('.pront-panel').forEach(function(p) { p.classList.remove('active'); });
          document.querySelector('.pront-panel[data-ppanel="dados"]').classList.add('active');

          prontModal.classList.add('open');
          document.body.style.overflow = 'hidden';
        });
      }

      // Abas do modal
      document.querySelectorAll('.pront-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          var target = tab.getAttribute('data-ptab');
          document.querySelectorAll('.pront-tab').forEach(function(t) { t.classList.remove('active'); });
          tab.classList.add('active');
          document.querySelectorAll('.pront-panel').forEach(function(p) { p.classList.remove('active'); });
          var panel = document.querySelector('.pront-panel[data-ppanel="' + target + '"]');
          if (panel) panel.classList.add('active');
        });
      });
    }

    // =====================================================================
    // PRONTUÁRIO VIEW (página dedicada — data-view="prontuario")
    // =====================================================================
    var prontClientSelect = document.getElementById('prontClientSelect');
    var prontSearchInput = document.getElementById('prontSearchInput');
    var prontEmptyState = document.getElementById('prontEmptyState');
    var prontViewContent = document.getElementById('prontViewContent');

    function renderPacotes(pacotes) {
      var container = document.getElementById('pvPacotes');
      container.innerHTML = '';
      if (!pacotes || pacotes.length === 0) {
        container.innerHTML = '<div style="padding:20px 0;text-align:center;color:var(--ink-faint);font-size:13.5px;">Nenhum pacote ativo no momento.</div>';
        return;
      }
      pacotes.forEach(function(p) {
        var row = document.createElement('div');
        row.className = 'list-row';
        row.innerHTML = '<div><div class="li-name">' + p.nome + '</div><div class="li-sub">' + p.utilizado + ' de ' + p.total + ' sess\u00f5es utilizadas \u00b7 V\u00e1lido at\u00e9 ' + p.valido + '</div></div>' +
          '<span class="stock-qty" style="color:var(--sage);">' + p.utilizado + '/' + p.total + '</span>';
        container.appendChild(row);
      });
    }

    function renderFidBars(bars) {
      if (!bars) return;
      var hbar = document.getElementById('pvFidBars');
      if (!hbar) return;
      var levels = [
        { label: 'Bronze', pct: bars.bronze || 0 },
        { label: 'Prata', pct: bars.prata || 0 },
        { label: 'Ouro', pct: bars.ouro || 0 },
        { label: 'Platina', pct: bars.platina || 0 }
      ];
      hbar.innerHTML = '';
      levels.forEach(function(lvl) {
        var wrap = document.createElement('div');
        wrap.className = 'hb-row';
        var filled = lvl.pct >= 100;
        var barColor = filled ? 'var(--gold)' : 'var(--gold-soft)';
        wrap.innerHTML = '<span class="hb-label">' + lvl.label + '</span>' +
          '<div class="hb-bar-wrap"><div class="hb-bar" style="width:' + lvl.pct + '%;background:' + barColor + ';"></div></div>';
        hbar.appendChild(wrap);
      });
    }

    window.populateProntuario = function(clientName) {
      var data = window.prontData[clientName];
      if (!data) {
        if (prontEmptyState) prontEmptyState.style.display = '';
        if (prontViewContent) prontViewContent.style.display = 'none';
        return;
      }

      document.getElementById('pvAvatar').textContent = data.initials;
      document.getElementById('pvName').textContent = data.name;
      document.getElementById('pvMeta').textContent = data.meta;

      document.getElementById('pvNome').textContent = data.name;
      document.getElementById('pvCpf').textContent = data.cpf;
      document.getElementById('pvNasc').textContent = data.nasc;
      document.getElementById('pvTel').textContent = data.tel;
      document.getElementById('pvEmail').textContent = data.email;
      document.getElementById('pvEnd').textContent = data.end;
      document.getElementById('pvDesde').textContent = data.desde;
      document.getElementById('pvFid').innerHTML = '<span class="status-chip ok" style="font-size:12px;">' + data.fid + '</span>';

      var histTbody = document.getElementById('pvHistorico');
      histTbody.innerHTML = '';
      data.historico.forEach(function(row) {
        var tr = document.createElement('tr');
        row.forEach(function(cell, i) {
          var td = document.createElement('td');
          if (i === 4) {
            var cls = 'ok';
            if (cell === 'Em atendimento') cls = 'warn';
            if (cell === 'Atrasado' || cell === 'Pendente') cls = 'crit';
            td.innerHTML = '<span class="status-chip ' + cls + '">' + cell + '</span>';
          } else {
            td.textContent = cell;
          }
          tr.appendChild(td);
        });
        histTbody.appendChild(tr);
      });

      renderPacotes(data.pacotes);
      renderFidBars(data.fidBars);

      document.getElementById('pvNotas').value = data.notes;

      prontEmptyState.style.display = 'none';
      prontViewContent.style.display = '';
      var tabs = document.querySelectorAll('#prontViewContent .pront-tab');
      var panels = document.querySelectorAll('#prontViewContent .pront-panel');
      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.style.display = 'none'; });
      var firstTab = document.querySelector('#prontViewContent .pront-tab[data-pvtab="dados"]');
      var firstPanel = document.querySelector('#prontViewContent .pront-panel[data-ppanel-v="dados"]');
      if (firstTab) firstTab.classList.add('active');
      if (firstPanel) firstPanel.style.display = 'block';
    }

    if (prontClientSelect) {
      prontClientSelect.addEventListener('change', function() {
        if (prontSearchInput) prontSearchInput.value = '';
        window.populateProntuario(this.value);
      });
    }

    // ---- BUSCA NO SELECT DE CLIENTES (PRONTUÁRIO) ----
    Helpers.initSearch('prontSearchInput', {
      filterMode: 'dropdown',
      selectEl: 'prontClientSelect',
      onSelect: function(value) {
        window.populateProntuario(value);
      },
      onEmpty: function() {
        prontClientSelect.value = '';
        prontEmptyState.style.display = '';
        prontViewContent.style.display = 'none';
      }
    });

    // Abas do prontuário view
    document.querySelectorAll('#prontViewContent .pront-tab').forEach(function(tab) {
      tab.addEventListener('click', function() {
        var target = tab.getAttribute('data-pvtab');
        var parent = tab.closest('#prontViewContent');
        parent.querySelectorAll('.pront-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        parent.querySelectorAll('.pront-panel').forEach(function(p) { p.style.display = 'none'; });
        var panel = parent.querySelector('.pront-panel[data-ppanel-v="' + target + '"]');
        if (panel) panel.style.display = '';
      });
    });

    // Botão Novo agendamento no prontuário view
    var pvNovoAgenda = document.getElementById('pvNovoAgenda');
    if (pvNovoAgenda) {
      pvNovoAgenda.addEventListener('click', function(e) {
        e.preventDefault();
        if (typeof openModalAgenda === 'function' && prontClientSelect && prontClientSelect.value) {
          openModalAgenda(prontClientSelect.value);
        } else {
          Helpers.showToast('Selecione uma cliente e use a view Agenda para agendar.', 'info');
        }
      });
    }

    // Auto-carregar primeira cliente ao navegar para view prontuario
    var prontNavItem = document.querySelector('.nav-item[data-view="prontuario"]');
    if (prontNavItem) {
      prontNavItem.addEventListener('click', function() {
        if (prontClientSelect && prontClientSelect.options.length > 1) {
          prontClientSelect.value = prontClientSelect.options[1].value;
          window.populateProntuario(prontClientSelect.value);
          if (prontSearchInput) prontSearchInput.value = '';
        }
      });
    }
  };
})();
