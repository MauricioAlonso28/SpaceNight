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
  const redondeado = Math.round(n * 10) / 10 || 0;
  return redondeado.toFixed(1).replace('.', ',').replace('-', '−');
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

/** Nombre en español de la constelación de una estrella, por su abreviatura (Ori, Cru…). */
export function nombreConstelacion(
  abreviatura: string,
  constelaciones: Constelacion[],
): string {
  return (
    constelaciones.find((c) => c.id === abreviatura)?.nombre ?? abreviatura
  );
}

function fichaCuerpo(c: CuerpoConDatos): Ficha {
  const subtitulos = {
    Planeta: 'Planeta',
    Luna: 'Satélite de la Tierra',
    Sol: 'Estrella',
  };
  return {
    titulo: c.nombre,
    subtitulo: subtitulos[c.tipo],
    datos: [
      ['Magnitud', decimal(c.magnitud)],
      ...posicionTexto(c.altura, c.azimut),
    ],
  };
}

function fichaEstrella(
  fila: FilaEstrella,
  constelaciones: Constelacion[],
  matriz: number[],
): Ficha {
  const [ar, dec, mag, , nombre, designacion, con] = fila;
  const h = horizontalDe(aplicar(matriz, vectorEcuatorial(ar, dec)));
  return {
    titulo: nombre || designacion || 'Estrella',
    subtitulo: [
      nombre && designacion,
      `Estrella de ${nombreConstelacion(con, constelaciones)}`,
    ]
      .filter(Boolean)
      .join(' · '),
    datos: [['Magnitud', decimal(mag)], ...posicionTexto(h.altura, h.azimut)],
  };
}

function fichaConstelacion(
  c: Constelacion,
  estrellas: FilaEstrella[],
  matriz: number[],
): Ficha {
  const h = horizontalDe(aplicar(matriz, vectorEcuatorial(...c.centro)));
  const brillante = estrellas.find((e) => e[6] === c.id);
  const estrella: [string, string][] = brillante
    ? [
        [
          'Estrella más brillante',
          `${brillante[4] || brillante[5]} (${decimal(brillante[2])})`,
        ],
      ]
    : [];
  return {
    titulo: c.nombre,
    subtitulo: `Constelación · ${c.latin}`,
    datos: [...estrella, ...posicionTexto(h.altura, h.azimut)],
  };
}

/**
 * Ficha de lo que se tocó: estrella del catálogo, constelación o cuerpo del sistema solar.
 * @param estrellas ordenadas de la más brillante a la más débil, como vienen del JSON
 * @param matriz la orientación actual del cielo, para la altura y la dirección
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
    return c ? fichaCuerpo(c) : null;
  }
  if (s.tipo === 'constelacion') {
    const c = constelaciones.find((x) => x.id === s.id);
    return c ? fichaConstelacion(c, estrellas, matriz) : null;
  }
  const fila = estrellas[s.indice];
  return fila ? fichaEstrella(fila, constelaciones, matriz) : null;
}
