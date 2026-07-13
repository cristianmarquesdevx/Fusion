/** @format */

/**
 * Fusion ERP v2 — Funções Utilitárias
 */

export const Helpers = {
  generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
  },

  formatCurrency(value) {
    if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  },

  formatNumber(value) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    return new Intl.NumberFormat('pt-BR').format(value);
  },

  formatPercent(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    return `${Number(value).toFixed(decimals)}%`;
  },

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

  getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  },

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  },

  getStatusColor(status) {
    const colors = {
      pendente: '#FDCB6E',
      confirmado: '#00B894',
      em_atendimento: '#0984E3',
      concluido: '#636E72',
      cancelado: '#E17055',
      ativo: '#00B894',
      inativo: '#B2BEC3',
      bloqueado: '#D63031',
      pago: '#00B894',
      atrasado: '#E17055',
      disponivel: '#00B894',
      baixo_estoque: '#FDCB6E',
      esgotado: '#D63031',
    };
    return colors[status] || '#636E72';
  },

  debounce(fn, delay = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  truncate(str, maxLength = 50, suffix = '...') {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength).trim() + suffix;
  },

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

  getAvatarColor(name) {
    const colors = [
      '#6C5CE7', '#00B894', '#FDCB6E', '#E17055',
      '#0984E3', '#A29BFE', '#55EFC4', '#FAB1A0',
      '#74B9FF', '#FD79A8', '#00CEC9', '#D63031',
    ];
    if (!name) return colors[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  },

  search(array, term, fields = []) {
    if (!array || !Array.isArray(array)) return [];
    if (!term?.trim()) return array;
    const searchTerm = term.toLowerCase().trim();
    return array.filter((item) =>
      fields.some((field) => {
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return value && String(value).toLowerCase().includes(searchTerm);
      })
    );
  },

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
};
