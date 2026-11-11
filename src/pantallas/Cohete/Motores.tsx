import { useState } from 'react';
import { textos } from '../../idioma/idioma';
import {
  CICLOS,
  puntosTubo,
  type Ciclo,
  type Fluido,
  type Pieza,
} from '../../servicios/cohete/ciclos';
import { CabezaNasa } from '../Nasa/CabezaNasa';
import './Motores.css';

const ES = {
  kicker: 'Cohete',
  titulo: 'Motores por dentro',
  lead: 'Un motor cohete es sobre todo una forma de meter propelente en la cámara a una presión enorme. Así lo resuelven los seis ciclos que vuelan hoy, del más simple al más complejo.',
  ciclo: 'Ciclo',
  como: 'Cómo funciona',
  pros: 'A favor',
  contras: 'En contra',
  motores: 'Lo usan',
  presion: 'Presión en la cámara',
  niveles: ['baja', 'media', 'alta', 'muy alta'],
  diagrama: (n: string) => `Diagrama del ciclo ${n}`,
  fluidos: {
    combustible: 'Combustible',
    oxidante: 'Oxígeno líquido',
    caliente: 'Gas caliente',
    gas: 'Helio',
    electrico: 'Electricidad',
    eje: 'Eje',
  } as Record<Fluido, string>,
};

const EN: typeof ES = {
  kicker: 'Rocket',
  titulo: 'Engines from inside',
  lead: 'A rocket engine is mostly a way of forcing propellant into the chamber at enormous pressure. This is how the six cycles flying today do it, from the simplest to the most complex.',
  ciclo: 'Cycle',
  como: 'How it works',
  pros: 'Pros',
  contras: 'Cons',
  motores: 'Used by',
  presion: 'Chamber pressure',
  niveles: ['low', 'medium', 'high', 'very high'],
  diagrama: (n) => `Diagram of the ${n} cycle`,
  fluidos: {
    combustible: 'Fuel',
    oxidante: 'Liquid oxygen',
    caliente: 'Hot gas',
    gas: 'Helium',
    electrico: 'Electricity',
    eje: 'Shaft',
  },
};

/** El dibujo de una pieza en su posición: tanques, bombas, turbinas, quemadores y la cámara con su tobera. */
function DibujoPieza({ p, foco }: { p: Pieza; foco: string | null }) {
  const clase = `motor-pieza ${p.tipo}${foco === p.id ? ' foco' : ''}${foco && foco !== p.id ? ' tenue' : ''}`;
  const titulo = <title>{textos(p.nombre)}</title>;
  switch (p.tipo) {
    case 'tanque-f':
    case 'tanque-o':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <rect x="-44" y="-26" width="88" height="52" rx="22" />
          <text y="5" textAnchor="middle">
            {p.tipo === 'tanque-f' ? 'F' : 'O₂'}
          </text>
        </g>
      );
    case 'helio':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <circle r="20" />
          <text y="5" textAnchor="middle">
            He
          </text>
        </g>
      );
    case 'bomba':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <circle r="17" />
          <path
            d="M0 -11 Q6 -4 0 0 Q-6 4 0 11 M-11 0 Q-4 -6 0 0 Q4 6 11 0"
            className="motor-giro"
          />
        </g>
      );
    case 'turbina':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <circle r="17" />
          <path
            d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z"
            className="motor-giro"
          />
        </g>
      );
    case 'quemador':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <rect x="-26" y="-14" width="52" height="28" rx="6" />
          <path
            d="M0 8 C-7 2 -3 -3 0 -9 C3 -3 7 2 0 8 Z"
            className="motor-llamita"
          />
        </g>
      );
    case 'bateria':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <rect x="-26" y="-14" width="52" height="28" rx="4" />
          <path d="M-8 0 h6 M-5 -3 v6 M4 0 h6" className="motor-signo" />
        </g>
      );
    case 'escape':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <path d="M-6 -10 h12 l6 22 h-24 z" />
          <path d="M-8 14 Q0 30 8 14" className="motor-humo" />
        </g>
      );
    case 'camisa':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <circle r="9" />
        </g>
      );
    case 'camara':
      return (
        <g className={clase} transform={`translate(${p.x} ${p.y})`}>
          {titulo}
          <path
            d="M-30 -22 H30 V18 C30 34 50 82 76 126 H-76 C-50 82 -30 34 -30 18 Z"
            className="motor-tobera"
          />
          <rect x="-30" y="-22" width="60" height="40" rx="8" />
          <path d="M-60 130 Q0 220 60 130" className="motor-chorro" />
          <path d="M-36 130 Q0 185 36 130" className="motor-chorro dentro" />
        </g>
      );
  }
}

/** El diagrama animado de un ciclo, con la pieza enfocada resaltada. */
function Diagrama({ c, foco }: { c: Ciclo; foco: string | null }) {
  const t = textos({ es: ES, en: EN });
  return (
    <svg
      className="motor-diagrama"
      viewBox="0 0 400 525"
      role="img"
      aria-label={t.diagrama(textos(c.nombre))}
    >
      {c.tubos.map((tubo, i) => (
        <polyline
          key={i}
          points={puntosTubo(c, tubo)
            .map((p) => p.join(','))
            .join(' ')}
          className={`motor-tubo ${tubo.fluido}${tubo.fino ? ' fino' : ''}`}
        />
      ))}
      {c.piezas.map((p) => (
        <DibujoPieza key={p.id} p={p} foco={foco} />
      ))}
    </svg>
  );
}

/** Vista Motores por dentro: elegir un ciclo, verlo funcionar y leer paso a paso qué hace cada pieza. */
export function Motores() {
  const t = textos({ es: ES, en: EN });
  const [id, setId] = useState(CICLOS[2].id);
  const [foco, setFoco] = useState<string | null>(null);
  const c = CICLOS.find((x) => x.id === id) ?? CICLOS[0];
  const fluidos = [...new Set(c.tubos.map((x) => x.fluido))];

  return (
    <section className="nasa motores" aria-labelledby="t-motores">
      <CabezaNasa
        id="t-motores"
        kicker={t.kicker}
        titulo={t.titulo}
        lead={t.lead}
        vivo={false}
        fuentes={[
          {
            nombre: 'NASA · Liquid Rocket Engine',
            url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/liquid-rocket-engine/',
          },
          {
            nombre: 'NASA SP-125 (Huzel & Huang)',
            url: 'https://ntrs.nasa.gov/citations/19710019929',
          },
        ]}
      />
      <div
        className="nasa-chips motor-ciclos"
        role="tablist"
        aria-label={t.ciclo}
      >
        {CICLOS.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            className="nasa-chip"
            aria-selected={x.id === id}
            aria-pressed={x.id === id}
            onClick={() => {
              setId(x.id);
              setFoco(null);
            }}
          >
            {textos(x.nombre)}
          </button>
        ))}
      </div>
      <div className="motor-cuerpo" key={c.id}>
        <figure className="motor-figura">
          <Diagrama c={c} foco={foco} />
          <figcaption className="motor-leyenda">
            {fluidos.map((f) => (
              <span key={f}>
                <i className={`motor-muestra ${f}`} />
                {t.fluidos[f]}
              </span>
            ))}
          </figcaption>
        </figure>
        <div className="motor-texto">
          <h3>{textos(c.nombre)}</h3>
          <p className="motor-resumen">{textos(c.resumen)}</p>
          <h4 className="nasa-rotulo">{t.como}</h4>
          <ol className="motor-pasos">
            {c.pasos.map((p, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-pressed={foco === p.pieza}
                  onMouseEnter={() => setFoco(p.pieza)}
                  onMouseLeave={() => setFoco(null)}
                  onFocus={() => setFoco(p.pieza)}
                  onBlur={() => setFoco(null)}
                  onClick={() => setFoco(p.pieza)}
                >
                  <span>{i + 1}</span>
                  {textos(p)}
                </button>
              </li>
            ))}
          </ol>
          <dl className="motor-datos">
            <div>
              <dt>{t.pros}</dt>
              <dd>{textos(c.pros)}</dd>
            </div>
            <div>
              <dt>{t.contras}</dt>
              <dd>{textos(c.contras)}</dd>
            </div>
            <div>
              <dt>{t.motores}</dt>
              <dd>{c.motores.join(' · ')}</dd>
            </div>
            <div>
              <dt>{t.presion}</dt>
              <dd className="motor-presion">
                {[1, 2, 3, 4].map((n) => (
                  <i key={n} className={n <= c.presion ? 'lleno' : undefined} />
                ))}
                <span>{t.niveles[c.presion - 1]}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
