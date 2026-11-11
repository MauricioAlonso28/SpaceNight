import { describe, expect, it } from 'vitest';
import {
  cruceLunaEnDia,
  datosLuna,
  faseDesdeAngulo,
  pasoLuna,
  proximaFase,
} from '../src/servicios/astro/luna';
import { LIMA } from '../src/tipos/ubicacion';
import { cercaDe, lima } from './referencia';

// Referencia: US Naval Observatory, aa.usno.navy.mil/api/rstt/oneday,
// coords -12.05,-77.04, tz -5. Horas locales de Lima.
const REFERENCIAS = [
  { dia: [2026, 11, 10], salida: [6, 19], puesta: [19, 33] },
  { dia: [2026, 11, 17], salida: [12, 11], puesta: [0, 12] },
  { dia: [2026, 11, 24], salida: [18, 38], puesta: [5, 15] },
  { dia: [2026, 12, 1], salida: [0, 13], puesta: [12, 25] },
  { dia: [2027, 1, 15], salida: [12, 1], puesta: [23, 57] },
] as const;

describe('salida y puesta de la Luna en Lima', () => {
  for (const r of REFERENCIAS) {
    const [a, m, d] = r.dia;
    it(`${a}-${m}-${d} coincide con USNO a menos de 2 minutos`, () => {
      const mediodia = lima(a, m, d, 12);
      cercaDe(cruceLunaEnDia(mediodia, LIMA, 1), lima(a, m, d, ...r.salida));
      cercaDe(cruceLunaEnDia(mediodia, LIMA, -1), lima(a, m, d, ...r.puesta));
    });
  }

  it('el 16 de noviembre de 2026 la Luna no se pone (lo hace a las 00:12 del 17)', () => {
    const dia = lima(2026, 11, 16, 12);
    cercaDe(cruceLunaEnDia(dia, LIMA, 1), lima(2026, 11, 16, 11, 23));
    expect(cruceLunaEnDia(dia, LIMA, -1)).toBeNull();
  });

  it('el 30 de noviembre de 2026 la Luna no sale', () => {
    const dia = lima(2026, 11, 30, 12);
    expect(cruceLunaEnDia(dia, LIMA, 1)).toBeNull();
    cercaDe(cruceLunaEnDia(dia, LIMA, -1), lima(2026, 11, 30, 11, 33));
  });

  it('la puesta que muestra la portada es la que sigue a la salida, aunque sea al día siguiente', () => {
    const paso = pasoLuna(lima(2026, 11, 17, 21), LIMA);
    cercaDe(paso.salida, lima(2026, 11, 17, 12, 11));
    cercaDe(paso.puesta, lima(2026, 11, 18, 0, 50));
  });

  it('si ese día no sale, la portada muestra la puesta del día', () => {
    const paso = pasoLuna(lima(2026, 11, 30, 12), LIMA);
    expect(paso.salida).toBeNull();
    cercaDe(paso.puesta, lima(2026, 11, 30, 11, 33));
  });

  it('usa el día local aunque el instante sea de madrugada en UTC', () => {
    const nocheLima = lima(2026, 11, 10, 23, 30);
    cercaDe(cruceLunaEnDia(nocheLima, LIMA, -1), lima(2026, 11, 10, 19, 33));
  });
});

describe('próximas fases', () => {
  // Referencia: USNO, aa.usno.navy.mil/api/moon/phases/date, horas en UTC.
  const desde = lima(2026, 11, 10, 12);

  it('la próxima luna llena es el 24 de noviembre de 2026 a las 14:53 UTC', () => {
    cercaDe(proximaFase(desde, 180), new Date(Date.UTC(2026, 10, 24, 14, 53)));
  });

  it('el mismo día de la luna llena, por la noche, sigue contando como la próxima', () => {
    const luna = datosLuna(lima(2026, 11, 24, 21), LIMA);
    cercaDe(luna.proximaLlena, new Date(Date.UTC(2026, 10, 24, 14, 53)));
  });

  it('la próxima luna nueva es el 9 de diciembre de 2026 a las 00:52 UTC', () => {
    cercaDe(proximaFase(desde, 0), new Date(Date.UTC(2026, 11, 9, 0, 52)));
  });
});

describe('fase e iluminación', () => {
  it('en el cuarto creciente está iluminada a la mitad', () => {
    const luna = datosLuna(new Date(Date.UTC(2026, 10, 17, 11, 48)), LIMA);
    expect(luna.fase).toBe('cuarto-creciente');
    expect(luna.angulo).toBeCloseTo(90, 0);
    expect(luna.fraccion).toBeCloseTo(0.5, 1);
    expect(luna.diaCiclo).toBeCloseTo(7.38, 1);
  });

  it('en la luna llena está iluminada casi entera', () => {
    const luna = datosLuna(new Date(Date.UTC(2026, 10, 24, 14, 53)), LIMA);
    expect(luna.fase).toBe('llena');
    expect(luna.fraccion).toBeGreaterThan(0.99);
  });

  it('un día después de la luna nueva sigue contando como nueva', () => {
    const luna = datosLuna(lima(2026, 11, 9, 21), LIMA);
    expect(luna.fase).toBe('nueva');
    expect(luna.fraccion).toBeLessThan(0.02);
  });

  it('el ángulo se traduce a la fase correcta en cada tramo', () => {
    expect(faseDesdeAngulo(0)).toBe('nueva');
    expect(faseDesdeAngulo(359)).toBe('nueva');
    expect(faseDesdeAngulo(45)).toBe('creciente');
    expect(faseDesdeAngulo(90)).toBe('cuarto-creciente');
    expect(faseDesdeAngulo(135)).toBe('gibosa-creciente');
    expect(faseDesdeAngulo(180)).toBe('llena');
    expect(faseDesdeAngulo(225)).toBe('gibosa-menguante');
    expect(faseDesdeAngulo(270)).toBe('cuarto-menguante');
    expect(faseDesdeAngulo(315)).toBe('menguante');
    expect(faseDesdeAngulo(-90)).toBe('cuarto-menguante');
  });
});
