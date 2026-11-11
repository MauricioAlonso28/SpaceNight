/** Lugar desde el que se observa el cielo. */
export interface Ubicacion {
  nombre: string;
  latitud: number;
  longitud: number;
  altura: number;
  zona: string;
}

/** Ubicación por defecto: centro de Lima, 150 m sobre el nivel del mar. */
export const LIMA: Ubicacion = {
  nombre: 'Lima',
  latitud: -12.05,
  longitud: -77.04,
  altura: 150,
  zona: 'America/Lima',
};
