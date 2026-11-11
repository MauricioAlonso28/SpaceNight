const G0 = 9.80665;

/** Los combustibles que se pueden elegir. */
export type Combustible = 'queroseno' | 'metano' | 'hidrogeno' | 'solido';

/**
 * Lo que aporta cada combustible.
 * @property ispBase eficiencia media de una primera etapa, entre el nivel del mar y el vacío, en s
 * @property ispVacio eficiencia de una etapa superior con tobera de vacío, en s
 * @property densidad densidad media de la mezcla, en kg/m³
 * @property estructura masa del tanque y la estructura por cada kg de propelente
 * @property motor empuje en kN y masa en t de un motor típico
 */
export const COMBUSTIBLES: Record<
  Combustible,
  {
    ispBase: number;
    ispVacio: number;
    densidad: number;
    estructura: number;
    motor: { nombre: string; empuje: number; masa: number };
    color: string;
  }
> = {
  queroseno: {
    ispBase: 300,
    ispVacio: 348,
    densidad: 1_030,
    estructura: 0.065,
    motor: { nombre: 'Merlin', empuje: 845, masa: 0.47 },
    color: '#ff9f6b',
  },
  metano: {
    ispBase: 340,
    ispVacio: 380,
    densidad: 830,
    estructura: 0.07,
    motor: { nombre: 'Raptor', empuje: 2_300, masa: 1.6 },
    color: '#7bd389',
  },
  hidrogeno: {
    ispBase: 410,
    ispVacio: 450,
    densidad: 360,
    estructura: 0.12,
    motor: { nombre: 'RS-25', empuje: 1_860, masa: 3.5 },
    color: '#8fb4ff',
  },
  solido: {
    ispBase: 265,
    ispVacio: 290,
    densidad: 1_800,
    estructura: 0.12,
    motor: { nombre: 'motor sólido', empuje: 4_000, masa: 0 },
    color: '#c77dff',
  },
};

/** Una etapa elegida: combustible, propelente en t y cuántos motores. */
export interface EtapaDiseno {
  combustible: Combustible;
  propelente: number;
  motores: number;
}

/** Destinos con el Δv total desde el suelo para ponerse en camino hacia ellos, en m/s, contando las pérdidas típicas por gravedad y aire. */
export const DESTINOS = [
  { id: 'leo', dv: 9_400, nombre: { es: 'Órbita baja', en: 'Low orbit' } },
  {
    id: 'gto',
    dv: 11_800,
    nombre: { es: 'Órbita geoestacionaria', en: 'Geostationary orbit' },
  },
  {
    id: 'luna',
    dv: 12_550,
    nombre: { es: 'La Luna', en: 'The Moon' },
  },
  {
    id: 'marte',
    dv: 13_000,
    nombre: { es: 'Marte', en: 'Mars' },
  },
  {
    id: 'jupiter',
    dv: 15_700,
    nombre: { es: 'Júpiter', en: 'Jupiter' },
  },
] as const;

/** Cálculo de una etapa: masas en t, Δv en m/s y empuje en kN. */
export interface EtapaCalculada {
  seca: number;
  inicial: number;
  final: number;
  isp: number;
  dv: number;
  empuje: number;
  empujePeso: number;
}

/**
 * Aplica la ecuación de Tsiolkovsky etapa por etapa: cada una carga con todo lo que va encima.
 * @param carga masa de la carga útil en t
 * @returns cada etapa de abajo hacia arriba, el Δv total, la masa al despegar y el empuje sobre el peso al despegar
 */
export function calcularCohete(etapas: EtapaDiseno[], carga: number) {
  const calculadas: EtapaCalculada[] = [];
  let encima = carga;
  for (let i = etapas.length - 1; i >= 0; i--) {
    const e = etapas[i];
    const c = COMBUSTIBLES[e.combustible];
    const seca = e.propelente * c.estructura + e.motores * c.motor.masa;
    const inicial = encima + seca + e.propelente;
    const final = encima + seca;
    const isp = i === 0 ? c.ispBase : c.ispVacio;
    const empuje = e.motores * c.motor.empuje * (i === 0 ? 1 : 1.1);
    calculadas.unshift({
      seca,
      inicial,
      final,
      isp,
      dv: isp * G0 * Math.log(inicial / final),
      empuje,
      empujePeso: (empuje * 1000) / (inicial * 1000 * G0),
    });
    encima = inicial;
  }
  const dv = calculadas.reduce((s, e) => s + e.dv, 0);
  const despega = calculadas.length > 0 && calculadas[0].empujePeso >= 1.15;
  return { etapas: calculadas, dv, masa: encima, despega };
}

/** Hasta qué destinos llega un Δv, si despega. */
export function destinosAlcanzados(dv: number, despega: boolean) {
  return DESTINOS.filter((d) => despega && dv >= d.dv).map((d) => d.id);
}

/** Alto en metros de una etapa a partir del volumen de su propelente y su diámetro, más el tramo de motores. */
export function altoEtapa(e: EtapaDiseno, diametro: number): number {
  const volumen = (e.propelente * 1000) / COMBUSTIBLES[e.combustible].densidad;
  return volumen / (Math.PI * (diametro / 2) ** 2) + 3;
}

/** Diámetro del cohete según los motores de la primera etapa, entre 1,2 y 10 m. */
export function diametroCohete(etapas: EtapaDiseno[]): number {
  const base = etapas[0];
  if (!base) return 3;
  const area =
    base.motores * (COMBUSTIBLES[base.combustible].motor.empuje / 845) * 1.1;
  return Math.min(10, Math.max(1.2, Math.sqrt(area) * 1.25));
}

/** Diseños de partida para probar. */
export const MODELOS: {
  id: string;
  nombre: { es: string; en: string };
  etapas: EtapaDiseno[];
  carga: number;
}[] = [
  {
    id: 'falcon',
    nombre: { es: 'Tipo Falcon 9', en: 'Falcon 9-like' },
    etapas: [
      { combustible: 'queroseno', propelente: 396, motores: 9 },
      { combustible: 'queroseno', propelente: 93, motores: 1 },
    ],
    carga: 15,
  },
  {
    id: 'starship',
    nombre: { es: 'Tipo Starship', en: 'Starship-like' },
    etapas: [
      { combustible: 'metano', propelente: 3_400, motores: 33 },
      { combustible: 'metano', propelente: 1_200, motores: 6 },
    ],
    carga: 100,
  },
  {
    id: 'luna',
    nombre: { es: 'Tres etapas', en: 'Three stages' },
    etapas: [
      { combustible: 'queroseno', propelente: 1_100, motores: 24 },
      { combustible: 'hidrogeno', propelente: 300, motores: 3 },
      { combustible: 'hidrogeno', propelente: 70, motores: 1 },
    ],
    carga: 20,
  },
  {
    id: 'una',
    nombre: { es: 'Una sola etapa', en: 'Single stage' },
    etapas: [{ combustible: 'queroseno', propelente: 500, motores: 9 }],
    carga: 5,
  },
];
