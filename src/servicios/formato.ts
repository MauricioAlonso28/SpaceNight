const cache = new Map<string, Intl.DateTimeFormat>();

function formateador(
  clave: string,
  opciones: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  let f = cache.get(clave);
  if (!f) {
    f = new Intl.DateTimeFormat('es-PE', opciones);
    cache.set(clave, f);
  }
  return f;
}

/** Hora local como 21:05 o 9:05 p. m. según el ajuste. */
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

/** Fecha larga como «martes 10 de noviembre». */
export function formatearFechaLarga(fecha: Date, zona: string): string {
  return formateador(`larga|${zona}`, {
    timeZone: zona,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(fecha)
    .replace(',', '');
}

/** Día y mes como «17 de noviembre». */
export function formatearDiaMes(fecha: Date, zona: string): string {
  return formateador(`diames|${zona}`, {
    timeZone: zona,
    day: 'numeric',
    month: 'long',
  }).format(fecha);
}

/** Día de la semana y del mes como «jueves 12». */
export function formatearDiaSemana(fecha: Date, zona: string): string {
  return formateador(`semana|${zona}`, {
    timeZone: zona,
    weekday: 'long',
    day: 'numeric',
  })
    .format(fecha)
    .replace(',', '');
}

/** Fecha corta como «24 nov». */
export function formatearDiaCorto(fecha: Date, zona: string): string {
  return formateador(`corta|${zona}`, {
    timeZone: zona,
    day: 'numeric',
    month: 'short',
  })
    .format(fecha)
    .replace('.', '');
}
