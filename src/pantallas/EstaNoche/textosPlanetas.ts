import type {
  NochePlaneta,
  Planeta,
  Rumbo,
} from '../../servicios/astro/planetas';
import { formatearHora } from '../../servicios/formato';
import { partesEnZona } from '../../servicios/tiempo';

const MINUTOS_RATO = 30;

export const NOMBRE_PLANETA: Record<Planeta, string> = {
  mercurio: 'Mercurio',
  venus: 'Venus',
  marte: 'Marte',
  jupiter: 'Júpiter',
  saturno: 'Saturno',
};

export const RUMBO_LARGO: Record<Rumbo, string> = {
  N: 'el norte',
  NE: 'el noreste',
  E: 'el este',
  SE: 'el sureste',
  S: 'el sur',
  SO: 'el suroeste',
  O: 'el oeste',
  NO: 'el noroeste',
};

export const PISTA_PLANETA: Record<Planeta, string> = {
  mercurio: '#c9c2b8',
  venus: '#f3e6c4',
  marte: '#e27a55',
  jupiter: '#e3b98b',
  saturno: '#ead59f',
};

export const NOTA_PLANETA: Record<Planeta, string> = {
  mercurio: 'Bajo y cerca del Sol: búscalo con el horizonte despejado',
  venus: 'El punto más brillante del cielo después de la Luna',
  marte: 'Se reconoce por su tono rojizo',
  jupiter: 'Con binoculares se ven sus cuatro lunas grandes',
  saturno: 'Con binoculares se intuyen los anillos',
};

/**
 * «la» para la una y «las» para el resto: a la 01:30, a las 21:00.
 * @param formato24h si la hora se escribe de 0 a 23
 */
export function articuloHora(
  fecha: Date,
  zona: string,
  formato24h: boolean,
): 'la' | 'las' {
  const h = partesEnZona(fecha, zona).hora;
  const una = formato24h ? h === 1 : h % 12 === 1;
  return una ? 'la' : 'las';
}

/**
 * Textos de una tarjeta: por dónde y cuándo aparece, cuándo está más alto y una pista.
 * @param p un planeta visible esa noche
 */
export function lineasPlaneta(
  p: NochePlaneta,
  zona: string,
  formato24h: boolean,
): string[] {
  const a = (f: Date) =>
    `${articuloHora(f, zona, formato24h)} ${formatearHora(f, zona, formato24h)}`;
  const aparece = p.aparece!;
  const masAlto = p.masAlto!;
  const ultima = p.ultimaVez!;
  const lineas = [`Por ${RUMBO_LARGO[p.rumboAparece!]} desde ${a(aparece)}`];
  if (ultima.getTime() - aparece.getTime() < MINUTOS_RATO * 60_000) {
    lineas[0] = `Solo un rato por ${RUMBO_LARGO[p.rumboAparece!]}, hacia ${a(aparece)}`;
    lineas.push('Muy bajo: busca un horizonte despejado');
  } else if (masAlto.getTime() <= aparece.getTime()) {
    lineas.push(`Se ve hasta ${a(ultima)}, cada vez más bajo`);
  } else if (masAlto.getTime() >= ultima.getTime()) {
    lineas.push(`Sigue subiendo hasta ${a(ultima)}`);
  } else {
    lineas.push(
      `Más alto a ${a(masAlto)}, hacia ${RUMBO_LARGO[p.rumboMasAlto!]}`,
    );
  }
  lineas.push(NOTA_PLANETA[p.planeta]);
  return lineas;
}
