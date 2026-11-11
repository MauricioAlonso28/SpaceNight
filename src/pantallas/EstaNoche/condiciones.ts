import type { Carga } from '../../estado/datos';
import type { Pronostico } from '../../servicios/clima/openMeteo';
import {
  etiqueta,
  mediaEnTramo,
  puntuacion,
  type Etiqueta,
} from '../../servicios/clima/puntuacion';
import { formatearHora } from '../../servicios/formato';

export const NOMBRE_ETIQUETA: Record<Etiqueta, string> = {
  excelente: 'Excelente',
  bueno: 'Bueno',
  regular: 'Regular',
  malo: 'Malo',
};

const TEXTO_ETIQUETA: Record<Etiqueta, string> = {
  excelente:
    'Cielo limpio y oscuro. Buena noche para buscar estrellas débiles y la Vía Láctea.',
  bueno: 'Se verán bien la Luna, los planetas y las estrellas más brillantes.',
  regular:
    'La Luna y los planetas se ven bien. Las estrellas débiles se pierden con la luz de la ciudad.',
  malo: 'Las nubes o la luz tapan casi todo. Quizá asome la Luna o algún planeta brillante.',
};

/** Lo que muestra el panel ¿Se ve bien hoy?, ya calculado. */
export interface VistaCondiciones {
  puntuacion: number | null;
  titulo: string;
  texto: string;
  nubes: number | null;
  humedad: number | null;
  bortle: number;
  luna: number;
  aviso: string | null;
}

/** Nombre del nivel de luz de la ciudad en la escala de Bortle. */
export function luzCiudad(bortle: number): string {
  if (bortle <= 3) return 'Baja';
  if (bortle <= 5) return 'Media';
  if (bortle <= 7) return 'Alta';
  return 'Muy alta';
}

function sinPuntuacion(
  aviso: string,
  bortle: number,
  luna: number,
): VistaCondiciones {
  return {
    puntuacion: null,
    titulo: 'Sin pronóstico',
    texto: 'Sin nubes ni humedad no se puede puntuar la noche.',
    nubes: null,
    humedad: null,
    bortle,
    luna,
    aviso,
  };
}

/**
 * Puntuación y textos del panel para la noche cerrada que va de inicio a fin.
 * @param luna fracción iluminada de la Luna a mitad de la noche
 */
export function vistaCondiciones(
  carga: Carga<Pronostico>,
  inicio: Date,
  fin: Date,
  luna: number,
  bortle: number,
  formatoHora: { zona: string; formato24h: boolean },
): VistaCondiciones {
  if (carga.estado === 'cargando') {
    return sinPuntuacion('Cargando el pronóstico…', bortle, luna);
  }
  if (carga.estado === 'error') {
    return sinPuntuacion('No se pudo cargar el pronóstico.', bortle, luna);
  }
  const media = mediaEnTramo(carga.resultado.valor, inicio, fin);
  if (!media) {
    return sinPuntuacion(
      'El pronóstico llega a 16 días; para esta noche aún no hay datos.',
      bortle,
      luna,
    );
  }
  const s = puntuacion({ ...media, bortle, luna });
  const e = etiqueta(s);
  const guardado = new Date(carga.resultado.guardado);
  return {
    puntuacion: s,
    titulo: NOMBRE_ETIQUETA[e],
    texto: TEXTO_ETIQUETA[e],
    nubes: media.nubes,
    humedad: media.humedad,
    bortle,
    luna,
    aviso: carga.resultado.caducado
      ? `Sin conexión: pronóstico guardado a las ${formatearHora(guardado, formatoHora.zona, formatoHora.formato24h)}.`
      : null,
  };
}
