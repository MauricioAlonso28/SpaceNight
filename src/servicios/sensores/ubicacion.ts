import { BORTLE_ESTIMADO, type Ubicacion } from '../../tipos/ubicacion';

/** Pide la posición al navegador; devuelve null si no hay permiso o falla. */
export function pedirUbicacion(): Promise<Ubicacion | null> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve(null);
  }
  return new Promise((resolver) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolver({
          nombre: 'Tu ubicación',
          latitud: pos.coords.latitude,
          longitud: pos.coords.longitude,
          altura: pos.coords.altitude ?? 0,
          zona: Intl.DateTimeFormat().resolvedOptions().timeZone,
          bortle: BORTLE_ESTIMADO,
        }),
      () => resolver(null),
      { maximumAge: 3_600_000, timeout: 15_000 },
    );
  });
}
