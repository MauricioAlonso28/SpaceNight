import { useState } from 'react';
import { useAhora, useFechaVista } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { Calendario } from './Calendario';
import { Estacion } from './Estacion';
import { Fichas } from './Fichas';
import './Explorar.css';

const SECCIONES = [
  { id: 'fichas', nombre: 'Fichas' },
  { id: 'calendario', nombre: 'Calendario' },
  { id: 'estacion', nombre: 'Estación' },
] as const;

type Seccion = (typeof SECCIONES)[number]['id'];

const FUENTES: readonly [string, string, string][] = [
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
];

/** Explorar: fichas del sistema solar, calendario del mes, la Estación Espacial y las fuentes. */
export function Explorar() {
  const [seccion, setSeccion] = useState<Seccion>('fichas');
  const ahora = useAhora();
  const fecha = useFechaVista();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);

  return (
    <section className="explorar" aria-labelledby="t-explorar">
      <h2 id="t-explorar" className="explorar-titulo">
        Explorar
      </h2>
      <div
        className="segmentos"
        role="tablist"
        aria-label="Secciones de Explorar"
      >
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            id={`tab-${s.id}`}
            aria-selected={seccion === s.id}
            aria-controls={`panel-${s.id}`}
            className="segmento"
            onClick={() => setSeccion(s.id)}
          >
            {s.nombre}
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
      <section className="fuentes" aria-labelledby="t-fuentes">
        <h3 id="t-fuentes">Fuentes y licencias</h3>
        <ul>
          {FUENTES.map(([que, fuente, licencia]) => (
            <li key={que}>
              <b>{que}:</b> {fuente} ({licencia})
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}
