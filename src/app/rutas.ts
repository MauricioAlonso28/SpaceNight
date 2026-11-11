/** Una pantalla de la app: ruta bajo el hash y nombre visible. */
export interface Ruta {
  path: string;
  nombre: string;
}

export const RUTA_INICIAL = 'esta-noche';

/** Las cuatro pantallas de la barra inferior, en su orden. */
export const RUTAS_BARRA: readonly Ruta[] = [
  { path: 'esta-noche', nombre: 'Esta noche' },
  { path: 'mapa', nombre: 'Mapa' },
  { path: 'camara', nombre: 'Cámara' },
  { path: 'explorar', nombre: 'Explorar' },
];

/** Ajustes, que se abre desde la cabecera. */
export const RUTA_AJUSTES: Ruta = { path: 'ajustes', nombre: 'Ajustes' };
