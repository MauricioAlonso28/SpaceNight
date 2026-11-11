import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { idioma, textos } from '../../idioma/idioma';
import { useApiEnVivo } from '../../servicios/nasa/datos';
import {
  COLOR_CATEGORIA,
  NOMBRE_CATEGORIA,
  resumirEvento,
  type EventoEonet,
  type EventoResumido,
} from '../../servicios/nasa/eonet';

const ES = {
  dia: 'Día',
  capa: 'Capa',
  color: 'Color real (Terra)',
  noche: 'Luces de noche',
  eventos: 'Mostrar eventos naturales',
  mapa: 'Mapa de la Tierra por satélite; arrastra y acerca',
  nota: 'Las franjas negras son zonas que el satélite no pasó ese día. Las luces de noche son un compuesto de 2016.',
};

const EN: typeof ES = {
  dia: 'Day',
  capa: 'Layer',
  color: 'True color (Terra)',
  noche: 'Night lights',
  eventos: 'Show natural events',
  mapa: 'Satellite map of the Earth; drag and zoom',
  nota: 'Black strips are areas the satellite did not pass that day. Night lights are a 2016 composite.',
};

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const DIA = 86_400_000;

/** Dirección de las teselas de una capa de GIBS para un día. */
function teselas(
  capa: 'color' | 'noche',
  dia: string,
): { url: string; maxZoom: number } {
  return capa === 'color'
    ? {
        url: `${GIBS}/MODIS_Terra_CorrectedReflectance_TrueColor/default/${dia}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
        maxZoom: 9,
      }
    : {
        url: `${GIBS}/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`,
        maxZoom: 8,
      };
}

/** Pestaña Por satélite: el mapa de GIBS de un día de los últimos 30, con los eventos naturales encima. */
export function TierraSatelite() {
  const t = textos({ es: ES, en: EN });
  const ubicacion = useEstado((s) => s.ubicacion);
  const caja = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capaTeselas = useRef<L.TileLayer | null>(null);
  const capaEventos = useRef<L.LayerGroup | null>(null);
  const hoy = useAhora().getTime();
  const dias = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) =>
        new Date(hoy - (i + 1) * DIA).toISOString().slice(0, 10),
      ),
    [hoy],
  );
  const [dia, setDia] = useState(dias[0]);
  const [capa, setCapa] = useState<'color' | 'noche'>('color');
  const [verEventos, setVerEventos] = useState(true);
  const eonet = useApiEnVivo<{ events: EventoEonet[] }>(
    'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=60',
    10 * 60_000,
  );
  const eventos = useMemo(
    () =>
      eonet && eonet !== 'error'
        ? eonet.events
            .map(resumirEvento)
            .filter((e): e is EventoResumido => e !== null)
        : [],
    [eonet],
  );

  useEffect(() => {
    if (!caja.current || mapa.current) return;
    const m = L.map(caja.current, {
      center: [ubicacion.latitud, ubicacion.longitud],
      zoom: 4,
      minZoom: 2,
      worldCopyJump: true,
      attributionControl: true,
    });
    m.attributionControl.setPrefix(false);
    L.circleMarker([ubicacion.latitud, ubicacion.longitud], {
      radius: 5,
      color: '#ffffff',
      weight: 2,
      fillOpacity: 0.9,
    }).addTo(m);
    mapa.current = m;
    capaEventos.current = L.layerGroup().addTo(m);
    return () => {
      m.remove();
      mapa.current = null;
    };
  }, [ubicacion.latitud, ubicacion.longitud]);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    capaTeselas.current?.remove();
    const { url, maxZoom } = teselas(capa, dia);
    capaTeselas.current = L.tileLayer(url, {
      maxNativeZoom: maxZoom,
      maxZoom: maxZoom + 2,
      attribution: 'NASA GIBS · EOSDIS',
    }).addTo(m);
  }, [capa, dia]);

  useEffect(() => {
    const g = capaEventos.current;
    if (!g) return;
    g.clearLayers();
    if (!verEventos) return;
    for (const e of eventos) {
      const nombre = textos(
        NOMBRE_CATEGORIA[e.categoria] ?? { es: e.categoria, en: e.categoria },
      );
      L.circleMarker([e.lat, e.lon], {
        radius: 6,
        color: COLOR_CATEGORIA[e.categoria] ?? '#fff',
        weight: 2,
        fillOpacity: 0.55,
      })
        .bindPopup(
          `<strong>${e.titulo.replace(/</g, '&lt;')}</strong><br>${nombre}<br><a href="${e.fuente}" target="_blank" rel="noreferrer">${idioma() === 'es' ? 'Fuente' : 'Source'} ↗</a>`,
        )
        .addTo(g);
    }
  }, [eventos, verEventos]);

  const fecha = (d: string) =>
    new Intl.DateTimeFormat(idioma() === 'es' ? 'es-PE' : 'en-US', {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(Date.parse(`${d}T12:00:00Z`));

  return (
    <div className="satelite">
      <div className="satelite-controles">
        <label>
          <span>{t.dia}</span>
          <input
            type="range"
            min={0}
            max={dias.length - 1}
            value={dias.indexOf(dia)}
            disabled={capa === 'noche'}
            onChange={(e) => setDia(dias[Number(e.target.value)])}
            style={{ direction: 'rtl' }}
          />
          <output>{fecha(dia)}</output>
        </label>
        <div className="nasa-chips" role="group" aria-label={t.capa}>
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={capa === 'color'}
            onClick={() => setCapa('color')}
          >
            {t.color}
          </button>
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={capa === 'noche'}
            onClick={() => setCapa('noche')}
          >
            {t.noche}
          </button>
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={verEventos}
            onClick={() => setVerEventos(!verEventos)}
          >
            {t.eventos}
          </button>
        </div>
      </div>
      <div
        className="satelite-mapa"
        ref={caja}
        role="application"
        aria-label={t.mapa}
      />
      <p className="satelite-nota">{t.nota}</p>
    </div>
  );
}
