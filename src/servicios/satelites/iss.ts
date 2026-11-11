import {
  degreesToRadians,
  ecfToLookAngles,
  eciToEcf,
  gstime,
  jday,
  propagate,
  shadowFraction,
  sunPos,
  twoline2satrec,
  type SatRec,
} from './sgp4';
import { Body } from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';
import { posicion } from '../astro/noche';

export const ALTURA_MINIMA_PASO = 10;
export const SOL_CREPUSCULO = -6;
export const PASO_SEGUNDOS = 10;
export const HORAS_PREDICCION = 72;
const SOMBRA_MAXIMA = 0.5;
const RAD = 180 / Math.PI;

/** Las dos líneas de un TLE con su nombre. */
export interface Tle {
  nombre: string;
  linea1: string;
  linea2: string;
}

/** Un punto del paso: cuándo, a qué altura y en qué dirección. */
export interface PuntoPaso {
  fecha: Date;
  altura: number;
  azimut: number;
}

/** Un paso visible: aparece (sale de la sombra o pasa de 10°), punto más alto y desaparece. */
export interface PasoISS {
  aparece: PuntoPaso;
  maximo: PuntoPaso;
  desaparece: PuntoPaso;
}

interface Muestra extends PuntoPaso {
  iluminada: boolean;
}

/** Lee un TLE de tres líneas (nombre y dos líneas de elementos). */
export function leerTle(texto: string): Tle {
  const lineas = texto
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter(Boolean);
  const i = lineas.findIndex((l) => l.startsWith('1 '));
  if (i < 0 || !lineas[i + 1]?.startsWith('2 ')) throw new Error('TLE_INVALID');
  return {
    nombre: (lineas[i - 1] ?? 'ISS').trim(),
    linea1: lineas[i],
    linea2: lineas[i + 1],
  };
}

/** Fecha de época del TLE: año y día del año con fracción en la línea 1. */
export function epocaTle(tle: Tle): Date {
  const anio = Number(tle.linea1.slice(18, 20));
  const dia = Number(tle.linea1.slice(20, 32));
  const completo = anio < 57 ? 2000 + anio : 1900 + anio;
  return new Date(Date.UTC(completo, 0, 1) + (dia - 1) * 86_400_000);
}

function muestra(
  satrec: SatRec,
  fecha: Date,
  observador: { longitude: number; latitude: number; height: number },
): Muestra | null {
  const pv = propagate(satrec, fecha);
  if (!pv || typeof pv.position === 'boolean') return null;
  const ecf = eciToEcf(pv.position, gstime(fecha));
  const angulos = ecfToLookAngles(observador as never, ecf);
  const altura = angulos.elevation * RAD;
  const iluminada =
    altura > ALTURA_MINIMA_PASO &&
    shadowFraction(sunPos(jday(fecha)).rsun, pv.position) < SOMBRA_MAXIMA;
  return { fecha, altura, azimut: angulos.azimuth * RAD, iluminada };
}

function tramosSobreMinimo(muestras: Muestra[]): Muestra[][] {
  const tramos: Muestra[][] = [];
  let actual: Muestra[] = [];
  for (const m of muestras) {
    if (m.altura > ALTURA_MINIMA_PASO) {
      actual.push(m);
    } else if (actual.length) {
      tramos.push(actual);
      actual = [];
    }
  }
  if (actual.length) tramos.push(actual);
  return tramos;
}

function puntoDe(m: Muestra): PuntoPaso {
  return { fecha: m.fecha, altura: m.altura, azimut: m.azimut };
}

/** La parte visible de un paso: Estación iluminada y observador a oscuras. */
function parteVisible(tramo: Muestra[], ubicacion: Ubicacion): PasoISS | null {
  const visibles = tramo.filter(
    (m) =>
      m.iluminada &&
      posicion(Body.Sun, m.fecha, ubicacion).altura < SOL_CREPUSCULO,
  );
  if (visibles.length === 0) return null;
  const alto = visibles.reduce((a, b) => (b.altura > a.altura ? b : a));
  return {
    aparece: puntoDe(visibles[0]),
    maximo: puntoDe(alto),
    desaparece: puntoDe(visibles[visibles.length - 1]),
  };
}

/**
 * Pasos visibles de la Estación desde la ubicación, muestreando cada 10 segundos.
 * @param horas cuánto tiempo hacia delante se busca
 */
export function pasosVisibles(
  tle: Tle,
  ubicacion: Ubicacion,
  desde: Date,
  horas = HORAS_PREDICCION,
): PasoISS[] {
  const satrec = twoline2satrec(tle.linea1, tle.linea2);
  const observador = {
    longitude: degreesToRadians(ubicacion.longitud),
    latitude: degreesToRadians(ubicacion.latitud),
    height: ubicacion.altura / 1000,
  };
  const muestras: Muestra[] = [];
  const fin = desde.getTime() + horas * 3_600_000;
  for (let t = desde.getTime(); t <= fin; t += PASO_SEGUNDOS * 1000) {
    const m = muestra(satrec, new Date(t), observador);
    if (m) muestras.push(m);
  }
  return tramosSobreMinimo(muestras)
    .map((tramo) => parteVisible(tramo, ubicacion))
    .filter((p): p is PasoISS => p !== null);
}
