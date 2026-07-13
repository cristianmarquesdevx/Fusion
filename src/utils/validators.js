/** @format */

/**
 * Fusion ERP v2 — Validadores de Formulários
 */

export const Validators = {
  isEmail(value) {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  isPhone(value) {
    if (!value) return false;
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 11;
  },

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

  isRequired(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  },

  minLength(value, min) {
    if (!value) return false;
    return String(value).length >= min;
  },

  validateForm(fields) {
    const errors = {};
    let isValid = true;
    for (const [fieldName, field] of Object.entries(fields)) {
      const { value, rules } = field;
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
          case 'minLength':
            valid = !value || this.minLength(value, params);
            break;
          default:
            valid = true;
        }
        if (!valid) {
          if (!errors[fieldName]) errors[fieldName] = [];
          errors[fieldName].push(message || `Campo inválido: ${fieldName}`);
          isValid = false;
        }
      }
    }
    return { isValid, errors };
  },
};
