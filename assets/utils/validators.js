/**
 * Fusion ERP - Validadores de Formulários
 * @author Cristian Marques
 */

const Validators = {
  /**
   * Valida CPF
   */
  isCPF(value) {
    const cpf = value?.replace(/\D/g, '');
    if (!cpf || cpf.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
    let remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true;
  },

  /**
   * Valida CNPJ
   */
  isCNPJ(value) {
    const cnpj = value?.replace(/\D/g, '');
    if (!cnpj || cnpj.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpj)) return false;

    let size = cnpj.length - 2;
    let numbers = cnpj.substring(0, size);
    const digits = cnpj.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size += 1;
    numbers = cnpj.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  },

  /**
   * Valida documento (CPF ou CNPJ)
   */
  isDocument(value) {
    if (!value) return false;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 11) return this.isCPF(cleaned);
    if (cleaned.length === 14) return this.isCNPJ(cleaned);
    return false;
  },

  /**
   * Valida email
   */
  isEmail(value) {
    if (!value) return false;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },

  /**
   * Valida telefone (10 ou 11 dígitos)
   */
  isPhone(value) {
    if (!value) return false;
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

  /**
   * Valida CEP
   */
  isCEP(value) {
    if (!value) return false;
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 8;
  },

  /**
   * Valida URL
   */
  isURL(value) {
    if (!value) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Valida se é número
   */
  isNumber(value) {
    if (value === null || value === undefined || value === '') return false;
    return !isNaN(Number(value));
  },

  /**
   * Valida se é inteiro
   */
  isInteger(value) {
    if (!this.isNumber(value)) return false;
    return Number.isInteger(Number(value));
  },

  /**
   * Valida se está entre min e max
   */
  isBetween(value, min, max) {
    if (!this.isNumber(value)) return false;
    const num = Number(value);
    return num >= min && num <= max;
  },

  /**
   * Valida data
   */
  isDate(value) {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  /**
   * Valida se é data futura
   */
  isFutureDate(value) {
    if (!this.isDate(value)) return false;
    return new Date(value) > new Date();
  },

  /**
   * Valida se é data passada
   */
  isPastDate(value) {
    if (!this.isDate(value)) return false;
    return new Date(value) < new Date();
  },

  /**
   * Valida hora (HH:mm)
   */
  isTime(value) {
    if (!value) return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(value);
  },

  /**
   * Valida comprimento mínimo
   */
  minLength(value, min) {
    if (!value) return false;
    return String(value).length >= min;
  },

  /**
   * Valida comprimento máximo
   */
  maxLength(value, max) {
    if (!value) return true;
    return String(value).length <= max;
  },

  /**
   * Valida comprimento exato
   */
  exactLength(value, length) {
    if (!value) return false;
    return String(value).length === length;
  },

  /**
   * Valida campo obrigatório
   */
  isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  },

  /**
   * Valida senha forte
   * - Mínimo 8 caracteres
   * - Pelo menos 1 letra maiúscula
   * - Pelo menos 1 letra minúscula
   * - Pelo menos 1 número
   * - Pelo menos 1 caractere especial
   */
  isStrongPassword(value) {
    if (!value || value.length < 8) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/;
    return regex.test(value);
  },

  /**
   * Retorna nível de força da senha (0-4)
   */
  passwordStrength(value) {
    if (!value) return 0;
    let strength = 0;
    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[@$!%*?&]/.test(value)) strength++;
    return strength;
  },

  /**
   * Valida formulário completo
   * @param {Object} fields - { fieldName: { value, rules } }
   * @returns {Object} { isValid, errors }
   */
  validateForm(fields) {
    const errors = {};
    let isValid = true;

    for (const [fieldName, field] of Object.entries(fields)) {
      const { value, rules } = field;
      const fieldErrors = [];

      for (const rule of rules) {
        const { type, params, message } = rule;
        let valid = true;

        switch (type) {
          case 'required':
            valid = this.isRequired(value);
            break;
          case 'email':
            valid = !value || this.isEmail(value);
            break;
          case 'phone':
            valid = !value || this.isPhone(value);
            break;
          case 'cpf':
            valid = !value || this.isCPF(value);
            break;
          case 'cnpj':
            valid = !value || this.isCNPJ(value);
            break;
          case 'document':
            valid = !value || this.isDocument(value);
            break;
          case 'cep':
            valid = !value || this.isCEP(value);
            break;
          case 'minLength':
            valid = !value || this.minLength(value, params);
            break;
          case 'maxLength':
            valid = !value || this.maxLength(value, params);
            break;
          case 'min':
            valid = !value || this.isNumber(value) && Number(value) >= params;
            break;
          case 'max':
            valid = !value || this.isNumber(value) && Number(value) <= params;
            break;
          case 'time':
            valid = !value || this.isTime(value);
            break;
          case 'date':
            valid = !value || this.isDate(value);
            break;
          case 'futureDate':
            valid = !value || this.isFutureDate(value);
            break;
          case 'password':
            valid = !value || this.minLength(value, 6);
            break;
          case 'match':
            valid = value === params;
            break;
          default:
            valid = true;
        }

        if (!valid) {
          fieldErrors.push(message || `Campo inválido: ${fieldName}`);
        }
      }

      if (fieldErrors.length > 0) {
        errors[fieldName] = fieldErrors;
        isValid = false;
      }
    }

    return { isValid, errors };
  },

  /**
   * Mostra erros de validação no formulário
   */
  showFormErrors(formElement, errors) {
    // Limpa erros anteriores
    formElement.querySelectorAll('.field-error').forEach(el => el.remove());
    formElement.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    for (const [fieldName, fieldErrors] of Object.entries(errors)) {
      const input = formElement.querySelector(`[name="${fieldName}"]`);
      if (!input) continue;

      input.classList.add('is-invalid');

      const errorDiv = document.createElement('div');
      errorDiv.className = 'field-error';
      errorDiv.textContent = fieldErrors[0];
      input.parentNode.appendChild(errorDiv);
    }
  },

  /**
   * Limpa erros de validação
   */
  clearFormErrors(formElement) {
    formElement.querySelectorAll('.field-error').forEach(el => el.remove());
    formElement.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  },

  /**
   * Máscara de telefone (aplica formatação (XX) XXXXX-XXXX)
   */
  maskPhone(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    let formatted = '';
    if (val.length > 0) formatted = '(' + val.slice(0, Math.min(2, val.length));
    if (val.length > 2) formatted += ') ' + val.slice(2, Math.min(7, val.length));
    if (val.length > 7) formatted += '-' + val.slice(7, 11);
    input.value = formatted;
  },

  /**
   * Máscara de CPF (aplica formatação XXX.XXX.XXX-XX)
   */
  maskCPF(input) {
    let val = input.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    let formatted = '';
    if (val.length > 0) formatted = val.slice(0, Math.min(3, val.length));
    if (val.length > 3) formatted += '.' + val.slice(3, Math.min(6, val.length));
    if (val.length > 6) formatted += '.' + val.slice(6, Math.min(9, val.length));
    if (val.length > 9) formatted += '-' + val.slice(9, 11);
    input.value = formatted;
  }
};
