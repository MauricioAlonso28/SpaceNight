import { Body } from 'astronomy-engine';
import { fasesEntre } from '../../servicios/astro/calendario';
import { eventosEntre } from '../../servicios/astro/eventos';
import { CUERPO, type Planeta } from '../../servicios/astro/planetas';
import type { PuntoOrbita } from '../../servicios/satelites/iss';
import { medianocheLocal } from '../../servicios/tiempo';
import type { Ubicacion } from '../../tipos/ubicacion';
import { NOMBRE_CUARTO, tituloCalendario } from './textosExplorar';

/** Una ficha del JSON de planetas, redactada a mano. */
export interface FichaCuerpo {
  clave: string;
  nombre: string;
  tipo: string;
  diametroKm: number;
  dia: string;
  anio: string;
  lunas: string;
  dato: string;
}

/** Cuerpo de Astronomy Engine para cada clave del JSON. */
export function cuerpoDe(clave: string): Body {
  if (clave === 'sol') return Body.Sun;
  if (clave === 'luna') return Body.Moon;
  return CUERPO[clave as Planeta];
}

/** Una línea del calendario: cuándo y qué. */
export interface LineaCalendario {
  fecha: Date;
  titulo: string;
  fase: boolean;
}

/**
 * Fases principales y eventos del mes en orden de fecha.
 * @param mes de 1 a 12
 */
export function lineasDelMes(
  anio: number,
  mes: number,
  ubicacion: Ubicacion,
  lluvias: Parameters<typeof eventosEntre>[3],
): LineaCalendario[] {
  const desde = medianocheLocal(anio, mes, 1, ubicacion.zona);
  const hasta = medianocheLocal(
    mes === 12 ? anio + 1 : anio,
    (mes % 12) + 1,
    1,
    ubicacion.zona,
  );
  return [
    ...fasesEntre(desde, hasta).map((f) => ({
      fecha: f.fecha,
      titulo: NOMBRE_CUARTO[f.cuarto],
      fase: true,
    })),
    ...eventosEntre(desde, hasta, ubicacion, lluvias).map((e) => ({
      fecha: e.fecha,
      titulo: tituloCalendario(e),
      fase: false,
    })),
  ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

/**
 * Tramos de la traza en coordenadas del mapa, cortados donde cruzan el antimeridiano.
 * @param puntos la órbita minuto a minuto
 */
export function tramosTraza(puntos: PuntoOrbita[]): string[] {
  const tramos: string[] = [];
  let actual: string[] = [];
  puntos.forEach((p, i) => {
    const salto = i > 0 && Math.abs(p.longitud - puntos[i - 1].longitud) > 180;
    if (salto && actual.length) {
      tramos.push(actual.join(' '));
      actual = [];
    }
    actual.push(
      `${(p.longitud + 180).toFixed(1)},${(90 - p.latitud).toFixed(1)}`,
    );
  });
  if (actual.length) tramos.push(actual.join(' '));
  return tramos;
}

/**
 * Trazado SVG (caja de 24) de la parte iluminada de la Luna: medio disco del lado iluminado y el terminador como media elipse.
 * En el sur la Luna creciente se ilumina por la izquierda.
 * @param angulo ángulo de fase en grados, 0 nueva y 180 llena
 */
export function rutaIluminada(angulo: number, hemisferioSur: boolean): string {
  const a = ((angulo % 360) + 360) % 360;
  const rx = Math.round(Math.abs(Math.cos((a * Math.PI) / 180)) * 100) / 10;
  const derecha = a < 180 !== hemisferioSur;
  const gibosa = a > 90 && a < 270;
  const borde = derecha ? 1 : 0;
  const terminador = gibosa ? borde : 1 - borde;
  return `M12 2 A10 10 0 0 ${borde} 12 22 A${rx} 10 0 0 ${terminador} 12 2 Z`;
}
