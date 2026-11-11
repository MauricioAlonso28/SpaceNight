import { Body, SearchAltitude, SearchRiseSet } from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';
import { inicioDelDia } from '../tiempo';
import { observador } from './observador';

/** Altura del Sol bajo la que empieza la noche cerrada. */
export const ALTURA_NOCHE = -18;

/** Puesta, noche cerrada y salida del Sol de la noche que empieza en un día local. */
export interface NocheSol {
  puesta: Date | null;
  nocheInicio: Date | null;
  nocheFin: Date | null;
  salida: Date | null;
}

/**
 * Primer instante tras una fecha en que el Sol cruza una altura.
 * @param direccion +1 si sube, -1 si baja
 * @param altura grados sobre el horizonte, negativos bajo él
 */
export function cruceAltura(
  desde: Date,
  ubicacion: Ubicacion,
  direccion: 1 | -1,
  altura: number,
): Date | null {
  const t = SearchAltitude(
    Body.Sun,
    observador(ubicacion),
    direccion,
    desde,
    1,
    altura,
  );
  return t ? t.date : null;
}

/** Primera salida (+1) o puesta (-1) del Sol después de una fecha. */
export function cruceSol(
  desde: Date,
  ubicacion: Ubicacion,
  direccion: 1 | -1,
): Date | null {
  const t = SearchRiseSet(Body.Sun, observador(ubicacion), direccion, desde, 1);
  return t ? t.date : null;
}

/** La noche que sigue al día local de la fecha: de la puesta a la salida siguiente. */
export function nocheSol(fecha: Date, ubicacion: Ubicacion): NocheSol {
  const inicio = inicioDelDia(fecha, ubicacion.zona);
  const puesta = cruceSol(inicio, ubicacion, -1);
  const desde = puesta ?? inicio;
  const nocheInicio = cruceAltura(desde, ubicacion, -1, ALTURA_NOCHE);
  return {
    puesta,
    nocheInicio,
    nocheFin: nocheInicio
      ? cruceAltura(nocheInicio, ubicacion, 1, ALTURA_NOCHE)
      : null,
    salida: cruceSol(desde, ubicacion, 1),
  };
}
