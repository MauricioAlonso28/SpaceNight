import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type PointerEvent as EventoPuntero,
} from 'react';
import { useJsonPublico } from '../../estado/datos';
import { useEstado } from '../../estado/store';
import { idioma, textos } from '../../idioma/idioma';
import { formatearDecimal, formatearHora } from '../../servicios/formato';
import { useApiEnVivo } from '../../servicios/nasa/datos';
import {
  anguloSolNave,
  horaSolar,
  instanteFoto,
  modulo,
  urlFoto,
  type FotoEpic,
} from '../../servicios/nasa/epic';
import { CabezaNasa, Cifra, SinDatos } from './CabezaNasa';
import './Tierra.css';

const TierraSatelite = lazy(() =>
  import('./TierraSatelite').then((m) => ({ default: m.TierraSatelite })),
);

const ES = {
  titulo: 'La Tierra hoy',
  modoDscovr: 'Desde DSCOVR',
  modoSatelite: 'Por satélite',
  leadSatelite:
    'Toda la Tierra fotografiada ayer por el satélite Terra de la NASA, pasada a pasada. Acércate a cualquier lugar; los puntos son los eventos naturales activos.',
  lead: 'Las fotos de la Tierra entera que toma la cámara EPIC desde la nave DSCOVR, a 1,5 millones de km, en el punto donde la gravedad del Sol y la de la Tierra se equilibran. Desde ahí siempre ve la cara iluminada.',
  fotos: 'fotos ese día',
  distancia: 'de la cámara a la Tierra',
  angulo: 'entre el Sol y la nave, vistos desde aquí',
  anterior: 'Día anterior',
  siguiente: 'Día siguiente',
  reproducir: 'Reproducir el día',
  pausar: 'Pausar',
  arrastra: 'Arrastra sobre la foto para hacer girar la Tierra',
  centro: 'Centro de la foto',
  horaSolar: (h: string) => `allí eran las ${h}, hora solar`,
  tomada: 'Tomada',
  recorrido: 'Lo que miró la cámara ese día',
  ver: 'Ver este día en el sitio de EPIC',
  foto: (h: string) => `La Tierra fotografiada por EPIC a las ${h}`,
  mapa: 'Mapa con el centro de cada foto del día',
};

const EN: typeof ES = {
  titulo: 'Earth today',
  modoDscovr: 'From DSCOVR',
  modoSatelite: 'By satellite',
  leadSatelite:
    'The whole Earth photographed yesterday by NASA’s Terra satellite, pass by pass. Zoom into any place; the dots are the active natural events.',
  lead: 'Whole-Earth photos from the EPIC camera aboard DSCOVR, 1.5 million km away at the point where the Sun’s and Earth’s gravity balance. From there it always sees the sunlit side.',
  fotos: 'photos that day',
  distancia: 'from the camera to Earth',
  angulo: 'between the Sun and the spacecraft, seen from here',
  anterior: 'Previous day',
  siguiente: 'Next day',
  reproducir: 'Play the day',
  pausar: 'Pause',
  arrastra: 'Drag across the photo to spin the Earth',
  centro: 'Centre of the photo',
  horaSolar: (h) => `it was ${h} there, solar time`,
  tomada: 'Taken',
  recorrido: 'Where the camera looked that day',
  ver: 'See this day on the EPIC site',
  foto: (h) => `Earth photographed by EPIC at ${h}`,
  mapa: 'Map with the centre of each photo of the day',
};

const EPIC = 'https://epic.gsfc.nasa.gov/api/natural';

/** Latitud y longitud con su letra, como «12,3° S». */
function coordenada(v: number, eje: 'lat' | 'lon'): string {
  const letra =
    eje === 'lat'
      ? v < 0
        ? 'S'
        : 'N'
      : v < 0
        ? idioma() === 'es'
          ? 'O'
          : 'W'
        : 'E';
  return `${formatearDecimal(Math.abs(v))}° ${letra}`;
}

/** Hora decimal como «13:45». */
function horaDecimal(h: number): string {
  const total = Math.round(h * 60) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

/** Mapa del mundo con el punto central de cada foto del día y el actual destacado. */
function MapaRecorrido({
  fotos,
  indice,
  alElegir,
}: {
  fotos: FotoEpic[];
  indice: number;
  alElegir: (i: number) => void;
}) {
  const t = textos({ es: ES, en: EN });
  const mundo = useJsonPublico<{ trazado: string }>('mundo.json');
  const x = (lon: number) => lon + 180;
  const y = (lat: number) => 90 - lat;
  const puntos = fotos.map((f) => f.centroid_coordinates);
  return (
    <svg
      viewBox="0 0 360 180"
      className="tierra-mapa"
      role="img"
      aria-label={t.mapa}
    >
      {mundo && mundo !== 'error' && (
        <path d={mundo.trazado} className="tierra-mapa-tierra" />
      )}
      <polyline
        points={puntos.map((p) => `${x(p.lon)},${y(p.lat)}`).join(' ')}
        className="tierra-mapa-linea"
      />
      {puntos.map((p, i) => (
        <circle
          key={fotos[i].identifier}
          cx={x(p.lon)}
          cy={y(p.lat)}
          r={i === indice ? 4.5 : 2.2}
          className={i === indice ? 'actual' : undefined}
          onClick={() => alElegir(i)}
        />
      ))}
    </svg>
  );
}

/** Pestaña Desde DSCOVR: el time-lapse del día de EPIC, sus cifras, el mapa de lo que miró y los días anteriores. */
function TierraDscovr() {
  const t = textos({ es: ES, en: EN });
  const zona = useEstado((s) => s.ubicacion.zona);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const fechas = useApiEnVivo<{ date: string }[]>(`${EPIC}/all`);
  const [dia, setDia] = useState<string | null>(null);
  const fotos = useApiEnVivo<FotoEpic[]>(
    dia ? `${EPIC}/date/${dia}` : EPIC,
    dia ? 0 : 30 * 60_000,
  );
  const [indice, setIndice] = useState(0);
  const [jugando, setJugando] = useState(true);
  const [cargadas, setCargadas] = useState<Set<number>>(new Set([0, 1]));
  const arrastre = useRef<{ x: number; i: number } | null>(null);

  const lista = fotos && fotos !== 'error' ? fotos : [];
  const n = lista.length;

  useEffect(() => {
    if (!jugando || n < 2) return;
    const id = window.setInterval(() => setIndice((i) => (i + 1) % n), 900);
    return () => window.clearInterval(id);
  }, [jugando, n]);

  const ir = (i: number) => {
    const k = ((i % n) + n) % n;
    setIndice(k);
    setCargadas((c) => new Set(c).add(k).add((k + 1) % n));
  };

  const fechasLista =
    fechas && fechas !== 'error' ? fechas.map((f) => f.date) : [];
  const diaActual = lista[0]?.date.slice(0, 10) ?? dia;
  const posicion = diaActual ? fechasLista.indexOf(diaActual) : -1;
  const cambiarDia = (paso: number) => {
    const nuevo = fechasLista.at(posicion + paso);
    if (posicion < 0 || !nuevo || posicion + paso < 0) return;
    setDia(nuevo);
    setIndice(0);
    setCargadas(new Set([0, 1]));
  };

  const alPulsar = (ev: EventoPuntero<HTMLDivElement>) => {
    ev.currentTarget.setPointerCapture(ev.pointerId);
    arrastre.current = { x: ev.clientX, i: indice };
    setJugando(false);
  };
  const alMover = (ev: EventoPuntero<HTMLDivElement>) => {
    if (!arrastre.current || !n) return;
    const pasos = Math.round((ev.clientX - arrastre.current.x) / 28);
    ir(arrastre.current.i - pasos);
  };

  if (!n) {
    return <SinDatos error={fotos === 'error'} />;
  }

  const foto = lista[Math.min(indice, n - 1)];
  const instante = instanteFoto(foto);
  const hora = formatearHora(new Date(instante), zona, formato24h);
  const fechaLarga = new Intl.DateTimeFormat(
    idioma() === 'es' ? 'es-PE' : 'en-US',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  ).format(instante);

  return (
    <div className="tierra-cuerpo">
      <div className="tierra-escena">
        <div
          className="tierra-foto"
          onPointerDown={alPulsar}
          onPointerMove={alMover}
          onPointerUp={() => (arrastre.current = null)}
          role="img"
          aria-label={t.foto(hora)}
        >
          {lista.map((f, i) =>
            cargadas.has(i) ? (
              <img
                key={f.identifier}
                src={urlFoto(f)}
                alt=""
                draggable={false}
                className={i === indice ? 'visible' : undefined}
                onLoad={() =>
                  setCargadas((c) =>
                    c.has((i + 1) % n) ? c : new Set(c).add((i + 1) % n),
                  )
                }
              />
            ) : null,
          )}
          <img
            src={urlFoto(foto, 'thumbs')}
            alt=""
            className="tierra-miniatura"
          />
        </div>
        <div className="tierra-control">
          <button
            type="button"
            className="nasa-chip"
            onClick={() => setJugando(!jugando)}
            aria-pressed={jugando}
          >
            {jugando ? `❚❚ ${t.pausar}` : `▶ ${t.reproducir}`}
          </button>
          <input
            type="range"
            min={0}
            max={n - 1}
            value={indice}
            aria-label={t.tomada}
            onChange={(e) => {
              setJugando(false);
              ir(Number(e.target.value));
            }}
          />
          <output>{hora}</output>
        </div>
        <p className="tierra-ayuda">{t.arrastra}</p>
      </div>
      <div className="tierra-lado">
        <div className="tierra-dia">
          <button
            type="button"
            className="nasa-chip"
            aria-label={t.anterior}
            disabled={posicion < 0 || posicion + 1 >= fechasLista.length}
            onClick={() => cambiarDia(1)}
          >
            ‹
          </button>
          <h3>{fechaLarga}</h3>
          <button
            type="button"
            className="nasa-chip"
            aria-label={t.siguiente}
            disabled={posicion <= 0}
            onClick={() => cambiarDia(-1)}
          >
            ›
          </button>
        </div>
        <dl className="nasa-cifras">
          <Cifra valor={n} etiqueta={t.fotos} />
          <Cifra
            valor={modulo(foto.dscovr_j2000_position) / 1e6}
            decimales={2}
            unidad={idioma() === 'es' ? 'millones de km' : 'million km'}
            etiqueta={t.distancia}
          />
          <Cifra
            valor={anguloSolNave(foto)}
            decimales={1}
            unidad="°"
            etiqueta={t.angulo}
          />
        </dl>
        <div className="tierra-centro">
          <p className="nasa-rotulo">{t.centro}</p>
          <p className="tierra-coordenadas">
            {coordenada(foto.centroid_coordinates.lat, 'lat')} ·{' '}
            {coordenada(foto.centroid_coordinates.lon, 'lon')}
          </p>
          <p className="tierra-nota">
            {t.horaSolar(
              horaDecimal(horaSolar(instante, foto.centroid_coordinates.lon)),
            )}
            {' · '}
            {t.tomada} {hora} ({foto.date.slice(11, 16)} UTC)
          </p>
        </div>
        <div>
          <p className="nasa-rotulo">{t.recorrido}</p>
          <MapaRecorrido
            fotos={lista}
            indice={indice}
            alElegir={(i) => {
              setJugando(false);
              ir(i);
            }}
          />
        </div>
        <a
          className="nasa-enlace"
          href={`https://epic.gsfc.nasa.gov/?date=${foto.date.slice(0, 10)}`}
          target="_blank"
          rel="noreferrer"
        >
          {t.ver} ↗
        </a>
      </div>
    </div>
  );
}

/** Vista La Tierra hoy: la Tierra entera desde DSCOVR o el mapa por satélite de ayer. */
export function Tierra() {
  const t = textos({ es: ES, en: EN });
  const [modo, setModo] = useState<'dscovr' | 'satelite'>('dscovr');
  return (
    <section className="nasa tierra" aria-labelledby="t-tierra">
      <CabezaNasa
        id="t-tierra"
        titulo={t.titulo}
        lead={modo === 'dscovr' ? t.lead : t.leadSatelite}
        fuentes={
          modo === 'dscovr'
            ? [
                { nombre: 'NASA EPIC', url: 'https://epic.gsfc.nasa.gov/' },
                {
                  nombre: 'NOAA DSCOVR',
                  url: 'https://www.nesdis.noaa.gov/dscovr',
                },
              ]
            : [
                {
                  nombre: 'NASA GIBS',
                  url: 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api',
                },
                { nombre: 'NASA EONET', url: 'https://eonet.gsfc.nasa.gov/' },
              ]
        }
      />
      <div className="segmentos tierra-modos" role="tablist">
        <button
          type="button"
          role="tab"
          className="segmento"
          aria-selected={modo === 'dscovr'}
          onClick={() => setModo('dscovr')}
        >
          {t.modoDscovr}
        </button>
        <button
          type="button"
          role="tab"
          className="segmento"
          aria-selected={modo === 'satelite'}
          onClick={() => setModo('satelite')}
        >
          {t.modoSatelite}
        </button>
      </div>
      {modo === 'dscovr' ? (
        <TierraDscovr />
      ) : (
        <Suspense fallback={<SinDatos error={false} />}>
          <TierraSatelite />
        </Suspense>
      )}
    </section>
  );
}
