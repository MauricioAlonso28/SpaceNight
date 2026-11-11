import { CanvasTexture } from 'three';

/** Número aleatorio con distribución normal (Box-Muller). */
export function gauss(): number {
  let u = 0;
  let v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Textura de punto difuminado para dibujar estrellas. */
export function texturaPunto(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.22, 'rgba(255,255,255,.85)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new CanvasTexture(c);
}

/** Densidad de píxeles limitada a 2 para no gastar batería. */
export function densidadPixeles(): number {
  return Math.min(window.devicePixelRatio || 1, 2);
}

/** Si el usuario pidió reducir el movimiento. */
export function reducirMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Inclinación compartida por el fondo y la Luna: ratón o giroscopio, de -1 a 1. */
export const inclinacion = { x: 0, y: 0 };

function alMoverRaton(ev: PointerEvent): void {
  if (ev.pointerType !== 'mouse') return;
  inclinacion.x = (ev.clientX / window.innerWidth - 0.5) * 2;
  inclinacion.y = (ev.clientY / window.innerHeight - 0.5) * 2;
}

function alInclinar(ev: DeviceOrientationEvent): void {
  if (ev.gamma == null || ev.beta == null) return;
  inclinacion.x = Math.max(-1, Math.min(1, ev.gamma / 30));
  inclinacion.y = Math.max(-1, Math.min(1, (ev.beta - 50) / 30));
}

let escuchando = 0;

/** Empieza a seguir la inclinación; devuelve la función que deja de hacerlo. */
export function seguirInclinacion(): () => void {
  if (escuchando++ === 0) {
    window.addEventListener('pointermove', alMoverRaton);
    window.addEventListener('deviceorientation', alInclinar);
  }
  return () => {
    if (--escuchando === 0) {
      window.removeEventListener('pointermove', alMoverRaton);
      window.removeEventListener('deviceorientation', alInclinar);
    }
  };
}
