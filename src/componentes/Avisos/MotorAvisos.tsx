import { useEffect, useMemo } from 'react';
import { useJsonPublico } from '../../estado/datos';
import { useAhora } from '../../estado/hooks';
import { useAvisos } from '../../estado/avisos';
import { useEstado } from '../../estado/store';
import { calcularAvisos, type ResumenNasa } from '../../servicios/nasa/avisos';
import { useApiEnVivo } from '../../servicios/nasa/datos';
import {
  resumirEvento,
  type EventoEonet,
  type EventoResumido,
} from '../../servicios/nasa/eonet';

const SEIS_HORAS = 6 * 3_600_000;
const EONET = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7';
const EPIC = 'https://epic.gsfc.nasa.gov/api/natural';

/** Muestra un aviso del sistema con el service worker, o con Notification si no hay uno. */
function notificar(titulo: string, cuerpo: string, etiqueta: string): void {
  const opciones = {
    body: cuerpo,
    tag: etiqueta,
    icon: `${import.meta.env.BASE_URL}icons/pwa-192x192.png`,
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((r) => r.showNotification(titulo, opciones))
      .catch(() => new Notification(titulo, opciones));
  } else new Notification(titulo, opciones);
}

/**
 * Calcula los avisos de NASA en vivo en todas las pantallas: lee el resumen publicado, los eventos de la última semana y la última tanda de EPIC.
 * Con permiso, avisa con una notificación del sistema cuando la pestaña está en segundo plano, una vez cada 6 horas por regla.
 */
export function MotorAvisos() {
  const ahora = useAhora().getTime();
  const ubicacion = useEstado((s) => s.ubicacion);
  const resumen = useJsonPublico<ResumenNasa>('nasa/resumen.json');
  const eonet = useApiEnVivo<{ events: EventoEonet[] }>(EONET, 10 * 60_000);
  const epic = useApiEnVivo<{ date: string }[]>(EPIC, 30 * 60_000);
  const fijarAvisos = useAvisos((s) => s.fijarAvisos);

  const eventos = useMemo(
    () =>
      eonet && eonet !== 'error'
        ? eonet.events
            .map(resumirEvento)
            .filter((e): e is EventoResumido => e !== null)
        : [],
    [eonet],
  );
  const hora = Math.floor(ahora / 3_600_000);
  const avisos = useMemo(
    () =>
      calcularAvisos({
        resumen: resumen && resumen !== 'error' ? resumen : null,
        eventos,
        ultimaFotoTierra:
          epic && epic !== 'error' && epic.length
            ? epic[0].date.slice(0, 10)
            : null,
        lat: ubicacion.latitud,
        lon: ubicacion.longitud,
        ahora: hora * 3_600_000,
      }),
    [resumen, eventos, epic, ubicacion.latitud, ubicacion.longitud, hora],
  );

  useEffect(() => {
    fijarAvisos(avisos);
    if (
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted' ||
      !document.hidden
    ) {
      return;
    }
    const { vistos, apagadas, notificado, anotarNotificacion } =
      useAvisos.getState();
    const momento = Date.now();
    for (const a of avisos) {
      if (vistos.includes(a.id) || apagadas.includes(a.regla)) continue;
      if (momento - (notificado[a.regla] ?? 0) < SEIS_HORAS) continue;
      notificar(a.titulo, a.detalle, a.id);
      anotarNotificacion(a.regla, momento);
    }
  }, [avisos, fijarAvisos]);

  return null;
}
