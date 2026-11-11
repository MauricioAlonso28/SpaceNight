import { nombrePlaneta } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import type { Cuarto } from '../../servicios/astro/calendario';
import { KM_POR_UA } from '../../servicios/astro/distancias';
import type { Evento } from '../../servicios/astro/eventos';
import { formatearNumero } from '../../servicios/formato';
import {
  claseEclipse,
  mayuscula,
  nombreLluvia,
} from '../EstaNoche/textosEventos';

export const DIAMETRO_TIERRA_KM = 12_742;

const ES = {
  cuarto: {
    nueva: 'Luna nueva',
    'cuarto-creciente': 'Cuarto creciente',
    llena: 'Luna llena',
    'cuarto-menguante': 'Cuarto menguante',
  } as Record<Cuarto, string>,
  pico: (n: string) => `Pico de las ${n}`,
  eclipseLuna: (clase: string, parcial: boolean) =>
    `Eclipse ${clase} de Luna${parcial ? ' (se ve en parte)' : ''}`,
  eclipseSol: (clase: string, pct: number) =>
    `Eclipse ${clase} de Sol (${pct} % tapado)`,
  superluna: 'Superluna',
  conjuncion: (a: string, b: string) => `${a} y ${b} muy juntos`,
  iss: 'Paso visible de la Estación Espacial',
  millones: (m: string, ua: string) => `${m} millones de km (${ua} UA)`,
  segundos: (s: string) => `${s} segundos`,
  minutos: (m: number) => `${m} ${m === 1 ? 'minuto' : 'minutos'}`,
  horas: (h: number, m: number) =>
    `${h} ${h === 1 ? 'hora' : 'horas'}${m ? ` y ${m} minutos` : ''}`,
  veces: (r: string) => `${r} veces la Tierra`,
  casi: 'casi como la Tierra',
  porcentaje: (p: string) => `${p} % del tamaño de la Tierra`,
};

const EN: typeof ES = {
  cuarto: {
    nueva: 'New Moon',
    'cuarto-creciente': 'First quarter',
    llena: 'Full Moon',
    'cuarto-menguante': 'Last quarter',
  },
  pico: (n) => `Peak of the ${n}`,
  eclipseLuna: (clase, parcial) =>
    `${mayuscula(clase)} lunar eclipse${parcial ? ' (partly visible)' : ''}`,
  eclipseSol: (clase, pct) =>
    `${mayuscula(clase)} solar eclipse (${pct}% covered)`,
  superluna: 'Supermoon',
  conjuncion: (a, b) => `${a} and ${b} close together`,
  iss: 'Visible Space Station pass',
  millones: (m, ua) => `${m} million km (${ua} AU)`,
  segundos: (s) => `${s} seconds`,
  minutos: (m) => `${m} ${m === 1 ? 'minute' : 'minutes'}`,
  horas: (h, m) =>
    `${h} ${h === 1 ? 'hour' : 'hours'}${m ? ` and ${m} minutes` : ''}`,
  veces: (r) => `${r} times the Earth`,
  casi: 'almost the size of the Earth',
  porcentaje: (p) => `${p}% of the Earth's size`,
};

function t() {
  return textos({ es: ES, en: EN });
}

/** Nombre de una de las cuatro fases principales. */
export function nombreCuarto(c: Cuarto): string {
  return t().cuarto[c];
}

/** Título corto de un evento para el calendario del mes. */
export function tituloCalendario(e: Evento): string {
  switch (e.tipo) {
    case 'lluvia':
      return t().pico(nombreLluvia(e.lluvia));
    case 'eclipse-luna':
      return t().eclipseLuna(claseEclipse(e.clase), e.visible === 'parcial');
    case 'eclipse-sol':
      return t().eclipseSol(
        claseEclipse(e.clase),
        Math.round(e.oscurecimiento * 100),
      );
    case 'superluna':
      return t().superluna;
    case 'conjuncion':
      return t().conjuncion(nombrePlaneta(e.a), nombrePlaneta(e.b));
    case 'iss':
      return t().iss;
  }
}

/** Distancia legible: kilómetros para la Luna, millones de km y unidades astronómicas para el resto. */
export function textoDistancia(km: number): string {
  if (km < 1_000_000) return `${formatearNumero(km)} km`;
  const millones = formatearNumero(km / 1_000_000, km < 100_000_000 ? 1 : 0);
  return t().millones(millones, formatearNumero(km / KM_POR_UA, 2));
}

/** Tiempo de luz como «1,3 segundos», «8 minutos» o «1 hora y 12 minutos». */
export function textoLuz(segundos: number): string {
  if (segundos < 60) return t().segundos(formatearNumero(segundos, 1));
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return t().minutos(minutos);
  return t().horas(Math.floor(minutos / 60), minutos % 60);
}

/** Tamaño comparado con la Tierra: «109 veces la Tierra» o «27 % del tamaño de la Tierra». */
export function textoTamano(diametroKm: number): string {
  const r = diametroKm / DIAMETRO_TIERRA_KM;
  if (r >= 1.5) return t().veces(formatearNumero(r, r < 10 ? 1 : 0));
  if (r >= 0.9) return t().casi;
  return t().porcentaje(formatearNumero(r * 100));
}
