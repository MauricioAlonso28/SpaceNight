import { Link } from 'react-router';
import { RUTA_AJUSTES, nombreRuta } from '../../app/rutas';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { nombreLugar } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import { formatearFechaLarga, formatearHora } from '../../servicios/formato';
import './Cabecera.css';

/** Título, lugar y fecha de hoy, reloj local y acceso a Ajustes. */
export function Cabecera() {
  const ahora = useAhora();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const lugar = nombreLugar(ubicacion);

  return (
    <header className="cabecera">
      <div>
        <h1>SpaceNight</h1>
        <p className="cabecera-lugar">
          {lugar}, {formatearFechaLarga(ahora, ubicacion.zona)}
        </p>
      </div>
      <div className="cabecera-derecha">
        <p
          className="cabecera-reloj"
          aria-label={textos({
            es: `Hora en ${lugar}`,
            en: `Time in ${lugar}`,
          })}
        >
          {formatearHora(ahora, ubicacion.zona, formato24h)}
        </p>
        <Link
          to={`/${RUTA_AJUSTES.path}`}
          className="cabecera-ajustes"
          aria-label={nombreRuta(RUTA_AJUSTES)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
