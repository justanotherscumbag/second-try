import React from 'react';
import { createRoot } from 'react-dom/client';
import RPSGame from './components/RPSGame';

// Remove any window.ethereum references since we're not using Web3
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <RPSGame />
    </React.StrictMode>
  );
});
