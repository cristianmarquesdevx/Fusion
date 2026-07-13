import { describe, it, expect, vi, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';

// Helpers is loaded as a global via setup.js

describe('Helpers', () => {

  // ---- generateId ----
  describe('generateId', () => {
    it('deve gerar uma string', () => {
      const id = Helpers.generateId();
      expect(typeof id).toBe('string');
    });

    it('deve conter um hífen separando timestamp do random', () => {
      const id = Helpers.generateId();
      expect(id).toContain('-');
    });

    it('deve gerar IDs únicos sequencialmente', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(Helpers.generateId());
      }
      expect(ids.size).toBe(100);
    });
  });

  // ---- deepClone ----
  describe('deepClone', () => {
    it('deve clonar objetos simples', () => {
      const obj = { a: 1, b: 'hello', c: true };
      const clone = Helpers.deepClone(obj);
      expect(clone).toEqual(obj);
      expect(clone).not.toBe(obj);
    });

    it('deve clonar objetos aninhados', () => {
      const obj = { a: { b: { c: [1, 2, 3] } } };
      const clone = Helpers.deepClone(obj);
      expect(clone).toEqual(obj);
      expect(clone.a.b).not.toBe(obj.a.b);
    });

    it('deve clonar arrays', () => {
      const arr = [1, [2, 3], { a: 4 }];
      const clone = Helpers.deepClone(arr);
      expect(clone).toEqual(arr);
      expect(clone).not.toBe(arr);
      expect(clone[1]).not.toBe(arr[1]);
    });

    it('deve clonar Date', () => {
      const date = new Date('2024-01-01');
      const clone = Helpers.deepClone(date);
      expect(clone).toEqual(date);
      expect(clone).not.toBe(date);
      expect(clone instanceof Date).toBe(true);
    });

    it('deve retornar null para null', () => {
      expect(Helpers.deepClone(null)).toBeNull();
    });

    it('deve retornar undefined para undefined', () => {
      expect(Helpers.deepClone(undefined)).toBeUndefined();
    });

    it('deve retornar valores primitivos diretamente', () => {
      expect(Helpers.deepClone(42)).toBe(42);
      expect(Helpers.deepClone('texto')).toBe('texto');
      expect(Helpers.deepClone(true)).toBe(true);
    });

    it('deve clonar objetos com arrays aninhados', () => {
      const obj = { items: [{ id: 1 }, { id: 2 }], tags: ['a', 'b'] };
      const clone = Helpers.deepClone(obj);
      expect(clone).toEqual(obj);
      expect(clone.items[0]).not.toBe(obj.items[0]);
    });
  });

  // ---- debounce ----
  describe('debounce', () => {
    it('deve chamar a função apenas após o delay', async () => {
      const fn = vi.fn();
      const debounced = Helpers.debounce(fn, 100);
      debounced();
      debounced();
      debounced();
      expect(fn).not.toHaveBeenCalled();
      await new Promise(r => setTimeout(r, 150));
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve passar os argumentos corretamente', async () => {
      const fn = vi.fn();
      const debounced = Helpers.debounce(fn, 50);
      debounced(1, 'a');
      await new Promise(r => setTimeout(r, 80));
      expect(fn).toHaveBeenCalledWith(1, 'a');
    });
  });

  // ---- throttle ----
  describe('throttle', () => {
    it('deve chamar a função imediatamente na primeira vez', () => {
      const fn = vi.fn();
      const throttled = Helpers.throttle(fn, 100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('não deve chamar novamente antes do limite', () => {
      const fn = vi.fn();
      const throttled = Helpers.throttle(fn, 100);
      throttled();
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('deve chamar novamente após o limite', async () => {
      const fn = vi.fn();
      const throttled = Helpers.throttle(fn, 50);
      throttled();
      await new Promise(r => setTimeout(r, 80));
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  // ---- formatDate ----
  describe('formatDate', () => {
    it('deve formatar no padrão DD/MM/YYYY', () => {
      // Usa data com fuso horário explícito para evitar deslocamento de UTC
      const result = Helpers.formatDate(new Date(2024, 2, 15));
      expect(result).toBe('15/03/2024');
    });

    it('deve formatar com horário', () => {
      const result = Helpers.formatDate('2024-03-15T14:30:00', 'DD/MM/YYYY HH:mm');
      expect(result).toBe('15/03/2024 14:30');
    });

    it('deve retornar string vazia para data inválida', () => {
      expect(Helpers.formatDate(null)).toBe('');
      expect(Helpers.formatDate('')).toBe('');
      expect(Helpers.formatDate('data-invalida')).toBe('');
    });

    it('deve formatar com Date object', () => {
      const date = new Date(2024, 0, 5); // 5 de janeiro
      const result = Helpers.formatDate(date);
      expect(result).toBe('05/01/2024');
    });
  });

  // ---- formatCurrency ----
  describe('formatCurrency', () => {
    it('deve formatar em reais', () => {
      const result = Helpers.formatCurrency(1234.56);
      expect(result).toContain('R$');
      expect(result).toContain('1.234,56');
    });

    it('deve formatar zero', () => {
      // Intl.NumberFormat usa espaço não-quebrável (\u00A0) após 'R$'
      const result = Helpers.formatCurrency(0);
      expect(result).toContain('R$');
      expect(result).toContain('0,00');
    });

    it('deve retornar R$ 0,00 para null/undefined/NaN', () => {
      expect(Helpers.formatCurrency(null)).toBe('R$ 0,00');
      expect(Helpers.formatCurrency(undefined)).toBe('R$ 0,00');
      expect(Helpers.formatCurrency(NaN)).toBe('R$ 0,00');
    });

    it('deve formatar centavos', () => {
      expect(Helpers.formatCurrency(0.5)).toContain('0,50');
    });

    it('deve formatar valores grandes com separadores', () => {
      const result = Helpers.formatCurrency(1234567.89);
      expect(result).toContain('1.234.567,89');
    });
  });

  // ---- formatPercent ----
  describe('formatPercent', () => {
    it('deve formatar percentual', () => {
      // toFixed() usa ponto como separador decimal (padrão JavaScript)
      expect(Helpers.formatPercent(12.5)).toBe('12.5%');
    });

    it('deve formatar com casas decimais customizadas', () => {
      expect(Helpers.formatPercent(12.345, 2)).toBe('12.35%');
    });

    it('deve retornar 0% para valores inválidos', () => {
      expect(Helpers.formatPercent(null)).toBe('0%');
      expect(Helpers.formatPercent(NaN)).toBe('0%');
    });
  });

  // ---- formatNumber ----
  describe('formatNumber', () => {
    it('deve formatar número com separadores', () => {
      expect(Helpers.formatNumber(1234)).toBe('1.234');
    });

    it('deve retornar 0 para inválidos', () => {
      expect(Helpers.formatNumber(null)).toBe('0');
      expect(Helpers.formatNumber(NaN)).toBe('0');
    });
  });

  // ---- formatPhone ----
  describe('formatPhone', () => {
    it('deve formatar telefone celular (11 dígitos)', () => {
      expect(Helpers.formatPhone('11982214410')).toBe('(11) 98221-4410');
    });

    it('deve formatar telefone fixo (10 dígitos)', () => {
      expect(Helpers.formatPhone('1133224455')).toBe('(11) 3322-4455');
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(Helpers.formatPhone('')).toBe('');
    });

    it('deve retornar o original se não conseguir formatar', () => {
      expect(Helpers.formatPhone('123')).toBe('123');
    });
  });

  // ---- formatCPF ----
  describe('formatCPF', () => {
    it('deve formatar CPF corretamente', () => {
      expect(Helpers.formatCPF('12345678900')).toBe('123.456.789-00');
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(Helpers.formatCPF('')).toBe('');
    });

    it('deve retornar o original se não tiver 11 dígitos', () => {
      expect(Helpers.formatCPF('123')).toBe('123');
    });
  });

  // ---- formatCNPJ ----
  describe('formatCNPJ', () => {
    it('deve formatar CNPJ corretamente', () => {
      expect(Helpers.formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(Helpers.formatCNPJ('')).toBe('');
    });
  });

  // ---- formatCEP ----
  describe('formatCEP', () => {
    it('deve formatar CEP corretamente', () => {
      expect(Helpers.formatCEP('12345678')).toBe('12345-678');
    });

    it('deve retornar vazio para entrada vazia', () => {
      expect(Helpers.formatCEP('')).toBe('');
    });

    it('deve retornar original se não tiver 8 dígitos', () => {
      expect(Helpers.formatCEP('1234')).toBe('1234');
    });
  });

  // ---- unformat ----
  describe('unformat', () => {
    it('deve remover tudo que não é dígito', () => {
      expect(Helpers.unformat('(11) 98221-4410')).toBe('11982214410');
    });

    it('deve retornar vazio para vazio', () => {
      expect(Helpers.unformat('')).toBe('');
    });

    it('deve retornar vazio para null', () => {
      expect(Helpers.unformat(null)).toBe('');
    });
  });

  // ---- truncate ----
  describe('truncate', () => {
    it('deve retornar o texto original se menor que o limite', () => {
      expect(Helpers.truncate('Hello', 10)).toBe('Hello');
    });

    it('deve truncar com sufixo padrão', () => {
      const result = Helpers.truncate('Hello World This Is Long', 10);
      expect(result).toBe('Hello Worl...');
    });

    it('deve usar sufixo customizado', () => {
      const result = Helpers.truncate('Hello World This Is Long', 10, ' [+++]');
      expect(result).toBe('Hello Worl [+++]');
    });

    it('deve retornar vazio para null', () => {
      expect(Helpers.truncate(null)).toBe('');
    });
  });

  // ---- slugify ----
  describe('slugify', () => {
    it('deve converter texto para slug', () => {
      expect(Helpers.slugify('Olá Mundo!')).toBe('ola-mundo');
    });

    it('deve remover acentos', () => {
      expect(Helpers.slugify('São Paulo')).toBe('sao-paulo');
    });

    it('deve substituir espaços por hífens', () => {
      expect(Helpers.slugify('  Hello   World  ')).toBe('hello-world');
    });

    it('deve retornar vazio para texto vazio', () => {
      expect(Helpers.slugify('')).toBe('');
    });
  });

  // ---- capitalize ----
  describe('capitalize', () => {
    it('deve capitalizar a primeira letra', () => {
      expect(Helpers.capitalize('hello')).toBe('Hello');
    });

    it('deve retornar vazio para vazio', () => {
      expect(Helpers.capitalize('')).toBe('');
    });
  });

  // ---- maskInput ----
  describe('maskInput', () => {
    it('deve aplicar máscara', () => {
      expect(Helpers.maskInput('11982214410', '(99) 99999-9999')).toBe('(11) 98221-4410');
    });

    it('deve retornar vazio se não houver input ou mask', () => {
      expect(Helpers.maskInput('', '(99)')).toBe('');
      expect(Helpers.maskInput('123', '')).toBe('');
    });
  });

  // ---- calculateAge ----
  describe('calculateAge', () => {
    it('deve calcular idade corretamente', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 25);
      const age = Helpers.calculateAge(birthDate.toISOString());
      expect(age).toBe(25);
    });

    it('deve retornar null para data inválida', () => {
      expect(Helpers.calculateAge(null)).toBeNull();
    });
  });

  // ---- daysBetween ----
  describe('daysBetween', () => {
    it('deve calcular diferença em dias', () => {
      const diff = Helpers.daysBetween('2024-01-01', '2024-01-11');
      expect(diff).toBe(10);
    });

    it('deve retornar 0 para mesma data', () => {
      expect(Helpers.daysBetween('2024-01-01', '2024-01-01')).toBe(0);
    });
  });

  // ---- getStatusColor ----
  describe('getStatusColor', () => {
    it('deve retornar cor para status conhecido', () => {
      expect(Helpers.getStatusColor('pendente')).toBe('#FDCB6E');
      expect(Helpers.getStatusColor('confirmado')).toBe('#00B894');
      expect(Helpers.getStatusColor('cancelado')).toBe('#E17055');
    });

    it('deve retornar cor padrão para status desconhecido', () => {
      expect(Helpers.getStatusColor('desconhecido')).toBe('#636E72');
    });
  });

  // ---- getAvatarColor ----
  describe('getAvatarColor', () => {
    it('deve retornar uma cor para um nome', () => {
      const color = Helpers.getAvatarColor('Ana');
      expect(color).toMatch(/^#[A-Fa-f0-9]{6}$/);
    });

    it('deve retornar a primeira cor para nome vazio', () => {
      expect(Helpers.getAvatarColor('')).toBe('#6C5CE7');
    });

    it('deve retornar cor consistente para mesmo nome', () => {
      expect(Helpers.getAvatarColor('Maria')).toBe(Helpers.getAvatarColor('Maria'));
    });
  });

  // ---- getInitials ----
  describe('getInitials', () => {
    it('deve extrair iniciais de nome completo', () => {
      expect(Helpers.getInitials('Ana Souza')).toBe('AS');
    });

    it('deve retornar única inicial para nome único', () => {
      expect(Helpers.getInitials('Maria')).toBe('M');
    });

    it('deve retornar ? para vazio', () => {
      expect(Helpers.getInitials('')).toBe('?');
    });
  });

  // ---- groupBy ----
  describe('groupBy', () => {
    const items = [
      { type: 'A', name: 'Item 1' },
      { type: 'B', name: 'Item 2' },
      { type: 'A', name: 'Item 3' },
    ];

    it('deve agrupar por chave', () => {
      const grouped = Helpers.groupBy(items, 'type');
      expect(grouped['A']).toHaveLength(2);
      expect(grouped['B']).toHaveLength(1);
    });

    it('deve aceitar função como chave', () => {
      const grouped = Helpers.groupBy(items, item => item.type);
      expect(grouped['A']).toHaveLength(2);
    });

    it('deve retornar objeto vazio para array inválido', () => {
      expect(Helpers.groupBy(null, 'type')).toEqual({});
    });
  });

  // ---- sortBy ----
  describe('sortBy', () => {
    const items = [
      { name: 'Zebra', age: 10 },
      { name: 'Ana', age: 5 },
      { name: 'Maria', age: 8 },
    ];

    it('deve ordenar ascendente por padrão', () => {
      const sorted = Helpers.sortBy(items, 'name');
      expect(sorted[0].name).toBe('Ana');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('deve ordenar descendente', () => {
      const sorted = Helpers.sortBy(items, 'name', 'desc');
      expect(sorted[0].name).toBe('Zebra');
      expect(sorted[2].name).toBe('Ana');
    });

    it('não deve modificar o array original', () => {
      const original = [...items];
      Helpers.sortBy(items, 'name');
      expect(items).toEqual(original);
    });

    it('deve retornar array vazio para entrada inválida', () => {
      expect(Helpers.sortBy(null, 'name')).toEqual([]);
    });
  });

  // ---- search ----
  describe('search', () => {
    const items = [
      { name: 'Ana Paula', email: 'ana@test.com' },
      { name: 'Carlos Silva', email: 'carlos@test.com' },
      { name: 'Beatriz', email: 'bia@test.com' },
    ];

    it('deve filtrar por termo de busca', () => {
      const result = Helpers.search(items, 'ana', ['name']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ana Paula');
    });

    it('deve buscar em múltiplos campos', () => {
      const result = Helpers.search(items, 'carlos', ['name', 'email']);
      expect(result).toHaveLength(1);
    });

    it('deve retornar array original se termo vazio', () => {
      expect(Helpers.search(items, '', ['name'])).toHaveLength(3);
    });

    it('deve retornar array vazio para entrada inválida', () => {
      expect(Helpers.search(null, 'test', ['name'])).toEqual([]);
    });
  });

  // ---- paginate ----
  describe('paginate', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

    it('deve retornar primeira página', () => {
      const result = Helpers.paginate(items, 1, 5);
      expect(result.data).toHaveLength(5);
      expect(result.total).toBe(15);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(3);
    });

    it('deve retornar página específica', () => {
      const result = Helpers.paginate(items, 3, 5);
      expect(result.data).toHaveLength(5);
      expect(result.data[0]).toBe(11);
    });

    it('deve retornar estrutura vazia para array inválido', () => {
      const result = Helpers.paginate(null);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ---- queryString ----
  describe('queryString', () => {
    it('deve construir query string', () => {
      expect(Helpers.queryString({ a: 1, b: 'hello' })).toBe('a=1&b=hello');
    });

    it('deve ignorar null, undefined e vazio', () => {
      expect(Helpers.queryString({ a: 1, b: null, c: undefined, d: '' })).toBe('a=1');
    });

    it('deve retornar vazio para objeto vazio', () => {
      expect(Helpers.queryString({})).toBe('');
    });

    it('deve retornar vazio para null', () => {
      expect(Helpers.queryString(null)).toBe('');
    });

    it('deve codificar caracteres especiais', () => {
      const result = Helpers.queryString({ name: 'João & Maria' });
      expect(result).toContain(encodeURIComponent('João & Maria'));
    });
  });

  // ---- getGreeting ----
  describe('getGreeting', () => {
    it('deve retornar "Bom dia" antes do meio-dia', () => {
      // Mock da hora para 10h
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 1, 10, 0, 0));
      expect(Helpers.getGreeting()).toBe('Bom dia');
      vi.useRealTimers();
    });

    it('deve retornar "Boa tarde" entre 12h e 18h', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 1, 14, 0, 0));
      expect(Helpers.getGreeting()).toBe('Boa tarde');
      vi.useRealTimers();
    });

    it('deve retornar "Boa noite" após 18h', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 1, 20, 0, 0));
      expect(Helpers.getGreeting()).toBe('Boa noite');
      vi.useRealTimers();
    });
  });

  // ---- getMonthName / getDayName ----
  describe('getMonthName', () => {
    it('deve retornar nome do mês', () => {
      expect(Helpers.getMonthName(0)).toBe('Janeiro');
      expect(Helpers.getMonthName(11)).toBe('Dezembro');
    });

    it('deve retornar vazio para índice inválido', () => {
      expect(Helpers.getMonthName(12)).toBe('');
    });
  });

  describe('getDayName', () => {
    it('deve retornar nome do dia', () => {
      expect(Helpers.getDayName(0)).toBe('Domingo');
      expect(Helpers.getDayName(6)).toBe('Sábado');
    });
  });

  // ---- downloadFile (via DOM) ----
  describe('downloadFile', () => {
    it('deve criar um link de download no DOM', () => {
      const appendChild = vi.spyOn(document.body, 'appendChild');
      const removeChild = vi.spyOn(document.body, 'removeChild');
      Helpers.downloadFile('test content', 'test.txt', 'text/plain');
      expect(appendChild).toHaveBeenCalled();
      expect(removeChild).toHaveBeenCalled();
    });
  });

  // ---- copyToClipboard ----
  describe('copyToClipboard', () => {
    it('deve copiar texto com clipboard API', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText },
        writable: true,
        configurable: true
      });
      const result = await Helpers.copyToClipboard('test');
      expect(result).toBe(true);
      expect(writeText).toHaveBeenCalledWith('test');
    });

    it('deve usar fallback se clipboard API falhar', async () => {
      // Mock document.execCommand para happy-dom
      const execCommand = vi.fn().mockReturnValue(true);
      document.execCommand = execCommand;

      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: vi.fn().mockRejectedValue(new Error('fail')) },
        writable: true,
        configurable: true
      });
      const result = await Helpers.copyToClipboard('test');
      expect(result).toBe(true);
      expect(execCommand).toHaveBeenCalledWith('copy');
    });
  });

  // ---- isMobile / isTablet / getBreakpoint ----
  describe('isMobile', () => {
    it('deve retornar true para viewport pequeno', () => {
      globalThis.innerWidth = 500;
      expect(Helpers.isMobile()).toBe(true);
    });

    it('deve retornar false para viewport grande', () => {
      globalThis.innerWidth = 1024;
      expect(Helpers.isMobile()).toBe(false);
    });
  });

  describe('isTablet', () => {
    it('deve retornar true para viewport médio', () => {
      globalThis.innerWidth = 800;
      expect(Helpers.isTablet()).toBe(true);
    });

    it('deve retornar false para viewport pequeno', () => {
      globalThis.innerWidth = 500;
      expect(Helpers.isTablet()).toBe(false);
    });
  });

  describe('getBreakpoint', () => {
    it('deve retornar xs para < 576', () => {
      globalThis.innerWidth = 400;
      expect(Helpers.getBreakpoint()).toBe('xs');
    });

    it('deve retornar 2xl para >= 1536', () => {
      globalThis.innerWidth = 1600;
      expect(Helpers.getBreakpoint()).toBe('2xl');
    });
  });

  // ---- exportToCSV ----
  describe('exportToCSV', () => {
    it('deve exportar dados como CSV', () => {
      const spy = vi.spyOn(Helpers, 'downloadFile').mockImplementation(() => {});
      const data = [{ nome: 'Ana', idade: 30 }, { nome: 'João', idade: 25 }];
      Helpers.exportToCSV(data, 'test.csv');
      expect(spy).toHaveBeenCalled();
      const csvContent = spy.mock.calls[0][0];
      expect(csvContent).toContain('nome;idade');
      expect(csvContent).toContain('Ana;30');
      expect(csvContent).toContain('João;25');
      spy.mockRestore();
    });

    it('não deve fazer nada se dados estiverem vazios', () => {
      const spy = vi.spyOn(Helpers, 'downloadFile');
      Helpers.exportToCSV([], 'test.csv');
      expect(spy).not.toHaveBeenCalled();
      Helpers.exportToCSV(null, 'test.csv');
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve escapar campos com ponto-e-vírgula', () => {
      const spy = vi.spyOn(Helpers, 'downloadFile').mockImplementation(() => {});
      const data = [{ desc: 'Item; A' }];
      Helpers.exportToCSV(data);
      expect(spy.mock.calls[0][0]).toContain('"Item; A"');
      spy.mockRestore();
    });
  });

  // ---- scrollToElement ----
  describe('scrollToElement', () => {
    it('não deve fazer nada se elemento for nulo', () => {
      expect(() => Helpers.scrollToElement(null)).not.toThrow();
    });

    it('deve chamar scrollTo no window', () => {
      const el = document.createElement('div');
      el.getBoundingClientRect = () => ({ top: 100 });
      const spy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
      Helpers.scrollToElement(el);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  // ---- initSearch (filterMode: 'dropdown') ----
  describe('initSearch — filterMode dropdown', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('deve retornar undefined no modo dropdown', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="ana">Ana</option>
        </select>
      `;
      const result = Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: vi.fn()
      });
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined se input nulo', () => {
      const result = Helpers.initSearch(null, {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: vi.fn()
      });
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined se selectEl não existir', () => {
      document.body.innerHTML = '<input id="searchTest">';
      const result = Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'naoExiste',
        onSelect: vi.fn()
      });
      expect(result).toBeUndefined();
    });

    it('deve retornar undefined se onSelect não for function', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="ana">Ana</option>
        </select>
      `;
      const result = Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect'
      });
      expect(result).toBeUndefined();
    });

    it('deve filtrar opções pelo texto digitado (case-insensitive)', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
          <option value="fernanda">Fernanda</option>
          <option value="carlos">Carlos</option>
        </select>
      `;
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: vi.fn()
      });

      const input = document.getElementById('searchTest');
      const select = document.getElementById('testSelect');

      input.value = 'camila';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      expect(select.options[1].style.display).toBe('');
      expect(select.options[2].style.display).toBe('none');
      expect(select.options[3].style.display).toBe('none');
    });

    it('deve auto-selecionar o primeiro match entre opções com prefixo comum', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
          <option value="carla">Carla</option>
          <option value="carlos">Carlos</option>
        </select>
      `;
      const onSelect = vi.fn();
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: onSelect
      });

      const input = document.getElementById('searchTest');
      input.value = 'carl';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      const select = document.getElementById('testSelect');
      //"carla" (value) aparece primeiro que "carlos" no DOM
      expect(select.value).toBe('carla');
      expect(onSelect).toHaveBeenCalledWith('carla');
    });

    it('deve pular o placeholder ao filtrar e mantê-lo visível', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
          <option value="fernanda">Fernanda</option>
        </select>
      `;
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: vi.fn()
      });

      const input = document.getElementById('searchTest');
      const select = document.getElementById('testSelect');

      input.value = 'camila';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      // Placeholder (índice 0) permanece visível
      expect(select.options[0].style.display).toBe('');
      expect(select.options[1].style.display).toBe('');
      expect(select.options[2].style.display).toBe('none');
    });

    it('deve mostrar todas as opções quando busca é limpa', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
          <option value="fernanda">Fernanda</option>
          <option value="carlos">Carlos</option>
        </select>
      `;
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: vi.fn()
      });

      const input = document.getElementById('searchTest');
      const select = document.getElementById('testSelect');

      // Filtra primeiro
      input.value = 'camila';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      // Depois limpa
      input.value = '';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      // Todas as opções visíveis novamente
      expect(select.options[1].style.display).toBe('');
      expect(select.options[2].style.display).toBe('');
      expect(select.options[3].style.display).toBe('');
    });

    it('deve chamar onEmpty quando busca é limpa', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
        </select>
      `;
      const onEmpty = vi.fn();
      const onSelect = vi.fn();
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: onSelect,
        onEmpty: onEmpty
      });

      const input = document.getElementById('searchTest');

      // Busca e encontra match
      input.value = 'camila';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onEmpty).not.toHaveBeenCalled();

      // Limpa busca — onEmpty deve disparar
      input.value = '';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);
      expect(onEmpty).toHaveBeenCalledTimes(1);
    });

    it('deve esconder opções que não correspondem ao termo', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
          <option value="fernanda">Fernanda</option>
          <option value="carlos">Carlos</option>
        </select>
      `;
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: vi.fn()
      });

      const input = document.getElementById('searchTest');
      const select = document.getElementById('testSelect');

      input.value = 'fernanda';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      expect(select.options[1].style.display).toBe('none');
      expect(select.options[2].style.display).toBe('');
      expect(select.options[3].style.display).toBe('none');
    });

    it('deve chamar onSelect com o valor do match encontrado', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
          <option value="fernanda">Fernanda</option>
        </select>
      `;
      const onSelect = vi.fn();
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: onSelect
      });

      const input = document.getElementById('searchTest');
      input.value = 'fernanda';
      input.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      expect(onSelect).toHaveBeenCalledWith('fernanda');
    });

    it('deve aceitar element como primeiro argumento em vez de string', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
        </select>
      `;
      const onSelect = vi.fn();
      const inputEl = document.getElementById('searchTest');
      Helpers.initSearch(inputEl, {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: onSelect
      });

      inputEl.value = 'camila';
      inputEl.dispatchEvent(new Event('input'));
      vi.advanceTimersByTime(200);

      expect(onSelect).toHaveBeenCalledWith('camila');
    });

    it('deve respeitar o debounce de 200ms antes de processar', () => {
      document.body.innerHTML = `
        <input id="searchTest">
        <select id="testSelect">
          <option value="">Selecione</option>
          <option value="camila">Dra. Camila</option>
        </select>
      `;
      const onSelect = vi.fn();
      Helpers.initSearch('searchTest', {
        filterMode: 'dropdown',
        selectEl: 'testSelect',
        onSelect: onSelect
      });

      const input = document.getElementById('searchTest');
      input.value = 'camila';
      input.dispatchEvent(new Event('input'));

      // Ainda não deve ter chamado antes do debounce
      expect(onSelect).not.toHaveBeenCalled();

      // Após 150ms ainda não
      vi.advanceTimersByTime(150);
      expect(onSelect).not.toHaveBeenCalled();

      // Passa dos 200ms — deve disparar
      vi.advanceTimersByTime(60);
      expect(onSelect).toHaveBeenCalledWith('camila');
    });
  });
});
