import type { ItemEvento } from '../../componentes/ListaEventos/ListaEventos';
import type { Evento, Lluvia } from '../../servicios/astro/eventos';
import { formatearDiaMes, formatearHora } from '../../servicios/formato';
import { MS_DIA } from '../../servicios/tiempo';
import { NOMBRE_PLANETA, articuloHora } from './textosPlanetas';

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
