import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Retrato } from '../../componentes/Retrato/Retrato';
import { useEstado } from '../../estado/store';
import { idioma, textos } from '../../idioma/idioma';
import { formatearHora, formatearNumero } from '../../servicios/formato';
import { useNeo, type Asteroide } from '../../servicios/nasa/datos';
import { cuentaAtras, haceCuanto } from '../../servicios/nasa/formato';
import { CabezaNasa, Cifra, SinDatos } from './CabezaNasa';
import {
  anguloReloj,
  proximoAcercamiento,
  puntoReloj,
  radioReloj,
  resumenNeo,
  semanaDe,
  tamanoPunto,
} from './relojAsteroides';
import { Proximos60, RecienDescubiertos } from './AsteroidesMas';
import './Asteroides.css';

const ES = {
  titulo: 'Asteroides de la semana',
  lead: 'Cada punto es un asteroide que pasa cerca de la Tierra en los próximos 7 días: alrededor, el día; hacia afuera, la distancia. El anillo punteado es la órbita de la Luna.',
  total: 'pasan esta semana',
  peligrosos: 'potencialmente peligrosos',
  cercano: 'el más cercano',
  rapido: 'el más rápido',
  grande: 'el más grande',
  ld: 'distancias lunares',
  proximo: 'Próximo acercamiento',
  pasaron: 'Ya pasaron todos los de esta semana.',
  ahora: 'ahora',
  luna: 'Luna',
  distancia: 'Distancia mínima',
  velocidad: 'Velocidad',
  diametro: 'Diámetro estimado',
  cuando: 'Momento más cercano',
  peligro: 'potencialmente peligroso',
  sentry: 'en la lista Sentry',
  jpl: 'Ficha en JPL',
  lista: 'Toda la semana',
  ordenar: 'Ordenar por',
  porFecha: 'fecha',
  porDistancia: 'distancia',
  porTamano: 'tamaño',
  reloj: (n: number) => `Reloj de acercamientos: ${n} asteroides en 7 días`,
  vecesLuna: (k: string) => `${k} veces la distancia a la Luna`,
};

const EN: typeof ES = {
  titulo: 'Asteroids this week',
  lead: 'Each dot is an asteroid passing near Earth in the next 7 days: around the clock, the day; outward, the distance. The dotted ring is the Moon’s orbit.',
  total: 'pass this week',
  peligrosos: 'potentially hazardous',
  cercano: 'the closest',
  rapido: 'the fastest',
  grande: 'the largest',
  ld: 'lunar distances',
  proximo: 'Next close approach',
  pasaron: 'All of this week’s have already passed.',
  ahora: 'now',
  luna: 'Moon',
  distancia: 'Closest distance',
  velocidad: 'Speed',
  diametro: 'Estimated diameter',
  cuando: 'Closest moment',
  peligro: 'potentially hazardous',
  sentry: 'on the Sentry list',
  jpl: 'Page at JPL',
  lista: 'The whole week',
  ordenar: 'Sort by',
  porFecha: 'date',
  porDistancia: 'distance',
  porTamano: 'size',
  reloj: (n) => `Close-approach clock: ${n} asteroids in 7 days`,
  vecesLuna: (k) => `${k} times the distance to the Moon`,
};

const C = 320;
const R0 = 50;
const R1 = 262;

type Orden = 'fecha' | 'distancia' | 'tamano';

/** Un reloj que avanza cada segundo, para la cuenta atrás. */
function useSegundero(): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return ahora;
}

/** Día de la semana corto y número, en la zona del usuario. */
function diaCorto(ms: number, zona: string): string {
  return new Intl.DateTimeFormat(idioma() === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    timeZone: zona,
  }).format(ms);
}

/** Sector ya transcurrido de la semana, de las 12 en punto hasta la aguja. */
function sectorPasado(angulo: number): string {
  if (angulo <= 0) return '';
  const fin = puntoReloj(Math.min(angulo, 359.9), R1, C, C);
  const inicio = puntoReloj(0, R1, C, C);
  return `M${C} ${C}L${inicio.x} ${inicio.y}A${R1} ${R1} 0 ${angulo > 180 ? 1 : 0} 1 ${fin.x} ${fin.y}Z`;
}

/**
 * El reloj de acercamientos: la Tierra en el centro, los 7 días alrededor y cada asteroide a su distancia.
 * @param elegido id del asteroide destacado
 */
function Reloj({
  objetos,
  inicio,
  fin,
  ahora,
  zona,
  elegido,
  alElegir,
}: {
  objetos: Asteroide[];
  inicio: number;
  fin: number;
  ahora: number;
  zona: string;
  elegido: string | null;
  alElegir: (id: string) => void;
}) {
  const t = textos({ es: ES, en: EN });
  const [encima, setEncima] = useState<string | null>(null);
  const aguja = anguloReloj(ahora, inicio, fin);
  const dias = Array.from({ length: 7 }, (_, i) => inicio + i * 86_400_000);
  const rLuna = radioReloj(1, R0, R1);
  const punta = puntoReloj(aguja, R1 + 12, C, C);
  const etiqueta = objetos.find((o) => o.id === (encima ?? elegido));

  return (
    <div className="reloj">
      <svg
        viewBox="0 0 640 640"
        role="img"
        aria-label={t.reloj(objetos.length)}
      >
        <defs>
          <radialGradient id="reloj-fondo">
            <stop offset="0" stopColor="rgba(120,150,255,0.16)" />
            <stop offset="1" stopColor="rgba(120,150,255,0)" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R1} fill="url(#reloj-fondo)" />
        <path d={sectorPasado(aguja)} className="reloj-pasado" />
        {[10, 100].map((ld) => (
          <g key={ld}>
            <circle
              cx={C}
              cy={C}
              r={radioReloj(ld, R0, R1)}
              className="reloj-anillo"
            />
            <text
              x={C + 6}
              y={C - radioReloj(ld, R0, R1) - 6}
              className="reloj-escala"
            >
              {ld} LD
            </text>
          </g>
        ))}
        <circle cx={C} cy={C} r={R1} className="reloj-borde" />
        <circle cx={C} cy={C} r={rLuna} className="reloj-luna" />
        <text x={C + 6} y={C - rLuna - 6} className="reloj-escala luna">
          {t.luna} · 1 LD
        </text>
        {dias.map((d) => {
          const a = anguloReloj(d, inicio, fin);
          const p1 = puntoReloj(a, R1, C, C);
          const p2 = puntoReloj(a, R1 + 10, C, C);
          const pt = puntoReloj(a + 360 / 14, R1 + 30, C, C);
          return (
            <g key={d}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className="reloj-marca"
              />
              <text
                x={pt.x}
                y={pt.y + 4}
                textAnchor="middle"
                className="reloj-dia"
              >
                {diaCorto(d + 43_200_000, zona)}
              </text>
            </g>
          );
        })}
        {objetos.map((o, i) => {
          const p = puntoReloj(
            anguloReloj(o.fecha, inicio, fin),
            radioReloj(o.distanciaLunar, R0, R1),
            C,
            C,
          );
          const clases = [
            'reloj-punto',
            o.fecha < ahora ? 'pasado' : '',
            o.peligroso ? 'peligroso' : '',
            o.id === elegido ? 'elegido' : '',
          ].join(' ');
          return (
            <g
              key={o.id + o.fecha}
              className={clases}
              style={{ '--retraso': `${i * 22}ms` } as CSSProperties}
              transform={`translate(${p.x} ${p.y})`}
              tabIndex={0}
              role="button"
              aria-label={`${o.nombre}, ${formatearNumero(o.distanciaLunar, 1)} LD`}
              onClick={() => alElegir(o.id)}
              onKeyDown={(e) => e.key === 'Enter' && alElegir(o.id)}
              onPointerEnter={() => setEncima(o.id)}
              onPointerLeave={() => setEncima(null)}
            >
              <circle r={tamanoPunto(o.diametroM)} />
            </g>
          );
        })}
        <line x1={C} y1={C} x2={punta.x} y2={punta.y} className="reloj-aguja" />
        <text
          x={puntoReloj(aguja, R1 + 26, C, C).x}
          y={puntoReloj(aguja, R1 + 26, C, C).y + 4}
          textAnchor="middle"
          className="reloj-ahora"
        >
          {t.ahora}
        </text>
        {etiqueta && (
          <text
            x={
              puntoReloj(
                anguloReloj(etiqueta.fecha, inicio, fin),
                radioReloj(etiqueta.distanciaLunar, R0, R1),
                C,
                C,
              ).x + 14
            }
            y={
              puntoReloj(
                anguloReloj(etiqueta.fecha, inicio, fin),
                radioReloj(etiqueta.distanciaLunar, R0, R1),
                C,
                C,
              ).y - 12
            }
            className="reloj-nombre"
          >
            {etiqueta.nombre}
          </text>
        )}
      </svg>
      <div className="reloj-tierra" aria-hidden="true">
        <Retrato astro="tierra" tamano={96} />
      </div>
    </div>
  );
}

/** Ficha de un asteroide: cuándo, a qué distancia, a qué velocidad y de qué tamaño, con el enlace a JPL. */
function FichaAsteroide({
  a,
  zona,
  formato24h,
}: {
  a: Asteroide;
  zona: string;
  formato24h: boolean;
}) {
  const t = textos({ es: ES, en: EN });
  const fecha = new Date(a.fecha);
  return (
    <article className="asteroide-ficha" key={a.id}>
      <h3>{a.nombre}</h3>
      <p className="asteroide-insignias">
        {a.peligroso && (
          <span className="nasa-etiqueta peligro">{t.peligro}</span>
        )}
        {a.sentry && <span className="nasa-etiqueta peligro">{t.sentry}</span>}
      </p>
      <dl>
        <div>
          <dt>{t.cuando}</dt>
          <dd>
            {diaCorto(a.fecha, zona)} · {formatearHora(fecha, zona, formato24h)}
          </dd>
        </div>
        <div>
          <dt>{t.distancia}</dt>
          <dd>
            {formatearNumero(a.distanciaKm)} km
            <small>{t.vecesLuna(formatearNumero(a.distanciaLunar, 1))}</small>
          </dd>
        </div>
        <div>
          <dt>{t.velocidad}</dt>
          <dd>
            {formatearNumero(a.velocidadKms, 1)} km/s
            <small>{formatearNumero(a.velocidadKms * 3600)} km/h</small>
          </dd>
        </div>
        <div>
          <dt>{t.diametro}</dt>
          <dd>
            {formatearNumero(a.diametroM[0])}–{formatearNumero(a.diametroM[1])}{' '}
            m
          </dd>
        </div>
      </dl>
      <a className="nasa-enlace" href={a.url} target="_blank" rel="noreferrer">
        {t.jpl} ↗
      </a>
    </article>
  );
}

/** Vista Asteroides: el reloj de la semana, las cifras, la cuenta atrás al próximo y la lista completa. */
export function Asteroides() {
  const t = textos({ es: ES, en: EN });
  const datos = useNeo();
  const ahora = useSegundero();
  const zona = useEstado((s) => s.ubicacion.zona);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const [elegido, setElegido] = useState<string | null>(null);
  const [orden, setOrden] = useState<Orden>('fecha');

  const listos = datos && datos !== 'error' ? datos : null;
  const objetos = useMemo(() => listos?.objetos ?? [], [listos]);
  const ordenados = useMemo(() => {
    const copia = [...objetos];
    if (orden === 'distancia')
      copia.sort((a, b) => a.distanciaKm - b.distanciaKm);
    if (orden === 'tamano')
      copia.sort((a, b) => b.diametroM[1] - a.diametroM[1]);
    return copia;
  }, [objetos, orden]);

  const cabeza = (
    <CabezaNasa
      id="t-asteroides"
      titulo={t.titulo}
      lead={t.lead}
      generado={listos?.generado}
      fuentes={[
        { nombre: 'NASA NeoWs', url: 'https://api.nasa.gov/' },
        { nombre: 'CNEOS', url: 'https://cneos.jpl.nasa.gov/ca/' },
      ]}
    />
  );
  if (!listos || objetos.length === 0) {
    return (
      <section className="nasa" aria-labelledby="t-asteroides">
        {cabeza}
        <SinDatos error={datos === 'error' || (!!listos && !objetos.length)} />
      </section>
    );
  }

  const { inicio, fin } = semanaDe(listos.desde, listos.hasta);
  const r = resumenNeo(objetos);
  const proximo = proximoAcercamiento(objetos, ahora);
  const actual =
    objetos.find((o) => o.id === elegido) ?? proximo ?? r.masCercano;

  return (
    <section className="nasa asteroides" aria-labelledby="t-asteroides">
      {cabeza}
      <dl className="nasa-cifras">
        <Cifra valor={r.total} etiqueta={t.total} />
        <Cifra valor={r.peligrosos} etiqueta={t.peligrosos} acento />
        <Cifra
          valor={r.masCercano.distanciaLunar}
          decimales={1}
          unidad="LD"
          etiqueta={`${t.cercano} · ${r.masCercano.nombre}`}
        />
        <Cifra
          valor={r.masRapido.velocidadKms}
          decimales={1}
          unidad="km/s"
          etiqueta={`${t.rapido} · ${r.masRapido.nombre}`}
        />
        <Cifra
          valor={r.masGrande.diametroM[1]}
          unidad="m"
          etiqueta={`${t.grande} · ${r.masGrande.nombre}`}
        />
      </dl>
      <div className="asteroides-cuerpo">
        <Reloj
          objetos={objetos}
          inicio={inicio}
          fin={fin}
          ahora={ahora}
          zona={zona}
          elegido={actual.id}
          alElegir={setElegido}
        />
        <div className="asteroides-lado">
          <div className="asteroides-proximo" aria-live="polite">
            <p className="nasa-rotulo">{t.proximo}</p>
            {proximo ? (
              <>
                <p className="asteroides-cuenta">
                  {cuentaAtras(proximo.fecha, ahora)}
                </p>
                <button
                  type="button"
                  className="asteroides-nombre"
                  onClick={() => setElegido(proximo.id)}
                >
                  {proximo.nombre} · {haceCuanto(proximo.fecha, ahora)}
                </button>
              </>
            ) : (
              <p>{t.pasaron}</p>
            )}
          </div>
          <FichaAsteroide a={actual} zona={zona} formato24h={formato24h} />
        </div>
      </div>
      <section className="asteroides-lista" aria-labelledby="t-semana">
        <div className="asteroides-lista-cabeza">
          <h3 id="t-semana">{t.lista}</h3>
          <div className="nasa-chips" role="group" aria-label={t.ordenar}>
            {(['fecha', 'distancia', 'tamano'] as Orden[]).map((o) => (
              <button
                key={o}
                type="button"
                className="nasa-chip"
                aria-pressed={orden === o}
                onClick={() => setOrden(o)}
              >
                {o === 'fecha'
                  ? t.porFecha
                  : o === 'distancia'
                    ? t.porDistancia
                    : t.porTamano}
              </button>
            ))}
          </div>
        </div>
        <ol>
          {ordenados.map((o) => (
            <li key={o.id + o.fecha}>
              <button
                type="button"
                aria-pressed={o.id === actual.id}
                className={o.fecha < ahora ? 'pasado' : undefined}
                onClick={() => setElegido(o.id)}
              >
                <span className="asteroides-dia">
                  {diaCorto(o.fecha, zona)}
                </span>
                <span className="asteroides-n">
                  {o.nombre}
                  {o.peligroso && <i aria-hidden="true" />}
                </span>
                <span
                  className="asteroides-barra"
                  style={
                    {
                      '--k': `${(radioReloj(o.distanciaLunar, 0, 1) * 100).toFixed(1)}%`,
                    } as CSSProperties
                  }
                />
                <span className="asteroides-ld">
                  {formatearNumero(o.distanciaLunar, 1)} LD
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
      <div className="asteroides-extras">
        <Proximos60 />
        <RecienDescubiertos />
      </div>
    </section>
  );
}
