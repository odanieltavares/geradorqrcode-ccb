import React from 'react';
import ReactDOM from 'react-dom/client';
// Corrija o caminho para apontar para a nova localização do arquivo
import App from './src/App'; 

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);