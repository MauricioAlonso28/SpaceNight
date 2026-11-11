import type { Idioma } from '../../idioma/idioma';

/** Texto con su versión en cada idioma. */
export type Traducido = Record<Idioma, string>;

/** Un tramo del cohete, de la punta a los motores, más los materiales. */
export interface ZonaCohete {
  id: string;
  nombre: Traducido;
}

/** Una cifra de la ficha: qué mide y cuánto, con su unidad. */
export interface DatoFicha {
  etiqueta: Traducido;
  valor: Traducido;
}

/** Una fuente consultada para escribir la ficha. */
export interface FuenteFicha {
  titulo: string;
  url: string;
}

/**
 * La ficha de un componente: seis campos fijos y sus fuentes.
 * @property enCohetes ejemplos de cohetes reales que la usan
 */
export interface FichaComponente {
  paraQue: Traducido;
  comoFunciona: Traducido;
  material: Traducido;
  datos: DatoFicha[];
  otrosUsos: Traducido;
  enCohetes: Traducido;
  fuentes: FuenteFicha[];
}

/**
 * Un componente del cohete genérico, tal como viene en public/data/cohete.json.
 * @property tipo pieza si tiene malla 3D, material si solo tiene ficha
 * @property interior si solo se ve con la vista de corte
 * @property recorrido su puesto en el recorrido con scroll, de 1 en adelante
 * @property usadoEn solo en materiales: las piezas hechas de él; 'casco' son los cascos de aluminio
 * @property ficha los seis campos; falta mientras no esté escrita
 */
export interface ComponenteCohete {
  id: string;
  zona: string;
  tipo: 'pieza' | 'material';
  interior: boolean;
  recorrido: number;
  nombre: Traducido;
  resumen: Traducido;
  usadoEn?: string[];
  ficha?: FichaComponente;
}

/** Los componentes en el orden del recorrido, de la punta a los motores y luego los materiales. */
export function enOrdenDeRecorrido(
  componentes: ComponenteCohete[],
): ComponenteCohete[] {
  return [...componentes].sort((a, b) => a.recorrido - b.recorrido);
}

/** El catálogo entero: zonas en orden y componentes. */
export interface CatalogoCohete {
  zonas: ZonaCohete[];
  componentes: ComponenteCohete[];
}

/** Archivo del catálogo dentro de public/data. */
export const ARCHIVO_CATALOGO = 'cohete.json';
