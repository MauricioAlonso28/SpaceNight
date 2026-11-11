import type { CSSProperties } from 'react';
import { textos } from '../../idioma/idioma';
import './LineaNoche.css';

/** Un tramo de barra en fracciones de la ventana (0 a 1). */
export interface TramoLinea {
  desde: number;
  hasta: number;
}

/** Una fila de la línea: barras de un color o un degradado propio. */
export interface FilaLinea {
  nombre: string;
  descripcion: string;
  color?: string;
  tramos?: TramoLinea[];
  puntos?: number[];
  degradado?: string;
}

const pct = (f: number) => `${(f * 100).toFixed(2)}%`;

/**
 * Barras de 18:00 a 06:00 con una línea que marca la hora actual.
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
        <div className="linea-fila" key={f.nombre}>
          <span className="linea-nombre">{f.nombre}</span>
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
      <div className="linea-fila" aria-hidden="true">
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
