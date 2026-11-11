import { distanciaSuperficieKm } from './formato';

/** Una observación de un evento: un punto o un polígono con su fecha. */
export interface GeometriaEonet {
  date: string;
  type: 'Point' | 'Polygon';
  coordinates: number[] | number[][][];
  magnitudeValue?: number | null;
  magnitudeUnit?: string | null;
}

/** Un evento natural abierto de EONET: incendio, volcán, tormenta, hielo… */
export interface EventoEonet {
  id: string;
  title: string;
  link: string;
  closed: string | null;
  categories: { id: string; title: string }[];
  sources: { id: string; url: string }[];
  geometry: GeometriaEonet[];
}

/** Color de cada categoría de EONET en el globo y en la lista. */
export const COLOR_CATEGORIA: Record<string, string> = {
  wildfires: '#ff7d4d',
  volcanoes: '#ff3d6e',
  severeStorms: '#8fb4ff',
  seaLakeIce: '#dff3ff',
  floods: '#3fa7ff',
  earthquakes: '#ffd166',
  drought: '#e0b070',
  dustHaze: '#c9a77c',
  landslides: '#b08968',
  manmade: '#c77dff',
  snow: '#f4f7ff',
  tempExtremes: '#ff9f1c',
  waterColor: '#2ec4b6',
};

/** Nombre de cada categoría en los dos idiomas. */
export const NOMBRE_CATEGORIA: Record<string, { es: string; en: string }> = {
  wildfires: { es: 'Incendios', en: 'Wildfires' },
  volcanoes: { es: 'Volcanes', en: 'Volcanoes' },
  severeStorms: { es: 'Tormentas', en: 'Severe storms' },
  seaLakeIce: { es: 'Hielo marino', en: 'Sea and lake ice' },
  floods: { es: 'Inundaciones', en: 'Floods' },
  earthquakes: { es: 'Sismos', en: 'Earthquakes' },
  drought: { es: 'Sequías', en: 'Drought' },
  dustHaze: { es: 'Polvo y bruma', en: 'Dust and haze' },
  landslides: { es: 'Deslizamientos', en: 'Landslides' },
  manmade: { es: 'Causados por personas', en: 'Manmade' },
  snow: { es: 'Nieve', en: 'Snow' },
  tempExtremes: { es: 'Temperaturas extremas', en: 'Temperature extremes' },
  waterColor: { es: 'Color del agua', en: 'Water color' },
};

/** Un punto [lon, lat] de una geometría: el mismo punto o el centro de los vértices del polígono. */
function centro(g: GeometriaEonet): [number, number] {
  if (g.type === 'Point') return g.coordinates as [number, number];
  const anillo = (g.coordinates as number[][][])[0] ?? [];
  const n = anillo.length || 1;
  return [
    anillo.reduce((s, p) => s + p[0], 0) / n,
    anillo.reduce((s, p) => s + p[1], 0) / n,
  ];
}

/**
 * Lo esencial de un evento para dibujarlo: categoría, última posición, cuándo se vio y su recorrido.
 * @returns null si el evento no trae ninguna geometría
 */
export function resumirEvento(e: EventoEonet) {
  const geos = [...e.geometry].sort(
    (a, b) => Date.parse(a.date) - Date.parse(b.date),
  );
  const ultima = geos.at(-1);
  if (!ultima) return null;
  const [lon, lat] = centro(ultima);
  return {
    id: e.id,
    titulo: e.title,
    categoria: e.categories[0]?.id ?? 'manmade',
    lat,
    lon,
    fecha: Date.parse(ultima.date),
    magnitud:
      ultima.magnitudeValue != null
        ? `${ultima.magnitudeValue} ${ultima.magnitudeUnit ?? ''}`.trim()
        : null,
    recorrido: geos.map(centro),
    fuente: e.sources[0]?.url ?? e.link,
  };
}

/** Evento listo para el globo y la lista. */
export type EventoResumido = NonNullable<ReturnType<typeof resumirEvento>>;

/** Cuántos eventos hay de cada categoría, de la que más tiene a la que menos. */
export function contarCategorias(
  eventos: EventoResumido[],
): [string, number][] {
  const cuenta = new Map<string, number>();
  for (const e of eventos)
    cuenta.set(e.categoria, (cuenta.get(e.categoria) ?? 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1]);
}

/** El evento más cercano a un lugar y a cuántos km está. */
export function masCercano(
  eventos: EventoResumido[],
  lat: number,
  lon: number,
): { evento: EventoResumido; km: number } | null {
  let mejor: { evento: EventoResumido; km: number } | null = null;
  for (const e of eventos) {
    const km = distanciaSuperficieKm(lat, lon, e.lat, e.lon);
    if (!mejor || km < mejor.km) mejor = { evento: e, km };
  }
  return mejor;
}

/**
 * Punto de una esfera de radio r para una latitud y longitud, con el mismo reparto de coordenadas que la textura del globo.
 * @returns [x, y, z]
 */
export function puntoEsfera(
  lat: number,
  lon: number,
  r = 1,
): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  ];
}
