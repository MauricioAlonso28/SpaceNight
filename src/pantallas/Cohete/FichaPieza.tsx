import { useEffect, useRef } from 'react';
import { textos } from '../../idioma/idioma';
import type { FuenteFicha } from './catalogo';
import type { PiezaModelo } from './etapasSaturno';

const ES = {
  datos: 'Datos',
  fuentes: 'Fuentes',
  corte:
    'El modelo de la NASA venía en una sola pieza: las etapas se cortaron por alturas, así que los bordes son aproximados.',
  volver: (modelo: string) => `Volver al ${modelo}`,
  ayuda: 'O pulsa Esc, o haz clic fuera del cohete.',
};

const EN: typeof ES = {
  datos: 'Figures',
  fuentes: 'Sources',
  corte:
    "NASA's model came in one piece: the stages were cut by height, so the edges are approximate.",
  volver: (modelo) => `Back to the ${modelo}`,
  ayuda: 'Or press Esc, or click outside the rocket.',
};

/**
 * Ficha de una pieza de un modelo de la NASA, a la derecha de la pieza sacada.
 * @param modelo nombre visible del modelo entero, para el botón de volver
 * @param alVolver devuelve la pieza a su sitio
 */
export function FichaPieza({
  pieza,
  modelo,
  fuentes,
  alVolver,
}: {
  pieza: PiezaModelo;
  modelo: string;
  fuentes: FuenteFicha[];
  alVolver: () => void;
}) {
  const t = textos({ es: ES, en: EN });
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    boton.current?.focus({ preventScroll: true });
  }, [pieza.id]);

  return (
    <aside
      className="cohete-ficha cohete-ficha-pieza"
      aria-labelledby={`pieza-${pieza.id}`}
    >
      <span className="cohete-ficha-zona">{textos(pieza.papel)}</span>
      <h3 id={`pieza-${pieza.id}`}>{textos(pieza.nombre)}</h3>
      <p className="cohete-ficha-resumen">{textos(pieza.resumen)}</p>
      <h4>{t.datos}</h4>
      <dl>
        {pieza.datos.map((d) => (
          <div key={d.etiqueta.es}>
            <dt>{textos(d.etiqueta)}</dt>
            <dd>{textos(d.valor)}</dd>
          </div>
        ))}
      </dl>
      <p className="cohete-ficha-nota">{t.corte}</p>
      <h4>{t.fuentes}</h4>
      <ul className="cohete-ficha-fuentes">
        {fuentes.map((f) => (
          <li key={f.url}>
            <a href={f.url} target="_blank" rel="noreferrer">
              {f.titulo}
            </a>
          </li>
        ))}
      </ul>
      <div className="cohete-ficha-pie">
        <button
          ref={boton}
          type="button"
          className="cohete-boton"
          onClick={alVolver}
        >
          ← {t.volver(modelo)}
        </button>
        <small>{t.ayuda}</small>
      </div>
    </aside>
  );
}
