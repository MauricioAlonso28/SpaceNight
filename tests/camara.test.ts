import { describe, expect, it } from 'vitest';
import estrellasJson from '../public/data/estrellas.json';
import constelacionesJson from '../public/data/constelaciones.json';
import { migrarEstado } from '../src/estado/store';
import type {
  Constelacion,
  FilaEstrella,
} from '../src/servicios/astro/estrellas';
import { declinacion } from '../src/servicios/sensores/declinacion';
import {
  alphaDesdeRumbo,
  basesCamara,
  proyectar,
  separacion,
} from '../src/servicios/sensores/rotacion';
import {
  objetivoInicial,
  objetosCamara,
} from '../src/pantallas/Camara/objetosCamara';
import { FOV_LADO_LARGO } from '../src/pantallas/Camara/Visor';
import { horizontalDe } from '../src/servicios/astro/cielo';
import { LIMA } from '../src/tipos/ubicacion';
import { lima } from './referencia';

const datos = {
  estrellas: estrellasJson.estrellas as FilaEstrella[],
  constelaciones: constelacionesJson.constelaciones as Constelacion[],
};

describe('declinación magnética', () => {
  it('en Lima el norte magnético queda unos 3,7° al oeste (WMM2025, igual que la librería geomagnetism)', () => {
    expect(declinacion(LIMA)).toBeGreaterThan(-4.5);
    expect(declinacion(LIMA)).toBeLessThan(-3);
  });
});

describe('objetos del modo cámara', () => {
  const noche = lima(2026, 11, 17, 20);
  const lista = objetosCamara(noche, LIMA, datos);

  it('incluye la Luna, planetas, estrellas brillantes con nombre y constelaciones', () => {
    const clases = new Set(lista.map((o) => o.clase));
    expect(clases).toEqual(new Set(['cuerpo', 'estrella', 'constelacion']));
    expect(lista.some((o) => o.clave === 'saturno')).toBe(true);
    expect(
      lista.some((o) => o.nombre === 'Sirius' || o.nombre === 'Canopus'),
    ).toBe(true);
  });

  it('deja fuera lo que está muy por debajo del horizonte', () => {
    expect(lista.every((o) => o.altura > -5)).toBe(true);
  });

  it('por defecto guía hacia la Luna cuando está arriba', () => {
    const luna = lista.find((o) => o.clave === 'luna')!;
    expect(luna.altura).toBeGreaterThan(0);
    expect(objetivoInicial(lista)).toBe('luna');
  });

  it('apuntando el móvil a la Luna con la brújula corregida, su etiqueta queda en el centro', () => {
    const luna = lista.find((o) => o.clave === 'luna')!;
    const { altura, azimut } = horizontalDe(luna.direccion);
    const decl = declinacion(LIMA);
    const rumboMagnetico = azimut - decl;
    const b = basesCamara(
      { alpha: alphaDesdeRumbo(rumboMagnetico), beta: 90 + altura, gamma: 0 },
      0,
      decl,
    );
    expect(separacion(b.adelante, luna.direccion)).toBeLessThan(0.01);
    const p = proyectar(luna.direccion, b, 390, 844, FOV_LADO_LARGO);
    expect(p.dentro).toBe(true);
    expect(Math.hypot(p.x - 195, p.y - 422)).toBeLessThan(1);
  });
});

describe('estado guardado', () => {
  it('la v2 no tenía calibración: se añade en 0 sin perder los otros ajustes', () => {
    const s = migrarEstado(
      { ajustes: { formato24h: false, modoRojo: true } },
      2,
    ) as {
      ajustes: Record<string, unknown>;
    };
    expect(s.ajustes).toEqual({
      formato24h: false,
      modoRojo: true,
      calibracionBrujula: 0,
      idioma: 'auto',
    });
  });
});
