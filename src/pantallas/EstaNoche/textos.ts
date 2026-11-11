import { textos } from '../../idioma/idioma';
import type { FaseLuna } from '../../servicios/astro/luna';

const ES = {
  fase: {
    nueva: 'Luna nueva',
    creciente: 'Luna creciente',
    'cuarto-creciente': 'Cuarto creciente',
    'gibosa-creciente': 'Gibosa creciente',
    llena: 'Luna llena',
    'gibosa-menguante': 'Gibosa menguante',
    'cuarto-menguante': 'Cuarto menguante',
    menguante: 'Luna menguante',
  } as Record<FaseLuna, string>,
  nueva:
    'Está entre la Tierra y el Sol, así que casi no se ve. Es la mejor noche del mes para buscar estrellas.',
  llena:
    'Toda la cara que vemos recibe luz del Sol. Sale al atardecer y acompaña toda la noche.',
  creciendo: (sur: boolean) =>
    `Se ilumina por la ${sur ? 'izquierda' : 'derecha'} porque estás en el hemisferio ${sur ? 'sur' : 'norte'}. Cada noche sale unos 50 minutos más tarde.`,
  menguando: (sur: boolean) =>
    `Ahora se ilumina por la ${sur ? 'derecha' : 'izquierda'}. Cada noche sale más tarde, hasta salir de madrugada.`,
  hoy: 'Hoy',
  manana: (dia: string) => `Mañana, ${dia}`,
  enDias: (n: number, dia: string) => `En ${n} días, ${dia}`,
};

const EN: typeof ES = {
  fase: {
    nueva: 'New Moon',
    creciente: 'Waxing crescent',
    'cuarto-creciente': 'First quarter',
    'gibosa-creciente': 'Waxing gibbous',
    llena: 'Full Moon',
    'gibosa-menguante': 'Waning gibbous',
    'cuarto-menguante': 'Last quarter',
    menguante: 'Waning crescent',
  },
  nueva:
    'It sits between the Earth and the Sun, so you can barely see it. The best night of the month to look for stars.',
  llena:
    'The whole face we see is lit by the Sun. It rises at sunset and stays up all night.',
  creciendo: (sur) =>
    `It is lit on the ${sur ? 'left' : 'right'} because you are in the ${sur ? 'southern' : 'northern'} hemisphere. Each night it rises about 50 minutes later.`,
  menguando: (sur) =>
    `Now it is lit on the ${sur ? 'right' : 'left'}. Each night it rises later, until it rises before dawn.`,
  hoy: 'Today',
  manana: (dia) => `Tomorrow, ${dia}`,
  enDias: (n, dia) => `In ${n} days, ${dia}`,
};

/** Nombre de una fase de la Luna. */
export function nombreFase(fase: FaseLuna): string {
  return textos({ es: ES, en: EN }).fase[fase];
}

/** Explicación corta de lo que se ve, según la fase y el hemisferio. */
export function notaFase(fase: FaseLuna, hemisferioSur: boolean): string {
  const t = textos({ es: ES, en: EN });
  if (fase === 'nueva') return t.nueva;
  if (fase === 'llena') return t.llena;
  if (fase.endsWith('creciente')) return t.creciendo(hemisferioSur);
  return t.menguando(hemisferioSur);
}

/** Texto del deslizador: Hoy, Mañana o En N días. */
export function textoCuando(dias: number, diaCorto: string): string {
  const t = textos({ es: ES, en: EN });
  if (dias === 0) return t.hoy;
  if (dias === 1) return t.manana(diaCorto);
  return t.enDias(dias, diaCorto);
}
