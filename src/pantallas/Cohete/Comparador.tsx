import { useState, type KeyboardEvent } from 'react';
import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  COHETES,
  ESTATUA,
  ordenarCohetes,
  type CoheteReal,
  type Orden,
  type Tramo,
} from '../../servicios/cohete/cohetes';
import { CabezaNasa, Cifra } from '../Nasa/CabezaNasa';
import './Comparador.css';

const ES = {
  kicker: 'Cohete',
  titulo: 'Cohetes a escala',
  lead: 'Trece cohetes reales dibujados con sus proporciones, de la V-2 al Starship, junto a la Estatua de la Libertad. Toca uno para ver sus cifras.',
  ordenar: 'Ordenar por',
  ordenes: { alto: 'Altura', anio: 'Año', leo: 'Carga' } as Record<
    Orden,
    string
  >,
  estatua: 'Estatua de la Libertad',
  persona: 'Persona',
  dibujo: 'Siluetas de cohetes a la misma escala',
  estados: {
    activo: 'En servicio',
    retirado: 'Retirado',
    pruebas: 'En pruebas',
  },
  primerVuelo: 'primer vuelo',
  alto: 'de alto',
  diametro: 'de diámetro',
  leo: 'a órbita baja',
  empuje: 'de empuje al despegar',
  masa: 'al despegar',
  pisos: (n: string) => `Tan alto como un edificio de ${n} pisos.`,
  carga: 'Cuánto sube a órbita baja',
  sinDato: 'sin dato',
  suborbital: 'no llega a órbita',
  nota: 'Siluetas simplificadas y cifras aproximadas de fuentes públicas; la carga es la máxima a órbita baja de cada versión.',
};

const EN: typeof ES = {
  kicker: 'Rocket',
  titulo: 'Rockets to scale',
  lead: 'Thirteen real rockets drawn in proportion, from the V-2 to Starship, next to the Statue of Liberty. Tap one to see its figures.',
  ordenar: 'Sort by',
  ordenes: { alto: 'Height', anio: 'Year', leo: 'Payload' },
  estatua: 'Statue of Liberty',
  persona: 'Person',
  dibujo: 'Rocket silhouettes at the same scale',
  estados: { activo: 'In service', retirado: 'Retired', pruebas: 'In testing' },
  primerVuelo: 'first flight',
  alto: 'tall',
  diametro: 'across',
  leo: 'to low orbit',
  empuje: 'of liftoff thrust',
  masa: 'at liftoff',
  pisos: (n) => `As tall as a ${n}-storey building.`,
  carga: 'How much it lifts to low orbit',
  sinDato: 'no data',
  suborbital: 'does not reach orbit',
  nota: 'Simplified silhouettes and approximate figures from public sources; payload is each version’s maximum to low orbit.',
};

const HUECO = 3;
const TECHO = 132;

/** Ancho total que ocupa un cohete con sus propulsores laterales, en metros. */
const anchoCohete = (c: CoheteReal) =>
  Math.max(...c.tramos.map((t) => Math.max(t.abajo, t.arriba))) +
  (c.laterales ? 2 * c.laterales.ancho : 0);

/** Contorno de un tramo: un trapecio, o una punta ojival si termina en cero. */
function contorno(t: Tramo, cx: number, y0: number): string {
  const y1 = y0 + t.alto;
  const a = t.abajo / 2;
  const b = t.arriba / 2;
  if (t.arriba === 0) {
    return `M${cx - a} ${-y0} Q${cx - a} ${-(y0 + t.alto * 0.62)} ${cx} ${-y1} Q${cx + a} ${-(y0 + t.alto * 0.62)} ${cx + a} ${-y0} Z`;
  }
  return `M${cx - a} ${-y0} L${cx + a} ${-y0} L${cx + b} ${-y1} L${cx - b} ${-y1} Z`;
}

/** La silueta de un cohete en su posición, con sus laterales, su nombre y su año. */
function Silueta({
  c,
  cx,
  elegido,
  elegir,
}: {
  c: CoheteReal;
  cx: number;
  elegido: boolean;
  elegir: () => void;
}) {
  const alturas = c.tramos.reduce<number[]>(
    (l, t) => [...l, (l.at(-1) ?? 0) + t.alto],
    [],
  );
  const base = (i: number) => (i === 0 ? 0 : alturas[i - 1]);
  const lat = c.laterales;
  const latX = lat ? c.diametro / 2 + lat.ancho / 2 : 0;
  const alPulsar = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      elegir();
    }
  };
  return (
    <g
      className={`comp-cohete${elegido ? ' elegido' : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={elegido}
      aria-label={`${c.nombre}, ${formatearNumero(c.alto, 1)} m`}
      onClick={elegir}
      onKeyDown={alPulsar}
    >
      <rect
        x={cx - anchoCohete(c) / 2 - 2}
        y={-c.alto - 4}
        width={anchoCohete(c) + 4}
        height={c.alto + 16}
        className="comp-zona"
      />
      {lat &&
        [-1, 1].map((lado) => {
          const x = cx + lado * latX;
          const cuerpo = lat.alto * (1 - lat.punta);
          return (
            <g key={lado}>
              <rect
                x={x - lat.ancho / 2}
                y={-(lat.desde + cuerpo)}
                width={lat.ancho}
                height={cuerpo}
                fill={lat.color}
                className="comp-pieza"
              />
              <path
                d={contorno(
                  {
                    alto: lat.alto - cuerpo,
                    abajo: lat.ancho,
                    arriba: 0,
                    color: lat.color,
                  },
                  x,
                  lat.desde + cuerpo,
                )}
                fill={lat.color}
                className="comp-pieza"
              />
            </g>
          );
        })}
      {c.tramos.map((t, i) =>
        t.color === 'transparent' ? null : (
          <path
            key={i}
            d={contorno(t, cx, base(i))}
            fill={t.color}
            className="comp-pieza"
          />
        ),
      )}
      <text x={cx} y={5.2} textAnchor="middle" className="comp-nombre">
        {c.nombre}
      </text>
      <text x={cx} y={9.2} textAnchor="middle" className="comp-anio">
        {c.anio}
      </text>
    </g>
  );
}

/** La Estatua de la Libertad con su pedestal y una persona al lado, como referencia de tamaño. */
function Referencias({ x }: { x: number }) {
  const t = textos({ es: ES, en: EN });
  return (
    <g className="comp-ref" aria-hidden="true">
      <path d={`M${x - 9} 0 L${x + 9} 0 L${x + 6} -27 L${x - 6} -27 Z`} />
      <path
        d={`M${x - 4.5} -27 L${x + 4.5} -27 L${x + 4} -47 L${x - 4} -47 Z`}
      />
      <path d={`M${x - 3} -47 L${x + 3} -47 L${x + 2} -80 L${x - 2} -80 Z`} />
      <circle cx={x} cy={-83} r={2.6} />
      <path
        d={`M${x + 1.5} -78 L${x + 4} -${ESTATUA - 2} M${x + 3} -${ESTATUA - 1} h2`}
        className="comp-ref-linea"
      />
      <rect x={x + 12} y={-1.75} width={0.5} height={1.75} />
      <text x={x} y={5.2} textAnchor="middle" className="comp-nombre">
        {t.estatua}
      </text>
      <text x={x} y={9.2} textAnchor="middle" className="comp-anio">
        {ESTATUA} m
      </text>
    </g>
  );
}

/** Ficha del cohete elegido: país, año, estado, un dato y sus cifras. */
function Ficha({ c }: { c: CoheteReal }) {
  const t = textos({ es: ES, en: EN });
  return (
    <article className="comp-ficha" aria-labelledby="t-comp-ficha" key={c.id}>
      <p className="nasa-rotulo">
        {textos(c.pais)} · {t.primerVuelo} {c.anio} ·{' '}
        <span className={`comp-estado ${c.estado}`}>{t.estados[c.estado]}</span>
      </p>
      <h3 id="t-comp-ficha">{c.nombre}</h3>
      <p className="comp-dato">{textos(c.dato)}</p>
      <p className="comp-pisos">{t.pisos(formatearNumero(c.alto / 3))}</p>
      <dl className="nasa-cifras comp-cifras">
        <Cifra valor={c.alto} decimales={1} unidad="m" etiqueta={t.alto} />
        <Cifra
          valor={c.diametro}
          decimales={1}
          unidad="m"
          etiqueta={t.diametro}
        />
        {c.leo !== null && (
          <Cifra
            valor={c.leo}
            decimales={1}
            unidad="t"
            etiqueta={t.leo}
            acento
          />
        )}
        {c.empuje !== null && (
          <Cifra valor={c.empuje} unidad="kN" etiqueta={t.empuje} />
        )}
        {c.masa !== null && (
          <Cifra valor={c.masa} unidad="t" etiqueta={t.masa} />
        )}
      </dl>
    </article>
  );
}

/** Vista Cohetes a escala: siluetas a la misma escala con la estatua de referencia, la ficha del elegido y la carga de cada uno. */
export function Comparador() {
  const t = textos({ es: ES, en: EN });
  const [orden, setOrden] = useState<Orden>('alto');
  const [elegido, setElegido] = useState('saturnv');
  const lista = ordenarCohetes(COHETES, orden);
  const posiciones = lista.reduce<{ c: CoheteReal; cx: number; fin: number }[]>(
    (l, c) => {
      const inicio = (l.at(-1)?.fin ?? 38) + HUECO;
      const ancho = Math.max(anchoCohete(c), c.nombre.length * 1.75, 9);
      return [...l, { c, cx: inicio + ancho / 2, fin: inicio + ancho }];
    },
    [],
  );
  const ancho = (posiciones.at(-1)?.fin ?? 0) + HUECO;
  const actual = COHETES.find((c) => c.id === elegido) ?? COHETES[0];
  const maxLeo = Math.max(...COHETES.map((c) => c.leo ?? 0));

  return (
    <section className="nasa comp" aria-labelledby="t-comp">
      <CabezaNasa
        id="t-comp"
        kicker={t.kicker}
        titulo={t.titulo}
        lead={t.lead}
        vivo={false}
        fuentes={[
          {
            nombre: 'NASA',
            url: 'https://www.nasa.gov/humans-in-space/space-launch-system/',
          },
          {
            nombre: 'SpaceX',
            url: 'https://www.spacex.com/vehicles/falcon-9/',
          },
          {
            nombre: 'ESA',
            url: 'https://www.esa.int/Enabling_Support/Space_Transportation/Ariane/Ariane_6',
          },
        ]}
        extra={
          <div className="nasa-chips" role="group" aria-label={t.ordenar}>
            {(['alto', 'anio', 'leo'] as Orden[]).map((o) => (
              <button
                key={o}
                type="button"
                className="nasa-chip"
                aria-pressed={orden === o}
                onClick={() => setOrden(o)}
              >
                {t.ordenes[o]}
              </button>
            ))}
          </div>
        }
      />
      <div className="comp-lienzo">
        <svg
          viewBox={`0 ${-TECHO} ${ancho} ${TECHO + 11}`}
          role="group"
          aria-label={t.dibujo}
          style={{ aspectRatio: `${ancho} / ${TECHO + 11}` }}
        >
          {[20, 40, 60, 80, 100, 120].map((m) => (
            <g key={m} className="comp-rejilla">
              <line x1={0} x2={ancho} y1={-m} y2={-m} />
              <text x={1} y={-m - 1}>
                {m} m
              </text>
            </g>
          ))}
          <line x1={0} x2={ancho} y1={0} y2={0} className="comp-suelo" />
          <Referencias x={16} />
          {posiciones.map(({ c, cx }) => (
            <Silueta
              key={c.id}
              c={c}
              cx={cx}
              elegido={c.id === elegido}
              elegir={() => setElegido(c.id)}
            />
          ))}
        </svg>
      </div>
      <div className="comp-cuerpo">
        <Ficha c={actual} />
        <section className="comp-carga" aria-labelledby="t-comp-carga">
          <h3 id="t-comp-carga">{t.carga}</h3>
          <ol>
            {ordenarCohetes(COHETES, 'leo')
              .reverse()
              .map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-pressed={c.id === elegido}
                    onClick={() => setElegido(c.id)}
                  >
                    <span>{c.nombre}</span>
                    <span className="comp-barra">
                      <i
                        style={{ width: `${((c.leo ?? 0) / maxLeo) * 100}%` }}
                      />
                    </span>
                    <small>
                      {c.leo === null
                        ? c.id === 'v2'
                          ? t.suborbital
                          : t.sinDato
                        : `${formatearNumero(c.leo, 1)} t`}
                    </small>
                  </button>
                </li>
              ))}
          </ol>
        </section>
      </div>
      <p className="vuelo-nota">{t.nota}</p>
    </section>
  );
}
