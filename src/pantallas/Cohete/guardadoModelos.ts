import type { ModeloNasa } from './modelosNasa';

/** Caché del navegador donde quedan los modelos descargados; localStorage no admite archivos de varios MB. */
const CACHE = 'spacenight-modelos';

const CLAVE_ULTIMO = 'tu-cielo:cohete:modelo';
const CLAVE_ABIERTO = 'tu-cielo:cohete:modelos-abierto';

/** Dirección del archivo con su tamaño en la consulta: si el archivo cambia, la copia vieja deja de valer. */
export function direccionModelo(m: ModeloNasa, base: string): string {
  return `${base}modelos/${m.archivo}?v=${m.bytes}`;
}

function hayCache(): boolean {
  return typeof caches !== 'undefined';
}

/** Si el modelo ya está guardado en este navegador. */
export async function estaGuardado(direccion: string): Promise<boolean> {
  if (!hayCache()) return false;
  try {
    const cache = await caches.open(CACHE);
    return !!(await cache.match(direccion));
  } catch {
    return false;
  }
}

async function leerConProgreso(
  respuesta: Response,
  total: number,
  alProgreso: (fraccion: number) => void,
): Promise<ArrayBuffer> {
  const lector = respuesta.body?.getReader();
  if (!lector) return respuesta.arrayBuffer();
  const trozos: Uint8Array[] = [];
  let leidos = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    trozos.push(value);
    leidos += value.length;
    alProgreso(Math.min(leidos / total, 1));
  }
  const datos = new Uint8Array(leidos);
  let pos = 0;
  for (const t of trozos) {
    datos.set(t, pos);
    pos += t.length;
  }
  return datos.buffer;
}

/**
 * Los bytes del modelo: de la caché si ya se bajó, si no de la red, y entonces lo guarda.
 * @param alProgreso fracción descargada, de 0 a 1; no se llama si ya estaba guardado
 */
export async function obtenerModelo(
  direccion: string,
  bytes: number,
  alProgreso: (fraccion: number) => void,
): Promise<ArrayBuffer> {
  const cache = hayCache() ? await caches.open(CACHE).catch(() => null) : null;
  const guardada = await cache?.match(direccion);
  if (guardada) return guardada.arrayBuffer();

  const respuesta = await fetch(direccion);
  if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
  const total = Number(respuesta.headers.get('content-length')) || bytes;
  const datos = await leerConProgreso(respuesta, total, alProgreso);
  await cache
    ?.put(
      direccion,
      new Response(datos, {
        headers: { 'content-type': 'model/gltf-binary' },
      }),
    )
    .catch(() => undefined);
  return datos;
}

/** Quita un modelo guardado para liberar espacio. */
export async function borrarModelo(direccion: string): Promise<void> {
  if (!hayCache()) return;
  const cache = await caches.open(CACHE).catch(() => null);
  await cache?.delete(direccion);
}

function leer(clave: string): string | null {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string | null): void {
  try {
    if (valor === null) localStorage.removeItem(clave);
    else localStorage.setItem(clave, valor);
  } catch {
    return;
  }
}

/** El último modelo que se vio, para volver a abrirlo al recargar. */
export const ultimoModelo = () => leer(CLAVE_ULTIMO);

/** Recuerda el modelo que se está viendo, o lo olvida con null. */
export const recordarModelo = (id: string | null) => escribir(CLAVE_ULTIMO, id);

/** Si el panel de modelos reales quedó abierto. */
export const modelosAbiertos = () => leer(CLAVE_ABIERTO) === '1';

/** Recuerda si el panel de modelos reales está abierto. */
export const recordarModelosAbiertos = (si: boolean) =>
  escribir(CLAVE_ABIERTO, si ? '1' : null);
