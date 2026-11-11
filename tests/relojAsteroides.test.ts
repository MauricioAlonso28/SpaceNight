import { describe, expect, it } from 'vitest';
import {
  LD_MAX,
  LD_MIN,
  anguloReloj,
  proximoAcercamiento,
  puntoReloj,
  radioReloj,
  resumenNeo,
  semanaDe,
  tamanoPunto,
} from '../src/pantallas/Nasa/relojAsteroides';
import type { Asteroide } from '../src/servicios/nasa/datos';

const a = (
  id: string,
  fecha: number,
  km: number,
  v: number,
  d: number,
): Asteroide => ({
  id,
  nombre: id,
  url: '',
  peligroso: id === 'b',
  sentry: false,
  diametroM: [d / 2, d],
  fecha,
  distanciaKm: km,
  distanciaLunar: km / 384_400,
  velocidadKms: v,
});

describe('reloj de acercamientos', () => {
  it('la escala de distancia es logarítmica y se queda dentro del reloj', () => {
    expect(radioReloj(LD_MIN, 50, 250)).toBe(50);
    expect(radioReloj(LD_MAX, 50, 250)).toBe(250);
    expect(radioReloj(1000, 50, 250)).toBe(250);
    const r1 = radioReloj(1, 0, 1);
    const r10 = radioReloj(10, 0, 1);
    const r100 = radioReloj(100, 0, 1);
    expect(r10 - r1).toBeCloseTo(r100 - r10);
  });

  it('la semana da una vuelta entera empezando arriba', () => {
    const { inicio, fin } = semanaDe('2026-11-11', '2026-11-17');
    expect(fin - inicio).toBe(7 * 86_400_000);
    expect(anguloReloj(inicio, inicio, fin)).toBe(0);
    expect(anguloReloj((inicio + fin) / 2, inicio, fin)).toBe(180);
    const arriba = puntoReloj(0, 10, 0, 0);
    expect(arriba.x).toBeCloseTo(0);
    expect(arriba.y).toBeCloseTo(-10);
    expect(puntoReloj(90, 10, 0, 0).x).toBeCloseTo(10);
  });

  it('el tamaño del punto crece con el diámetro pero tiene tope', () => {
    expect(tamanoPunto([1, 2])).toBe(3);
    expect(tamanoPunto([2000, 4000])).toBe(14);
    expect(tamanoPunto([100, 200])).toBeGreaterThan(tamanoPunto([20, 40]));
  });

  it('resume la semana y encuentra el próximo', () => {
    const lista = [
      a('a', 10, 800_000, 5, 30),
      a('b', 20, 300_000, 25, 900),
      a('c', 30, 5_000_000, 12, 80),
    ];
    const r = resumenNeo(lista);
    expect(r.total).toBe(3);
    expect(r.peligrosos).toBe(1);
    expect(r.masCercano.id).toBe('b');
    expect(r.masRapido.id).toBe('b');
    expect(r.masGrande.id).toBe('b');
    expect(proximoAcercamiento(lista, 15)?.id).toBe('b');
    expect(proximoAcercamiento(lista, 99)).toBeNull();
  });
});

describe('tamaño desde la magnitud absoluta', () => {
  it('H 22 es del orden de 100 a 250 m', async () => {
    const { diametroDesdeH } =
      await import('../src/pantallas/Nasa/relojAsteroides');
    const [a, b] = diametroDesdeH(22);
    expect(a).toBeGreaterThan(90);
    expect(a).toBeLessThan(120);
    expect(b).toBeGreaterThan(200);
    expect(b).toBeLessThan(270);
  });
});
