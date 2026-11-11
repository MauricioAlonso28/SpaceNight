import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as EventoPuntero,
} from 'react';
import { useAhora } from '../../estado/hooks';
import { idioma, textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  useExoplanetas,
  type FilaExoplaneta,
} from '../../servicios/nasa/datos';
import {
  ANIOS_LUZ_POR_PC,
  EJES,
  SISTEMA_SOLAR,
  enEscalaLog,
  porAnioYMetodo,
  sistemaMasCercano,
  templado,
} from '../../servicios/nasa/exoplanetas';
import { nombrePlaneta } from '../../idioma/comunes';
import { CabezaNasa, Cifra, SinDatos } from './CabezaNasa';
import './Exoplanetas.css';

const ES = {
  titulo: 'Exoplanetas',
  lead: 'Todos los planetas confirmados alrededor de otras estrellas. Cada punto es uno: hacia la derecha tarda más en dar la vuelta a su estrella, hacia arriba es más grande. Los aros marcan los planetas del sistema solar.',
  total: 'planetas confirmados',
  templados: 'rocosos y templados',
  cercano: (e: string) => `el sistema más cercano · ${e}`,
  esteAnio: (a: number) => `descubiertos en ${a}`,
  metodo: 'Método de descubrimiento',
  soloTemplados: 'Solo rocosos y templados',
  buscar: 'Buscar un planeta o una estrella',
  hasta: 'Descubiertos hasta',
  reproducir: 'Ver cómo se descubrieron',
  pausar: 'Pausar',
  ejeX: 'Período orbital (días, escala logarítmica)',
  ejeY: 'Radio (Tierras)',
  zonas: {
    calientes: 'Júpiter calientes',
    gigantes: 'Gigantes',
    neptunos: 'Minineptunos',
    tierras: 'Tamaño Tierra',
  },
  radio: 'Radio',
  periodo: 'Año',
  temperatura: 'Temperatura',
  distancia: 'Distancia',
  descubierto: 'Descubierto',
  ficha: 'Ficha en el NASA Exoplanet Archive',
  sinDato: 'sin dato',
  diagrama: (n: number) =>
    `Diagrama de ${n} exoplanetas por período orbital y radio`,
  anios: 'Descubrimientos por año y método',
  al: 'años luz',
  dias: (d: string) => `${d} días`,
  estimados: (n: string) =>
    `Los ${n} planetas hallados por velocidad radial o microlente no aparecen en el diagrama: su tamaño no se mide, se estima a partir de la masa. Sí cuentan en las cifras y en los años.`,
  tierras: (r: string) => `${r} Tierras`,
};

const EN: typeof ES = {
  titulo: 'Exoplanets',
  lead: 'Every confirmed planet around another star. Each dot is one: further right takes longer to orbit its star, higher up is bigger. The rings mark the planets of the Solar System.',
  total: 'confirmed planets',
  templados: 'rocky and temperate',
  cercano: (e) => `the nearest system · ${e}`,
  esteAnio: (a) => `found in ${a}`,
  metodo: 'Discovery method',
  soloTemplados: 'Only rocky and temperate',
  buscar: 'Search a planet or a star',
  hasta: 'Found up to',
  reproducir: 'Watch them being found',
  pausar: 'Pause',
  ejeX: 'Orbital period (days, log scale)',
  ejeY: 'Radius (Earths)',
  zonas: {
    calientes: 'Hot Jupiters',
    gigantes: 'Giants',
    neptunos: 'Mini-Neptunes',
    tierras: 'Earth-size',
  },
  radio: 'Radius',
  periodo: 'Year',
  temperatura: 'Temperature',
  distancia: 'Distance',
  descubierto: 'Found',
  ficha: 'Page at the NASA Exoplanet Archive',
  sinDato: 'no data',
  diagrama: (n) => `Chart of ${n} exoplanets by orbital period and radius`,
  anios: 'Discoveries per year and method',
  al: 'light-years',
  dias: (d) => `${d} days`,
  estimados: (n) =>
    `The ${n} planets found by radial velocity or microlensing are not on the chart: their size is not measured but estimated from their mass. They do count in the figures and the years.`,
  tierras: (r) => `${r} Earths`,
};

const NOMBRE_METODO: Record<string, { es: string; en: string }> = {
  Transit: { es: 'Tránsito', en: 'Transit' },
  'Radial Velocity': { es: 'Velocidad radial', en: 'Radial velocity' },
  Microlensing: { es: 'Microlente', en: 'Microlensing' },
  Imaging: { es: 'Imagen directa', en: 'Imaging' },
};

const COLORES = ['#8fb4ff', '#ff7d66', '#ffd166', '#2ec4b6'];

/** Métodos que no miden el tamaño del planeta: el archivo lo estima con la masa, así que no van en el diagrama de radios. */
const SIN_RADIO_MEDIDO = ['Radial Velocity', 'Microlensing'];
const OTROS = '#c77dff';
const colorMetodo = (i: number) => COLORES.at(i) ?? OTROS;

const M = { izq: 54, der: 16, arr: 14, aba: 40 };

/** El diagrama período–radio en canvas, con zonas, el sistema solar de referencia y el planeta elegido. */
function Diagrama({
  filas,
  visibles,
  elegido,
  alElegir,
}: {
  filas: FilaExoplaneta[];
  visibles: (f: FilaExoplaneta) => boolean;
  elegido: FilaExoplaneta | null;
  alElegir: (f: FilaExoplaneta | null) => void;
}) {
  const t = textos({ es: ES, en: EN });
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [tam, setTam] = useState({ w: 800, h: 520 });
  const [encima, setEncima] = useState<FilaExoplaneta | null>(null);

  useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const obs = new ResizeObserver(() =>
      setTam({ w: c.clientWidth, h: c.clientHeight }),
    );
    obs.observe(c);
    return () => obs.disconnect();
  }, []);

  const x = (k: number) => M.izq + k * (tam.w - M.izq - M.der);
  const y = (k: number) => tam.h - M.aba - k * (tam.h - M.arr - M.aba);
  const pos = (f: FilaExoplaneta) => {
    const kx = enEscalaLog(f[5], EJES.periodo);
    const ky = enEscalaLog(f[4], EJES.radio);
    return kx === null || ky === null ? null : { x: x(kx), y: y(ky) };
  };

  useEffect(() => {
    const c = lienzo.current;
    const g = c?.getContext('2d');
    if (!c || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = tam.w * dpr;
    c.height = tam.h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, tam.w, tam.h);
    g.globalCompositeOperation = 'lighter';
    for (const f of filas) {
      const p = pos(f);
      if (!p) continue;
      const on = visibles(f);
      g.fillStyle = colorMetodo(f[3]);
      g.globalAlpha = on ? 0.55 : 0.05;
      g.beginPath();
      g.arc(p.x, p.y, on ? 2.1 : 1.4, 0, Math.PI * 2);
      g.fill();
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
  });

  const alMover = (ev: EventoPuntero<HTMLCanvasElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const mx = ev.clientX - r.left;
    const my = ev.clientY - r.top;
    let mejor: FilaExoplaneta | null = null;
    let d = 64;
    for (const f of filas) {
      if (!visibles(f)) continue;
      const p = pos(f);
      if (!p) continue;
      const dd = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (dd < d) {
        d = dd;
        mejor = f;
      }
    }
    setEncima(mejor);
  };

  const ticksX = [1, 10, 100, 1000, 10_000, 100_000];
  const ticksY = [0.5, 1, 2, 4, 10, 20];
  const zona = (p0: number, p1: number, r0: number, r1: number) => {
    const a = enEscalaLog(p0, EJES.periodo) ?? 0;
    const b = enEscalaLog(p1, EJES.periodo) ?? 1;
    const c = enEscalaLog(r0, EJES.radio) ?? 0;
    const d = enEscalaLog(r1, EJES.radio) ?? 1;
    return { left: x(a), top: y(d), width: x(b) - x(a), height: y(c) - y(d) };
  };
  const marca = encima ?? elegido;
  const pm = marca ? pos(marca) : null;

  return (
    <div className="exo-diagrama">
      <div className="exo-zona" style={zona(0.2, 10, 8, 30)}>
        <span>{t.zonas.calientes}</span>
      </div>
      <div className="exo-zona" style={zona(10, 100_000, 6, 30)}>
        <span>{t.zonas.gigantes}</span>
      </div>
      <div className="exo-zona" style={zona(0.2, 100_000, 1.6, 4)}>
        <span>{t.zonas.neptunos}</span>
      </div>
      <div className="exo-zona tierra" style={zona(0.2, 100_000, 0.5, 1.6)}>
        <span>{t.zonas.tierras}</span>
      </div>
      <canvas
        ref={lienzo}
        role="img"
        aria-label={t.diagrama(filas.length)}
        onPointerMove={alMover}
        onPointerLeave={() => setEncima(null)}
        onClick={() => alElegir(encima)}
        style={{ cursor: encima ? 'pointer' : 'crosshair' }}
      />
      <svg className="exo-ejes" aria-hidden="true">
        {ticksX.map((v) => {
          const k = enEscalaLog(v, EJES.periodo);
          return k === null ? null : (
            <g key={v}>
              <line x1={x(k)} x2={x(k)} y1={M.arr} y2={tam.h - M.aba} />
              <text x={x(k)} y={tam.h - M.aba + 16} textAnchor="middle">
                {formatearNumero(v)}
              </text>
            </g>
          );
        })}
        {ticksY.map((v) => {
          const k = enEscalaLog(v, EJES.radio);
          return k === null ? null : (
            <g key={v}>
              <line x1={M.izq} x2={tam.w - M.der} y1={y(k)} y2={y(k)} />
              <text x={M.izq - 8} y={y(k) + 4} textAnchor="end">
                {formatearNumero(v, v < 1 ? 1 : 0)}
              </text>
            </g>
          );
        })}
        <text
          x={(M.izq + tam.w) / 2}
          y={tam.h - 6}
          textAnchor="middle"
          className="exo-titulo-eje"
        >
          {t.ejeX}
        </text>
        <text
          transform={`translate(14 ${(tam.h - M.aba) / 2}) rotate(-90)`}
          textAnchor="middle"
          className="exo-titulo-eje"
        >
          {t.ejeY}
        </text>
        {SISTEMA_SOLAR.map((p) => {
          const kx = enEscalaLog(p.periodo, EJES.periodo);
          const ky = enEscalaLog(p.radio, EJES.radio);
          if (kx === null || ky === null) return null;
          const nombre =
            p.clave === 'tierra'
              ? textos({ es: 'Tierra', en: 'Earth' })
              : p.clave === 'urano'
                ? textos({ es: 'Urano', en: 'Uranus' })
                : p.clave === 'neptuno'
                  ? textos({ es: 'Neptuno', en: 'Neptune' })
                  : nombrePlaneta(p.clave as 'mercurio');
          return (
            <g key={p.clave} className="exo-solar">
              <circle cx={x(kx)} cy={y(ky)} r="6" />
              <text x={x(kx) + 9} y={y(ky) + 4}>
                {nombre}
              </text>
            </g>
          );
        })}
        {pm && marca && (
          <g className="exo-marca">
            <circle cx={pm.x} cy={pm.y} r="7" />
            <text x={pm.x + 11} y={pm.y - 8}>
              {marca[0]}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/** Vista Exoplanetas: el diagrama período–radio animado por año, sus filtros, el planeta elegido y los descubrimientos por año. */
export function Exoplanetas() {
  const t = textos({ es: ES, en: EN });
  const ahora = useAhora();
  const datos = useExoplanetas();
  const [metodo, setMetodo] = useState<number | null>(null);
  const [soloTemplados, setSoloTemplados] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [hasta, setHasta] = useState<number | null>(null);
  const [elegido, setElegido] = useState<FilaExoplaneta | null>(null);

  const filas = useMemo(
    () => (datos && datos !== 'error' ? datos.filas : []),
    [datos],
  );
  const metodos = datos && datos !== 'error' ? datos.metodos : [];
  const anioFinal = filas.length ? Math.max(...filas.map((f) => f[2])) : 0;
  const tabla = useMemo(
    () => (filas.length ? porAnioYMetodo(filas, metodos.length) : []),
    [filas, metodos.length],
  );

  useEffect(() => {
    if (hasta === null) return;
    if (hasta >= anioFinal) {
      const id = window.setTimeout(() => setHasta(null), 1200);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setHasta(hasta + 1), 260);
    return () => window.clearTimeout(id);
  }, [hasta, anioFinal]);

  const q = consulta.trim().toLowerCase();
  const visibles = (f: FilaExoplaneta) =>
    (hasta === null || f[2] <= hasta) &&
    (metodo === null || f[3] === metodo) &&
    (!soloTemplados || templado(f)) &&
    (!q || f[0].toLowerCase().includes(q) || f[1].toLowerCase().includes(q));

  const cabeza = (
    <CabezaNasa
      id="t-exo"
      titulo={t.titulo}
      lead={t.lead}
      generado={datos && datos !== 'error' ? datos.generado : null}
      fuentes={[
        {
          nombre: 'NASA Exoplanet Archive',
          url: 'https://exoplanetarchive.ipac.caltech.edu/',
        },
      ]}
    />
  );
  if (!filas.length) {
    return (
      <section className="nasa" aria-labelledby="t-exo">
        {cabeza}
        <SinDatos error={datos === 'error'} />
      </section>
    );
  }

  const cercano = sistemaMasCercano(filas);
  const nTemplados = filas.filter(templado).length;
  const anioActual = new Date(ahora).getUTCFullYear();
  const nombreMetodo = (i: number) =>
    textos(NOMBRE_METODO[metodos[i]] ?? { es: metodos[i], en: metodos[i] });
  const maxAnio = Math.max(...tabla.map((a) => a.n.reduce((s, v) => s + v, 0)));
  const e = elegido;
  const estimados = metodos
    .map((m, i) => (SIN_RADIO_MEDIDO.includes(m) ? i : -1))
    .filter((i) => i >= 0);
  const conRadio = filas.filter((f) => !estimados.includes(f[3]));
  const nEstimados = filas.length - conRadio.length;

  return (
    <section className="nasa exo" aria-labelledby="t-exo">
      {cabeza}
      <dl className="nasa-cifras">
        <Cifra valor={filas.length} etiqueta={t.total} />
        <Cifra valor={nTemplados} etiqueta={t.templados} acento />
        {cercano && (
          <Cifra
            valor={(cercano[8] ?? 0) * ANIOS_LUZ_POR_PC}
            decimales={1}
            unidad={t.al}
            etiqueta={t.cercano(cercano[1])}
          />
        )}
        <Cifra
          valor={filas.filter((f) => f[2] === anioActual).length}
          etiqueta={t.esteAnio(anioActual)}
        />
      </dl>

      <div className="exo-controles">
        <div className="nasa-chips" role="group" aria-label={t.metodo}>
          {metodos.slice(0, 4).map((m, i) =>
            estimados.includes(i) ? null : (
              <button
                key={m}
                type="button"
                className="nasa-chip"
                aria-pressed={metodo === i}
                onClick={() => setMetodo(metodo === i ? null : i)}
              >
                <i style={{ background: colorMetodo(i) }} />
                {nombreMetodo(i)}
              </button>
            ),
          )}
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={soloTemplados}
            onClick={() => setSoloTemplados(!soloTemplados)}
          >
            {t.soloTemplados}
          </button>
        </div>
        <input
          type="search"
          className="exo-buscar"
          placeholder={t.buscar}
          aria-label={t.buscar}
          value={consulta}
          onChange={(ev) => setConsulta(ev.target.value)}
        />
      </div>

      <div className="exo-cuerpo">
        <Diagrama
          filas={conRadio}
          visibles={visibles}
          elegido={e}
          alElegir={setElegido}
        />
        <p className="exo-nota">{t.estimados(formatearNumero(nEstimados))}</p>
        <aside className="exo-ficha" aria-live="polite">
          {e ? (
            <article key={e[0]}>
              <p className="nasa-rotulo" style={{ color: colorMetodo(e[3]) }}>
                {nombreMetodo(e[3])} · {e[2]}
              </p>
              <h3>{e[0]}</h3>
              <dl>
                <div>
                  <dt>{t.radio}</dt>
                  <dd>
                    {e[4] !== null
                      ? t.tierras(formatearNumero(e[4], 2))
                      : t.sinDato}
                  </dd>
                </div>
                <div>
                  <dt>{t.periodo}</dt>
                  <dd>
                    {e[5] !== null
                      ? t.dias(formatearNumero(e[5], e[5] < 10 ? 2 : 0))
                      : t.sinDato}
                  </dd>
                </div>
                <div>
                  <dt>{t.temperatura}</dt>
                  <dd>
                    {e[7] !== null
                      ? `${formatearNumero(e[7] - 273.15)} °C`
                      : t.sinDato}
                  </dd>
                </div>
                <div>
                  <dt>{t.distancia}</dt>
                  <dd>
                    {e[8] !== null
                      ? `${formatearNumero(e[8] * ANIOS_LUZ_POR_PC)} ${t.al}`
                      : t.sinDato}
                  </dd>
                </div>
              </dl>
              <a
                className="nasa-enlace"
                href={`https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(e[1])}`}
                target="_blank"
                rel="noreferrer"
              >
                {t.ficha} ↗
              </a>
            </article>
          ) : (
            <p className="exo-pista">
              {idioma() === 'es'
                ? 'Pasa el ratón sobre los puntos y haz clic en uno para ver su ficha.'
                : 'Hover over the dots and click one to see its card.'}
            </p>
          )}
        </aside>
      </div>

      <div className="exo-anios">
        <div className="exo-anios-cabeza">
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={hasta !== null}
            onClick={() => setHasta(hasta === null ? tabla[0].anio : null)}
          >
            {hasta === null ? `▶ ${t.reproducir}` : `❚❚ ${t.pausar}`}
          </button>
          <p>
            {t.hasta} <strong>{hasta ?? anioFinal}</strong>
          </p>
        </div>
        <div className="exo-barras" role="img" aria-label={t.anios}>
          {tabla.map((a) => {
            const total = a.n.reduce((s, v) => s + v, 0);
            return (
              <div
                key={a.anio}
                className={`exo-barra${hasta !== null && a.anio > hasta ? ' apagada' : ''}`}
                title={`${a.anio}: ${total}`}
                style={
                  { '--h': `${(total / maxAnio) * 100}%` } as CSSProperties
                }
              >
                {a.n.map((v, i) =>
                  v ? (
                    <span
                      key={i}
                      style={
                        {
                          flexGrow: v,
                          background: colorMetodo(i),
                        } as CSSProperties
                      }
                    />
                  ) : null,
                )}
              </div>
            );
          })}
        </div>
        <div className="exo-eje" aria-hidden="true">
          <span>{tabla[0].anio}</span>
          <span>{anioFinal}</span>
        </div>
      </div>
    </section>
  );
}
