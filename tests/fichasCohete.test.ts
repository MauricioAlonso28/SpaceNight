import { describe, expect, it } from 'vitest';
import catalogoJson from '../public/data/cohete.json';
import type {
  CatalogoCohete,
  Traducido,
} from '../src/pantallas/Cohete/catalogo';

const catalogo = catalogoJson as CatalogoCohete;

function lleno(texto: Traducido) {
  expect(texto.es.trim().length).toBeGreaterThan(0);
  expect(texto.en.trim().length).toBeGreaterThan(0);
}

const frases = (texto: string) =>
  texto.split(/[.!?](?:\s|$)/).filter((f) => f.trim()).length;

describe('fichas del cohete', () => {
  it('los 30 componentes tienen ficha', () => {
    expect(catalogo.componentes.every((c) => c.ficha)).toBe(true);
  });

  for (const c of catalogo.componentes) {
    describe(c.id, () => {
      const f = c.ficha!;

      it('tiene los seis campos en español e inglés', () => {
        [
          f.paraQue,
          f.comoFunciona,
          f.material,
          f.otrosUsos,
          f.enCohetes,
        ].forEach(lleno);
        f.datos.forEach((d) => {
          lleno(d.etiqueta);
          lleno(d.valor);
        });
      });

      it('respeta el largo de cada campo', () => {
        expect(frases(f.paraQue.es)).toBeLessThanOrEqual(2);
        expect(frases(f.comoFunciona.es)).toBeGreaterThanOrEqual(2);
        expect(frases(f.comoFunciona.es)).toBeLessThanOrEqual(4);
        expect(frases(f.material.es)).toBeLessThanOrEqual(2);
        expect(f.datos.length).toBeGreaterThanOrEqual(2);
        expect(f.datos.length).toBeLessThanOrEqual(4);
      });

      it('cita al menos una fuente con dirección segura', () => {
        expect(f.fuentes.length).toBeGreaterThan(0);
        for (const fuente of f.fuentes) {
          expect(fuente.titulo.trim()).not.toBe('');
          expect(fuente.url).toMatch(/^https:\/\//);
        }
      });
    });
  }
});
