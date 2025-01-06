import React from 'react';
import { createRoot } from 'react-dom/client';
import RPSGame from './components/RPSGame';

// Initialize React 18 with createRoot
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <RPSGame />
  </React.StrictMode>
);
