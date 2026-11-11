/**
 * Si el navegador tiene WebGL, sin crear un contexto de prueba (crearlo cuesta más de 100 ms en un móvil lento).
 * Si luego la escena no se puede crear, cada componente cae a su versión sin 3D.
 */
export function soportaWebGL(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('WebGL2RenderingContext' in window || 'WebGLRenderingContext' in window)
  );
}

/**
 * Ejecuta algo cuando el navegador está libre, para no retrasar el primer pintado.
 * @returns la función que lo cancela si aún no se ejecutó
 */
export function cuandoEsteLibre(
  f: () => void,
  esperaMaxima = 1500,
): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(f, { timeout: esperaMaxima });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(f, 200);
  return () => window.clearTimeout(id);
}

/** Cede el hilo al navegador entre dos trozos de trabajo, para que ninguno bloquee mucho tiempo. */
export function ceder(): Promise<void> {
  return new Promise((resolver) => window.setTimeout(resolver, 0));
}
