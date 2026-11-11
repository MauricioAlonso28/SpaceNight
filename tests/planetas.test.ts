import { Body } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import { posicion, tramos, ventanaNoche } from '../src/servicios/astro/noche';
import {
  nochePlanetas,
  puntosBrillo,
  rumbo,
  type Planeta,
} from '../src/servicios/astro/planetas';
import { LIMA } from '../src/tipos/ubicacion';
import { lima } from './referencia';

// Referencia: JPL Horizons (ssd.jpl.nasa.gov/api/horizons.api), observador
// -77.04, -12.05, 150 m, QUANTITIES 4 y 9, APPARENT=REFRACTED. Horas en UTC.
const POSICIONES: readonly {
  cuerpo: Body;
  utc: string;
  altura: number;
  azimut: number;
}[] = [
  {
    cuerpo: Body.Saturn,
    utc: '2026-11-11T01:00Z',
    altura: 65.49,
    azimut: 59.24,
  },
  {
    cuerpo: Body.Saturn,
    utc: '2026-11-11T05:00Z',
    altura: 48.89,
    azimut: 285.77,
  },
  {
    cuerpo: Body.Jupiter,
    utc: '2026-11-11T08:00Z',
    altura: 30.15,
    azimut: 66.15,
  },
  { cuerpo: Body.Mars, utc: '2026-11-11T09:00Z', altura: 43.38, azimut: 54.96 },
  { cuerpo: Body.Venus, utc: '2027-02-16T10:00Z', altura: 25.8, azimut: 108 },
  { cuerpo: Body.Jupiter, utc: '2027-02-16T02:00Z', altura: 37.5, azimut: 60 },
  { cuerpo: Body.Mars, utc: '2027-02-16T08:00Z', altura: 47.4, azimut: 308 },
  { cuerpo: Body.Jupiter, utc: '2027-05-21T01:00Z', altura: 45.8, azimut: 309 },
  { cuerpo: Body.Saturn, utc: '2027-05-21T11:00Z', altura: 32.0, azimut: 74 },
];

function diferenciaAngular(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

describe('posición de los planetas frente a JPL Horizons', () => {
  for (const r of POSICIONES) {
    it(`${r.cuerpo} el ${r.utc} queda a menos de 1°`, () => {
      const p = posicion(r.cuerpo, new Date(r.utc), LIMA);
      expect(Math.abs(p.altura - r.altura)).toBeLessThan(1);
      expect(diferenciaAngular(p.azimut, r.azimut)).toBeLessThan(1);
    });
  }
});

function visibles(fecha: Date): Planeta[] {
  return nochePlanetas(fecha, LIMA)
    .planetas.filter((p) => p.visible)
    .map((p) => p.planeta);
}

describe('planetas visibles por noche', () => {
  it('10 de noviembre de 2026: Saturno al anochecer, Marte y Júpiter de madrugada', () => {
    const lista = visibles(lima(2026, 11, 10, 21));
    expect(lista).toEqual(
      expect.arrayContaining(['marte', 'jupiter', 'saturno']),
    );
    expect(lista).not.toContain('mercurio');
  });

  it('15 de febrero de 2027: Venus al amanecer, Marte, Júpiter y Saturno', () => {
    expect(visibles(lima(2027, 2, 15, 21))).toEqual([
      'venus',
      'marte',
      'jupiter',
      'saturno',
    ]);
  });

  it('20 de mayo de 2027: Marte, Júpiter y Saturno; Mercurio no', () => {
    const lista = visibles(lima(2027, 5, 20, 21));
    expect(lista).toEqual(
      expect.arrayContaining(['marte', 'jupiter', 'saturno']),
    );
    expect(lista).not.toContain('mercurio');
  });

  it('Saturno aparece al oscurecer por el E y está más alto en su tránsito', () => {
    const saturno = nochePlanetas(lima(2026, 11, 10, 21), LIMA).planetas.find(
      (p) => p.planeta === 'saturno',
    )!;
    expect(saturno.rumboAparece).toBe('E');
    const minutosTrasPuesta =
      (saturno.aparece!.getTime() - lima(2026, 11, 10, 18, 11).getTime()) /
      60_000;
    expect(minutosTrasPuesta).toBeGreaterThan(45);
    expect(minutosTrasPuesta).toBeLessThan(75);
    expect(saturno.alturaMaxima).toBeGreaterThan(75);
    expect(saturno.masAlto!.getTime()).toBeGreaterThan(
      lima(2026, 11, 10, 21).getTime(),
    );
    expect(saturno.masAlto!.getTime()).toBeLessThan(
      lima(2026, 11, 10, 22).getTime(),
    );
  });

  it('Venus al amanecer del 11 de noviembre roza el límite: unos 10° con el Sol a −12°', () => {
    const venus = nochePlanetas(lima(2026, 11, 10, 21), LIMA).planetas.find(
      (p) => p.planeta === 'venus',
    )!;
    const muestra = venus.muestras.find((m) => m.visible);
    if (muestra) {
      expect(muestra.altura).toBeLessThan(12);
      expect(muestra.fecha.getTime()).toBeGreaterThan(
        lima(2026, 11, 11, 4, 20).getTime(),
      );
    }
  });

  it('el brillo sale de la magnitud de Horizons: Júpiter 5 puntos, Saturno y Marte 3', () => {
    const noche = nochePlanetas(lima(2026, 11, 10, 21), LIMA).planetas;
    const brillo = Object.fromEntries(noche.map((p) => [p.planeta, p.brillo]));
    expect(brillo).toMatchObject({ jupiter: 5, saturno: 3, marte: 3 });
    const jupiter = noche.find((p) => p.planeta === 'jupiter')!;
    expect(jupiter.magnitud).toBeCloseTo(-2.06, 1);
  });
});

describe('ventana de la noche', () => {
  it('a la 01:00 la noche sigue siendo la que empezó la víspera a las 18:00', () => {
    const v = ventanaNoche(lima(2026, 11, 11, 1), LIMA.zona);
    expect(v.inicio).toEqual(lima(2026, 11, 10, 18));
    expect(v.fin).toEqual(lima(2026, 11, 11, 6));
  });

  it('a las 10:00 la noche es la que viene', () => {
    const v = ventanaNoche(lima(2026, 11, 11, 10), LIMA.zona);
    expect(v.inicio).toEqual(lima(2026, 11, 11, 18));
  });

  it('agrupa las muestras en tramos continuos', () => {
    const t = [0, 1, 2, 3, 4].map((h) => lima(2026, 1, 1, h));
    expect(tramos(t, [true, true, false, true, true])).toEqual([
      { desde: t[0], hasta: t[1] },
      { desde: t[3], hasta: t[4] },
    ]);
    expect(tramos(t, [false, false, false, false, false])).toEqual([]);
  });
});

describe('rumbo y brillo', () => {
  it('redondea el azimut al rumbo más cercano', () => {
    expect(rumbo(0)).toBe('N');
    expect(rumbo(22)).toBe('N');
    expect(rumbo(23)).toBe('NE');
    expect(rumbo(90)).toBe('E');
    expect(rumbo(200)).toBe('S');
    expect(rumbo(250)).toBe('O');
    expect(rumbo(338)).toBe('N');
    expect(rumbo(-45)).toBe('NO');
  });

  it('traduce la magnitud a puntos con los cortes del plan', () => {
    expect(puntosBrillo(-4.7)).toBe(5);
    expect(puntosBrillo(-2)).toBe(5);
    expect(puntosBrillo(-1.2)).toBe(4);
    expect(puntosBrillo(0.5)).toBe(3);
    expect(puntosBrillo(2)).toBe(2);
    expect(puntosBrillo(3)).toBe(1);
  });
});
