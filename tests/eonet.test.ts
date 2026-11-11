import { describe, expect, it } from 'vitest';
import {
  contarCategorias,
  masCercano,
  puntoEsfera,
  resumirEvento,
  type EventoEonet,
} from '../src/servicios/nasa/eonet';

const evento = (
  id: string,
  cat: string,
  geometry: EventoEonet['geometry'],
): EventoEonet => ({
  id,
  title: id,
  link: 'l',
  closed: null,
  categories: [{ id: cat, title: cat }],
  sources: [{ id: 's', url: `https://fuente/${id}` }],
  geometry,
});

describe('EONET', () => {
  it('toma la última observación y guarda el recorrido en orden', () => {
    const e = resumirEvento(
      evento('tormenta', 'severeStorms', [
        {
          date: '2026-11-10T00:00:00Z',
          type: 'Point',
          coordinates: [150, -10],
          magnitudeValue: 45,
          magnitudeUnit: 'kts',
        },
        { date: '2026-11-09T00:00:00Z', type: 'Point', coordinates: [152, -9] },
      ]),
    )!;
    expect([e.lon, e.lat]).toEqual([150, -10]);
    expect(e.recorrido).toEqual([
      [152, -9],
      [150, -10],
    ]);
    expect(e.magnitud).toBe('45 kts');
    expect(e.fuente).toBe('https://fuente/tormenta');
  });

  it('un polígono se reduce al centro de sus vértices', () => {
    const e = resumirEvento(
      evento('hielo', 'seaLakeIce', [
        {
          date: '2026-11-10T00:00:00Z',
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [2, 0],
              [2, 2],
              [0, 2],
            ],
          ],
        },
      ]),
    )!;
    expect([e.lon, e.lat]).toEqual([1, 1]);
    expect(resumirEvento(evento('vacio', 'snow', []))).toBeNull();
  });

  it('cuenta por categoría y encuentra el más cercano', () => {
    const lista = [
      resumirEvento(
        evento('a', 'wildfires', [
          { date: '2026-11-10', type: 'Point', coordinates: [-71.97, -13.53] },
        ]),
      )!,
      resumirEvento(
        evento('b', 'wildfires', [
          { date: '2026-11-10', type: 'Point', coordinates: [10, 50] },
        ]),
      )!,
      resumirEvento(
        evento('c', 'volcanoes', [
          { date: '2026-11-10', type: 'Point', coordinates: [-78.4, -0.7] },
        ]),
      )!,
    ];
    expect(contarCategorias(lista)).toEqual([
      ['wildfires', 2],
      ['volcanoes', 1],
    ]);
    const c = masCercano(lista, -12.05, -77.04)!;
    expect(c.evento.id).toBe('a');
    expect(c.km).toBeCloseTo(573, -1);
  });

  it('el punto de la esfera tiene radio 1 y los polos en el eje Y', () => {
    const [x, y, z] = puntoEsfera(-12, -77);
    expect(Math.hypot(x, y, z)).toBeCloseTo(1);
    expect(puntoEsfera(90, 0)[1]).toBeCloseTo(1);
    expect(puntoEsfera(-90, 0)[1]).toBeCloseTo(-1);
  });
});
