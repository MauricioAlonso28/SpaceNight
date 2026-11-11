/** Un vector en kilómetros, en el sistema J2000 centrado en la Tierra. */
export interface Vector3Km {
  x: number;
  y: number;
  z: number;
}

/**
 * Una foto de EPIC, la cámara de la nave DSCOVR en el punto L1.
 * @property date fecha y hora UTC como «2026-11-09 00:55:15»
 * @property centroid_coordinates el punto de la Tierra que queda en el centro de la foto
 */
export interface FotoEpic {
  identifier: string;
  image: string;
  date: string;
  centroid_coordinates: { lat: number; lon: number };
  dscovr_j2000_position: Vector3Km;
  sun_j2000_position: Vector3Km;
}

const ARCHIVO = 'https://epic.gsfc.nasa.gov/archive/natural';

/** Fecha y hora de la foto en ms (la API las da en UTC sin zona). */
export function instanteFoto(f: FotoEpic): number {
  return Date.parse(`${f.date.replace(' ', 'T')}Z`);
}

/**
 * Dirección de la imagen: jpg de 1024 px o miniatura de 120 px.
 * @param tipo 'jpg' para la grande, 'thumbs' para la miniatura
 */
export function urlFoto(f: FotoEpic, tipo: 'jpg' | 'thumbs' = 'jpg'): string {
  const [anio, mes, dia] = f.date.slice(0, 10).split('-');
  return `${ARCHIVO}/${anio}/${mes}/${dia}/${tipo}/${f.image}.jpg`;
}

/** Longitud de un vector en km. */
export function modulo(v: Vector3Km): number {
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * Ángulo entre el Sol y la nave vistos desde la Tierra, en grados: lo poco que se aparta DSCOVR de la línea Tierra–Sol.
 */
export function anguloSolNave(f: FotoEpic): number {
  const a = f.dscovr_j2000_position;
  const b = f.sun_j2000_position;
  const cos = (a.x * b.x + a.y * b.y + a.z * b.z) / (modulo(a) * modulo(b));
  return (Math.acos(Math.min(Math.max(cos, -1), 1)) * 180) / Math.PI;
}

/**
 * Hora solar en el centro de la foto, en horas de 0 a 24: allí es mediodía cuando la Tierra mira de frente a la cámara.
 * @param lon longitud del centro, en grados
 */
export function horaSolar(instante: number, lon: number): number {
  const utc = (instante / 3_600_000) % 24;
  return (((utc + lon / 15) % 24) + 24) % 24;
}
