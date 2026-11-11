import { Observer } from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';

/** Observador de Astronomy Engine para una ubicación. */
export function observador(ubicacion: Ubicacion): Observer {
  return new Observer(ubicacion.latitud, ubicacion.longitud, ubicacion.altura);
}
