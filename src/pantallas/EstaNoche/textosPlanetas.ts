import { rumboLargo } from '../../idioma/comunes';
import { idioma, textos } from '../../idioma/idioma';
import type { NochePlaneta, Planeta } from '../../servicios/astro/planetas';
import { formatearHora } from '../../servicios/formato';
import { partesEnZona } from '../../servicios/tiempo';

const MINUTOS_RATO = 30;

export const PISTA_PLANETA: Record<Planeta, string> = {
  mercurio: '#c9c2b8',
  venus: '#f3e6c4',
  marte: '#e27a55',
  jupiter: '#e3b98b',
  saturno: '#ead59f',
};

const ES = {
  nota: {
    mercurio: 'Bajo y cerca del Sol: búscalo con el horizonte despejado',
    venus: 'El punto más brillante del cielo después de la Luna',
    marte: 'Se reconoce por su tono rojizo',
    jupiter: 'Con binoculares se ven sus cuatro lunas grandes',
    saturno: 'Con binoculares se intuyen los anillos',
  } as Record<Planeta, string>,
  desde: (r: string, h: string) => `Por ${r} desde ${h}`,
  rato: (r: string, h: string) => `Solo un rato por ${r}, hacia ${h}`,
  muyBajo: 'Muy bajo: busca un horizonte despejado',
  bajando: (h: string) => `Se ve hasta ${h}, cada vez más bajo`,
  subiendo: (h: string) => `Sigue subiendo hasta ${h}`,
  masAlto: (h: string, r: string) => `Más alto a ${h}, hacia ${r}`,
};

const EN: typeof ES = {
  nota: {
    mercurio: 'Low and close to the Sun: look for it with a clear horizon',
    venus: 'The brightest point in the sky after the Moon',
    marte: 'You can tell it by its reddish tint',
    jupiter: 'Binoculars show its four large moons',
    saturno: 'Binoculars hint at the rings',
  },
  desde: (r, h) => `In ${r} from ${h}`,
  rato: (r, h) => `Only briefly in ${r}, around ${h}`,
  muyBajo: 'Very low: find a clear horizon',
  bajando: (h) => `Visible until ${h}, sinking lower`,
  subiendo: (h) => `Keeps rising until ${h}`,
  masAlto: (h, r) => `Highest at ${h}, toward ${r}`,
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

/** Hora lista para ir tras una preposición: «las 21:00» en español, «9:00 PM» en inglés. */
export function horaConArticulo(
  fecha: Date,
  zona: string,
  formato24h: boolean,
): string {
  const hora = formatearHora(fecha, zona, formato24h);
  if (idioma() === 'en') return hora;
  return `${articuloHora(fecha, zona, formato24h)} ${hora}`;
}

/** Nota corta de cómo reconocer cada planeta. */
export function notaPlaneta(p: Planeta): string {
  return textos({ es: ES, en: EN }).nota[p];
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
  const t = textos({ es: ES, en: EN });
  const a = (f: Date) => horaConArticulo(f, zona, formato24h);
  const aparece = p.aparece!;
  const masAlto = p.masAlto!;
  const ultima = p.ultimaVez!;
  const lado = rumboLargo(p.rumboAparece!);
  const lineas = [t.desde(lado, a(aparece))];
  if (ultima.getTime() - aparece.getTime() < MINUTOS_RATO * 60_000) {
    lineas[0] = t.rato(lado, a(aparece));
    lineas.push(t.muyBajo);
  } else if (masAlto.getTime() <= aparece.getTime()) {
    lineas.push(t.bajando(a(ultima)));
  } else if (masAlto.getTime() >= ultima.getTime()) {
    lineas.push(t.subiendo(a(ultima)));
  } else {
    lineas.push(t.masAlto(a(masAlto), rumboLargo(p.rumboMasAlto!)));
  }
  lineas.push(t.nota[p.planeta]);
  return lineas;
}
