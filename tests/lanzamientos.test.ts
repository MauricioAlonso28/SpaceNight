import { describe, expect, it } from 'vitest';
import {
  duracionIso,
  recortarLanzamientos,
} from '../scripts/nasa/transformar.mjs';
import {
  agruparLanzamientos,
  cuandoLanzamiento,
  estadoLanzamiento,
  nombreEvento,
  relojLanzamiento,
  siguienteConHora,
  type Lanzamiento,
} from '../src/servicios/cohete/lanzamientos';
import { calcularAvisos } from '../src/servicios/nasa/avisos';

const AHORA = Date.UTC(2026, 10, 11, 18, 0);

/** Un lanzamiento de la API con lo mínimo y lo que se le cambie. */
function api(extra: Record<string, unknown> = {}) {
  return {
    id: 'abc',
    name: 'Falcon 9 Block 5 | USSF-627',
    net: '2026-11-12T02:36:00Z',
    net_precision: { abbrev: 'MIN' },
    window_start: '2026-11-12T02:35:00Z',
    window_end: '2026-11-12T06:35:00Z',
    status: { abbrev: 'Go' },
    launch_service_provider: { name: 'SpaceX' },
    rocket: {
      configuration: {
        full_name: 'Falcon 9 Block 5',
        families: [{ name: 'Falcon' }],
        length: 70,
        to_thrust: 7607,
        leo_capacity: 22800,
        total_launch_count: 645,
        successful_launches: 644,
        reusable: true,
      },
      launcher_stage: [
        {
          launcher_flight_number: 7,
          launcher: { serial_number: 'B1103' },
          landing: {
            attempt: true,
            downrange_distance: 574,
            landing_location: {
              name: 'Of Course I Still Love You',
              abbrev: 'OCISLY',
            },
            type: { abbrev: 'ASDS' },
          },
        },
      ],
    },
    mission: {
      name: 'USSF-627',
      type: 'Government/Top Secret',
      description: 'A classified mission.',
      orbit: { abbrev: 'LEO', name: 'Low Earth Orbit' },
    },
    pad: {
      name: 'SLC-4E',
      latitude: '34.632',
      longitude: '-120.611',
      country: { alpha_2_code: 'US' },
      location: { name: 'Vandenberg SFB, CA, USA' },
    },
    vid_urls: [
      { url: 'https://x.com/a', source: 'x.com', priority: 10 },
      { url: 'https://youtube.com/b', source: 'youtube.com', priority: 8 },
    ],
    webcast_live: false,
    probability: null,
    timeline: [
      { type: { id: 12, abbrev: 'MECO' }, relative_time: 'PT2M28S' },
      { type: { id: 10, abbrev: 'Liftoff' }, relative_time: 'PT0S' },
      { type: { id: 1, abbrev: 'GO for Prop Load' }, relative_time: '-PT38M' },
    ],
    ...extra,
  };
}

describe('lanzamientos: pipeline', () => {
  it('lee duraciones ISO con signo', () => {
    expect(duracionIso('-PT38M')).toBe(-2280);
    expect(duracionIso('PT2M28S')).toBe(148);
    expect(duracionIso('P1DT2H')).toBe(93_600);
    expect(duracionIso('PT0S')).toBe(0);
    expect(duracionIso('mañana')).toBeNull();
  });

  it('recorta un lanzamiento: video de YouTube, propulsor, aterrizaje y la secuencia en orden', () => {
    const r = recortarLanzamientos({ results: [api()] }, null);
    const l = r.proximos[0];
    expect(l).toMatchObject({
      nombre: 'USSF-627',
      cohete: 'Falcon 9 Block 5',
      net: Date.UTC(2026, 10, 12, 2, 36),
      precision: 'MIN',
      pais: 'US',
      lat: 34.632,
      video: 'https://youtube.com/b',
      propulsor: {
        serie: 'B1103',
        vuelo: 7,
        aterrizaje: { lugar: 'OCISLY', tipo: 'ASDS', km: 574 },
      },
    });
    expect(l.eventos.map((e) => e.t)).toEqual([-2280, 0, 148]);
    expect(r.recientes).toEqual([]);
  });

  it('ordena por fecha y falla si no hay ninguno', () => {
    const r = recortarLanzamientos(
      { results: [api({ id: 'b', net: '2026-12-01T00:00:00Z' }), api()] },
      { results: [] },
    );
    expect(r.proximos.map((l) => l.id)).toEqual(['abc', 'b']);
    expect(() => recortarLanzamientos({ results: [] }, null)).toThrow();
  });
});

/** Un lanzamiento ya recortado, a una hora y con una precisión. */
function lanz(
  id: string,
  net: number,
  precision: string,
  estado = 'Go',
): Lanzamiento {
  const r = recortarLanzamientos({ results: [api()] }, null).proximos[0];
  return { ...r, id, net, precision, estado };
}

describe('lanzamientos: en la app', () => {
  it('reloj de cuenta atrás y tras el despegue', () => {
    expect(relojLanzamiento(AHORA + 8_073_000, AHORA)).toBe('T−02:14:33');
    expect(relojLanzamiento(AHORA + 3 * 86_400_000 + 60_000, AHORA)).toBe(
      'T−3 d 00:01:00',
    );
    expect(relojLanzamiento(AHORA - 72_000, AHORA)).toBe('T+00:01:12');
  });

  it('cuándo, según lo exacta que sea la fecha', () => {
    const hora = () => '21:36';
    expect(
      cuandoLanzamiento(lanz('a', AHORA, 'MIN'), 'America/Lima', hora),
    ).toMatch(/21:36$/);
    expect(
      cuandoLanzamiento(lanz('a', AHORA, 'HR'), 'America/Lima', hora),
    ).toMatch(/~21:36$/);
    expect(cuandoLanzamiento(lanz('a', AHORA, 'M'), 'UTC', hora)).toBe(
      'noviembre de 2026',
    );
    expect(cuandoLanzamiento(lanz('a', AHORA, 'Q4'), 'UTC', hora)).toBe(
      '4.º trimestre de 2026',
    );
  });

  it('agrupa por día local y deja al final los meses por confirmar', () => {
    const g = agruparLanzamientos(
      [
        lanz('a', Date.UTC(2026, 10, 12, 2, 36), 'MIN'),
        lanz('b', Date.UTC(2026, 10, 30), 'M'),
        lanz('c', Date.UTC(2026, 10, 12, 20, 0), 'HR'),
      ],
      'America/Lima',
    );
    expect(g.map((x) => [x.clave, x.lanzamientos.map((l) => l.id)])).toEqual([
      ['2026-11-11', ['a']],
      ['2026-11-12', ['c']],
      ['~2026-11', ['b']],
    ]);
  });

  it('el siguiente con hora salta los que solo tienen mes', () => {
    const lista = [
      lanz('mes', AHORA + 3_600_000, 'M'),
      lanz('hora', AHORA + 7_200_000, 'MIN'),
    ];
    expect(siguienteConHora(lista, AHORA)?.id).toBe('hora');
  });

  it('estados y eventos en español', () => {
    expect(estadoLanzamiento('Go')).toEqual({
      texto: 'Confirmado',
      tono: 'bien',
    });
    expect(estadoLanzamiento('Raro').texto).toBe('Raro');
    expect(nombreEvento({ id: 11, nombre: 'Max-Q', t: 60 })).toBe(
      'Máxima presión aerodinámica',
    );
    expect(nombreEvento({ id: 999, nombre: 'Algo nuevo', t: 0 })).toBe(
      'Algo nuevo',
    );
  });

  it('avisa de los que despegan en 6 horas con hora exacta, no de los lejanos ni de los hechos', () => {
    const avisos = calcularAvisos({
      resumen: null,
      eventos: [],
      ultimaFotoTierra: null,
      lat: -12,
      lon: -77,
      ahora: AHORA,
      zona: 'America/Lima',
      lanzamientos: [
        lanz('pronto', AHORA + 2 * 3_600_000, 'MIN'),
        lanz('lejos', AHORA + 10 * 3_600_000, 'MIN'),
        lanz('impreciso', AHORA + 3_600_000, 'DAY'),
        lanz('hecho', AHORA - 600_000, 'MIN', 'Success'),
      ],
    });
    expect(avisos.map((a) => a.id)).toEqual(['lanzamiento-pronto']);
    expect(avisos[0]).toMatchObject({
      regla: 'lanzamiento',
      titulo: 'Despega Falcon 9 Block 5',
      ruta: 'cohete/lanzamientos',
      enlace: 'https://youtube.com/b',
    });
    expect(avisos[0].detalle).toContain('15:00');
  });
});
