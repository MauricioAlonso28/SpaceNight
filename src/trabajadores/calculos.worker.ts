import { eventosEntre } from '../servicios/astro/eventos';
import { nochePlanetas } from '../servicios/astro/planetas';
import { pasosVisibles } from '../servicios/satelites/iss';
import type { Pedido } from './calculos';

const ambito = globalThis as unknown as {
  addEventListener: (
    tipo: 'message',
    f: (ev: MessageEvent<Pedido>) => void,
  ) => void;
  postMessage: (mensaje: unknown) => void;
};

/** Hace en segundo plano los cálculos largos y devuelve el resultado con el mismo id. */
function atender({ data }: MessageEvent<Pedido>): void {
  ambito.postMessage({ id: data.id, resultado: calcular(data) });
}

function calcular(p: Pedido): unknown {
  if (p.tipo === 'pasos') {
    return pasosVisibles(p.tle, p.ubicacion, new Date(p.desde), p.horas);
  }
  if (p.tipo === 'planetas')
    return nochePlanetas(new Date(p.fecha), p.ubicacion);
  return eventosEntre(
    new Date(p.desde),
    new Date(p.hasta),
    p.ubicacion,
    p.lluvias,
  );
}

ambito.addEventListener('message', atender);
