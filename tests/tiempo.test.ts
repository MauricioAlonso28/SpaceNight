import { describe, expect, it } from 'vitest';
import {
  desfaseMinutos,
  inicioDelDia,
  medianocheLocal,
  partesEnZona,
} from '../src/servicios/tiempo';

describe('tiempo por zona horaria', () => {
  it('a las 22:00 de Lima ya es el día siguiente en UTC, pero el día local manda', () => {
    const fecha = new Date('2026-11-10T03:00:00Z');
    expect(partesEnZona(fecha, 'America/Lima')).toMatchObject({
      anio: 2026,
      mes: 11,
      dia: 9,
      hora: 22,
    });
    expect(inicioDelDia(fecha, 'America/Lima').toISOString()).toBe(
      '2026-11-09T05:00:00.000Z',
    );
  });

  it('Lima va 5 horas por detrás de UTC todo el año', () => {
    expect(
      desfaseMinutos(new Date('2026-01-15T12:00:00Z'), 'America/Lima'),
    ).toBe(-300);
    expect(
      desfaseMinutos(new Date('2026-07-15T12:00:00Z'), 'America/Lima'),
    ).toBe(-300);
  });

  it('respeta el cambio de hora de zonas con horario de verano', () => {
    expect(medianocheLocal(2026, 3, 29, 'Europe/Madrid').toISOString()).toBe(
      '2026-03-28T23:00:00.000Z',
    );
    expect(medianocheLocal(2026, 3, 30, 'Europe/Madrid').toISOString()).toBe(
      '2026-03-29T22:00:00.000Z',
    );
  });
});
