import {
  eventosEntre,
  type Evento,
  type Lluvia,
} from '../servicios/astro/eventos';
import {
  pasosVisibles,
  type PasoISS,
  type Tle,
} from '../servicios/satelites/iss';
import { nochePlanetas, type NochePlanetas } from '../servicios/astro/planetas';
import type { Ubicacion } from '../tipos/ubicacion';

/** Lo que se le pide al trabajador: los pasos de la Estación o los eventos de un tramo. */
export type Pedido =
  | {
      id: number;
      tipo: 'pasos';
      tle: Tle;
      ubicacion: Ubicacion;
      desde: number;
      horas: number;
    }
  | { id: number; tipo: 'planetas'; fecha: number; ubicacion: Ubicacion }
  | {
      id: number;
      tipo: 'eventos';
      desde: number;
      hasta: number;
      ubicacion: Ubicacion;
      lluvias: Lluvia[];
    };

type SinId<T> = T extends unknown ? Omit<T, 'id'> : never;

let trabajador: Worker | null | undefined;
let siguiente = 0;
const pendientes = new Map<number, (valor: unknown) => void>();

function enHiloPrincipal(p: SinId<Pedido>): unknown {
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

function obtenerTrabajador(): Worker | null {
  if (trabajador !== undefined) return trabajador;
  if (typeof Worker === 'undefined') return (trabajador = null);
  try {
    trabajador = new Worker(new URL('./calculos.worker.ts', import.meta.url), {
      type: 'module',
    });
    trabajador.addEventListener(
      'message',
      (ev: MessageEvent<{ id: number; resultado: unknown }>) => {
        pendientes.get(ev.data.id)?.(ev.data.resultado);
        pendientes.delete(ev.data.id);
      },
    );
    trabajador.addEventListener('error', () => {
      trabajador = null;
    });
  } catch {
    trabajador = null;
  }
  return trabajador;
}

/** Envía un cálculo al trabajador; sin trabajadores, lo hace aquí mismo. */
function pedir<T>(p: SinId<Pedido>): Promise<T> {
  const t = obtenerTrabajador();
  if (!t) return Promise.resolve(enHiloPrincipal(p) as T);
  const id = ++siguiente;
  return new Promise<T>((resolver) => {
    pendientes.set(id, (v) => resolver(v as T));
    t.postMessage({ ...p, id });
  });
}

/** Pasos visibles de la Estación calculados fuera del hilo de la interfaz. */
export function calcularPasos(
  tle: Tle,
  ubicacion: Ubicacion,
  desde: Date,
  horas: number,
): Promise<PasoISS[]> {
  return pedir({
    tipo: 'pasos',
    tle,
    ubicacion,
    desde: desde.getTime(),
    horas,
  });
}

/** Eventos de un tramo calculados fuera del hilo de la interfaz. */
export function calcularEventos(
  desde: Date,
  hasta: Date,
  ubicacion: Ubicacion,
  lluvias: Lluvia[],
): Promise<Evento[]> {
  return pedir({
    tipo: 'eventos',
    desde: desde.getTime(),
    hasta: hasta.getTime(),
    ubicacion,
    lluvias,
  });
}

/** Planetas, Sol y Luna de una noche muestreados fuera del hilo de la interfaz. */
export function calcularNochePlanetas(
  fecha: Date,
  ubicacion: Ubicacion,
): Promise<NochePlanetas> {
  return pedir({ tipo: 'planetas', fecha: fecha.getTime(), ubicacion });
}
