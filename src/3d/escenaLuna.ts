import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TextureLoader,
  WebGLRenderer,
  type Texture,
} from 'three';
import { densidadPixeles } from './comun';
import {
  inclinacion,
  reducirMovimiento,
  seguirInclinacion,
  sigueMoviendose,
} from './movimiento';

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

const TONOS_MANCHA = 8;

function manchas(g: CanvasRenderingContext2D, ancho: number, alto: number) {
  const lotes = Array.from({ length: TONOS_MANCHA }, () => new Path2D());
  for (let i = 0; i < MANCHAS; i++) {
    const x = Math.random() * ancho;
    const y = Math.random() * alto;
    const r = Math.random() * 4 + 0.8;
    const lote = lotes[Math.floor(Math.random() * TONOS_MANCHA)];
    lote.moveTo(x + r, y);
    lote.arc(x, y, r, 0, 7);
  }
  lotes.forEach((lote, k) => {
    const l = Math.round(150 + (k / (TONOS_MANCHA - 1)) * 60);
    g.fillStyle = `rgba(${l},${l - 3},${l - 8},.25)`;
    g.fill(lote);
  });
}

const MANCHAS = 3200;
const CRATERES = 240;

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
export function lienzoLuna(): HTMLCanvasElement {
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
  for (let i = 0; i < CRATERES; i++) {
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

/**
 * Monta la Luna 3D en un canvas; solo se redibuja al cambiar de fase, al arrastrarla o al inclinar el móvil.
 * Empieza con la textura dibujada y la cambia por el mapa real de la Luna en cuanto llega.
 */
export function crearEscenaLuna(
  canvas: HTMLCanvasElement,
  lienzo: HTMLCanvasElement = lienzoLuna(),
): ControlLuna {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
  });
  renderer.setPixelRatio(Math.min(densidadPixeles(), 1.5));
  const escena = new Scene();
  const camara = new PerspectiveCamera(28, 1, 0.1, 50);
  camara.position.set(0, 0, 4.6);

  const mapa = new CanvasTexture(lienzo);
  mapa.colorSpace = SRGBColorSpace;
  mapa.anisotropy = 4;
  const geometria = new SphereGeometry(1, 96, 64);
  const material = new MeshLambertMaterial({
    map: mapa,
    bumpMap: mapa,
    bumpScale: 0.5,
  });
  const luna = new Mesh(geometria, material);
  escena.add(luna);
  const sol = new DirectionalLight(0xfff3e2, 4.2);
  escena.add(sol);
  escena.add(new AmbientLight(0x7d8cc8, 0.5));

  let objetivo = 0;
  let theta: number | null = null;
  let lado = 1;
  let cx = inclinacion.x;
  let cy = inclinacion.y;
  let rotY = 0;
  let arrastre: { x: number; r: number } | null = null;
  let cuadro = 0;
  const quieto = reducirMovimiento();
  const pedirCuadro = () => {
    if (!cuadro) cuadro = requestAnimationFrame(dibujar);
  };
  const dibujar = () => {
    cuadro = 0;
    const paso = quieto ? 1 : 0.08;
    cx += (inclinacion.x - cx) * paso;
    cy += (inclinacion.y - cy) * paso;
    const actual = theta ?? objetivo;
    const d = Math.atan2(
      Math.sin(objetivo - actual),
      Math.cos(objetivo - actual),
    );
    theta = actual + d * paso;
    sol.position.set(-Math.sin(theta) * 5 * lado, -0.9, -Math.cos(theta) * 5);
    if (!arrastre) rotY *= quieto ? 0 : 0.9;
    luna.rotation.y = rotY + cx * 0.25;
    luna.rotation.x = 0.05 + cy * 0.15;
    renderer.render(escena, camara);
    const sigue =
      sigueMoviendose(cx, inclinacion.x) ||
      sigueMoviendose(cy, inclinacion.y) ||
      Math.abs(d * (1 - paso)) > 0.002 ||
      (!arrastre && Math.abs(rotY) > 0.002);
    if (sigue) pedirCuadro();
  };

  const ajustarTamano = () => {
    const tamano = canvas.clientWidth;
    if (tamano) renderer.setSize(tamano, tamano, false);
    pedirCuadro();
  };
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(canvas);
  ajustarTamano();

  const alPulsar = (ev: PointerEvent) => {
    arrastre = { x: ev.clientX, r: rotY };
    canvas.setPointerCapture(ev.pointerId);
  };
  const alMover = (ev: PointerEvent) => {
    if (!arrastre) return;
    rotY = arrastre.r + (ev.clientX - arrastre.x) * 0.01;
    pedirCuadro();
  };
  const alSoltar = () => {
    arrastre = null;
    pedirCuadro();
  };
  canvas.addEventListener('pointerdown', alPulsar);
  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerup', alSoltar);
  canvas.addEventListener('pointercancel', alSoltar);
  const dejarDeSeguir = seguirInclinacion(pedirCuadro);

  let vivo = true;
  let real: Texture | null = null;
  new TextureLoader()
    .loadAsync(`${import.meta.env.BASE_URL}texturas/luna.webp`)
    .then((tex) => {
      if (!vivo) return tex.dispose();
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
      real = tex;
      material.map = tex;
      material.bumpMap = tex;
      material.bumpScale = 1.4;
      material.needsUpdate = true;
      pedirCuadro();
    })
    .catch(() => undefined);

  return {
    fijarFase: (anguloGrados, hemisferioSur) => {
      objetivo = (anguloGrados * Math.PI) / 180;
      lado = hemisferioSur ? 1 : -1;
      pedirCuadro();
    },
    destruir: () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      dejarDeSeguir();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      canvas.removeEventListener('pointercancel', alSoltar);
      vivo = false;
      geometria.dispose();
      material.dispose();
      mapa.dispose();
      real?.dispose();
      renderer.dispose();
    },
  };
}
