import type { DatosLuna } from './datos';

/** Dirección de la imagen horaria de la Luna para un instante, o null si ese año no está publicado. */
export function urlLuna(datos: DatosLuna, instante: number): string | null {
  const anio = new Date(instante).getUTCFullYear();
  const a = datos.anios[String(anio)];
  if (!a) return null;
  const marco = Math.floor((instante - Date.UTC(anio, 0, 1)) / 3_600_000) + 1;
  return `${a.base}${String(marco).padStart(a.digitos, '0')}.jpg`;
}
