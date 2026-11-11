import { useState } from 'react';
import { useAhora, useFechaVista } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { textos } from '../../idioma/idioma';
import { Calendario } from './Calendario';
import { Estacion } from './Estacion';
import { Fichas } from './Fichas';
import './Explorar.css';

const SECCIONES = ['fichas', 'calendario', 'estacion'] as const;

type Seccion = (typeof SECCIONES)[number];

const ES = {
  titulo: 'Explorar',
  secciones: 'Secciones de Explorar',
  nombre: {
    fichas: 'Fichas',
    calendario: 'Calendario',
    estacion: 'Estación',
  } as Record<Seccion, string>,
  fuentesTitulo: 'Fuentes y licencias',
  fuentes: [
    ['Sol, Luna, planetas y eclipses', 'Astronomy Engine, de Don Cross', 'MIT'],
    ['Estrellas', 'HYG Database v4.1, de astronexus', 'CC BY-SA 4.0'],
    ['Constelaciones', 'd3-celestial, de Olaf Frohn', 'BSD-3-Clause'],
    [
      'Órbita de la Estación',
      'CelesTrak; cálculo con satellite.js',
      'datos públicos; MIT',
    ],
    ['Clima', 'Open-Meteo.com', 'CC BY 4.0'],
    [
      'Lluvias de meteoros',
      'International Meteor Organization',
      'fechas típicas',
    ],
    [
      'Declinación magnética',
      'World Magnetic Model 2025 (NOAA), con magvar',
      'dominio público; MIT',
    ],
    ['Mapa del mundo', 'Natural Earth', 'dominio público'],
    ['Fichas de planetas', 'NASA Planetary Fact Sheets', 'redactadas a mano'],
    [
      'Texturas del Sol, la Luna y los planetas',
      'Solar System Scope',
      'CC BY 4.0',
    ],
    [
      'NASA en vivo',
      'NeoWs, EPIC, EONET, JPL Fireball y Sentry, Exoplanet Archive, NASA Image Library',
      'datos públicos de la NASA',
    ],
  ] as [string, string, string][],
};

const EN: typeof ES = {
  titulo: 'Explore',
  secciones: 'Explore sections',
  nombre: {
    fichas: 'Fact sheets',
    calendario: 'Calendar',
    estacion: 'Space Station',
  },
  fuentesTitulo: 'Sources and licenses',
  fuentes: [
    [
      'Sun, Moon, planets and eclipses',
      'Astronomy Engine, by Don Cross',
      'MIT',
    ],
    ['Stars', 'HYG Database v4.1, by astronexus', 'CC BY-SA 4.0'],
    ['Constellations', 'd3-celestial, by Olaf Frohn', 'BSD-3-Clause'],
    [
      'Space Station orbit',
      'CelesTrak; computed with satellite.js',
      'public data; MIT',
    ],
    ['Weather', 'Open-Meteo.com', 'CC BY 4.0'],
    ['Meteor showers', 'International Meteor Organization', 'typical dates'],
    [
      'Magnetic declination',
      'World Magnetic Model 2025 (NOAA), via magvar',
      'public domain; MIT',
    ],
    ['World map', 'Natural Earth', 'public domain'],
    ['Planet fact sheets', 'NASA Planetary Fact Sheets', 'written by hand'],
    ['Sun, Moon and planet textures', 'Solar System Scope', 'CC BY 4.0'],
    [
      'NASA live',
      'NeoWs, EPIC, EONET, JPL Fireball and Sentry, Exoplanet Archive, NASA Image Library',
      'NASA public data',
    ],
  ],
};

/** Explorar: fichas del sistema solar, calendario del mes, la Estación Espacial y las fuentes. */
export function Explorar() {
  const t = textos({ es: ES, en: EN });
  const [seccion, setSeccion] = useState<Seccion>('fichas');
  const ahora = useAhora();
  const fecha = useFechaVista();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);

  return (
    <section className="explorar" aria-labelledby="t-explorar">
      <h2 id="t-explorar" className="explorar-titulo">
        {t.titulo}
      </h2>
      <div className="segmentos" role="tablist" aria-label={t.secciones}>
        {SECCIONES.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            id={`tab-${s}`}
            aria-selected={seccion === s}
            aria-controls={`panel-${s}`}
            className="segmento"
            onClick={() => setSeccion(s)}
          >
            {t.nombre[s]}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${seccion}`}
        aria-labelledby={`tab-${seccion}`}
      >
        {seccion === 'fichas' && <Fichas fecha={ahora} />}
        {seccion === 'calendario' && (
          <Calendario
            fecha={fecha}
            ubicacion={ubicacion}
            formato24h={formato24h}
          />
        )}
        {seccion === 'estacion' && (
          <Estacion
            ahora={ahora}
            ubicacion={ubicacion}
            formato24h={formato24h}
          />
        )}
      </div>
      <details className="fuentes">
        <summary>{t.fuentesTitulo}</summary>
        <ul>
          {t.fuentes.map(([que, fuente, licencia]) => (
            <li key={que}>
              <b>{que}:</b> {fuente} ({licencia})
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
