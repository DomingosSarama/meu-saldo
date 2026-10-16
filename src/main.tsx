import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App, { StorageBoundary } from './App';
import './styles/global.css';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorageBoundary>
      <App />
    </StorageBoundary>
  </StrictMode>,
);
