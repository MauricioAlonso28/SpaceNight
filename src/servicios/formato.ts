import { idioma, textos } from '../idioma/idioma';

const cache = new Map<string, Intl.DateTimeFormat>();

function formateador(
  clave: string,
  opciones: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const llave = `${idioma()}|${clave}`;
  let f = cache.get(llave);
  if (!f) {
    f = new Intl.DateTimeFormat(textos({ es: 'es-PE', en: 'en-US' }), opciones);
    cache.set(llave, f);
  }
  return f;
}

const numeros = new Map<string, Intl.NumberFormat>();

function formatoNumero(minimo: number, maximo: number): Intl.NumberFormat {
  const llave = `${idioma()}|${minimo}|${maximo}`;
  let f = numeros.get(llave);
  if (!f) {
    f = new Intl.NumberFormat(textos({ es: 'es', en: 'en-US' }), {
      minimumFractionDigits: minimo,
      maximumFractionDigits: maximo,
      useGrouping: 'always',
    });
    numeros.set(llave, f);
  }
  return f;
}

/**
 * Número con separador de miles: 402.263 o 1,5 en español, 402,263 o 1.5 en inglés.
 * @param decimales cuántos decimales como máximo
 */
export function formatearNumero(n: number, decimales = 0): string {
  return formatoNumero(0, decimales).format(n);
}

/**
 * Número con decimales fijos y signo menos tipográfico, sin «−0,0»: −1,5 o 2,0.
 * @param decimales cuántos decimales siempre
 */
export function formatearDecimal(n: number, decimales = 1): string {
  const factor = 10 ** decimales;
  const redondeado = Math.round(n * factor) / factor || 0;
  return formatoNumero(decimales, decimales)
    .format(redondeado)
    .replace('-', '−');
}

/** Hora local como 21:05, o 9:05 p. m. / 9:05 PM según el ajuste. */
export function formatearHora(
  fecha: Date,
  zona: string,
  formato24h: boolean,
): string {
  return formateador(`hora|${zona}|${formato24h}`, {
    timeZone: zona,
    hour: formato24h ? '2-digit' : 'numeric',
    minute: '2-digit',
    hourCycle: formato24h ? 'h23' : 'h12',
  }).format(fecha);
}

/** Fecha larga como «martes 10 de noviembre» o «Tuesday, November 10». */
export function formatearFechaLarga(fecha: Date, zona: string): string {
  const texto = formateador(`larga|${zona}`, {
    timeZone: zona,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fecha);
  return idioma() === 'es' ? texto.replace(',', '') : texto;
}

/** Día y mes como «17 de noviembre» o «November 17». */
export function formatearDiaMes(fecha: Date, zona: string): string {
  return formateador(`diames|${zona}`, {
    timeZone: zona,
    day: 'numeric',
    month: 'long',
  }).format(fecha);
}

/** Día de la semana y del mes como «jueves 12» o «Thursday, Nov 12». */
export function formatearDiaSemana(fecha: Date, zona: string): string {
  if (idioma() === 'en') {
    return formateador(`semana|${zona}`, {
      timeZone: zona,
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    }).format(fecha);
  }
  return formateador(`semana|${zona}`, {
    timeZone: zona,
    weekday: 'long',
    day: 'numeric',
  })
    .format(fecha)
    .replace(',', '');
}

/** Fecha corta como «24 nov» o «Nov 24». */
export function formatearDiaCorto(fecha: Date, zona: string): string {
  return formateador(`corta|${zona}`, {
    timeZone: zona,
    day: 'numeric',
    month: 'short',
  })
    .format(fecha)
    .replace('.', '');
}
