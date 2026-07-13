import { describe, it, expect, vi, beforeEach } from 'vitest';

// Validators is loaded as a global via setup.js

describe('Validators', () => {

  // ---- isCPF ----
  describe('isCPF', () => {
    it('deve validar CPF verdadeiro', () => {
      // CPF válido conhecido
      expect(Validators.isCPF('529.982.247-25')).toBe(true);
    });

    it('deve validar outro CPF verdadeiro', () => {
      expect(Validators.isCPF('935.411.347-80')).toBe(true);
    });

    it('deve rejeitar CPF com dígitos repetidos', () => {
      expect(Validators.isCPF('111.111.111-11')).toBe(false);
      expect(Validators.isCPF('000.000.000-00')).toBe(false);
    });

    it('deve rejeitar CPF com dígitos verificadores errados', () => {
      expect(Validators.isCPF('529.982.247-24')).toBe(false);
    });

    it('deve rejeitar CPF com menos de 11 dígitos', () => {
      expect(Validators.isCPF('123.456.789')).toBe(false);
    });

    it('deve rejeitar null/undefined', () => {
      expect(Validators.isCPF(null)).toBe(false);
      expect(Validators.isCPF(undefined)).toBe(false);
    });
  });

  // ---- isCNPJ ----
  describe('isCNPJ', () => {
    it('deve validar CNPJ verdadeiro', () => {
      expect(Validators.isCNPJ('11.444.777/0001-61')).toBe(true);
    });

    it('deve rejeitar CNPJ com dígitos repetidos', () => {
      expect(Validators.isCNPJ('11.111.111/1111-11')).toBe(false);
    });

    it('deve rejeitar CNPJ com dígitos verificadores errados', () => {
      expect(Validators.isCNPJ('11.444.777/0001-60')).toBe(false);
    });

    it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
      expect(Validators.isCNPJ('12.345.678/0001')).toBe(false);
    });
  });

  // ---- isDocument ----
  describe('isDocument', () => {
    it('deve validar CPF', () => {
      expect(Validators.isDocument('529.982.247-25')).toBe(true);
    });

    it('deve validar CNPJ', () => {
      expect(Validators.isDocument('11.444.777/0001-61')).toBe(true);
    });

    it('deve rejeitar documento inválido', () => {
      expect(Validators.isDocument('123')).toBe(false);
    });

    it('deve rejeitar null', () => {
      expect(Validators.isDocument(null)).toBe(false);
    });
  });

  // ---- isEmail ----
  describe('isEmail', () => {
    it('deve validar emails corretos', () => {
      expect(Validators.isEmail('user@example.com')).toBe(true);
      expect(Validators.isEmail('nome.sobrenome@empresa.com.br')).toBe(true);
      expect(Validators.isEmail('user+tag@domain.co')).toBe(true);
    });

    it('deve rejeitar emails inválidos', () => {
      expect(Validators.isEmail('invalido')).toBe(false);
      expect(Validators.isEmail('sem@dominio')).toBe(false);
      expect(Validators.isEmail('')).toBe(false);
      expect(Validators.isEmail('@dominio.com')).toBe(false);
    });
  });

  // ---- isPhone ----
  describe('isPhone', () => {
    it('deve validar telefone com 11 dígitos', () => {
      expect(Validators.isPhone('(11) 98221-4410')).toBe(true);
    });

    it('deve validar telefone com 10 dígitos', () => {
      expect(Validators.isPhone('(11) 3322-4455')).toBe(true);
    });

    it('deve rejeitar telefone curto', () => {
      expect(Validators.isPhone('12345')).toBe(false);
    });

    it('deve rejeitar null', () => {
      expect(Validators.isPhone(null)).toBe(false);
    });
  });

  // ---- isCEP ----
  describe('isCEP', () => {
    it('deve validar CEP', () => {
      expect(Validators.isCEP('12345-678')).toBe(true);
      expect(Validators.isCEP('12345678')).toBe(true);
    });

    it('deve rejeitar CEP curto', () => {
      expect(Validators.isCEP('1234')).toBe(false);
    });

    it('deve rejeitar null', () => {
      expect(Validators.isCEP(null)).toBe(false);
    });
  });

  // ---- isURL ----
  describe('isURL', () => {
    it('deve validar URLs corretas', () => {
      expect(Validators.isURL('https://example.com')).toBe(true);
      expect(Validators.isURL('http://site.com.br/pagina')).toBe(true);
    });

    it('deve rejeitar URLs inválidas', () => {
      expect(Validators.isURL('not-a-url')).toBe(false);
      expect(Validators.isURL('')).toBe(false);
    });
  });

  // ---- isNumber ----
  describe('isNumber', () => {
    it('deve validar números', () => {
      expect(Validators.isNumber(42)).toBe(true);
      expect(Validators.isNumber('42')).toBe(true);
      expect(Validators.isNumber(3.14)).toBe(true);
    });

    it('deve rejeitar não-números', () => {
      expect(Validators.isNumber('abc')).toBe(false);
      expect(Validators.isNumber(null)).toBe(false);
      expect(Validators.isNumber(undefined)).toBe(false);
      expect(Validators.isNumber('')).toBe(false);
    });
  });

  // ---- isInteger ----
  describe('isInteger', () => {
    it('deve validar inteiros', () => {
      expect(Validators.isInteger(42)).toBe(true);
      expect(Validators.isInteger('42')).toBe(true);
    });

    it('deve rejeitar decimais', () => {
      expect(Validators.isInteger(3.14)).toBe(false);
    });

    it('deve rejeitar não-números', () => {
      expect(Validators.isInteger('abc')).toBe(false);
    });
  });

  // ---- isBetween ----
  describe('isBetween', () => {
    it('deve validar valor dentro do intervalo', () => {
      expect(Validators.isBetween(5, 1, 10)).toBe(true);
      expect(Validators.isBetween(1, 1, 10)).toBe(true);
      expect(Validators.isBetween(10, 1, 10)).toBe(true);
    });

    it('deve rejeitar valor fora do intervalo', () => {
      expect(Validators.isBetween(0, 1, 10)).toBe(false);
      expect(Validators.isBetween(11, 1, 10)).toBe(false);
    });

    it('deve rejeitar não-número', () => {
      expect(Validators.isBetween('abc', 1, 10)).toBe(false);
    });
  });

  // ---- isDate ----
  describe('isDate', () => {
    it('deve validar datas', () => {
      expect(Validators.isDate('2024-01-01')).toBe(true);
      expect(Validators.isDate(new Date())).toBe(true);
    });

    it('deve rejeitar datas inválidas', () => {
      expect(Validators.isDate('not-a-date')).toBe(false);
      expect(Validators.isDate('')).toBe(false);
    });
  });

  // ---- isFutureDate ----
  describe('isFutureDate', () => {
    it('deve validar data futura', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(Validators.isFutureDate(future.toISOString())).toBe(true);
    });

    it('deve rejeitar data passada', () => {
      expect(Validators.isFutureDate('2020-01-01')).toBe(false);
    });
  });

  // ---- isPastDate ----
  describe('isPastDate', () => {
    it('deve validar data passada', () => {
      expect(Validators.isPastDate('2020-01-01')).toBe(true);
    });

    it('deve rejeitar data futura', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(Validators.isPastDate(future.toISOString())).toBe(false);
    });
  });

  // ---- isTime ----
  describe('isTime', () => {
    it('deve validar horários corretos', () => {
      expect(Validators.isTime('09:00')).toBe(true);
      expect(Validators.isTime('23:59')).toBe(true);
      expect(Validators.isTime('00:00')).toBe(true);
    });

    it('deve rejeitar horários inválidos', () => {
      expect(Validators.isTime('24:00')).toBe(false);
      expect(Validators.isTime('09:60')).toBe(false);
      expect(Validators.isTime('9:00')).toBe(false);
    });
  });

  // ---- minLength / maxLength / exactLength ----
  describe('minLength', () => {
    it('deve validar comprimento mínimo', () => {
      expect(Validators.minLength('abc', 3)).toBe(true);
      expect(Validators.minLength('ab', 3)).toBe(false);
    });
  });

  describe('maxLength', () => {
    it('deve validar comprimento máximo', () => {
      expect(Validators.maxLength('ab', 3)).toBe(true);
      expect(Validators.maxLength('abcd', 3)).toBe(false);
    });

    it('deve retornar true para valor vazio', () => {
      expect(Validators.maxLength('', 3)).toBe(true);
    });
  });

  describe('exactLength', () => {
    it('deve validar comprimento exato', () => {
      expect(Validators.exactLength('abc', 3)).toBe(true);
      expect(Validators.exactLength('ab', 3)).toBe(false);
    });

    it('deve retornar false para valor vazio', () => {
      expect(Validators.exactLength('', 3)).toBe(false);
    });
  });

  // ---- isRequired ----
  describe('isRequired', () => {
    it('deve validar campos preenchidos', () => {
      expect(Validators.isRequired('texto')).toBe(true);
      expect(Validators.isRequired([1, 2])).toBe(true);
      expect(Validators.isRequired({ a: 1 })).toBe(true);
      expect(Validators.isRequired(0)).toBe(true);
      expect(Validators.isRequired(false)).toBe(true);
    });

    it('deve rejeitar campos vazios', () => {
      expect(Validators.isRequired('')).toBe(false);
      expect(Validators.isRequired('   ')).toBe(false);
      expect(Validators.isRequired([])).toBe(false);
      expect(Validators.isRequired({})).toBe(false);
      expect(Validators.isRequired(null)).toBe(false);
      expect(Validators.isRequired(undefined)).toBe(false);
    });
  });

  // ---- isStrongPassword ----
  describe('isStrongPassword', () => {
    it('deve validar senha forte', () => {
      expect(Validators.isStrongPassword('Abcd@123')).toBe(true);
      expect(Validators.isStrongPassword('Str0ng!Pass')).toBe(true);
    });

    it('deve rejeitar senha fraca', () => {
      expect(Validators.isStrongPassword('12345678')).toBe(false);
      expect(Validators.isStrongPassword('abcdefgh')).toBe(false);
      expect(Validators.isStrongPassword('ABCDEFGH')).toBe(false);
      expect(Validators.isStrongPassword('Abcd1234')).toBe(false); // sem especial
      expect(Validators.isStrongPassword('Ab@1')).toBe(false); // muito curta
    });
  });

  // ---- passwordStrength ----
  describe('passwordStrength', () => {
    it('deve retornar 0 para vazio', () => {
      expect(Validators.passwordStrength('')).toBe(0);
      expect(Validators.passwordStrength(null)).toBe(0);
    });

    it('deve retornar 2 para 8+ caracteres com número', () => {
      // 8 chars (1) + contém número (1) = 2
      expect(Validators.passwordStrength('12345678')).toBe(2);
    });

    it('deve retornar 2 para 12+ caracteres', () => {
      expect(Validators.passwordStrength('abcdefghijkl')).toBe(2);
    });

    it('deve retornar 3 com maiúsculas e minúsculas', () => {
      expect(Validators.passwordStrength('Abcdefgh')).toBe(2); // 8 chars + case = 2
    });

    it('deve retornar 4 com número', () => {
      expect(Validators.passwordStrength('Abcdefg1')).toBe(3); // 8 chars + case + number = 3
    });

    it('deve retornar 5 com especial', () => {
      expect(Validators.passwordStrength('Abcd@123')).toBe(4); // 8 chars + case + number + special = 4
    });
  });

  // ---- validateForm ----
  describe('validateForm', () => {
    it('deve validar formulário completo com sucesso', () => {
      const result = Validators.validateForm({
        nome: { value: 'Ana', rules: [{ type: 'required', message: 'Nome obrigatório' }] },
        email: { value: 'ana@test.com', rules: [{ type: 'email', message: 'Email inválido' }] },
        idade: { value: 25, rules: [{ type: 'min', params: 18, message: 'Maior de idade' }] },
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('deve capturar erros de validação', () => {
      const result = Validators.validateForm({
        nome: { value: '', rules: [{ type: 'required', message: 'Nome obrigatório' }] },
        email: { value: 'invalido', rules: [{ type: 'email', message: 'Email inválido' }] },
        cpf: { value: '111.111.111-11', rules: [{ type: 'cpf', message: 'CPF inválido' }] },
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.nome).toBeDefined();
      expect(result.errors.email).toBeDefined();
      expect(result.errors.cpf).toBeDefined();
    });

    it('deve validar múltiplos tipos de regra', () => {
      const result = Validators.validateForm({
        telefone: { value: '1199999', rules: [{ type: 'phone', message: 'Telefone inválido' }] },
        cep: { value: '12345', rules: [{ type: 'cep', message: 'CEP inválido' }] },
        senha: { value: '123', rules: [{ type: 'password', message: 'Senha fraca' }] },
      });
      expect(result.isValid).toBe(false);
    });

    it('deve validar regras opcionais (valor vazio)', () => {
      const result = Validators.validateForm({
        email: { value: '', rules: [{ type: 'email', message: 'Email inválido' }] },
        cpf: { value: '', rules: [{ type: 'cpf', message: 'CPF inválido' }] },
      });
      expect(result.isValid).toBe(true);
    });

    it('deve validar regra match', () => {
      const result = Validators.validateForm({
        senha: { value: 'abc123', rules: [{ type: 'match', params: 'abc123', message: 'Senhas não conferem' }] },
      });
      expect(result.isValid).toBe(true);
    });

    it('deve rejeitar match diferente', () => {
      const result = Validators.validateForm({
        senha: { value: 'abc', rules: [{ type: 'match', params: 'xyz', message: 'Senhas não conferem' }] },
      });
      expect(result.isValid).toBe(false);
    });
  });

  // ---- showFormErrors / clearFormErrors (DOM) ----
  describe('showFormErrors', () => {
    let form;

    beforeEach(() => {
      document.body.innerHTML = `
        <form id="testForm">
          <div class="form-group">
            <input name="nome" value="">
          </div>
          <div class="form-group">
            <input name="email" value="">
          </div>
        </form>
      `;
      form = document.getElementById('testForm');
    });

    it('deve adicionar classes de erro e mensagens', () => {
      Validators.showFormErrors(form, {
        nome: ['Nome obrigatório'],
        email: ['Email inválido'],
      });
      const nomeInput = form.querySelector('[name="nome"]');
      const emailInput = form.querySelector('[name="email"]');
      expect(nomeInput.classList.contains('is-invalid')).toBe(true);
      expect(emailInput.classList.contains('is-invalid')).toBe(true);
      expect(form.querySelectorAll('.field-error').length).toBe(2);
    });

    it('deve limpar erros anteriores antes de adicionar novos', () => {
      // Adiciona erros
      Validators.showFormErrors(form, { nome: ['Erro 1'] });
      // Adiciona novamente (deve limpar primeiro)
      Validators.showFormErrors(form, { nome: ['Erro 2'] });
      expect(form.querySelectorAll('.field-error').length).toBe(1);
      expect(form.querySelector('.field-error').textContent).toBe('Erro 2');
    });
  });

  describe('clearFormErrors', () => {
    let form;

    beforeEach(() => {
      document.body.innerHTML = `
        <form id="testForm">
          <div class="form-group">
            <input name="nome" class="is-invalid">
            <div class="field-error">Erro</div>
          </div>
          <div class="form-group">
            <input name="email" class="is-invalid">
            <div class="field-error">Erro</div>
          </div>
        </form>
      `;
      form = document.getElementById('testForm');
    });

    it('deve remover todas as classes e mensagens de erro', () => {
      Validators.clearFormErrors(form);
      expect(form.querySelectorAll('.is-invalid').length).toBe(0);
      expect(form.querySelectorAll('.field-error').length).toBe(0);
    });
  });
});
