import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { idioma, textos } from '../../idioma/idioma';
import { datosLuna } from '../../servicios/astro/luna';
import { formatearHora } from '../../servicios/formato';
import { useLunaNasa } from '../../servicios/nasa/datos';
import { urlLuna } from '../../servicios/nasa/lunaNasa';
import { nombreFase } from '../EstaNoche/textos';
import { CabezaNasa, SinDatos } from './CabezaNasa';
import './SolLuna.css';

const ES = {
  titulo: 'Sol y Luna',
  lead: 'El Sol tal como lo ve ahora el observatorio SDO de la NASA, en luces que nuestros ojos no ven, y la Luna de cualquier noche según el estudio de visualización de la NASA.',
  sol: 'El Sol ahora',
  ahora: 'Imagen de ahora',
  video: 'Últimas 48 horas',
  actualiza: 'SDO publica una imagen nueva cada pocos minutos.',
  luna: 'La Luna, noche a noche',
  fecha: 'Fecha y hora',
  menos: 'Día anterior',
  mas: 'Día siguiente',
  reproducir: 'Ver el ciclo',
  pausar: 'Pausar',
  hoy: 'Ahora',
  girar: 'Como la ves desde el sur',
  iluminada: (p: number) => `${p} % iluminada`,
  dia: (d: number) => `día ${d} del ciclo`,
  credito: 'Imagen: NASA SVS, Dial-A-Moon',
  sinLuna: 'No hay imágenes de la Luna para esa fecha.',
  verSdo: 'Más en el sitio de SDO',
  sdo: (n: string) => `El Sol fotografiado por SDO en ${n}`,
  imgLuna: (f: string) => `La Luna el ${f}`,
};

const EN: typeof ES = {
  titulo: 'Sun and Moon',
  lead: 'The Sun as NASA’s SDO observatory sees it now, in light our eyes can’t see, and the Moon on any night from NASA’s visualization studio.',
  sol: 'The Sun now',
  ahora: 'Latest image',
  video: 'Last 48 hours',
  actualiza: 'SDO publishes a new image every few minutes.',
  luna: 'The Moon, night by night',
  fecha: 'Date and time',
  menos: 'Previous day',
  mas: 'Next day',
  reproducir: 'Play the cycle',
  pausar: 'Pause',
  hoy: 'Now',
  girar: 'As seen from the south',
  iluminada: (p) => `${p}% lit`,
  dia: (d) => `day ${d} of the cycle`,
  credito: 'Image: NASA SVS, Dial-A-Moon',
  sinLuna: 'No Moon images for that date.',
  verSdo: 'More on the SDO site',
  sdo: (n) => `The Sun photographed by SDO in ${n}`,
  imgLuna: (f) => `The Moon on ${f}`,
};

/** Cada filtro de SDO: su código, color, nombre y qué muestra. */
const CANALES: {
  id: string;
  color: string;
  nombre: { es: string; en: string };
  muestra: { es: string; en: string };
}[] = [
  {
    id: '0171',
    color: '#ffc95c',
    nombre: { es: '171 Å · corona', en: '171 Å · corona' },
    muestra: {
      es: 'Los bucles magnéticos de la corona, a unos 600 000 °C.',
      en: 'The corona’s magnetic loops, at about 600,000 °C.',
    },
  },
  {
    id: '0304',
    color: '#ff6b4a',
    nombre: { es: '304 Å · cromosfera', en: '304 Å · chromosphere' },
    muestra: {
      es: 'La cromosfera y las protuberancias que se levantan del borde, a unos 50 000 °C.',
      en: 'The chromosphere and the prominences rising off the limb, at about 50,000 °C.',
    },
  },
  {
    id: '0193',
    color: '#e0a060',
    nombre: { es: '193 Å · agujeros coronales', en: '193 Å · coronal holes' },
    muestra: {
      es: 'La corona a un millón de grados; las zonas oscuras son agujeros por donde escapa el viento solar.',
      en: 'The corona at a million degrees; the dark patches are holes where the solar wind escapes.',
    },
  },
  {
    id: '0131',
    color: '#3ec7c0',
    nombre: { es: '131 Å · fulguraciones', en: '131 Å · flares' },
    muestra: {
      es: 'Lo más caliente: las fulguraciones, a unos 10 millones de °C.',
      en: 'The hottest material: flares, at about 10 million °C.',
    },
  },
  {
    id: '0211',
    color: '#c77dff',
    nombre: { es: '211 Å · regiones activas', en: '211 Å · active regions' },
    muestra: {
      es: 'Las regiones activas magnéticamente, a unos 2 millones de °C.',
      en: 'Magnetically active regions, at about 2 million °C.',
    },
  },
  {
    id: 'HMIIC',
    color: '#f4d58d',
    nombre: { es: 'Luz visible · manchas', en: 'Visible light · sunspots' },
    muestra: {
      es: 'El Sol como lo verías con un filtro seguro: las manchas solares.',
      en: 'The Sun as you would see it through a safe filter: the sunspots.',
    },
  },
  {
    id: 'HMIB',
    color: '#bdbdbd',
    nombre: { es: 'Magnetograma', en: 'Magnetogram' },
    muestra: {
      es: 'El campo magnético de la superficie: blanco y negro son las dos polaridades.',
      en: 'The surface magnetic field: white and black are the two polarities.',
    },
  },
];

const SDO = 'https://sdo.gsfc.nasa.gov/assets/img/latest';

/** Vista Sol y Luna: el Sol de SDO en siete filtros, imagen o video de 48 h, y la Luna de NASA SVS para cualquier fecha. */
export function SolLuna() {
  const t = textos({ es: ES, en: EN });
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const [canal, setCanal] = useState(CANALES[0].id);
  const [video, setVideo] = useState(false);
  const luna = useLunaNasa();
  const [instante, setInstante] = useState(() => {
    const h = Date.now();
    return h - (h % 3_600_000);
  });
  const [ciclo, setCiclo] = useState(false);
  const [girar, setGirar] = useState(ubicacion.latitud < 0);
  const cuarto = Math.floor(useAhora().getTime() / 900_000);

  useEffect(() => {
    if (!ciclo) return;
    const id = window.setInterval(
      () => setInstante((i) => i + 86_400_000),
      450,
    );
    return () => window.clearInterval(id);
  }, [ciclo]);

  const c = CANALES.find((x) => x.id === canal)!;
  const datos = luna && luna !== 'error' ? luna : null;
  const url = datos ? urlLuna(datos, instante) : null;
  const info = useMemo(
    () => datosLuna(new Date(instante), ubicacion),
    [instante, ubicacion],
  );
  const fechaLarga = new Intl.DateTimeFormat(
    idioma() === 'es' ? 'es-PE' : 'en-US',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: ubicacion.zona,
    },
  ).format(instante);
  const local = new Date(
    instante - new Date(instante).getTimezoneOffset() * 60_000,
  )
    .toISOString()
    .slice(0, 16);

  return (
    <section className="nasa sol-luna" aria-labelledby="t-sol-luna">
      <CabezaNasa
        id="t-sol-luna"
        titulo={t.titulo}
        lead={t.lead}
        generado={datos?.generado}
        fuentes={[
          { nombre: 'NASA SDO', url: 'https://sdo.gsfc.nasa.gov/data/' },
          {
            nombre: 'NASA SVS Dial-A-Moon',
            url: 'https://svs.gsfc.nasa.gov/help/#apis-dialamoon',
          },
        ]}
      />

      <section
        className="sol"
        aria-labelledby="t-sol"
        style={{ '--canal': c.color } as CSSProperties}
      >
        <div className="sol-imagen">
          {video ? (
            <video
              key={`v${canal}`}
              src={`${SDO}/mpeg/latest_1024_${canal}.mp4`}
              autoPlay
              loop
              muted
              playsInline
              aria-label={t.sdo(textos(c.nombre))}
            />
          ) : (
            <img
              key={`i${canal}`}
              src={`${SDO}/latest_1024_${canal}.jpg?c=${cuarto}`}
              alt={t.sdo(textos(c.nombre))}
            />
          )}
        </div>
        <div className="sol-lado">
          <h3 id="t-sol">{t.sol}</h3>
          <p className="sol-muestra">{textos(c.muestra)}</p>
          <div className="nasa-chips sol-canales">
            {CANALES.map((x) => (
              <button
                key={x.id}
                type="button"
                className="nasa-chip"
                aria-pressed={canal === x.id}
                onClick={() => setCanal(x.id)}
              >
                <i style={{ background: x.color }} />
                {textos(x.nombre)}
              </button>
            ))}
          </div>
          <div className="nasa-chips">
            <button
              type="button"
              className="nasa-chip"
              aria-pressed={!video}
              onClick={() => setVideo(false)}
            >
              {t.ahora}
            </button>
            <button
              type="button"
              className="nasa-chip"
              aria-pressed={video}
              onClick={() => setVideo(true)}
            >
              ▶ {t.video}
            </button>
          </div>
          <p className="sol-nota">
            {t.actualiza}{' '}
            <a
              className="nasa-enlace"
              href="https://sdo.gsfc.nasa.gov/data/"
              target="_blank"
              rel="noreferrer"
            >
              {t.verSdo} ↗
            </a>
          </p>
        </div>
      </section>

      <section className="luna-nasa" aria-labelledby="t-luna-nasa">
        <div className="luna-nasa-lado">
          <h3 id="t-luna-nasa">{t.luna}</h3>
          <p className="luna-nasa-fase">{nombreFase(info.fase)}</p>
          <p className="luna-nasa-datos">
            {t.iluminada(Math.round(info.fraccion * 100))} ·{' '}
            {t.dia(Math.round(info.diaCiclo))}
          </p>
          <p className="luna-nasa-fecha">
            {fechaLarga} ·{' '}
            {formatearHora(new Date(instante), ubicacion.zona, formato24h)}
          </p>
          <label className="luna-nasa-control">
            <span>{t.fecha}</span>
            <input
              type="datetime-local"
              value={local}
              step={3600}
              onChange={(e) => {
                const v = Date.parse(e.target.value);
                if (!Number.isNaN(v)) {
                  setCiclo(false);
                  setInstante(v - (v % 3_600_000));
                }
              }}
            />
          </label>
          <div className="nasa-chips">
            <button
              type="button"
              className="nasa-chip"
              aria-label={t.menos}
              onClick={() => setInstante(instante - 86_400_000)}
            >
              ‹
            </button>
            <button
              type="button"
              className="nasa-chip"
              aria-pressed={ciclo}
              onClick={() => setCiclo(!ciclo)}
            >
              {ciclo ? `❚❚ ${t.pausar}` : `▶ ${t.reproducir}`}
            </button>
            <button
              type="button"
              className="nasa-chip"
              aria-label={t.mas}
              onClick={() => setInstante(instante + 86_400_000)}
            >
              ›
            </button>
            <button
              type="button"
              className="nasa-chip"
              onClick={() => {
                setCiclo(false);
                const h = Date.now();
                setInstante(h - (h % 3_600_000));
              }}
            >
              {t.hoy}
            </button>
          </div>
          <label className="luna-nasa-girar">
            <input
              type="checkbox"
              checked={girar}
              onChange={(e) => setGirar(e.target.checked)}
            />
            {t.girar}
          </label>
          <p className="sol-nota">{t.credito}</p>
        </div>
        <div className={`luna-nasa-imagen${girar ? ' girada' : ''}`}>
          {!luna ? (
            <SinDatos error={false} />
          ) : url ? (
            <img src={url} alt={t.imgLuna(fechaLarga)} />
          ) : (
            <p className="aviso">{t.sinLuna}</p>
          )}
        </div>
      </section>
    </section>
  );
}
