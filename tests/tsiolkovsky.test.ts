import { describe, expect, it } from 'vitest';
import {
  MODELOS,
  altoEtapa,
  calcularCohete,
  destinosAlcanzados,
  diametroCohete,
} from '../src/servicios/cohete/tsiolkovsky';

const modelo = (id: string) => MODELOS.find((m) => m.id === id)!;

describe('arma tu cohete', () => {
  it('la ecuación de Tsiolkovsky en una etapa: Δv = Isp·g0·ln(m0/mf)', () => {
    const c = calcularCohete(
      [{ combustible: 'solido', propelente: 100, motores: 1 }],
      0,
    );
    const seca = 100 * 0.12;
    expect(c.etapas[0].dv).toBeCloseTo(
      265 * 9.80665 * Math.log((seca + 100) / seca),
      6,
    );
  });

  it('cada etapa carga con lo que va encima', () => {
    const c = calcularCohete(modelo('falcon').etapas, 15);
    expect(c.etapas[0].final).toBeCloseTo(
      c.etapas[1].inicial + c.etapas[0].seca,
      6,
    );
    expect(c.masa).toBeCloseTo(c.etapas[0].inicial, 6);
  });

  it('el tipo Falcon 9 llega a órbita baja y no más lejos; una sola etapa no llega', () => {
    const f = calcularCohete(modelo('falcon').etapas, 15);
    expect(destinosAlcanzados(f.dv, f.despega)).toEqual(['leo']);
    const u = calcularCohete(modelo('una').etapas, 5);
    expect(destinosAlcanzados(u.dv, u.despega)).toEqual([]);
  });

  it('con tres etapas e hidrógeno arriba llega a la Luna', () => {
    const c = calcularCohete(modelo('luna').etapas, 20);
    expect(destinosAlcanzados(c.dv, c.despega)).toContain('luna');
  });

  it('sin empuje suficiente no despega aunque el Δv alcance', () => {
    const c = calcularCohete(
      [
        { combustible: 'queroseno', propelente: 396, motores: 4 },
        { combustible: 'queroseno', propelente: 93, motores: 1 },
      ],
      1,
    );
    expect(c.despega).toBe(false);
    expect(destinosAlcanzados(c.dv, c.despega)).toEqual([]);
  });

  it('más carga, menos Δv', () => {
    const a = calcularCohete(modelo('falcon').etapas, 5).dv;
    const b = calcularCohete(modelo('falcon').etapas, 20).dv;
    expect(a).toBeGreaterThan(b);
  });

  it('el hidrógeno, poco denso, hace etapas más altas con la misma masa', () => {
    const d = 4;
    expect(
      altoEtapa({ combustible: 'hidrogeno', propelente: 100, motores: 1 }, d),
    ).toBeGreaterThan(
      altoEtapa({ combustible: 'queroseno', propelente: 100, motores: 1 }, d),
    );
    expect(diametroCohete(modelo('falcon').etapas)).toBeGreaterThan(3);
  });
});
