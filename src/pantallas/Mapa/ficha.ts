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
import { rumboLargo } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import { formatearDecimal } from '../../servicios/formato';
import type { CuerpoConDatos } from './cuerpos';

/** El contenido de la ficha que se abre al tocar un objeto. */
export interface Ficha {
  titulo: string;
  subtitulo: string;
  datos: [string, string][];
}

const ES = {
  ahora: 'Ahora',
  bajo: (r: string) => `bajo el horizonte, hacia ${r}`,
  altura: 'Altura',
  direccion: 'Dirección',
  hacia: (r: string) => `hacia ${r}`,
  magnitud: 'Magnitud',
  tipo: { Planeta: 'Planeta', Luna: 'Satélite de la Tierra', Sol: 'Estrella' },
  estrella: 'Estrella',
  estrellaDe: (c: string) => `Estrella de ${c}`,
  masBrillante: 'Estrella más brillante',
  constelacion: (latin: string) => `Constelación · ${latin}`,
};

const EN: typeof ES = {
  ahora: 'Now',
  bajo: (r) => `below the horizon, toward ${r}`,
  altura: 'Altitude',
  direccion: 'Direction',
  hacia: (r) => `toward ${r}`,
  magnitud: 'Magnitude',
  tipo: { Planeta: 'Planet', Luna: "Earth's satellite", Sol: 'Star' },
  estrella: 'Star',
  estrellaDe: (c) => `Star in ${c}`,
  masBrillante: 'Brightest star',
  constelacion: () => 'Constellation',
};

function t() {
  return textos({ es: ES, en: EN });
}

const decimal = (n: number) => formatearDecimal(n);

function posicionTexto(altura: number, azimut: number): [string, string][] {
  const lado = rumboLargo(rumbo(azimut));
  if (altura < 0) return [[t().ahora, t().bajo(lado)]];
  return [
    [t().altura, `${Math.round(altura)}°`],
    [t().direccion, t().hacia(lado)],
  ];
}

/** Nombre de la constelación de una estrella, por su abreviatura (Ori, Cru…). */
export function nombreConstelacion(
  abreviatura: string,
  constelaciones: Constelacion[],
): string {
  return (
    constelaciones.find((c) => c.id === abreviatura)?.nombre ?? abreviatura
  );
}

function fichaCuerpo(c: CuerpoConDatos): Ficha {
  return {
    titulo: c.nombre,
    subtitulo: t().tipo[c.tipo],
    datos: [
      [t().magnitud, decimal(c.magnitud)],
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
    titulo: nombre || designacion || t().estrella,
    subtitulo: [
      nombre && designacion,
      t().estrellaDe(nombreConstelacion(con, constelaciones)),
    ]
      .filter(Boolean)
      .join(' · '),
    datos: [[t().magnitud, decimal(mag)], ...posicionTexto(h.altura, h.azimut)],
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
          t().masBrillante,
          `${brillante[4] || brillante[5]} (${decimal(brillante[2])})`,
        ],
      ]
    : [];
  return {
    titulo: c.nombre,
    subtitulo: t().constelacion(c.latin),
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
