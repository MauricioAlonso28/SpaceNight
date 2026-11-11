import type { Planeta, Rumbo } from '../servicios/astro/planetas';
import { NOMBRE_GPS, type Ubicacion } from '../tipos/ubicacion';
import { textos } from './idioma';

const PLANETAS: Record<'es' | 'en', Record<Planeta, string>> = {
  es: {
    mercurio: 'Mercurio',
    venus: 'Venus',
    marte: 'Marte',
    jupiter: 'Júpiter',
    saturno: 'Saturno',
  },
  en: {
    mercurio: 'Mercury',
    venus: 'Venus',
    marte: 'Mars',
    jupiter: 'Jupiter',
    saturno: 'Saturn',
  },
};

const RUMBOS: Record<'es' | 'en', Record<Rumbo, string>> = {
  es: {
    N: 'norte',
    NE: 'noreste',
    E: 'este',
    SE: 'sureste',
    S: 'sur',
    SO: 'suroeste',
    O: 'oeste',
    NO: 'noroeste',
  },
  en: {
    N: 'north',
    NE: 'northeast',
    E: 'east',
    SE: 'southeast',
    S: 'south',
    SO: 'southwest',
    O: 'west',
    NO: 'northwest',
  },
};

const RUMBOS_CORTOS: Record<'es' | 'en', Record<Rumbo, string>> = {
  es: {
    N: 'N',
    NE: 'NE',
    E: 'E',
    SE: 'SE',
    S: 'S',
    SO: 'SO',
    O: 'O',
    NO: 'NO',
  },
  en: {
    N: 'N',
    NE: 'NE',
    E: 'E',
    SE: 'SE',
    S: 'S',
    SO: 'SW',
    O: 'W',
    NO: 'NW',
  },
};

/** Nombre de un planeta en el idioma actual. */
export function nombrePlaneta(p: Planeta): string {
  return textos(PLANETAS)[p];
}

/** Rumbo sin artículo: «noreste» o «northeast». */
export function nombreRumbo(r: Rumbo): string {
  return textos(RUMBOS)[r];
}

/** Rumbo con artículo: «el noreste» o «the northeast». */
export function rumboLargo(r: Rumbo): string {
  return `${textos({ es: 'el', en: 'the' })} ${nombreRumbo(r)}`;
}

/** Rumbo abreviado: SO en español, SW en inglés. */
export function rumboCorto(r: Rumbo): string {
  return textos(RUMBOS_CORTOS)[r];
}

/** Letra del hemisferio de una latitud o longitud: N/S y E/O, o E/W en inglés. */
export function letraCoordenada(
  valor: number,
  tipo: 'latitud' | 'longitud',
): string {
  if (tipo === 'latitud') return valor < 0 ? 'S' : 'N';
  return valor < 0 ? textos({ es: 'O', en: 'W' }) : 'E';
}

/** Nombre visible de un lugar; el del GPS se traduce. */
export function nombreLugar(u: Ubicacion): string {
  if (u.nombre !== NOMBRE_GPS) return u.nombre;
  return textos({ es: 'Tu ubicación', en: 'Your location' });
}

/** Nombre del Sol o de la Luna. */
export function nombreAstro(clave: 'sol' | 'luna'): string {
  return textos({
    es: { sol: 'Sol', luna: 'Luna' },
    en: { sol: 'Sun', luna: 'Moon' },
  })[clave];
}
