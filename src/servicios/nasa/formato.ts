import { idioma } from '../../idioma/idioma';

const UNIDADES: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['week', 7 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
];

/**
 * Tiempo relativo legible: «hace 2 horas», «en 3 días», «ahora mismo».
 * @param fecha el momento, en ms o Date
 * @param ahora el momento de referencia
 */
export function haceCuanto(fecha: number | Date, ahora: number | Date): string {
  const d = Number(fecha) - Number(ahora);
  const rtf = new Intl.RelativeTimeFormat(idioma() === 'es' ? 'es' : 'en', {
    numeric: 'auto',
  });
  for (const [unidad, ms] of UNIDADES) {
    if (Math.abs(d) >= ms) return rtf.format(Math.round(d / ms), unidad);
  }
  return idioma() === 'es' ? 'ahora mismo' : 'just now';
}

/**
 * Cuenta atrás compacta hasta un momento: «2 d 4 h», «3 h 12 min», «45 s».
 * @returns null si el momento ya pasó
 */
export function cuentaAtras(fecha: number, ahora: number): string | null {
  const s = Math.floor((fecha - ahora) / 1000);
  if (s <= 0) return null;
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d) return `${d} d ${h} h`;
  if (h) return `${h} h ${m} min`;
  if (m) return `${m} min ${s % 60} s`;
  return `${s} s`;
}

/**
 * Distancia en kilómetros entre dos puntos de la Tierra (fórmula del semiverseno).
 * @returns kilómetros sobre una esfera de 6371 km
 */
export function distanciaSuperficieKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const r = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * r) / 2) ** 2 +
    Math.cos(lat1 * r) *
      Math.cos(lat2 * r) *
      Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}
