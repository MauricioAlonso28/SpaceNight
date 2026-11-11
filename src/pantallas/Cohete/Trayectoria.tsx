import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useEsEscritorio } from '../../app/escritorio';
import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  tiempoMision,
  type Hito,
  type Muestra,
} from '../../servicios/cohete/vuelo';
import { HITOS } from './textosVuelo';

const ES = {
  reproducir: 'Reproducir',
  pausar: 'Pausar',
  reiniciar: 'Volver al principio',
  velocidad: 'Velocidad de reproducción',
  tiempo: 'Momento del vuelo',
  vel: 'velocidad',
  alt: 'altura',
  dist: 'distancia recorrida',
  acel: 'aceleración',
  q: 'presión del aire',
  masa: 'masa',
  etapa: (n: number) => `${n}.ª etapa`,
  ahora: 'Ahora',
  dibujo: 'Perfil del vuelo: distancia recorrida contra altura',
  graficoVel: 'Velocidad (km/h)',
  graficoAlt: 'Altura (km)',
  hitos: 'Hitos del vuelo',
};

const EN: typeof ES = {
  reproducir: 'Play',
  pausar: 'Pause',
  reiniciar: 'Back to the start',
  velocidad: 'Playback speed',
  tiempo: 'Moment of the flight',
  vel: 'speed',
  alt: 'altitude',
  dist: 'downrange',
  acel: 'acceleration',
  q: 'air pressure',
  masa: 'mass',
  etapa: (n) => `stage ${n}`,
  ahora: 'Now',
  dibujo: 'Flight profile: downrange distance against altitude',
  graficoVel: 'Speed (km/h)',
  graficoAlt: 'Altitude (km)',
  hitos: 'Flight milestones',
};

const VELOCIDADES = [1, 10, 30];
/** Lienzo del perfil: ancho y bajo en escritorio, más alto y con letra más grande en el móvil. */
const LIENZO = {
  escritorio: { ancho: 1000, alto: 380, margen: 28, letra: 13, nave: 1 },
  movil: { ancho: 600, alto: 520, margen: 24, letra: 22, nave: 1.7 },
};

/** Reloj de reproducción: avanza con requestAnimationFrame mientras está en marcha y se detiene al final. */
function useReproductor(inicio: number, fin: number) {
  const [t, setT] = useState(inicio);
  const [enMarcha, setEnMarcha] = useState(false);
  const [ritmo, setRitmo] = useState(10);
  const ultimo = useRef<number | null>(null);
  useEffect(() => {
    if (!enMarcha) return;
    let id = 0;
    const cuadro = (ms: number) => {
      const antes = ultimo.current ?? ms;
      ultimo.current = ms;
      setT((x) => {
        const nuevo = Math.min(fin, x + ((ms - antes) / 1000) * ritmo);
        if (nuevo >= fin) setEnMarcha(false);
        return nuevo;
      });
      id = requestAnimationFrame(cuadro);
    };
    id = requestAnimationFrame(cuadro);
    return () => {
      cancelAnimationFrame(id);
      ultimo.current = null;
    };
  }, [enMarcha, ritmo, fin]);
  const alternar = () => {
    if (!enMarcha && t >= fin) setT(inicio);
    setEnMarcha(!enMarcha);
  };
  return { t, setT, enMarcha, alternar, ritmo, setRitmo };
}

/** La muestra en un instante, interpolada entre las dos más cercanas. */
function muestraEn(muestras: Muestra[], t: number): Muestra {
  let i = muestras.findIndex((m) => m.t >= t);
  if (i <= 0) return muestras[i === 0 ? 0 : muestras.length - 1];
  const a = muestras[i - 1];
  const b = muestras[i];
  const f = (t - a.t) / (b.t - a.t || 1);
  const mezcla = (x: number, y: number) => x + (y - x) * f;
  return {
    ...b,
    t,
    altura: mezcla(a.altura, b.altura),
    distancia: mezcla(a.distancia, b.distancia),
    velocidad: mezcla(a.velocidad, b.velocidad),
    vertical: mezcla(a.vertical, b.vertical),
    aceleracion: mezcla(a.aceleracion, b.aceleracion),
    presion: mezcla(a.presion, b.presion),
    masa: mezcla(a.masa, b.masa),
    angulo: mezcla(a.angulo, b.angulo),
    empuje: a.empuje,
  };
}

/** Escala lineal de un intervalo a otro. */
const escala =
  (d0: number, d1: number, r0: number, r1: number) => (v: number) =>
    r0 + ((v - d0) / (d1 - d0 || 1)) * (r1 - r0);

/** Un gráfico pequeño de una magnitud contra el tiempo, con el instante actual marcado. */
function Grafico({
  muestras,
  valor,
  t,
  titulo,
}: {
  muestras: Muestra[];
  valor: (m: Muestra) => number;
  t: number;
  titulo: string;
}) {
  const t0 = muestras[0].t;
  const t1 = muestras[muestras.length - 1].t;
  const max = Math.max(...muestras.map(valor)) || 1;
  const x = escala(t0, t1, 0, 300);
  const y = escala(0, max, 90, 6);
  const puntos = muestras.map(
    (m) => `${x(m.t).toFixed(1)},${y(valor(m)).toFixed(1)}`,
  );
  const hecho = muestras
    .filter((m) => m.t <= t)
    .map((m) => `${x(m.t).toFixed(1)},${y(valor(m)).toFixed(1)}`);
  return (
    <figure className="vuelo-grafico">
      <figcaption>{titulo}</figcaption>
      <svg viewBox="0 0 300 96" preserveAspectRatio="none" aria-hidden="true">
        <polyline points={puntos.join(' ')} className="vuelo-grafico-todo" />
        {hecho.length > 1 && (
          <polyline points={hecho.join(' ')} className="vuelo-grafico-hecho" />
        )}
        <line
          x1={x(t)}
          x2={x(t)}
          y1="0"
          y2="96"
          className="vuelo-grafico-cursor"
        />
      </svg>
    </figure>
  );
}

/**
 * Reproductor de un vuelo: el perfil animado, la telemetría como en una transmisión, dos gráficos y los hitos para saltar.
 * @param fondo trayectoria ya recorrida que se dibuja tenue detrás, como el ascenso al ver el regreso
 * @param objetivo dónde aterriza, en metros de distancia, con su nombre
 * @param resultado lo que se muestra al llegar al final
 * @param acercamiento vista de detalle que se dibuja junto al perfil con la muestra del instante
 */
export function Trayectoria({
  muestras,
  hitos,
  fondo = [],
  objetivo,
  resultado,
  acercamiento,
}: {
  muestras: Muestra[];
  hitos: Hito[];
  fondo?: Muestra[];
  objetivo?: { distancia: number; nombre: string };
  resultado: ReactNode;
  acercamiento?: (m: Muestra, terminado: boolean) => ReactNode;
}) {
  const t = textos({ es: ES, en: EN });
  const inicio = muestras[0].t;
  const fin = muestras[muestras.length - 1].t;
  const r = useReproductor(inicio, fin);
  const lz = LIENZO[useEsEscritorio() ? 'escritorio' : 'movil'];
  const ANCHO = lz.ancho;
  const ALTO = lz.alto;
  const ahora = muestraEn(muestras, Math.min(Math.max(r.t, inicio), fin));

  const { x, y } = useMemo(() => {
    const todas = [...muestras, ...fondo];
    const dist = todas.map((m) => m.distancia / 1000);
    const alt = todas.map((m) => m.altura / 1000);
    const d0 = Math.min(0, ...dist);
    const d1 = Math.max(...dist, (objetivo?.distancia ?? 0) / 1000);
    return {
      x: escala(d0, d1, lz.margen, lz.ancho - lz.margen),
      y: escala(0, Math.max(...alt) * 1.08, lz.alto - lz.margen, lz.margen),
    };
  }, [muestras, fondo, objetivo, lz]);

  const camino = (lista: Muestra[]) =>
    lista
      .map(
        (m, i) =>
          `${i ? 'L' : 'M'}${x(m.distancia / 1000).toFixed(1)} ${y(m.altura / 1000).toFixed(1)}`,
      )
      .join(' ');
  const recorrido = muestras.filter((m) => m.t <= r.t);
  const actual = hitos.filter((h) => h.t <= r.t).at(-1) ?? hitos[0];
  const px = x(ahora.distancia / 1000);
  const py = y(ahora.altura / 1000);
  const siguiente = muestraEn(muestras, Math.min(fin, ahora.t + 2));
  const giro =
    (ahora.empuje > 0
      ? Math.atan2(
          -Math.sin(ahora.angulo) * (y(0) - y(1)),
          Math.cos(ahora.angulo) * (x(1) - x(0)),
        )
      : Math.atan2(
          y(siguiente.altura / 1000) - py,
          x(siguiente.distancia / 1000) - px || 0.001,
        )) *
    (180 / Math.PI);
  const terminado = r.t >= fin;

  return (
    <div className="vuelo-reproductor">
      <dl className="vuelo-hud">
        <div className="vuelo-reloj">
          <dt>{t.etapa(ahora.etapa)}</dt>
          <dd>{tiempoMision(ahora.t)}</dd>
        </div>
        <div>
          <dt>{t.vel}</dt>
          <dd>
            {formatearNumero(ahora.velocidad * 3.6)} <small>km/h</small>
          </dd>
        </div>
        <div>
          <dt>{t.alt}</dt>
          <dd>
            {formatearNumero(Math.max(0, ahora.altura) / 1000, 1)}{' '}
            <small>km</small>
          </dd>
        </div>
        <div>
          <dt>{t.dist}</dt>
          <dd>
            {formatearNumero(Math.abs(ahora.distancia) / 1000)}{' '}
            <small>km</small>
          </dd>
        </div>
        <div>
          <dt>{t.acel}</dt>
          <dd>
            {formatearNumero(ahora.aceleracion, 1)} <small>g</small>
          </dd>
        </div>
        <div>
          <dt>{t.q}</dt>
          <dd>
            {formatearNumero(ahora.presion / 1000, 1)} <small>kPa</small>
          </dd>
        </div>
        <div>
          <dt>{t.masa}</dt>
          <dd>
            {formatearNumero(ahora.masa / 1000, 1)} <small>t</small>
          </dd>
        </div>
      </dl>

      <div className={`vuelo-lienzo${acercamiento ? ' con-detalle' : ''}`}>
        <svg
          className="vuelo-perfil"
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          role="img"
          aria-label={t.dibujo}
        >
          <defs>
            <linearGradient id="vuelo-cielo" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#3a6fd8" stopOpacity="0.35" />
              <stop offset="0.35" stopColor="#3a6fd8" stopOpacity="0.08" />
              <stop offset="1" stopColor="#3a6fd8" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y={y(100)}
            width={ANCHO}
            height={y(0) - y(100)}
            fill="url(#vuelo-cielo)"
          />
          <line
            x1="0"
            x2={ANCHO}
            y1={y(100)}
            y2={y(100)}
            className="vuelo-karman"
          />
          <text
            x={ANCHO - 8}
            y={y(100) - 6}
            textAnchor="end"
            className="vuelo-rotulo"
            fontSize={lz.letra}
          >
            100 km
          </text>
          <path d={`M0 ${y(0)} H${ANCHO}`} className="vuelo-suelo" />
          {objetivo && (
            <g
              transform={`translate(${x(objetivo.distancia / 1000)} ${y(0)})`}
              className="vuelo-objetivo"
            >
              <rect x="-16" y="-4" width="32" height="6" rx="1" />
              <text y={lz.letra * 1.4} fontSize={lz.letra} textAnchor="middle">
                {objetivo.nombre}
              </text>
            </g>
          )}
          {fondo.length > 1 && (
            <path d={camino(fondo)} className="vuelo-fondo" />
          )}
          <path d={camino(muestras)} className="vuelo-previsto" />
          {recorrido.length > 1 && (
            <path d={camino(recorrido)} className="vuelo-hecho" />
          )}
          {hitos.map((h) => {
            const m = muestraEn(muestras, h.t);
            return (
              <circle
                key={h.id}
                cx={x(m.distancia / 1000)}
                cy={y(m.altura / 1000)}
                r={h.t <= r.t ? 4.5 : 3}
                className={`vuelo-hito${h.t <= r.t ? ' pasado' : ''}`}
              />
            );
          })}
          <g
            transform={`translate(${px} ${py}) rotate(${giro}) scale(${lz.nave})`}
            className="vuelo-nave"
          >
            <path d="M10 0 L-6 -4 L-4 0 L-6 4 Z" />
            {ahora.empuje > 0 && !terminado && (
              <path
                d="M-6 0 L-18 -2.5 L-15 0 L-18 2.5 Z"
                className="vuelo-llama"
              />
            )}
          </g>
        </svg>
        {acercamiento?.(ahora, terminado)}
      </div>

      <div className="vuelo-controles">
        <button
          type="button"
          className="nasa-chip vuelo-play"
          onClick={r.alternar}
        >
          {r.enMarcha ? `❚❚ ${t.pausar}` : `▶ ${t.reproducir}`}
        </button>
        <button
          type="button"
          className="nasa-chip"
          onClick={() => r.setT(inicio)}
          aria-label={t.reiniciar}
        >
          ↺
        </button>
        <div className="nasa-chips" role="group" aria-label={t.velocidad}>
          {VELOCIDADES.map((v) => (
            <button
              key={v}
              type="button"
              className="nasa-chip"
              aria-pressed={r.ritmo === v}
              onClick={() => r.setRitmo(v)}
            >
              ×{v}
            </button>
          ))}
        </div>
        <input
          type="range"
          className="vuelo-barra"
          min={inicio}
          max={fin}
          step={1}
          value={Math.round(r.t)}
          aria-label={t.tiempo}
          aria-valuetext={tiempoMision(r.t)}
          onChange={(ev) => r.setT(Number(ev.target.value))}
        />
      </div>

      <div className="vuelo-pie">
        <div className="vuelo-ahora" aria-live="polite">
          <p className="nasa-rotulo">
            {t.ahora} · {tiempoMision(actual.t)}
          </p>
          <h4>{textos(HITOS[actual.id])}</h4>
          <p>{textos(HITOS[actual.id].queEs)}</p>
          {terminado && <div className="vuelo-resultado">{resultado}</div>}
        </div>
        <div className="vuelo-graficos">
          <Grafico
            muestras={muestras}
            valor={(m) => m.velocidad * 3.6}
            t={r.t}
            titulo={t.graficoVel}
          />
          <Grafico
            muestras={muestras}
            valor={(m) => Math.max(0, m.altura) / 1000}
            t={r.t}
            titulo={t.graficoAlt}
          />
        </div>
        <ol className="vuelo-hitos" aria-label={t.hitos}>
          {hitos.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                aria-current={h === actual || undefined}
                className={h.t <= r.t ? 'pasado' : undefined}
                onClick={() => r.setT(h.t)}
              >
                <time>{tiempoMision(h.t)}</time>
                <span>{textos(HITOS[h.id])}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
