import type {
  Asteroide,
  DatosExoplanetas,
  DatosSentry,
  FilaBolido,
} from '../../src/servicios/nasa/datos';

/** Tipos de los recortes de scripts/nasa/transformar.mjs, para usarlos desde TypeScript. */
export function recortarNeo(feed: unknown): { objetos: Asteroide[] };
export function recortarBolidos(api: unknown): {
  campos: string[];
  filas: FilaBolido[];
};
export function recortarSentry(
  api: unknown,
  maximo?: number,
): Omit<DatosSentry, 'generado'>;
export function recortarExoplanetas(
  filas: unknown[],
): Omit<DatosExoplanetas, 'generado'> & { campos: string[] };
