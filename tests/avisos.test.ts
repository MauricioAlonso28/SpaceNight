import { describe, expect, it } from 'vitest';
import { resumir } from '../scripts/nasa/transformar.mjs';
import { calcularAvisos, type ResumenNasa } from '../src/servicios/nasa/avisos';
import type { EventoResumido } from '../src/servicios/nasa/eonet';

const AHORA = Date.UTC(2026, 10, 11, 12);
const ast = (id: string, fecha: number, ld: number) => ({
  id,
  nombre: id,
  url: 'u',
  peligroso: false,
  sentry: false,
  diametroM: [1, 2] as [number, number],
  fecha,
  distanciaKm: ld * 384_400,
  distanciaLunar: ld,
  velocidadKms: 10,
});
const evento = (
  id: string,
  categoria: string,
  lat: number,
  lon: number,
): EventoResumido => ({
  id,
  titulo: id,
  categoria,
  lat,
  lon,
  fecha: AHORA - 3_600_000,
  magnitud: null,
  recorrido: [],
  fuente: 'f',
});

describe('avisos de NASA en vivo', () => {
  it('resumen: cercanos bajo 1 LD, próximos y el último bólido', () => {
    const r = resumir(
      {
        neo: {
          objetos: [
            ast('a', AHORA - 1000, 0.5),
            ast('b', AHORA + 1000, 30),
            ast('c', AHORA + 2000, 2),
          ],
        },
        bolidos: {
          filas: [
            [1, 0.1, 0, 0, null, null],
            [5, 0.3, 10, 20, null, null],
          ],
        },
        sentry: { total: 2244 },
        exoplanetas: { filas: new Array(6464) },
      },
      AHORA,
    );
    expect(r.neo?.cercanos.map((a) => a.id)).toEqual(['a']);
    expect(r.neo?.proximos.map((a) => a.id)).toEqual(['b', 'c']);
    expect(r.bolido).toEqual({ fecha: 5, kt: 0.3, lat: 10, lon: 20 });
    expect(r.exoplanetas).toBe(6464);
    expect(
      resumir(
        { neo: null, bolidos: null, sentry: null, exoplanetas: null },
        AHORA,
      ).neo,
    ).toBeNull();
  });

  it('avisa del asteroide cercano, del evento a menos de 500 km, de tormentas, del bólido reciente, de la Tierra y de los exoplanetas', () => {
    const resumen: ResumenNasa = {
      generado: new Date(AHORA).toISOString(),
      neo: {
        total: 3,
        peligrosos: 0,
        cercanos: [{ ...ast('cerca', AHORA + 86_400_000, 0.4) }],
        proximos: [],
      },
      bolido: { fecha: AHORA - 5 * 86_400_000, kt: 0.2, lat: 0, lon: 0 },
      bolidosTotal: 1000,
      sentryTotal: 2000,
      exoplanetas: 6464,
    };
    const avisos = calcularAvisos({
      resumen,
      eventos: [
        evento('volcan-cerca', 'volcanoes', -14.5, -75.5),
        evento('fuego-lejos', 'wildfires', 45, 10),
        evento('tifon', 'severeStorms', 15, 130),
      ],
      ultimaFotoTierra: '2026-11-09',
      lat: -12.05,
      lon: -77.04,
      ahora: AHORA,
    });
    const reglas = avisos.map((a) => a.id);
    expect(reglas).toContain(`asteroide-cerca-${AHORA + 86_400_000}`);
    expect(reglas).toContain('evento-volcan-cerca');
    expect(reglas).toContain('evento-tifon');
    expect(reglas).not.toContain('evento-fuego-lejos');
    expect(reglas).toContain(`bolido-${AHORA - 5 * 86_400_000}`);
    expect(reglas).toContain('tierra-2026-11-09');
    expect(reglas).toContain('exoplanetas-6464');
    expect(avisos[0].fecha).toBeGreaterThanOrEqual(avisos.at(-1)!.fecha);
  });

  it('no avisa de un bólido de hace más de un mes ni de un asteroide que ya pasó hace días', () => {
    const avisos = calcularAvisos({
      resumen: {
        generado: new Date(AHORA).toISOString(),
        neo: {
          total: 1,
          peligrosos: 0,
          cercanos: [{ ...ast('viejo', AHORA - 3 * 86_400_000, 0.3) }],
          proximos: [],
        },
        bolido: { fecha: AHORA - 60 * 86_400_000, kt: 1, lat: 0, lon: 0 },
        bolidosTotal: 1,
        sentryTotal: 1,
        exoplanetas: null,
      },
      eventos: [],
      ultimaFotoTierra: null,
      lat: 0,
      lon: 0,
      ahora: AHORA,
    });
    expect(avisos).toEqual([]);
  });
});
