if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  (AbortSignal as any).timeout = function (ms: number) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

// Early Safe Mode & integrity sanitizer before React tree mounts
try {
  if (typeof localStorage !== 'undefined') {
    const isSafeMode = localStorage.getItem('helix_safe_mode') === 'true';
    if (isSafeMode) {
      console.warn('[Helix OS] Safe Mode Active: Running early storage sanitization...');
      // Validate settings
      const rawSettings = localStorage.getItem('helix_settings');
      if (rawSettings) {
        try {
          JSON.parse(rawSettings);
        } catch {
          localStorage.removeItem('helix_settings');
        }
      }
      // Validate custom apps
      const rawApps = localStorage.getItem('helix_custom_apps');
      if (rawApps) {
        try {
          JSON.parse(rawApps);
        } catch {
          localStorage.removeItem('helix_custom_apps');
        }
      }
    }
  }
} catch {
  // Ignore local storage security or access exceptions
}

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { RootErrorBoundary } from './components/ErrorBoundary';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with autoUpdate only in production
if (import.meta.env.PROD) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] New Helix OS version available; updating worker cache.');
    },
    onOfflineReady() {
      console.log('[PWA] Helix OS is ready for complete offline operation.');
    },
    onRegisterError(error) {
      console.warn('[PWA] Service worker registration notice:', error);
    },
  });
} else {
  // In development, ensure stale service worker registrations are cleared to avoid module fetch collisions
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </StrictMode>,
);


