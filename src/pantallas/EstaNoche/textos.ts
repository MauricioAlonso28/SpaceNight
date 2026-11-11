import type { FaseLuna } from '../../servicios/astro/luna';

export const NOMBRE_FASE: Record<FaseLuna, string> = {
  nueva: 'Luna nueva',
  creciente: 'Luna creciente',
  'cuarto-creciente': 'Cuarto creciente',
  'gibosa-creciente': 'Gibosa creciente',
  llena: 'Luna llena',
  'gibosa-menguante': 'Gibosa menguante',
  'cuarto-menguante': 'Cuarto menguante',
  menguante: 'Luna menguante',
};

/** Explicación corta de lo que se ve, según la fase y el hemisferio. */
export function notaFase(fase: FaseLuna, hemisferioSur: boolean): string {
  const hemisferio = hemisferioSur ? 'sur' : 'norte';
  const creciendo = hemisferioSur ? 'izquierda' : 'derecha';
  const menguando = hemisferioSur ? 'derecha' : 'izquierda';
  if (fase === 'nueva') {
    return 'Está entre la Tierra y el Sol, así que casi no se ve. Es la mejor noche del mes para buscar estrellas.';
  }
  if (fase === 'llena') {
    return 'Toda la cara que vemos recibe luz del Sol. Sale al atardecer y acompaña toda la noche.';
  }
  if (fase.endsWith('creciente')) {
    return `Se ilumina por la ${creciendo} porque estás en el hemisferio ${hemisferio}. Cada noche sale unos 50 minutos más tarde.`;
  }
  return `Ahora se ilumina por la ${menguando}. Cada noche sale más tarde, hasta salir de madrugada.`;
}

/** Texto del deslizador: Hoy, Mañana o En N días. */
export function textoCuando(dias: number, diaCorto: string): string {
  if (dias === 0) return 'Hoy';
  if (dias === 1) return `Mañana, ${diaCorto}`;
  return `En ${dias} días, ${diaCorto}`;
}
