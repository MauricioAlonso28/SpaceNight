import { describe, expect, it } from 'vitest';
import {
  DURACION_DESPIECE,
  TIEMPOS,
  anguloCorto,
  fases,
} from '../src/3d/cohete/despiece';
import {
  SITUACION_INICIAL,
  transicion,
  type Situacion,
} from '../src/3d/cohete/estados';

describe('máquina de estados del cohete', () => {
  it('abre una pieza desde la vista general y vuelve a ella', () => {
    const pieza = transicion(SITUACION_INICIAL, 'abrirPieza')!;
    expect(pieza.estado).toBe('pieza');
    const volviendo = transicion(pieza, 'volver')!;
    expect(volviendo.estado).toBe('volviendo');
    expect(transicion(volviendo, 'finVuelta')!.estado).toBe('general');
  });

  it('una pieza abierta desde el recorrido vuelve al recorrido', () => {
    const recorrido = transicion(SITUACION_INICIAL, 'iniciarRecorrido')!;
    const pieza = transicion(recorrido, 'abrirPieza')!;
    const volviendo = transicion(pieza, 'volver')!;
    expect(transicion(volviendo, 'finVuelta')!.estado).toBe('recorrido');
  });

  it('ignora lo que pisaría una animación en curso', () => {
    const pieza: Situacion = { estado: 'pieza', previo: 'general' };
    const volviendo: Situacion = { estado: 'volviendo', previo: 'general' };
    expect(transicion(pieza, 'abrirPieza')).toBeNull();
    expect(transicion(pieza, 'iniciarRecorrido')).toBeNull();
    expect(transicion(volviendo, 'abrirPieza')).toBeNull();
    expect(transicion(volviendo, 'volver')).toBeNull();
    expect(transicion(SITUACION_INICIAL, 'volver')).toBeNull();
    expect(transicion(SITUACION_INICIAL, 'salirRecorrido')).toBeNull();
  });
});

describe('animación de despiece', () => {
  it('dura menos de un segundo', () => {
    expect(DURACION_DESPIECE).toBeLessThan(1);
    expect(DURACION_DESPIECE).toBeGreaterThan(0.6);
  });

  it('los cuatro pasos van en orden: resalte, extracción y aparte, al centro', () => {
    const inicio = fases(0);
    expect(inicio).toEqual({ resalte: 0, extraccion: 0, alCentro: 0 });
    const trasResalte = fases(TIEMPOS.resalte);
    expect(trasResalte.resalte).toBe(1);
    expect(trasResalte.extraccion).toBe(0);
    const trasExtraccion = fases(TIEMPOS.resalte + TIEMPOS.extraccion);
    expect(trasExtraccion.extraccion).toBe(1);
    expect(trasExtraccion.alCentro).toBe(0);
    expect(fases(DURACION_DESPIECE)).toEqual({
      resalte: 1,
      extraccion: 1,
      alCentro: 1,
    });
  });

  it('al volver, la pieza gira lo menos posible', () => {
    expect(anguloCorto(0)).toBe(0);
    expect(anguloCorto(Math.PI * 2 + 0.5)).toBeCloseTo(0.5);
    expect(anguloCorto(Math.PI * 1.5)).toBeCloseTo(-Math.PI / 2);
    expect(Math.abs(anguloCorto(123.4))).toBeLessThanOrEqual(Math.PI);
  });
});
