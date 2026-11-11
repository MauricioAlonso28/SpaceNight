import { describe, expect, it } from 'vitest';
import {
  baseLuna,
  fechaJpl,
  leerHorizons,
  recortarApod,
  recortarCad,
  recortarScout,
} from '../scripts/nasa/transformar.mjs';

describe('fuentes extra de la NASA', () => {
  it('fecha de JPL en UTC', () => {
    expect(fechaJpl('2026-Nov-11 03:51')).toBe(Date.UTC(2026, 10, 11, 3, 51));
  });

  it('CAD: distancia en distancias lunares y nombre sin paréntesis', () => {
    const r = recortarCad({
      fields: ['des', 'cd', 'dist', 'v_rel', 'h', 'fullname'],
      data: [
        [
          '2026 VN4',
          '2026-Nov-11 03:51',
          '0.0221327180962547',
          '3.62',
          '27.31',
          '       (2026 VN4)',
        ],
      ],
    });
    expect(r.objetos[0]).toMatchObject({
      nombre: '2026 VN4',
      distanciaLunar: 8.61,
      velocidadKms: 3.6,
      h: 27.3,
    });
  });

  it('Scout: los más probables NEO primero y, a igual puntuación, el más cercano', () => {
    const o = (nombre: string, neo: string, caDist: string | null) => ({
      objectName: nombre,
      neoScore: neo,
      phaScore: '0',
      caDist,
      H: '25',
      nObs: 5,
      lastRun: '2026-11-11 15:02',
      vInf: '10',
    });
    const r = recortarScout({
      data: [o('a', '50', '1'), o('b', '100', '9.6'), o('c', '100', '0.4')],
    });
    expect(r.objetos.map((x) => x.nombre)).toEqual(['c', 'b', 'a']);
    expect(r.objetos[0].actualizado).toBe(Date.UTC(2026, 10, 11, 15, 2));
  });

  it('Horizons: delta en UA a km y deldot en km/s', () => {
    const txt =
      'x\n$$SOE\n 2026-Nov-11 00:00     173.019654814518  28.2902570\n$$EOE\n';
    expect(leerHorizons(txt)).toEqual({
      km: Math.round(173.019654814518 * 149_597_870.7),
      kms: 28.29,
    });
    expect(leerHorizons('sin tabla')).toBeNull();
  });

  it('APOD y la base de las imágenes de la Luna', () => {
    expect(
      recortarApod({
        date: '2026-11-11',
        title: 'T',
        explanation: 'E',
        media_type: 'image',
        url: 'u',
        copyright: ' Ana\n Pérez ',
      }),
    ).toMatchObject({ credito: 'Ana Pérez', hd: null });
    expect(
      baseLuna({
        image: {
          url: 'http://svs.gsfc.nasa.gov/vis/a/frames/730x730_1x1_30p/moon.0001.jpg',
        },
      }),
    ).toEqual({
      base: 'https://svs.gsfc.nasa.gov/vis/a/frames/730x730_1x1_30p/moon.',
      digitos: 4,
    });
    expect(baseLuna({})).toBeNull();
  });
});
