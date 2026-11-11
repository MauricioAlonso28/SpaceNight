import { useEffect, useState, type CSSProperties } from 'react';
import { idioma, textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import { useNaves, type Alejamiento } from '../../servicios/nasa/datos';
import { CabezaNasa, SinDatos } from './CabezaNasa';
import './Naves.css';

const ES = {
  titulo: 'Naves lejanas',
  lead: 'Dónde están ahora las naves de la NASA que viajan por el sistema solar y más allá. Las distancias avanzan en vivo con la velocidad que da JPL Horizons.',
  regla: 'Distancia al Sol, en escala logarítmica',
  deLaTierra: 'de la Tierra',
  luz: 'su señal tarda',
  delSol: 'del Sol',
  velocidad: 'respecto del Sol',
  aleja: 'se aleja',
  acerca: 'se acerca',
  lanzada: 'Lanzada en',
  horizons: 'Datos en JPL Horizons',
  heliopausa: 'Heliopausa',
  ua: 'UA',
};

const EN: typeof ES = {
  titulo: 'Deep-space craft',
  lead: 'Where NASA spacecraft crossing the Solar System and beyond are right now. Distances move live with the speed JPL Horizons gives.',
  regla: 'Distance from the Sun, log scale',
  deLaTierra: 'from Earth',
  luz: 'its signal takes',
  delSol: 'from the Sun',
  velocidad: 'relative to the Sun',
  aleja: 'moving away',
  acerca: 'getting closer',
  lanzada: 'Launched in',
  horizons: 'Data in JPL Horizons',
  heliopausa: 'Heliopause',
  ua: 'AU',
};

const KM_UA = 149_597_870.7;
const C_KMS = 299_792.458;

/** Cada nave: nombre, año de lanzamiento, color y qué hace, por su código en Horizons. */
const NAVES: Record<
  string,
  {
    nombre: string;
    anio: number;
    color: string;
    texto: { es: string; en: string };
  }
> = {
  '-31': {
    nombre: 'Voyager 1',
    anio: 1977,
    color: '#ffd166',
    texto: {
      es: 'El objeto humano más lejano. Cruzó la heliopausa en 2012 y ya viaja por el espacio interestelar.',
      en: 'The farthest human-made object. It crossed the heliopause in 2012 and now travels through interstellar space.',
    },
  },
  '-32': {
    nombre: 'Voyager 2',
    anio: 1977,
    color: '#ff9f6b',
    texto: {
      es: 'La única nave que visitó Urano y Neptuno. Salió al espacio interestelar en 2018.',
      en: 'The only spacecraft to visit Uranus and Neptune. It reached interstellar space in 2018.',
    },
  },
  '-98': {
    nombre: 'New Horizons',
    anio: 2006,
    color: '#8fb4ff',
    texto: {
      es: 'Pasó junto a Plutón en 2015 y junto a Arrokoth en 2019; sigue por el cinturón de Kuiper.',
      en: 'Flew past Pluto in 2015 and Arrokoth in 2019; it keeps crossing the Kuiper Belt.',
    },
  },
  '-96': {
    nombre: 'Parker Solar Probe',
    anio: 2018,
    color: '#ff6b4a',
    texto: {
      es: 'La nave que más se acerca al Sol y la más rápida jamás construida: atraviesa la corona.',
      en: 'The spacecraft that gets closest to the Sun and the fastest ever built: it flies through the corona.',
    },
  },
  '-170': {
    nombre: 'James Webb',
    anio: 2021,
    color: '#f4d58d',
    texto: {
      es: 'El mayor telescopio espacial, en órbita alrededor del punto L2, a 1,5 millones de km de la Tierra.',
      en: 'The largest space telescope, orbiting the L2 point 1.5 million km from Earth.',
    },
  },
  '-159': {
    nombre: 'Europa Clipper',
    anio: 2024,
    color: '#2ec4b6',
    texto: {
      es: 'Viaja hacia Júpiter para estudiar si el océano bajo el hielo de Europa podría albergar vida. Llega en 2030.',
      en: 'On its way to Jupiter to study whether the ocean under Europa’s ice could host life. It arrives in 2030.',
    },
  },
  '-255': {
    nombre: 'Psyche',
    anio: 2023,
    color: '#c77dff',
    texto: {
      es: 'Va al asteroide Psyche, quizá el núcleo metálico de un planeta que nunca terminó de formarse.',
      en: 'Headed to the asteroid Psyche, perhaps the metal core of a planet that never finished forming.',
    },
  },
  '-49': {
    nombre: 'Lucy',
    anio: 2021,
    color: '#7bd389',
    texto: {
      es: 'Recorre los asteroides troyanos que comparten órbita con Júpiter, restos del origen de los planetas.',
      en: 'Touring the Trojan asteroids that share Jupiter’s orbit, leftovers from when the planets formed.',
    },
  },
};

/** Órbitas de referencia en la regla, en UA. */
const REFERENCIAS: [string, number][] = [
  ['Mercurio', 0.39],
  ['Tierra', 1],
  ['Marte', 1.52],
  ['Júpiter', 5.2],
  ['Saturno', 9.54],
  ['Urano', 19.2],
  ['Neptuno', 30.1],
  ['Plutón', 39.5],
];
const EN_NOMBRES: Record<string, string> = {
  Mercurio: 'Mercury',
  Tierra: 'Earth',
  Marte: 'Mars',
  Júpiter: 'Jupiter',
  Saturno: 'Saturn',
  Urano: 'Uranus',
  Neptuno: 'Neptune',
  Plutón: 'Pluto',
};

const UA_MIN = 0.03;
const UA_MAX = 220;

/** Posición de 0 a 100 % en la regla logarítmica. */
const enRegla = (ua: number) =>
  ((Math.log10(Math.min(Math.max(ua, UA_MIN), UA_MAX)) - Math.log10(UA_MIN)) /
    (Math.log10(UA_MAX) - Math.log10(UA_MIN))) *
  100;

/** Distancia ahora a partir de la medida en t0 y la velocidad de alejamiento. */
const kmAhora = (a: Alejamiento, t0: number, ahora: number) =>
  a.km + (a.kms * (ahora - t0)) / 1000;

/** Tiempo de luz como «23 h 59 min 12 s» o «8 min 20 s». */
function tiempoLuz(km: number): string {
  const s = Math.round(km / C_KMS);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} h ${m} min ${s % 60} s` : `${m} min ${s % 60} s`;
}

/** Un reloj que avanza diez veces por segundo, para que los contadores corran. */
function useDecimas(): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 100);
    return () => window.clearInterval(id);
  }, []);
  return ahora;
}

/** Vista Naves lejanas: la regla del Sol a la heliopausa con cada nave y un contador en vivo por nave. */
export function Naves() {
  const t = textos({ es: ES, en: EN });
  const datos = useNaves();
  const ahora = useDecimas();
  const listos = datos && datos !== 'error' ? datos : null;

  const cabeza = (
    <CabezaNasa
      id="t-naves"
      titulo={t.titulo}
      lead={t.lead}
      generado={listos?.generado}
      fuentes={[
        { nombre: 'JPL Horizons', url: 'https://ssd.jpl.nasa.gov/horizons/' },
      ]}
    />
  );
  if (!listos) {
    return (
      <section className="nasa" aria-labelledby="t-naves">
        {cabeza}
        <SinDatos error={datos === 'error'} />
      </section>
    );
  }

  const naves = listos.naves
    .filter((n) => NAVES[n.id])
    .sort((a, b) => b.sol.km - a.sol.km);

  return (
    <section className="nasa naves" aria-labelledby="t-naves">
      {cabeza}
      <figure className="naves-regla" aria-label={t.regla}>
        <div className="naves-eje">
          <span className="naves-sol" aria-hidden="true" />
          {REFERENCIAS.map(([n, ua]) => (
            <span
              key={n}
              className="naves-ref"
              style={{ left: `${enRegla(ua)}%` }}
            >
              <i />
              <small>{idioma() === 'es' ? n : EN_NOMBRES[n]}</small>
            </span>
          ))}
          <span className="naves-helio" style={{ left: `${enRegla(120)}%` }}>
            <small>{t.heliopausa}</small>
          </span>
          {naves.map((n, i) => {
            const ua = kmAhora(n.sol, listos.t0, ahora) / KM_UA;
            const info = NAVES[n.id];
            return (
              <span
                key={n.id}
                className="naves-punto"
                style={
                  {
                    left: `${enRegla(ua)}%`,
                    '--color': info.color,
                    '--fila': i % 4,
                  } as CSSProperties
                }
              >
                <i />
                <small>{info.nombre}</small>
              </span>
            );
          })}
        </div>
        <figcaption>{t.regla}</figcaption>
      </figure>

      <ol className="naves-lista">
        {naves.map((n) => {
          const info = NAVES[n.id];
          const tierra = kmAhora(n.tierra, listos.t0, ahora);
          const sol = kmAhora(n.sol, listos.t0, ahora);
          return (
            <li key={n.id} style={{ '--color': info.color } as CSSProperties}>
              <div className="naves-nombre">
                <h3>{info.nombre}</h3>
                <p>{textos(info.texto)}</p>
                <small>
                  {t.lanzada} {info.anio} ·{' '}
                  <a
                    className="nasa-enlace"
                    href={`https://ssd.jpl.nasa.gov/horizons/app.html#/?tgt=${encodeURIComponent(n.id)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t.horizons} ↗
                  </a>
                </small>
              </div>
              <dl>
                <div className="naves-grande">
                  <dt>{t.deLaTierra}</dt>
                  <dd>
                    {formatearNumero(tierra)} <small>km</small>
                  </dd>
                </div>
                <div>
                  <dt>{t.luz}</dt>
                  <dd>{tiempoLuz(tierra)}</dd>
                </div>
                <div>
                  <dt>{t.delSol}</dt>
                  <dd>
                    {formatearNumero(sol / KM_UA, sol / KM_UA < 10 ? 3 : 2)}{' '}
                    {t.ua}
                  </dd>
                </div>
                <div>
                  <dt>{t.velocidad}</dt>
                  <dd>
                    {formatearNumero(Math.abs(n.sol.kms), 1)} km/s{' '}
                    <small>{n.sol.kms >= 0 ? t.aleja : t.acerca}</small>
                  </dd>
                </div>
              </dl>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
