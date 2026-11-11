import { useEffect, useState } from 'react';
import type { ResultadoCache } from '../cache/cache';
import type { Lluvia } from '../servicios/astro/eventos';
import { pronostico, type Pronostico } from '../servicios/clima/openMeteo';
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
