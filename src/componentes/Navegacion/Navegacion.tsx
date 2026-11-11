import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import { RUTAS_BARRA, nombreRuta } from '../../app/rutas';
import { textos } from '../../idioma/idioma';
import './Navegacion.css';

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
  cohete: (
    <>
      <path d="M12 2.5c2.9 2.3 4.4 5.8 4.4 9.9v4.1H7.6v-4.1c0-4.1 1.5-7.6 4.4-9.9z" />
      <circle cx="12" cy="10" r="1.8" />
      <path d="M7.6 13.2 5 16.4v3.1h2.6M16.4 13.2l2.6 3.2v3.1h-2.6M10.4 19.2 12 21.8l1.6-2.6" />
    </>
  ),
};

/** Si la página ya bajó algo: la barra de arriba solo se vuelve sólida entonces. */
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

/** Navegación entre pantallas: barra inferior en el móvil y barra superior en escritorio, transparente arriba del todo. */
export function Navegacion() {
  const desplazada = useDesplazada();
  return (
    <div className={`navegacion${desplazada ? ' desplazada' : ''}`}>
      <nav aria-label={textos({ es: 'Pantallas', en: 'Screens' })}>
        {RUTAS_BARRA.map((ruta) => (
          <NavLink key={ruta.path} to={`/${ruta.path}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {ICONOS[ruta.path]}
            </svg>
            <span>{nombreRuta(ruta)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
