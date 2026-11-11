/**
 * Descarga y recorta los datos de la NASA que el navegador no puede pedir solo (sin CORS o con clave) en public/data/nasa/.
 * Uso: NASA_API_KEY=<clave> node scripts/datos-nasa.mjs   (sin clave usa DEMO_KEY, 10 consultas por hora)
 * Lo corre GitHub Actions cada 6 horas antes de publicar; si una fuente falla, deja la copia publicada anterior.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  recortarBolidos,
  recortarExoplanetas,
  recortarNeo,
  recortarSentry,
  resumir,
} from './nasa/transformar.mjs';

const SALIDA = fileURLToPath(new URL('../public/data/nasa/', import.meta.url));
const PUBLICADO = 'https://mauricioalonso28.github.io/SpaceNight/data/nasa/';
const CLAVE = process.env.NASA_API_KEY || 'DEMO_KEY';
const DIA = 86_400_000;

const dia = (ms) => new Date(ms).toISOString().slice(0, 10);

async function pedir(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(90_000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

const ahora = Date.now();
const desde = dia(ahora);
const hasta = dia(ahora + 6 * DIA);
const consultaExoplanetas =
  'select pl_name,hostname,disc_year,discoverymethod,pl_rade,pl_orbper,pl_insol,pl_eqt,sy_dist from pscomppars';

const FUENTES = [
  {
    archivo: 'neo.json',
    url: `https://api.nasa.gov/neo/rest/v1/feed?start_date=${desde}&end_date=${hasta}&api_key=${CLAVE}`,
    recortar: (j) => ({ desde, hasta, ...recortarNeo(j) }),
  },
  {
    archivo: 'bolidos.json',
    url: 'https://ssd-api.jpl.nasa.gov/fireball.api',
    recortar: recortarBolidos,
  },
  {
    archivo: 'sentry.json',
    url: 'https://ssd-api.jpl.nasa.gov/sentry.api',
    recortar: (j) => recortarSentry(j),
  },
  {
    archivo: 'exoplanetas.json',
    url: `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?format=json&query=${encodeURIComponent(consultaExoplanetas)}`,
    recortar: recortarExoplanetas,
  },
];

mkdirSync(SALIDA, { recursive: true });
const estado = { generado: new Date(ahora).toISOString(), fuentes: {} };

for (const f of FUENTES) {
  try {
    const datos = {
      generado: estado.generado,
      ...f.recortar(await pedir(f.url)),
    };
    writeFileSync(SALIDA + f.archivo, JSON.stringify(datos));
    estado.fuentes[f.archivo] = { ok: true, generado: estado.generado };
    console.log(`${f.archivo}: listo`);
  } catch (e) {
    console.warn(`${f.archivo}: falló (${e.message}), uso la copia publicada`);
    try {
      const anterior = await pedir(PUBLICADO + f.archivo);
      writeFileSync(SALIDA + f.archivo, JSON.stringify(anterior));
      estado.fuentes[f.archivo] = { ok: false, generado: anterior.generado };
    } catch {
      estado.fuentes[f.archivo] = { ok: false, generado: null };
      console.warn(`${f.archivo}: tampoco hay copia publicada`);
    }
  }
}

const leer = (archivo) =>
  existsSync(SALIDA + archivo)
    ? JSON.parse(readFileSync(SALIDA + archivo, 'utf8'))
    : null;
const resumen = resumir(
  {
    neo: leer('neo.json'),
    bolidos: leer('bolidos.json'),
    sentry: leer('sentry.json'),
    exoplanetas: leer('exoplanetas.json'),
  },
  ahora,
);
writeFileSync(
  SALIDA + 'resumen.json',
  JSON.stringify({ generado: estado.generado, ...resumen }),
);
writeFileSync(SALIDA + 'estado.json', JSON.stringify(estado));
