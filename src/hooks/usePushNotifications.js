/**
 * usePushNotifications
 *
 * Hook React que expõe o estado e controles das notificações push:
 *  - subscriptionStatus { supported, permission, subscribed, vapidConfigured }
 *  - subscribe() / unsubscribe() / requestPermission()
 *  - loading state
 */
import { useState, useEffect, useCallback } from 'react';
import {
  getPushStatus,
  subscribe as doSubscribe,
  unsubscribe as doUnsubscribe,
  requestPermission as doRequestPermission,
} from '../services/push-notifications';

export default function usePushNotifications() {
  const [status, setStatus] = useState({
    supported: false,
    permission: 'default',
    subscribed: false,
    vapidConfigured: false,
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const s = await getPushStatus();
      setStatus(s);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestPermission = useCallback(async () => {
    const result = await doRequestPermission();
    if (result === 'granted') {
      // Tenta inscrever automaticamente após permissão
      await doSubscribe();
    }
    await refresh();
    return result;
  }, [refresh]);

  const subscribe = useCallback(async () => {
    setLoading(true);
    await doSubscribe();
    await refresh();
  }, [refresh]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    await doUnsubscribe();
    await refresh();
  }, [refresh]);

  return {
    status,
    loading,
    requestPermission,
    subscribe,
    unsubscribe,
    refresh,
  };
}
