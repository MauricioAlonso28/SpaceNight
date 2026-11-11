import type { ItemEvento } from '../../componentes/ListaEventos/ListaEventos';
import type { Evento, Lluvia } from '../../servicios/astro/eventos';
import { rumbo } from '../../servicios/astro/planetas';
import {
  formatearDiaMes,
  formatearDiaSemana,
  formatearHora,
} from '../../servicios/formato';
import type { PasoISS } from '../../servicios/satelites/iss';
import { MS_DIA, inicioDelDia } from '../../servicios/tiempo';
import { NOMBRE_PLANETA, RUMBO_LARGO, articuloHora } from './textosPlanetas';

const CLASE_ECLIPSE: Record<string, string> = {
  penumbral: 'penumbral',
  partial: 'parcial',
  annular: 'anular',
  total: 'total',
};

/** Formato de cada evento: hora con artículo y día con mes. */
export interface FormatoEventos {
  zona: string;
  formato24h: boolean;
}

function aLaHora(fecha: Date, f: FormatoEventos): string {
  const art = articuloHora(fecha, f.zona, f.formato24h);
  return `a ${art} ${formatearHora(fecha, f.zona, f.formato24h)}`;
}

function decimal(n: number): string {
  return n.toFixed(1).replace('.', ',');
}

const RUMBO_SIN_ARTICULO: Record<string, string> = Object.fromEntries(
  Object.entries(RUMBO_LARGO).map(([k, v]) => [k, v.replace(/^el /, '')]),
);

function cuandoPasa(fecha: Date, hoy: Date, f: FormatoEventos): string {
  const dia = inicioDelDia(fecha, f.zona).getTime();
  const dias = Math.round((dia - hoy.getTime()) / MS_DIA);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  return `el ${formatearDiaSemana(fecha, f.zona)}`;
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
  const de = RUMBO_SIN_ARTICULO[rumbo(paso.aparece.azimut)];
  const a = RUMBO_SIN_ARTICULO[rumbo(paso.desaparece.azimut)];
  const recorrido = de === a ? `por el ${de}` : `del ${de} al ${a}`;
  return {
    clave: `iss-${inicio.getTime()}`,
    icono: '🛰️',
    titulo: `La Estación Espacial pasa ${cuandoPasa(inicio, hoy, f)} ${aLaHora(inicio, f)}`,
    detalle: `${minutos === 1 ? 'Se ve apenas un minuto' : `Se ve unos ${minutos} minutos`}, ${recorrido}, hasta ${Math.round(paso.maximo.altura)}° de altura. Es el punto brillante que cruza sin parpadear.`,
  };
}

function tituloLluvia(dias: number, nombre: string): string {
  if (dias <= 0) return `Hoy es el pico de las ${nombre}`;
  if (dias === 1) return `Mañana es el pico de las ${nombre}`;
  return `Faltan ${dias} días para las ${nombre}`;
}

function consejoRadiante(altura: number): string {
  if (altura <= 0) return 'Su radiante no sale desde aquí: casi no se verán.';
  if (altura < 25)
    return 'Su radiante queda bajo desde aquí, así que se verán pocos.';
  return 'Mira después de medianoche, cuando el radiante está más alto.';
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
    titulo: tituloLluvia(dias, lluvia.nombre),
    detalle: `Pico el ${formatearDiaMes(fecha, f.zona)}. En cielo oscuro, hasta ${lluvia.tasa} meteoros por hora; desde la ciudad se ven bastantes menos. ${consejoRadiante(alturaRadiante)}`,
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
        titulo: `Eclipse ${CLASE_ECLIPSE[e.clase] ?? e.clase} de Luna el ${dia}`,
        detalle: `${e.visible === 'entero' ? 'Se ve entero desde aquí' : 'Desde aquí se ve solo una parte, con la Luna baja'}; el máximo es ${aLaHora(e.fecha, f)}.${e.clase === 'penumbral' ? ' Es penumbral: la Luna apenas se oscurece.' : ''}`,
      };
    case 'eclipse-sol':
      return {
        clave,
        icono: '🌗',
        titulo: `Eclipse ${CLASE_ECLIPSE[e.clase] ?? e.clase} de Sol el ${dia}`,
        detalle: `Desde aquí la Luna tapa el ${Math.round(e.oscurecimiento * 100)} % del Sol, con el máximo ${aLaHora(e.fecha, f)}. Nunca lo mires sin filtro solar.`,
      };
    case 'superluna':
      return {
        clave,
        icono: '🌕',
        titulo: `Superluna el ${dia}`,
        detalle: `La luna llena coincide con su punto más cercano a la Tierra, a ${Math.round(e.distanciaKm).toLocaleString('es-PE')} km: se ve algo más grande y brillante.`,
      };
    case 'conjuncion':
      return {
        clave,
        icono: '✨',
        titulo: `${NOMBRE_PLANETA[e.a]} y ${NOMBRE_PLANETA[e.b]} muy juntos el ${dia}`,
        detalle: `A ${decimal(e.separacion)}° uno del otro, menos que el ancho de dos dedos con el brazo estirado.`,
      };
  }
}
