/** Una estrella del catálogo: [ar°, dec°, mag, B−V, nombre, designación, constelación]. */
export type FilaEstrella = [
  number,
  number,
  number,
  number | null,
  string,
  string,
  string,
];

/** Una constelación: nombre en español, centro para la etiqueta y tramos de líneas. */
export interface Constelacion {
  id: string;
  nombre: string;
  latin: string;
  centro: [number, number];
  lineas: [number, number][][];
}

export const TAMANOS_MAGNITUD: readonly [number, number][] = [
  [0, 7],
  [1, 5.4],
  [2, 4.2],
  [3, 3.2],
  [4, 2.4],
  [Infinity, 1.7],
];

/** Tamaño del punto en píxeles: las estrellas brillantes, más grandes. */
export function tamanoPorMagnitud(mag: number): number {
  return TAMANOS_MAGNITUD.find(([hasta]) => mag < hasta)![1];
}

const PARADAS_BV: readonly [number, [number, number, number]][] = [
  [-0.4, [155, 176, 255]],
  [0, [202, 216, 255]],
  [0.4, [248, 247, 255]],
  [0.8, [255, 244, 222]],
  [1.2, [255, 218, 170]],
  [2, [255, 188, 120]],
];

/** Color RGB (0 a 1) según el índice B−V: azulado si es caliente, anaranjado si es fría. */
export function colorPorBV(bv: number | null): [number, number, number] {
  if (bv === null) return [1, 1, 1];
  const x = Math.max(PARADAS_BV[0][0], Math.min(bv, PARADAS_BV.at(-1)![0]));
  const i = Math.max(
    1,
    PARADAS_BV.findIndex(([v]) => v >= x),
  );
  const [v0, c0] = PARADAS_BV[i - 1];
  const [v1, c1] = PARADAS_BV[i];
  const t = v1 === v0 ? 0 : (x - v0) / (v1 - v0);
  return c0.map((c, k) => (c + (c1[k] - c) * t) / 255) as [
    number,
    number,
    number,
  ];
}
