import type { Evento } from '../../servicios/astro/eventos';
import type { Cuarto } from '../../servicios/astro/calendario';
import { formatearNumero } from '../../servicios/formato';
import { KM_POR_UA } from '../../servicios/astro/distancias';
import { NOMBRE_PLANETA } from '../EstaNoche/textosPlanetas';

export const DIAMETRO_TIERRA_KM = 12_742;

export const NOMBRE_CUARTO: Record<Cuarto, string> = {
  nueva: 'Luna nueva',
  'cuarto-creciente': 'Cuarto creciente',
  llena: 'Luna llena',
  'cuarto-menguante': 'Cuarto menguante',
};

const CLASE: Record<string, string> = {
  penumbral: 'penumbral',
  partial: 'parcial',
  annular: 'anular',
  total: 'total',
};

/** Título corto de un evento para el calendario del mes. */
export function tituloCalendario(e: Evento): string {
  switch (e.tipo) {
    case 'lluvia':
      return `Pico de las ${e.lluvia.nombre}`;
    case 'eclipse-luna':
      return `Eclipse ${CLASE[e.clase] ?? e.clase} de Luna${e.visible === 'parcial' ? ' (se ve en parte)' : ''}`;
    case 'eclipse-sol':
      return `Eclipse ${CLASE[e.clase] ?? e.clase} de Sol (${Math.round(e.oscurecimiento * 100)} % tapado)`;
    case 'superluna':
      return 'Superluna';
    case 'conjuncion':
      return `${NOMBRE_PLANETA[e.a]} y ${NOMBRE_PLANETA[e.b]} muy juntos`;
    case 'iss':
      return 'Paso visible de la Estación Espacial';
  }
}

/** Distancia legible: kilómetros para la Luna, millones de km y unidades astronómicas para el resto. */
export function textoDistancia(km: number): string {
  if (km < 1_000_000) return `${formatearNumero(km)} km`;
  const millones = formatearNumero(km / 1_000_000, km < 100_000_000 ? 1 : 0);
  return `${millones} millones de km (${formatearNumero(km / KM_POR_UA, 2)} UA)`;
}

/** Tiempo de luz como «1,3 segundos», «8 minutos» o «1 hora y 12 minutos». */
export function textoLuz(segundos: number): string {
  if (segundos < 60) return `${formatearNumero(segundos, 1)} segundos`;
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${h} ${h === 1 ? 'hora' : 'horas'}${m ? ` y ${m} minutos` : ''}`;
}

/** Tamaño comparado con la Tierra: «109 veces la Tierra» o «la cuarta parte de la Tierra». */
export function textoTamano(diametroKm: number): string {
  const r = diametroKm / DIAMETRO_TIERRA_KM;
  if (r >= 1.5) return `${formatearNumero(r, r < 10 ? 1 : 0)} veces la Tierra`;
  if (r >= 0.9) return 'casi como la Tierra';
  return `${formatearNumero(r * 100)} % del tamaño de la Tierra`;
}
