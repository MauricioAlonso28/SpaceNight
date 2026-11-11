import type { Pronostico } from './openMeteo';

export type Etiqueta = 'excelente' | 'bueno' | 'regular' | 'malo';

/** Los cuatro factores de la fórmula del plan. */
export interface Factores {
  nubes: number;
  humedad: number;
  bortle: number;
  luna: number;
}

/**
 * S = 100 − 0,6·N − 0,2·max(0, H − 60) − 4·(B − 1) − 15·L, recortada entre 0 y 100.
 * @param f nubes y humedad en %, Bortle de 1 a 9 y fracción iluminada de la Luna de 0 a 1
 */
export function puntuacion(f: Factores): number {
  const s =
    100 -
    0.6 * f.nubes -
    0.2 * Math.max(0, f.humedad - 60) -
    4 * (f.bortle - 1) -
    15 * f.luna;
  return Math.round(Math.min(100, Math.max(0, s)));
}

/** Etiqueta de la puntuación: 75 o más Excelente, 50 Bueno, 30 Regular y el resto Malo. */
export function etiqueta(s: number): Etiqueta {
  if (s >= 75) return 'excelente';
  if (s >= 50) return 'bueno';
  if (s >= 30) return 'regular';
  return 'malo';
}

/** Media de nubes y humedad en las horas del pronóstico que caen dentro de un tramo. */
export function mediaEnTramo(
  p: Pronostico,
  desde: Date,
  hasta: Date,
): { nubes: number; humedad: number } | null {
  const horas = p.horas.filter(
    (h) => h.t >= desde.getTime() && h.t <= hasta.getTime(),
  );
  if (horas.length === 0) return null;
  const media = (k: 'nubes' | 'humedad') =>
    horas.reduce((s, h) => s + h[k], 0) / horas.length;
  return { nubes: media('nubes'), humedad: media('humedad') };
}
