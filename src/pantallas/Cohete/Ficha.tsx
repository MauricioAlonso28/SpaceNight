import { useEffect, useRef } from 'react';
import { textos } from '../../idioma/idioma';
import type { ComponenteCohete } from './catalogo';

const ES = {
  paraQue: 'Para qué sirve',
  comoFunciona: 'Cómo funciona',
  material: 'De qué está hecho',
  datos: 'Datos',
  otrosUsos: 'Otros usos',
  enCohetes: 'En cohetes reales',
  fuentes: 'Fuentes',
  orientativo:
    'Las cifras son orientativas: describen un cohete genérico, no uno real.',
  pendiente: 'La ficha completa de este componente está en preparación.',
  volver: 'Volver al cohete',
  ayuda: 'O arrastra a la izquierda, desliza con dos dedos o pulsa Esc.',
  interior: 'interior',
  material2: 'material',
};

const EN: typeof ES = {
  paraQue: 'What it is for',
  comoFunciona: 'How it works',
  material: 'What it is made of',
  datos: 'Figures',
  otrosUsos: 'Other uses',
  enCohetes: 'On real rockets',
  fuentes: 'Sources',
  orientativo:
    'Figures are approximate: they describe a generic rocket, not a real one.',
  pendiente: 'The full card for this component is being written.',
  volver: 'Back to the rocket',
  ayuda: 'Or drag left, swipe with two fingers or press Esc.',
  interior: 'inside',
  material2: 'material',
};

/**
 * Los seis campos de una ficha, la nota de cifras orientativas y las fuentes.
 * @param Titulo nivel de los títulos de cada campo, según dónde se muestre
 */
export function ContenidoFicha({
  componente,
  Titulo = 'h4',
}: {
  componente: ComponenteCohete;
  Titulo?: 'h4' | 'h5';
}) {
  const t = textos({ es: ES, en: EN });
  const { ficha } = componente;
  if (!ficha) return <p className="cohete-ficha-nota">{t.pendiente}</p>;

  const seccion = (titulo: string, texto: string) => (
    <section>
      <Titulo>{titulo}</Titulo>
      <p>{texto}</p>
    </section>
  );

  return (
    <>
      {seccion(t.paraQue, textos(ficha.paraQue))}
      {seccion(t.comoFunciona, textos(ficha.comoFunciona))}
      {seccion(t.material, textos(ficha.material))}
      <section>
        <Titulo>{t.datos}</Titulo>
        <dl>
          {ficha.datos.map((d) => (
            <div key={d.etiqueta.es}>
              <dt>{textos(d.etiqueta)}</dt>
              <dd>{textos(d.valor)}</dd>
            </div>
          ))}
        </dl>
      </section>
      {seccion(t.otrosUsos, textos(ficha.otrosUsos))}
      {seccion(t.enCohetes, textos(ficha.enCohetes))}
      <p className="cohete-ficha-nota">{t.orientativo}</p>
      <section>
        <Titulo>{t.fuentes}</Titulo>
        <ul className="cohete-ficha-fuentes">
          {ficha.fuentes.map((f) => (
            <li key={f.url}>
              <a href={f.url} target="_blank" rel="noreferrer">
                {f.titulo}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** Número, zona y etiquetas de un componente, en una línea; sin zona cuando ya la dice el título de su grupo. */
export function LineaZona({
  componente,
  zona,
}: {
  componente: ComponenteCohete;
  zona: string;
}) {
  const t = textos({ es: ES, en: EN });
  return (
    <span className="cohete-ficha-zona">
      {String(componente.recorrido).padStart(2, '0')}
      {zona && ` · ${zona}`}
      {componente.interior && (
        <span className="cohete-etiqueta">{t.interior}</span>
      )}
      {componente.tipo === 'material' && (
        <span className="cohete-etiqueta">{t.material2}</span>
      )}
    </span>
  );
}

/**
 * Ficha de un componente, a la derecha de la pieza centrada.
 * @param zona nombre visible de la zona del componente
 * @param alVolver devuelve la pieza al cohete
 */
export function Ficha({
  componente,
  zona,
  alVolver,
}: {
  componente: ComponenteCohete;
  zona: string;
  alVolver: () => void;
}) {
  const t = textos({ es: ES, en: EN });
  const boton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    boton.current?.focus({ preventScroll: true });
  }, [componente.id]);

  return (
    <aside
      className="cohete-ficha"
      aria-labelledby="t-ficha"
      key={componente.id}
    >
      <p>
        <LineaZona componente={componente} zona={zona} />
      </p>
      <h3 id="t-ficha">{textos(componente.nombre)}</h3>
      <p className="cohete-ficha-resumen">{textos(componente.resumen)}</p>
      <ContenidoFicha componente={componente} />
      <div className="cohete-ficha-pie">
        <button
          type="button"
          className="cohete-boton"
          ref={boton}
          onClick={alVolver}
        >
          ← {t.volver}
        </button>
        <small>{t.ayuda}</small>
      </div>
    </aside>
  );
}
