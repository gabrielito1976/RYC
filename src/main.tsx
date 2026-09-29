import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register Service Worker for 100% offline functionality in field/offline conditions
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión de la aplicación disponible.');
  },
  onOfflineReady() {
    console.log('Aplicación lista para funcionar 100% sin conexión a internet.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

