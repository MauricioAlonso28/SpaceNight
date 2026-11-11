import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './estilos/fuentes.css';
import './estilos/tokens.css';
import './estilos/globales.css';
import { medirBarraScroll } from './app/barraScroll';
import { vigilarVersiones } from './app/actualizacion';

medirBarraScroll();
vigilarVersiones();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
