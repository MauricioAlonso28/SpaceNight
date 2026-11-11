import {
  aplicar,
  horizontalDe,
  matrizCielo,
  vectorEcuatorial,
  type Vec3,
} from '../../servicios/astro/cielo';
import type { Ubicacion } from '../../tipos/ubicacion';
import { cuerposEn } from '../Mapa/cuerpos';
import type { DatosMapa } from '../Mapa/datosMapa';

export const MAG_ETIQUETA = 1.6;
export const ALTURA_MINIMA = -5;

/** Algo con nombre que se puede rotular sobre la imagen de la cámara. */
export interface ObjetoCamara {
  clave: string;
  nombre: string;
  clase: 'cuerpo' | 'estrella' | 'constelacion';
  direccion: Vec3;
  altura: number;
}

/**
 * Sol, Luna, planetas, estrellas brillantes con nombre y constelaciones, ya situados en el cielo local.
 * Deja fuera lo que está más de 5° bajo el horizonte.
 */
export function objetosCamara(
  fecha: Date,
  ubicacion: Ubicacion,
  datos: DatosMapa | null,
): ObjetoCamara[] {
  const lista: ObjetoCamara[] = cuerposEn(fecha, ubicacion).map((c) => ({
    clave: c.clave,
    nombre: c.nombre,
    clase: 'cuerpo',
    direccion: c.direccion,
    altura: c.altura,
  }));
  if (datos) {
    const m = matrizCielo(fecha, ubicacion);
    const fijo = (
      clave: string,
      nombre: string,
      clase: ObjetoCamara['clase'],
      ar: number,
      dec: number,
    ) => {
      const direccion = aplicar(m, vectorEcuatorial(ar, dec));
      lista.push({
        clave,
        nombre,
        clase,
        direccion,
        altura: horizontalDe(direccion).altura,
      });
    };
    for (const [ar, dec, mag, , nombre] of datos.estrellas) {
      if (mag < MAG_ETIQUETA && nombre)
        fijo(`estrella-${nombre}`, nombre, 'estrella', ar, dec);
    }
    for (const c of datos.constelaciones) {
      fijo(`constelacion-${c.id}`, c.nombre, 'constelacion', ...c.centro);
    }
  }
  return lista.filter((o) => o.altura > ALTURA_MINIMA);
}

/** Objeto que se guía por defecto: la Luna si está arriba; si no, el cuerpo más alto. */
export function objetivoInicial(lista: ObjetoCamara[]): string | null {
  const luna = lista.find((o) => o.clave === 'luna' && o.altura > 0);
  if (luna) return luna.clave;
  const cuerpos = lista
    .filter((o) => o.clase === 'cuerpo' && o.clave !== 'sol' && o.altura > 0)
    .sort((a, b) => b.altura - a.altura);
  return cuerpos[0]?.clave ?? lista[0]?.clave ?? null;
}
