import { useMemo, useState } from 'react';
import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  COMBUSTIBLES,
  DESTINOS,
  MODELOS,
  altoEtapa,
  calcularCohete,
  destinosAlcanzados,
  diametroCohete,
  type Combustible,
  type EtapaDiseno,
} from '../../servicios/cohete/tsiolkovsky';
import { CabezaNasa } from '../Nasa/CabezaNasa';
import './Arma.css';

const ES = {
  kicker: 'Cohete',
  titulo: 'Arma tu cohete',
  lead: 'Elige etapas, combustible, propelente y motores. La ecuación de Tsiolkovsky dice cuánta velocidad puede ganar y hasta dónde llega con tu carga.',
  modelos: 'Empezar desde',
  etapa: (n: number) => `Etapa ${n}`,
  combustible: 'Combustible',
  combustibles: {
    queroseno: 'Queroseno',
    metano: 'Metano',
    hidrogeno: 'Hidrógeno',
    solido: 'Sólido',
  } as Record<Combustible, string>,
  propelente: 'Propelente',
  motores: 'Motores',
  menos: 'Un motor menos',
  mas: 'Un motor más',
  quitar: 'Quitar la etapa',
  agregar: '+ Añadir una etapa encima',
  carga: 'Carga útil',
  dv: 'Δv total',
  masa: 'masa al despegar',
  empujePeso: 'empuje / peso al despegar',
  alto: 'de alto',
  noDespega:
    'No despega: los motores de la primera etapa empujan menos que 1,15 veces el peso del cohete. Añade motores o quita propelente.',
  llega: 'Le alcanza hasta',
  noLlega: 'No llega a la órbita',
  formula: 'Etapa por etapa',
  explicacion:
    'Cada etapa gana Δv = Isp · g₀ · ln(masa inicial / masa final). Al soltar lo vacío, la siguiente ya no carga con ese peso: por eso los cohetes van por etapas.',
  debil: (n: number) =>
    `La etapa ${n} empuja menos que su peso: perdería mucha velocidad contra la gravedad.`,
  dibujo: 'Silueta del cohete a escala',
  destinos: 'Cuánto Δv hace falta para cada destino',
};

const EN: typeof ES = {
  kicker: 'Rocket',
  titulo: 'Build a rocket',
  lead: 'Pick stages, propellant type and amount, and engines. The Tsiolkovsky equation tells how much speed it can gain and how far it gets with your payload.',
  modelos: 'Start from',
  etapa: (n) => `Stage ${n}`,
  combustible: 'Propellant',
  combustibles: {
    queroseno: 'Kerosene',
    metano: 'Methane',
    hidrogeno: 'Hydrogen',
    solido: 'Solid',
  },
  propelente: 'Propellant',
  motores: 'Engines',
  menos: 'One engine fewer',
  mas: 'One more engine',
  quitar: 'Remove the stage',
  agregar: '+ Add a stage on top',
  carga: 'Payload',
  dv: 'Total Δv',
  masa: 'liftoff mass',
  empujePeso: 'thrust / weight at liftoff',
  alto: 'tall',
  noDespega:
    'It does not lift off: the first-stage engines push less than 1.15 times the rocket’s weight. Add engines or remove propellant.',
  llega: 'Gets as far as',
  noLlega: 'It does not reach orbit',
  formula: 'Stage by stage',
  explicacion:
    'Each stage gains Δv = Isp · g₀ · ln(initial mass / final mass). Dropping the empty one means the next no longer carries that weight: that is why rockets have stages.',
  debil: (n) =>
    `Stage ${n} pushes less than its weight: it would lose a lot of speed fighting gravity.`,
  dibujo: 'Rocket silhouette to scale',
  destinos: 'How much Δv each destination takes',
};

const TIPOS: Combustible[] = ['queroseno', 'metano', 'hidrogeno', 'solido'];
const DV_MAX = 17_000;

/** Posición de 0 a 1000 de un deslizador logarítmico para un valor entre min y max. */
const aLog = (v: number, min: number, max: number) =>
  (Math.log(v / min) / Math.log(max / min)) * 1000;

/** Valor de un deslizador logarítmico, redondeado a algo legible. */
function deLog(p: number, min: number, max: number): number {
  const v = min * (max / min) ** (p / 1000);
  const paso = v < 10 ? 0.1 : v < 100 ? 1 : v < 1000 ? 5 : 50;
  return Math.round(v / paso) * paso;
}

/** La silueta del cohete a escala: cada etapa con el color de su combustible y la cofia arriba. */
function Silueta({ etapas, carga }: { etapas: EtapaDiseno[]; carga: number }) {
  const t = textos({ es: ES, en: EN });
  const d = diametroCohete(etapas);
  const altos = etapas.map((e) => altoEtapa(e, d));
  const cofia = Math.max(4, Math.min(16, 4 + Math.sqrt(carga) * 1.2));
  const total = altos.reduce((s, a) => s + a, 0) + cofia;
  const escalaM = 360 / Math.max(total, 60);
  const ancho = d * escalaM;
  const arriba = altos.map(
    (_, i) => 380 - altos.slice(0, i + 1).reduce((a, b) => a + b, 0) * escalaM,
  );
  const y = 380 - (total - cofia) * escalaM;
  return (
    <figure className="arma-silueta">
      <svg viewBox="0 0 160 400" role="img" aria-label={t.dibujo}>
        <line x1="10" x2="150" y1="380" y2="380" className="arma-suelo" />
        {etapas.map((e, i) => {
          const h = altos[i] * escalaM;
          return (
            <g key={i}>
              <rect
                x={80 - ancho / 2}
                y={arriba[i]}
                width={ancho}
                height={h}
                rx={Math.min(3, ancho / 6)}
                fill={COMBUSTIBLES[e.combustible].color}
                className="arma-etapa"
              />
              <text
                x={80 + ancho / 2 + 6}
                y={arriba[i] + h / 2 + 4}
                className="arma-num"
              >
                {i + 1}
              </text>
            </g>
          );
        })}
        <path
          d={`M${80 - ancho / 2} ${y} Q${80 - ancho / 2} ${y - cofia * escalaM * 0.7} 80 ${y - cofia * escalaM} Q${80 + ancho / 2} ${y - cofia * escalaM * 0.7} ${80 + ancho / 2} ${y} Z`}
          className="arma-cofia"
        />
        <g className="arma-persona" transform="translate(140 380)">
          <circle
            cy={-1.75 * escalaM + 0.15 * escalaM}
            r={Math.max(0.6, 0.15 * escalaM)}
          />
          <line y1={-1.5 * escalaM} y2="0" />
        </g>
      </svg>
      <figcaption>
        {formatearNumero(total)} m {t.alto} · Ø {formatearNumero(d, 1)} m
      </figcaption>
    </figure>
  );
}

/** La escala de Δv con cada destino y hasta dónde llega el cohete. */
function Escala({ dv, alcanzados }: { dv: number; alcanzados: string[] }) {
  const t = textos({ es: ES, en: EN });
  const y = (v: number) => 380 - (Math.min(v, DV_MAX) / DV_MAX) * 360;
  const rotulos = DESTINOS.reduce<number[]>((lista, d) => {
    const previo = lista.at(-1);
    lista.push(previo === undefined ? y(d.dv) : Math.min(y(d.dv), previo - 30));
    return lista;
  }, []);
  return (
    <svg
      className="arma-escala"
      viewBox="0 0 220 400"
      role="img"
      aria-label={t.destinos}
    >
      <rect
        x="20"
        y="20"
        width="14"
        height="360"
        rx="7"
        className="arma-tubo"
      />
      <rect
        x="20"
        y={y(dv)}
        width="14"
        height={380 - y(dv)}
        rx="7"
        className="arma-lleno"
      />
      {DESTINOS.map((d, i) => (
        <g
          key={d.id}
          className={alcanzados.includes(d.id) ? 'alcanzado' : undefined}
        >
          <path
            d={`M38 ${y(d.dv)} H48 L56 ${rotulos[i]} H62`}
            className="arma-guia"
          />
          <text x="66" y={rotulos[i] + 4}>
            {textos(d.nombre)}
          </text>
          <text x="66" y={rotulos[i] + 17} className="arma-dv">
            {formatearNumero(d.dv / 1000, 1)} km/s
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Editor de una etapa: combustible, propelente con deslizador logarítmico y motores. */
function EditorEtapa({
  n,
  etapa,
  cambiar,
  quitar,
  dv,
}: {
  n: number;
  etapa: EtapaDiseno;
  cambiar: (e: EtapaDiseno) => void;
  quitar?: () => void;
  dv: number;
}) {
  const t = textos({ es: ES, en: EN });
  const motor = COMBUSTIBLES[etapa.combustible].motor;
  return (
    <fieldset
      className="arma-etapa-editor"
      style={{ borderColor: COMBUSTIBLES[etapa.combustible].color }}
    >
      <legend>
        {t.etapa(n)} <small>+{formatearNumero(dv / 1000, 2)} km/s</small>
      </legend>
      <div className="nasa-chips" role="group" aria-label={t.combustible}>
        {TIPOS.map((c) => (
          <button
            key={c}
            type="button"
            className="nasa-chip"
            aria-pressed={etapa.combustible === c}
            onClick={() => cambiar({ ...etapa, combustible: c })}
          >
            <i style={{ background: COMBUSTIBLES[c].color }} />
            {t.combustibles[c]}
          </button>
        ))}
      </div>
      <label className="arma-fila">
        <span>{t.propelente}</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={aLog(etapa.propelente, 1, 5000)}
          onChange={(e) =>
            cambiar({
              ...etapa,
              propelente: deLog(Number(e.target.value), 1, 5000),
            })
          }
        />
        <output>
          {formatearNumero(etapa.propelente, etapa.propelente < 10 ? 1 : 0)} t
        </output>
      </label>
      <div className="arma-fila">
        <span>{t.motores}</span>
        <div className="arma-contador">
          <button
            type="button"
            className="nasa-chip"
            aria-label={t.menos}
            disabled={etapa.motores <= 1}
            onClick={() => cambiar({ ...etapa, motores: etapa.motores - 1 })}
          >
            −
          </button>
          <output>
            {etapa.motores} × {motor.nombre}
          </output>
          <button
            type="button"
            className="nasa-chip"
            aria-label={t.mas}
            disabled={etapa.motores >= 45}
            onClick={() => cambiar({ ...etapa, motores: etapa.motores + 1 })}
          >
            +
          </button>
        </div>
        <small>{formatearNumero(etapa.motores * motor.empuje)} kN</small>
      </div>
      {quitar && (
        <button
          type="button"
          className="nasa-enlace arma-quitar"
          onClick={quitar}
        >
          {t.quitar}
        </button>
      )}
    </fieldset>
  );
}

/** Vista Arma tu cohete: el editor de etapas, la silueta a escala, la escala de destinos y el cálculo etapa por etapa. */
export function Arma() {
  const t = textos({ es: ES, en: EN });
  const [etapas, setEtapas] = useState<EtapaDiseno[]>(MODELOS[0].etapas);
  const [carga, setCarga] = useState(MODELOS[0].carga);
  const calculo = useMemo(() => calcularCohete(etapas, carga), [etapas, carga]);
  const alcanzados = destinosAlcanzados(calculo.dv, calculo.despega);
  const ultimo = DESTINOS.filter((d) => alcanzados.includes(d.id)).at(-1);
  const cambiar = (i: number, e: EtapaDiseno) =>
    setEtapas(etapas.map((x, j) => (j === i ? e : x)));

  return (
    <section className="nasa arma" aria-labelledby="t-arma">
      <CabezaNasa
        id="t-arma"
        kicker={t.kicker}
        titulo={t.titulo}
        lead={t.lead}
        vivo={false}
        fuentes={[
          {
            nombre: 'NASA · Ideal Rocket Equation',
            url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/ideal-rocket-equation/',
          },
          {
            nombre: 'NASA · Specific Impulse',
            url: 'https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/specific-impulse/',
          },
        ]}
      />
      <div className="arma-modelos">
        <span className="nasa-rotulo">{t.modelos}</span>
        <div className="nasa-chips">
          {MODELOS.map((m) => (
            <button
              key={m.id}
              type="button"
              className="nasa-chip"
              onClick={() => {
                setEtapas(m.etapas);
                setCarga(m.carga);
              }}
            >
              {textos(m.nombre)}
            </button>
          ))}
        </div>
      </div>
      <div className="arma-cuerpo">
        <div className="arma-editor">
          <label className="arma-fila arma-carga">
            <span>{t.carga}</span>
            <input
              type="range"
              min={0}
              max={1000}
              value={aLog(Math.max(carga, 0.1), 0.1, 300)}
              onChange={(e) =>
                setCarga(deLog(Number(e.target.value), 0.1, 300))
              }
            />
            <output>{formatearNumero(carga, carga < 10 ? 1 : 0)} t</output>
          </label>
          {[...etapas]
            .map((e, i) => ({ e, i }))
            .reverse()
            .map(({ e, i }) => (
              <EditorEtapa
                key={i}
                n={i + 1}
                etapa={e}
                dv={calculo.etapas[i]?.dv ?? 0}
                cambiar={(x) => cambiar(i, x)}
                quitar={
                  etapas.length > 1
                    ? () => setEtapas(etapas.filter((_, j) => j !== i))
                    : undefined
                }
              />
            ))}
          {etapas.length < 3 && (
            <button
              type="button"
              className="nasa-chip arma-agregar"
              onClick={() =>
                setEtapas([
                  ...etapas,
                  { combustible: 'hidrogeno', propelente: 40, motores: 1 },
                ])
              }
            >
              {t.agregar}
            </button>
          )}
        </div>
        <div className="arma-resultado">
          <dl className="nasa-cifras arma-cifras">
            <div className={`nasa-cifra${calculo.despega ? ' acento' : ''}`}>
              <dd>
                {formatearNumero(calculo.dv / 1000, 2)}
                <small>km/s</small>
              </dd>
              <dt>{t.dv}</dt>
            </div>
            <div className="nasa-cifra">
              <dd>
                {formatearNumero(calculo.masa)}
                <small>t</small>
              </dd>
              <dt>{t.masa}</dt>
            </div>
            <div className="nasa-cifra">
              <dd>{formatearNumero(calculo.etapas[0]?.empujePeso ?? 0, 2)}</dd>
              <dt>{t.empujePeso}</dt>
            </div>
          </dl>
          <p
            className={`arma-veredicto${calculo.despega && ultimo ? ' bien' : ' mal'}`}
          >
            {!calculo.despega
              ? t.noDespega
              : ultimo
                ? `${t.llega}: ${textos(ultimo.nombre)}`
                : t.noLlega}
          </p>
          {calculo.etapas.slice(1).map((e, i) =>
            e.empujePeso < 0.5 ? (
              <p key={i} className="arma-aviso">
                {t.debil(i + 2)}
              </p>
            ) : null,
          )}
          <div className="arma-dibujos">
            <Silueta etapas={etapas} carga={carga} />
            <Escala
              dv={calculo.despega ? calculo.dv : 0}
              alcanzados={alcanzados}
            />
          </div>
        </div>
      </div>
      <section className="arma-formula" aria-labelledby="t-formula">
        <h3 id="t-formula">{t.formula}</h3>
        <p>{t.explicacion}</p>
        <ol>
          {calculo.etapas.map((e, i) => (
            <li key={i}>
              <strong>{t.etapa(i + 1)}</strong>
              <code>
                {e.isp} s × {formatearNumero(9.81, 2)} × ln(
                {formatearNumero(e.inicial, 1)} t /{' '}
                {formatearNumero(e.final, 1)} t)
              </code>
              <span>= {formatearNumero(e.dv)} m/s</span>
            </li>
          ))}
        </ol>
      </section>
    </section>
  );
}
