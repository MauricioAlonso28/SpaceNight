/** Una versión de una imagen de la biblioteca: dirección y, si la trae, su tamaño. */
interface VersionImagen {
  href: string;
  rel: string;
  render?: string;
  width?: number;
  height?: number;
}

/** Un resultado tal como lo devuelve images-api.nasa.gov/search. */
export interface ItemImagenes {
  href: string;
  data: {
    nasa_id: string;
    title: string;
    description?: string;
    date_created: string;
    center?: string;
    keywords?: string[];
  }[];
  links?: VersionImagen[];
}

/** La respuesta de una búsqueda. */
export interface RespuestaImagenes {
  collection: {
    items: ItemImagenes[];
    metadata: { total_hits: number };
    links?: { rel: string; href: string }[];
  };
}

/** Una imagen lista para el mosaico y el visor. */
export interface ImagenNasa {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: number;
  centro: string | null;
  mosaico: string;
  grande: string;
  ancho: number;
  alto: number;
  pagina: string;
}

/** La primera versión cuyo nombre termina en ~<tipo>.jpg, o null. */
function version(links: VersionImagen[], tipo: string): VersionImagen | null {
  return links.find((l) => l.href.endsWith(`~${tipo}.jpg`)) ?? null;
}

/**
 * Pasa un resultado a lo que usa la vista: versión pequeña para el mosaico, grande para el visor y la proporción para reservar su hueco.
 * @returns null si no trae ninguna imagen
 */
export function imagenDe(item: ItemImagenes): ImagenNasa | null {
  const d = item.data[0];
  const links = item.links ?? [];
  const chica = version(links, 'small') ?? version(links, 'thumb') ?? links[0];
  if (!d || !chica) return null;
  const grande =
    version(links, 'large') ??
    version(links, 'medium') ??
    version(links, 'orig') ??
    chica;
  const medida = links.find((l) => l.width && l.height);
  return {
    id: d.nasa_id,
    titulo: d.title,
    descripcion: (d.description ?? '').replace(/<[^>]*>/g, '').trim(),
    fecha: Date.parse(d.date_created),
    centro: d.center ?? null,
    mosaico: chica.href.replace('http://', 'https://'),
    grande: grande.href.replace('http://', 'https://'),
    ancho: medida?.width ?? 4,
    alto: medida?.height ?? 3,
    pagina: `https://images.nasa.gov/details/${encodeURIComponent(d.nasa_id)}`,
  };
}

/** Dirección de una búsqueda de imágenes, por página de 36. */
export function urlBusqueda(consulta: string, pagina: number): string {
  const q = encodeURIComponent(consulta.trim());
  return `https://images-api.nasa.gov/search?q=${q}&media_type=image&page_size=36&page=${pagina}`;
}

/** El valor que más se repite, o null si la lista está vacía. */
export function masFrecuente(valores: (string | null)[]): string | null {
  const cuenta = new Map<string, number>();
  for (const v of valores) if (v) cuenta.set(v, (cuenta.get(v) ?? 0) + 1);
  let mejor: string | null = null;
  for (const [v, n] of cuenta)
    if (!mejor || n > (cuenta.get(mejor) ?? 0)) mejor = v;
  return mejor;
}

/** Atajos a misiones: lo que se busca y su nombre visible. */
export const MISIONES: { q: string; nombre: { es: string; en: string } }[] = [
  { q: 'Apollo 11', nombre: { es: 'Apolo 11', en: 'Apollo 11' } },
  { q: 'Hubble nebula', nombre: { es: 'Hubble', en: 'Hubble' } },
  { q: 'James Webb Space Telescope', nombre: { es: 'Webb', en: 'Webb' } },
  { q: 'Artemis', nombre: { es: 'Artemis', en: 'Artemis' } },
  {
    q: 'International Space Station Earth',
    nombre: { es: 'Estación Espacial', en: 'Space Station' },
  },
  { q: 'Mars Perseverance', nombre: { es: 'Marte', en: 'Mars' } },
  { q: 'Cassini Saturn', nombre: { es: 'Saturno', en: 'Saturn' } },
  { q: 'spacewalk', nombre: { es: 'Caminatas espaciales', en: 'Spacewalks' } },
  {
    q: 'Space Shuttle launch',
    nombre: { es: 'Transbordador', en: 'Space Shuttle' },
  },
];

/** La misión del día: cambia cada día y es la misma para todos. */
export function misionDelDia(): string {
  const dia = Math.floor(Date.now() / 86_400_000);
  return MISIONES[dia % MISIONES.length].q;
}
