import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registro de Service Worker PWA para soporte offline
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión de DownPeso disponible.');
  },
  onOfflineReady() {
    console.log('DownPeso está lista para funcionar completamente offline.');
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
