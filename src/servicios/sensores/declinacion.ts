import { magvar } from 'magvar';
import type { Ubicacion } from '../../tipos/ubicacion';

/**
 * Declinación magnética en grados con el World Magnetic Model 2025-2030; negativa si el norte magnético queda al oeste.
 * En Lima, unos −3,7°.
 */
export function declinacion(ubicacion: Ubicacion): number {
  return magvar(ubicacion.latitud, ubicacion.longitud, ubicacion.altura / 1000);
}
