import { describe, expect, it } from 'vitest';
import {
  simularAscenso,
  simularRegreso,
  tiempoMision,
} from '../src/servicios/cohete/vuelo';

const hito = (hitos: { id: string; t: number }[], id: string) =>
  hitos.find((h) => h.id === id)?.t;

describe('simulador de ascenso', () => {
  const a = simularAscenso(15_000, 'barcaza');

  it('con 15 t y la etapa a la barcaza llega a una órbita baja', () => {
    expect(a.enOrbita).toBe(true);
    expect(a.perigeo).toBeGreaterThan(160_000);
    expect(a.apogeo).toBeLessThan(400_000);
  });

  it('los hitos caen donde en un Falcon 9 real', () => {
    expect(hito(a.hitos, 'maxq')).toBeGreaterThan(45);
    expect(hito(a.hitos, 'maxq')).toBeLessThan(85);
    expect(hito(a.hitos, 'meco')).toBeGreaterThan(130);
    expect(hito(a.hitos, 'meco')).toBeLessThan(170);
    expect(hito(a.hitos, 'seco')).toBeGreaterThan(420);
    expect(hito(a.hitos, 'seco')).toBeLessThan(560);
  });

  it('separa las etapas a unos 60-80 km y 7000-9500 km/h', () => {
    const sep = a.muestras.find((m) => m.etapa === 2)!;
    expect(sep.altura / 1000).toBeGreaterThan(55);
    expect(sep.altura / 1000).toBeLessThan(85);
    expect(sep.velocidad * 3.6).toBeGreaterThan(7_000);
    expect(sep.velocidad * 3.6).toBeLessThan(9_500);
  });

  it('la presión del aire nunca pasa de 40 kPa y la aceleración de 6 g', () => {
    expect(Math.max(...a.muestras.map((m) => m.presion))).toBeLessThan(40_000);
    expect(Math.max(...a.muestras.map((m) => m.aceleracion))).toBeLessThan(6);
  });

  it('desechar la etapa deja subir más carga que recuperarla, y volver a la base menos', () => {
    expect(simularAscenso(20_000, 'ninguna').enOrbita).toBe(true);
    expect(simularAscenso(20_000, 'barcaza').enOrbita).toBe(false);
    expect(simularAscenso(8_000, 'base').enOrbita).toBe(true);
    expect(simularAscenso(14_000, 'base').enOrbita).toBe(false);
  });

  it('sin llegar, dice cuánta velocidad falta', () => {
    const b = simularAscenso(28_000, 'barcaza');
    expect(b.enOrbita).toBe(false);
    expect(b.faltaVelocidad).toBeGreaterThan(100);
    expect(hito(b.hitos, 'sin-combustible')).toBeDefined();
  });

  it('tiempo de misión', () => {
    expect(tiempoMision(142.4)).toBe('T+02:22');
    expect(tiempoMision(-3)).toBe('T+00:00');
  });
});

describe('simulador de regreso de la primera etapa', () => {
  it('en barcaza: frena, enciende para aterrizar y se posa despacio con propelente de sobra', () => {
    const a = simularAscenso(15_000, 'barcaza');
    const r = simularRegreso(a, 'barcaza');
    expect(r.toque).toBeLessThan(10);
    expect(r.sobrante).toBeGreaterThan(0);
    expect(r.distanciaFinal / 1000).toBeGreaterThan(300);
    expect(r.hitos.map((h) => h.id)).toEqual([
      'separacion',
      'reentrada',
      'fin-reentrada',
      'aterrizaje-encendido',
      'toque',
    ]);
  });

  it('de vuelta a la base: el encendido de regreso la trae cerca del punto de despegue', () => {
    const a = simularAscenso(5_000, 'base');
    const r = simularRegreso(a, 'base');
    expect(r.toque).toBeLessThan(10);
    expect(Math.abs(r.distanciaFinal) / 1000).toBeLessThan(25);
    expect(r.hitos.map((h) => h.id)).toContain('regreso');
  });

  it('el empuje solo aparece en los encendidos', () => {
    const r = simularRegreso(simularAscenso(15_000, 'barcaza'), 'barcaza');
    const entre = (a: number, b: number) =>
      r.muestras.filter((m) => m.t > a && m.t < b);
    const t = (id: string) => r.hitos.find((h) => h.id === id)!.t;
    expect(
      entre(t('separacion') + 2, t('reentrada') - 2).every(
        (m) => m.empuje === 0,
      ),
    ).toBe(true);
    expect(
      entre(t('reentrada') + 1, t('fin-reentrada') - 1).every(
        (m) => m.empuje > 0,
      ),
    ).toBe(true);
  });
});
