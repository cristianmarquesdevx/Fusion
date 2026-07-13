/**
 * Fusion ERP - Service Worker Registration & Offline Manager
 * @author Cristian Marques
 *
 * Gerencia:
 * - Registro do service worker
 * - Banner de status offline/online
 * - Fila de sincronizacao de mutacoes
 * - Notificacoes de conectividade
 */
(function() {
  'use strict';

  var OfflineManager = {
    _registered: false,
    _sw: null,
    _isOnline: navigator.onLine,
    _listeners: {},
    _syncInProgress: false,
    _checkInterval: null,

    /**
     * Inicializa o gerenciador offline
     */
    init: function() {
      if (!('serviceWorker' in navigator)) {
        console.warn('[Offline] Service Worker nao suportado pelo navegador.');
        this._notify('unsupported');
        return false;
      }

      this._register();
      this._listenConnectivity();
      this._injectBanner();
      this._injectBadge();

      // Verifica conectividade periodica
      this._checkInterval = setInterval(this._ping.bind(this), 30000);

      return true;
    },

    /**
     * Registra o service worker
     */
    _register: function() {
      var self = this;

      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      }).then(function(registration) {
        self._registered = true;
        self._sw = registration.installing ||
                   registration.waiting ||
                   registration.active;
        console.log('[Offline] Service Worker registrado com sucesso');

        // Escuta atualizacoes do SW
        registration.addEventListener('updatefound', function() {
          var newSW = registration.installing;
          if (newSW) {
            newSW.addEventListener('statechange', function() {
              if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versao disponivel
                self._notify('update_available');
              }
            });
          }
        });

        // Se ja tem SW ativo, envia mensagem de sync pendente
        if (registration.active) {
          self._sw = registration.active;
          self._sendMessage({ type: 'GET_QUEUE_SIZE' });
        }

      }).catch(function(err) {
        console.warn('[Offline] Falha ao registrar Service Worker:', err.message);
        self._notify('register_error');
      });

      // Escuta mensagens do SW
      navigator.serviceWorker.addEventListener('message', function(event) {
        self._handleSWMessage(event.data);
      });
    },

    /**
     * Processa mensagens recebidas do Service Worker
     */
    _handleSWMessage: function(data) {
      if (!data) return;

      switch (data.type) {
        case 'QUEUE_SIZE':
          this._updateBadge(data.size);
          break;
        case 'SYNC_COMPLETE':
          this._syncInProgress = false;
          if (data.count > 0) {
            this._notify('sync_complete', { count: data.count });
            this._showNotification(data.count + ' operacoes sincronizadas com o servidor.', 'success');
          }
          this._updateBadge(0);
          break;
      }
    },

    /**
     * Envia mensagem para o Service Worker
     */
    _sendMessage: function(msg) {
      if (this._sw) {
        this._sw.postMessage(msg);
      } else if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(msg);
      }
    },

    /**
     * Escuta eventos de conectividade
     */
    _listenConnectivity: function() {
      var self = this;

      window.addEventListener('online', function() {
        self._isOnline = true;
        self._onOnline();
      });

      window.addEventListener('offline', function() {
        self._isOnline = false;
        self._onOffline();
      });
    },

    /**
     * Callback quando online
     */
    _onOnline: function() {
      console.log('[Offline] Conexao restabelecida');
      this._updateBanner('online');
      this._notify('online');

      // Tenta sincronizar fila pendente
      this.syncNow();

      // Atualiza store auth/sync status se disponivel
      if (typeof Fusion !== 'undefined') {
        Fusion.commit('ui/addNotification', {
          type: 'success',
          message: 'Conexao restabelecida. Dados sincronizados.'
        });
      }
    },

    /**
     * Callback quando offline
     */
    _onOffline: function() {
      console.log('[Offline] Conexao perdida');
      this._updateBanner('offline');
      this._notify('offline');

      if (typeof Fusion !== 'undefined') {
        Fusion.commit('ui/addNotification', {
          type: 'warning',
          message: 'Voce esta offline. Alteracoes serao salvas localmente e sincronizadas automaticamente.'
        });
      }
    },

    /**
     * Verifica conectividade com ping
     */
    _ping: function() {
      var wasOnline = this._isOnline;

      // Tenta um fetch simples para testar conectividade
      fetch('/sw.js', { method: 'HEAD', cache: 'no-store' })
        .then(function() {
          if (!wasOnline) {
            window.dispatchEvent(new Event('online'));
          }
        })
        .catch(function() {
          if (wasOnline) {
            window.dispatchEvent(new Event('offline'));
          }
        });
    },

    /**
     * Injeta banner de status offline na pagina
     */
    _injectBanner: function() {
      if (document.getElementById('fusionOfflineBanner')) return;

      var banner = document.createElement('div');
      banner.id = 'fusionOfflineBanner';
      banner.style.cssText = [
        'position:fixed',
        'top:0',
        'left:0',
        'right:0',
        'z-index:99999',
        'padding:8px 16px',
        'text-align:center',
        'font-size:13px',
        'font-weight:600',
        'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
        'transition:transform 0.3s ease, opacity 0.3s ease',
        'transform:translateY(-100%)',
        'opacity:0',
        'pointer-events:none'
      ].join(';');

      banner.innerHTML = [
        '<span id="offlineBannerIcon" style="display:inline-block;vertical-align:middle;margin-right:8px;">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:middle;">',
        '<path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0"/>',
        '</svg>',
        '</span>',
        '<span id="offlineBannerText">Sem conexao com a internet. Operando em modo offline.</span>'
      ].join('');

      document.body.appendChild(banner);
      this._bannerEl = banner;
    },

    /**
     * Atualiza banner de acordo com status
     */
    _updateBanner: function(status) {
      if (!this._bannerEl) return;

      if (status === 'offline') {
        this._bannerEl.style.background = '#B14E3D';
        this._bannerEl.style.color = '#fff';
        this._bannerEl.style.transform = 'translateY(0)';
        this._bannerEl.style.opacity = '1';
        this._bannerEl.style.pointerEvents = 'auto';
      } else {
        this._bannerEl.style.background = '#4C7A5E';
        this._bannerEl.style.color = '#fff';
        var textEl = document.getElementById('offlineBannerText');
        if (textEl) textEl.textContent = 'Conexao restabelecida.';

        // Mostra por 3 segundos e esconde
        this._bannerEl.style.transform = 'translateY(0)';
        this._bannerEl.style.opacity = '1';

        var self = this;
        setTimeout(function() {
          self._bannerEl.style.transform = 'translateY(-100%)';
          self._bannerEl.style.opacity = '0';
          self._bannerEl.style.pointerEvents = 'none';
        }, 3000);
      }
    },

    /**
     * Injeta badge de fila de sincronizacao
     */
    _injectBadge: function() {
      if (document.getElementById('fusionSyncBadge')) return;

      var badge = document.createElement('div');
      badge.id = 'fusionSyncBadge';
      badge.style.cssText = [
        'position:fixed',
        'bottom:16px',
        'right:16px',
        'z-index:99998',
        'display:none',
        'align-items:center',
        'gap:6px',
        'padding:8px 14px',
        'border-radius:20px',
        'font-size:12px',
        'font-weight:600',
        'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
        'background:#2a2a35',
        'color:#e0e0e0',
        'border:1px solid #3a3a45',
        'box-shadow:0 4px 16px rgba(0,0,0,0.3)',
        'cursor:pointer',
        'transition:opacity 0.3s ease'
      ].join(';');

      badge.innerHTML = [
        '<svg viewBox="0 0 24 24" fill="none" stroke="#FDCB6E" stroke-width="2" style="width:14px;height:14px;">',
        '<polyline points="23 4 23 10 17 10"/>',
        '<path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>',
        '</svg>',
        '<span id="syncBadgeText">0 operacoes pendentes</span>'
      ].join('');

      badge.addEventListener('click', function() {
        OfflineManager.syncNow();
      });

      document.body.appendChild(badge);
      this._badgeEl = badge;
    },

    /**
     * Atualiza badge com tamanho da fila
     */
    _updateBadge: function(size) {
      if (!this._badgeEl) return;

      var textEl = document.getElementById('syncBadgeText');
      if (size > 0) {
        this._badgeEl.style.display = 'flex';
        if (textEl) textEl.textContent = size + ' operacoes pendentes';
      } else {
        this._badgeEl.style.display = 'none';
      }
    },

    /**
     * Forca sincronizacao agora
     */
    syncNow: function() {
      if (this._syncInProgress) return;
      this._syncInProgress = true;

      var syncTextEl = document.getElementById('syncBadgeText');
      if (syncTextEl) syncTextEl.textContent = 'Sincronizando...';

      this._sendMessage({ type: 'SYNC_NOW' });

      // Timeout de seguranca
      var self = this;
      setTimeout(function() {
        self._syncInProgress = false;
        self._updateBadge(0);
      }, 15000);
    },

    /**
     * Adiciona mutacao manualmente a fila de sincronizacao
     * @param {string} url - URL da API
     * @param {string} method - Metodo HTTP
     * @param {Object} headers - Headers
     * @param {string} body - Body da requisicao
     */
    addMutation: function(url, method, headers, body) {
      if (!this._registered) return false;

      this._sendMessage({
        type: 'ADD_MUTATION',
        mutation: {
          url: url,
          method: method || 'POST',
          headers: headers || {},
          body: body || null
        }
      });

      this._showNotification('Operacao enfileirada para sincronizacao.', 'info');
      return true;
    },

    /**
     * Verifica se esta online
     */
    isOnline: function() {
      return this._isOnline;
    },

    /**
     * Escuta eventos do offline manager
     */
    on: function(event, callback) {
      if (!this._listeners[event]) {
        this._listeners[event] = [];
      }
      this._listeners[event].push(callback);

      return function() {
        OfflineManager._listeners[event] = OfflineManager._listeners[event].filter(function(cb) {
          return cb !== callback;
        });
      };
    },

    /**
     * Notifica listeners
     */
    _notify: function(event, data) {
      (this._listeners[event] || []).forEach(function(cb) {
        try { cb(data || {}); } catch(e) { console.error(e); }
      });
    },

    /**
     * Mostra notificacao toast
     */
    _showNotification: function(message, type) {
      if (typeof Helpers !== 'undefined' && Helpers.showToast) {
        Helpers.showToast(message, type);
      } else {
        // Fallback: toast simples
        var toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = [
          'position:fixed',
          'bottom:70px',
          'right:16px',
          'padding:10px 16px',
          'border-radius:10px',
          'font-size:12.5px',
          'font-weight:600',
          'z-index:99997',
          'color:#fff',
          'box-shadow:0 4px 12px rgba(0,0,0,0.2)',
          'animation:fadein 0.2s ease'
        ].join(';');
        toast.style.background = type === 'error' ? '#B14E3D' : type === 'info' ? '#5B7ABF' : '#4C7A5E';
        document.body.appendChild(toast);
        setTimeout(function() { toast.remove(); }, 3000);
      }
    },

    /**
     * Status do sistema offline
     */
    getStatus: function() {
      return {
        isOnline: this._isOnline,
        swRegistered: this._registered,
        swActive: !!this._sw,
        syncInProgress: this._syncInProgress
      };
    }
  };

  // Expoe globalmente
  window.OfflineManager = OfflineManager;

  // Inicializa automaticamente apos o DOM
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    OfflineManager.init();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      OfflineManager.init();
    });
  }

})();
