import { Body, Illumination } from 'astronomy-engine';
import type { CuerpoMapa } from '../../3d/escenaMapa';
import { direccionDe } from '../../servicios/astro/cielo';
import { posicion } from '../../servicios/astro/noche';
import { CUERPO, PLANETAS } from '../../servicios/astro/planetas';
import type { Ubicacion } from '../../tipos/ubicacion';
import { nombreAstro, nombrePlaneta } from '../../idioma/comunes';
import { PISTA_PLANETA } from '../EstaNoche/textosPlanetas';

/** Un cuerpo del sistema solar en el mapa, con lo que su ficha necesita. */
export interface CuerpoConDatos extends CuerpoMapa {
  tipo: 'Sol' | 'Luna' | 'Planeta';
  magnitud: number;
  altura: number;
  azimut: number;
}

const FIJOS: readonly {
  clave: 'sol' | 'luna';
  cuerpo: Body;
  tipo: 'Sol' | 'Luna';
  color: string;
  tamano: number;
}[] = [
  {
    clave: 'sol',
    cuerpo: Body.Sun,
    tipo: 'Sol',
    color: '#ffd27a',
    tamano: 18,
  },
  {
    clave: 'luna',
    cuerpo: Body.Moon,
    tipo: 'Luna',
    color: '#f3ead2',
    tamano: 16,
  },
];

/** Tamaño del punto de un planeta según su brillo. */
export function tamanoPlaneta(magnitud: number): number {
  return Math.max(6, Math.min(12, 9 - magnitud * 1.2));
}

/** Sol, Luna y los cinco planetas a simple vista en el marco del mapa para un instante. */
export function cuerposEn(fecha: Date, ubicacion: Ubicacion): CuerpoConDatos[] {
  const fijos = FIJOS.map((f) => {
    const p = posicion(f.cuerpo, fecha, ubicacion);
    return {
      clave: f.clave,
      nombre: nombreAstro(f.clave),
      tipo: f.tipo,
      color: f.color,
      tamano: f.tamano,
      magnitud: Illumination(f.cuerpo, fecha).mag,
      ...p,
      direccion: direccionDe(p.altura, p.azimut),
    };
  });
  const planetas = PLANETAS.map((planeta) => {
    const p = posicion(CUERPO[planeta], fecha, ubicacion);
    const magnitud = Illumination(CUERPO[planeta], fecha).mag;
    return {
      clave: planeta,
      nombre: nombrePlaneta(planeta),
      tipo: 'Planeta' as const,
      color: PISTA_PLANETA[planeta],
      tamano: tamanoPlaneta(magnitud),
      magnitud,
      ...p,
      direccion: direccionDe(p.altura, p.azimut),
    };
  });
  return [...fijos, ...planetas];
}
