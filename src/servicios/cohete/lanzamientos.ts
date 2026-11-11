import { useJsonPublico } from '../../estado/datos';
import { idioma, textos } from '../../idioma/idioma';

/** Un evento de la cuenta atrás o del vuelo, en segundos respecto del despegue. */
export interface EventoVuelo {
  id: number;
  nombre: string;
  t: number;
}

/** Un lanzamiento próximo, recortado de Launch Library 2 por scripts/datos-nasa.mjs. */
export interface Lanzamiento {
  id: string;
  nombre: string;
  cohete: string;
  familia: string | null;
  proveedor: string | null;
  net: number;
  precision: string | null;
  ventana: [number, number] | null;
  estado: string;
  sitio: string | null;
  plataforma: string | null;
  pais: string | null;
  lat: number | null;
  lon: number | null;
  orbita: string | null;
  orbitaNombre: string | null;
  tipo: string | null;
  descripcion: string | null;
  video: string | null;
  enVivo: boolean;
  probabilidad: number | null;
  propulsor: {
    serie: string | null;
    vuelo: number | null;
    aterrizaje: {
      lugar: string | null;
      lugarNombre: string | null;
      tipo: string | null;
      km: number | null;
    } | null;
  } | null;
  perfil: {
    alto: number | null;
    diametro: number | null;
    masa: number | null;
    empuje: number | null;
    leo: number | null;
    lanzamientos: number | null;
    exitos: number | null;
    reutilizable: boolean | null;
  };
  eventos: EventoVuelo[];
}

/** Un lanzamiento ya hecho, con su resultado. */
export interface LanzamientoHecho {
  id: string;
  nombre: string;
  cohete: string;
  net: number;
  estado: string;
  pais: string | null;
  video: string | null;
}

/** Lo que deja el pipeline en public/data/nasa/lanzamientos.json. */
export interface DatosLanzamientos {
  generado: string;
  proximos: Lanzamiento[];
  recientes: LanzamientoHecho[];
}

export const useLanzamientos = () =>
  useJsonPublico<DatosLanzamientos>('nasa/lanzamientos.json');

/** Precisiones con hora fiable, en las que tiene sentido una cuenta atrás. */
const PRECISAS = new Set(['SEC', 'MIN', 'HR']);

/** Si la hora de un lanzamiento es lo bastante exacta para contar hacia atrás. */
export const tieneHora = (l: Pick<Lanzamiento, 'precision'>) =>
  PRECISAS.has(l.precision ?? '');

const ESTADOS: Record<string, { es: string; en: string; tono: Tono }> = {
  Go: { es: 'Confirmado', en: 'Go', tono: 'bien' },
  TBC: { es: 'Por confirmar', en: 'To be confirmed', tono: 'neutro' },
  TBD: { es: 'Fecha tentativa', en: 'Tentative date', tono: 'tenue' },
  Hold: { es: 'En pausa', en: 'On hold', tono: 'alerta' },
  'In Flight': { es: 'En vuelo', en: 'In flight', tono: 'bien' },
  Success: { es: 'Éxito', en: 'Success', tono: 'bien' },
  Failure: { es: 'Falla', en: 'Failure', tono: 'mal' },
  'Partial Failure': {
    es: 'Falla parcial',
    en: 'Partial failure',
    tono: 'alerta',
  },
};

/** Cómo pinta un estado: bien, neutro, tenue, alerta o mal. */
export type Tono = 'bien' | 'neutro' | 'tenue' | 'alerta' | 'mal';

/** Nombre visible y tono de un estado de Launch Library 2; si no se conoce, el original en tono neutro. */
export function estadoLanzamiento(abrev: string): {
  texto: string;
  tono: Tono;
} {
  const e = ESTADOS[abrev];
  return e
    ? { texto: textos(e), tono: e.tono }
    : { texto: abrev, tono: 'neutro' };
}

const EVENTOS: Record<number, { es: string; en: string }> = {
  1: {
    es: 'Visto bueno para cargar combustible',
    en: 'Go for propellant load',
  },
  2: { es: 'Empieza la carga de combustible', en: 'Propellant load starts' },
  3: { es: 'Oxígeno líquido en la 1.ª etapa', en: 'Stage 1 LOX load' },
  4: { es: 'Oxígeno líquido en la 2.ª etapa', en: 'Stage 2 LOX load' },
  5: { es: 'Enfriamiento de motores', en: 'Engine chill' },
  6: {
    es: 'La computadora toma la cuenta atrás',
    en: 'Flight computer takes over',
  },
  7: { es: 'Tanques a presión de vuelo', en: 'Tanks to flight pressure' },
  8: { es: 'Visto bueno para lanzar', en: 'Go for launch' },
  9: { es: 'Encendido', en: 'Ignition' },
  10: { es: 'Despegue', en: 'Liftoff' },
  11: { es: 'Máxima presión aerodinámica', en: 'Max-Q' },
  12: { es: 'Apagado de la 1.ª etapa (MECO)', en: 'Main engine cutoff (MECO)' },
  13: { es: 'Separación de etapas', en: 'Stage separation' },
  14: { es: 'Enciende la 2.ª etapa', en: 'Second stage ignition' },
  15: { es: 'Se suelta la cofia', en: 'Fairing separation' },
  16: { es: 'Encendido de reentrada', en: 'Entry burn starts' },
  17: { es: 'Fin del encendido de reentrada', en: 'Entry burn ends' },
  18: { es: 'Encendido de aterrizaje', en: 'Landing burn' },
  19: { es: 'Aterriza la 1.ª etapa', en: 'First stage landing' },
  20: {
    es: 'Apagado de la 2.ª etapa (SECO)',
    en: 'Second engine cutoff (SECO)',
  },
  21: { es: 'Segundo encendido de la 2.ª etapa', en: 'Second stage relight' },
  22: { es: 'Segundo apagado de la 2.ª etapa', en: 'Second engine cutoff 2' },
  23: { es: 'Se sueltan los Starlink', en: 'Starlink deployment' },
  39: { es: 'Encendido de regreso', en: 'Boostback burn' },
  40: { es: 'Fin del encendido de regreso', en: 'Boostback burn ends' },
  78: { es: 'Empieza a soltar la carga', en: 'Payload deployment starts' },
  79: { es: 'Carga liberada', en: 'Payload deployed' },
  86: { es: 'Metano líquido en la 2.ª etapa', en: 'Stage 2 methane load' },
  87: { es: 'Metano líquido en la 1.ª etapa', en: 'Stage 1 methane load' },
  88: { es: '1.ª etapa cargada', en: 'Stage 1 fully loaded' },
  89: { es: '2.ª etapa cargada', en: 'Stage 2 fully loaded' },
  90: { es: 'Se activa el deflector de llamas', en: 'Flame deflector on' },
  95: { es: 'Reentrada en la atmósfera', en: 'Atmospheric entry' },
  98: { es: 'Aterriza la nave', en: 'Ship landing' },
  105: { es: 'Giro para aterrizar', en: 'Landing flip' },
  106: { es: 'Encendido de aterrizaje de la nave', en: 'Ship landing burn' },
  263: { es: 'Encendido de inserción orbital', en: 'Orbit insertion burn' },
  264: { es: 'En órbita', en: 'In orbit' },
  265: { es: 'Encendido para salir de órbita', en: 'Deorbit burn' },
  269: { es: 'La torre atrapa la nave', en: 'Tower catches the ship' },
};

/** Nombre de un evento de la cronología en el idioma actual; si no se conoce, el de la fuente. */
export const nombreEvento = (e: EventoVuelo) =>
  EVENTOS[e.id] ? textos(EVENTOS[e.id]) : e.nombre;

/**
 * Cuándo es un lanzamiento según lo exacta que sea su fecha: la hora, el día, el mes o el trimestre.
 * @param hora cómo escribir una hora en la zona del usuario
 */
export function cuandoLanzamiento(
  l: Pick<Lanzamiento, 'net' | 'precision'>,
  zona: string,
  hora: (d: Date) => string,
): string {
  const d = new Date(l.net);
  const loc = idioma() === 'es' ? 'es-PE' : 'en-US';
  const anio = d.getUTCFullYear();
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(loc, { timeZone: zona, ...o }).format(d);
  const p = l.precision ?? '';
  if (PRECISAS.has(p)) {
    const dia = fmt({ weekday: 'short', day: 'numeric', month: 'short' });
    return p === 'HR' ? `${dia} · ~${hora(d)}` : `${dia} · ${hora(d)}`;
  }
  if (p === 'DAY')
    return fmt({ weekday: 'short', day: 'numeric', month: 'short' });
  if (p === 'M') return fmt({ month: 'long', year: 'numeric' });
  const trimestre = p.match(/^Q(\d)$/);
  if (trimestre) {
    return idioma() === 'es'
      ? `${trimestre[1]}.º trimestre de ${anio}`
      : `Q${trimestre[1]} ${anio}`;
  }
  const semestre = p.match(/^H(\d)$/);
  if (semestre) {
    return idioma() === 'es'
      ? `${semestre[1]}.º semestre de ${anio}`
      : `H${semestre[1]} ${anio}`;
  }
  return String(anio);
}

/** Cuenta atrás de reloj de lanzamiento: «T−02:14:33», «T−3 d 04:10:00» o «T+00:01:12» tras el despegue. */
export function relojLanzamiento(net: number, ahora: number): string {
  const s = Math.round((net - ahora) / 1000);
  const abs = Math.abs(s);
  const d = Math.floor(abs / 86_400);
  const hms = [
    Math.floor((abs % 86_400) / 3600),
    Math.floor((abs % 3600) / 60),
    abs % 60,
  ]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
  return `T${s >= 0 ? '−' : '+'}${d ? `${d} d ` : ''}${hms}`;
}

/**
 * Agrupa los lanzamientos por día local los que tienen fecha, y por mes los que solo tienen mes o trimestre.
 * @returns grupos en orden, con su clave y sus lanzamientos
 */
export function agruparLanzamientos(
  lista: Lanzamiento[],
  zona: string,
): { clave: string; conDia: boolean; lanzamientos: Lanzamiento[] }[] {
  const grupos = new Map<
    string,
    { clave: string; conDia: boolean; lanzamientos: Lanzamiento[] }
  >();
  const diaLocal = (ms: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(ms);
  for (const l of lista) {
    const conDia = tieneHora(l) || l.precision === 'DAY';
    const clave = conDia ? diaLocal(l.net) : `~${diaLocal(l.net).slice(0, 7)}`;
    const g = grupos.get(clave) ?? { clave, conDia, lanzamientos: [] };
    g.lanzamientos.push(l);
    grupos.set(clave, g);
  }
  return [...grupos.values()].sort(
    (a, b) =>
      Number(b.conDia) - Number(a.conDia) ||
      a.lanzamientos[0].net - b.lanzamientos[0].net,
  );
}

/** El próximo lanzamiento con hora exacta que aún no despegó, o que despegó hace menos de una hora. */
export function siguienteConHora(
  lista: Lanzamiento[],
  ahora: number,
): Lanzamiento | null {
  return lista.find((l) => tieneHora(l) && l.net > ahora - 3_600_000) ?? null;
}
