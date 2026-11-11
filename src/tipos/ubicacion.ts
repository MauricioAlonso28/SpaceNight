/** Lugar desde el que se observa el cielo. */
export interface Ubicacion {
  nombre: string;
  latitud: number;
  longitud: number;
  altura: number;
  zona: string;
  bortle: number;
}

/** Nombre guardado cuando la ubicación viene del GPS; se traduce al mostrarlo. */
export const NOMBRE_GPS = 'Tu ubicación';

/** Bortle supuesto cuando la ubicación viene del GPS y no se conoce su cielo. */
export const BORTLE_ESTIMADO = 7;

/** Ubicación por defecto: centro de Lima, 150 m sobre el nivel del mar, cielo urbano (Bortle 8). */
export const LIMA: Ubicacion = {
  nombre: 'Lima',
  latitud: -12.05,
  longitud: -77.04,
  altura: 150,
  zona: 'America/Lima',
  bortle: 8,
};
