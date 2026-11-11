import type { ItemEvento } from '../../componentes/ListaEventos/ListaEventos';
import { nombrePlaneta, nombreRumbo } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import type { Evento, Lluvia } from '../../servicios/astro/eventos';
import { rumbo } from '../../servicios/astro/planetas';
import {
  formatearDecimal,
  formatearDiaMes,
  formatearDiaSemana,
  formatearNumero,
} from '../../servicios/formato';
import type { PasoISS } from '../../servicios/satelites/iss';
import { MS_DIA, inicioDelDia } from '../../servicios/tiempo';
import { horaConArticulo } from './textosPlanetas';

/** Formato de cada evento: hora con artículo y día con mes. */
export interface FormatoEventos {
  zona: string;
  formato24h: boolean;
}

const ES = {
  clase: {
    penumbral: 'penumbral',
    partial: 'parcial',
    annular: 'anular',
    total: 'total',
  } as Record<string, string>,
  aLaHora: (h: string) => `a ${h}`,
  hoy: 'hoy',
  manana: 'mañana',
  elDia: (d: string) => `el ${d}`,
  porEl: (r: string) => `por el ${r}`,
  delAl: (de: string, a: string) => `del ${de} al ${a}`,
  issTitulo: (cuando: string, hora: string) =>
    `La Estación Espacial pasa ${cuando} ${hora}`,
  issDetalle: (min: number, recorrido: string, altura: number) =>
    `${min === 1 ? 'Se ve apenas un minuto' : `Se ve unos ${min} minutos`}, ${recorrido}, hasta ${altura}° de altura. Es el punto brillante que cruza sin parpadear.`,
  lluviaHoy: (n: string) => `Hoy es el pico de las ${n}`,
  lluviaManana: (n: string) => `Mañana es el pico de las ${n}`,
  lluviaFaltan: (dias: number, n: string) =>
    `Faltan ${dias} días para las ${n}`,
  radianteNoSale: 'Su radiante no sale desde aquí: casi no se verán.',
  radianteBajo: 'Su radiante queda bajo desde aquí, así que se verán pocos.',
  radianteAlto: 'Mira después de medianoche, cuando el radiante está más alto.',
  lluviaDetalle: (dia: string, tasa: number, consejo: string) =>
    `Pico el ${dia}. En cielo oscuro, hasta ${tasa} meteoros por hora; desde la ciudad se ven bastantes menos. ${consejo}`,
  eclipseLuna: (clase: string, dia: string) =>
    `Eclipse ${clase} de Luna el ${dia}`,
  eclipseLunaDetalle: (entero: boolean, hora: string, penumbral: boolean) =>
    `${entero ? 'Se ve entero desde aquí' : 'Desde aquí se ve solo una parte, con la Luna baja'}; el máximo es ${hora}.${penumbral ? ' Es penumbral: la Luna apenas se oscurece.' : ''}`,
  eclipseSol: (clase: string, dia: string) =>
    `Eclipse ${clase} de Sol el ${dia}`,
  eclipseSolDetalle: (pct: number, hora: string) =>
    `Desde aquí la Luna tapa el ${pct} % del Sol, con el máximo ${hora}. Nunca lo mires sin filtro solar.`,
  superluna: (dia: string) => `Superluna el ${dia}`,
  superlunaDetalle: (km: string) =>
    `La luna llena coincide con su punto más cercano a la Tierra, a ${km} km: se ve algo más grande y brillante.`,
  conjuncion: (a: string, b: string, dia: string) =>
    `${a} y ${b} muy juntos el ${dia}`,
  conjuncionDetalle: (grados: string) =>
    `A ${grados}° uno del otro, menos que el ancho de dos dedos con el brazo estirado.`,
};

const EN: typeof ES = {
  clase: {
    penumbral: 'penumbral',
    partial: 'partial',
    annular: 'annular',
    total: 'total',
  },
  aLaHora: (h) => `at ${h}`,
  hoy: 'today',
  manana: 'tomorrow',
  elDia: (d) => `on ${d}`,
  porEl: (r) => `across the ${r}`,
  delAl: (de, a) => `from ${de} to ${a}`,
  issTitulo: (cuando, hora) => `The Space Station passes ${cuando} ${hora}`,
  issDetalle: (min, recorrido, altura) =>
    `${min === 1 ? 'Visible for barely a minute' : `Visible for about ${min} minutes`}, ${recorrido}, up to ${altura}° high. It is the bright dot that crosses without blinking.`,
  lluviaHoy: (n) => `Today is the peak of the ${n}`,
  lluviaManana: (n) => `Tomorrow is the peak of the ${n}`,
  lluviaFaltan: (dias, n) => `${dias} days until the ${n}`,
  radianteNoSale: 'Its radiant never rises from here: you will hardly see any.',
  radianteBajo: 'Its radiant stays low from here, so you will see few.',
  radianteAlto: 'Look after midnight, when the radiant is highest.',
  lluviaDetalle: (dia, tasa, consejo) =>
    `Peaks on ${dia}. Under a dark sky, up to ${tasa} meteors an hour; from the city you see far fewer. ${consejo}`,
  eclipseLuna: (clase, dia) => `${mayuscula(clase)} lunar eclipse on ${dia}`,
  eclipseLunaDetalle: (entero, hora, penumbral) =>
    `${entero ? 'Fully visible from here' : 'Only partly visible from here, with the Moon low'}; the maximum is ${hora}.${penumbral ? ' It is penumbral: the Moon barely darkens.' : ''}`,
  eclipseSol: (clase, dia) => `${mayuscula(clase)} solar eclipse on ${dia}`,
  eclipseSolDetalle: (pct, hora) =>
    `From here the Moon covers ${pct}% of the Sun, with the maximum ${hora}. Never look at it without a solar filter.`,
  superluna: (dia) => `Supermoon on ${dia}`,
  superlunaDetalle: (km) =>
    `The full moon coincides with its closest point to the Earth, ${km} km away: it looks a little bigger and brighter.`,
  conjuncion: (a, b, dia) => `${a} and ${b} close together on ${dia}`,
  conjuncionDetalle: (grados) =>
    `${grados}° apart, less than the width of two fingers at arm's length.`,
};

/** La misma palabra con la primera letra en mayúscula. */
export function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function t() {
  return textos({ es: ES, en: EN });
}

/** Clase de eclipse traducida: parcial, anular, total o penumbral. */
export function claseEclipse(clase: string): string {
  return t().clase[clase] ?? clase;
}

/** Nombre de una lluvia de meteoros en el idioma actual. */
export function nombreLluvia(lluvia: Lluvia): string {
  return textos({ es: lluvia.nombre, en: lluvia.nombreEn });
}

function aLaHora(fecha: Date, f: FormatoEventos): string {
  return t().aLaHora(horaConArticulo(fecha, f.zona, f.formato24h));
}

function cuandoPasa(fecha: Date, hoy: Date, f: FormatoEventos): string {
  const dia = inicioDelDia(fecha, f.zona).getTime();
  const dias = Math.round((dia - hoy.getTime()) / MS_DIA);
  if (dias === 0) return t().hoy;
  if (dias === 1) return t().manana;
  return t().elDia(formatearDiaSemana(fecha, f.zona));
}

/**
 * Paso visible de la Estación: cuándo, cuánto dura, de dónde a dónde y a qué altura.
 * @param hoy medianoche del día que se está mirando
 */
export function itemPasoISS(
  paso: PasoISS,
  hoy: Date,
  f: FormatoEventos,
): ItemEvento {
  const inicio = paso.aparece.fecha;
  const minutos = Math.max(
    1,
    Math.round((paso.desaparece.fecha.getTime() - inicio.getTime()) / 60_000),
  );
  const de = nombreRumbo(rumbo(paso.aparece.azimut));
  const a = nombreRumbo(rumbo(paso.desaparece.azimut));
  const recorrido = de === a ? t().porEl(de) : t().delAl(de, a);
  return {
    clave: `iss-${inicio.getTime()}`,
    icono: '🛰️',
    titulo: t().issTitulo(cuandoPasa(inicio, hoy, f), aLaHora(inicio, f)),
    detalle: t().issDetalle(minutos, recorrido, Math.round(paso.maximo.altura)),
  };
}

function tituloLluvia(dias: number, nombre: string): string {
  if (dias <= 0) return t().lluviaHoy(nombre);
  if (dias === 1) return t().lluviaManana(nombre);
  return t().lluviaFaltan(dias, nombre);
}

function consejoRadiante(altura: number): string {
  if (altura <= 0) return t().radianteNoSale;
  if (altura < 25) return t().radianteBajo;
  return t().radianteAlto;
}

function itemLluvia(
  fecha: Date,
  lluvia: Lluvia,
  alturaRadiante: number,
  hoy: Date,
  f: FormatoEventos,
): ItemEvento {
  const dias = Math.round((fecha.getTime() - hoy.getTime()) / MS_DIA);
  return {
    clave: `lluvia-${lluvia.codigo}-${lluvia.pico}`,
    icono: '☄️',
    titulo: tituloLluvia(dias, nombreLluvia(lluvia)),
    detalle: t().lluviaDetalle(
      formatearDiaMes(fecha, f.zona),
      lluvia.tasa,
      consejoRadiante(alturaRadiante),
    ),
  };
}

/**
 * Título y detalle de un evento, listos para la lista.
 * @param hoy medianoche del día que se está mirando, para contar los días que faltan
 */
export function itemEvento(
  e: Evento,
  hoy: Date,
  f: FormatoEventos,
): ItemEvento {
  const dia = formatearDiaMes(e.fecha, f.zona);
  const clave = `${e.tipo}-${e.fecha.getTime()}`;
  switch (e.tipo) {
    case 'lluvia':
      return itemLluvia(e.fecha, e.lluvia, e.alturaRadiante, hoy, f);
    case 'iss':
      return itemPasoISS(e.paso, hoy, f);
    case 'eclipse-luna':
      return {
        clave,
        icono: '🌘',
        titulo: t().eclipseLuna(claseEclipse(e.clase), dia),
        detalle: t().eclipseLunaDetalle(
          e.visible === 'entero',
          aLaHora(e.fecha, f),
          e.clase === 'penumbral',
        ),
      };
    case 'eclipse-sol':
      return {
        clave,
        icono: '🌗',
        titulo: t().eclipseSol(claseEclipse(e.clase), dia),
        detalle: t().eclipseSolDetalle(
          Math.round(e.oscurecimiento * 100),
          aLaHora(e.fecha, f),
        ),
      };
    case 'superluna':
      return {
        clave,
        icono: '🌕',
        titulo: t().superluna(dia),
        detalle: t().superlunaDetalle(formatearNumero(e.distanciaKm)),
      };
    case 'conjuncion':
      return {
        clave,
        icono: '✨',
        titulo: t().conjuncion(nombrePlaneta(e.a), nombrePlaneta(e.b), dia),
        detalle: t().conjuncionDetalle(formatearDecimal(e.separacion)),
      };
  }
}
