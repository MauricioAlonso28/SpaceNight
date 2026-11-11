import { describe, expect, it } from 'vitest';
import catalogoJson from '../public/data/cohete.json';
import { CONSULTA_ESCRITORIO } from '../src/app/escritorio';
import type { CatalogoCohete } from '../src/pantallas/Cohete/catalogo';

const catalogo = catalogoJson as CatalogoCohete;
const { zonas, componentes } = catalogo;

describe('catálogo del cohete', () => {
  it('tiene los 30 componentes cerrados en la fase 0', () => {
    expect(componentes).toHaveLength(30);
  });

  it('26 son piezas con malla y 4 son materiales', () => {
    expect(componentes.filter((c) => c.tipo === 'pieza')).toHaveLength(26);
    expect(componentes.filter((c) => c.tipo === 'material')).toHaveLength(4);
  });

  it('los ids no se repiten', () => {
    const ids = componentes.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('cada componente está en una zona que existe', () => {
    const idsZona = new Set(zonas.map((z) => z.id));
    for (const c of componentes) expect(idsZona.has(c.zona)).toBe(true);
  });

  it('el recorrido va de 1 a 30 y sigue el orden de las zonas', () => {
    const orden = [...componentes].sort((a, b) => a.recorrido - b.recorrido);
    expect(orden.map((c) => c.recorrido)).toEqual(
      Array.from({ length: 30 }, (_, i) => i + 1),
    );
    const puestoZona = (id: string) => zonas.findIndex((z) => z.id === id);
    const zonasEnOrden = orden.map((c) => puestoZona(c.zona));
    expect(zonasEnOrden).toEqual([...zonasEnOrden].sort((a, b) => a - b));
  });

  it('los materiales no son interiores ni piezas sueltas', () => {
    for (const c of componentes.filter((c) => c.zona === 'materiales')) {
      expect(c.tipo).toBe('material');
      expect(c.interior).toBe(false);
    }
  });

  it('cada nombre y resumen está en español e inglés', () => {
    for (const c of componentes) {
      for (const texto of [c.nombre, c.resumen]) {
        expect(texto.es.trim()).not.toBe('');
        expect(texto.en.trim()).not.toBe('');
      }
    }
    for (const z of zonas) {
      expect(z.nombre.es.trim()).not.toBe('');
      expect(z.nombre.en.trim()).not.toBe('');
    }
  });
});

describe('escritorio', () => {
  it('pide al menos 1024 px y un puntero fino', () => {
    expect(CONSULTA_ESCRITORIO).toBe('(min-width: 1024px) and (pointer: fine)');
  });
});
