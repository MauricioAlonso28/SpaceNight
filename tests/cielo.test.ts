import { describe, expect, it } from 'vitest';
import estrellasJson from '../public/data/estrellas.json';
import constelacionesJson from '../public/data/constelaciones.json';
import {
  aplicar,
  direccionDe,
  horizontalDe,
  matrizCielo,
  vectorEcuatorial,
} from '../src/servicios/astro/cielo';
import {
  colorPorBV,
  tamanoPorMagnitud,
  type Constelacion,
  type FilaEstrella,
} from '../src/servicios/astro/estrellas';
import { buscar, normalizar } from '../src/pantallas/Mapa/buscar';
import { LIMA } from '../src/tipos/ubicacion';
import { lima } from './referencia';

const estrellas = estrellasJson.estrellas as FilaEstrella[];
const constelaciones = constelacionesJson.constelaciones as Constelacion[];

function estrella(nombre: string): FilaEstrella {
  return estrellas.find((e) => e[4] === nombre)!;
}

function diferenciaAngular(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

// Referencia: Astronomy Engine por otro camino (DefineStar + Equator con
// precesión, nutación y aberración + Horizon sin refracción), 15-12-2026 23:00 Lima.
const REFERENCIA = [
  { nombre: 'Betelgeuse', altura: 61.173, azimut: 48.591 },
  { nombre: 'Rigel', altura: 78.325, azimut: 71.643 },
  { nombre: 'Acrux', altura: -1.645, azimut: 156.861 },
  { nombre: 'Sirius', altura: 56.951, azimut: 102.243 },
];

describe('el cielo de Lima girado por tiempo sidéreo y latitud', () => {
  const m = matrizCielo(lima(2026, 12, 15, 23), LIMA);

  for (const r of REFERENCIA) {
    it(`${r.nombre} queda donde debe, a menos de 0,1°`, () => {
      const [ar, dec] = estrella(r.nombre);
      const h = horizontalDe(aplicar(m, vectorEcuatorial(ar, dec)));
      expect(Math.abs(h.altura - r.altura)).toBeLessThan(0.1);
      expect(diferenciaAngular(h.azimut, r.azimut)).toBeLessThan(0.1);
    });
  }

  it('Orión alta al noreste y la Cruz del Sur aún bajo el horizonte esa noche', () => {
    const centro = (id: string) => {
      const c = constelaciones.find((x) => x.id === id)!;
      return horizontalDe(aplicar(m, vectorEcuatorial(...c.centro)));
    };
    expect(centro('Ori').altura).toBeGreaterThan(50);
    expect(centro('Cru').altura).toBeLessThan(5);
  });

  it('la matriz es una rotación: conserva longitudes', () => {
    const v = aplicar(m, vectorEcuatorial(123, -45));
    expect(Math.hypot(...v)).toBeCloseTo(1, 10);
  });

  it('altura y azimut van y vuelven sin perder nada', () => {
    for (const [alt, az] of [
      [0, 0],
      [45, 90],
      [10, 200],
      [-20, 315],
    ]) {
      const h = horizontalDe(direccionDe(alt, az));
      expect(h.altura).toBeCloseTo(alt, 8);
      expect(diferenciaAngular(h.azimut, az)).toBeLessThan(1e-8);
    }
  });
});

describe('datos del mapa', () => {
  it('unas 3.000 estrellas hasta magnitud 5,5, de la más brillante a la más débil', () => {
    expect(estrellas.length).toBeGreaterThan(2500);
    expect(estrellas.length).toBeLessThan(3500);
    expect(estrellas[0][4]).toBe('Sirius');
    expect(Math.max(...estrellas.map((e) => e[2]))).toBeLessThanOrEqual(5.5);
  });

  it('88 constelaciones con nombre en español (Serpens viene en dos partes)', () => {
    const nombres = new Set(constelaciones.map((c) => c.latin));
    expect(nombres.size).toBe(88);
    expect(constelaciones.find((c) => c.id === 'Ori')?.nombre).toBe('Orión');
    expect(constelaciones.find((c) => c.id === 'Cru')?.nombre).toBe(
      'Cruz del Sur',
    );
  });

  it('tamaño por magnitud y color por B−V', () => {
    expect(tamanoPorMagnitud(-1.4)).toBeGreaterThan(tamanoPorMagnitud(5));
    const [r1, , b1] = colorPorBV(-0.2);
    const [r2, , b2] = colorPorBV(1.5);
    expect(b1).toBeGreaterThan(r1);
    expect(r2).toBeGreaterThan(b2);
    expect(colorPorBV(null)).toEqual([1, 1, 1]);
  });
});

describe('buscador', () => {
  const lista = [
    { clave: 'jupiter', nombres: ['Júpiter'], prioridad: 0 },
    { clave: 'Ori', nombres: ['Orión', 'Orion'], prioridad: 1 },
    { clave: 'Rigel', nombres: ['Rigel', 'β Ori'], prioridad: 2 },
    { clave: 'Cru', nombres: ['Cruz del Sur', 'Crux'], prioridad: 1 },
  ];

  it('no le importan tildes ni mayúsculas', () => {
    expect(normalizar('  JÚPITER ')).toBe('jupiter');
    expect(buscar('jupiter', lista)?.clave).toBe('jupiter');
    expect(buscar('orion', lista)?.clave).toBe('Ori');
  });

  it('acepta el principio del nombre y nombres en latín', () => {
    expect(buscar('cruz', lista)?.clave).toBe('Cru');
    expect(buscar('crux', lista)?.clave).toBe('Cru');
  });

  it('con menos de dos letras o sin coincidencias no devuelve nada', () => {
    expect(buscar('o', lista)).toBeNull();
    expect(buscar('andromeda', lista)).toBeNull();
  });
});
