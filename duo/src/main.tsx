import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker?.register('./sw.js').catch(() => {});
    } catch {
      /* service workers unavailable (e.g. sandboxed preview) */
    }
  });
}
