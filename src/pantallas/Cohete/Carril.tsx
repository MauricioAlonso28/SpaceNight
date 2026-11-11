import { useEffect, useRef } from 'react';
import { textos } from '../../idioma/idioma';
import type { ComponenteCohete, ZonaCohete } from './catalogo';

const ES = {
  carril: 'Recorrido por el cohete',
  ayuda: 'Desliza aquí para bajar de la punta a los motores.',
  interior: 'interior',
  material: 'material',
};

const EN: typeof ES = {
  carril: 'Tour of the rocket',
  ayuda: 'Scroll here to go down from the nose to the engines.',
  interior: 'inside',
  material: 'material',
};

/**
 * Carril lateral del recorrido: cada paso es un componente y el scroll mueve la cámara.
 * @param bloqueado mientras hay una pieza fuera, el carril se atenúa y no mueve la cámara
 * @param alProgreso recibe la posición del scroll en pasos, con decimales (0 es el primero)
 */
export function Carril({
  componentes,
  zonas,
  activo,
  bloqueado,
  alProgreso,
}: {
  componentes: ComponenteCohete[];
  zonas: ZonaCohete[];
  activo: number;
  bloqueado: boolean;
  alProgreso: (progreso: number) => void;
}) {
  const t = textos({ es: ES, en: EN });
  const carril = useRef<HTMLDivElement>(null);
  const nombreZona = (id: string) => {
    const z = zonas.find((zona) => zona.id === id);
    return z ? textos(z.nombre) : id;
  };

  const altoPaso = () =>
    carril.current?.querySelector<HTMLElement>('.cohete-paso')?.offsetHeight ??
    1;

  const alDeslizar = () => {
    const div = carril.current;
    if (div) alProgreso(div.scrollTop / altoPaso());
  };

  const irA = (i: number) => {
    carril.current?.scrollTo({ top: i * altoPaso(), behavior: 'smooth' });
  };

  useEffect(() => {
    carril.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div
      className={`cohete-carril${bloqueado ? ' bloqueado' : ''}`}
      aria-disabled={bloqueado || undefined}
      ref={carril}
      tabIndex={0}
      role="region"
      aria-label={t.carril}
      onScroll={alDeslizar}
    >
      <div className="cohete-carril-margen">
        <p>{t.ayuda}</p>
      </div>
      <ol>
        {componentes.map((c, i) => (
          <li
            key={c.id}
            className="cohete-paso"
            aria-current={i === activo ? 'step' : undefined}
          >
            <button type="button" onClick={() => irA(i)}>
              <span className="cohete-paso-numero">
                {String(c.recorrido).padStart(2, '0')} · {nombreZona(c.zona)}
              </span>
              <strong>{textos(c.nombre)}</strong>
              <span className="cohete-paso-resumen">{textos(c.resumen)}</span>
              {c.interior && (
                <span className="cohete-etiqueta">{t.interior}</span>
              )}
              {c.tipo === 'material' && (
                <span className="cohete-etiqueta">{t.material}</span>
              )}
            </button>
          </li>
        ))}
      </ol>
      <div className="cohete-carril-margen" />
    </div>
  );
}
