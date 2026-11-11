import { useState, type CSSProperties } from 'react';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { idioma, textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  useCercanos60,
  useScout,
  type AcercamientoCad,
} from '../../servicios/nasa/datos';
import { haceCuanto } from '../../servicios/nasa/formato';
import { diametroDesdeH } from './relojAsteroides';

const ES = {
  sesenta: 'Los próximos 60 días',
  sesentaLead:
    'Cada acercamiento a menos de 10 distancias lunares hasta dentro de dos meses. Abajo, más cerca de la Tierra; la línea punteada es la Luna.',
  luna: 'Luna',
  ld: 'LD',
  tam: 'tamaño estimado',
  scout: 'Recién descubiertos',
  scoutLead:
    'Objetos detectados en los últimos días que aún no tienen órbita confirmada. Scout calcula la probabilidad de que sean asteroides cercanos a la Tierra y cuánto podrían acercarse.',
  neo: 'probabilidad de ser NEO',
  pasaria: (ld: string) => `podría pasar a ${ld} LD`,
  obs: (n: number) => `${n} observaciones`,
  actualizado: 'actualizado',
  verScout: 'Ver en Scout',
  ninguno: 'No hay datos ahora.',
  linea: (n: number) =>
    `Línea de tiempo con ${n} acercamientos en los próximos 60 días`,
};

const EN: typeof ES = {
  sesenta: 'The next 60 days',
  sesentaLead:
    'Every close approach within 10 lunar distances over the next two months. Lower is closer to Earth; the dotted line is the Moon.',
  luna: 'Moon',
  ld: 'LD',
  tam: 'estimated size',
  scout: 'Just discovered',
  scoutLead:
    'Objects spotted in the last few days that have no confirmed orbit yet. Scout works out how likely they are to be near-Earth asteroids and how close they could come.',
  neo: 'chance of being a NEO',
  pasaria: (ld) => `could pass at ${ld} LD`,
  obs: (n) => `${n} observations`,
  actualizado: 'updated',
  verScout: 'See in Scout',
  ninguno: 'No data right now.',
  linea: (n) => `Timeline with ${n} close approaches over the next 60 days`,
};

const DIA = 86_400_000;
const LD_MIN = 0.1;
const LD_MAX = 10;

/** Altura de 0 (cerca) a 1 (lejos) en escala logarítmica de 0,1 a 10 distancias lunares. */
const alturaLd = (ld: number) =>
  (Math.log10(Math.min(Math.max(ld, LD_MIN), LD_MAX)) - Math.log10(LD_MIN)) /
  (Math.log10(LD_MAX) - Math.log10(LD_MIN));

/** Fecha corta en la zona del usuario. */
function corta(ms: number, zona: string): string {
  return new Intl.DateTimeFormat(idioma() === 'es' ? 'es-PE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    timeZone: zona,
  }).format(ms);
}

/** Tamaño estimado como «12–27 m». */
const tamano = (h: number) => {
  const [a, b] = diametroDesdeH(h);
  return `${formatearNumero(a)}–${formatearNumero(b)} m`;
};

/** Los acercamientos de los próximos 60 días en una franja de tiempo y su lista. */
export function Proximos60() {
  const t = textos({ es: ES, en: EN });
  const datos = useCercanos60();
  const zona = useEstado((s) => s.ubicacion.zona);
  const ahora = useAhora().getTime();
  const [elegido, setElegido] = useState<AcercamientoCad | null>(null);
  const objetos = datos && datos !== 'error' ? datos.objetos : [];
  const fin = ahora + 60 * DIA;
  const x = (f: number) => ((f - ahora) / (fin - ahora)) * 100;
  const semanas = Array.from({ length: 9 }, (_, i) => ahora + i * 7 * DIA);

  return (
    <section className="asteroides-extra" aria-labelledby="t-sesenta">
      <h3 id="t-sesenta">{t.sesenta}</h3>
      <p className="asteroides-extra-lead">{t.sesentaLead}</p>
      {objetos.length === 0 ? (
        <p className="aviso">{t.ninguno}</p>
      ) : (
        <>
          <div
            className="sesenta"
            role="img"
            aria-label={t.linea(objetos.length)}
          >
            <span
              className="sesenta-luna"
              style={{ top: `${(1 - alturaLd(1)) * 100}%` }}
            >
              <small>{t.luna}</small>
            </span>
            {semanas.map((s) => (
              <span
                key={s}
                className="sesenta-semana"
                style={{ left: `${x(s)}%` }}
              >
                <small>{corta(s, zona)}</small>
              </span>
            ))}
            {objetos.map((o, i) => (
              <button
                key={o.des + o.fecha}
                type="button"
                className={`sesenta-punto${o === elegido ? ' elegido' : ''}`}
                title={`${o.nombre} · ${formatearNumero(o.distanciaLunar, 2)} LD`}
                aria-label={`${o.nombre}, ${corta(o.fecha, zona)}, ${formatearNumero(o.distanciaLunar, 2)} LD`}
                style={
                  {
                    left: `${x(o.fecha)}%`,
                    top: `${(1 - alturaLd(o.distanciaLunar)) * 100}%`,
                    '--retraso': `${i * 40}ms`,
                  } as CSSProperties
                }
                onClick={() => setElegido(o)}
              />
            ))}
          </div>
          <ol className="sesenta-lista">
            {objetos.map((o) => (
              <li
                key={o.des + o.fecha}
                aria-current={o === elegido || undefined}
              >
                <span>{corta(o.fecha, zona)}</span>
                <strong>{o.nombre}</strong>
                <span>
                  {formatearNumero(o.distanciaLunar, 2)} {t.ld}
                </span>
                <span>{formatearNumero(o.velocidadKms, 1)} km/s</span>
                <span>
                  {t.tam} {tamano(o.h)}
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

/** Los objetos recién descubiertos que sigue Scout, con su probabilidad de ser NEO y cuánto podrían acercarse. */
export function RecienDescubiertos() {
  const t = textos({ es: ES, en: EN });
  const datos = useScout();
  const ahora = useAhora().getTime();
  const objetos = datos && datos !== 'error' ? datos.objetos.slice(0, 16) : [];
  return (
    <section className="asteroides-extra" aria-labelledby="t-scout">
      <h3 id="t-scout">{t.scout}</h3>
      <p className="asteroides-extra-lead">{t.scoutLead}</p>
      {objetos.length === 0 ? (
        <p className="aviso">{t.ninguno}</p>
      ) : (
        <ol className="scout-lista">
          {objetos.map((o) => (
            <li key={o.nombre}>
              <a
                href={`https://cneos.jpl.nasa.gov/scout/#/object/${encodeURIComponent(o.nombre)}`}
                target="_blank"
                rel="noreferrer"
              >
                <strong>{o.nombre}</strong>
                <span
                  className="scout-barra"
                  style={{ '--k': `${o.neo}%` } as CSSProperties}
                  title={`${t.neo}: ${o.neo} %`}
                >
                  <i />
                </span>
                <span className="scout-neo">{o.neo} %</span>
                <small>
                  {t.neo}
                  {o.distanciaLunar !== null &&
                    ` · ${t.pasaria(formatearNumero(o.distanciaLunar, 1))}`}{' '}
                  · {tamano(o.h)} · {t.obs(o.observaciones)} · {t.actualizado}{' '}
                  {haceCuanto(o.actualizado, ahora)}
                </small>
              </a>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
