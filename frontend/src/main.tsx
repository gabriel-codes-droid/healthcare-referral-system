import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';
import { flushOfflineQueue } from './services/api';

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
window.addEventListener('online', () => { flushOfflineQueue().catch(console.error); });

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
