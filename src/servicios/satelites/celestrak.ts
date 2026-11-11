import { conCache, type ResultadoCache } from '../../cache/cache';
import { leerTle, type Tle } from './iss';

export const URL_TLE_ISS =
  'https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle';
const DOCE_HORAS = 12 * 3_600_000;

/** TLE de la Estación Espacial de CelesTrak, con 12 horas de caché. */
export function tleISS(): Promise<ResultadoCache<Tle>> {
  return conCache('tle:25544', DOCE_HORAS, async () => {
    const res = await fetch(URL_TLE_ISS);
    if (!res.ok) throw new Error(`TLE_HTTP_${res.status}`);
    return leerTle(await res.text());
  });
}
