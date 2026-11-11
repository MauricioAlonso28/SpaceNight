/** Número aleatorio con distribución normal (Box-Muller). */
export function gauss(): number {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Si el usuario pidió reducir el movimiento. */
export function reducirMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Inclinación compartida por el fondo y la Luna: ratón o giroscopio, de -1 a 1. */
export const inclinacion = { x: 0, y: 0 };

const avisos = new Set<() => void>();

function avisar(): void {
  avisos.forEach((f) => f());
}

function alMoverRaton(ev: PointerEvent): void {
  if (ev.pointerType !== 'mouse') return;
  inclinacion.x = (ev.clientX / window.innerWidth - 0.5) * 2;
  inclinacion.y = (ev.clientY / window.innerHeight - 0.5) * 2;
  avisar();
}

function alInclinar(ev: DeviceOrientationEvent): void {
  if (ev.gamma == null || ev.beta == null) return;
  inclinacion.x = Math.max(-1, Math.min(1, ev.gamma / 30));
  inclinacion.y = Math.max(-1, Math.min(1, (ev.beta - 50) / 30));
  avisar();
}

/**
 * Empieza a seguir la inclinación y avisa en cada cambio; devuelve la función que deja de hacerlo.
 * @param alCambiar se llama cuando el ratón o el giroscopio se mueven
 */
export function seguirInclinacion(alCambiar: () => void): () => void {
  if (avisos.size === 0) {
    window.addEventListener('pointermove', alMoverRaton);
    window.addEventListener('deviceorientation', alInclinar);
  }
  avisos.add(alCambiar);
  return () => {
    avisos.delete(alCambiar);
    if (avisos.size === 0) {
      window.removeEventListener('pointermove', alMoverRaton);
      window.removeEventListener('deviceorientation', alInclinar);
    }
  };
}

/** Si un valor suavizado todavía no llegó a su objetivo. */
export function sigueMoviendose(actual: number, objetivo: number): boolean {
  return Math.abs(objetivo - actual) > 0.002;
}
