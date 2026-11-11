import { expect } from 'vitest';

/** Instante de una hora local de Lima (UTC-5 todo el año). */
export function lima(
  anio: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
): Date {
  return new Date(Date.UTC(anio, mes - 1, dia, hora + 5, minuto));
}

/** Comprueba que una fecha calculada cae a menos de unos minutos de la referencia. */
export function cercaDe(
  calculada: Date | null,
  esperada: Date,
  margenMinutos = 2,
): void {
  expect(calculada).not.toBeNull();
  const diferencia =
    Math.abs(calculada!.getTime() - esperada.getTime()) / 60_000;
  expect(diferencia).toBeLessThanOrEqual(margenMinutos);
}
