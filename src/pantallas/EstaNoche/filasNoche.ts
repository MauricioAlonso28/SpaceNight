import type { FilaLinea } from '../../componentes/LineaNoche/LineaNoche';
import {
  fraccionVentana,
  tramos,
  type Posicion,
  type VentanaNoche,
} from '../../servicios/astro/noche';
import type { NochePlaneta } from '../../servicios/astro/planetas';
import type { PasoISS } from '../../servicios/satelites/iss';
import { NOMBRE_PLANETA, PISTA_PLANETA } from './textosPlanetas';

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
  if (lista.length === 0) return `${nombre}: bajo el horizonte toda la noche`;
  const partes = lista.map((t) => `de ${hora(t.desde)} a ${hora(t.hasta)}`);
  return `${nombre} sobre el horizonte ${partes.join(' y ')}`;
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
    nombre: 'Estación',
    descripcion:
      puntos.length === 0
        ? 'La Estación Espacial no pasa a la vista esta noche'
        : `La Estación Espacial pasa a la vista a las ${puntos.map(hora).join(' y a las ')}`,
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
      nombre: 'Cielo oscuro',
      descripcion: 'Del atardecer a la noche cerrada y de vuelta al amanecer',
      degradado: degradadoCielo(sol),
    },
    {
      nombre: 'Luna',
      descripcion: describir('La Luna', tramosLuna, hora),
      color: '#efe6cc',
      tramos: tramosLuna,
    },
  ];
  for (const p of planetas.filter((x) => x.visible)) {
    const lista = tramosSobreHorizonte(instantes, p.muestras, ventana);
    filas.push({
      nombre: NOMBRE_PLANETA[p.planeta],
      descripcion: describir(NOMBRE_PLANETA[p.planeta], lista, hora),
      color: PISTA_PLANETA[p.planeta],
      tramos: lista,
    });
  }
  const filaIss = filaEstacion(estacion, ventana, hora);
  if (filaIss) filas.push(filaIss);
  return filas;
}
