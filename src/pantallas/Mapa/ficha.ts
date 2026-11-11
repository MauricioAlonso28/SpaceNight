import type { Seleccion } from '../../3d/escenaMapa';
import {
  aplicar,
  horizontalDe,
  vectorEcuatorial,
} from '../../servicios/astro/cielo';
import type {
  Constelacion,
  FilaEstrella,
} from '../../servicios/astro/estrellas';
import { rumbo } from '../../servicios/astro/planetas';
import { RUMBO_LARGO } from '../EstaNoche/textosPlanetas';
import type { CuerpoConDatos } from './cuerpos';

/** El contenido de la ficha que se abre al tocar un objeto. */
export interface Ficha {
  titulo: string;
  subtitulo: string;
  datos: [string, string][];
}

function decimal(n: number): string {
  return n.toFixed(1).replace('.', ',').replace('-', '−');
}

function posicionTexto(altura: number, azimut: number): [string, string][] {
  if (altura < 0) {
    return [
      ['Ahora', `bajo el horizonte, hacia ${RUMBO_LARGO[rumbo(azimut)]}`],
    ];
  }
  return [
    ['Altura', `${Math.round(altura)}°`],
    ['Dirección', `hacia ${RUMBO_LARGO[rumbo(azimut)]}`],
  ];
}

/**
 * Ficha de lo que se tocó: estrella del catálogo o cuerpo del sistema solar.
 * @param matriz la orientación actual del cielo, para la altura y la dirección de las estrellas
 */
export function fichaDe(
  s: Seleccion,
  estrellas: FilaEstrella[],
  constelaciones: Constelacion[],
  cuerpos: CuerpoConDatos[],
  matriz: number[],
): Ficha | null {
  if (s.tipo === 'cuerpo') {
    const c = cuerpos.find((x) => x.clave === s.clave);
    if (!c) return null;
    return {
      titulo: c.nombre,
      subtitulo:
        c.tipo === 'Planeta'
          ? 'Planeta'
          : c.tipo === 'Luna'
            ? 'Satélite de la Tierra'
            : 'Estrella',
      datos: [
        ['Magnitud', decimal(c.magnitud)],
        ...posicionTexto(c.altura, c.azimut),
      ],
    };
  }
  const [ar, dec, mag, , nombre, designacion, con] = estrellas[s.indice];
  const h = horizontalDe(aplicar(matriz, vectorEcuatorial(ar, dec)));
  const constelacion =
    constelaciones.find((c) => c.id === con || c.id.startsWith(con))?.nombre ??
    con;
  return {
    titulo: nombre || designacion || 'Estrella',
    subtitulo: [nombre && designacion, `Estrella de ${constelacion}`]
      .filter(Boolean)
      .join(' · '),
    datos: [['Magnitud', decimal(mag)], ...posicionTexto(h.altura, h.azimut)],
  };
}
