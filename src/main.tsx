import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initPWA } from './lib/pwa';
import { StoreProvider } from './state/store';
import './styles.css';

initPWA();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
