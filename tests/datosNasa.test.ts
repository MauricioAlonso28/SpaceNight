import { describe, expect, it } from 'vitest';
import {
  recortarBolidos,
  recortarExoplanetas,
  recortarNeo,
  recortarSentry,
} from '../scripts/nasa/transformar.mjs';
import { fijarIdioma } from '../src/idioma/idioma';
import {
  cuentaAtras,
  distanciaSuperficieKm,
  haceCuanto,
} from '../src/servicios/nasa/formato';

describe('recortes de los datos de la NASA', () => {
  it('NeoWs: un objeto por acercamiento, ordenados por fecha y sin paréntesis en el nombre', () => {
    const paso = (epoch: number, km: string) => ({
      epoch_date_close_approach: epoch,
      miss_distance: { kilometers: km, lunar: '1.5' },
      relative_velocity: { kilometers_per_second: '12.3456' },
    });
    const { objetos } = recortarNeo({
      near_earth_objects: {
        '2026-11-12': [
          {
            id: '2',
            name: '(2026 VB)',
            nasa_jpl_url: 'u2',
            is_potentially_hazardous_asteroid: true,
            is_sentry_object: false,
            estimated_diameter: {
              meters: {
                estimated_diameter_min: 10.4,
                estimated_diameter_max: 23.6,
              },
            },
            close_approach_data: [paso(2000, '576000.5')],
          },
        ],
        '2026-11-11': [
          {
            id: '1',
            name: '433 Eros (A898 PA)',
            nasa_jpl_url: 'u1',
            estimated_diameter: { meters: {} },
            close_approach_data: [paso(1000, '1000000')],
          },
        ],
      },
    });
    expect(objetos.map((o) => o.id)).toEqual(['1', '2']);
    expect(objetos[1]).toMatchObject({
      nombre: '2026 VB',
      peligroso: true,
      diametroM: [10, 24],
      distanciaKm: 576001,
      velocidadKms: 12.35,
    });
  });

  it('bólidos: latitud sur y longitud oeste con signo negativo, fecha en UTC', () => {
    const { filas } = recortarBolidos({
      fields: [
        'date',
        'energy',
        'impact-e',
        'lat',
        'lat-dir',
        'lon',
        'lon-dir',
        'alt',
        'vel',
      ],
      data: [
        [
          '2026-10-04 03:14:45',
          '5.4',
          '0.18',
          '41.8',
          'S',
          '173.1',
          'W',
          null,
          null,
        ],
      ],
    });
    expect(filas[0]).toEqual([
      Date.UTC(2026, 9, 4, 3, 14, 45),
      0.18,
      -41.8,
      -173.1,
      null,
      null,
    ]);
  });

  it('Sentry: los más probables primero y el total de objetos vigilados', () => {
    const r = recortarSentry(
      {
        count: '3',
        data: [
          {
            des: 'a',
            fullname: '(a)',
            ip: '1e-6',
            ps_cum: '-5',
            diameter: '0.1',
            range: '2100',
            n_imp: '1',
            v_inf: '10',
          },
          {
            des: 'b',
            fullname: '(b)',
            ip: '0.1',
            ps_cum: '-3',
            diameter: '0.007',
            range: '2095-2122',
            n_imp: '70',
            v_inf: '5.1',
          },
        ],
      },
      1,
    );
    expect(r.total).toBe(3);
    expect(r.objetos.map((o) => o.des)).toEqual(['b']);
  });

  it('exoplanetas: los métodos van del más usado al menos y cada fila guarda su índice', () => {
    const fila = (m: string) => ({
      pl_name: 'x',
      hostname: 'h',
      disc_year: 2020,
      discoverymethod: m,
      pl_rade: 1.234,
      pl_orbper: 365.256,
      pl_insol: 1,
      pl_eqt: 255.4,
      sy_dist: 10.04,
    });
    const r = recortarExoplanetas([
      fila('Imaging'),
      fila('Transit'),
      fila('Transit'),
    ]);
    expect(r.metodos).toEqual(['Transit', 'Imaging']);
    expect(r.filas[0]).toEqual(['x', 'h', 2020, 1, 1.23, 365, 1, 255, 10]);
  });
});

describe('formato de NASA en vivo', () => {
  it('tiempo relativo en los dos idiomas', () => {
    const ahora = Date.UTC(2026, 10, 11, 12);
    fijarIdioma('es');
    expect(haceCuanto(ahora - 2 * 3_600_000, ahora)).toBe('hace 2 horas');
    expect(haceCuanto(ahora + 86_400_000, ahora)).toBe('mañana');
    expect(haceCuanto(ahora - 20_000, ahora)).toBe('ahora mismo');
    fijarIdioma('en');
    expect(haceCuanto(ahora - 3 * 60_000, ahora)).toBe('3 minutes ago');
    fijarIdioma('es');
  });

  it('cuenta atrás compacta y null cuando ya pasó', () => {
    expect(cuentaAtras(90_061_000, 0)).toBe('1 d 1 h');
    expect(cuentaAtras(3_725_000, 0)).toBe('1 h 2 min');
    expect(cuentaAtras(45_000, 0)).toBe('45 s');
    expect(cuentaAtras(0, 10)).toBeNull();
  });

  it('distancia sobre la Tierra: Lima a Cusco son unos 570 km', () => {
    expect(distanciaSuperficieKm(-12.05, -77.04, -13.53, -71.97)).toBeCloseTo(
      573,
      -1,
    );
  });
});
