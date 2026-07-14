/**
 * useLocalNotifications
 *
 * Hook que verifica periodicamente notificações agendadas no localStorage
 * (via scheduleLocalNotification) e as dispara na hora certa.
 *
 * Usado para:
 *  - Lembretes de agendamentos (30min antes)
 *  - Notificações de fila de espera (vaga disponível)
 *  - Alertas de estoque baixo
 */
import { useEffect, useRef } from 'react';
import {
  getScheduledNotifications,
  showLocalNotification,
  cancelScheduledNotification,
} from '../services/push-notifications';

const CHECK_INTERVAL = 30_000; // 30s

export default function useLocalNotifications(active = true) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const check = () => {
      const list = getScheduledNotifications();
      const now = Date.now();

      list.forEach((notif) => {
        const scheduledTime = new Date(notif.scheduledAt).getTime();

        // Tolerância de 60s para não perder por pequenas diferenças
        if (scheduledTime <= now && scheduledTime > now - 60_000) {
          showLocalNotification(notif.title, {
            body: notif.body,
            tag: notif.type,
            data: notif.data,
          });

          cancelScheduledNotification(notif.id);
        }
      });
    };

    // Checa imediatamente na montagem
    check();

    intervalRef.current = setInterval(check, CHECK_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);
}
