import { describe, expect, it } from 'vitest';
import { CICLOS, puntosTubo } from '../src/servicios/cohete/ciclos';

describe('ciclos de motor', () => {
  it('seis ciclos con ids únicos', () => {
    expect(CICLOS).toHaveLength(6);
    expect(new Set(CICLOS.map((c) => c.id)).size).toBe(6);
  });

  it('cada tubo une piezas que existen y cada paso señala una pieza del ciclo', () => {
    for (const c of CICLOS) {
      for (const t of c.tubos) expect(() => puntosTubo(c, t)).not.toThrow();
      const ids = new Set(c.piezas.map((p) => p.id));
      for (const p of c.pasos) expect(ids.has(p.pieza)).toBe(true);
    }
  });

  it('todo ciclo termina en la cámara y lleva oxidante hasta ella', () => {
    for (const c of CICLOS) {
      expect(c.piezas.some((p) => p.tipo === 'camara')).toBe(true);
      expect(c.tubos.some((t) => t.a === 'c')).toBe(true);
      expect(c.tubos.some((t) => t.fluido === 'oxidante')).toBe(true);
    }
  });

  it('solo el generador de gas tira gas por un escape: los cerrados lo mandan a la cámara', () => {
    const conEscape = CICLOS.filter((c) =>
      c.piezas.some((p) => p.tipo === 'escape'),
    ).map((c) => c.id);
    expect(conEscape).toEqual(['generador']);
    const etapas = CICLOS.find((c) => c.id === 'etapas')!;
    expect(
      etapas.tubos.some(
        (t) => t.de === 't' && t.a === 'c' && t.fluido === 'caliente',
      ),
    ).toBe(true);
  });

  it('el flujo completo tiene dos precámaras y dos turbinas, y la presión más alta', () => {
    const c = CICLOS.find((x) => x.id === 'completo')!;
    expect(c.piezas.filter((p) => p.tipo === 'quemador')).toHaveLength(2);
    expect(c.piezas.filter((p) => p.tipo === 'turbina')).toHaveLength(2);
    expect(c.presion).toBe(Math.max(...CICLOS.map((x) => x.presion)));
  });
});
