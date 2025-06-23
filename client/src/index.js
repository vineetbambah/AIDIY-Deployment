import React from 'react';
import ReactDOM from 'react-dom/client';
import { install } from '@twind/core';
import config from './twind.config';
import './index.css';
import App from './App';

// Initialize Twind
install(config);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
