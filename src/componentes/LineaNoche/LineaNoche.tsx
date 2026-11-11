import type { CSSProperties } from 'react';
import type { Astro } from '../../3d/escenaAstro';
import { textos } from '../../idioma/idioma';
import { Retrato } from '../Retrato/Retrato';
import './LineaNoche.css';

/** Un tramo de barra en fracciones de la ventana (0 a 1). */
export interface TramoLinea {
  desde: number;
  hasta: number;
}

/**
 * Una fila de la línea: barras de un color o un degradado propio.
 * @property clave qué es la fila: cielo, luna, el planeta o estacion
 * @property retrato cuerpo cuya imagen va junto al nombre
 * @property notas cuándo y dónde mirar; la primera se destaca
 * @property brillo puntos de 1 a 5
 */
export interface FilaLinea {
  clave?: string;
  nombre: string;
  descripcion: string;
  color?: string;
  tramos?: TramoLinea[];
  puntos?: number[];
  degradado?: string;
  retrato?: Astro;
  notas?: string[];
  brillo?: number;
}

const pct = (f: number) => `${(f * 100).toFixed(2)}%`;

/** Nombre de la fila con su imagen, sus notas y su brillo, si los tiene. */
function Cabeza({ fila }: { fila: FilaLinea }) {
  return (
    <div className="linea-cabeza">
      {fila.retrato && <Retrato astro={fila.retrato} tamano={46} />}
      <div>
        <span className="linea-nombre">{fila.nombre}</span>
        {fila.notas?.map((n, i) => (
          <span
            key={n}
            className={i === 0 ? 'linea-nota' : 'linea-pista-texto'}
          >
            {n}
          </span>
        ))}
        {fila.brillo !== undefined && (
          <span
            className="linea-brillo"
            role="img"
            aria-label={textos({
              es: `Brillo ${fila.brillo} de 5`,
              en: `Brightness ${fila.brillo} of 5`,
            })}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <i key={n} className={n <= fila.brillo! ? 'on' : undefined} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Barras de 18:00 a 06:00 con una línea que marca la hora actual; las filas con notas llevan su imagen y lo que hay que saber para verlas.
 * @param marcas etiquetas del eje con su posición de 0 a 1
 * @param ahora posición de la hora actual, o null si cae fuera de la noche
 */
export function LineaNoche({
  filas,
  marcas,
  ahora,
}: {
  filas: FilaLinea[];
  marcas: { texto: string; posicion: number }[];
  ahora: number | null;
}) {
  return (
    <div className="linea">
      {filas.map((f) => (
        <div
          className={`linea-fila${f.notas ? ' con-notas' : ''}`}
          key={f.nombre}
        >
          <Cabeza fila={f} />
          <div
            className="linea-pista"
            role="img"
            aria-label={f.descripcion}
            style={f.degradado ? { background: f.degradado } : undefined}
          >
            {f.tramos?.map((t) => (
              <div
                key={t.desde}
                className="linea-tramo"
                style={
                  {
                    left: pct(t.desde),
                    width: pct(t.hasta - t.desde),
                    background: f.color,
                  } as CSSProperties
                }
              />
            ))}
            {f.puntos?.map((p) => (
              <span key={p} className="linea-punto" style={{ left: pct(p) }} />
            ))}
          </div>
        </div>
      ))}
      <div className="linea-fila linea-eje" aria-hidden="true">
        <span />
        <div className="linea-horas">
          {marcas.map((m) => (
            <span key={m.texto} style={{ left: pct(m.posicion) }}>
              {m.texto}
            </span>
          ))}
        </div>
      </div>
      {ahora !== null && (
        <div className="linea-capa" aria-hidden="true">
          <div className="linea-ahora" style={{ left: pct(ahora) }}>
            <span>{textos({ es: 'Ahora', en: 'Now' })}</span>
          </div>
        </div>
      )}
    </div>
  );
}
