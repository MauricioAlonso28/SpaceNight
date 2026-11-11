import { Body, Equator, Horizon } from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';
import { inicioDelDia, partesEnZona, sumarDias } from '../tiempo';
import { observador } from './observador';

export const HORA_INICIO_NOCHE = 18;
export const HORAS_NOCHE = 12;
export const PASO_MINUTOS = 10;

/** Tramo de 18:00 a 06:00 que cubre la línea de la noche. */
export interface VentanaNoche {
  inicio: Date;
  fin: Date;
}

/** Altura y azimut de un cuerpo en grados, con refracción. */
export interface Posicion {
  altura: number;
  azimut: number;
}

/**
 * La noche a la que pertenece un instante: de madrugada sigue siendo la de la víspera.
 * @param fecha cualquier instante del día o de la noche
 */
export function ventanaNoche(fecha: Date, zona: string): VentanaNoche {
  const p = partesEnZona(fecha, zona);
  const dia = p.hora < 6 ? sumarDias(fecha, -1) : fecha;
  const medianoche = inicioDelDia(dia, zona);
  const inicio = new Date(medianoche.getTime() + HORA_INICIO_NOCHE * 3_600_000);
  return {
    inicio,
    fin: new Date(inicio.getTime() + HORAS_NOCHE * 3_600_000),
  };
}

/** Instantes de la ventana cada 10 minutos, incluidos el inicio y el fin. */
export function instantesNoche(ventana: VentanaNoche): Date[] {
  const paso = PASO_MINUTOS * 60_000;
  const lista: Date[] = [];
  for (
    let t = ventana.inicio.getTime();
    t <= ventana.fin.getTime();
    t += paso
  ) {
    lista.push(new Date(t));
  }
  return lista;
}

/** Dónde se ve un cuerpo del sistema solar desde la ubicación en un instante. */
export function posicion(
  cuerpo: Body,
  fecha: Date,
  ubicacion: Ubicacion,
): Posicion {
  const obs = observador(ubicacion);
  const eq = Equator(cuerpo, fecha, obs, true, true);
  const hor = Horizon(fecha, obs, eq.ra, eq.dec, 'normal');
  return { altura: hor.altitude, azimut: hor.azimuth };
}

/** Fracción de la ventana (0 a 1) en la que cae un instante. */
export function fraccionVentana(fecha: Date, ventana: VentanaNoche): number {
  const total = ventana.fin.getTime() - ventana.inicio.getTime();
  return (fecha.getTime() - ventana.inicio.getTime()) / total;
}

/**
 * Tramos continuos en los que se cumple una condición, como inicio y fin.
 * @param cumple una marca por instante, en el mismo orden que los instantes
 */
export function tramos(
  instantes: Date[],
  cumple: boolean[],
): { desde: Date; hasta: Date }[] {
  const lista: { desde: Date; hasta: Date }[] = [];
  let desde: Date | null = null;
  instantes.forEach((t, i) => {
    if (cumple[i] && !desde) desde = t;
    const termina = !cumple[i] || i === instantes.length - 1;
    if (desde && termina) {
      lista.push({ desde, hasta: cumple[i] ? t : instantes[i - 1] });
      desde = null;
    }
  });
  return lista;
}
