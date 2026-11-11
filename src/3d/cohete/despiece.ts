import { acotar, suave } from './vistas';

/** Duración de cada paso de la animación de despiece, en segundos. */
export const TIEMPOS = {
  resalte: 0.15,
  extraccion: 0.3,
  alCentro: 0.35,
} as const;

/** Duración total de la animación, de la pieza en su sitio a la pieza centrada. */
export const DURACION_DESPIECE =
  TIEMPOS.resalte + TIEMPOS.extraccion + TIEMPOS.alCentro;

/**
 * Cuánto lleva hecho cada paso en un instante de la animación, de 0 a 1.
 * @param t segundos desde el inicio; al volver se recorre de DURACION_DESPIECE a 0
 * @returns resalte (paso 1), extraccion y aparte (pasos 2 y 3, a la vez) y alCentro (paso 4)
 */
export function fases(t: number): {
  resalte: number;
  extraccion: number;
  alCentro: number;
} {
  const { resalte, extraccion, alCentro } = TIEMPOS;
  return {
    resalte: acotar(t / resalte, 0, 1),
    extraccion: suave(acotar((t - resalte) / extraccion, 0, 1)),
    alCentro: suave(acotar((t - resalte - extraccion) / alCentro, 0, 1)),
  };
}

/** Ángulo equivalente entre -π y π, para que la pieza vuelva girando lo menos posible. */
export function anguloCorto(a: number): number {
  const vuelta = Math.PI * 2;
  return ((((a + Math.PI) % vuelta) + vuelta) % vuelta) - Math.PI;
}
