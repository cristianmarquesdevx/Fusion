import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// ---- Mock localStorage para happy-dom ----
const store = {};
const localStorageMock = {
  _data: {},
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i) => Object.keys(store)[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Garante documentElement
if (typeof document !== 'undefined' && !document.documentElement) {
  const el = document.createElement('html');
  document.documentElement = el;
  document.appendChild(el);
}

/**
 * Mock do StorageService para testes
 */
globalThis.StorageService = {
  _store: {},
  _memoryCache: new Map(),
  _prefix: 'fusion_',
  _listeners: new Map(),

  _getTenant() { return ''; },
  _buildKey(key) { return `fusion_${key}`; },

  set(key, value) {
    this._store[key] = { data: value, timestamp: Date.now(), version: 1 };
    this._memoryCache.set(key, value);
    this._emit('set', { key, value });
    return true;
  },
  get(key, defaultValue = null) {
    if (this._memoryCache.has(key)) return this._memoryCache.get(key);
    const stored = this._store[key];
    if (!stored) return defaultValue;
    this._memoryCache.set(key, stored.data);
    return stored.data;
  },
  remove(key) {
    delete this._store[key];
    this._memoryCache.delete(key);
    this._emit('remove', { key });
    return true;
  },
  has(key) { return key in this._store; },
  keys() { return Object.keys(this._store).map(k => k.replace('fusion_', '')); },
  clear() {
    this._store = {};
    this._memoryCache.clear();
    this._emit('clear', {});
    return true;
  },
  getCollection(collectionName) { return this.get(collectionName, []); },
  setCollection(collectionName, data) { return this.set(collectionName, data); },
  addToCollection(collectionName, item) {
    const col = this.getCollection(collectionName);
    const newItem = { ...item, id: item.id || 'test-id' };
    col.push(newItem);
    this.setCollection(collectionName, col);
    return newItem;
  },
  updateInCollection() {},
  removeFromCollection() { return true; },
  findInCollection() { return null; },
  findWhere() { return []; },
  count(collectionName) { return this.getCollection(collectionName).length; },
  getInfo() { return null; },
  _formatBytes() { return '0 B'; },
  on() {},
  _emit() {},
  setTenant() {},
  getTenant() { return null; },
  exportData() { return '{}'; },
  importData() { return true; },
};

/**
 * APP_CONFIG global
 */
globalThis.APP_CONFIG = {
  name: 'Fusion ERP',
  version: '1.0.0',
  storage: { prefix: 'fusion_', type: 'localStorage' },
  theme: { default: 'dark', storageKey: 'fusion-theme', available: ['light', 'dark', 'system'] },
  session: { storageKey: 'fusion_session', keepAlive: true, timeout: 1440 },
  api: { baseUrl: '', supabaseUrl: '', supabaseAnonKey: '', timeout: 30000 },
  pagination: { defaultPageSize: 20, pageSizes: [10, 20, 50, 100] },
  locale: { currency: 'BRL', language: 'pt-BR', timezone: 'America/Sao_Paulo', dateFormat: 'DD/MM/YYYY', timeFormat: 'HH:mm', datetimeFormat: 'DD/MM/YYYY HH:mm' },
  notifications: { position: 'top-right', duration: 5000, maxOnScreen: 5, sound: true },
  premium: { maxClients: Infinity, maxEmployees: Infinity, maxUnits: Infinity, storageLimit: '100GB', support: 'prioritario', features: ['all'] },
  audit: { enabled: true, storageKey: 'fusion_audit_log', retentionDays: 365, maxEntries: 100000 },
  dbVersion: 1,
};

/**
 * CONSTANTS global (necessário para Helpers.getMonthName / getDayName)
 */
globalThis.CONSTANTS = {
  MESES: [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ],
  DIAS_SEMANA: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
};

/**
 * Carrega arquivo fonte expondo variáveis globais via globalThis
 * Em módulos ES, `const` dentro de eval não vaza para o escopo global,
 * então substituímos as declarações explicitamente.
 */
function loadSource(filePath, globalVarNames) {
  let code = fs.readFileSync(filePath, 'utf-8');
  
  for (const varName of globalVarNames) {
    // Substitui `class X {` → `globalThis.X = class X {`
    const classPattern = new RegExp(`^class\\s+(${varName})\\s*{`, 'm');
    code = code.replace(classPattern, `globalThis.$1 = class $1 {`);
    
    // Substitui `const X =` → `globalThis.X =`  ou `let X =` → `globalThis.X =`
    const varPattern = new RegExp(`^(const|let)\\s+(${varName})\\s*=`, 'm');
    code = code.replace(varPattern, `globalThis.$2 =`);
  }
  
  (0, eval)(code);
}

loadSource(path.resolve(projectRoot, 'assets/utils/helpers.js'), ['Helpers']);
loadSource(path.resolve(projectRoot, 'assets/utils/validators.js'), ['Validators']);
loadSource(path.resolve(projectRoot, 'assets/js/store.js'), ['FusionStore', 'Fusion']);
