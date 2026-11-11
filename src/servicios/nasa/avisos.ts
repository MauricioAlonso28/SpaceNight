import { idioma } from '../../idioma/idioma';
import { formatearNumero } from '../formato';
import { NOMBRE_CATEGORIA, type EventoResumido } from './eonet';
import { distanciaSuperficieKm } from './formato';

/** Un asteroide en el resumen. */
export interface AsteroideCorto {
  id: string;
  nombre: string;
  fecha: number;
  distanciaLunar: number;
  peligroso: boolean;
  url: string;
}

/** Lo que deja scripts/datos-nasa.mjs en public/data/nasa/resumen.json. */
export interface ResumenNasa {
  generado: string;
  neo: {
    total: number;
    peligrosos: number;
    cercanos: AsteroideCorto[];
    proximos: AsteroideCorto[];
  } | null;
  bolido: {
    fecha: number;
    kt: number;
    lat: number | null;
    lon: number | null;
  } | null;
  bolidosTotal: number | null;
  sentryTotal: number | null;
  exoplanetas: number | null;
}

/** Las cinco reglas de aviso. */
export type Regla =
  'asteroide' | 'evento' | 'bolido' | 'tierra' | 'exoplanetas';

export const REGLAS: readonly Regla[] = [
  'asteroide',
  'evento',
  'bolido',
  'tierra',
  'exoplanetas',
];

/**
 * Un aviso: qué pasó, cuándo y adónde llevar.
 * @property id estable entre visitas, para recordar si ya se vio
 * @property ruta vista de la app que lo explica
 * @property enlace fuente externa, si la hay
 */
export interface Aviso {
  id: string;
  regla: Regla;
  fecha: number;
  titulo: string;
  detalle: string;
  ruta: string;
  enlace?: string;
}

/** Radio en km para avisar de un evento natural cerca de ti. */
export const RADIO_EVENTOS_KM = 500;

const es = () => idioma() === 'es';

/**
 * Los avisos de ahora a partir de los datos que haya (cada fuente puede faltar), del más reciente al más antiguo.
 * @param eventos eventos naturales abiertos de los últimos días
 * @param ultimaFotoTierra fecha («2026-11-09») de la última tanda de fotos de EPIC
 */
export function calcularAvisos({
  resumen,
  eventos,
  ultimaFotoTierra,
  lat,
  lon,
  ahora,
}: {
  resumen: ResumenNasa | null;
  eventos: EventoResumido[];
  ultimaFotoTierra: string | null;
  lat: number;
  lon: number;
  ahora: number;
}): Aviso[] {
  const avisos: Aviso[] = [];
  for (const a of resumen?.neo?.cercanos ?? []) {
    if (a.fecha < ahora - 86_400_000) continue;
    avisos.push({
      id: `asteroide-${a.id}-${a.fecha}`,
      regla: 'asteroide',
      fecha: a.fecha,
      titulo: es()
        ? `${a.nombre} pasa más cerca que la Luna`
        : `${a.nombre} passes closer than the Moon`,
      detalle: es()
        ? `A ${formatearNumero(a.distanciaLunar, 2)} distancias lunares.`
        : `${formatearNumero(a.distanciaLunar, 2)} lunar distances away.`,
      ruta: 'nasa/asteroides',
      enlace: a.url,
    });
  }
  for (const e of eventos) {
    const km = distanciaSuperficieKm(lat, lon, e.lat, e.lon);
    const cerca = km <= RADIO_EVENTOS_KM;
    if (!cerca && e.categoria !== 'severeStorms') continue;
    const cat = NOMBRE_CATEGORIA[e.categoria] ?? {
      es: e.categoria,
      en: e.categoria,
    };
    avisos.push({
      id: `evento-${e.id}`,
      regla: 'evento',
      fecha: e.fecha,
      titulo: e.titulo,
      detalle: es()
        ? `${cat.es} · a ${formatearNumero(km)} km de ti`
        : `${cat.en} · ${formatearNumero(km)} km from you`,
      ruta: 'nasa/eventos',
      enlace: e.fuente,
    });
  }
  const b = resumen?.bolido;
  if (b && b.fecha > ahora - 30 * 86_400_000) {
    avisos.push({
      id: `bolido-${b.fecha}`,
      regla: 'bolido',
      fecha: b.fecha,
      titulo: es() ? 'Nuevo bólido registrado' : 'New fireball recorded',
      detalle: es()
        ? `Liberó ${formatearNumero(b.kt, 2)} kt al estallar en la atmósfera.`
        : `It released ${formatearNumero(b.kt, 2)} kt exploding in the atmosphere.`,
      ruta: 'nasa/bolidos',
      enlace: 'https://cneos.jpl.nasa.gov/fireballs/',
    });
  }
  if (ultimaFotoTierra) {
    avisos.push({
      id: `tierra-${ultimaFotoTierra}`,
      regla: 'tierra',
      fecha: Date.parse(`${ultimaFotoTierra}T12:00:00Z`),
      titulo: es() ? 'Fotos nuevas de la Tierra' : 'New photos of Earth',
      detalle: es()
        ? `La cámara EPIC publicó las del ${ultimaFotoTierra}.`
        : `The EPIC camera published the ones from ${ultimaFotoTierra}.`,
      ruta: 'nasa/tierra',
    });
  }
  if (resumen?.exoplanetas) {
    avisos.push({
      id: `exoplanetas-${resumen.exoplanetas}`,
      regla: 'exoplanetas',
      fecha: Date.parse(resumen.generado),
      titulo: es()
        ? `${formatearNumero(resumen.exoplanetas)} exoplanetas confirmados`
        : `${formatearNumero(resumen.exoplanetas)} confirmed exoplanets`,
      detalle: es()
        ? 'El total del archivo de la NASA cambió.'
        : 'The NASA archive total changed.',
      ruta: 'nasa/exoplanetas',
    });
  }
  return avisos.sort((x, y) => y.fecha - x.fecha);
}
