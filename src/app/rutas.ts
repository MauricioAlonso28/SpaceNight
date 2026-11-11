import { textos } from '../idioma/idioma';

/** Una pantalla de la app: ruta bajo el hash y nombre visible en cada idioma. */
export interface Ruta {
  path: string;
  nombre: { es: string; en: string };
}

/** Nombre visible de una pantalla en el idioma actual. */
export function nombreRuta(ruta: Ruta): string {
  return textos(ruta.nombre);
}

export const RUTA_INICIAL = 'esta-noche';

/** Las cinco pantallas de la barra de navegación, en su orden. */
export const RUTAS_BARRA: readonly Ruta[] = [
  { path: 'esta-noche', nombre: { es: 'Esta noche', en: 'Tonight' } },
  { path: 'mapa', nombre: { es: 'Mapa', en: 'Sky map' } },
  { path: 'camara', nombre: { es: 'Cámara', en: 'Camera' } },
  { path: 'explorar', nombre: { es: 'Explorar', en: 'Explore' } },
  { path: 'cohete', nombre: { es: 'Cohete', en: 'Rocket' } },
];

/** Ajustes, que se abre desde la cabecera. */
export const RUTA_AJUSTES: Ruta = {
  path: 'ajustes',
  nombre: { es: 'Ajustes', en: 'Settings' },
};
