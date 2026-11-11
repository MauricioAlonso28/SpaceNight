import type { FilaExoplaneta } from './datos';

/** Años luz en un pársec. */
export const ANIOS_LUZ_POR_PC = 3.2616;

/** Dominio de los ejes del diagrama: período orbital en días y radio en radios terrestres, ambos en escala logarítmica. */
export const EJES = {
  periodo: [0.2, 100_000] as const,
  radio: [0.3, 30] as const,
};

/** Los planetas del sistema solar como referencia: período en días y radio en radios terrestres. */
export const SISTEMA_SOLAR: {
  clave: string;
  periodo: number;
  radio: number;
}[] = [
  { clave: 'mercurio', periodo: 88, radio: 0.38 },
  { clave: 'venus', periodo: 225, radio: 0.95 },
  { clave: 'tierra', periodo: 365.25, radio: 1 },
  { clave: 'marte', periodo: 687, radio: 0.53 },
  { clave: 'jupiter', periodo: 4333, radio: 11.21 },
  { clave: 'saturno', periodo: 10_759, radio: 9.45 },
  { clave: 'urano', periodo: 30_687, radio: 4.01 },
  { clave: 'neptuno', periodo: 60_190, radio: 3.88 },
];

/** Posición de 0 a 1 de un valor en una escala logarítmica, o null si cae fuera. */
export function enEscalaLog(
  v: number | null,
  [min, max]: readonly [number, number],
): number | null {
  if (v === null || v <= 0) return null;
  const k =
    (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
  return k < 0 || k > 1 ? null : k;
}

/**
 * Si un planeta es «templado y rocoso»: tamaño de 0,5 a 1,8 radios terrestres y luz recibida de 0,25 a 1,7 veces la de la Tierra.
 * Es una aproximación a la zona habitable, no un juicio de habitabilidad.
 */
export function templado(f: FilaExoplaneta): boolean {
  const [, , , , radio, , insolacion] = f;
  return (
    radio !== null &&
    insolacion !== null &&
    radio >= 0.5 &&
    radio <= 1.8 &&
    insolacion >= 0.25 &&
    insolacion <= 1.7
  );
}

/** El sistema con planetas más cercano al Sol. */
export function sistemaMasCercano(
  filas: FilaExoplaneta[],
): FilaExoplaneta | null {
  return filas.reduce<FilaExoplaneta | null>(
    (m, f) =>
      f[8] !== null && (m === null || f[8] < (m[8] as number)) ? f : m,
    null,
  );
}

/** Descubrimientos por año y método: para cada año, cuántos de cada método (por índice). */
export function porAnioYMetodo(filas: FilaExoplaneta[], metodos: number) {
  const anios = filas.map((f) => f[2]);
  const desde = Math.min(...anios);
  const hasta = Math.max(...anios);
  const tabla = Array.from({ length: hasta - desde + 1 }, (_, i) => ({
    anio: desde + i,
    n: Array.from({ length: metodos }, () => 0),
  }));
  for (const f of filas) tabla[f[2] - desde].n[f[3]] += 1;
  return tabla;
}
