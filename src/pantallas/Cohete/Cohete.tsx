import { lazy } from 'react';
import { useEsEscritorio } from '../../app/escritorio';
import { textos } from '../../idioma/idioma';
import './Cohete.css';

const VistaCohete = lazy(() =>
  import('./VistaCohete').then((m) => ({ default: m.VistaCohete })),
);

const ES = {
  titulo: 'Cohete',
  aviso: 'Esta sección necesita una pantalla grande',
  detalle:
    'El cohete en 3D se gira, se acerca y se desarma pieza a pieza con el ratón o el trackpad, y pesa demasiado para un teléfono.',
  como: 'Ábrela en una computadora, en una ventana de al menos 1024 px de ancho.',
};

const EN: typeof ES = {
  titulo: 'Rocket',
  aviso: 'This section needs a large screen',
  detalle:
    'The 3D rocket is turned, zoomed and taken apart piece by piece with a mouse or trackpad, and it is too heavy for a phone.',
  como: 'Open it on a computer, in a window at least 1024 px wide.',
};

/** Sección Cohete: la vista 3D en escritorio y un aviso en pantallas chicas o táctiles, sin cargar el 3D. */
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
    </section>
  );
}
