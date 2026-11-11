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
export function fechaJpl(texto: string): number;
export function recortarCad(api: unknown): {
  objetos: {
    des: string;
    nombre: string;
    fecha: number;
    distanciaLunar: number;
    velocidadKms: number;
    h: number;
  }[];
};
export function recortarScout(api: unknown): {
  objetos: {
    nombre: string;
    neo: number;
    pha: number;
    distanciaLunar: number | null;
    h: number;
    observaciones: number;
    actualizado: number;
    velocidadKms: number | null;
  }[];
};
export function leerHorizons(
  resultado: string,
): { km: number; kms: number } | null;
export function recortarApod(a: unknown): {
  fecha: string;
  titulo: string;
  texto: string;
  tipo: string;
  url: string;
  hd: string | null;
  miniatura: string | null;
  credito: string | null;
};
export function baseLuna(
  api: unknown,
): { base: string; digitos: number } | null;
