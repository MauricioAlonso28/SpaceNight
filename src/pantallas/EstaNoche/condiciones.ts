import type { Carga } from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import type { Pronostico } from '../../servicios/clima/openMeteo';
import {
  etiqueta,
  mediaEnTramo,
  puntuacion,
  type Etiqueta,
} from '../../servicios/clima/puntuacion';
import { formatearHora } from '../../servicios/formato';

const ES = {
  nombre: {
    excelente: 'Excelente',
    bueno: 'Bueno',
    regular: 'Regular',
    malo: 'Malo',
  } as Record<Etiqueta, string>,
  texto: {
    excelente:
      'Cielo limpio y oscuro. Buena noche para buscar estrellas débiles y la Vía Láctea.',
    bueno:
      'Se verán bien la Luna, los planetas y las estrellas más brillantes.',
    regular:
      'La Luna y los planetas se ven bien. Las estrellas débiles se pierden con la luz de la ciudad.',
    malo: 'Las nubes o la luz tapan casi todo. Quizá asome la Luna o algún planeta brillante.',
  } as Record<Etiqueta, string>,
  luz: ['Baja', 'Media', 'Alta', 'Muy alta'],
  sinPronostico: 'Sin pronóstico',
  sinDatos: 'Sin nubes ni humedad no se puede puntuar la noche.',
  cargando: 'Cargando el pronóstico…',
  error: 'No se pudo cargar el pronóstico.',
  fueraDeRango:
    'El pronóstico llega a 16 días; para esta noche aún no hay datos.',
  guardado: (hora: string) =>
    `Sin conexión: pronóstico guardado a las ${hora}.`,
};

const EN: typeof ES = {
  nombre: {
    excelente: 'Excellent',
    bueno: 'Good',
    regular: 'Fair',
    malo: 'Poor',
  },
  texto: {
    excelente:
      'Clear, dark sky. A good night to look for faint stars and the Milky Way.',
    bueno: 'The Moon, the planets and the brightest stars will look good.',
    regular:
      'The Moon and the planets look fine. Faint stars get lost in the city lights.',
    malo: 'Clouds or light cover almost everything. The Moon or a bright planet may peek through.',
  },
  luz: ['Low', 'Medium', 'High', 'Very high'],
  sinPronostico: 'No forecast',
  sinDatos: 'Without clouds and humidity the night cannot be scored.',
  cargando: 'Loading the forecast…',
  error: 'Could not load the forecast.',
  fueraDeRango:
    'The forecast covers 16 days; there is no data for this night yet.',
  guardado: (hora) => `Offline: forecast saved at ${hora}.`,
};

function t() {
  return textos({ es: ES, en: EN });
}

/** Nombre de una etiqueta de calidad del cielo. */
export function nombreEtiqueta(e: Etiqueta): string {
  return t().nombre[e];
}

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
  const [baja, media, alta, muyAlta] = t().luz;
  if (bortle <= 3) return baja;
  if (bortle <= 5) return media;
  if (bortle <= 7) return alta;
  return muyAlta;
}

function sinPuntuacion(
  aviso: string,
  bortle: number,
  luna: number,
): VistaCondiciones {
  return {
    puntuacion: null,
    titulo: t().sinPronostico,
    texto: t().sinDatos,
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
    return sinPuntuacion(t().cargando, bortle, luna);
  }
  if (carga.estado === 'error') {
    return sinPuntuacion(t().error, bortle, luna);
  }
  const media = mediaEnTramo(carga.resultado.valor, inicio, fin);
  if (!media) return sinPuntuacion(t().fueraDeRango, bortle, luna);
  const s = puntuacion({ ...media, bortle, luna });
  const e = etiqueta(s);
  const guardado = new Date(carga.resultado.guardado);
  return {
    puntuacion: s,
    titulo: t().nombre[e],
    texto: t().texto[e],
    nubes: media.nubes,
    humedad: media.humedad,
    bortle,
    luna,
    aviso: carga.resultado.caducado
      ? t().guardado(
          formatearHora(guardado, formatoHora.zona, formatoHora.formato24h),
        )
      : null,
  };
}
