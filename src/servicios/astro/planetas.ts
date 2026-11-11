import { Body, Illumination, SearchHourAngle } from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';
import {
  instantesNoche,
  posicion,
  ventanaNoche,
  type Posicion,
  type VentanaNoche,
} from './noche';
import { observador } from './observador';

export const ALTURA_MINIMA = 10;
export const SOL_OSCURO = -12;

export type Planeta = 'mercurio' | 'venus' | 'marte' | 'jupiter' | 'saturno';

export type Rumbo = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SO' | 'O' | 'NO';

export const PLANETAS: readonly Planeta[] = [
  'mercurio',
  'venus',
  'marte',
  'jupiter',
  'saturno',
];

export const CUERPO: Record<Planeta, Body> = {
  mercurio: Body.Mercury,
  venus: Body.Venus,
  marte: Body.Mars,
  jupiter: Body.Jupiter,
  saturno: Body.Saturn,
};

/** Un instante de la noche con la posición del cuerpo y si se ve. */
export interface Muestra extends Posicion {
  fecha: Date;
  visible: boolean;
}

/** Todo lo que la portada necesita de un planeta para una noche. */
export interface NochePlaneta {
  planeta: Planeta;
  visible: boolean;
  aparece: Date | null;
  rumboAparece: Rumbo | null;
  ultimaVez: Date | null;
  masAlto: Date | null;
  rumboMasAlto: Rumbo | null;
  alturaMaxima: number;
  magnitud: number;
  brillo: number;
  muestras: Muestra[];
}

const RUMBOS: readonly Rumbo[] = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];

/** Azimut en grados redondeado a uno de los 8 rumbos. */
export function rumbo(azimut: number): Rumbo {
  const a = ((azimut % 360) + 360) % 360;
  return RUMBOS[Math.round(a / 45) % 8];
}

/** Magnitud traducida a puntos de brillo de 1 a 5; más negativa es más brillante. */
export function puntosBrillo(magnitud: number): number {
  if (magnitud <= -2) return 5;
  if (magnitud <= -0.5) return 4;
  if (magnitud <= 1) return 3;
  if (magnitud <= 2.5) return 2;
  return 1;
}

/** Hora de mayor altura dentro del tramo visible: el tránsito si cae dentro, si no el borde más alto. */
function momentoMasAlto(
  cuerpo: Body,
  ventana: VentanaNoche,
  ubicacion: Ubicacion,
  visibles: Muestra[],
): Date {
  const transito = SearchHourAngle(
    cuerpo,
    observador(ubicacion),
    0,
    new Date(ventana.inicio.getTime() - 12 * 3_600_000),
    1,
  ).time.date;
  const desde = visibles[0].fecha.getTime();
  const hasta = visibles[visibles.length - 1].fecha.getTime();
  const enTramo = [transito, new Date(transito.getTime() + 86_164_091)].find(
    (t) => t.getTime() >= desde && t.getTime() <= hasta,
  );
  if (enTramo) return enTramo;
  return visibles.reduce((a, b) => (b.altura > a.altura ? b : a)).fecha;
}

/**
 * Cómo se ve un planeta durante una noche, muestreando cada 10 minutos.
 * @param alturasSol altura del Sol en cada instante de la noche
 */
export function nochePlaneta(
  planeta: Planeta,
  ventana: VentanaNoche,
  instantes: Date[],
  alturasSol: number[],
  ubicacion: Ubicacion,
): NochePlaneta {
  const cuerpo = CUERPO[planeta];
  const muestras = instantes.map((fecha, i) => {
    const p = posicion(cuerpo, fecha, ubicacion);
    const visible = p.altura > ALTURA_MINIMA && alturasSol[i] < SOL_OSCURO;
    return { fecha, ...p, visible };
  });
  const visibles = muestras.filter((m) => m.visible);
  if (visibles.length === 0) {
    const magnitud = Illumination(cuerpo, ventana.inicio).mag;
    return {
      planeta,
      visible: false,
      aparece: null,
      rumboAparece: null,
      ultimaVez: null,
      masAlto: null,
      rumboMasAlto: null,
      alturaMaxima: Math.max(...muestras.map((m) => m.altura)),
      magnitud,
      brillo: puntosBrillo(magnitud),
      muestras,
    };
  }
  const masAlto = momentoMasAlto(cuerpo, ventana, ubicacion, visibles);
  const enMasAlto = posicion(cuerpo, masAlto, ubicacion);
  const magnitud = Illumination(cuerpo, masAlto).mag;
  return {
    planeta,
    visible: true,
    aparece: visibles[0].fecha,
    rumboAparece: rumbo(visibles[0].azimut),
    ultimaVez: visibles[visibles.length - 1].fecha,
    masAlto,
    rumboMasAlto: rumbo(enMasAlto.azimut),
    alturaMaxima: enMasAlto.altura,
    magnitud,
    brillo: puntosBrillo(magnitud),
    muestras,
  };
}

/** Una noche completa: la ventana, los instantes muestreados, el Sol, la Luna y los planetas. */
export interface NochePlanetas {
  ventana: VentanaNoche;
  instantes: Date[];
  sol: Posicion[];
  luna: Posicion[];
  planetas: NochePlaneta[];
}

/** Los cinco planetas a simple vista para la noche de una fecha, con el Sol y la Luna muestreados. */
export function nochePlanetas(
  fecha: Date,
  ubicacion: Ubicacion,
): NochePlanetas {
  const ventana = ventanaNoche(fecha, ubicacion.zona);
  const instantes = instantesNoche(ventana);
  const sol = instantes.map((t) => posicion(Body.Sun, t, ubicacion));
  const luna = instantes.map((t) => posicion(Body.Moon, t, ubicacion));
  const alturasSol = sol.map((p) => p.altura);
  const planetas = PLANETAS.map((p) =>
    nochePlaneta(p, ventana, instantes, alturasSol, ubicacion),
  );
  return { ventana, instantes, sol, luna, planetas };
}
