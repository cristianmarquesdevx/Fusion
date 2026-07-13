/**
 * Fusion ERP - App Shell JavaScript
 * Navigation between views + Theme toggle + Mobile sidebar
 * Inicializa todos os módulos de view registrados em FusionViews
 */
document.addEventListener('DOMContentLoaded', () => {

  // ---- Badges dinâmicos (Clientes e Agenda) ----
  var clientesBadge = document.querySelector('.clientes-badge');
  var agendaBadge = document.querySelector('.agenda-badge');

  function updateBadges() {
    if (typeof Fusion === 'undefined') return;
    if (clientesBadge && Fusion._modules['clientes']) {
      var total = Fusion._modules['clientes'].state.list.length;
      clientesBadge.textContent = total;
      clientesBadge.style.display = total > 0 ? '' : 'none';
    }
    if (agendaBadge && Fusion._modules['agenda']) {
      var count = Fusion._modules['agenda'].state.appointments.length;
      agendaBadge.textContent = count;
      agendaBadge.style.display = count > 0 ? '' : 'none';
    }
  }
  updateBadges();

  if (typeof Fusion !== 'undefined') {
    if (Fusion._modules['clientes']) {
      Fusion.subscribe('clientes', function() { updateBadges(); });
    }
    if (Fusion._modules['agenda']) {
      Fusion.subscribe('agenda', function() { updateBadges(); });
    }
  }

  // ---- Navegação por hash entre views ----
  const navItems = document.querySelectorAll('.nav-item:not([target="_blank"])');
  const views = document.querySelectorAll('.view');

  function navigateToView(target) {
    if (!target) return;
    var found = false;
    navItems.forEach(function(n) {
      var match = n.getAttribute('data-view') === target;
      n.classList.toggle('active', match);
      if (match) found = true;
    });
    views.forEach(function(v) {
      v.classList.toggle('active', v.getAttribute('data-view') === target);
    });
    document.body.classList.remove('nav-open');
    var contentEl = document.querySelector('.content');
    if (contentEl && contentEl.scrollTo) {
      contentEl.scrollTo({ top: 0, behavior: 'instant' });
    }
    if (window.scrollTo) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Auto-carregar dados do prontuário ao navegar para view
    if (target === 'prontuario') {
      var sel = document.getElementById('prontClientSelect');
      if (sel && sel.options.length > 1 && !sel.value) {
        sel.value = sel.options[1].value;
        if (typeof populateProntuario === 'function') {
          populateProntuario(sel.value);
        }
        var input = document.getElementById('prontSearchInput');
        if (input) input.value = '';
      }
    }
    return found;
  }

  // Clique nos items de navegação altera a hash
  navItems.forEach(function(item) {
    item.addEventListener('click', function() {
      var target = item.getAttribute('data-view');
      if (target) {
        window.location.hash = target;
      }
    });
  });

  // Escuta mudanças na hash
  window.addEventListener('hashchange', function() {
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      navigateToView(hash);
    }
  });

  // Na carga inicial, navega baseado na hash (ou dashboard como padrão)
  var initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    navigateToView(initialHash);
  }

  // ---- Theme toggle ----
  const themeBtn = document.getElementById('themeToggle');
  const iconMoon = document.getElementById('iconMoon');
  if (themeBtn && iconMoon) {
    const savedTheme = localStorage.getItem('fusion_theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      iconMoon.innerHTML = '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"/>';
    }
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      iconMoon.innerHTML = isDark
        ? '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8l1.8-1.8M18 6l1.8-1.8"/>'
        : '<path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/>';
      localStorage.setItem('fusion_theme', isDark ? 'dark' : 'light');
    });
  }

  // ---- Botões de tema na página de Aparência (Configurações) ----
  var btnTemaEscuro = document.getElementById('btnTemaEscuro');
  var btnTemaClaro = document.getElementById('btnTemaClaro');
  if (btnTemaEscuro) {
    btnTemaEscuro.addEventListener('click', function(e) {
      e.preventDefault();
      if (themeBtn) themeBtn.click();
    });
  }
  if (btnTemaClaro) {
    btnTemaClaro.addEventListener('click', function(e) {
      e.preventDefault();
      if (themeBtn) themeBtn.click();
    });
  }

  // ---- Botão Exportar dados (BI) ----
  var biExportCSV = document.getElementById('biExportCSV');
  if (biExportCSV) {
    biExportCSV.addEventListener('click', function(e) {
      e.preventDefault();
      Helpers.exportToCSV([], 'bi.csv');
    });
  }

  // ---- Botões Cancelar nos modais ----
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.modal-close-btn');
    if (btn) {
      e.preventDefault();
      // Find the closest parent modal overlay / pront-modal and close it
      var modal = btn.closest('.modal-overlay, .pront-modal, [class*="modal"]');
      if (modal) {
        modal.classList.remove('open');
      }
    }
  });

  // ---- Settings tabs ----
  const settingsTabs = document.querySelectorAll('.settings-tab');
  const settingsPanels = document.querySelectorAll('[data-settings-panel]');
  if (settingsTabs.length > 0) {
    settingsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-settings');
        settingsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        settingsPanels.forEach(p => {
          p.style.display = p.getAttribute('data-settings-panel') === target ? '' : 'none';
        });
      });
    });
  }

  // ---- Report period buttons ----
  const periodBtns = document.querySelectorAll('.report-period-btn');
  if (periodBtns.length > 0) {
    periodBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        periodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  window.showToast = Helpers.showToast;

  var exportCSVBtn = document.getElementById('exportCSV');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', function(e) { e.preventDefault(); Helpers.exportTablesToCSV('[data-view="relatorios"]'); });
  }

  var exportPDFBtn = document.getElementById('exportPDF');
  if (exportPDFBtn) {
    exportPDFBtn.addEventListener('click', function(e) {
      e.preventDefault();
      var origTitle = document.title;
      document.title = 'Relatorios - Fusion ERP';
      window.print();
      setTimeout(function() { document.title = origTitle; }, 100);
      Helpers.showToast('PDF gerado via impressão do navegador.', 'success');
    });
  }

  // ---- Mobile sidebar ----
  const menuToggle = document.getElementById('menuToggle');
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  }

  // ---- DB Connection Status Heartbeat ----
  function initDbStatusHeartbeat() {
    if (typeof SupabaseService === 'undefined') return;

    // Escuta eventos de mudança de status do Supabase
    document.addEventListener('supabase:status', function(e) {
      if (typeof SupabaseService.updateStatusIndicator === 'function') {
        SupabaseService.updateStatusIndicator(e.detail.status);
      }
    });

    // Inicia o heartbeat periódico (30s)
    if (typeof SupabaseService.startHeartbeat === 'function') {
      SupabaseService.startHeartbeat(30000);
    }
  }
  initDbStatusHeartbeat();

  // ---- Dashboard: carrega dados reais do Supabase, com fallback mock ----
  if (typeof Fusion !== 'undefined' && Fusion._modules['dashboard']) {
    Fusion.dispatch('dashboard/loadDashboard', 'today').then(function() {
      console.log('[App] Dashboard carregado');
    }).catch(function(err) {
      console.warn('[App] Dashboard fallback usado:', err.message);
    });
  }

  // Subscribe para recarregar dashboard ao conectar/desconectar do Supabase
  document.addEventListener('supabase:status', function(e) {
    var status = e.detail.status;
    if (status === 'connected' && typeof Fusion !== 'undefined') {
      console.log('[App] Supabase conectado, recarregando dados...');
      if (Fusion._modules['dashboard']) {
        Fusion.dispatch('dashboard/loadDashboard', 'today');
      }
      if (typeof SupabaseService !== 'undefined') {
        SupabaseService.loadAllToStore();
      }
    }
  });

  // ---- Dashboard init: date, greeting, store subscription ----
  if (typeof Helpers !== 'undefined' && Helpers.initDashboard) {
    Helpers.initDashboard();
  }

  // ---- Inicializa todos os módulos de view registrados ----
  if (window.FusionViews) {
    Object.keys(window.FusionViews).forEach(function(key) {
      if (typeof window.FusionViews[key] === 'function') {
        window.FusionViews[key]();
      }
    });
  }

});
