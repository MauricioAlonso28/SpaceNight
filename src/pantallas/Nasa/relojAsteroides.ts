import type { Asteroide } from '../../servicios/nasa/datos';

/** Distancias que cubre el reloj, en distancias lunares (1 = 384 400 km). */
export const LD_MIN = 0.3;
export const LD_MAX = 300;

/**
 * Radio en el reloj para una distancia, en escala logarítmica: la Luna y los objetos cercanos no quedan aplastados contra la Tierra.
 * @param r0 radio donde empieza la escala (borde de la Tierra)
 * @param r1 radio del borde exterior
 */
export function radioReloj(ld: number, r0: number, r1: number): number {
  const k =
    (Math.log10(Math.min(Math.max(ld, LD_MIN), LD_MAX)) - Math.log10(LD_MIN)) /
    (Math.log10(LD_MAX) - Math.log10(LD_MIN));
  return r0 + k * (r1 - r0);
}

/**
 * Ángulo en grados de un momento dentro de la semana: 0 arriba al empezar, crece en el sentido del reloj.
 * @param desde inicio de la semana, en ms
 * @param hasta fin de la semana, en ms
 */
export function anguloReloj(
  fecha: number,
  desde: number,
  hasta: number,
): number {
  const k = Math.min(Math.max((fecha - desde) / (hasta - desde), 0), 1);
  return k * 360;
}

/** Punto (x, y) a cierto ángulo y radio de un centro, con 0° arriba. */
export function puntoReloj(
  angulo: number,
  radio: number,
  cx: number,
  cy: number,
): { x: number; y: number } {
  const a = ((angulo - 90) * Math.PI) / 180;
  return { x: cx + radio * Math.cos(a), y: cy + radio * Math.sin(a) };
}

/** Radio del punto según el diámetro medio: de 3 a 14 unidades, con raíz cuadrada para que los grandes no tapen todo. */
export function tamanoPunto(diametroM: [number, number]): number {
  const medio = (diametroM[0] + diametroM[1]) / 2;
  return Math.min(Math.max(Math.sqrt(medio) / 2.2, 3), 14);
}

/** Las cifras de la semana: total, peligrosos y el más cercano, el más rápido y el más grande. */
export function resumenNeo(objetos: Asteroide[]) {
  const max = (f: (a: Asteroide) => number) =>
    objetos.reduce((m, a) => (f(a) > f(m) ? a : m), objetos[0]);
  return {
    total: objetos.length,
    peligrosos: objetos.filter((a) => a.peligroso).length,
    masCercano: max((a) => -a.distanciaKm),
    masRapido: max((a) => a.velocidadKms),
    masGrande: max((a) => a.diametroM[1]),
  };
}

/** El siguiente acercamiento después de ahora, o null si ya pasaron todos. */
export function proximoAcercamiento(
  objetos: Asteroide[],
  ahora: number,
): Asteroide | null {
  return objetos.find((a) => a.fecha > ahora) ?? null;
}

/** Inicio y fin de la semana de los datos, de las 00:00 UTC del primer día a las 24:00 del último. */
export function semanaDe(desde: string, hasta: string) {
  return {
    inicio: Date.parse(`${desde}T00:00:00Z`),
    fin: Date.parse(`${hasta}T00:00:00Z`) + 86_400_000,
  };
}
