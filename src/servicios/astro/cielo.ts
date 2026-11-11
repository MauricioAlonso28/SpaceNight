import {
  Rotation_EQJ_HOR,
  RotateVector,
  Vector,
  MakeTime,
} from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';
import { observador } from './observador';

/** Vector de tres componentes. */
export type Vec3 = [number, number, number];

const RAD = Math.PI / 180;

/** Dirección unitaria en el ecuador J2000 para una ascensión recta y declinación en grados. */
export function vectorEcuatorial(ar: number, dec: number): Vec3 {
  const a = ar * RAD;
  const d = dec * RAD;
  return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
}

/**
 * Matriz 3×3 (por columnas) que lleva el cielo J2000 al marco del mapa: x al este, y al cénit, z al sur.
 * Incluye precesión y nutación hasta la fecha; no incluye refracción.
 */
export function matrizCielo(fecha: Date, ubicacion: Ubicacion): number[] {
  const rot = Rotation_EQJ_HOR(MakeTime(fecha), observador(ubicacion));
  const base: Vec3[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  return base.flatMap(([x, y, z]) => {
    const h = RotateVector(rot, new Vector(x, y, z, MakeTime(fecha)));
    return [-h.y, h.z, -h.x];
  });
}

/** Aplica una matriz por columnas a un vector. */
export function aplicar(m: number[], v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
    m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
    m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
  ];
}

/** Altura y azimut (0 = norte, 90 = este) de una dirección del marco del mapa. */
export function horizontalDe(v: Vec3): { altura: number; azimut: number } {
  const [este, arriba, sur] = v;
  const altura = Math.asin(Math.max(-1, Math.min(1, arriba))) / RAD;
  const azimut = (Math.atan2(este, -sur) / RAD + 360) % 360;
  return { altura, azimut };
}

/** Dirección del marco del mapa para una altura y un azimut en grados. */
export function direccionDe(altura: number, azimut: number): Vec3 {
  const h = altura * RAD;
  const a = azimut * RAD;
  return [Math.cos(h) * Math.sin(a), Math.sin(h), -Math.cos(h) * Math.cos(a)];
}
