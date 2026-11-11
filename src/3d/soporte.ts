let resultado: boolean | undefined;

/** Si el navegador puede dibujar WebGL; se comprueba una sola vez. */
export function soportaWebGL(): boolean {
  if (resultado === undefined) {
    try {
      const c = document.createElement('canvas');
      resultado = Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
    } catch {
      resultado = false;
    }
  }
  return resultado;
}
