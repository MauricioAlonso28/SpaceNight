import type { Vector3 } from 'three';
import { ALTO, type Salida } from './modelo';

/** Dónde mira la cámara: giro, inclinación y distancia alrededor de un punto del eje. */
export interface Vista {
  azimut: number;
  elevacion: number;
  distancia: number;
  objetivoY: number;
}

/** Vista inicial: el cohete entero, algo de lado y desde un poco arriba. */
export const VISTA_GENERAL: Vista = {
  azimut: 35,
  elevacion: 10,
  distancia: 132,
  objetivoY: ALTO / 2,
};

/** Limita un valor a un intervalo. */
export const acotar = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

/** Curva de aceleración y frenado suaves, de 0 a 1. */
export const suave = (t: number) =>
  t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

/** Diferencia de ángulos en grados por el camino más corto, entre -180 y 180. */
export function giroCorto(desde: number, hasta: number): number {
  return ((((hasta - desde + 540) % 360) + 360) % 360) - 180;
}

/** Vista intermedia entre dos vistas; el giro va por el lado más corto. */
export function interpolarVista(a: Vista, b: Vista, k: number): Vista {
  return {
    azimut: (a.azimut + giroCorto(a.azimut, b.azimut) * k + 360) % 360,
    elevacion: a.elevacion + (b.elevacion - a.elevacion) * k,
    distancia: a.distancia + (b.distancia - a.distancia) * k,
    objetivoY: a.objetivoY + (b.objetivoY - a.objetivoY) * k,
  };
}

/**
 * Vista que encuadra una pieza: de frente a su lado del cohete, y desde abajo si sale hacia abajo.
 * @param pieza ancla, tamaño y salida de la pieza en el modelo
 */
export function vistaDePieza(pieza: {
  ancla: Vector3;
  radio: number;
  salida: Salida;
}): Vista {
  const { ancla, radio, salida } = pieza;
  const fuera = Math.hypot(ancla.x, ancla.z) > 0.6;
  const azimut = fuera
    ? ((Math.atan2(ancla.x, ancla.z) * 180) / Math.PI + 360) % 360
    : VISTA_GENERAL.azimut;
  return {
    azimut,
    elevacion: salida === 'abajo' ? -14 : 8,
    distancia: acotar(radio * 3.4 + 4, 9, 75),
    objetivoY: ancla.y,
  };
}
