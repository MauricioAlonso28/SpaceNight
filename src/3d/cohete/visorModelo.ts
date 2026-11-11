import {
  Box3,
  HemisphereLight,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { crearEtapas, type Etapas } from './etapasModelo';
import { acotar } from './vistas';

/**
 * Lo que la interfaz puede pedirle al visor de modelos.
 * @property cargar muestra un glb ya descargado; con piezas, los nombres de las etapas que se pueden separar, de abajo arriba
 * @property separar abre o cierra el hueco entre etapas
 * @property abrir saca una etapa hacia un lado y la centra; con null la devuelve a su sitio
 * @property fijarMargenes píxeles tapados por columnas a cada lado: el modelo se centra en el hueco libre
 */
export interface ControlVisor {
  cargar: (datos: ArrayBuffer, piezas?: readonly string[]) => Promise<void>;
  separar: (si: boolean) => void;
  abrir: (id: string | null) => void;
  fijarMargenes: (izquierda: number, derecha: number) => void;
  destruir: () => void;
}

/** Píxeles que puede moverse el puntero para que cuente como clic y no como giro. */
const TOLERANCIA_CLIC = 6;

/** Si el sistema pide menos movimiento. */
function reducirMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function liberar(objeto: Object3D): void {
  objeto.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.geometry.dispose();
    const mats: Material[] = Array.isArray(o.material)
      ? o.material
      : [o.material];
    mats.forEach((m) => m.dispose());
  });
}

/**
 * Visor de un modelo glTF: lo centra, lo encuadra y deja girarlo con el ratón y acercarlo con la rueda.
 * @param alElegir avisa de la etapa pulsada, o null si el clic cayó fuera del modelo
 */
export function crearVisor(
  contenedor: HTMLElement,
  alElegir: (id: string | null) => void = () => {},
): ControlVisor {
  const canvas = document.createElement('canvas');
  canvas.className = 'cohete-canvas';
  contenedor.append(canvas);

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const escena = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environment = entorno;
  const camara = new PerspectiveCamera(35, 1, 0.01, 1000);
  const luz = new DirectionalLight(0xffffff, 1.6);
  luz.position.set(-1, 0.8, 0.6);
  camara.add(luz);
  escena.add(camara, new HemisphereLight(0xe6eeff, 0x1c2547, 0.8));

  const draco = new DRACOLoader();
  const cargador = new GLTFLoader().setDRACOLoader(draco);

  let modelo: Object3D | null = null;
  let etapas: Etapas | null = null;
  let azimut = 30;
  let elevacion = 12;
  let zoom = 1;
  let radio = 1;
  let pendiente = 0;
  let ultimo = 0;
  const margen = { izquierda: 0, derecha: 0 };
  const margenMeta = { izquierda: 0, derecha: 0 };

  const medioCampo = () => {
    const { clientWidth: w, clientHeight: h } = contenedor;
    const libre = Math.max(w - margen.izquierda - margen.derecha, w * 0.3);
    const vertical = ((camara.fov / 2) * Math.PI) / 180;
    return Math.min(
      vertical,
      Math.atan(Math.tan(vertical) * (h ? libre / h : camara.aspect)),
    );
  };

  const moverMargenes = (dt: number) => {
    const paso = reducirMovimiento() ? 1 : Math.min(1, dt * 8);
    let moviendo = false;
    for (const lado of ['izquierda', 'derecha'] as const) {
      const falta = margenMeta[lado] - margen[lado];
      margen[lado] =
        Math.abs(falta) < 0.5 ? margenMeta[lado] : margen[lado] + falta * paso;
      moviendo ||= margen[lado] !== margenMeta[lado];
    }
    const { clientWidth: w, clientHeight: h } = contenedor;
    if (w && h) {
      camara.setViewOffset(
        w,
        h,
        (margen.derecha - margen.izquierda) / 2,
        0,
        w,
        h,
      );
    }
    return moviendo;
  };

  const dibujar = (ahora: number) => {
    pendiente = 0;
    const dt = ultimo ? Math.min((ahora - ultimo) / 1000, 0.1) : 0;
    const etapasMoviendo = etapas?.avanzar(dt) ?? false;
    const animando = moverMargenes(dt) || etapasMoviendo;
    ultimo = animando ? ahora : 0;
    const foco = etapas?.enfoque() ?? {
      centro: new Vector3(),
      radio,
      mezcla: 0,
    };
    const distancia = (foco.radio / Math.sin(medioCampo())) * 1.05 * zoom;
    const az = (azimut * Math.PI) / 180;
    const el = (elevacion * Math.PI) / 180;
    camara.position
      .set(
        Math.cos(el) * Math.sin(az),
        Math.sin(el),
        Math.cos(el) * Math.cos(az),
      )
      .multiplyScalar(distancia)
      .add(foco.centro);
    camara.lookAt(foco.centro);
    renderer.render(escena, camara);
    if (animando) pedirCuadro();
  };
  const pedirCuadro = () => {
    if (!pendiente) pendiente = requestAnimationFrame(dibujar);
  };

  const ajustarTamano = () => {
    const { clientWidth: w, clientHeight: h } = contenedor;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.setViewOffset(
      w,
      h,
      (margen.derecha - margen.izquierda) / 2,
      0,
      w,
      h,
    );
    pedirCuadro();
  };

  const rayo = new Raycaster();
  const elegirEn = (ev: PointerEvent) => {
    if (!modelo || !etapas) return;
    const caja = canvas.getBoundingClientRect();
    const punto = new Vector2(
      ((ev.clientX - caja.left) / caja.width) * 2 - 1,
      -((ev.clientY - caja.top) / caja.height) * 2 + 1,
    );
    rayo.setFromCamera(punto, camara);
    const tocado = rayo
      .intersectObject(modelo, true)
      .find((i) => (i.object as Mesh).material && i.object.visible);
    alElegir(tocado ? etapas.piezaDe(tocado.object) : null);
  };

  let arrastre: { x: number; y: number; recorrido: number } | null = null;
  const alPulsar = (ev: PointerEvent) => {
    canvas.setPointerCapture(ev.pointerId);
    arrastre = { x: ev.clientX, y: ev.clientY, recorrido: 0 };
  };
  const alMover = (ev: PointerEvent) => {
    if (!arrastre) return;
    const dx = ev.clientX - arrastre.x;
    const dy = ev.clientY - arrastre.y;
    azimut = (azimut - dx * 0.4 + 360) % 360;
    elevacion = acotar(elevacion + dy * 0.3, -80, 80);
    arrastre = {
      x: ev.clientX,
      y: ev.clientY,
      recorrido: arrastre.recorrido + Math.hypot(dx, dy),
    };
    pedirCuadro();
  };
  const alSoltar = (ev: PointerEvent) => {
    if (arrastre && arrastre.recorrido < TOLERANCIA_CLIC) elegirEn(ev);
    arrastre = null;
  };
  const alCancelar = () => {
    arrastre = null;
  };
  const alRueda = (ev: WheelEvent) => {
    ev.preventDefault();
    const factor = Math.exp(ev.deltaY * (ev.ctrlKey ? 0.01 : 0.0015));
    zoom = acotar(zoom * factor, 0.25, 2.3);
    pedirCuadro();
  };

  canvas.addEventListener('pointerdown', alPulsar);
  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerup', alSoltar);
  canvas.addEventListener('pointercancel', alCancelar);
  canvas.addEventListener('wheel', alRueda, { passive: false });
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(contenedor);
  ajustarTamano();

  const encuadrar = (objeto: Object3D) => {
    const caja = new Box3().setFromObject(objeto);
    const centro = caja.getCenter(new Vector3());
    objeto.position.sub(centro);
    radio = caja.getSize(new Vector3()).length() / 2 || 1;
    zoom = 1;
    camara.near = radio / 100;
    camara.far = radio * 20;
    camara.updateProjectionMatrix();
  };

  return {
    cargar: async (datos, piezas = []) => {
      const gltf = await cargador.parseAsync(datos, '');
      if (modelo) {
        escena.remove(modelo);
        liberar(modelo);
      }
      modelo = gltf.scene;
      encuadrar(modelo);
      escena.add(modelo);
      etapas = crearEtapas(modelo, piezas, radio, !reducirMovimiento());
      pedirCuadro();
    },
    separar: (si) => {
      etapas?.separar(si);
      pedirCuadro();
    },
    fijarMargenes: (izquierda, derecha) => {
      margenMeta.izquierda = Math.max(0, izquierda);
      margenMeta.derecha = Math.max(0, derecha);
      pedirCuadro();
    },
    abrir: (id) => {
      if (id === null) etapas?.cerrar();
      else {
        const az = (azimut * Math.PI) / 180;
        etapas?.abrir(id, new Vector3(Math.cos(az), 0, -Math.sin(az)));
      }
      pedirCuadro();
    },
    destruir: () => {
      cancelAnimationFrame(pendiente);
      observador.disconnect();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      canvas.removeEventListener('pointercancel', alCancelar);
      canvas.removeEventListener('wheel', alRueda);
      if (modelo) liberar(modelo);
      entorno.dispose();
      pmrem.dispose();
      draco.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
