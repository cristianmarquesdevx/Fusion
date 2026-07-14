/** @format */

/**
 * Fusion ERP v2 — Serviço de Armazenamento Local
 */

const PREFIX = 'fusion_';

export const StorageService = {
  _cache: new Map(),

  _buildKey(key) {
    return `${PREFIX}${key}`;
  },

  set(key, value) {
    try {
      const fullKey = this._buildKey(key);
      const serialized = JSON.stringify({ data: value, timestamp: Date.now() });
      localStorage.setItem(fullKey, serialized);
      this._cache.set(fullKey, value);
      return true;
    } catch (e) {
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const fullKey = this._buildKey(key);
      if (this._cache.has(fullKey)) return this._cache.get(fullKey);
      const stored = localStorage.getItem(fullKey);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      this._cache.set(fullKey, parsed.data);
      return parsed.data;
    } catch {
      return defaultValue;
    }
  },

  remove(key) {
    try {
      const fullKey = this._buildKey(key);
      localStorage.removeItem(fullKey);
      this._cache.delete(fullKey);
      return true;
    } catch {
      return false;
    }
  },

  clear() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) keys.push(key);
      }
      keys.forEach((k) => {
        localStorage.removeItem(k);
        this._cache.delete(k);
      });
      return true;
    } catch {
      return false;
    }
  },
};
