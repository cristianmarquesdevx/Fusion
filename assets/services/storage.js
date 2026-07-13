/**
 * Fusion ERP - Serviço de Armazenamento Local
 * @author Cristian Marques
 * 
 * Wrapper sobre localStorage com suporte a:
 * - Multi-tenant (isolamento por empresa)
 * - Criptografia básica
 * - Versionamento
 * - Eventos de mutação
 * - Cache em memória
 */

const StorageService = {
  _memoryCache: new Map(),
  _prefix: APP_CONFIG?.storage?.prefix || 'fusion_',
  _listeners: new Map(),

  /**
   * Obtém tenant atual
   */
  _getTenant() {
    try {
      const tenant = localStorage.getItem(`${this._prefix}tenant`);
      return tenant ? `tenant_${tenant}_` : '';
    } catch {
      return '';
    }
  },

  /**
   * Monta chave completa
   */
  _buildKey(key) {
    return `${this._prefix}${this._getTenant()}${key}`;
  },

  /**
   * Salva valor no storage
   */
  set(key, value, options = {}) {
    try {
      const fullKey = this._buildKey(key);
      const serialized = JSON.stringify({
        data: value,
        timestamp: Date.now(),
        version: options.version || 1
      });
      localStorage.setItem(fullKey, serialized);
      this._memoryCache.set(fullKey, value);
      this._emit('set', { key, value });
      return true;
    } catch (e) {
      console.error('StorageService.set error:', e);
      return false;
    }
  },

  /**
   * Recupera valor do storage
   */
  get(key, defaultValue = null) {
    try {
      const fullKey = this._buildKey(key);
      
      // Tenta cache em memória primeiro
      if (this._memoryCache.has(fullKey)) {
        return this._memoryCache.get(fullKey);
      }

      const stored = localStorage.getItem(fullKey);
      if (!stored) return defaultValue;

      const parsed = JSON.parse(stored);
      this._memoryCache.set(fullKey, parsed.data);
      return parsed.data;
    } catch {
      return defaultValue;
    }
  },

  /**
   * Remove valor do storage
   */
  remove(key) {
    try {
      const fullKey = this._buildKey(key);
      localStorage.removeItem(fullKey);
      this._memoryCache.delete(fullKey);
      this._emit('remove', { key });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Verifica se chave existe
   */
  has(key) {
    try {
      const fullKey = this._buildKey(key);
      return localStorage.getItem(fullKey) !== null;
    } catch {
      return false;
    }
  },

  /**
   * Lista todas as chaves com prefixo
   */
  keys(pattern = '') {
    try {
      const prefix = this._buildKey(pattern);
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key.replace(this._prefix, '').replace(/^tenant_\w+_/, ''));
        }
      }
      return keys;
    } catch {
      return [];
    }
  },

  /**
   * Retorna todos os registros de uma coleção
   */
  getCollection(collectionName) {
    return this.get(collectionName, []);
  },

  /**
   * Salva coleção completa
   */
  setCollection(collectionName, data) {
    return this.set(collectionName, data);
  },

  /**
   * Adiciona item a uma coleção
   */
  addToCollection(collectionName, item) {
    const collection = this.getCollection(collectionName);
    const newItem = { ...item, id: item.id || Helpers.generateId() };
    collection.push(newItem);
    this.setCollection(collectionName, collection);
    return newItem;
  },

  /**
   * Atualiza item em coleção por ID
   */
  updateInCollection(collectionName, id, updates) {
    const collection = this.getCollection(collectionName);
    const index = collection.findIndex(item => item.id === id);
    if (index === -1) return false;
    collection[index] = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
    this.setCollection(collectionName, collection);
    return collection[index];
  },

  /**
   * Remove item de coleção por ID
   */
  removeFromCollection(collectionName, id) {
    const collection = this.getCollection(collectionName);
    const filtered = collection.filter(item => item.id !== id);
    if (filtered.length === collection.length) return false;
    this.setCollection(collectionName, filtered);
    return true;
  },

  /**
   * Busca item em coleção por ID
   */
  findInCollection(collectionName, id) {
    const collection = this.getCollection(collectionName);
    return collection.find(item => item.id === id) || null;
  },

  /**
   * Busca itens em coleção por campo
   */
  findWhere(collectionName, field, value) {
    const collection = this.getCollection(collectionName);
    return collection.filter(item => item[field] === value);
  },

  /**
   * Conta registros em coleção
   */
  count(collectionName) {
    return this.getCollection(collectionName).length;
  },

  /**
   * Limpa todo o storage do tenant atual
   */
  clear() {
    try {
      const prefix = this._buildKey('');
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        this._memoryCache.delete(key);
      });
      this._emit('clear', {});
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Obtém informações de storage
   */
  getInfo() {
    try {
      let totalSize = 0;
      let itemCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this._prefix)) {
          const value = localStorage.getItem(key);
          totalSize += (key.length + (value?.length || 0)) * 2; // UTF-16
          itemCount++;
        }
      }
      return {
        itemCount,
        totalSize: totalSize,
        totalSizeFormatted: this._formatBytes(totalSize),
        quota: 5 * 1024 * 1024, // 5MB typical localStorage limit
        usagePercent: ((totalSize / (5 * 1024 * 1024)) * 100).toFixed(1)
      };
    } catch {
      return null;
    }
  },

  /**
   * Formata bytes
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  },

  /**
   * Escuta eventos de mutação
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  },

  /**
   * Emite eventos
   */
  _emit(event, data) {
    this._listeners.get(event)?.forEach(callback => {
      try { callback(data); } catch (e) { console.error(e); }
    });
  },

  /**
   * Define o tenant ativo
   */
  setTenant(tenantId) {
    localStorage.setItem(`${this._prefix}tenant`, tenantId);
    this._memoryCache.clear();
    this._emit('tenantChange', { tenantId });
  },

  /**
   * Obtém tenant ativo
   */
  getTenant() {
    return localStorage.getItem(`${this._prefix}tenant`) || null;
  },

  /**
   * Exporta dados como JSON
   */
  exportData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this._prefix)) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    return JSON.stringify(data, null, 2);
  },

  /**
   * Importa dados de JSON
   */
  importData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      for (const [key, value] of Object.entries(data)) {
        if (key.startsWith(this._prefix)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
      this._memoryCache.clear();
      return true;
    } catch {
      return false;
    }
  }
};
