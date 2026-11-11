import { Body } from 'astronomy-engine';
import { describe, expect, it } from 'vitest';
import calendarioLluvias from '../public/data/lluvias-2026-2027.json';
import planetasJson from '../public/data/planetas.json';
import mundoJson from '../public/data/mundo.json';
import tleTexto from './datos/iss-2026-11-10.tle?raw';
import { distanciaKm, segundosLuz } from '../src/servicios/astro/distancias';
import { fasesEntre, semanasDelMes } from '../src/servicios/astro/calendario';
import { leerTle, posicionISS, trazaISS } from '../src/servicios/satelites/iss';
import {
  cuerpoDe,
  lineasDelMes,
  rutaIluminada,
  tramosTraza,
} from '../src/pantallas/Explorar/datosExplorar';
import {
  textoDistancia,
  textoLuz,
  textoTamano,
} from '../src/pantallas/Explorar/textosExplorar';
import { formatearNumero } from '../src/servicios/formato';
import { LIMA } from '../src/tipos/ubicacion';
import { cercaDe, lima } from './referencia';

// Referencias: JPL Horizons (distancia geocéntrica, 11-11-2026 00:00 UTC) y
// USNO (fases de la Luna de febrero de 2027, horas UTC).
const t = new Date('2026-11-11T00:00:00Z');

describe('distancia actual a la Tierra frente a JPL Horizons', () => {
  it('Luna: 402.263 km, con menos de un 0,02 % de diferencia', () => {
    expect(Math.abs(distanciaKm(Body.Moon, t) / 402_263 - 1)).toBeLessThan(
      2e-4,
    );
  });

  it('Marte y Júpiter, con menos de un 0,02 % de diferencia', () => {
    expect(Math.abs(distanciaKm(Body.Mars, t) / 201_919_003 - 1)).toBeLessThan(
      2e-4,
    );
    expect(
      Math.abs(distanciaKm(Body.Jupiter, t) / 799_713_896 - 1),
    ).toBeLessThan(2e-4);
  });

  it('la luz de la Luna tarda algo más de un segundo', () => {
    expect(segundosLuz(402_263)).toBeCloseTo(1.342, 2);
  });
});

describe('fichas', () => {
  it('cada ficha del JSON tiene su cuerpo y todos los datos', () => {
    for (const c of planetasJson.cuerpos) {
      expect(cuerpoDe(c.clave)).toBeTruthy();
      expect(c.diametroKm).toBeGreaterThan(0);
      for (const k of ['dia', 'anio', 'lunas', 'dato'] as const)
        expect(c[k].length).toBeGreaterThan(2);
    }
    expect(planetasJson.cuerpos.map((c) => c.clave)).toEqual([
      'sol',
      'luna',
      'mercurio',
      'venus',
      'marte',
      'jupiter',
      'saturno',
    ]);
  });

  it('textos con punto de miles y coma decimal', () => {
    expect(formatearNumero(4879)).toBe('4.879');
    expect(textoDistancia(402_263)).toBe('402.263 km');
    expect(textoDistancia(201_919_003)).toBe('202 millones de km (1,35 UA)');
    expect(textoDistancia(799_713_896)).toBe('800 millones de km (5,35 UA)');
    expect(textoLuz(1.342)).toBe('1,3 segundos');
    expect(textoLuz(499)).toBe('8 minutos');
    expect(textoLuz(2668)).toBe('44 minutos');
    expect(textoLuz(4500)).toBe('1 hora y 15 minutos');
    expect(textoTamano(1_392_700)).toBe('109 veces la Tierra');
    expect(textoTamano(12_104)).toBe('casi como la Tierra');
    expect(textoTamano(3_474)).toBe('27 % del tamaño de la Tierra');
  });
});

describe('calendario de febrero de 2027', () => {
  it('fases principales frente a USNO, con menos de 2 minutos', () => {
    const fases = fasesEntre(lima(2027, 2, 1), lima(2027, 3, 1));
    expect(fases.map((f) => f.cuarto)).toEqual([
      'nueva',
      'cuarto-creciente',
      'llena',
      'cuarto-menguante',
    ]);
    const usno = [
      '2027-02-06T15:56Z',
      '2027-02-14T07:58Z',
      '2027-02-20T23:23Z',
      '2027-02-28T05:16Z',
    ];
    fases.forEach((f, i) => cercaDe(f.fecha, new Date(usno[i])));
  });

  it('las fases, las lluvias y los eclipses salen en orden de fecha', () => {
    const lineas = lineasDelMes(2027, 2, LIMA, calendarioLluvias.lluvias);
    const titulos = lineas.map((l) => l.titulo);
    expect(titulos).toEqual([
      'Eclipse parcial de Sol (2 % tapado)',
      'Luna nueva',
      'Pico de las Alfa Centáuridas',
      'Cuarto creciente',
      'Eclipse penumbral de Luna (se ve en parte)',
      'Luna llena',
      'Cuarto menguante',
    ]);
    const ms = lineas.map((l) => l.fecha.getTime());
    expect(ms).toEqual([...ms].sort((a, b) => a - b));
  });

  it('febrero de 2027 empieza en lunes y ocupa justo cuatro semanas', () => {
    const semanas = semanasDelMes(2027, 2, LIMA.zona);
    expect(semanas).toHaveLength(4);
    expect(semanas[0][0]).toMatchObject({ dia: 1, delMes: true });
    expect(semanas[3][6]).toMatchObject({ dia: 28, delMes: true });
  });

  it('noviembre de 2026 rellena con días de octubre y diciembre', () => {
    const semanas = semanasDelMes(2026, 11, LIMA.zona);
    expect(semanas[0][0]).toMatchObject({ dia: 26, delMes: false });
    expect(semanas.at(-1)!.at(-1)).toMatchObject({ dia: 6, delMes: false });
  });
});

describe('Estación Espacial sobre el mapa', () => {
  const tle = leerTle(tleTexto);

  it('vuela a unos 420 km y no pasa de 52° de latitud geodésica (inclinación 51,6° geocéntrica)', () => {
    for (const p of trazaISS(tle, lima(2026, 11, 11, 4, 40), 90)) {
      expect(p.alturaKm).toBeGreaterThan(380);
      expect(p.alturaKm).toBeLessThan(450);
      expect(Math.abs(p.latitud)).toBeLessThanOrEqual(52);
    }
  });

  it('durante el paso del 11 de noviembre a las 03:51 está cerca de Lima', () => {
    const p = posicionISS(tle, lima(2026, 11, 11, 3, 52))!;
    const d = Math.hypot(p.latitud - LIMA.latitud, p.longitud - LIMA.longitud);
    expect(d).toBeLessThan(25);
  });

  it('la traza se corta al cruzar el antimeridiano', () => {
    const puntos = [170, 179, -179, -170].map((longitud, i) => ({
      fecha: new Date(i),
      latitud: 0,
      longitud,
      alturaKm: 420,
    }));
    expect(tramosTraza(puntos)).toHaveLength(2);
  });

  it('el mapa del mundo es un trazado equirrectangular de 360 × 180', () => {
    expect(mundoJson.trazado.startsWith('M')).toBe(true);
    const numeros = mundoJson.trazado.match(/-?[\d.]+/g)!.map(Number);
    expect(Math.min(...numeros)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...numeros)).toBeLessThanOrEqual(360);
  });
});

describe('icono de la fase', () => {
  const fraccion = (ruta: string) => {
    const [, borde, rx, terminador] =
      /A10 10 0 0 (\d) 12 22 A([\d.]+) 10 0 0 (\d) 12 2 Z/
        .exec(ruta)!
        .map(Number);
    const mitad = 0.5;
    const elipse = (rx / 10) * 0.5;
    return borde === terminador ? mitad + elipse : mitad - elipse;
  };

  it('luna nueva casi sin luz y luna llena entera', () => {
    expect(fraccion(rutaIluminada(5, true))).toBeLessThan(0.01);
    expect(fraccion(rutaIluminada(180, true))).toBeCloseTo(1, 2);
  });

  it('creciente fina, cuarto a la mitad y gibosa casi llena', () => {
    expect(fraccion(rutaIluminada(30, false))).toBeCloseTo(0.067, 2);
    expect(fraccion(rutaIluminada(90, false))).toBeCloseTo(0.5, 2);
    expect(fraccion(rutaIluminada(150, false))).toBeCloseTo(0.933, 2);
  });

  it('en el sur la creciente se ilumina por la izquierda y en el norte por la derecha', () => {
    expect(rutaIluminada(45, true)).toMatch(/^M12 2 A10 10 0 0 0 /);
    expect(rutaIluminada(45, false)).toMatch(/^M12 2 A10 10 0 0 1 /);
    expect(rutaIluminada(300, true)).toMatch(/^M12 2 A10 10 0 0 1 /);
  });
});
