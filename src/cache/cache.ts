/** Lo que devuelve la caché: el valor, cuándo se descargó y si está caducado. */
export interface ResultadoCache<T> {
  valor: T;
  guardado: number;
  caducado: boolean;
}

/** Almacén mínimo compatible con localStorage, para poder probar sin navegador. */
export interface Almacen {
  getItem(clave: string): string | null;
  setItem(clave: string, valor: string): void;
}

/** Prefijo de las claves guardadas; mantiene el nombre anterior de la app para no perder la caché. */
const PREFIJO = 'tu-cielo:cache:';

function almacenPorDefecto(): Almacen | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Lee una entrada guardada, caducada o no; null si no hay o está dañada. */
export function leerCache<T>(
  clave: string,
  maxEdadMs: number,
  ahora = Date.now(),
  almacen = almacenPorDefecto(),
): ResultadoCache<T> | null {
  try {
    const texto = almacen?.getItem(PREFIJO + clave);
    if (!texto) return null;
    const { valor, guardado } = JSON.parse(texto) as {
      valor: T;
      guardado: number;
    };
    return { valor, guardado, caducado: ahora - guardado > maxEdadMs };
  } catch {
    return null;
  }
}

/** Guarda un valor con la hora de descarga; si el almacén falla, se ignora. */
export function guardarCache<T>(
  clave: string,
  valor: T,
  ahora = Date.now(),
  almacen = almacenPorDefecto(),
): void {
  try {
    almacen?.setItem(
      PREFIJO + clave,
      JSON.stringify({ valor, guardado: ahora }),
    );
  } catch {
    return;
  }
}

/**
 * Usa la copia guardada si es reciente; si no, descarga. Sin conexión devuelve la última copia marcada como caducada.
 * @param maxEdadMs cuánto tiempo vale una copia antes de volver a pedirla
 * @param descargar la única función que sale a internet
 */
export async function conCache<T>(
  clave: string,
  maxEdadMs: number,
  descargar: () => Promise<T>,
  ahora = Date.now(),
  almacen = almacenPorDefecto(),
): Promise<ResultadoCache<T>> {
  const copia = leerCache<T>(clave, maxEdadMs, ahora, almacen);
  if (copia && !copia.caducado) return copia;
  try {
    const valor = await descargar();
    guardarCache(clave, valor, ahora, almacen);
    return { valor, guardado: ahora, caducado: false };
  } catch (error) {
    if (copia) return copia;
    throw error;
  }
}
