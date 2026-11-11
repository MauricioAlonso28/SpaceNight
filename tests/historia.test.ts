import { describe, expect, it } from 'vitest';
import { RUTAS_COHETE } from '../src/app/rutas';
import { HITOS } from '../src/servicios/cohete/historia';

describe('historia del cohete', () => {
  it('los hitos van en orden y sin ids repetidos', () => {
    const anios = HITOS.map((h) => h.anio);
    expect(anios).toEqual([...anios].sort((a, b) => a - b));
    expect(new Set(HITOS.map((h) => h.id)).size).toBe(HITOS.length);
  });

  it('cada enlace lleva a una vista del cohete que existe', () => {
    const rutas = new Set(RUTAS_COHETE.map((r) => r.path));
    for (const h of HITOS.filter((x) => x.ruta)) {
      expect(rutas.has(h.ruta!)).toBe(true);
    }
  });

  it('Paulet aparece antes que Goddard y Perú tiene sus propios hitos', () => {
    const anio = (id: string) => HITOS.find((h) => h.id === id)!.anio;
    expect(anio('paulet')).toBeLessThan(anio('goddard'));
    expect(HITOS.filter((h) => h.peru).length).toBeGreaterThanOrEqual(4);
  });

  it('textos en los dos idiomas', () => {
    for (const h of HITOS) {
      expect(
        h.titulo.es && h.titulo.en && h.texto.es && h.texto.en,
      ).toBeTruthy();
    }
  });
});
