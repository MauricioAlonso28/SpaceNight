import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { RUTAS_BARRA } from '../../app/rutas';
import './BarraInferior.css';

const ICONOS: Record<string, ReactNode> = {
  'esta-noche': <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  mapa: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 10l6.5-2.5-1 7.5-5.5-1z" />
    </>
  ),
  camara: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  explorar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
};

/** Barra de navegación fija con las cuatro pantallas principales. */
export function BarraInferior() {
  return (
    <div className="barra-inferior">
      <nav aria-label="Pantallas">
        {RUTAS_BARRA.map((ruta) => (
          <NavLink key={ruta.path} to={`/${ruta.path}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICONOS[ruta.path]}
            </svg>
            <span>{ruta.nombre}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
