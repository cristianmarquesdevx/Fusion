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
  navigator.serviceWorker.register('/sw.js', {
    scope: '/',
    updateViaCache: 'none',
  }).then((reg) => {
    // Auto-update check every 30 minutes
    setInterval(() => {
      reg.update();
    }, 30 * 60 * 1000);

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            const updateEvent = new CustomEvent('fusion:update', {
              detail: { version: 'disponível' },
            });
            window.dispatchEvent(updateEvent);
          }
        });
      }
    });

    // Init push notification service after SW is ready
    reg.ready.then(() => {
      import('./services/push-notifications.js').then(({ initPushService }) => {
        initPushService();
      }).catch(() => {
        // Push service not critical — silently ignore
      });
    });
  }).catch(() => {
    // Silently handle SW registration failure
  });

  // Listen for SW messages (offline queue, push, etc.)
  navigator.serviceWorker.addEventListener('message', (event) => {
    const data = event.data || {};
    if (data.type === 'QUEUE_SIZE') {
      window.dispatchEvent(new CustomEvent('fusion:queue', {
        detail: { size: data.size || 0 },
      }));
    }
    if (data.type === 'PUSH_NOTIFICATION') {
      // Dispatch custom event so React components can pick it up
      window.dispatchEvent(new CustomEvent('fusion:push-notification', {
        detail: data.payload || {},
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
