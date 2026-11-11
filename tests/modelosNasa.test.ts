/// <reference types="node" />
import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MODELOS_NASA,
  tamanoLegible,
} from '../src/pantallas/Cohete/modelosNasa';

const ruta = (archivo: string) =>
  new URL(`../public/modelos/${archivo}`, import.meta.url);

describe('modelos reales de la NASA', () => {
  it('hay al menos 3 modelos', () => {
    expect(MODELOS_NASA.length).toBeGreaterThanOrEqual(3);
  });

  for (const m of MODELOS_NASA) {
    it(`${m.id}: el archivo existe, es glTF binario y pesa lo que se avisa`, () => {
      const cabecera = readFileSync(ruta(m.archivo)).subarray(0, 4);
      expect(cabecera.toString('latin1')).toBe('glTF');
      expect(statSync(ruta(m.archivo)).size).toBe(m.bytes);
    });

    it(`${m.id}: cita a la NASA y su página`, () => {
      expect(m.credito).toMatch(/^NASA/);
      expect(m.pagina).toMatch(/^https:\/\/science\.nasa\.gov\/3d-resources\//);
    });
  }

  it('muestra el tamaño de la descarga en MB con la coma de cada idioma', () => {
    expect(tamanoLegible(2471932, 'es')).toBe('2,5 MB');
    expect(tamanoLegible(2471932, 'en')).toBe('2.5 MB');
  });
});
