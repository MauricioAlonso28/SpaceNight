import { describe, expect, it } from 'vitest';
import {
  direccionDe,
  horizontalDe,
  type Vec3,
} from '../src/servicios/astro/cielo';
import {
  alphaDesdeRumbo,
  anguloFlecha,
  basesCamara,
  errorBrujula,
  proyectar,
  separacion,
  suavizar,
} from '../src/servicios/sensores/rotacion';

function mira(alpha: number, beta: number, gamma = 0, pantalla = 0, corr = 0) {
  return basesCamara({ alpha, beta, gamma }, pantalla, corr);
}

function cerca(v: Vec3, esperado: Vec3) {
  v.forEach((c, i) => expect(c).toBeCloseTo(esperado[i], 6));
}

describe('dirección de la cámara trasera según el sensor', () => {
  it('móvil vertical mirando al norte: la cámara apunta al norte, en horizontal', () => {
    const b = mira(0, 90);
    const h = horizontalDe(b.adelante);
    expect(h.altura).toBeCloseTo(0, 6);
    expect(h.azimut).toBeCloseTo(0, 6);
    cerca(b.arriba, [0, 1, 0]);
    cerca(b.derecha, [1, 0, 0]);
  });

  it('alpha crece en sentido antihorario: alpha 90 mira al oeste', () => {
    expect(horizontalDe(mira(90, 90).adelante).azimut).toBeCloseTo(270, 6);
    expect(horizontalDe(mira(270, 90).adelante).azimut).toBeCloseTo(90, 6);
  });

  it('inclinar la parte de arriba hacia atrás (beta 120) mira 30° hacia arriba', () => {
    expect(horizontalDe(mira(0, 120).adelante).altura).toBeCloseTo(30, 6);
  });

  it('el rumbo de la brújula se pasa a alpha al revés', () => {
    expect(alphaDesdeRumbo(0)).toBe(0);
    expect(alphaDesdeRumbo(90)).toBe(270);
    const b = mira(alphaDesdeRumbo(135), 90);
    expect(horizontalDe(b.adelante).azimut).toBeCloseTo(135, 6);
  });

  it('la corrección (declinación y calibración) se suma al rumbo', () => {
    const b = mira(alphaDesdeRumbo(100), 90, 0, 0, -3.68);
    expect(horizontalDe(b.adelante).azimut).toBeCloseTo(96.32, 6);
  });

  it('en horizontal (pantalla a 90°) la derecha de la pantalla es la parte de abajo del móvil', () => {
    const b = mira(0, 0, -90, 90);
    const h = horizontalDe(b.adelante);
    expect(h.altura).toBeCloseTo(0, 6);
    cerca(b.arriba, [0, 1, 0]);
  });

  it('las tres bases son perpendiculares entre sí', () => {
    const b = mira(37, 104, -12, 0);
    const p = (a: Vec3, c: Vec3) => a[0] * c[0] + a[1] * c[1] + a[2] * c[2];
    expect(p(b.adelante, b.arriba)).toBeCloseTo(0, 9);
    expect(p(b.adelante, b.derecha)).toBeCloseTo(0, 9);
    expect(p(b.arriba, b.derecha)).toBeCloseTo(0, 9);
  });
});

describe('etiquetas en pantalla', () => {
  const ancho = 390;
  const alto = 844;

  it('apuntando directo a un objeto, su etiqueta queda en el centro', () => {
    const luna = direccionDe(25, 80);
    const b = mira(alphaDesdeRumbo(80), 90 + 25);
    const p = proyectar(luna, b, ancho, alto, 65);
    expect(p.dentro).toBe(true);
    expect(p.x).toBeCloseTo(ancho / 2, 3);
    expect(p.y).toBeCloseTo(alto / 2, 3);
  });

  it('un objeto 10° a la derecha cae a la derecha; uno detrás queda fuera', () => {
    const b = mira(0, 90);
    expect(proyectar(direccionDe(0, 10), b, ancho, alto, 65).x).toBeGreaterThan(
      ancho / 2,
    );
    const atras = proyectar(direccionDe(0, 180), b, ancho, alto, 65);
    expect(atras.delante).toBe(false);
    expect(atras.dentro).toBe(false);
  });

  it('con 65° en el lado largo, un objeto a 30° de altura entra justo en vertical', () => {
    const b = mira(0, 90);
    expect(proyectar(direccionDe(30, 0), b, ancho, alto, 65).dentro).toBe(true);
    expect(proyectar(direccionDe(35, 0), b, ancho, alto, 65).dentro).toBe(
      false,
    );
  });

  it('la flecha guía apunta hacia el objeto: derecha, arriba o izquierda', () => {
    const b = mira(0, 90);
    expect(anguloFlecha(direccionDe(0, 60), b)).toBeCloseTo(0, 6);
    expect(anguloFlecha(direccionDe(60, 0), b)).toBeCloseTo(-90, 6);
    expect(Math.abs(anguloFlecha(direccionDe(0, 300), b))).toBeCloseTo(180, 6);
  });
});

describe('suavizado y calibración', () => {
  it('cada fotograma avanza una parte hacia la nueva orientación', () => {
    const antes = mira(0, 90);
    const nueva = mira(alphaDesdeRumbo(10), 90);
    const paso = suavizar(antes, nueva, 0.2);
    const az = horizontalDe(paso.adelante).azimut;
    expect(az).toBeGreaterThan(1.5);
    expect(az).toBeLessThan(2.5);
    let b = antes;
    for (let i = 0; i < 60; i++) b = suavizar(b, nueva, 0.2);
    expect(separacion(b.adelante, nueva.adelante)).toBeLessThan(0.01);
  });

  it('al centrar la Luna, el error de la brújula es la diferencia de rumbos', () => {
    const luna = direccionDe(25, 80);
    const medido = mira(alphaDesdeRumbo(74), 90 + 25).adelante;
    expect(errorBrujula(medido, luna)).toBeCloseTo(6, 6);
    const corregido = mira(alphaDesdeRumbo(74), 90 + 25, 0, 0, 6);
    expect(separacion(corregido.adelante, luna)).toBeLessThan(1e-6);
  });

  it('el error se mide por el camino corto alrededor del norte', () => {
    expect(errorBrujula(direccionDe(0, 355), direccionDe(0, 5))).toBeCloseTo(
      10,
      6,
    );
    expect(errorBrujula(direccionDe(0, 5), direccionDe(0, 355))).toBeCloseTo(
      -10,
      6,
    );
  });
});
