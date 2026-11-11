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

/** Destino absoluto de las redirecciones; relativo se sumaría a la ruta actual sin fin. */
export const DESTINO_INICIAL = `/${RUTA_INICIAL}`;

/** Las pantallas del cielo: la barra inferior del móvil, en su orden, más el botón Más. */
export const RUTAS_BARRA: readonly Ruta[] = [
  { path: 'esta-noche', nombre: { es: 'Esta noche', en: 'Tonight' } },
  { path: 'mapa', nombre: { es: 'Mapa', en: 'Sky map' } },
  { path: 'camara', nombre: { es: 'Cámara', en: 'Camera' } },
  { path: 'explorar', nombre: { es: 'Explorar', en: 'Explore' } },
];

/** El cohete en 3D, solo para escritorio. */
export const RUTA_COHETE: Ruta = {
  path: 'cohete',
  nombre: { es: 'Cohete en 3D', en: '3D rocket' },
};

/** El resto de la sección del cohete, para cualquier pantalla. */
export const RUTAS_COHETE: readonly Ruta[] = [
  {
    path: 'cohete/lanzamientos',
    nombre: { es: 'Próximos lanzamientos', en: 'Upcoming launches' },
  },
  {
    path: 'cohete/vuelo',
    nombre: { es: 'Simulador de vuelo', en: 'Flight simulator' },
  },
];

/** Portada de NASA en vivo, con una línea viva de cada vista. */
export const RUTA_NASA: Ruta = {
  path: 'nasa',
  nombre: { es: 'Resumen en vivo', en: 'Live overview' },
};

/** Las vistas de NASA en vivo. */
export const RUTAS_NASA: readonly Ruta[] = [
  { path: 'nasa/asteroides', nombre: { es: 'Asteroides', en: 'Asteroids' } },
  { path: 'nasa/tierra', nombre: { es: 'La Tierra hoy', en: 'Earth today' } },
  { path: 'nasa/sol-luna', nombre: { es: 'Sol y Luna', en: 'Sun and Moon' } },
  {
    path: 'nasa/naves',
    nombre: { es: 'Naves lejanas', en: 'Deep-space craft' },
  },
  {
    path: 'nasa/eventos',
    nombre: { es: 'Eventos naturales', en: 'Natural events' },
  },
  {
    path: 'nasa/bolidos',
    nombre: { es: 'Bólidos e impactos', en: 'Fireballs and impacts' },
  },
  { path: 'nasa/exoplanetas', nombre: { es: 'Exoplanetas', en: 'Exoplanets' } },
  {
    path: 'nasa/archivo',
    nombre: { es: 'Archivo de imágenes', en: 'Image archive' },
  },
];

/** Un bloque del panel lateral: su título y sus pantallas. */
export interface GrupoRutas {
  id: string;
  nombre: { es: string; en: string };
  rutas: readonly Ruta[];
}

/** Todo lo que lista el panel lateral, en tres bloques. */
export const GRUPOS: readonly GrupoRutas[] = [
  { id: 'cielo', nombre: { es: 'Cielo', en: 'Sky' }, rutas: RUTAS_BARRA },
  {
    id: 'cohete',
    nombre: { es: 'Cohete', en: 'Rocket' },
    rutas: [RUTA_COHETE, ...RUTAS_COHETE],
  },
  {
    id: 'nasa',
    nombre: { es: 'NASA en vivo', en: 'NASA live' },
    rutas: [RUTA_NASA, ...RUTAS_NASA],
  },
];

/** Ajustes, que se abre desde la cabecera. */
export const RUTA_AJUSTES: Ruta = {
  path: 'ajustes',
  nombre: { es: 'Ajustes', en: 'Settings' },
};
