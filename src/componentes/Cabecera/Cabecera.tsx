import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { RUTA_AJUSTES, nombreRuta } from '../../app/rutas';
import { Campana } from '../Avisos/Campana';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { nombreLugar } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import { formatearFechaLarga, formatearHora } from '../../servicios/formato';
import './Cabecera.css';

/** Si la página ya bajó algo: la franja de arriba solo se vuelve sólida entonces. */
function useDesplazada(): boolean {
  const [desplazada, setDesplazada] = useState(false);
  useEffect(() => {
    const revisar = () => setDesplazada(window.scrollY > 4);
    revisar();
    window.addEventListener('scroll', revisar, { passive: true });
    return () => window.removeEventListener('scroll', revisar);
  }, []);
  return desplazada;
}

/** Título, lugar y fecha de hoy, reloj local y acceso a Ajustes; en escritorio es la franja fija de arriba. */
export function Cabecera() {
  const desplazada = useDesplazada();
  const ahora = useAhora();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const lugar = nombreLugar(ubicacion);

  return (
    <header className={`cabecera${desplazada ? ' desplazada' : ''}`}>
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
        <Campana />
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
