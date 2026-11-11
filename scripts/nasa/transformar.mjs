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
          proximos: neo.objetos
            .filter((o) => o.fecha > ahora)
            .slice(0, 3)
            .map(corto),
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

const MESES = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};
const KM_POR_UA = 149_597_870.7;
const KM_POR_LD = 384_400;

/** Fecha de JPL como «2026-Nov-11 03:51» a ms (UTC). */
export function fechaJpl(texto) {
  const [d, h] = texto.trim().split(' ');
  const [a, m, dia] = d.split('-');
  const [hh, mm] = (h ?? '00:00').split(':');
  return Date.UTC(Number(a), MESES[m], Number(dia), Number(hh), Number(mm));
}

/**
 * Acercamientos de los próximos 60 días (JPL CAD): fecha, distancia en distancias lunares, velocidad y magnitud absoluta.
 * @param api respuesta de cad.api con sus campos en `fields`
 */
export function recortarCad(api) {
  const i = Object.fromEntries(api.fields.map((f, k) => [f, k]));
  return {
    objetos: (api.data ?? []).map((d) => ({
      des: d[i.des],
      nombre: (d[i.fullname] ?? d[i.des]).trim().replace(/[()]/g, '').trim(),
      fecha: fechaJpl(d[i.cd]),
      distanciaLunar: redondear((Number(d[i.dist]) * KM_POR_UA) / KM_POR_LD, 2),
      velocidadKms: redondear(d[i.v_rel], 1),
      h: redondear(d[i.h], 1),
    })),
  };
}

/** Objetos recién descubiertos que Scout sigue, sin confirmar todavía, del más probable NEO al menos. */
export function recortarScout(api) {
  return {
    objetos: (api.data ?? [])
      .map((o) => ({
        nombre: o.objectName,
        neo: Number(o.neoScore),
        pha: Number(o.phaScore),
        distanciaLunar: o.caDist === null ? null : redondear(o.caDist, 1),
        h: redondear(o.H, 1),
        observaciones: Number(o.nObs),
        actualizado: Date.parse(`${o.lastRun.replace(' ', 'T')}Z`),
        velocidadKms: redondear(o.vInf, 1),
      }))
      .sort(
        (a, b) =>
          b.neo - a.neo ||
          (a.distanciaLunar ?? 1e9) - (b.distanciaLunar ?? 1e9),
      ),
  };
}

/**
 * Distancia y velocidad de alejamiento de una nave desde la tabla de Horizons (cantidad 20: delta en UA y deldot en km/s).
 * @returns null si la tabla no trae datos
 */
export function leerHorizons(resultado) {
  const ini = resultado.indexOf('$$SOE');
  const fin = resultado.indexOf('$$EOE');
  if (ini < 0 || fin < 0) return null;
  const fila = resultado
    .slice(ini + 5, fin)
    .trim()
    .split('\n')[0]
    .trim()
    .split(/\s+/);
  const delta = Number(fila[2]);
  const deldot = Number(fila[3]);
  if (Number.isNaN(delta) || Number.isNaN(deldot)) return null;
  return { km: Math.round(delta * KM_POR_UA), kms: redondear(deldot, 3) };
}

/** La foto astronómica del día de la NASA, con lo que la vista necesita. */
export function recortarApod(a) {
  return {
    fecha: a.date,
    titulo: a.title,
    texto: a.explanation,
    tipo: a.media_type,
    url: a.url,
    hd: a.hdurl ?? null,
    miniatura: a.thumbnail_url ?? null,
    credito: a.copyright ? a.copyright.replace(/\s+/g, ' ').trim() : null,
  };
}

/**
 * Ruta base de las imágenes horarias de la Luna de un año (SVS Dial-A-Moon) a partir de la respuesta de su 1 de enero.
 * @returns la base que termina en «moon.» y cuántos dígitos tiene el número de fotograma, o null
 */
export function baseLuna(api) {
  const url = api?.image?.url;
  const m =
    typeof url === 'string' ? url.match(/^(.*\/moon\.)(\d+)\.jpg$/) : null;
  return m
    ? { base: m[1].replace('http://', 'https://'), digitos: m[2].length }
    : null;
}

/**
 * Segundos de una duración ISO 8601 con signo, como «-PT38M» o «PT2M30S».
 * @returns los segundos, negativos antes del despegue, o null si no se entiende
 */
export function duracionIso(texto) {
  const m =
    typeof texto === 'string'
      ? texto.match(
          /^(-)?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/,
        )
      : null;
  if (!m) return null;
  const s =
    Number(m[2] ?? 0) * 86_400 +
    Number(m[3] ?? 0) * 3600 +
    Number(m[4] ?? 0) * 60 +
    Number(m[5] ?? 0);
  return m[1] ? -s : s;
}

const numero = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** El mejor video de un lanzamiento: YouTube primero y, entre iguales, el de mayor prioridad. */
function mejorVideo(videos) {
  const lista = Array.isArray(videos) ? videos.filter((v) => v?.url) : [];
  lista.sort(
    (a, b) =>
      Number(b.source?.includes('youtube') ?? 0) -
        Number(a.source?.includes('youtube') ?? 0) ||
      (b.priority ?? 0) - (a.priority ?? 0),
  );
  return lista[0]?.url ?? null;
}

/** Un lanzamiento de Launch Library 2 con lo que usa la app. */
function recortarLanzamiento(l) {
  const conf = l.rocket?.configuration ?? {};
  const etapa = l.rocket?.launcher_stage?.[0] ?? null;
  const aterrizaje = etapa?.landing?.attempt ? etapa.landing : null;
  const pad = l.pad ?? {};
  return {
    id: l.id,
    nombre: l.mission?.name ?? l.name,
    cohete: conf.full_name ?? conf.name ?? l.name,
    familia: conf.families?.[0]?.name ?? null,
    proveedor: l.launch_service_provider?.name ?? null,
    net: Date.parse(l.net),
    precision: l.net_precision?.abbrev ?? null,
    ventana:
      l.window_start && l.window_end
        ? [Date.parse(l.window_start), Date.parse(l.window_end)]
        : null,
    estado: l.status?.abbrev ?? 'TBD',
    sitio: pad.location?.name ?? pad.name ?? null,
    plataforma: pad.name ?? null,
    pais: pad.country?.alpha_2_code ?? null,
    lat: numero(Number(pad.latitude)),
    lon: numero(Number(pad.longitude)),
    orbita: l.mission?.orbit?.abbrev ?? null,
    orbitaNombre: l.mission?.orbit?.name ?? null,
    tipo: l.mission?.type ?? null,
    descripcion: l.mission?.description ?? null,
    video: mejorVideo(l.vid_urls),
    enVivo: Boolean(l.webcast_live),
    probabilidad: numero(l.probability),
    propulsor: etapa?.launcher
      ? {
          serie: etapa.launcher.serial_number ?? null,
          vuelo: numero(etapa.launcher_flight_number),
          aterrizaje: aterrizaje
            ? {
                lugar:
                  aterrizaje.landing_location?.abbrev ||
                  aterrizaje.landing_location?.name ||
                  null,
                lugarNombre: aterrizaje.landing_location?.name ?? null,
                tipo: aterrizaje.type?.abbrev ?? null,
                km: numero(aterrizaje.downrange_distance),
              }
            : null,
        }
      : null,
    perfil: {
      alto: numero(conf.length),
      diametro: numero(conf.diameter),
      masa: numero(conf.launch_mass),
      empuje: numero(conf.to_thrust),
      leo: numero(conf.leo_capacity),
      lanzamientos: numero(conf.total_launch_count),
      exitos: numero(conf.successful_launches),
      reutilizable: conf.reusable ?? null,
    },
    eventos: (l.timeline ?? [])
      .map((e) => ({
        id: e.type?.id ?? 0,
        nombre: e.type?.abbrev ?? '',
        t: duracionIso(e.relative_time),
      }))
      .filter((e) => e.t !== null)
      .sort((a, b) => a.t - b.t),
  };
}

/**
 * Próximos lanzamientos y los últimos hechos, de Launch Library 2 (The Space Devs), ordenados por fecha.
 * @param proximos respuesta de /launches/upcoming en modo detailed
 * @param previos respuesta de /launches/previous, o null si no se pudo pedir
 */
export function recortarLanzamientos(proximos, previos) {
  const lista = (r) => (Array.isArray(r?.results) ? r.results : []);
  const futuros = lista(proximos)
    .map(recortarLanzamiento)
    .filter((l) => Number.isFinite(l.net))
    .sort((a, b) => a.net - b.net);
  if (!futuros.length) throw new Error('sin lanzamientos');
  return {
    proximos: futuros,
    recientes: lista(previos)
      .map((l) => ({
        id: l.id,
        nombre: l.mission?.name ?? l.name,
        cohete: l.rocket?.configuration?.full_name ?? l.name,
        net: Date.parse(l.net),
        estado: l.status?.abbrev ?? 'TBD',
        pais: l.pad?.country?.alpha_2_code ?? null,
        video: mejorVideo(l.vid_urls),
      }))
      .filter((l) => Number.isFinite(l.net))
      .sort((a, b) => b.net - a.net),
  };
}
