import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import { RUTAS_BARRA } from './rutas';

const ICONOS: Record<string, ReactNode> = {
  'esta-noche': <path d="M15 3a8 8 0 1 0 6 13.3A7 7 0 0 1 15 3z" />,
  mapa: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 1.5 3.5L17 12l-3.5 1.5L12 17l-1.5-3.5L7 12l3.5-1.5z" />
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
      <circle cx="12" cy="12" r="4" />
      <ellipse cx="12" cy="12" rx="10" ry="3.5" transform="rotate(-20 12 12)" />
    </>
  ),
};

/** Barra de navegación fija con las cuatro pantallas principales. */
export function BarraInferior() {
  return (
    <nav className="barra-inferior" aria-label="Pantallas">
      {RUTAS_BARRA.map((ruta) => (
        <NavLink key={ruta.path} to={`/${ruta.path}`} className="barra-enlace">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {ICONOS[ruta.path]}
          </svg>
          <span>{ruta.nombre}</span>
        </NavLink>
      ))}
    </nav>
  );
}
