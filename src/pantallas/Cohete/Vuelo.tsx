import { useDeferredValue, useMemo, useState } from 'react';
import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  simularAscenso,
  type Recuperacion,
} from '../../servicios/cohete/vuelo';
import { CabezaNasa } from '../Nasa/CabezaNasa';
import { Trayectoria } from './Trayectoria';
import './Vuelo.css';

const ES = {
  kicker: 'Cohete',
  titulo: 'Simulador de vuelo',
  lead: 'Un cohete de dos etapas con los números públicos del Falcon 9, simulado paso a paso: gravedad, aire que se adelgaza, empuje que cambia con la altura y propelente que se gasta. Elige la carga y si la primera etapa vuelve.',
  carga: 'Carga útil',
  recuperacion: 'Primera etapa',
  modos: {
    barcaza: 'Aterriza en una barcaza',
    base: 'Vuelve a la base',
    ninguna: 'Se desecha',
  } as Record<Recuperacion, string>,
  maximo: (t: string) => `llega con hasta ~${t} t`,
  enOrbita: (pe: string, ap: string) => `Carga en órbita: ${pe} × ${ap} km.`,
  noLlega: (dv: string) =>
    `No llega a la órbita: le faltan ${dv} m/s. Prueba con menos carga o deja de recuperar la primera etapa.`,
  nota: 'Es un modelo simplificado (Tierra esférica, aire exponencial, guiado sencillo), así que las cifras son aproximadas.',
};

const EN: typeof ES = {
  kicker: 'Rocket',
  titulo: 'Flight simulator',
  lead: 'A two-stage rocket with the Falcon 9’s public numbers, simulated step by step: gravity, thinning air, thrust that changes with altitude and propellant burning off. Pick the payload and whether the first stage comes back.',
  carga: 'Payload',
  recuperacion: 'First stage',
  modos: {
    barcaza: 'Lands on a drone ship',
    base: 'Returns to base',
    ninguna: 'Expended',
  },
  maximo: (t) => `carries up to ~${t} t`,
  enOrbita: (pe, ap) => `Payload in orbit: ${pe} × ${ap} km.`,
  noLlega: (dv) =>
    `It does not reach orbit: ${dv} m/s short. Try a lighter payload or stop recovering the first stage.`,
  nota: 'It is a simplified model (spherical Earth, exponential air, simple guidance), so the figures are approximate.',
};

const MODOS: Recuperacion[] = ['base', 'barcaza', 'ninguna'];

/** Carga máxima que llega a órbita con un modo de recuperación, por bisección, redondeada a 100 kg. */
function cargaMaxima(modo: Recuperacion): number {
  let bajo = 0;
  let alto = 32_000;
  for (let i = 0; i < 9; i++) {
    const medio = (bajo + alto) / 2;
    if (simularAscenso(medio, modo).enOrbita) bajo = medio;
    else alto = medio;
  }
  return Math.floor(bajo / 100) * 100;
}

/** Vista Simulador de vuelo: elegir carga y recuperación y ver el ascenso a órbita con su telemetría. */
export function Vuelo() {
  const t = textos({ es: ES, en: EN });
  const [carga, setCarga] = useState(15_000);
  const [modo, setModo] = useState<Recuperacion>('barcaza');
  const cargaSim = useDeferredValue(carga);
  const ascenso = useMemo(
    () => simularAscenso(cargaSim, modo),
    [cargaSim, modo],
  );
  const maximos = useMemo(
    () =>
      Object.fromEntries(MODOS.map((m) => [m, cargaMaxima(m)])) as Record<
        Recuperacion,
        number
      >,
    [],
  );
  const km = (m: number) => formatearNumero(m / 1000);

  return (
    <section className="nasa vuelo" aria-labelledby="t-vuelo">
      <CabezaNasa
        id="t-vuelo"
        kicker={t.kicker}
        vivo={false}
        titulo={t.titulo}
        lead={t.lead}
        fuentes={[
          {
            nombre: 'Falcon User’s Guide (SpaceX)',
            url: 'https://www.spacex.com/assets/media/falcon-users-guide-2025-05-09.pdf',
          },
          {
            nombre: 'NASA Beginner’s Guide to Rockets',
            url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/',
          },
        ]}
      />
      <div className="vuelo-ajustes">
        <label className="vuelo-carga">
          <span className="nasa-rotulo">{t.carga}</span>
          <output>
            {formatearNumero(carga / 1000, 1)} <small>t</small>
          </output>
          <input
            type="range"
            min={0}
            max={30_000}
            step={500}
            value={carga}
            onChange={(e) => setCarga(Number(e.target.value))}
          />
        </label>
        <fieldset className="vuelo-modos">
          <legend className="nasa-rotulo">{t.recuperacion}</legend>
          {MODOS.map((m) => (
            <button
              key={m}
              type="button"
              className="nasa-chip"
              aria-pressed={modo === m}
              onClick={() => setModo(m)}
            >
              <span>{t.modos[m]}</span>
              <small>{t.maximo(formatearNumero(maximos[m] / 1000, 1))}</small>
            </button>
          ))}
        </fieldset>
      </div>
      <Trayectoria
        key={`${cargaSim}-${modo}`}
        muestras={ascenso.muestras}
        hitos={ascenso.hitos}
        resultado={
          <p className={ascenso.enOrbita ? 'bien' : 'mal'}>
            {ascenso.enOrbita
              ? t.enOrbita(km(ascenso.perigeo), km(ascenso.apogeo))
              : t.noLlega(formatearNumero(ascenso.faltaVelocidad))}
          </p>
        }
      />
      <p className="vuelo-nota">{t.nota}</p>
    </section>
  );
}
