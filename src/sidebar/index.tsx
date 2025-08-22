import React from 'react';
import { createRoot } from 'react-dom/client';
// Zod v4.0.17 handles CSP gracefully without intervention
import App from './App';
import './styles/globals.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
