import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/playfair-display/500.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import './styles/global.css';
import { App } from './App';
import { requestPersistentStorage } from './hooks/useOfflineStatus';
import type { OfflineState } from './hooks/useOfflineStatus';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

function setOfflineState(s: OfflineState) {
  window.__offlineState = s;
  window.dispatchEvent(new CustomEvent<OfflineState>('pwa:state', { detail: s }));
}

if ('serviceWorker' in navigator) {
  setOfflineState('pending');
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      // If the SW is already active when we register, the precache is in place.
      if (registration?.active) {
        setOfflineState('ready');
      }
    },
    onOfflineReady() {
      setOfflineState('ready');
    },
    onNeedRefresh() {
      setOfflineState('updated');
    },
  });

  // Ask the browser to keep our data even if storage gets tight or app is unused.
  // Safe to call on every load; no-op once already persistent.
  void requestPersistentStorage();
}
