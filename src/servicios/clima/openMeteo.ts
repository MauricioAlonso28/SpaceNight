import { conCache, type ResultadoCache } from '../../cache/cache';
import type { Ubicacion } from '../../tipos/ubicacion';

export const DIAS_PRONOSTICO = 16;
const UNA_HORA = 3_600_000;

/** Una hora del pronóstico. */
export interface HoraClima {
  t: number;
  nubes: number;
  humedad: number;
  visibilidad: number;
}

/** Pronóstico por hora de Open-Meteo, en milisegundos UTC. */
export interface Pronostico {
  horas: HoraClima[];
}

interface RespuestaOpenMeteo {
  hourly: {
    time: number[];
    cloud_cover: (number | null)[];
    relative_humidity_2m: (number | null)[];
    visibility: (number | null)[];
  };
}

/** Dirección de la petición; las coordenadas se redondean para compartir caché. */
export function urlPronostico(ubicacion: Ubicacion): string {
  const p = new URLSearchParams({
    latitude: ubicacion.latitud.toFixed(2),
    longitude: ubicacion.longitud.toFixed(2),
    hourly: 'cloud_cover,relative_humidity_2m,visibility',
    timeformat: 'unixtime',
    forecast_days: String(DIAS_PRONOSTICO),
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

/** Convierte la respuesta en horas completas, descartando las que vienen vacías. */
export function leerRespuesta(r: RespuestaOpenMeteo): Pronostico {
  const h = r.hourly;
  const horas: HoraClima[] = [];
  h.time.forEach((t, i) => {
    const nubes = h.cloud_cover[i];
    const humedad = h.relative_humidity_2m[i];
    if (nubes == null || humedad == null) return;
    horas.push({
      t: t * 1000,
      nubes,
      humedad,
      visibilidad: h.visibility[i] ?? 0,
    });
  });
  return { horas };
}

/** Pronóstico de la ubicación, con una hora de caché en localStorage. */
export function pronostico(
  ubicacion: Ubicacion,
): Promise<ResultadoCache<Pronostico>> {
  const url = urlPronostico(ubicacion);
  return conCache(`clima:${url}`, UNA_HORA, async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`WEATHER_HTTP_${res.status}`);
    return leerRespuesta((await res.json()) as RespuestaOpenMeteo);
  });
}
