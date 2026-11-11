/**
 * Descarga y recorta los datos de la NASA que el navegador no puede pedir solo (sin CORS o con clave) en public/data/nasa/.
 * Uso: npm run datos:nasa, con NASA_API_KEY en .env.local o en el entorno (sin clave usa DEMO_KEY, 10 consultas por hora)
 * Lo corre GitHub Actions cada 6 horas antes de publicar; si una fuente falla, deja la copia publicada anterior.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  baseLuna,
  leerHorizons,
  recortarApod,
  recortarBolidos,
  recortarCad,
  recortarScout,
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

/** Naves de la vista Naves lejanas: su código en JPL Horizons. */
const NAVES = ['-31', '-32', '-98', '-96', '-170', '-159', '-255', '-49'];

/** Distancia y velocidad de alejamiento de una nave vistas desde un centro (la Tierra 500@399 o el Sol 500@10). */
async function horizons(nave, centro) {
  const q = new URLSearchParams({
    format: 'json',
    COMMAND: `'${nave}'`,
    MAKE_EPHEM: 'YES',
    EPHEM_TYPE: 'OBSERVER',
    CENTER: `'${centro}'`,
    START_TIME: `'${new Date(ahora).toISOString().slice(0, 16).replace('T', ' ')}'`,
    STOP_TIME: `'${new Date(ahora + 3_600_000).toISOString().slice(0, 16).replace('T', ' ')}'`,
    STEP_SIZE: "'1h'",
    QUANTITIES: "'20'",
    OBJ_DATA: 'NO',
  });
  const j = await pedir(`https://ssd.jpl.nasa.gov/api/horizons.api?${q}`);
  return leerHorizons(j.result ?? '');
}

/** Las naves que respondan, con su distancia a la Tierra y al Sol en el momento de la descarga. */
async function naves() {
  const lista = [];
  for (const id of NAVES) {
    try {
      const tierra = await horizons(id, '500@399');
      const sol = await horizons(id, '500@10');
      if (tierra && sol) lista.push({ id, tierra, sol });
    } catch (e) {
      console.warn(`Horizons ${id}: ${e.message}`);
    }
  }
  if (!lista.length) throw new Error('ninguna nave');
  return { t0: ahora, naves: lista };
}

/** Rutas de las imágenes horarias de la Luna del año actual y del siguiente, si ya están publicadas. */
async function luna() {
  const anios = {};
  const actual = new Date(ahora).getUTCFullYear();
  for (const anio of [actual, actual + 1]) {
    try {
      const base = baseLuna(
        await pedir(
          `https://svs.gsfc.nasa.gov/api/dialamoon/${anio}-01-01T00:00`,
        ),
      );
      if (base && base.base !== anios[anio - 1]?.base) anios[anio] = base;
    } catch {
      continue;
    }
  }
  if (!anios[actual]) throw new Error('sin año actual');
  return { anios };
}

/** La foto del día de la NASA: prueba hoy y, si la API falla, los tres días anteriores. */
async function apod() {
  let ultimo;
  for (let i = 0; i < 4; i++) {
    try {
      return await pedir(
        `https://api.nasa.gov/planetary/apod?thumbs=true&date=${dia(ahora - i * DIA)}&api_key=${CLAVE}`,
      );
    } catch (e) {
      ultimo = e;
    }
  }
  throw ultimo;
}

const FUENTES = [
  {
    archivo: 'cercanos60.json',
    url: 'https://ssd-api.jpl.nasa.gov/cad.api?date-min=now&date-max=%2B60&dist-max=10LD&fullname=true',
    recortar: recortarCad,
  },
  {
    archivo: 'scout.json',
    url: 'https://ssd-api.jpl.nasa.gov/scout.api',
    recortar: recortarScout,
  },
  { archivo: 'apod.json', obtener: apod, recortar: recortarApod },
  { archivo: 'naves.json', obtener: naves, recortar: (j) => j },
  { archivo: 'luna.json', obtener: luna, recortar: (j) => j },
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
console.log(`NeoWs: ${process.env.NASA_API_KEY ? 'clave propia' : 'DEMO_KEY'}`);
const estado = { generado: new Date(ahora).toISOString(), fuentes: {} };

for (const f of FUENTES) {
  try {
    const datos = {
      generado: estado.generado,
      ...f.recortar(f.obtener ? await f.obtener() : await pedir(f.url)),
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
