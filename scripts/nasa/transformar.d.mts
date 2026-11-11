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
export function resumir(
  datos: {
    neo?: { objetos: Asteroide[] } | null;
    bolidos?: { filas: FilaBolido[] } | null;
    sentry?: { total: number } | null;
    exoplanetas?: { filas: unknown[] } | null;
  },
  ahora: number,
): Omit<import('../../src/servicios/nasa/avisos').ResumenNasa, 'generado'>;
