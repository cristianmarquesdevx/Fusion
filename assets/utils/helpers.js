/**
 * Fusion ERP - Funções Utilitárias
 * @author Cristian Marques
 */

const Helpers = {
  /**
   * Gera ID único
   */
  generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
  },

  /**
   * Clona objeto profundamente
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    return obj;
  },

  /**
   * Debounce para eventos de alta frequência
   */
  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Throttle para eventos de alta frequência
   */
  throttle(fn, limit = 300) {
    let inThrottle = false;
    return function (...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Formata data para o padrão brasileiro
   */
  formatDate(date, format = 'DD/MM/YYYY') {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return format
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year)
      .replace('HH', hours)
      .replace('mm', minutes);
  },

  /**
   * Formata valor monetário em reais
   */
  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  /**
   * Formata número percentual
   */
  formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${Number(value).toFixed(decimals)}%`;
  },

  /**
   * Formata número com separadores
   */
  formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return new Intl.NumberFormat('pt-BR').format(value);
  },

  /**
   * Formata telefone
   */
  formatPhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  },

  /**
   * Formata CPF
   */
  formatCPF(cpf) {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length !== 11) return cpf;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  },

  /**
   * Formata CNPJ
   */
  formatCNPJ(cnpj) {
    if (!cnpj) return '';
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length !== 14) return cnpj;
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  },

  /**
   * Formata CEP
   */
  formatCEP(cep) {
    if (!cep) return '';
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length !== 8) return cep;
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  },

  /**
   * Remove formatação
   */
  unformat(value) {
    if (!value) return '';
    return value.replace(/\D/g, '');
  },

  /**
   * Trunca texto
   */
  truncate(str, maxLength = 50, suffix = '...') {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength).trim() + suffix;
  },

  /**
   * Slugify - converte texto para slug URL
   */
  slugify(text) {
    if (!text) return '';
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  },

  /**
   * Capitaliza primeira letra
   */
  capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Máscara de input
   */
  maskInput(input, mask) {
    if (!input || !mask) return '';
    let value = input.replace(/\D/g, '');
    let result = '';
    let valueIndex = 0;

    for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
      if (mask[i] === '9') {
        result += value[valueIndex];
        valueIndex++;
      } else {
        result += mask[i];
      }
    }
    return result;
  },

  /**
   * Calcula idade
   */
  calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  },

  /**
   * Diff em dias entre duas datas
   */
  daysBetween(date1, date2 = new Date()) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diff = d2.getTime() - d1.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * Retorna cor baseada no status
   */
  getStatusColor(status) {
    const colors = {
      // Agendamento
      pendente: '#FDCB6E',
      confirmado: '#00B894',
      em_atendimento: '#0984E3',
      concluido: '#636E72',
      cancelado: '#E17055',
      faltou: '#D63031',
      remarcado: '#6C5CE7',
      // Cliente
      ativo: '#00B894',
      inativo: '#B2BEC3',
      bloqueado: '#D63031',
      vip: '#FDCB6E',
      // Pagamento
      pago: '#00B894',
      parcial: '#FDCB6E',
      atrasado: '#E17055',
      reembolsado: '#0984E3',
      // Estoque
      disponivel: '#00B894',
      baixo_estoque: '#FDCB6E',
      esgotado: '#D63031',
      vencido: '#636E72'
    };
    return colors[status] || '#636E72';
  },

  /**
   * Gera cor aleatória para avatares
   */
  getAvatarColor(name) {
    const colors = [
      '#6C5CE7', '#00B894', '#FDCB6E', '#E17055',
      '#0984E3', '#A29BFE', '#55EFC4', '#FAB1A0',
      '#74B9FF', '#FD79A8', '#00CEC9', '#D63031'
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  /**
   * Extrai iniciais para avatar
   */
  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  /**
   * Agrupa array por chave
   */
  groupBy(array, key) {
    if (!array || !Array.isArray(array)) return {};
    return array.reduce((result, item) => {
      const groupKey = typeof key === 'function' ? key(item) : item[key];
      if (!result[groupKey]) result[groupKey] = [];
      result[groupKey].push(item);
      return result;
    }, {});
  },

  /**
   * Ordena array por campo
   */
  sortBy(array, field, direction = 'asc') {
    if (!array || !Array.isArray(array)) return [];
    const sorted = [...array];
    sorted.sort((a, b) => {
      const valA = field.split('.').reduce((obj, key) => obj?.[key], a) ?? '';
      const valB = field.split('.').reduce((obj, key) => obj?.[key], b) ?? '';
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  },

  /**
   * Filtra array por termo de busca
   */
  search(array, term, fields = []) {
    if (!array || !Array.isArray(array)) return [];
    if (!term?.trim()) return array;
    const searchTerm = term.toLowerCase().trim();
    return array.filter(item =>
      fields.some(field => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value && String(value).toLowerCase().includes(searchTerm);
      })
    );
  },

  /**
   * Pagina array
   */
  paginate(array, page = 1, pageSize = 20) {
    if (!array || !Array.isArray(array)) return { data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    const total = array.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const data = array.slice(start, start + pageSize);
    return { data, total, page, pageSize, totalPages };
  },

  /**
   * Cria URL de query params
   */
  queryString(params) {
    if (!params || typeof params !== 'object') return '';
    return Object.entries(params)
      .filter(([_, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
  },

  /**
   * Pega parâmetros da URL
   */
  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  /**
   * Detecta dispositivo móvel
   */
  isMobile() {
    return window.innerWidth < 768;
  },

  /**
   * Detecta se é tablet
   */
  isTablet() {
    return window.innerWidth >= 768 && window.innerWidth < 1024;
  },

  /**
   * Retorna o breakpoint atual
   */
  getBreakpoint() {
    const width = window.innerWidth;
    if (width < 576) return 'xs';
    if (width < 768) return 'sm';
    if (width < 1024) return 'md';
    if (width < 1280) return 'lg';
    if (width < 1536) return 'xl';
    return '2xl';
  },

  /**
   * Smooth scroll para elemento
   */
  scrollToElement(element, offset = 0) {
    if (!element) return;
    const top = element.getBoundingClientRect().top + window.pageYOffset + offset;
    window.scrollTo({ top, behavior: 'smooth' });
  },

  /**
   * Copia texto para clipboard
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  },

  /**
   * Download de arquivo
   */
  downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Exporta dados como CSV
   */
  exportToCSV(data, filename = 'export.csv') {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(';'),
      ...data.map(row =>
        headers.map(h => {
          const cell = row[h]?.toString() ?? '';
          return cell.includes(';') ? `"${cell}"` : cell;
        }).join(';')
      )
    ].join('\n');
    this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  },

  /**
   * Retorna saudação baseada no horário
   */
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  },

  /**
   * Retorna o nome do mês
   */
  getMonthName(monthIndex) {
    return CONSTANTS.MESES[monthIndex] || '';
  },

  /**
   * Retorna o nome do dia da semana
   */
  getDayName(dayIndex) {
    return CONSTANTS.DIAS_SEMANA[dayIndex] || '';
  },

  /**
   * Extrai dados de uma tabela HTML (headers + rows)
   */
  getTableData(table) {
    var headers = [];
    var rows = [];
    var ths = table.querySelectorAll('thead th');
    ths.forEach(function(th) { headers.push(th.textContent.trim()); });
    var trs = table.querySelectorAll('tbody tr');
    trs.forEach(function(tr) {
      var row = [];
      tr.querySelectorAll('td').forEach(function(td) { row.push(td.textContent.trim()); });
      if (row.length > 0) rows.push(row);
    });
    return { headers: headers, rows: rows };
  },

  /**
   * Painel de filtros — cria e posiciona um dropdown com opções de filtro
   */
  _filterPanel: null,
  _filterOverlay: null,
  _activeFilters: {},

  showFilterPanel(viewName, anchorEl, filterGroups, onApply) {
    this.hideFilterPanel();

    // Overlay
    var overlay = document.createElement('div');
    overlay.className = 'filter-panel-overlay open';
    overlay.addEventListener('click', this.hideFilterPanel.bind(this));
    document.body.appendChild(overlay);
    this._filterOverlay = overlay;

    // Panel
    var panel = document.createElement('div');
    panel.className = 'filter-panel';
    panel.style.position = 'fixed';

    // Header
    var header = document.createElement('div');
    header.className = 'fp-header';
    var title = document.createElement('h3');
    title.textContent = 'Filtros avançados';
    var closeBtn = document.createElement('button');
    closeBtn.className = 'fp-close';
    closeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    closeBtn.addEventListener('click', this.hideFilterPanel.bind(this));
    header.appendChild(title);
    header.appendChild(closeBtn);
    panel.appendChild(header);

    // Filter groups
    var state = {};
    filterGroups.forEach(function(group) {
      var div = document.createElement('div');
      div.className = 'fp-group';
      var label = document.createElement('div');
      label.className = 'fp-label';
      label.textContent = group.label;
      div.appendChild(label);

      var options = document.createElement('div');
      options.className = 'fp-options';
      state[group.key] = [];

      group.items.forEach(function(item) {
        var chip = document.createElement('span');
        chip.className = 'fp-chip';
        chip.textContent = item.label;
        chip.dataset.filterKey = group.key;
        chip.dataset.filterValue = item.value;
        chip.addEventListener('click', function() {
          this.classList.toggle('active');
        });
        options.appendChild(chip);
      });

      div.appendChild(options);
      panel.appendChild(div);
    });

    // Actions
    var actions = document.createElement('div');
    actions.className = 'fp-actions';

    var cleanBtn = document.createElement('button');
    cleanBtn.className = 'btn ghost';
    cleanBtn.textContent = 'Limpar';
    cleanBtn.addEventListener('click', function() {
      panel.querySelectorAll('.fp-chip.active').forEach(function(c) {
        c.classList.remove('active');
      });
    });
    actions.appendChild(cleanBtn);

    var applyBtn = document.createElement('button');
    applyBtn.className = 'btn';
    applyBtn.textContent = 'Aplicar';
    applyBtn.addEventListener('click', function() {
      var filters = {};
      panel.querySelectorAll('.fp-chip.active').forEach(function(c) {
        var key = c.dataset.filterKey;
        if (!filters[key]) filters[key] = [];
        filters[key].push(c.dataset.filterValue);
      });
      if (typeof onApply === 'function') onApply(filters);
      Helpers.hideFilterPanel();
    });
    actions.appendChild(applyBtn);

    panel.appendChild(actions);
    document.body.appendChild(panel);
    this._filterPanel = panel;

    // Position below the anchor button
    this._positionFilterPanel(anchorEl, panel);
  },

  _positionFilterPanel(anchor, panel) {
    var rect = anchor.getBoundingClientRect();
    var panelWidth = panel.offsetWidth || 300;
    var left = rect.left;
    if (left + panelWidth > window.innerWidth - 16) {
      left = window.innerWidth - panelWidth - 16;
    }
    if (left < 16) left = 16;
    panel.style.left = left + 'px';
    panel.style.top = (rect.bottom + 8) + 'px';
  },

  hideFilterPanel() {
    if (this._filterPanel) {
      this._filterPanel.remove();
      this._filterPanel = null;
    }
    if (this._filterOverlay) {
      this._filterOverlay.remove();
      this._filterOverlay = null;
    }
  },

  /**
   * Aplica filtros a uma tabela ou container, escondendo itens que não correspondem
   * childSelector: 'tbody tr' para tabelas, '.panel' para painéis, '.product-card' para grid
   */
  applyTableFilters(containerSelector, filters, childSelector) {
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var items = container.querySelectorAll(childSelector || 'tbody tr');
    var hasActiveFilters = Object.keys(filters).length > 0 &&
      Object.values(filters).some(function(arr) { return arr.length > 0; });

    items.forEach(function(item) {
      if (!hasActiveFilters) {
        item.style.display = '';
        return;
      }
      var itemText = item.textContent.toLowerCase();
      var match = Object.keys(filters).every(function(key) {
        var vals = filters[key];
        if (!vals || vals.length === 0) return true;
        return vals.some(function(v) {
          return itemText.indexOf(v.toLowerCase()) > -1;
        });
      });
      item.style.display = match ? '' : 'none';
    });
  },

  /**
   * Aplica filtro de data por período (hoje, semana, mês)
   * childSelector: 'tbody tr' para tabelas, '.panel' para painéis
   * A data é lida da 3ª célula (index 2) de cada linha
   */
  applyDateFilter(containerSelector, dateFilterValue, childSelector) {
    if (!dateFilterValue) return;
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var items = container.querySelectorAll(childSelector || 'tbody tr');
    if (items.length === 0) return;

    var now = new Date();
    var today = now.getDate();
    var thisMonth = now.getMonth();
    var thisYear = now.getFullYear();

    // Calculate date range
    var startDate, endDate;
    switch (dateFilterValue) {
      case 'hoje':
        startDate = new Date(thisYear, thisMonth, today);
        endDate = new Date(thisYear, thisMonth, today + 1);
        break;
      case 'semana':
        var dayOfWeek = now.getDay();
        var monday = new Date(thisYear, thisMonth, today - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        startDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
        endDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7);
        break;
      case 'mes':
        startDate = new Date(thisYear, thisMonth, 1);
        endDate = new Date(thisYear, thisMonth + 1, 1);
        break;
      default:
        return;
    }

    // Read previous display state BEFORE setting anything (AND logic)
    items.forEach(function(item) {
      var wasHidden = (item.style.display === 'none');
      var tds = item.querySelectorAll('td');
      if (tds.length < 3) {
        item.style.display = wasHidden ? 'none' : '';
        return;
      }
      var dateText = tds[2].textContent.trim();
      var parts = dateText.split('/');
      if (parts.length < 2) {
        item.style.display = wasHidden ? 'none' : '';
        return;
      }
      var itemDay = parseInt(parts[0], 10);
      var itemMonth = parseInt(parts[1], 10) - 1;
      var itemYear = thisYear;
      if (itemMonth > now.getMonth() || (itemMonth === now.getMonth() && itemDay > today)) {
        itemYear = thisYear - 1;
      }
      var itemDate = new Date(itemYear, itemMonth, itemDay);

      var match = itemDate >= startDate && itemDate < endDate;
      // Only show if date matches AND item wasn't already hidden by another filter
      item.style.display = (match && !wasHidden) ? '' : 'none';
    });
  },

  /**
   * Exibe toast notification
   */
  showToast(message, type) {
    var existing = document.querySelector('.fusion-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'fusion-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 20px;border-radius:12px;font-size:13.5px;font-weight:600;z-index:999;animation:fadein .25s ease;box-shadow:0 4px 20px rgba(0,0,0,0.15);';
    if (type === 'success') {
      toast.style.background = '#4C7A5E';
      toast.style.color = '#fff';
    } else {
      toast.style.background = '#B14E3D';
      toast.style.color = '#fff';
    }
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
  },

  /**
   * Exporta tabelas HTML para CSV
   */
  exportTablesToCSV(containerSelector) {
    var tables = document.querySelectorAll(containerSelector + ' .table-wrap table');
    if (!tables || tables.length === 0) {
      Helpers.showToast('Nenhum dado encontrado para exportar.', 'error');
      return;
    }
    var dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    tables.forEach(function(table, i) {
      var data = Helpers.getTableData(table);
      if (data.rows.length === 0) return;
      var csvRows = [data.headers.join(';')];
      data.rows.forEach(function(row) {
        var escaped = row.map(function(cell) {
          return cell.includes(';') || cell.includes('"') ? '"' + cell.replace(/"/g, '""') + '"' : cell;
        });
        csvRows.push(escaped.join(';'));
      });
      var titles = ['agendamentos', 'faturamento', 'estoque'];
      var name = 'relatorio_' + (titles[i] || 'dados') + '_' + dateStr + '.csv';
      var bom = '\uFEFF';
      Helpers.downloadFile(bom + csvRows.join('\n'), name, 'text/csv;charset=utf-8');
    });
    Helpers.showToast(tables.length + ' arquivo(s) CSV exportado(s) com sucesso!', 'success');
  },

  /**
   * Centraliza criação de modal com open/close, overlay, Escape e botões
   * @param {string} modalId - ID do elemento modal
   * @param {Object} opts
   * @param {string} [opts.openBtn] - ID do botão que abre o modal
   * @param {string} opts.closeBtn - ID do botão fechar (×) do modal
   * @param {string} [opts.cancelBtn] - ID do botão cancelar (opcional)
   * @param {string|HTMLElement} opts.saveBtn - ID ou elemento do botão salvar
   * @param {string} [opts.formId] - ID do formulário para reset ao abrir
   * @param {Function} [opts.onOpen] - Callback ao abrir o modal (após reset do form)
   * @param {Function} [opts.onSave] - Callback ao salvar: fn(closeModal, event)
   * @returns {{open: Function, close: Function}}
   */
  initModal(modalId, opts) {
    var modal = document.getElementById(modalId);
    var noop = { open: function(){}, close: function(){} };
    if (!modal || !opts) return noop;

    var closeBtn = opts.closeBtn ? document.getElementById(opts.closeBtn) : null;
    var cancelBtn = opts.cancelBtn ? document.getElementById(opts.cancelBtn) : null;
    var saveBtn = typeof opts.saveBtn === 'string' ? document.getElementById(opts.saveBtn) : (opts.saveBtn || null);
    var openBtn = opts.openBtn ? document.getElementById(opts.openBtn) : null;

    if (!closeBtn || !saveBtn) return noop;

    function openModal() {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (opts.formId) {
        var form = document.getElementById(opts.formId);
        if (form) form.reset();
      }
      if (typeof opts.onOpen === 'function') opts.onOpen();
    }

    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (openBtn) {
      openBtn.addEventListener('click', function(e) {
        e.preventDefault();
        openModal();
      });
    }
    closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeModal);
    }
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
    });

    if (typeof opts.onSave === 'function') {
      saveBtn.addEventListener('click', function(e) {
        e.preventDefault();
        opts.onSave(closeModal, e);
      });
    }

    return { open: openModal, close: closeModal };
  },

  /**
   * Centraliza criação do botão Filtrar (painel de filtros avançados)
   * @param {string} btnId - ID do botão Filtrar
   * @param {Object} opts
   * @param {string} opts.viewName - Nome da view (ex: 'clientes')
   * @param {string} opts.container - Seletor do container a ser filtrado
   * @param {string} opts.counterId - ID do span contador
   * @param {Array} opts.groups - Array de grupos de filtro: { key, label, items }
   * @param {string} [opts.childSelector] - Seletor dos itens filhos (padrão: 'tbody tr')
   * @param {string} [opts.dateFilterKey] - Chave do grupo que representa filtro de data (ex: 'periodo')
   * @param {Function} [opts.onApply] - Callback custom para substituir o comportamento padrão
   */
  initFilterPanel(btnId, opts) {
    var btn = document.getElementById(btnId);
    if (!btn || !opts || !opts.viewName || !opts.container || !opts.counterId || !opts.groups) return;

    var defaultOnApply = function(filters) {
      Helpers.applyTableFilters(opts.container, filters, opts.childSelector);
      if (opts.dateFilterKey && filters[opts.dateFilterKey] && filters[opts.dateFilterKey].length > 0) {
        Helpers.applyDateFilter(opts.container, filters[opts.dateFilterKey][0], opts.childSelector);
      }
      Helpers.updateResultCounter(opts.container, opts.counterId, opts.childSelector);
    };

    var onApply = opts.onApply || defaultOnApply;

    btn.addEventListener('click', function(e) {
      e.preventDefault();
      Helpers.showFilterPanel(opts.viewName, this, opts.groups, onApply);
    });
  },

  /**
   * Centraliza busca + contador + debounce para inputs de busca
   * @param {string|HTMLElement} inputEl - ID ou elemento do input
   * @param {Object} opts
   * @param {string} [opts.container] - Seletor do container a ser filtrado (table/cards/panels)
   * @param {string} [opts.counterId] - ID do span contador (table/cards/panels)
   * @param {string} [opts.childSelector] - Seletor dos itens (padrão: 'tbody tr')
   * @param {string} [opts.filterMode='table'] - 'table' | 'cards' | 'panels' | 'dropdown'
   * @param {string} [opts.selectEl] - ID do <select> a ser filtrado (dropdown)
   * @param {Function} [opts.onSelect] - Callback quando um item é selecionado (dropdown): fn(value)
   * @param {Function} [opts.onEmpty] - Callback quando a busca está vazia (dropdown): fn()
   * @returns {Function|undefined} Função refreshCounter() para atualizar o contador manualmente (table/cards/panels)
   */
  initSearch(inputEl, opts) {
    var input = typeof inputEl === 'string' ? document.getElementById(inputEl) : inputEl;
    if (!input || !opts) return;

    var filterMode = opts.filterMode || 'table';

    // ---- DROPDOWN MODE: filtra opções de um <select> ----
    if (filterMode === 'dropdown') {
      var selectEl = document.getElementById(opts.selectEl);
      if (!selectEl || typeof opts.onSelect !== 'function') return;

      input.addEventListener('input', Helpers.debounce(function() {
        var query = this.value.toLowerCase().trim();
        var options = selectEl.options;

        // Quando a busca está vazia: mostra todas as opções e chama onEmpty
        if (query === '') {
          for (var i = 1; i < options.length; i++) {
            options[i].style.display = '';
          }
          if (typeof opts.onEmpty === 'function') opts.onEmpty();
          return;
        }

        var found = false;
        for (var i = 1; i < options.length; i++) {
          var opt = options[i];
          var match = opt.value.toLowerCase().indexOf(query) > -1;
          opt.style.display = match ? '' : 'none';
          if (match && !found) {
            selectEl.value = opt.value;
            found = true;
          }
        }
        if (found) {
          opts.onSelect(selectEl.value);
        }
      }, 200));
      return;
    }

    // ---- TABLE / CARDS / PANELS MODE ----
    if (!opts.container || !opts.counterId) return;

    var filterFn;
    switch (filterMode) {
      case 'cards': filterFn = Helpers.filterProductCards; break;
      case 'panels': filterFn = Helpers.filterRoomPanels; break;
      default: filterFn = Helpers.filterTableRows;
    }

    input.addEventListener('input', Helpers.debounce(function() {
      filterFn(this, opts.container);
      Helpers.updateResultCounter(opts.container, opts.counterId, opts.childSelector);
    }, 200));

    // Inicializa contador com total inicial
    Helpers.updateResultCounter(opts.container, opts.counterId, opts.childSelector);

    // Retorna função para refresh manual (ex: após re-render via Fusion.subscribe)
    return function refreshCounter() {
      Helpers.updateResultCounter(opts.container, opts.counterId, opts.childSelector);
    };
  },

  /**
   * Atualiza data e saudação dinâmicas no dashboard
   */
  /**
   * Filtra linhas de uma tabela com base no texto do input de busca
   */
  filterTableRows(input, tableSelector) {
    if (!input || !tableSelector) return;
    var query = input.value.toLowerCase().trim();
    var table = typeof tableSelector === 'string' ? document.querySelector(tableSelector) : tableSelector;
    if (!table) return;
    var rows = table.querySelectorAll('tbody tr');
    rows.forEach(function(row) {
      if (!query) {
        row.style.display = '';
        return;
      }
      var match = false;
      row.querySelectorAll('td').forEach(function(cell) {
        if (cell.textContent.toLowerCase().indexOf(query) > -1) {
          match = true;
        }
      });
      row.style.display = match ? '' : 'none';
    });
  },

  /**
   * Filtra cartões de produto no PDV
   */
  filterProductCards(input, containerSelector) {
    if (!input || !containerSelector) return;
    var query = input.value.toLowerCase().trim();
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var cards = container.querySelectorAll('.product-card');
    cards.forEach(function(card) {
      if (!query) {
        card.style.display = '';
        return;
      }
      var text = card.textContent.toLowerCase();
      card.style.display = text.indexOf(query) > -1 ? '' : 'none';
    });
  },

  /**
   * Filtra painéis de sala
   */
  filterRoomPanels(input, containerSelector) {
    if (!input || !containerSelector) return;
    var query = input.value.toLowerCase().trim();
    var container = document.querySelector(containerSelector);
    if (!container) return;
    var panels = container.querySelectorAll('.panel');
    panels.forEach(function(panel) {
      if (!query) {
        panel.style.display = '';
        return;
      }
      var text = panel.textContent.toLowerCase();
      panel.style.display = text.indexOf(query) > -1 ? '' : 'none';
    });
  },

  updateResultCounter(containerSelector, counterId, childSelector) {
    var container = typeof containerSelector === 'string' ? document.querySelector(containerSelector) : containerSelector;
    var counter = document.getElementById(counterId);
    if (!container || !counter) return;
    var items = container.querySelectorAll(childSelector || 'tbody tr');
    var total = items.length;
    var visible = 0;
    items.forEach(function(item) {
      if (item.style.display !== 'none') visible++;
    });
    var newHtml = (visible === total)
      ? '<b>' + total + '</b>'
      : '<b>' + visible + '</b> de ' + total;
    // Só anima se o conteúdo realmente mudou
    if (counter.innerHTML !== newHtml) {
      counter.classList.remove('flash');
      void counter.offsetWidth; // força reflow para reiniciar animação
      counter.innerHTML = newHtml;
      counter.classList.add('flash');
    }
  },

  updateDashboardDate() {
    var dateEl = document.getElementById('dashDate');
    var greetingEl = document.getElementById('dashGreeting');
    if (!dateEl) return;
    var now = new Date();
    var days = CONSTANTS.DIAS_SEMANA || ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
    var months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    var dayName = days[now.getDay()];
    var monthName = months[now.getMonth()];
    var greeting = Helpers.getGreeting();
    dateEl.textContent = dayName + ', ' + now.getDate() + ' de ' + monthName;
    if (greetingEl) {
      greetingEl.textContent = greeting + ', Ana. O Vitta Jardins está a 82% da agenda hoje.';
    }
  },

  /**
   * Centraliza inicialização do dashboard: data, saudação e KPIs
   * @returns {{refresh: Function}}
   */
  initDashboard() {
    this.updateDashboardDate();
    this._updateDashboardKpis();

    // Assina atualizações do módulo dashboard na store
    if (typeof Fusion !== 'undefined' && typeof Fusion.subscribe === 'function' && Fusion._modules && Fusion._modules['dashboard']) {
      Fusion.subscribe('dashboard', function() {
        Helpers.updateDashboardDate();
        Helpers._updateDashboardKpis();
      });
    }

    return {
      refresh: function() {
        Helpers.updateDashboardDate();
        Helpers._updateDashboardKpis();
      }
    };
  },

  /**
   * Atualiza os valores dos cards KPI do dashboard a partir da store
   */
  _updateDashboardKpis() {
    if (typeof Fusion === 'undefined' || !Fusion._modules || !Fusion._modules['dashboard']) return;
    var metrics = Fusion._modules['dashboard'].state.metrics;
    if (!metrics) return;

    // Mapeia por rótulo dos cards no HTML para as métricas da store
    var kpiMap = [
      { labelMatch: 'faturamento', key: 'revenue', format: 'currency' },
      { labelMatch: 'agendamento', key: 'appointments', format: 'number' },
      { labelMatch: 'ocupa', key: 'occupancy', format: 'percent' },
      { labelMatch: 'ticket', key: null, format: null }
    ];

    var cards = document.querySelectorAll('.kpi-card');
    cards.forEach(function(card) {
      var labelEl = card.querySelector('.kpi-label');
      var valueEl = card.querySelector('.kpi-value');
      if (!labelEl || !valueEl) return;

      var label = labelEl.textContent.trim().toLowerCase();
      var match = null;
      for (var i = 0; i < kpiMap.length; i++) {
        if (label.indexOf(kpiMap[i].labelMatch) > -1) {
          match = kpiMap[i];
          break;
        }
      }
      if (!match || !match.key || !metrics[match.key]) return;

      var metric = metrics[match.key];
      var val = metric.value;
      if (match.format === 'currency') {
        valueEl.textContent = Helpers.formatCurrency(val);
      } else if (match.format === 'percent') {
        valueEl.textContent = val + '%';
      } else {
        valueEl.textContent = Helpers.formatNumber(val);
      }
    });
  }
};
