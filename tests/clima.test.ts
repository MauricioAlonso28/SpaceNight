import { describe, expect, it, vi } from 'vitest';
import { conCache, leerCache, type Almacen } from '../src/cache/cache';
import { leerRespuesta, urlPronostico } from '../src/servicios/clima/openMeteo';
import {
  etiqueta,
  mediaEnTramo,
  puntuacion,
} from '../src/servicios/clima/puntuacion';
import { LIMA } from '../src/tipos/ubicacion';
import { lima } from './referencia';

function memoria(): Almacen {
  const datos = new Map<string, string>();
  return {
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => void datos.set(k, v),
  };
}

const HORA = 3_600_000;

describe('caché con caducidad', () => {
  it('una copia reciente se usa sin descargar', async () => {
    const almacen = memoria();
    const descargar = vi.fn().mockResolvedValue('nuevo');
    await conCache('x', HORA, descargar, 0, almacen);
    const r = await conCache('x', HORA, descargar, HORA / 2, almacen);
    expect(descargar).toHaveBeenCalledTimes(1);
    expect(r).toEqual({ valor: 'nuevo', guardado: 0, caducado: false });
  });

  it('una copia caducada se vuelve a pedir', async () => {
    const almacen = memoria();
    const descargar = vi
      .fn()
      .mockResolvedValueOnce('viejo')
      .mockResolvedValueOnce('nuevo');
    await conCache('x', HORA, descargar, 0, almacen);
    const r = await conCache('x', HORA, descargar, 2 * HORA, almacen);
    expect(r.valor).toBe('nuevo');
    expect(r.guardado).toBe(2 * HORA);
  });

  it('sin conexión devuelve la última copia marcada como caducada', async () => {
    const almacen = memoria();
    await conCache('x', HORA, async () => 'viejo', 0, almacen);
    const r = await conCache(
      'x',
      HORA,
      () => Promise.reject(new Error('offline')),
      3 * HORA,
      almacen,
    );
    expect(r).toEqual({ valor: 'viejo', guardado: 0, caducado: true });
  });

  it('sin conexión y sin copia, el error llega a quien llama', async () => {
    await expect(
      conCache(
        'x',
        HORA,
        () => Promise.reject(new Error('offline')),
        0,
        memoria(),
      ),
    ).rejects.toThrow('offline');
  });

  it('una entrada dañada cuenta como que no hay copia', () => {
    const almacen = memoria();
    almacen.setItem('tu-cielo:cache:x', '{no es json');
    expect(leerCache('x', HORA, 0, almacen)).toBeNull();
  });
});

describe('puntuación del cielo', () => {
  it('el ejemplo del plan da unos 42 puntos: Regular', () => {
    const s = puntuacion({ nubes: 30, humedad: 84, bortle: 8, luna: 0.5 });
    expect(s).toBe(42);
    expect(etiqueta(s)).toBe('regular');
  });

  it('un cielo perfecto da 100 y uno imposible se recorta a 0', () => {
    expect(puntuacion({ nubes: 0, humedad: 40, bortle: 1, luna: 0 })).toBe(100);
    expect(puntuacion({ nubes: 100, humedad: 100, bortle: 9, luna: 1 })).toBe(
      0,
    );
  });

  it('la humedad solo resta por encima del 60 %', () => {
    const base = { nubes: 0, bortle: 1, luna: 0 };
    expect(puntuacion({ ...base, humedad: 60 })).toBe(100);
    expect(puntuacion({ ...base, humedad: 90 })).toBe(94);
  });

  it('en Lima, sin nubes ni Luna, el máximo es 72: la luz de la ciudad manda', () => {
    expect(puntuacion({ nubes: 0, humedad: 60, bortle: 8, luna: 0 })).toBe(72);
  });

  it('los cortes de las etiquetas son 75, 50 y 30', () => {
    expect(etiqueta(75)).toBe('excelente');
    expect(etiqueta(74)).toBe('bueno');
    expect(etiqueta(50)).toBe('bueno');
    expect(etiqueta(49)).toBe('regular');
    expect(etiqueta(30)).toBe('regular');
    expect(etiqueta(29)).toBe('malo');
  });
});

describe('pronóstico de Open-Meteo', () => {
  it('pide nubes, humedad y visibilidad por hora en tiempo Unix', () => {
    const url = new URL(urlPronostico(LIMA));
    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('-12.05');
    expect(url.searchParams.get('hourly')).toBe(
      'cloud_cover,relative_humidity_2m,visibility',
    );
    expect(url.searchParams.get('timeformat')).toBe('unixtime');
  });

  it('convierte segundos a milisegundos y descarta horas sin datos', () => {
    const t0 = lima(2026, 11, 10, 20).getTime() / 1000;
    const p = leerRespuesta({
      hourly: {
        time: [t0, t0 + 3600],
        cloud_cover: [30, null],
        relative_humidity_2m: [84, 85],
        visibility: [20000, 20000],
      },
    });
    expect(p.horas).toEqual([
      { t: t0 * 1000, nubes: 30, humedad: 84, visibilidad: 20000 },
    ]);
  });

  it('promedia solo las horas de noche cerrada', () => {
    const p = {
      horas: [19, 20, 21, 22].map((h, i) => ({
        t: lima(2026, 11, 10, h).getTime(),
        nubes: [100, 40, 20, 0][i],
        humedad: [90, 80, 80, 80][i],
        visibilidad: 20000,
      })),
    };
    expect(
      mediaEnTramo(p, lima(2026, 11, 10, 20), lima(2026, 11, 10, 22)),
    ).toEqual({
      nubes: 20,
      humedad: 80,
    });
    expect(mediaEnTramo(p, lima(2026, 12, 1), lima(2026, 12, 2))).toBeNull();
  });
});
