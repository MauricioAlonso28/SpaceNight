import { Link, Outlet } from 'react-router';
import { BarraInferior } from './BarraInferior';
import { RUTA_AJUSTES } from './rutas';
import './Layout.css';

/** Marco común: cabecera con acceso a Ajustes, contenido y barra inferior. */
export function Layout() {
  return (
    <div className="layout">
      <header className="cabecera">
        <span className="cabecera-titulo">Tu cielo esta noche</span>
        <Link
          to={`/${RUTA_AJUSTES.path}`}
          className="cabecera-ajustes"
          aria-label={RUTA_AJUSTES.nombre}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
          </svg>
        </Link>
      </header>
      <main className="contenido">
        <Outlet />
      </main>
      <BarraInferior />
    </div>
  );
}
