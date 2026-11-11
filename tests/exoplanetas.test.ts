import { describe, expect, it } from 'vitest';
import type { FilaExoplaneta } from '../src/servicios/nasa/datos';
import {
  EJES,
  enEscalaLog,
  porAnioYMetodo,
  sistemaMasCercano,
  templado,
} from '../src/servicios/nasa/exoplanetas';

const p = (
  nombre: string,
  anio: number,
  metodo: number,
  radio: number | null,
  insol: number | null,
  pc: number | null,
): FilaExoplaneta => [
  nombre,
  `${nombre} star`,
  anio,
  metodo,
  radio,
  10,
  insol,
  300,
  pc,
];

describe('exoplanetas', () => {
  it('escala logarítmica de los ejes, null fuera del dominio', () => {
    expect(enEscalaLog(EJES.radio[0], EJES.radio)).toBe(0);
    expect(enEscalaLog(EJES.radio[1], EJES.radio)).toBe(1);
    expect(enEscalaLog(3, EJES.radio)).toBeCloseTo(0.5);
    expect(enEscalaLog(null, EJES.radio)).toBeNull();
    expect(enEscalaLog(100, EJES.radio)).toBeNull();
  });

  it('templado y rocoso: tamaño y luz parecidos a los de la Tierra', () => {
    expect(templado(p('a', 2020, 0, 1.1, 0.9, 10))).toBe(true);
    expect(templado(p('b', 2020, 0, 3, 0.9, 10))).toBe(false);
    expect(templado(p('c', 2020, 0, 1, 50, 10))).toBe(false);
    expect(templado(p('d', 2020, 0, null, 1, 10))).toBe(false);
  });

  it('el sistema más cercano ignora los que no tienen distancia', () => {
    const filas = [
      p('lejos', 2010, 0, 1, 1, 100),
      p('sin', 2010, 0, 1, 1, null),
      p('Proxima b', 2016, 1, 1.1, 0.65, 1.3),
    ];
    expect(sistemaMasCercano(filas)?.[0]).toBe('Proxima b');
  });

  it('tabla por año y método sin saltarse años', () => {
    const t = porAnioYMetodo(
      [
        p('a', 1995, 1, 1, 1, 1),
        p('b', 1997, 0, 1, 1, 1),
        p('c', 1997, 0, 1, 1, 1),
      ],
      2,
    );
    expect(t).toEqual([
      { anio: 1995, n: [0, 1] },
      { anio: 1996, n: [0, 0] },
      { anio: 1997, n: [2, 0] },
    ]);
  });
});
