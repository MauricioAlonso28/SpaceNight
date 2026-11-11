import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  WebGLRenderer,
} from 'three';
import {
  densidadPixeles,
  inclinacion,
  reducirMovimiento,
  seguirInclinacion,
} from './comun';

/** Lo que la interfaz puede pedirle a la Luna 3D. */
export interface ControlLuna {
  fijarFase: (anguloGrados: number, hemisferioSur: boolean) => void;
  destruir: () => void;
}

function crater(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const gr = g.createRadialGradient(
    x - r * 0.15,
    y - r * 0.15,
    r * 0.1,
    x,
    y,
    r,
  );
  gr.addColorStop(0, 'rgba(70,68,64,.35)');
  gr.addColorStop(0.75, 'rgba(90,88,84,.18)');
  gr.addColorStop(0.88, 'rgba(235,232,222,.45)');
  gr.addColorStop(1, 'rgba(235,232,222,0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, 7);
  g.fill();
}

function manchas(g: CanvasRenderingContext2D, ancho: number, alto: number) {
  for (let i = 0; i < 9000; i++) {
    const l = (150 + Math.random() * 60) | 0;
    g.fillStyle = `rgba(${l},${l - 3},${l - 8},.25)`;
    g.beginPath();
    g.arc(
      Math.random() * ancho,
      Math.random() * alto,
      Math.random() * 3 + 0.5,
      0,
      7,
    );
    g.fill();
  }
}

const MARES: readonly [number, number, number][] = [
  [230, 190, 70],
  [300, 170, 55],
  [200, 250, 60],
  [285, 268, 48],
  [335, 228, 40],
  [170, 300, 38],
  [250, 320, 30],
  [700, 200, 30],
  [820, 300, 26],
];

function mares(g: CanvasRenderingContext2D) {
  for (const [mx, my, mr] of MARES) {
    for (let k = 0; k < 40; k++) {
      const a = Math.random() * 7;
      const d = Math.random() * mr;
      g.fillStyle = 'rgba(84,82,78,.09)';
      g.beginPath();
      g.arc(
        mx + Math.cos(a) * d * 1.3,
        my + Math.sin(a) * d,
        mr * (0.35 + Math.random() * 0.4),
        0,
        7,
      );
      g.fill();
    }
  }
}

function rayosTycho(g: CanvasRenderingContext2D) {
  g.strokeStyle = 'rgba(240,238,230,.07)';
  g.lineWidth = 2;
  for (let i = 0; i < 22; i++) {
    const an = Math.random() * 7;
    const lg = 60 + Math.random() * 140;
    g.beginPath();
    g.moveTo(268, 400);
    g.lineTo(268 + Math.cos(an) * lg, 400 + Math.sin(an) * lg * 0.6);
    g.stroke();
  }
  crater(g, 268, 400, 16);
}

/** Textura de la superficie: mares en la cara visible, cráteres y un cráter con rayos. */
function lienzoLuna(): HTMLCanvasElement {
  const ancho = 1024;
  const alto = 512;
  const c = document.createElement('canvas');
  c.width = ancho;
  c.height = alto;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b4b0a6';
  g.fillRect(0, 0, ancho, alto);
  manchas(g, ancho, alto);
  mares(g);
  for (let i = 0; i < 520; i++) {
    const r =
      Math.random() < 0.9 ? 2 + Math.random() * 6 : 8 + Math.random() * 14;
    crater(
      g,
      20 + Math.random() * (ancho - 40),
      20 + Math.random() * (alto - 40),
      r,
    );
  }
  rayosTycho(g);
  return c;
}

/** Monta la Luna 3D en un canvas; se arrastra para girarla y vuelve a su cara visible. */
export function crearEscenaLuna(canvas: HTMLCanvasElement): ControlLuna {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(densidadPixeles());
  const escena = new Scene();
  const camara = new PerspectiveCamera(28, 1, 0.1, 50);
  camara.position.set(0, 0, 4.6);

  const lienzo = lienzoLuna();
  const mapa = new CanvasTexture(lienzo);
  mapa.colorSpace = SRGBColorSpace;
  mapa.anisotropy = 4;
  const relieve = new CanvasTexture(lienzo);
  const geometria = new SphereGeometry(1, 128, 96);
  const material = new MeshStandardMaterial({
    map: mapa,
    bumpMap: relieve,
    bumpScale: 0.5,
    roughness: 1,
    metalness: 0,
  });
  const luna = new Mesh(geometria, material);
  escena.add(luna);
  const sol = new DirectionalLight(0xfff3e2, 4.2);
  escena.add(sol);
  escena.add(new AmbientLight(0x7d8cc8, 0.5));

  const ajustarTamano = () => {
    const lado = canvas.clientWidth;
    if (lado) renderer.setSize(lado, lado, false);
  };
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(canvas);
  ajustarTamano();

  let rotY = 0;
  let arrastre: { x: number; r: number } | null = null;
  const alPulsar = (ev: PointerEvent) => {
    arrastre = { x: ev.clientX, r: rotY };
    canvas.setPointerCapture(ev.pointerId);
  };
  const alMover = (ev: PointerEvent) => {
    if (arrastre) rotY = arrastre.r + (ev.clientX - arrastre.x) * 0.01;
  };
  const alSoltar = () => {
    arrastre = null;
  };
  canvas.addEventListener('pointerdown', alPulsar);
  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerup', alSoltar);
  canvas.addEventListener('pointercancel', alSoltar);
  const dejarDeSeguir = seguirInclinacion();
  const quieto = reducirMovimiento();

  let objetivo = 0;
  let theta: number | null = null;
  let lado = 1;
  let cx = 0;
  let cy = 0;
  let cuadro = 0;
  const animar = (t: number) => {
    cx += (inclinacion.x - cx) * 0.05;
    cy += (inclinacion.y - cy) * 0.05;
    const actual = theta ?? objetivo;
    const d = Math.atan2(
      Math.sin(objetivo - actual),
      Math.cos(objetivo - actual),
    );
    theta = actual + (quieto ? d : d * 0.08);
    sol.position.set(-Math.sin(theta) * 5 * lado, -0.9, -Math.cos(theta) * 5);
    if (!arrastre) rotY *= 0.97;
    const vaiven = quieto ? 0 : Math.sin(t / 2600) * 0.12;
    luna.rotation.y = rotY + vaiven + cx * 0.25;
    luna.rotation.x =
      0.05 + cy * 0.15 + (quieto ? 0 : Math.sin(t / 3700) * 0.04);
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(animar);
  };
  cuadro = requestAnimationFrame(animar);

  return {
    fijarFase: (anguloGrados, hemisferioSur) => {
      objetivo = (anguloGrados * Math.PI) / 180;
      lado = hemisferioSur ? 1 : -1;
    },
    destruir: () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      dejarDeSeguir();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      canvas.removeEventListener('pointercancel', alSoltar);
      geometria.dispose();
      material.dispose();
      mapa.dispose();
      relieve.dispose();
      renderer.dispose();
    },
  };
}
