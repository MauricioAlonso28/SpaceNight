import type { FilaLinea } from '../../componentes/LineaNoche/LineaNoche';
import {
  fraccionVentana,
  tramos,
  type Posicion,
  type VentanaNoche,
} from '../../servicios/astro/noche';
import type { NochePlaneta } from '../../servicios/astro/planetas';
import type { PasoISS } from '../../servicios/satelites/iss';
import { nombreAstro, nombrePlaneta } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import { PISTA_PLANETA } from './textosPlanetas';

const ES = {
  bajo: (n: string) => `${n}: bajo el horizonte toda la noche`,
  tramo: (a: string, b: string) => `de ${a} a ${b}`,
  y: ' y ',
  sobre: (n: string, partes: string) => `${n} sobre el horizonte ${partes}`,
  estacion: 'Estación',
  noPasa: 'La Estación Espacial no pasa a la vista esta noche',
  pasa: (horas: string[]) =>
    `La Estación Espacial pasa a la vista a las ${horas.join(' y a las ')}`,
  cielo: 'Cielo oscuro',
  cieloDescripcion: 'Del atardecer a la noche cerrada y de vuelta al amanecer',
  laLuna: 'La Luna',
};

const EN: typeof ES = {
  bajo: (n) => `${n}: below the horizon all night`,
  tramo: (a, b) => `from ${a} to ${b}`,
  y: ' and ',
  sobre: (n, partes) => `${n} above the horizon ${partes}`,
  estacion: 'Station',
  noPasa: 'The Space Station does not pass in view tonight',
  pasa: (horas) =>
    `The Space Station passes in view at ${horas.join(' and at ')}`,
  cielo: 'Dark sky',
  cieloDescripcion: 'From sunset to full darkness and back to dawn',
  laLuna: 'The Moon',
};

function t() {
  return textos({ es: ES, en: EN });
}

const TONOS_CIELO: readonly [number, [number, number, number]][] = [
  [0, [154, 112, 144]],
  [-6, [58, 52, 120]],
  [-12, [18, 24, 69]],
  [-18, [5, 9, 32]],
];

/** Color del cielo según la altura del Sol: rosado al ponerse, negro en noche cerrada. */
export function colorCielo(alturaSol: number): string {
  if (alturaSol >= TONOS_CIELO[0][0]) return `rgb(${TONOS_CIELO[0][1]})`;
  for (let i = 1; i < TONOS_CIELO.length; i++) {
    const [h1, c1] = TONOS_CIELO[i];
    const [h0, c0] = TONOS_CIELO[i - 1];
    if (alturaSol >= h1) {
      const t = (h0 - alturaSol) / (h0 - h1);
      return `rgb(${c0.map((v, k) => Math.round(v + (c1[k] - v) * t))})`;
    }
  }
  return `rgb(${TONOS_CIELO[TONOS_CIELO.length - 1][1]})`;
}

/** Degradado de la fila Cielo oscuro con una parada por muestra. */
export function degradadoCielo(sol: Posicion[]): string {
  const ultimo = sol.length - 1;
  const paradas = sol.map(
    (p, i) => `${colorCielo(p.altura)} ${((i / ultimo) * 100).toFixed(1)}%`,
  );
  return `linear-gradient(90deg, ${paradas.join(', ')})`;
}

/** Tramos sobre el horizonte, en fracciones de la ventana. */
export function tramosSobreHorizonte(
  instantes: Date[],
  posiciones: Posicion[],
  ventana: VentanaNoche,
): { desde: number; hasta: number }[] {
  return tramos(
    instantes,
    posiciones.map((p) => p.altura > 0),
  ).map((t) => ({
    desde: fraccionVentana(t.desde, ventana),
    hasta: fraccionVentana(t.hasta, ventana),
  }));
}

function describir(
  nombre: string,
  lista: { desde: number; hasta: number }[],
  hora: (fraccion: number) => string,
): string {
  if (lista.length === 0) return t().bajo(nombre);
  const partes = lista.map((x) => t().tramo(hora(x.desde), hora(x.hasta)));
  return t().sobre(nombre, partes.join(t().y));
}

/**
 * Fila de la Estación: un punto por cada paso visible que empieza dentro de la noche.
 * @param pasos todos los pasos calculados, o null si esa noche queda fuera de la predicción
 */
export function filaEstacion(
  pasos: PasoISS[] | null,
  ventana: VentanaNoche,
  hora: (fraccion: number) => string,
): FilaLinea | null {
  if (!pasos) return null;
  const puntos = pasos
    .map((p) => fraccionVentana(p.aparece.fecha, ventana))
    .filter((f) => f >= 0 && f <= 1);
  return {
    clave: 'estacion',
    nombre: t().estacion,
    descripcion: puntos.length === 0 ? t().noPasa : t().pasa(puntos.map(hora)),
    puntos,
  };
}

/**
 * Filas de la línea: cielo, Luna, cada planeta visible y la Estación.
 * @param hora convierte una fracción de la ventana en texto de hora
 * @param estacion pasos de la Estación, o null si esa noche no tiene predicción
 */
export function filasNoche(
  ventana: VentanaNoche,
  instantes: Date[],
  sol: Posicion[],
  luna: Posicion[],
  planetas: NochePlaneta[],
  hora: (fraccion: number) => string,
  estacion: PasoISS[] | null = null,
): FilaLinea[] {
  const tramosLuna = tramosSobreHorizonte(instantes, luna, ventana);
  const filas: FilaLinea[] = [
    {
      clave: 'cielo',
      nombre: t().cielo,
      descripcion: t().cieloDescripcion,
      degradado: degradadoCielo(sol),
    },
    {
      clave: 'luna',
      nombre: nombreAstro('luna'),
      descripcion: describir(t().laLuna, tramosLuna, hora),
      color: '#efe6cc',
      tramos: tramosLuna,
    },
  ];
  for (const p of planetas.filter((x) => x.visible)) {
    const lista = tramosSobreHorizonte(instantes, p.muestras, ventana);
    filas.push({
      clave: p.planeta,
      nombre: nombrePlaneta(p.planeta),
      descripcion: describir(nombrePlaneta(p.planeta), lista, hora),
      color: PISTA_PLANETA[p.planeta],
      tramos: lista,
    });
  }
  const filaIss = filaEstacion(estacion, ventana, hora);
  if (filaIss) filas.push(filaIss);
  return filas;
}
