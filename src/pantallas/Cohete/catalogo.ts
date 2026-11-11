import type { Idioma } from '../../idioma/idioma';

/** Texto con su versión en cada idioma. */
export type Traducido = Record<Idioma, string>;

/** Un tramo del cohete, de la punta a los motores, más los materiales. */
export interface ZonaCohete {
  id: string;
  nombre: Traducido;
}

/**
 * Un componente del cohete genérico, tal como viene en public/data/cohete.json.
 * @property tipo pieza si tiene malla 3D, material si solo tiene ficha
 * @property interior si solo se ve con la vista de corte
 * @property recorrido su puesto en el recorrido con scroll, de 1 en adelante
 */
export interface ComponenteCohete {
  id: string;
  zona: string;
  tipo: 'pieza' | 'material';
  interior: boolean;
  recorrido: number;
  nombre: Traducido;
  resumen: Traducido;
}

/** El catálogo entero: zonas en orden y componentes. */
export interface CatalogoCohete {
  zonas: ZonaCohete[];
  componentes: ComponenteCohete[];
}

/** Archivo del catálogo dentro de public/data. */
export const ARCHIVO_CATALOGO = 'cohete.json';
