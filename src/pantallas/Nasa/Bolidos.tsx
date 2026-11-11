import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useJsonPublico } from '../../estado/datos';
import { useAhora } from '../../estado/hooks';
import { idioma, textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  anioBolido,
  destacados,
  hiroshimas,
  porAnio,
  radioEnergia,
  unoEn,
} from '../../servicios/nasa/bolidos';
import {
  useBolidos,
  useSentry,
  type FilaBolido,
} from '../../servicios/nasa/datos';
import { haceCuanto } from '../../servicios/nasa/formato';
import { CabezaNasa, Cifra, SinDatos } from './CabezaNasa';
import './Bolidos.css';

const ES = {
  titulo: 'Bólidos e impactos',
  lead: 'Cada círculo es una roca espacial que estalló en la atmósfera desde 1988, medida por sensores del gobierno de EE. UU.; su tamaño es la energía liberada. Al lado, los objetos que JPL vigila por si algún día chocan con la Tierra.',
  total: 'bólidos registrados',
  esteAnio: (a: number) => `en ${a}`,
  mayor: 'el más energético',
  ultimo: 'el último',
  vigilados: 'objetos vigilados por Sentry',
  todos: 'Todos los años',
  reproducir: 'Reproducir desde 1988',
  pausar: 'Pausar',
  mapa: (n: number) => `Mapa del mundo con ${n} bólidos`,
  anios: 'Bólidos por año; elige uno para verlo en el mapa',
  energia: 'Energía de impacto',
  altura: 'Altura',
  velocidad: 'Velocidad',
  hiroshima: (n: string) => `≈ ${n} veces la bomba de Hiroshima`,
  sentry: 'Lista de vigilancia Sentry',
  sentryNota:
    'Probabilidad acumulada de choque en los años indicados. En la escala de Palermo, menos de −2 significa que no hay motivo de preocupación.',
  diametro: 'diámetro',
  anios2: 'años',
  palermo: 'Palermo',
  ficha: 'Ficha en CNEOS',
  masFuertes: 'Los más energéticos',
  sinLugar: 'lugar sin publicar',
};

const EN: typeof ES = {
  titulo: 'Fireballs and impacts',
  lead: 'Each circle is a space rock that exploded in the atmosphere since 1988, measured by US government sensors; its size is the energy released. Beside it, the objects JPL watches in case they ever hit Earth.',
  total: 'fireballs recorded',
  esteAnio: (a) => `in ${a}`,
  mayor: 'the most energetic',
  ultimo: 'the latest',
  vigilados: 'objects watched by Sentry',
  todos: 'All years',
  reproducir: 'Play from 1988',
  pausar: 'Pause',
  mapa: (n) => `World map with ${n} fireballs`,
  anios: 'Fireballs per year; pick one to see it on the map',
  energia: 'Impact energy',
  altura: 'Altitude',
  velocidad: 'Speed',
  hiroshima: (n) => `≈ ${n} times the Hiroshima bomb`,
  sentry: 'Sentry watch list',
  sentryNota:
    'Cumulative impact probability over the years shown. On the Palermo scale, below −2 means no cause for concern.',
  diametro: 'diameter',
  anios2: 'years',
  palermo: 'Palermo',
  ficha: 'Page at CNEOS',
  masFuertes: 'The most energetic',
  sinLugar: 'location not published',
};

/** Fecha corta UTC de un bólido. */
function fecha(ms: number): string {
  return new Intl.DateTimeFormat(idioma() === 'es' ? 'es-PE' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(ms);
}

/** Lugar como «54,8° N · 61,1° E», o un aviso si no se publicó. */
function lugar(f: FilaBolido): string | null {
  if (f[2] === null || f[3] === null) return null;
  const o = idioma() === 'es' ? 'O' : 'W';
  return `${formatearNumero(Math.abs(f[2]), 1)}° ${f[2] < 0 ? 'S' : 'N'} · ${formatearNumero(Math.abs(f[3]), 1)}° ${f[3] < 0 ? o : 'E'}`;
}

/** El mapa con un círculo por bólido, del año elegido o de todos, y la ficha del que se toca. */
function MapaBolidos({
  filas,
  hasta,
  anio,
  elegido,
  alElegir,
}: {
  filas: FilaBolido[];
  hasta: number | null;
  anio: number | null;
  elegido: FilaBolido | null;
  alElegir: (f: FilaBolido) => void;
}) {
  const t = textos({ es: ES, en: EN });
  const mundo = useJsonPublico<{ trazado: string }>('mundo.json');
  const visibles = filas.filter(
    (f) =>
      f[2] !== null &&
      f[3] !== null &&
      (anio === null || anioBolido(f) === anio) &&
      (hasta === null || anioBolido(f) <= hasta),
  );
  const ultimoAnio = Math.max(...filas.map(anioBolido));
  return (
    <svg
      viewBox="0 0 360 180"
      className="bolidos-mapa"
      role="img"
      aria-label={t.mapa(visibles.length)}
    >
      {mundo && mundo !== 'error' && (
        <path d={mundo.trazado} className="bolidos-tierra" />
      )}
      {visibles
        .slice()
        .sort((a, b) => b[1] - a[1])
        .map((f) => {
          const edad = ultimoAnio - anioBolido(f);
          return (
            <circle
              key={f[0]}
              cx={(f[3] ?? 0) + 180}
              cy={90 - (f[2] ?? 0)}
              r={radioEnergia(f[1]) / 2}
              className={`bolido${f === elegido ? ' elegido' : ''}${edad < 1 ? ' reciente' : ''}`}
              style={{ '--edad': Math.min(edad / 30, 1) } as CSSProperties}
              onClick={() => alElegir(f)}
            />
          );
        })}
    </svg>
  );
}

/** Vista Bólidos e impactos: el mapa de bólidos con su línea de años y la lista de vigilancia Sentry. */
export function Bolidos() {
  const t = textos({ es: ES, en: EN });
  const ahora = useAhora();
  const datos = useBolidos();
  const sentry = useSentry();
  const [anio, setAnio] = useState<number | null>(null);
  const [hasta, setHasta] = useState<number | null>(null);
  const [elegido, setElegido] = useState<FilaBolido | null>(null);

  const filas = useMemo(
    () => (datos && datos !== 'error' ? datos.filas : []),
    [datos],
  );
  const anios = useMemo(() => porAnio(filas), [filas]);

  useEffect(() => {
    if (hasta === null || !anios.length) return;
    const ultimo = anios[anios.length - 1].anio;
    if (hasta >= ultimo) {
      const id = window.setTimeout(() => setHasta(null), 1200);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setHasta(hasta + 1), 380);
    return () => window.clearTimeout(id);
  }, [hasta, anios]);

  const cabeza = (
    <CabezaNasa
      id="t-bolidos"
      titulo={t.titulo}
      lead={t.lead}
      generado={datos && datos !== 'error' ? datos.generado : null}
      fuentes={[
        {
          nombre: 'JPL Fireball',
          url: 'https://cneos.jpl.nasa.gov/fireballs/',
        },
        { nombre: 'JPL Sentry', url: 'https://cneos.jpl.nasa.gov/sentry/' },
      ]}
    />
  );
  if (!filas.length) {
    return (
      <section className="nasa" aria-labelledby="t-bolidos">
        {cabeza}
        <SinDatos error={datos === 'error'} />
      </section>
    );
  }

  const { masEnergetico, ultimo } = destacados(filas);
  const anioActual = new Date(ahora).getUTCFullYear();
  const deEsteAnio = filas.filter((f) => anioBolido(f) === anioActual).length;
  const maxAnio = Math.max(...anios.map((a) => a.n));
  const actual = elegido ?? ultimo;
  const top = [...filas].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const listaSentry = sentry && sentry !== 'error' ? sentry : null;

  return (
    <section className="nasa bolidos" aria-labelledby="t-bolidos">
      {cabeza}
      <dl className="nasa-cifras">
        <Cifra valor={filas.length} etiqueta={t.total} />
        <Cifra valor={deEsteAnio} etiqueta={t.esteAnio(anioActual)} />
        <Cifra
          valor={masEnergetico[1]}
          unidad="kt"
          etiqueta={`${t.mayor} · ${fecha(masEnergetico[0])}`}
          acento
        />
        <Cifra
          valor={ultimo[1]}
          decimales={2}
          unidad="kt"
          etiqueta={`${t.ultimo} · ${haceCuanto(ultimo[0], ahora)}`}
        />
        {listaSentry && (
          <Cifra valor={listaSentry.total} etiqueta={t.vigilados} />
        )}
      </dl>

      <div className="bolidos-escena">
        <MapaBolidos
          filas={filas}
          hasta={hasta}
          anio={anio}
          elegido={actual}
          alElegir={setElegido}
        />
        <article className="bolidos-ficha" key={actual[0]}>
          <p className="nasa-rotulo">{fecha(actual[0])}</p>
          <h3>
            {formatearNumero(actual[1], actual[1] < 1 ? 2 : 1)}{' '}
            <small>kt</small>
          </h3>
          <p>
            {t.hiroshima(
              formatearNumero(
                hiroshimas(actual[1]),
                hiroshimas(actual[1]) < 1 ? 2 : 1,
              ),
            )}
          </p>
          <p>{lugar(actual) ?? t.sinLugar}</p>
          {(actual[4] !== null || actual[5] !== null) && (
            <p>
              {actual[4] !== null &&
                `${t.altura} ${formatearNumero(actual[4], 1)} km`}
              {actual[4] !== null && actual[5] !== null && ' · '}
              {actual[5] !== null &&
                `${t.velocidad} ${formatearNumero(actual[5], 1)} km/s`}
            </p>
          )}
        </article>
      </div>

      <div className="bolidos-anios">
        <div className="nasa-chips">
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={anio === null && hasta === null}
            onClick={() => {
              setAnio(null);
              setHasta(null);
            }}
          >
            {t.todos}
          </button>
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={hasta !== null}
            onClick={() => {
              setAnio(null);
              setHasta(hasta === null ? anios[0].anio : null);
            }}
          >
            {hasta === null ? `▶ ${t.reproducir}` : `❚❚ ${t.pausar} · ${hasta}`}
          </button>
        </div>
        <div className="bolidos-barras" role="group" aria-label={t.anios}>
          {anios.map((a) => (
            <button
              key={a.anio}
              type="button"
              title={`${a.anio}: ${a.n}`}
              aria-label={`${a.anio}: ${a.n}`}
              aria-pressed={anio === a.anio}
              className={
                hasta !== null && a.anio > hasta ? 'apagada' : undefined
              }
              style={{ '--h': `${(a.n / maxAnio) * 100}%` } as CSSProperties}
              onClick={() => {
                setHasta(null);
                setAnio(anio === a.anio ? null : a.anio);
              }}
            >
              <span />
            </button>
          ))}
        </div>
        <div className="bolidos-eje" aria-hidden="true">
          <span>{anios[0].anio}</span>
          <span>{anios[anios.length - 1].anio}</span>
        </div>
      </div>

      <div className="bolidos-listas">
        <section aria-labelledby="t-fuertes">
          <h3 id="t-fuertes">{t.masFuertes}</h3>
          <ol className="bolidos-top">
            {top.map((f) => (
              <li key={f[0]}>
                <button
                  type="button"
                  onClick={() => setElegido(f)}
                  aria-pressed={f === actual}
                >
                  <strong>{formatearNumero(f[1])} kt</strong>
                  <span>{fecha(f[0])}</span>
                  <span>{lugar(f) ?? t.sinLugar}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="t-sentry">
          <h3 id="t-sentry">{t.sentry}</h3>
          <p className="bolidos-nota">{t.sentryNota}</p>
          {listaSentry ? (
            <ol className="bolidos-sentry">
              {listaSentry.objetos.slice(0, 12).map((o) => (
                <li key={o.des}>
                  <a
                    href={`https://cneos.jpl.nasa.gov/sentry/details.html#?des=${encodeURIComponent(o.des)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>{o.nombre}</strong>
                    <span className="bolidos-prob">
                      {unoEn(o.probabilidad, idioma() === 'es')}
                    </span>
                    <span>
                      {formatearNumero(o.diametroKm * 1000)} m {t.diametro} ·{' '}
                      {o.anios}
                    </span>
                    <span
                      className="bolidos-palermo"
                      style={
                        {
                          '--k': `${Math.min(Math.max((o.palermo + 10) / 10, 0), 1) * 100}%`,
                        } as CSSProperties
                      }
                      title={`${t.palermo} ${formatearNumero(o.palermo, 2)}`}
                    >
                      <i />
                    </span>
                  </a>
                </li>
              ))}
            </ol>
          ) : (
            <SinDatos error={sentry === 'error'} />
          )}
        </section>
      </div>
    </section>
  );
}
