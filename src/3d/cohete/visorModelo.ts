import {
  Box3,
  HemisphereLight,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { acotar } from './vistas';

/** Lo que la interfaz puede pedirle al visor de modelos. */
export interface ControlVisor {
  cargar: (
    url: string,
    alProgreso: (fraccion: number) => void,
  ) => Promise<void>;
  destruir: () => void;
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

/** Visor de un modelo glTF: lo centra, lo encuadra y deja girarlo con el ratón y acercarlo con la rueda. */
export function crearVisor(contenedor: HTMLElement): ControlVisor {
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
  let azimut = 30;
  let elevacion = 12;
  let distancia = 10;
  let radio = 1;
  let pendiente = 0;

  const dibujar = () => {
    pendiente = 0;
    const az = (azimut * Math.PI) / 180;
    const el = (elevacion * Math.PI) / 180;
    camara.position.set(
      distancia * Math.cos(el) * Math.sin(az),
      distancia * Math.sin(el),
      distancia * Math.cos(el) * Math.cos(az),
    );
    camara.lookAt(0, 0, 0);
    renderer.render(escena, camara);
  };
  const pedirCuadro = () => {
    if (!pendiente) pendiente = requestAnimationFrame(dibujar);
  };

  const ajustarTamano = () => {
    const { clientWidth: w, clientHeight: h } = contenedor;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    pedirCuadro();
  };

  let arrastre: { x: number; y: number } | null = null;
  const alPulsar = (ev: PointerEvent) => {
    canvas.setPointerCapture(ev.pointerId);
    arrastre = { x: ev.clientX, y: ev.clientY };
  };
  const alMover = (ev: PointerEvent) => {
    if (!arrastre) return;
    azimut = (azimut - (ev.clientX - arrastre.x) * 0.4 + 360) % 360;
    elevacion = acotar(elevacion + (ev.clientY - arrastre.y) * 0.3, -80, 80);
    arrastre = { x: ev.clientX, y: ev.clientY };
    pedirCuadro();
  };
  const alSoltar = () => {
    arrastre = null;
  };
  const alRueda = (ev: WheelEvent) => {
    ev.preventDefault();
    const factor = Math.exp(ev.deltaY * (ev.ctrlKey ? 0.01 : 0.0015));
    distancia = acotar(distancia * factor, radio * 0.8, radio * 8);
    pedirCuadro();
  };

  canvas.addEventListener('pointerdown', alPulsar);
  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerup', alSoltar);
  canvas.addEventListener('pointercancel', alSoltar);
  canvas.addEventListener('wheel', alRueda, { passive: false });
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(contenedor);
  ajustarTamano();

  const encuadrar = (objeto: Object3D) => {
    const caja = new Box3().setFromObject(objeto);
    const centro = caja.getCenter(new Vector3());
    objeto.position.sub(centro);
    radio = caja.getSize(new Vector3()).length() / 2 || 1;
    const medioCampo = ((camara.fov / 2) * Math.PI) / 180;
    distancia = (radio / Math.sin(medioCampo)) * 1.05;
    camara.near = radio / 100;
    camara.far = radio * 20;
    camara.updateProjectionMatrix();
  };

  return {
    cargar: async (url, alProgreso) => {
      const gltf = await cargador.loadAsync(url, (ev) => {
        if (ev.total) alProgreso(ev.loaded / ev.total);
      });
      if (modelo) {
        escena.remove(modelo);
        liberar(modelo);
      }
      modelo = gltf.scene;
      encuadrar(modelo);
      escena.add(modelo);
      pedirCuadro();
    },
    destruir: () => {
      cancelAnimationFrame(pendiente);
      observador.disconnect();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      canvas.removeEventListener('pointercancel', alSoltar);
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
