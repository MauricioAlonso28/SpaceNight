import { Body, GeoVector } from 'astronomy-engine';

export const KM_POR_UA = 149_597_870.7;
const KM_POR_SEGUNDO_LUZ = 299_792.458;

/** Distancia del centro de la Tierra al cuerpo en kilómetros, corregida por el tiempo de luz. */
export function distanciaKm(cuerpo: Body, fecha: Date): number {
  return GeoVector(cuerpo, fecha, true).Length() * KM_POR_UA;
}

/** Segundos que tarda la luz del cuerpo en llegar a la Tierra. */
export function segundosLuz(km: number): number {
  return km / KM_POR_SEGUNDO_LUZ;
}
