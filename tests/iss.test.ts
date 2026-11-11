import { describe, expect, it } from 'vitest';
import tleTexto from './datos/iss-2026-11-10.tle?raw';
import {
  epocaTle,
  leerTle,
  pasosVisibles,
} from '../src/servicios/satelites/iss';
import { LIMA } from '../src/tipos/ubicacion';
import { cercaDe, lima } from './referencia';

// Referencia: NASA Spot the Station, Peru-None-Lima, consultado el 10-11-2026
// (iss-sts.hqmce.nasa.gov). TLE de CelesTrak de ese día en tests/datos/.
const NASA = [
  {
    dia: 10,
    hora: [4, 36],
    minutos: 6,
    maxima: 26,
    aparece: [10, 'N'],
    desaparece: 'ESE',
  },
  {
    dia: 11,
    hora: [3, 51],
    minutos: 2,
    maxima: 12,
    aparece: [12, 'NE'],
    desaparece: 'E',
  },
  {
    dia: 12,
    hora: [4, 39],
    minutos: 5,
    maxima: 53,
    aparece: [27, 'WNW'],
    desaparece: 'SSE',
  },
  {
    dia: 13,
    hora: [3, 54],
    minutos: 3,
    maxima: 45,
    aparece: [45, 'ESE'],
    desaparece: 'SE',
  },
  {
    dia: 14,
    hora: [4, 41],
    minutos: 2,
    maxima: 12,
    aparece: [12, 'WSW'],
    desaparece: 'SSW',
  },
  {
    dia: 15,
    hora: [3, 55],
    minutos: 1,
    maxima: 18,
    aparece: [18, 'SSW'],
    desaparece: 'S',
  },
] as const;

const RUMBOS_16 = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
];

function cercaDelRumbo(azimut: number, rumbo: string): void {
  const centro = RUMBOS_16.indexOf(rumbo) * 22.5;
  const d = Math.abs(((azimut - centro + 540) % 360) - 180);
  expect(d).toBeLessThanOrEqual(22.5);
}

const tle = leerTle(tleTexto);
const pasos = pasosVisibles(tle, LIMA, lima(2026, 11, 10), 6 * 24);

describe('pasos visibles de la Estación sobre Lima frente a Spot the Station', () => {
  it('encuentra los mismos seis pasos del 10 al 15 de noviembre', () => {
    expect(pasos).toHaveLength(NASA.length);
  });

  NASA.forEach((r, i) => {
    it(`${r.dia} de noviembre, ${r.hora.join(':')}: misma hora con margen de 1 minuto, altura y rumbos`, () => {
      const p = pasos[i];
      cercaDe(p.aparece.fecha, lima(2026, 11, r.dia, ...r.hora), 1);
      const minutos =
        (p.desaparece.fecha.getTime() - p.aparece.fecha.getTime()) / 60_000;
      expect(Math.abs(minutos - r.minutos)).toBeLessThanOrEqual(1);
      expect(Math.abs(p.maximo.altura - r.maxima)).toBeLessThanOrEqual(4);
      expect(Math.abs(p.aparece.altura - r.aparece[0])).toBeLessThanOrEqual(4);
      cercaDelRumbo(p.aparece.azimut, r.aparece[1]);
      cercaDelRumbo(p.desaparece.azimut, r.desaparece);
    });
  });

  it('solo cuenta pasos con el observador a oscuras: ninguno de día', () => {
    for (const p of pasos) {
      const hora = (p.aparece.fecha.getUTCHours() + 24 - 5) % 24;
      expect(hora < 6 || hora >= 18).toBe(true);
    }
  });
});

describe('TLE', () => {
  it('lee el nombre, las dos líneas y la época', () => {
    expect(tle.nombre).toBe('ISS (ZARYA)');
    expect(tle.linea1.startsWith('1 25544U')).toBe(true);
    expect(epocaTle(tle).toISOString().slice(0, 19)).toBe(
      '2026-11-10T04:12:02',
    );
  });

  it('rechaza un texto que no es un TLE', () => {
    expect(() => leerTle('<html>error</html>')).toThrow('TLE_INVALID');
  });
});
