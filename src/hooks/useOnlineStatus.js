/** @format */

/**
 * Fusion ERP v2 — Hook de Status Online/Offline
 *
 * Monitora a conectividade com a rede e mantém estado reativo
 * para exibir indicadores visuais de conectividade.
 */

import { useState, useEffect, useCallback } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [queueSize, setQueueSize] = useState(0);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    // Tenta sincronizar fila offline ao reconectar
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
    }
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Escuta eventos do Service Worker (fila offline)
    const handleQueue = (e) => {
      setQueueSize(e.detail?.size || 0);
    };

    const handleUpdate = () => {
      setUpdateAvailable(true);
    };

    window.addEventListener('fusion:queue', handleQueue);
    window.addEventListener('fusion:update', handleUpdate);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('fusion:queue', handleQueue);
      window.removeEventListener('fusion:update', handleUpdate);
    };
  }, [handleOnline, handleOffline]);

  // Verifica periodicamente (a cada 60s) para detectar mudanças de rede
  useEffect(() => {
    const interval = setInterval(() => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        // Pede tamanho da fila
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'GET_QUEUE_SIZE' });
        }
      }
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  const checkNow = useCallback(() => {
    setChecking(true);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SYNC_NOW' });
    } else {
      // Sem SW, encerra após breve delay
      setTimeout(() => setChecking(false), 500);
    }
    // Fallback: se não receber resposta em 10s, para de mostrar "sincronizando"
    const timeout = setTimeout(() => setChecking(false), 10000);
    const handleSyncComplete = (e) => {
      if (e.data?.type === 'SYNC_COMPLETE') {
        clearTimeout(timeout);
        setChecking(false);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleSyncComplete, { once: true });
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    queueSize,
    updateAvailable,
    checking,
    dismissUpdate,
    checkNow,
  };
}
