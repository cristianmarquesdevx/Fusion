import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import '../assets/css/main.css';

// Apply saved theme on load
const savedTheme = localStorage.getItem('fusion_theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

// ============================================================
// SERVICE WORKER — PWA / Offline support
// ============================================================
if ('serviceWorker' in navigator) {
  // Registra com atualização automática
  navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  }).then((reg) => {
    console.log('[PWA] Service Worker registrado:', reg.scope);

    // Verifica atualizações a cada 30 minutos
    setInterval(() => {
      reg.update();
    }, 30 * 60 * 1000);

    // Notifica o usuário quando uma nova versão está disponível
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nova versão disponível — mostra notificação amigável
            const updateEvent = new CustomEvent('fusion:update', {
              detail: { version: 'disponível' },
            });
            window.dispatchEvent(updateEvent);
          }
        });
      }
    });
  }).catch((err) => {
    console.warn('[PWA] Falha ao registrar Service Worker:', err.message);
  });

  // Escuta mensagens do SW (fila offline, etc.)
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'QUEUE_SIZE') {
      window.dispatchEvent(new CustomEvent('fusion:queue', {
        detail: { size: data.size || 0 },
      }));
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
