import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BufferGeometry,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { puntoEsfera } from '../servicios/nasa/eonet';
import { densidadPixeles } from './comun';
import { reducirMovimiento } from './movimiento';

/** Un evento en el globo: su lugar, su color y, si se movió, su recorrido [lon, lat]. */
export interface PuntoGlobo {
  id: string;
  lat: number;
  lon: number;
  color: string;
  recorrido?: [number, number][];
}

/** Lo que la interfaz puede pedirle al globo. */
export interface ControlGlobo {
  fijarPuntos: (puntos: PuntoGlobo[]) => void;
  enfocar: (id: string | null) => void;
  fijarUsuario: (lat: number, lon: number) => void;
  destruir: () => void;
}

const D = Math.PI / 180;

/** Atmósfera: un halo azul que se aclara hacia el borde del globo. */
function atmosfera(): Mesh {
  return new Mesh(
    new SphereGeometry(1.09, 64, 48),
    new ShaderMaterial({
      vertexShader:
        'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader:
        'varying vec3 vN; void main(){ float k = pow(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 3.0); gl_FragColor = vec4(0.45, 0.65, 1.0, 1.0) * k; }',
      blending: AdditiveBlending,
      side: BackSide,
      transparent: true,
      depthWrite: false,
    }),
  );
}

/** Giro del globo que deja un lugar de frente a la cámara, con el norte arriba. */
function giroHacia(lat: number, lon: number): { x: number; y: number } {
  const [px, , pz] = puntoEsfera(lat, lon);
  return { x: lat * D, y: -Math.atan2(px, pz) };
}

/**
 * Globo terráqueo 3D con la textura real, eventos que laten, recorridos de tormentas y tu ubicación.
 * Se arrastra para girarlo; gira solo despacio mientras nadie lo toca (salvo con movimiento reducido).
 * @param alElegir avisa del evento pulsado, o null si el clic cayó fuera de los eventos
 * @returns null si no se pudo crear el contexto WebGL
 */
export async function crearGlobo(
  canvas: HTMLCanvasElement,
  alElegir: (id: string | null) => void,
): Promise<ControlGlobo | null> {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(densidadPixeles(), 1.5));
  const escena = new Scene();
  const camara = new PerspectiveCamera(30, 1, 0.1, 50);
  camara.position.set(0, 0, 4.9);
  const sol = new DirectionalLight(0xffffff, 3);
  sol.position.set(-2, 1.5, 3);
  escena.add(sol, new AmbientLight(0xb8c4ea, 1.15), atmosfera());

  const globo = new Group();
  escena.add(globo);
  const mapa = await new TextureLoader().loadAsync(
    `${import.meta.env.BASE_URL}texturas/tierra.webp`,
  );
  mapa.colorSpace = SRGBColorSpace;
  mapa.anisotropy = 4;
  const esfera = new Mesh(
    new SphereGeometry(1, 128, 96),
    new MeshStandardMaterial({ map: mapa, roughness: 0.9, metalness: 0 }),
  );
  globo.add(esfera);

  const quieto = reducirMovimiento();
  const giro = { x: 0.2, y: 0.8 };
  let meta: { x: number; y: number } | null = null;
  let puntos: PuntoGlobo[] = [];
  let marcas: InstancedMesh | null = null;
  const lineas = new Group();
  globo.add(lineas);
  const geoPunto = new SphereGeometry(0.0085, 10, 8);
  const matPunto = new MeshBasicMaterial({ color: 0xffffff });
  const anillo = new Mesh(
    new RingGeometry(0.034, 0.044, 40),
    new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide }),
  );
  anillo.visible = false;
  globo.add(anillo);
  const usuario = new Mesh(
    new SphereGeometry(0.012, 12, 8),
    new MeshBasicMaterial({ color: 0xffffff }),
  );
  usuario.visible = false;
  globo.add(usuario);

  const m = new Matrix4();
  const ayuda = new Object3D();
  const colocarMarcas = (t: number) => {
    if (!marcas) return;
    puntos.forEach((p, i) => {
      ayuda.position.set(...puntoEsfera(p.lat, p.lon, 1.012));
      ayuda.scale.setScalar(quieto ? 1 : 1 + 0.3 * Math.sin(t * 3 + i * 1.7));
      ayuda.updateMatrix();
      marcas!.setMatrixAt(i, ayuda.matrix);
    });
    marcas.instanceMatrix.needsUpdate = true;
  };

  const ajustar = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  };

  let cuadro = 0;
  let ultimo = 0;
  let arrastre: { x: number; y: number; recorrido: number } | null = null;
  const dibujar = (t: number) => {
    const dt = ultimo ? Math.min((t - ultimo) / 1000, 0.1) : 0;
    ultimo = t;
    if (meta) {
      const k = quieto ? 1 : Math.min(1, dt * 4);
      giro.x += (meta.x - giro.x) * k;
      giro.y += (meta.y - giro.y) * k;
    } else if (!arrastre && !quieto) {
      giro.y += dt * 0.06;
    }
    globo.rotation.set(giro.x, giro.y, 0);
    colocarMarcas(t / 1000);
    if (anillo.visible && !quieto) {
      anillo.scale.setScalar(1 + 0.25 * Math.sin(t / 250));
    }
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(dibujar);
  };

  const rayo = new Raycaster();
  const elegirEn = (ev: PointerEvent) => {
    if (!marcas) return alElegir(null);
    const r = canvas.getBoundingClientRect();
    rayo.setFromCamera(
      new Vector2(
        ((ev.clientX - r.left) / r.width) * 2 - 1,
        -((ev.clientY - r.top) / r.height) * 2 + 1,
      ),
      camara,
    );
    const golpe = rayo.intersectObject(marcas, false)[0];
    const frente = rayo.intersectObject(esfera, false)[0];
    if (
      golpe?.instanceId !== undefined &&
      (!frente || golpe.distance <= frente.distance + 0.02)
    ) {
      alElegir(puntos[golpe.instanceId].id);
    } else alElegir(null);
  };

  const alPulsar = (ev: PointerEvent) => {
    canvas.setPointerCapture(ev.pointerId);
    arrastre = { x: ev.clientX, y: ev.clientY, recorrido: 0 };
    meta = null;
  };
  const alMover = (ev: PointerEvent) => {
    if (!arrastre) return;
    const dx = ev.clientX - arrastre.x;
    const dy = ev.clientY - arrastre.y;
    giro.y += dx * 0.006;
    giro.x = Math.min(Math.max(giro.x + dy * 0.006, -1.3), 1.3);
    arrastre = {
      x: ev.clientX,
      y: ev.clientY,
      recorrido: arrastre.recorrido + Math.hypot(dx, dy),
    };
  };
  const alSoltar = (ev: PointerEvent) => {
    if (arrastre && arrastre.recorrido < 6) elegirEn(ev);
    arrastre = null;
  };

  canvas.addEventListener('pointerdown', alPulsar);
  canvas.addEventListener('pointermove', alMover);
  canvas.addEventListener('pointerup', alSoltar);
  canvas.addEventListener('pointercancel', () => (arrastre = null));
  const observador = new ResizeObserver(ajustar);
  observador.observe(canvas);
  ajustar();
  cuadro = requestAnimationFrame(dibujar);

  return {
    fijarPuntos: (nuevos) => {
      puntos = nuevos;
      if (marcas) {
        globo.remove(marcas);
        marcas.dispose();
      }
      marcas = new InstancedMesh(
        geoPunto,
        matPunto,
        Math.max(nuevos.length, 1),
      );
      marcas.count = nuevos.length;
      const c = new Color();
      nuevos.forEach((p, i) => {
        marcas!.setColorAt(i, c.set(p.color));
        marcas!.setMatrixAt(i, m.identity());
      });
      globo.add(marcas);
      lineas.children.forEach((l) => (l as Line).geometry.dispose());
      lineas.clear();
      for (const p of nuevos) {
        if (!p.recorrido || p.recorrido.length < 2) continue;
        const geo = new BufferGeometry().setFromPoints(
          p.recorrido.map(
            ([lon, lat]) => new Vector3(...puntoEsfera(lat, lon, 1.006)),
          ),
        );
        lineas.add(
          new Line(
            geo,
            new LineBasicMaterial({
              color: p.color,
              transparent: true,
              opacity: 0.7,
            }),
          ),
        );
      }
    },
    enfocar: (id) => {
      const p = puntos.find((x) => x.id === id);
      if (!p) {
        anillo.visible = false;
        return;
      }
      const pos = new Vector3(...puntoEsfera(p.lat, p.lon, 1.016));
      anillo.position.copy(pos);
      anillo.lookAt(pos.clone().multiplyScalar(2));
      anillo.visible = true;
      const g = giroHacia(p.lat, p.lon);
      const vueltas = Math.round((giro.y - g.y) / (2 * Math.PI));
      meta = { x: g.x, y: g.y + vueltas * 2 * Math.PI };
    },
    fijarUsuario: (lat, lon) => {
      usuario.position.set(...puntoEsfera(lat, lon, 1.01));
      usuario.visible = true;
      if (!meta) {
        const g = giroHacia(lat, lon);
        giro.x = g.x;
        giro.y = g.y;
      }
    },
    destruir: () => {
      cancelAnimationFrame(cuadro);
      observador.disconnect();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      escena.traverse((o) => {
        if (o instanceof Mesh || o instanceof Line) {
          o.geometry.dispose();
          (o.material as MeshBasicMaterial).dispose();
        }
      });
      marcas?.dispose();
      mapa.dispose();
      renderer.dispose();
    },
  };
}
