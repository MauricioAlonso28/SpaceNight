import { lazy } from 'react';
import { Link } from 'react-router';
import { RUTAS_COHETE, nombreRuta } from '../../app/rutas';
import { useEsEscritorio } from '../../app/escritorio';
import { textos } from '../../idioma/idioma';
import './Cohete.css';

const VistaCohete = lazy(() =>
  import('./VistaCohete').then((m) => ({ default: m.VistaCohete })),
);

const ES = {
  titulo: 'Cohete',
  aviso: 'El cohete en 3D necesita una pantalla grande',
  detalle:
    'El cohete en 3D se gira, se acerca y se desarma pieza a pieza con el ratón o el trackpad, y pesa demasiado para un teléfono.',
  como: 'Ábrela en una computadora, en una ventana de al menos 1024 px de ancho.',
  otras: 'El resto de la sección sí funciona aquí:',
};

const EN: typeof ES = {
  titulo: 'Rocket',
  aviso: 'The 3D rocket needs a large screen',
  detalle:
    'The 3D rocket is turned, zoomed and taken apart piece by piece with a mouse or trackpad, and it is too heavy for a phone.',
  como: 'Open it on a computer, in a window at least 1024 px wide.',
  otras: 'The rest of the section works right here:',
};

/** Sección Cohete: la vista 3D en escritorio y, en pantallas chicas o táctiles, un aviso con enlaces al resto de la sección, sin cargar el 3D. */
export function Cohete() {
  const escritorio = useEsEscritorio();
  if (escritorio) return <VistaCohete />;

  const t = textos({ es: ES, en: EN });
  return (
    <section className="cohete" aria-labelledby="t-cohete">
      <h2 id="t-cohete" className="cohete-titulo">
        {t.titulo}
      </h2>
      <div className="cohete-aviso" role="note">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M8 20h8M12 16v4" />
        </svg>
        <h3>{t.aviso}</h3>
        <p>{t.detalle}</p>
        <p>{t.como}</p>
      </div>
      <nav className="cohete-otras" aria-label={t.otras}>
        <p>{t.otras}</p>
        <ul>
          {RUTAS_COHETE.map((r) => (
            <li key={r.path}>
              <Link to={`/${r.path}`}>{nombreRuta(r)} →</Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
