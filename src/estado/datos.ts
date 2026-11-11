import { useEffect, useMemo, useState } from 'react';
import type { ResultadoCache } from '../cache/cache';
import type { Lluvia } from '../servicios/astro/eventos';
import { pronostico, type Pronostico } from '../servicios/clima/openMeteo';
import { tleISS } from '../servicios/satelites/celestrak';
import {
  HORAS_PREDICCION,
  pasosVisibles,
  type PasoISS,
  type Tle,
} from '../servicios/satelites/iss';
import type { Ubicacion } from '../tipos/ubicacion';

/** Estado de una descarga: cargando, lista (quizá caducada) o fallida. */
export type Carga<T> =
  | { estado: 'cargando' }
  | { estado: 'listo'; resultado: ResultadoCache<T> }
  | { estado: 'error' };

/**
 * Pronóstico de la ubicación; se vuelve a pedir al cambiar de lugar o de hora.
 * @param hora cualquier número que cambie una vez por hora
 */
export function usePronostico(
  ubicacion: Ubicacion,
  hora: number,
): Carga<Pronostico> {
  const [carga, setCarga] = useState<Carga<Pronostico>>({ estado: 'cargando' });
  useEffect(() => {
    let vigente = true;
    pronostico(ubicacion).then(
      (resultado) => vigente && setCarga({ estado: 'listo', resultado }),
      () => vigente && setCarga({ estado: 'error' }),
    );
    return () => {
      vigente = false;
    };
  }, [ubicacion, hora]);
  return carga;
}

/** Pasos visibles de la Estación calculados para un tramo de tiempo. */
export interface PasosCalculados {
  pasos: PasoISS[];
  desde: Date;
  hasta: Date;
  horasDescarga: number;
}

const MS_HORA = 3_600_000;
const HORAS_ATRAS = 12;

/**
 * Pasos visibles de la Estación desde 12 horas antes de esta hora hasta 3 días después.
 * @param hora la hora actual en horas desde 1970, para recalcular una vez por hora
 */
export function usePasosISS(
  ubicacion: Ubicacion,
  hora: number,
): PasosCalculados | null {
  const [carga, setCarga] = useState<Carga<Tle>>({ estado: 'cargando' });
  useEffect(() => {
    let vigente = true;
    tleISS().then(
      (resultado) => vigente && setCarga({ estado: 'listo', resultado }),
      () => vigente && setCarga({ estado: 'error' }),
    );
    return () => {
      vigente = false;
    };
  }, [hora]);
  return useMemo(() => {
    if (carga.estado !== 'listo') return null;
    const desde = new Date((hora - HORAS_ATRAS) * MS_HORA);
    const horas = HORAS_ATRAS + HORAS_PREDICCION;
    return {
      pasos: pasosVisibles(carga.resultado.valor, ubicacion, desde, horas),
      desde,
      hasta: new Date(desde.getTime() + horas * MS_HORA),
      horasDescarga: hora - carga.resultado.guardado / MS_HORA,
    };
  }, [carga, ubicacion, hora]);
}

let lluviasPedidas: Promise<Lluvia[]> | null = null;

function pedirLluvias(): Promise<Lluvia[]> {
  lluviasPedidas ??= fetch(
    `${import.meta.env.BASE_URL}data/lluvias-2026-2027.json`,
  )
    .then((r) => (r.ok ? r.json() : { lluvias: [] }))
    .then((d: { lluvias: Lluvia[] }) => d.lluvias)
    .catch(() => []);
  return lluviasPedidas;
}

/** Calendario de lluvias de meteoros del repositorio; vacío mientras carga o si falla. */
export function useLluvias(): Lluvia[] {
  const [lluvias, setLluvias] = useState<Lluvia[]>([]);
  useEffect(() => {
    let vigente = true;
    pedirLluvias().then((l) => vigente && setLluvias(l));
    return () => {
      vigente = false;
    };
  }, []);
  return lluvias;
}
