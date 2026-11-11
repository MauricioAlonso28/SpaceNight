import { describe, expect, it } from 'vitest';
import calendario from '../public/data/lluvias-2026-2027.json';
import {
  alturaMaximaRadiante,
  conjuncionesEntre,
  eclipsesLunaEntre,
  eclipsesSolEntre,
  eventosEntre,
  lluviasEntre,
  superlunasEntre,
  type Lluvia,
} from '../src/servicios/astro/eventos';
import { LIMA } from '../src/tipos/ubicacion';
import { cercaDe, lima } from './referencia';

const lluvias: Lluvia[] = calendario.lluvias;

// Referencias: NASA Eclipse Web Site (eclipses de 2027) y JPL Horizons para
// la separación de Marte y Júpiter el 16-11-2026 03:00 UTC (1,193°).

describe('eclipses', () => {
  it('2027 trae tres eclipses penumbrales de Luna; desde Lima se ven el de febrero (en parte) y el de agosto', () => {
    const lista = eclipsesLunaEntre(lima(2027, 1, 1), lima(2028, 1, 1), LIMA);
    expect(lista.map((e) => e.fecha.toISOString().slice(0, 10))).toEqual([
      '2027-02-20',
      '2027-08-17',
    ]);
    expect(lista[0]).toMatchObject({ clase: 'penumbral', visible: 'parcial' });
    expect(lista[1]).toMatchObject({ clase: 'penumbral', visible: 'entero' });
    cercaDe(lista[0].fecha, new Date(Date.UTC(2027, 1, 20, 23, 13)), 3);
  });

  it('el eclipse anular del 6 de febrero de 2027 se ve parcial desde Lima, apenas un 2 %', () => {
    const lista = eclipsesSolEntre(
      lima(2026, 11, 10),
      lima(2027, 12, 31),
      LIMA,
    );
    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ tipo: 'eclipse-sol', clase: 'partial' });
    expect(lista[0].fecha.toISOString().slice(0, 10)).toBe('2027-02-06');
    if (lista[0].tipo === 'eclipse-sol') {
      expect(lista[0].oscurecimiento).toBeGreaterThan(0.01);
      expect(lista[0].oscurecimiento).toBeLessThan(0.05);
    }
  });
});

describe('superlunas (perigeo a menos de un día de la llena)', () => {
  it('la del 24 de diciembre de 2026 sí; la del 24 de noviembre se queda a 1,3 días', () => {
    const lista = superlunasEntre(lima(2026, 11, 10), lima(2027, 1, 10));
    expect(lista.map((e) => e.fecha.toISOString().slice(0, 10))).toEqual([
      '2026-12-24',
    ]);
  });
});

describe('conjunciones', () => {
  it('Marte y Júpiter a 1,2° la noche del 15 de noviembre de 2026', () => {
    const lista = conjuncionesEntre(
      lima(2026, 11, 10),
      lima(2026, 12, 10),
      LIMA,
    );
    expect(lista).toHaveLength(1);
    const c = lista[0];
    expect(c).toMatchObject({ tipo: 'conjuncion', a: 'marte', b: 'jupiter' });
    if (c.tipo === 'conjuncion') {
      expect(Math.abs(c.separacion - 1.193)).toBeLessThan(0.05);
    }
    expect(c.fecha).toEqual(lima(2026, 11, 15, 18));
  });

  it('descarta las que caen junto al Sol, como Venus y Júpiter en agosto de 2027', () => {
    const lista = conjuncionesEntre(lima(2027, 8, 1), lima(2027, 9, 1), LIMA);
    expect(lista).toEqual([]);
  });
});

describe('lluvias de meteoros', () => {
  it('entre el 10 de noviembre y el 10 de diciembre: Táuridas del Norte y Leónidas', () => {
    const lista = lluviasEntre(
      lluvias,
      lima(2026, 11, 10),
      lima(2026, 12, 10),
      LIMA,
    );
    expect(lista.map((e) => e.tipo === 'lluvia' && e.lluvia.nombre)).toEqual([
      'Táuridas del Norte',
      'Leónidas',
    ]);
  });

  it('desde Lima el radiante de las Úrsidas apenas sube 2°; el de las Eta Acuáridas pasa de 78°', () => {
    expect(alturaMaximaRadiante(-12.05, 76)).toBeCloseTo(1.95, 1);
    expect(alturaMaximaRadiante(-12.05, -1)).toBeCloseTo(78.95, 1);
  });

  it('el JSON tiene fechas válidas, tasas y radiantes en rango', () => {
    for (const l of lluvias) {
      expect(l.pico).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(l.tasa).toBeGreaterThan(0);
      expect(l.ar).toBeGreaterThanOrEqual(0);
      expect(l.ar).toBeLessThan(360);
      expect(Math.abs(l.dec)).toBeLessThanOrEqual(90);
    }
  });
});

describe('eventos del mes', () => {
  it('salen ordenados por fecha', () => {
    const lista = eventosEntre(
      lima(2026, 12, 10),
      lima(2027, 1, 9),
      LIMA,
      lluvias,
    );
    const tipos = lista.map((e) => e.tipo);
    expect(tipos).toEqual(['lluvia', 'lluvia', 'superluna', 'lluvia']);
    const ms = lista.map((e) => e.fecha.getTime());
    expect(ms).toEqual([...ms].sort((a, b) => a - b));
  });
});
