import { CanvasTexture } from 'three';

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
