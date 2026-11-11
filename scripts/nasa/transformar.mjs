/**
 * Recortes de cada fuente de la NASA a lo que usa la app, en JSON compacto.
 * Son funciones puras: scripts/datos-nasa.mjs las aplica a lo descargado y tests/datosNasa.test.ts las prueba.
 */

const redondear = (n, d = 2) =>
  n === null || n === undefined || n === '' || Number.isNaN(Number(n))
    ? null
    : Math.round(Number(n) * 10 ** d) / 10 ** d;

/**
 * Asteroides de la semana desde NeoWs (feed): un objeto por acercamiento, ordenados por fecha.
 * @param feed respuesta de /neo/rest/v1/feed
 */
export function recortarNeo(feed) {
  const objetos = Object.values(feed.near_earth_objects ?? {})
    .flat()
    .map((o) => {
      const paso = o.close_approach_data?.[0];
      const metros = o.estimated_diameter?.meters ?? {};
      return {
        id: o.id,
        nombre: o.name.replace(/[()]/g, '').trim(),
        url: o.nasa_jpl_url,
        peligroso: !!o.is_potentially_hazardous_asteroid,
        sentry: !!o.is_sentry_object,
        diametroM: [
          redondear(metros.estimated_diameter_min, 0),
          redondear(metros.estimated_diameter_max, 0),
        ],
        fecha: paso?.epoch_date_close_approach ?? null,
        distanciaKm: redondear(paso?.miss_distance?.kilometers, 0),
        distanciaLunar: redondear(paso?.miss_distance?.lunar, 2),
        velocidadKms: redondear(
          paso?.relative_velocity?.kilometers_per_second,
          2,
        ),
      };
    })
    .filter((o) => o.fecha !== null && o.distanciaKm !== null)
    .sort((a, b) => a.fecha - b.fecha);
  return { objetos };
}

/** Grados con signo a partir del valor y su letra (N/S, E/W). */
function conSigno(valor, letra) {
  const v = Number(valor);
  if (valor === null || Number.isNaN(v)) return null;
  return letra === 'S' || letra === 'W' ? -v : v;
}

/**
 * Bólidos registrados por sensores del gobierno de EE. UU. (JPL Fireball): fecha en ms, energía de impacto en kilotones, lugar, altura y velocidad.
 * @param api respuesta de fireball.api, con sus campos en `fields`
 */
export function recortarBolidos(api) {
  const i = Object.fromEntries(api.fields.map((f, k) => [f, k]));
  const filas = api.data
    .map((d) => [
      Date.parse(`${d[i.date].replace(' ', 'T')}Z`),
      redondear(d[i['impact-e']], 3),
      redondear(conSigno(d[i.lat], d[i['lat-dir']]), 1),
      redondear(conSigno(d[i.lon], d[i['lon-dir']]), 1),
      redondear(d[i.alt], 1),
      redondear(d[i.vel], 1),
    ])
    .filter((f) => !Number.isNaN(f[0]) && f[1] !== null);
  return {
    campos: ['fecha', 'impactoKt', 'lat', 'lon', 'alturaKm', 'velocidadKms'],
    filas,
  };
}

/**
 * Lista de vigilancia de impactos Sentry: el total y los objetos más probables primero.
 * @param maximo cuántos se guardan
 */
export function recortarSentry(api, maximo = 60) {
  const objetos = api.data
    .map((o) => ({
      des: o.des,
      nombre: o.fullname.replace(/[()]/g, '').trim(),
      probabilidad: Number(o.ip),
      palermo: redondear(o.ps_cum, 2),
      torino: Number(o.ts_max ?? 0),
      diametroKm: redondear(o.diameter, 3),
      anios: o.range,
      impactos: Number(o.n_imp),
      velocidadKms: redondear(o.v_inf, 1),
    }))
    .sort((a, b) => b.probabilidad - a.probabilidad);
  return { total: Number(api.count), objetos: objetos.slice(0, maximo) };
}

/**
 * Exoplanetas confirmados (tabla pscomppars): una fila corta por planeta y la lista de métodos de descubrimiento, del más usado al menos.
 * Columnas: nombre, estrella, año, método (índice), radio en radios terrestres, período en días, insolación relativa a la Tierra, temperatura en K, distancia en parsecs.
 */
export function recortarExoplanetas(filas) {
  const cuenta = new Map();
  for (const f of filas) {
    cuenta.set(f.discoverymethod, (cuenta.get(f.discoverymethod) ?? 0) + 1);
  }
  const metodos = [...cuenta.keys()].sort(
    (a, b) => cuenta.get(b) - cuenta.get(a),
  );
  return {
    metodos,
    campos: [
      'nombre',
      'estrella',
      'anio',
      'metodo',
      'radio',
      'periodo',
      'insolacion',
      'temperatura',
      'distanciaPc',
    ],
    filas: filas.map((f) => [
      f.pl_name,
      f.hostname,
      f.disc_year,
      metodos.indexOf(f.discoverymethod),
      redondear(f.pl_rade, 2),
      redondear(f.pl_orbper, f.pl_orbper > 100 ? 0 : 3),
      redondear(f.pl_insol, 2),
      redondear(f.pl_eqt, 0),
      redondear(f.sy_dist, 1),
    ]),
  };
}

/**
 * Resumen pequeño para los avisos y la portada de NASA en vivo, sacado de los archivos ya recortados (cualquiera puede faltar).
 * @param ahora momento de la descarga, en ms
 */
export function resumir({ neo, bolidos, sentry, exoplanetas }, ahora) {
  const corto = (o) => ({
    id: o.id,
    nombre: o.nombre,
    fecha: o.fecha,
    distanciaLunar: o.distanciaLunar,
    peligroso: o.peligroso,
    url: o.url,
  });
  const ultimo = bolidos?.filas?.length
    ? bolidos.filas.reduce((m, f) => (f[0] > m[0] ? f : m))
    : null;
  return {
    neo: neo
      ? {
          total: neo.objetos.length,
          peligrosos: neo.objetos.filter((o) => o.peligroso).length,
          cercanos: neo.objetos.filter((o) => o.distanciaLunar < 1).map(corto),
          proximos: neo.objetos.filter((o) => o.fecha > ahora).slice(0, 3).map(corto),
        }
      : null,
    bolido: ultimo
      ? { fecha: ultimo[0], kt: ultimo[1], lat: ultimo[2], lon: ultimo[3] }
      : null,
    bolidosTotal: bolidos?.filas?.length ?? null,
    sentryTotal: sentry?.total ?? null,
    exoplanetas: exoplanetas?.filas?.length ?? null,
  };
}
