import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const rootEl = document.documentElement;
rootEl.classList.remove('light');
rootEl.classList.add('dark');
document.body.classList.add('bg-gray-900');
document.body.classList.add('text-white');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

