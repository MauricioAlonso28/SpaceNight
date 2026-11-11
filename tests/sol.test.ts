import { Body, Equator, Horizon } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { observador } from '../src/servicios/astro/observador';
import {
  ALTURA_NOCHE,
  cruceAltura,
  cruceSol,
  nocheSol,
} from '../src/servicios/astro/sol';
import { LIMA } from '../src/tipos/ubicacion';
import { cercaDe, lima } from './referencia';

// Referencia: US Naval Observatory, aa.usno.navy.mil/api/rstt/oneday,
// coords -12.05,-77.04, tz -5. Horas locales de Lima.

function alturaSol(fecha: Date): number {
  const obs = observador(LIMA);
  const eq = Equator(Body.Sun, fecha, obs, true, true);
  return Horizon(fecha, obs, eq.ra, eq.dec).altitude;
}

describe('salida y puesta del Sol en Lima', () => {
  it('10 de noviembre de 2026: sale 05:33 y se pone 18:11', () => {
    const inicio = lima(2026, 11, 10);
    cercaDe(cruceSol(inicio, LIMA, 1), lima(2026, 11, 10, 5, 33));
    cercaDe(cruceSol(inicio, LIMA, -1), lima(2026, 11, 10, 18, 11));
  });

  it('15 de enero de 2027: sale 05:55 y se pone 18:40', () => {
    const inicio = lima(2027, 1, 15);
    cercaDe(cruceSol(inicio, LIMA, 1), lima(2027, 1, 15, 5, 55));
    cercaDe(cruceSol(inicio, LIMA, -1), lima(2027, 1, 15, 18, 40));
  });
});

describe('crepúsculos', () => {
  it('el crepúsculo civil (−6°) coincide con USNO: 05:11 y 18:33', () => {
    const inicio = lima(2026, 11, 10);
    cercaDe(cruceAltura(inicio, LIMA, 1, -6), lima(2026, 11, 10, 5, 11));
    cercaDe(cruceAltura(inicio, LIMA, -1, -6), lima(2026, 11, 10, 18, 33));
  });

  it('la noche cerrada empieza y acaba con el Sol a −18°', () => {
    const noche = nocheSol(lima(2026, 11, 10, 12), LIMA);
    expect(alturaSol(noche.nocheInicio!)).toBeCloseTo(ALTURA_NOCHE, 1);
    expect(alturaSol(noche.nocheFin!)).toBeCloseTo(ALTURA_NOCHE, 1);
  });

  it('la noche va en orden: puesta, noche cerrada, fin y salida del día siguiente', () => {
    const noche = nocheSol(lima(2026, 11, 10, 12), LIMA);
    cercaDe(noche.puesta, lima(2026, 11, 10, 18, 11));
    cercaDe(noche.salida, lima(2026, 11, 11, 5, 33));
    const t = [noche.puesta, noche.nocheInicio, noche.nocheFin, noche.salida];
    const ms = t.map((f) => f!.getTime());
    expect(ms).toEqual([...ms].sort((a, b) => a - b));
    const minutosHastaNoche = (ms[1] - ms[0]) / 60_000;
    expect(minutosHastaNoche).toBeGreaterThan(60);
    expect(minutosHastaNoche).toBeLessThan(90);
  });
});
