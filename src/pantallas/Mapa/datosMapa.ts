import { useEffect, useState } from 'react';
import type {
  Constelacion,
  FilaEstrella,
} from '../../servicios/astro/estrellas';

/** Catálogos del mapa ya cargados. */
export interface DatosMapa {
  estrellas: FilaEstrella[];
  constelaciones: Constelacion[];
}

let pedidos: Promise<DatosMapa> | null = null;

function leer<T>(archivo: string): Promise<T> {
  return fetch(`${import.meta.env.BASE_URL}data/${archivo}`).then((r) => {
    if (!r.ok) throw new Error(`DATA_HTTP_${r.status}`);
    return r.json() as Promise<T>;
  });
}

function pedirDatos(): Promise<DatosMapa> {
  pedidos ??= Promise.all([
    leer<{ estrellas: FilaEstrella[] }>('estrellas.json'),
    leer<{ constelaciones: Constelacion[] }>('constelaciones.json'),
  ]).then(([e, c]) => ({
    estrellas: e.estrellas,
    constelaciones: c.constelaciones,
  }));
  pedidos.catch(() => {
    pedidos = null;
  });
  return pedidos;
}

/** Estrellas y constelaciones del repositorio; null mientras cargan, 'error' si fallan. */
export function useDatosMapa(): DatosMapa | null | 'error' {
  const [datos, setDatos] = useState<DatosMapa | null | 'error'>(null);
  useEffect(() => {
    let vigente = true;
    pedirDatos().then(
      (d) => vigente && setDatos(d),
      () => vigente && setDatos('error'),
    );
    return () => {
      vigente = false;
    };
  }, []);
  return datos;
}
