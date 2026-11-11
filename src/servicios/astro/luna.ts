import {
  Body,
  Illumination,
  MoonPhase,
  SearchMoonPhase,
  SearchRiseSet,
} from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';
import { MS_DIA, inicioDelDia, sumarDias } from '../tiempo';
import { observador } from './observador';

export const MES_SINODICO = 29.530588853;

export type FaseLuna =
  | 'nueva'
  | 'creciente'
  | 'cuarto-creciente'
  | 'gibosa-creciente'
  | 'llena'
  | 'gibosa-menguante'
  | 'cuarto-menguante'
  | 'menguante';

/** Todo lo que la portada muestra de la Luna para una fecha. */
export interface DatosLuna {
  angulo: number;
  fraccion: number;
  diaCiclo: number;
  fase: FaseLuna;
  salida: Date | null;
  puesta: Date | null;
  proximaLlena: Date;
  proximaNueva: Date;
}

const LIMITES_FASE: readonly [number, FaseLuna][] = [
  [12.2, 'nueva'],
  [78, 'creciente'],
  [102.4, 'cuarto-creciente'],
  [168.2, 'gibosa-creciente'],
  [192.6, 'llena'],
  [257.2, 'gibosa-menguante'],
  [281.6, 'cuarto-menguante'],
  [347.4, 'menguante'],
];

/**
 * Nombre de la fase para un ángulo de fase; cada fase principal dura un día a cada lado.
 * @param angulo grados de 0 a 360, 0 es luna nueva y 180 llena
 */
export function faseDesdeAngulo(angulo: number): FaseLuna {
  const a = ((angulo % 360) + 360) % 360;
  const limite = LIMITES_FASE.find(([hasta]) => a < hasta);
  return limite ? limite[1] : 'nueva';
}

/**
 * Primer instante en que la Luna cruza el horizonte durante el día local de la fecha.
 * @param direccion +1 para la salida, -1 para la puesta
 */
export function cruceLunaEnDia(
  fecha: Date,
  ubicacion: Ubicacion,
  direccion: 1 | -1,
): Date | null {
  const inicio = inicioDelDia(fecha, ubicacion.zona);
  const fin = inicioDelDia(sumarDias(inicio, 1.5), ubicacion.zona);
  const dias = (fin.getTime() - inicio.getTime()) / MS_DIA;
  const cruce = SearchRiseSet(
    Body.Moon,
    observador(ubicacion),
    direccion,
    inicio,
    dias,
  );
  return cruce ? cruce.date : null;
}

/** Salida de la Luna en el día local y la puesta que la sigue, aunque caiga al día siguiente. */
export function pasoLuna(
  fecha: Date,
  ubicacion: Ubicacion,
): { salida: Date | null; puesta: Date | null } {
  const salida = cruceLunaEnDia(fecha, ubicacion, 1);
  if (!salida) return { salida, puesta: cruceLunaEnDia(fecha, ubicacion, -1) };
  const puesta = SearchRiseSet(
    Body.Moon,
    observador(ubicacion),
    -1,
    salida,
    1.5,
  );
  return { salida, puesta: puesta ? puesta.date : null };
}

/** Fecha de la siguiente luna llena (180°) o nueva (0°) desde un instante. */
export function proximaFase(fecha: Date, angulo: 0 | 180): Date {
  const t = SearchMoonPhase(angulo, fecha, 40);
  if (!t) throw new Error('MOON_PHASE_NOT_FOUND');
  return t.date;
}

/** Fase, iluminación, el paso de la Luna por el cielo ese día y las próximas fases. */
export function datosLuna(fecha: Date, ubicacion: Ubicacion): DatosLuna {
  const angulo = MoonPhase(fecha);
  return {
    angulo,
    fraccion: Illumination(Body.Moon, fecha).phase_fraction,
    diaCiclo: (angulo / 360) * MES_SINODICO,
    fase: faseDesdeAngulo(angulo),
    ...pasoLuna(fecha, ubicacion),
    proximaLlena: proximaFase(inicioDelDia(fecha, ubicacion.zona), 180),
    proximaNueva: proximaFase(inicioDelDia(fecha, ubicacion.zona), 0),
  };
}

/** Fracción iluminada de la Luna en un instante, de 0 a 1. */
export function fraccionIluminada(fecha: Date): number {
  return Illumination(Body.Moon, fecha).phase_fraction;
}
