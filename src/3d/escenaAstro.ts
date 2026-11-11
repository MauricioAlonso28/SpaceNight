import {
  AmbientLight,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  SphereGeometry,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three';
import { densidadPixeles } from './comun';
import { reducirMovimiento } from './movimiento';

/** Cuerpos con textura real en public/texturas. */
export type Astro =
  'sol' | 'luna' | 'mercurio' | 'venus' | 'marte' | 'jupiter' | 'saturno';

/** Inclinación del eje en radianes, para que cada uno se vea como en las fotos. */
const INCLINACION: Record<Astro, number> = {
  sol: 0.13,
  luna: 0.03,
  mercurio: 0.01,
  venus: 0.05,
  marte: 0.44,
  jupiter: 0.05,
  saturno: 0.47,
};

/** Giro inicial en radianes: la cara que se muestra primero (la Gran Mancha Roja de Júpiter, Syrtis Major en Marte). */
const GIRO_INICIAL: Record<Astro, number> = {
  sol: 0,
  luna: -1.6,
  mercurio: 0.4,
  venus: 0,
  marte: 2.2,
  jupiter: 1.1,
  saturno: 0.3,
};

/** Radios interior y exterior de los anillos de Saturno, en radios del planeta. */
const ANILLO = { interior: 1.24, exterior: 2.27 };

const cargador = new TextureLoader();
const texturas = new Map<string, Promise<Texture>>();

function textura(nombre: string): Promise<Texture> {
  let t = texturas.get(nombre);
  if (!t) {
    t = cargador
      .loadAsync(`${import.meta.env.BASE_URL}texturas/${nombre}.webp`)
      .then((tex) => {
        tex.colorSpace = SRGBColorSpace;
        tex.anisotropy = 4;
        return tex;
      });
    texturas.set(nombre, t);
  }
  return t;
}

/** Anillo con la textura radial de Saturno: el borde interior lee el principio de la tira y el exterior el final. */
function anillo(mapa: Texture): Mesh {
  const geometria = new RingGeometry(ANILLO.interior, ANILLO.exterior, 160, 1);
  const pos = geometria.attributes.position;
  const uv = geometria.attributes.uv;
  const p = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    const u =
      (p.length() - ANILLO.interior) / (ANILLO.exterior - ANILLO.interior);
    uv.setXY(i, u, 0.5);
  }
  const material = new MeshStandardMaterial({
    map: mapa,
    transparent: true,
    side: DoubleSide,
    roughness: 1,
    metalness: 0,
    depthWrite: false,
  });
  const malla = new Mesh(geometria, material);
  malla.rotation.x = -Math.PI / 2;
  return malla;
}

/** Monta el cuerpo, su luz y la cámara que lo encuadra entero. */
async function montar(astro: Astro) {
  const escena = new Scene();
  const cuerpo = new Group();
  const mapa = await textura(astro);
  const geometria = new SphereGeometry(1, 96, 64);
  const material =
    astro === 'sol'
      ? new MeshBasicMaterial({ map: mapa })
      : new MeshStandardMaterial({ map: mapa, roughness: 1, metalness: 0 });
  const esfera = new Mesh(geometria, material);
  esfera.rotation.y = GIRO_INICIAL[astro];
  cuerpo.add(esfera);
  if (astro === 'saturno') cuerpo.add(anillo(await textura('anillo-saturno')));
  cuerpo.rotation.z = -INCLINACION[astro];
  cuerpo.rotation.x = astro === 'saturno' ? 0.32 : 0.12;
  escena.add(cuerpo);

  const sol = new DirectionalLight(0xfff4e6, 3.1);
  sol.position.set(-3, 1.6, 3.4);
  escena.add(sol, new AmbientLight(0x8090c0, 0.12));

  const radio = astro === 'saturno' ? ANILLO.exterior : 1;
  const camara = new PerspectiveCamera(26, 1, 0.1, 100);
  camara.position.set(0, 0, (radio * 1.04) / Math.tan((13 * Math.PI) / 180));
  return { escena, cuerpo, esfera, camara };
}

/** Lo que la interfaz puede pedirle a un cuerpo en 3D. */
export interface ControlAstro {
  destruir: () => void;
}

/**
 * Un cuerpo en 3D que gira despacio y se arrastra para girarlo; con movimiento reducido solo gira al arrastrar.
 * @returns null si no se pudo crear el contexto WebGL
 */
export async function crearEscenaAstro(
  canvas: HTMLCanvasElement,
  astro: Astro,
): Promise<ControlAstro | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(densidadPixeles(), 2));
  const { escena, esfera, camara } = await montar(astro);
  const quieto = reducirMovimiento();
  let cuadro = 0;
  let ultimo = 0;
  let arrastre: number | null = null;

  const ajustar = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  };
  const dibujar = (ahora: number) => {
    cuadro = 0;
    if (!quieto && arrastre === null && ultimo) {
      esfera.rotation.y += ((ahora - ultimo) / 1000) * 0.08;
    }
    ultimo = ahora;
    renderer.render(escena, camara);
    if (!quieto) cuadro = requestAnimationFrame(dibujar);
  };
  const pedir = () => {
    if (!cuadro) cuadro = requestAnimationFrame(dibujar);
  };
  const alPulsar = (ev: PointerEvent) => {
    canvas.setPointerCapture(ev.pointerId);
    arrastre = ev.clientX;
  };
  const alMover = (ev: PointerEvent) => {
    if (arrastre === null) return;
    esfera.rotation.y += (ev.clientX - arrastre) * 0.01;
    arrastre = ev.clientX;
    pedir();
  };
  const alSoltar = () => {
    arrastre = null;
  };

  canvas.addEventListener('pointerdown', alPulsar);
  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerup', alSoltar);
  canvas.addEventListener('pointercancel', alSoltar);
  const observador = new ResizeObserver(() => {
    ajustar();
    pedir();
  });
  observador.observe(canvas);
  ajustar();
  pedir();

  return {
    destruir: () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      canvas.removeEventListener('pointercancel', alSoltar);
      escena.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (o.material as MeshStandardMaterial).dispose();
        }
      });
      renderer.dispose();
    },
  };
}

const RETRATO_PX = 192;
let pintor: WebGLRenderer | null = null;
let apagar = 0;
const retratos = new Map<Astro, Promise<string>>();

function lienzoRetratos(): WebGLRenderer {
  window.clearTimeout(apagar);
  apagar = window.setTimeout(() => {
    pintor?.dispose();
    pintor = null;
  }, 4000);
  if (!pintor) {
    pintor = new WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    pintor.setPixelRatio(1);
    pintor.setSize(RETRATO_PX, RETRATO_PX, false);
  }
  return pintor;
}

/**
 * Imagen fija del cuerpo, dibujada una vez con el mismo 3D y guardada para el resto de la visita.
 * @returns una URL de imagen; falla si no hay WebGL
 */
export function retratoAstro(astro: Astro): Promise<string> {
  let r = retratos.get(astro);
  if (!r) {
    r = montar(astro).then(({ escena, camara }) => {
      const pintorActual = lienzoRetratos();
      pintorActual.render(escena, camara);
      const url = pintorActual.domElement.toDataURL('image/webp', 0.9);
      escena.traverse((o) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (o.material as MeshStandardMaterial).dispose();
        }
      });
      return url;
    });
    r.catch(() => retratos.delete(astro));
    retratos.set(astro, r);
  }
  return r;
}
