import { formatearNumero } from '../formato';
import type { FilaBolido } from './datos';

/** Año UTC de un bólido. */
export const anioBolido = (f: FilaBolido) => new Date(f[0]).getUTCFullYear();

/** Cuántos bólidos hubo cada año, del primero al último, sin saltarse años vacíos. */
export function porAnio(filas: FilaBolido[]): { anio: number; n: number }[] {
  if (!filas.length) return [];
  const cuenta = new Map<number, number>();
  for (const f of filas)
    cuenta.set(anioBolido(f), (cuenta.get(anioBolido(f)) ?? 0) + 1);
  const anios = [...cuenta.keys()];
  const desde = Math.min(...anios);
  const hasta = Math.max(...anios);
  return Array.from({ length: hasta - desde + 1 }, (_, i) => ({
    anio: desde + i,
    n: cuenta.get(desde + i) ?? 0,
  }));
}

/**
 * Radio del círculo en el mapa según la energía de impacto: crece con la raíz cúbica, como el radio de una explosión.
 * @param kt energía en kilotones de TNT
 */
export function radioEnergia(kt: number): number {
  return Math.min(Math.max(1.4 + Math.cbrt(kt) * 2.6, 1.4), 22);
}

/** El bólido de más energía y el más reciente. */
export function destacados(filas: FilaBolido[]) {
  return {
    masEnergetico: filas.reduce((m, f) => (f[1] > m[1] ? f : m), filas[0]),
    ultimo: filas.reduce((m, f) => (f[0] > m[0] ? f : m), filas[0]),
  };
}

/**
 * Probabilidad legible como «1 en 10» o «1 en 2,4 millones».
 * @param p probabilidad de 0 a 1
 */
export function unoEn(p: number, es: boolean): string {
  if (p <= 0) return '—';
  const n = 1 / p;
  const millones = es ? 'millones' : 'million';
  const mil = es ? 'mil' : 'thousand';
  const fmt = (v: number) => {
    const r = Math.round(v * 10) / 10;
    return formatearNumero(r, Number.isInteger(r) ? 0 : 1);
  };
  const cuerpo =
    n >= 1e6
      ? `${fmt(n / 1e6)} ${millones}`
      : n >= 1e4
        ? `${fmt(n / 1e3)} ${mil}`
        : fmt(Math.round(n));
  return `${es ? '1 en' : '1 in'} ${cuerpo}`;
}

/** Bombas de Hiroshima (15 kt) que equivalen a cierta energía. */
export const hiroshimas = (kt: number) => kt / 15;
