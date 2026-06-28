import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root.jsx';
import { I18nProvider } from './i18n/I18nContext.jsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the service worker for the installable PWA shell (PNR-3).
// `registerSW` already no-ops where the API is missing; the extra feature
// guard keeps the intent explicit and avoids touching `navigator` in non-DOM
// environments (e.g. SSR/test). autoUpdate applies new shells silently.
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  registerSW({ immediate: true });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <Root />
    </I18nProvider>
  </React.StrictMode>
);
