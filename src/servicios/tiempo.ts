export const MS_DIA = 86_400_000;

/** Año, mes, día, hora y minuto de una fecha vista en una zona horaria. */
export interface PartesFecha {
  anio: number;
  mes: number;
  dia: number;
  hora: number;
  minuto: number;
}

const formateadores = new Map<string, Intl.DateTimeFormat>();

function formateadorPartes(zona: string): Intl.DateTimeFormat {
  let f = formateadores.get(zona);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: zona,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    });
    formateadores.set(zona, f);
  }
  return f;
}

function partesCrudas(fecha: Date, zona: string): Record<string, number> {
  const p: Record<string, number> = {};
  for (const parte of formateadorPartes(zona).formatToParts(fecha)) {
    if (parte.type !== 'literal') p[parte.type] = Number(parte.value);
  }
  return p;
}

/** Partes de la fecha según el reloj local de la zona. */
export function partesEnZona(fecha: Date, zona: string): PartesFecha {
  const p = partesCrudas(fecha, zona);
  return {
    anio: p.year,
    mes: p.month,
    dia: p.day,
    hora: p.hour,
    minuto: p.minute,
  };
}

/** Minutos que la hora local de la zona va por delante de UTC en esa fecha. */
export function desfaseMinutos(fecha: Date, zona: string): number {
  const p = partesCrudas(fecha, zona);
  const comoUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return Math.round((comoUtc - fecha.getTime()) / 60_000);
}

/** Medianoche local (00:00 en la zona) del día al que pertenece la fecha. */
export function inicioDelDia(fecha: Date, zona: string): Date {
  const p = partesEnZona(fecha, zona);
  const medianocheUtc = Date.UTC(p.anio, p.mes - 1, p.dia);
  const aprox = new Date(medianocheUtc - desfaseMinutos(fecha, zona) * 60_000);
  return new Date(medianocheUtc - desfaseMinutos(aprox, zona) * 60_000);
}

/** La misma fecha desplazada un número entero de días. */
export function sumarDias(fecha: Date, dias: number): Date {
  return new Date(fecha.getTime() + dias * MS_DIA);
}

/** Medianoche local de una fecha escrita como año, mes y día. */
export function medianocheLocal(
  anio: number,
  mes: number,
  dia: number,
  zona: string,
): Date {
  return inicioDelDia(new Date(Date.UTC(anio, mes - 1, dia, 12)), zona);
}
