import type { ReactNode } from 'react';
import { useAhora } from '../../estado/hooks';
import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import { haceCuanto } from '../../servicios/nasa/formato';
import { useContar } from './contar';
import './Nasa.css';

/** Una fuente citada: nombre visible y página. */
export interface FuenteNasa {
  nombre: string;
  url: string;
}

/**
 * Cabecera común de las vistas de NASA en vivo: punto en vivo, título, una línea y de dónde salen los datos.
 * @param generado cuándo se descargaron los datos (ISO); sin él, dice que se piden en vivo
 * @param extra lo que va a la derecha del título, como los filtros
 * @param kicker la sección sobre el título; por defecto NASA en vivo
 * @param vivo false en las vistas sin datos que se actualicen: solo cita las fuentes
 */
export function CabezaNasa({
  id,
  titulo,
  lead,
  fuentes,
  generado,
  extra,
  kicker,
  vivo = true,
}: {
  id: string;
  titulo: string;
  lead: string;
  fuentes: FuenteNasa[];
  generado?: string | null;
  extra?: ReactNode;
  kicker?: string;
  vivo?: boolean;
}) {
  const ahora = useAhora();
  return (
    <header className="nasa-cabeza">
      <div>
        <p className="nasa-kicker">
          <span className="nasa-vivo" aria-hidden="true" />
          {kicker ?? textos({ es: 'NASA en vivo', en: 'NASA live' })}
        </p>
        <h2 id={id} className="nasa-titulo">
          {titulo}
        </h2>
        <p className="nasa-lead">{lead}</p>
        <p className="nasa-meta">
          {!vivo
            ? textos({ es: 'Fuentes', en: 'Sources' })
            : generado
              ? textos({
                  es: `Actualizado ${haceCuanto(Date.parse(generado), ahora)}`,
                  en: `Updated ${haceCuanto(Date.parse(generado), ahora)}`,
                })
              : textos({ es: 'Datos en vivo', en: 'Live data' })}
          {' · '}
          {fuentes.map((f, i) => (
            <span key={f.url}>
              {i > 0 && ', '}
              <a href={f.url} target="_blank" rel="noreferrer">
                {f.nombre}
              </a>
            </span>
          ))}
        </p>
      </div>
      {extra && <div className="nasa-cabeza-extra">{extra}</div>}
    </header>
  );
}

/**
 * Una cifra grande con su etiqueta, que cuenta hacia arriba al aparecer.
 * @param decimales cuántos decimales muestra
 * @param unidad texto pequeño tras el número
 * @param anio si es un año: sin separador de miles
 */
export function Cifra({
  valor,
  etiqueta,
  decimales = 0,
  unidad,
  acento = false,
  anio = false,
}: {
  valor: number;
  etiqueta: string;
  decimales?: number;
  unidad?: string;
  acento?: boolean;
  anio?: boolean;
}) {
  const v = useContar(valor);
  return (
    <div className={`nasa-cifra${acento ? ' acento' : ''}`}>
      <dd>
        {anio ? String(Math.round(v)) : formatearNumero(v, decimales)}
        {unidad && <small>{unidad}</small>}
      </dd>
      <dt>{etiqueta}</dt>
    </div>
  );
}

/** Aviso de carga o de datos que faltan, con el mismo aspecto en todas las vistas. */
export function SinDatos({ error }: { error: boolean }) {
  return (
    <p className="nasa-sin-datos" role={error ? 'alert' : undefined}>
      {error
        ? textos({
            es: 'No hay datos disponibles ahora. Vuelve a intentarlo en un rato.',
            en: 'No data available right now. Try again in a while.',
          })
        : textos({ es: 'Cargando datos…', en: 'Loading data…' })}
    </p>
  );
}
