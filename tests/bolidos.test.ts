import { describe, expect, it } from 'vitest';
import { fijarIdioma } from '../src/idioma/idioma';
import {
  destacados,
  hiroshimas,
  porAnio,
  radioEnergia,
  unoEn,
} from '../src/servicios/nasa/bolidos';
import type { FilaBolido } from '../src/servicios/nasa/datos';

const fila = (iso: string, kt: number): FilaBolido => [
  Date.parse(iso),
  kt,
  0,
  0,
  null,
  null,
];

describe('bólidos', () => {
  it('cuenta por año sin saltarse los años vacíos', () => {
    const filas = [
      fila('2020-05-01T00:00:00Z', 1),
      fila('2022-01-01T00:00:00Z', 2),
      fila('2022-06-01T00:00:00Z', 3),
    ];
    expect(porAnio(filas)).toEqual([
      { anio: 2020, n: 1 },
      { anio: 2021, n: 0 },
      { anio: 2022, n: 2 },
    ]);
    expect(porAnio([])).toEqual([]);
  });

  it('el más energético y el más reciente', () => {
    const filas = [
      fila('2013-02-15T03:20:33Z', 440),
      fila('2026-10-04T03:14:45Z', 0.18),
    ];
    const d = destacados(filas);
    expect(d.masEnergetico[1]).toBe(440);
    expect(d.ultimo[1]).toBe(0.18);
    expect(hiroshimas(440)).toBeCloseTo(29.3, 1);
  });

  it('el radio crece con la raíz cúbica y tiene tope', () => {
    expect(radioEnergia(0)).toBeCloseTo(1.4);
    expect(radioEnergia(8) - 1.4).toBeCloseTo(2 * (radioEnergia(1) - 1.4));
    expect(radioEnergia(1e6)).toBe(22);
  });

  it('probabilidad como «1 en N»', () => {
    expect(unoEn(0.1, true)).toBe('1 en 10');
    expect(unoEn(1 / 2_400_000, true)).toBe('1 en 2,4 millones');
    fijarIdioma('en');
    expect(unoEn(1 / 45_000, false)).toBe('1 in 45 thousand');
    expect(unoEn(1 / 2_400_000, false)).toBe('1 in 2.4 million');
    fijarIdioma('es');
    expect(unoEn(0, true)).toBe('—');
  });
});
