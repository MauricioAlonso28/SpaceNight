const MU = 3.986004418e14;
const R_TIERRA = 6_371_000;
const G0 = 9.80665;
const OMEGA = 7.2921159e-5;
const P0 = 101_325;
const ESCALA_ATM = 8_500;

/** Una etapa: masas en kg, empuje en N y eficiencia (Isp) en segundos, al nivel del mar y en el vacío. */
export interface Etapa {
  seca: number;
  propelente: number;
  empujeMar: number;
  empujeVacio: number;
  ispMar: number;
  ispVacio: number;
}

/** El cohete del simulador: dos etapas con los números públicos del Falcon 9 Block 5. */
export const COHETE_SIM = {
  etapa1: {
    seca: 25_600,
    propelente: 395_700,
    empujeMar: 7_607_000,
    empujeVacio: 8_227_000,
    ispMar: 282,
    ispVacio: 311,
  } satisfies Etapa,
  etapa2: {
    seca: 3_900,
    propelente: 92_670,
    empujeMar: 0,
    empujeVacio: 981_000,
    ispMar: 0,
    ispVacio: 348,
  } satisfies Etapa,
  cofia: 1_900,
  area: 10.5,
  motorAterrizaje: 845_000,
  ispAterrizaje: 282,
};

/** Cómo vuelve la primera etapa, o si se tira. */
export type Recuperacion = 'barcaza' | 'base' | 'ninguna';

/** Propelente que se guarda la primera etapa para volver, en kg. */
export const RESERVA: Record<Recuperacion, number> = {
  barcaza: 32_000,
  base: 90_000,
  ninguna: 0,
};

/** Un instante del vuelo. Alturas y distancias en m, velocidades en m/s, aceleración en g, presión en Pa, empuje en N. */
export interface Muestra {
  t: number;
  altura: number;
  distancia: number;
  velocidad: number;
  vertical: number;
  aceleracion: number;
  presion: number;
  masa: number;
  etapa: 1 | 2;
  angulo: number;
  empuje: number;
}

/** Un hito del vuelo, en segundos desde el despegue. */
export interface Hito {
  id:
    | 'despegue'
    | 'maxq'
    | 'meco'
    | 'separacion'
    | 'ses'
    | 'cofia'
    | 'seco'
    | 'orbita'
    | 'sin-combustible'
    | 'regreso'
    | 'fin-regreso'
    | 'reentrada'
    | 'fin-reentrada'
    | 'aterrizaje-encendido'
    | 'toque';
  t: number;
}

/** Estado completo en un instante, en coordenadas planas con el centro de la Tierra en el origen. */
interface Estado {
  x: number;
  y: number;
  vx: number;
  vy: number;
  masa: number;
}

/** Densidad del aire y presión a una altura, con una atmósfera exponencial. */
function atmosfera(h: number): { densidad: number; presion: number } {
  const f = h > 0 ? Math.exp(-h / ESCALA_ATM) : 1;
  return { densidad: 1.225 * f, presion: P0 * f };
}

/** Velocidad respecto del aire, que gira con la Tierra; en la latitud de cabo Cañaveral. */
function velocidadAire(e: Estado): { ax: number; ay: number } {
  const w = OMEGA * Math.cos((28.5 * Math.PI) / 180);
  return { ax: e.vx - w * e.y, ay: e.vy + w * e.x };
}

/** Altura sobre la superficie, distancia recorrida sobre ella y velocidades vertical y horizontal. */
function geometria(e: Estado) {
  const r = Math.hypot(e.x, e.y);
  const ux = e.x / r;
  const uy = e.y / r;
  return {
    r,
    ux,
    uy,
    altura: r - R_TIERRA,
    distancia: R_TIERRA * Math.atan2(e.x, e.y),
    vertical: e.vx * ux + e.vy * uy,
    horizontal: e.vx * uy - e.vy * ux,
  };
}

/** Apogeo y perigeo en metros sobre la superficie de la órbita que lleva un estado. */
export function orbitaDe(e: Estado): { apogeo: number; perigeo: number } {
  const r = Math.hypot(e.x, e.y);
  const v2 = e.vx ** 2 + e.vy ** 2;
  const energia = v2 / 2 - MU / r;
  const h = e.x * e.vy - e.y * e.vx;
  const a = -MU / (2 * energia);
  const ecc = Math.sqrt(Math.max(0, 1 + (2 * energia * h * h) / MU ** 2));
  return {
    apogeo: a * (1 + ecc) - R_TIERRA,
    perigeo: a * (1 - ecc) - R_TIERRA,
  };
}

/** Empuje y gasto de una etapa a una presión del aire, con el acelerador entre 0 y 1. */
function motor(etapa: Etapa, presion: number, acelerador: number) {
  const f = presion / P0;
  const empuje =
    (etapa.empujeVacio - (etapa.empujeVacio - etapa.empujeMar) * f) *
    acelerador;
  const gasto = (etapa.empujeVacio * acelerador) / (etapa.ispVacio * G0);
  return { empuje, gasto };
}

/**
 * Un paso de integración: gravedad, arrastre y empuje en la dirección dada (ángulo sobre el horizonte local, en radianes).
 * @returns el estado nuevo y la aceleración sin gravedad, para la telemetría
 */
function paso(
  e: Estado,
  dt: number,
  empuje: number,
  gasto: number,
  angulo: number,
  cd: number,
): { e: Estado; aceleracion: number; presion: number } {
  const g = geometria(e);
  const { densidad } = atmosfera(g.altura);
  const { ax, ay } = velocidadAire(e);
  const va = Math.hypot(ax, ay);
  const presion = 0.5 * densidad * va * va;
  const arrastre = presion * cd * COHETE_SIM.area;
  const hx = g.uy;
  const hy = -g.ux;
  const dx = Math.cos(angulo) * hx + Math.sin(angulo) * g.ux;
  const dy = Math.cos(angulo) * hy + Math.sin(angulo) * g.uy;
  const fx = empuje * dx - (va > 0 ? (arrastre * ax) / va : 0);
  const fy = empuje * dy - (va > 0 ? (arrastre * ay) / va : 0);
  const gr = MU / (g.r * g.r);
  const accX = fx / e.masa - gr * g.ux;
  const accY = fy / e.masa - gr * g.uy;
  return {
    e: {
      x: e.x + (e.vx + accX * dt * 0.5) * dt,
      y: e.y + (e.vy + accY * dt * 0.5) * dt,
      vx: e.vx + accX * dt,
      vy: e.vy + accY * dt,
      masa: e.masa - gasto * dt,
    },
    aceleracion: Math.hypot(fx, fy) / e.masa / G0,
    presion,
  };
}

/** Muestra de telemetría de un estado: velocidad respecto del suelo, como en las transmisiones. */
function muestra(
  t: number,
  e: Estado,
  aceleracion: number,
  presion: number,
  etapa: 1 | 2,
  angulo: number,
  empuje: number,
): Muestra {
  const g = geometria(e);
  const { ax, ay } = velocidadAire(e);
  return {
    t,
    altura: g.altura,
    distancia: g.distancia,
    velocidad: Math.hypot(ax, ay),
    vertical: g.vertical,
    aceleracion,
    presion,
    masa: e.masa,
    etapa,
    angulo,
    empuje,
  };
}

/** Ángulo de la primera etapa sobre el horizonte: sube recta 10 s y se inclina con la altura, como un giro por gravedad. */
function anguloEtapa1(t: number, altura: number): number {
  if (t < 10) return Math.PI / 2;
  const f = Math.min(1, altura / 62_000);
  return (Math.PI / 2) * (1 - 0.78 * Math.sqrt(f));
}

/**
 * Ángulo de la segunda etapa: corrige la velocidad vertical para llegar a la altura objetivo sin pasarse,
 * y el resto del empuje va a ganar velocidad horizontal.
 */
function anguloEtapa2(
  e: Estado,
  aceleracionMotor: number,
  objetivo: number,
): number {
  const g = geometria(e);
  const verticalDeseada = (objetivo - g.altura) / 110;
  const necesaria =
    (verticalDeseada - g.vertical) / 22 +
    MU / (g.r * g.r) -
    (g.horizontal * g.horizontal) / g.r;
  return Math.asin(Math.max(-0.4, Math.min(1, necesaria / aceleracionMotor)));
}

/** Resultado de un ascenso: telemetría cada segundo, hitos, cómo terminó y dónde quedó la primera etapa. */
export interface Ascenso {
  muestras: Muestra[];
  hitos: Hito[];
  enOrbita: boolean;
  apogeo: number;
  perigeo: number;
  faltaVelocidad: number;
  separacion: { estado: Estado; t: number; reserva: number };
}

/**
 * Simula el ascenso a una órbita baja de un cohete de dos etapas tipo Falcon 9.
 * @param carga masa de la carga útil en kg
 * @param recuperacion cuánto propelente se guarda la primera etapa para volver
 * @param objetivo altura de la órbita buscada en metros
 */
export function simularAscenso(
  carga: number,
  recuperacion: Recuperacion,
  objetivo = 210_000,
): Ascenso {
  const { etapa1, etapa2, cofia } = COHETE_SIM;
  const reserva = RESERVA[recuperacion];
  const masaEtapa2 = etapa2.seca + etapa2.propelente + cofia + carga;
  let e: Estado = {
    x: 0,
    y: R_TIERRA,
    vx: OMEGA * R_TIERRA * Math.cos((28.5 * Math.PI) / 180),
    vy: 0,
    masa: etapa1.seca + etapa1.propelente + masaEtapa2,
  };
  const dt = 0.1;
  const muestras: Muestra[] = [];
  const hitos: Hito[] = [{ id: 'despegue', t: 0 }];
  let t = 0;
  let maxQ = { t: 0, q: 0 };
  let quemado = 0;
  let ultima = -1;
  const anotar = (m: Muestra) => {
    if (Math.floor(m.t) > ultima) {
      ultima = Math.floor(m.t);
      muestras.push(m);
    }
  };

  while (quemado < etapa1.propelente - reserva) {
    const { altura } = geometria(e);
    const acelerador = t > 58 && t < 82 ? 0.72 : 1;
    const { presion } = atmosfera(altura);
    const m = motor(etapa1, presion, acelerador);
    const angulo = anguloEtapa1(t, altura);
    const r = paso(e, dt, m.empuje, m.gasto, angulo, 0.3);
    e = r.e;
    quemado += m.gasto * dt;
    t += dt;
    if (r.presion > maxQ.q) maxQ = { t, q: r.presion };
    anotar(muestra(t, e, r.aceleracion, r.presion, 1, angulo, m.empuje));
  }
  hitos.push(
    { id: 'maxq', t: Math.round(maxQ.t) },
    { id: 'meco', t: Math.round(t) },
  );
  const separacion = {
    estado: { ...e, masa: etapa1.seca + (etapa1.propelente - quemado) },
    t,
    reserva,
  };
  hitos.push({ id: 'separacion', t: Math.round(t + 3) });

  e = { ...e, masa: masaEtapa2 };
  for (let i = 0; i < 70; i++) {
    const r = paso(e, dt, 0, 0, 0, 0.3);
    e = r.e;
    t += dt;
    anotar(muestra(t, e, r.aceleracion, r.presion, 2, 0, 0));
  }
  hitos.push({ id: 'ses', t: Math.round(t) });

  let restante = etapa2.propelente;
  let conCofia = true;
  let terminado = false;
  while (restante > 0 && !terminado) {
    const g = geometria(e);
    if (conCofia && g.altura > 110_000) {
      conCofia = false;
      e = { ...e, masa: e.masa - cofia };
      hitos.push({ id: 'cofia', t: Math.round(t) });
    }
    const m = motor(etapa2, 0, 1);
    const angulo = anguloEtapa2(e, m.empuje / e.masa, objetivo);
    const r = paso(e, dt, m.empuje, m.gasto, angulo, 0.3);
    e = r.e;
    restante -= m.gasto * dt;
    t += dt;
    anotar(muestra(t, e, r.aceleracion, r.presion, 2, angulo, m.empuje));
    const o = orbitaDe(e);
    terminado = o.perigeo > objetivo - 25_000 && o.perigeo > 140_000;
  }

  const o = orbitaDe(e);
  const g = geometria(e);
  const enOrbita = o.perigeo > 140_000;
  hitos.push({ id: enOrbita ? 'seco' : 'sin-combustible', t: Math.round(t) });
  if (enOrbita) hitos.push({ id: 'orbita', t: Math.round(t) + 1 });
  const vCirc = Math.sqrt(MU / g.r);
  return {
    muestras,
    hitos,
    enOrbita,
    apogeo: o.apogeo,
    perigeo: o.perigeo,
    faltaVelocidad: enOrbita ? 0 : Math.max(0, vCirc - Math.abs(g.horizontal)),
    separacion,
  };
}

/** Resultado del regreso de la primera etapa: telemetría, hitos, velocidad al tocar y a cuánto cayó del objetivo. */
export interface Regreso {
  muestras: Muestra[];
  hitos: Hito[];
  toque: number;
  sobrante: number;
  distanciaFinal: number;
}

/** Velocidad respecto del aire a la que termina el encendido de reentrada, en m/s. */
export const LIMITE_REENTRADA = 1_300;

/** Ángulo opuesto a la velocidad respecto del aire, para frenar con los motores. */
function anguloRetrogrado(e: Estado): number {
  const g = geometria(e);
  const { ax, ay } = velocidadAire(e);
  const h = ax * g.uy - ay * g.ux;
  const v = ax * g.ux + ay * g.uy;
  return Math.atan2(-v, -h);
}

/** Dónde caería sin motores, sin aire y en suelo plano: distancia sobre la superficie. */
function caidaLibre(e: Estado): number {
  const g = geometria(e);
  const grav = MU / (g.r * g.r);
  const tiempo =
    (g.vertical +
      Math.sqrt(g.vertical ** 2 + 2 * grav * Math.max(0, g.altura))) /
    grav;
  return g.distancia + g.horizontal * tiempo;
}

/** Quema de la primera etapa con varios motores en una dirección, hasta que se cumpla una condición o se acabe el propelente. */
interface Quema {
  motores: number;
  angulo: (e: Estado) => number;
  hasta: (e: Estado) => boolean;
}

/**
 * Simula el regreso de la primera etapa desde la separación: giro, encendido de regreso si vuelve a la base,
 * encendido de reentrada, caída frenada por el aire y encendido de aterrizaje con un motor.
 */
export function simularRegreso(
  ascenso: Ascenso,
  modo: Exclude<Recuperacion, 'ninguna'>,
): Regreso {
  const { motorAterrizaje, ispAterrizaje, etapa1 } = COHETE_SIM;
  let e: Estado = { ...ascenso.separacion.estado };
  let t = ascenso.separacion.t;
  let propelente = ascenso.separacion.reserva;
  const dt = 0.1;
  const muestras: Muestra[] = [];
  const hitos: Hito[] = [{ id: 'separacion', t: Math.round(t) }];
  let ultima = -1;
  const avanzar = (empuje: number, angulo: number, cd: number) => {
    const gasto = empuje / (ispAterrizaje * G0);
    const r = paso(e, dt, empuje, gasto, angulo, cd);
    e = r.e;
    propelente -= gasto * dt;
    t += dt;
    if (Math.floor(t) > ultima) {
      ultima = Math.floor(t);
      muestras.push(muestra(t, e, r.aceleracion, r.presion, 1, angulo, empuje));
    }
  };
  const quemar = (q: Quema, inicio: Hito['id'], fin: Hito['id']) => {
    hitos.push({ id: inicio, t: Math.round(t) });
    while (propelente > 0 && !q.hasta(e))
      avanzar(q.motores * motorAterrizaje, q.angulo(e), 1);
    hitos.push({ id: fin, t: Math.round(t) });
  };
  const caer = (hasta: (e: Estado) => boolean) => {
    while (geometria(e).altura > 0 && !hasta(e)) avanzar(0, 0, 0.9);
  };

  for (let i = 0; i < 80; i++) avanzar(0, 0, 0.9);
  if (modo === 'base') {
    quemar(
      {
        motores: 3,
        angulo: () => Math.PI - 0.1,
        hasta: (x) => caidaLibre(x) < -23_000,
      },
      'regreso',
      'fin-regreso',
    );
  }
  caer((x) => geometria(x).vertical < 0 && geometria(x).altura < 60_000);
  quemar(
    {
      motores: 3,
      angulo: anguloRetrogrado,
      hasta: (x) =>
        Math.hypot(velocidadAire(x).ax, velocidadAire(x).ay) <
          LIMITE_REENTRADA || propelente < 9_000,
    },
    'reentrada',
    'fin-reentrada',
  );
  const frenada = (x: Estado) => {
    const g = geometria(x);
    const decel =
      (0.8 * motorAterrizaje) / (etapa1.seca + Math.max(propelente, 0)) - G0;
    return (
      g.altura < 8_000 && g.altura <= (g.vertical * g.vertical) / (2 * decel)
    );
  };
  caer(frenada);
  hitos.push({ id: 'aterrizaje-encendido', t: Math.round(t) });
  while (geometria(e).altura > 0 && propelente > 0) {
    const g = geometria(e);
    const necesaria =
      (g.vertical * g.vertical) / (2 * Math.max(g.altura, 1)) + G0;
    const acelerador = (necesaria * e.masa) / motorAterrizaje;
    const encendido = acelerador >= 0.4 && g.vertical < -0.5;
    avanzar(
      encendido ? motorAterrizaje * Math.min(1, acelerador) : 0,
      anguloRetrogrado(e),
      0.9,
    );
  }
  while (geometria(e).altura > 0) avanzar(0, Math.PI / 2, 0.9);
  hitos.push({ id: 'toque', t: Math.round(t) });
  const g = geometria(e);
  const { ax, ay } = velocidadAire(e);
  return {
    muestras,
    hitos,
    toque: Math.hypot(ax, ay),
    sobrante: Math.max(0, propelente),
    distanciaFinal: g.distancia,
  };
}

/** Tiempo de misión como «T+02:22». */
export const tiempoMision = (t: number) => {
  const s = Math.max(0, Math.round(t));
  return `T+${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
