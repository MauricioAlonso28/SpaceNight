import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type MeshLambertMaterial,
} from 'three';
import { ALTO, crearModelo, type ModeloCohete } from './modelo';

const DISTANCIA_MIN = 5;
const DISTANCIA_MAX = 170;
const ELEVACION_MIN = -25;
const ELEVACION_MAX = 70;
const MOVIMIENTO_CLIC = 5;
const COLOR_ELEGIDA = 0xb3412d;
const COLOR_ENCIMA = 0x3b2a26;

/** Dónde mira la cámara: giro, inclinación y distancia alrededor de un punto del eje. */
export interface Vista {
  azimut: number;
  elevacion: number;
  distancia: number;
  objetivoY: number;
}

/** Vista inicial: el cohete entero, algo de lado y desde un poco arriba. */
export const VISTA_GENERAL: Vista = {
  azimut: 35,
  elevacion: 10,
  distancia: 132,
  objetivoY: ALTO / 2,
};

/** Lo que la interfaz puede pedirle a la escena. */
export interface ControlCohete {
  elegir: (id: string | null) => void;
  vistaGeneral: () => void;
  destruir: () => void;
}

/**
 * Opciones de la escena.
 * @property nombre texto que se muestra al pasar el puntero sobre una pieza
 * @property alElegir recibe el id de la pieza tocada, o null si se tocó el vacío
 */
export interface OpcionesEscena {
  nombre: (id: string) => string;
  alElegir: (id: string | null) => void;
}

const acotar = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const suave = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

function materiales(malla: Mesh): Material[] {
  return Array.isArray(malla.material) ? malla.material : [malla.material];
}

function brillo(malla: Mesh, color: number): void {
  for (const m of materiales(malla)) {
    (m as MeshLambertMaterial).emissive?.setHex(color);
  }
}

/** Densidad de píxeles hasta 1,5: el cohete se ve nítido sin cargar la GPU de un portátil modesto. */
function densidad(): number {
  return Math.min(window.devicePixelRatio || 1, 1.5);
}

/** Monta el cohete en un contenedor: canvas WebGL, etiqueta flotante y gestos de ratón y trackpad. */
export function crearEscena(
  contenedor: HTMLElement,
  opciones: OpcionesEscena,
): ControlCohete {
  const canvas = document.createElement('canvas');
  canvas.className = 'cohete-canvas';
  const pista = document.createElement('div');
  pista.className = 'cohete-pista';
  pista.hidden = true;
  contenedor.append(canvas, pista);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(densidad());
  renderer.setClearColor(0x000000, 0);
  const escena = new Scene();
  const camara = new PerspectiveCamera(35, 1, 0.5, 600);
  const luz = new DirectionalLight(0xffffff, 2.2);
  luz.position.set(-1, 0.7, 0.55);
  camara.add(luz);
  escena.add(camara, new HemisphereLight(0xe6eeff, 0x1c2547, 1.4));

  const modelo: ModeloCohete = crearModelo();
  escena.add(modelo.grupo);
  const tocables: Mesh[] = [];
  for (const p of modelo.piezas.values()) tocables.push(p.toque ?? p.malla);
  const mallaDe = (id: string) => modelo.piezas.get(id)?.malla;

  const vista: Vista = { ...VISTA_GENERAL };
  let animacion: {
    desde: Vista;
    hasta: Vista;
    inicio: number;
    duracion: number;
  } | null = null;
  let elegida: string | null = null;
  let encima: string | null = null;
  let pendiente = 0;

  const colocarCamara = () => {
    const az = (vista.azimut * Math.PI) / 180;
    const el = (vista.elevacion * Math.PI) / 180;
    camara.position.set(
      vista.distancia * Math.cos(el) * Math.sin(az),
      vista.objetivoY + vista.distancia * Math.sin(el),
      vista.distancia * Math.cos(el) * Math.cos(az),
    );
    camara.lookAt(0, vista.objetivoY, 0);
  };

  const avanzarAnimacion = (ahora: number) => {
    if (!animacion) return;
    const t = acotar((ahora - animacion.inicio) / animacion.duracion, 0, 1);
    const k = suave(t);
    const { desde, hasta } = animacion;
    const giro = ((hasta.azimut - desde.azimut + 540) % 360) - 180;
    vista.azimut = desde.azimut + giro * k;
    vista.elevacion = desde.elevacion + (hasta.elevacion - desde.elevacion) * k;
    vista.distancia = desde.distancia + (hasta.distancia - desde.distancia) * k;
    vista.objetivoY = desde.objetivoY + (hasta.objetivoY - desde.objetivoY) * k;
    if (t >= 1) animacion = null;
  };

  const dibujar = (ahora: number) => {
    pendiente = 0;
    avanzarAnimacion(ahora);
    colocarCamara();
    renderer.render(escena, camara);
    if (animacion) pedirCuadro();
  };

  function pedirCuadro() {
    if (!pendiente) pendiente = requestAnimationFrame(dibujar);
  }

  const irA = (destino: Vista, duracion = 700) => {
    const reducir = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (reducir || duracion <= 0) {
      Object.assign(vista, destino);
      animacion = null;
    } else {
      animacion = {
        desde: { ...vista },
        hasta: destino,
        inicio: performance.now(),
        duracion,
      };
    }
    pedirCuadro();
  };

  const ajustarTamano = () => {
    const { clientWidth: w, clientHeight: h } = contenedor;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    pedirCuadro();
  };

  const raycaster = new Raycaster();
  const puntero = new Vector2();

  const rayoDesde = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect();
    puntero.set(
      ((x - r.left) / r.width) * 2 - 1,
      -((y - r.top) / r.height) * 2 + 1,
    );
    raycaster.setFromCamera(puntero, camara);
  };

  const piezaEn = (x: number, y: number): string | null => {
    rayoDesde(x, y);
    const golpe = raycaster.intersectObjects(tocables, false)[0];
    return (golpe?.object.userData.id as string | undefined) ?? null;
  };

  const actualizarBrillos = () => {
    for (const p of modelo.piezas.values()) {
      const color =
        p.id === elegida ? COLOR_ELEGIDA : p.id === encima ? COLOR_ENCIMA : 0;
      brillo(p.malla, color);
    }
    pedirCuadro();
  };

  const mostrarPista = (id: string | null, x = 0, y = 0) => {
    if (encima !== id) {
      encima = id;
      actualizarBrillos();
    }
    canvas.style.cursor = id ? 'pointer' : '';
    if (!id) {
      pista.hidden = true;
      return;
    }
    const r = contenedor.getBoundingClientRect();
    pista.textContent = opciones.nombre(id);
    pista.hidden = false;
    pista.style.transform = `translate(${x - r.left + 14}px, ${y - r.top + 14}px)`;
  };

  let arrastre: {
    x: number;
    y: number;
    inicioX: number;
    inicioY: number;
    desplazar: boolean;
    movio: boolean;
  } | null = null;

  const alPulsar = (ev: PointerEvent) => {
    if (ev.button !== 0 && ev.button !== 2) return;
    canvas.setPointerCapture(ev.pointerId);
    arrastre = {
      x: ev.clientX,
      y: ev.clientY,
      inicioX: ev.clientX,
      inicioY: ev.clientY,
      desplazar: ev.button === 2 || ev.shiftKey,
      movio: false,
    };
    animacion = null;
  };

  const alMover = (ev: PointerEvent) => {
    if (!arrastre) {
      mostrarPista(piezaEn(ev.clientX, ev.clientY), ev.clientX, ev.clientY);
      return;
    }
    const dx = ev.clientX - arrastre.x;
    const dy = ev.clientY - arrastre.y;
    arrastre.x = ev.clientX;
    arrastre.y = ev.clientY;
    if (
      Math.hypot(ev.clientX - arrastre.inicioX, ev.clientY - arrastre.inicioY) >
      MOVIMIENTO_CLIC
    ) {
      arrastre.movio = true;
      mostrarPista(null);
    }
    if (arrastre.desplazar) {
      vista.objetivoY = acotar(
        vista.objetivoY + dy * vista.distancia * 0.0016,
        0,
        ALTO,
      );
    } else {
      vista.azimut = (vista.azimut - dx * 0.35 + 360) % 360;
      vista.elevacion = acotar(
        vista.elevacion + dy * 0.25,
        ELEVACION_MIN,
        ELEVACION_MAX,
      );
    }
    pedirCuadro();
  };

  const alSoltar = (ev: PointerEvent) => {
    if (!arrastre) return;
    const fueClic = !arrastre.movio && ev.type === 'pointerup';
    arrastre = null;
    const id = piezaEn(ev.clientX, ev.clientY);
    mostrarPista(id, ev.clientX, ev.clientY);
    if (!fueClic) return;
    elegir(id);
    opciones.alElegir(id);
  };

  const plano = new Plane();
  const corte = new Vector3();

  const alturaBajo = (x: number, y: number): number | null => {
    rayoDesde(x, y);
    const haciaCamara = new Vector3(
      camara.position.x,
      0,
      camara.position.z,
    ).normalize();
    plano.setFromNormalAndCoplanarPoint(haciaCamara, new Vector3(0, 0, 0));
    return raycaster.ray.intersectPlane(plano, corte) ? corte.y : null;
  };

  const alRueda = (ev: WheelEvent) => {
    ev.preventDefault();
    animacion = null;
    const factor = Math.exp(ev.deltaY * (ev.ctrlKey ? 0.01 : 0.0015));
    const antes = vista.distancia;
    vista.distancia = acotar(antes * factor, DISTANCIA_MIN, DISTANCIA_MAX);
    const y = alturaBajo(ev.clientX, ev.clientY);
    if (y !== null) {
      const k = 1 - vista.distancia / antes;
      vista.objetivoY = acotar(
        vista.objetivoY + (y - vista.objetivoY) * k,
        0,
        ALTO,
      );
    }
    pedirCuadro();
  };

  const alSalir = () => {
    if (!arrastre) mostrarPista(null);
  };
  const sinMenu = (ev: Event) => ev.preventDefault();

  canvas.addEventListener('pointerdown', alPulsar);
  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerup', alSoltar);
  canvas.addEventListener('pointercancel', alSoltar);
  canvas.addEventListener('pointerleave', alSalir);
  canvas.addEventListener('wheel', alRueda, { passive: false });
  canvas.addEventListener('contextmenu', sinMenu);
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(contenedor);
  ajustarTamano();

  function elegir(id: string | null) {
    elegida = id && mallaDe(id) ? id : null;
    actualizarBrillos();
  }

  return {
    elegir,
    vistaGeneral: () => irA(VISTA_GENERAL),
    destruir: () => {
      cancelAnimationFrame(pendiente);
      observador.disconnect();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      canvas.removeEventListener('pointercancel', alSoltar);
      canvas.removeEventListener('pointerleave', alSalir);
      canvas.removeEventListener('wheel', alRueda);
      canvas.removeEventListener('contextmenu', sinMenu);
      escena.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        o.geometry.dispose();
        materiales(o).forEach((m) => m.dispose());
      });
      renderer.dispose();
      canvas.remove();
      pista.remove();
    },
  };
}
