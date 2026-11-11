import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  LineBasicMaterial,
  LineLoop,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type Texture,
} from 'three';
import {
  direccionDe,
  vectorEcuatorial,
  type Vec3,
} from '../servicios/astro/cielo';
import {
  TAMANOS_MAGNITUD,
  colorPorBV,
  tamanoPorMagnitud,
  type Constelacion,
  type FilaEstrella,
} from '../servicios/astro/estrellas';
import { densidadPixeles, texturaPunto } from './comun';

const R_ESTRELLAS = 100;
const R_CUERPOS = 96;
const R_SUELO = 90;
const MAG_TOCABLE = 4;
const RADIO_TOQUE = 28;
const MARGEN_NOMBRE = 8;
const FOV_MIN = 15;
const FOV_MAX = 100;

/** Sol, Luna o planeta ya situado en el marco del mapa. */
export interface CuerpoMapa {
  clave: string;
  nombre: string;
  direccion: Vec3;
  color: string;
  tamano: number;
}

/** Lo que se tocó: una estrella del catálogo o un cuerpo del sistema solar. */
export type Seleccion =
  | { tipo: 'estrella'; indice: number }
  | { tipo: 'cuerpo'; clave: string }
  | { tipo: 'constelacion'; id: string };

/** Lo que la interfaz puede pedirle al mapa. */
export interface ControlMapa {
  fijarCielo: (matriz: number[], cuerpos: CuerpoMapa[]) => void;
  mostrarConstelaciones: (visibles: boolean) => void;
  mirarA: (direccion: Vec3) => void;
  destruir: () => void;
}

const RUMBOS: readonly [string, number][] = [
  ['N', 0],
  ['NE', 45],
  ['E', 90],
  ['SE', 135],
  ['S', 180],
  ['SO', 225],
  ['O', 270],
  ['NO', 315],
];

function puntos(
  posiciones: number[],
  colores: number[],
  tamano: number,
  mapa: Texture,
): Points {
  const geo = new BufferGeometry();
  geo.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(posiciones), 3),
  );
  geo.setAttribute('color', new BufferAttribute(new Float32Array(colores), 3));
  return new Points(
    geo,
    new PointsMaterial({
      size: tamano,
      map: mapa,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: false,
    }),
  );
}

/** Estrellas agrupadas por tamaño, en el marco J2000 (se giran con el grupo). */
function capasEstrellas(estrellas: FilaEstrella[], mapa: Texture): Points[] {
  return TAMANOS_MAGNITUD.map(([, tamano]) => {
    const pos: number[] = [];
    const col: number[] = [];
    for (const [ar, dec, mag, bv] of estrellas) {
      if (tamanoPorMagnitud(mag) !== tamano) continue;
      pos.push(...vectorEcuatorial(ar, dec).map((c) => c * R_ESTRELLAS));
      col.push(...colorPorBV(bv));
    }
    return puntos(pos, col, tamano, mapa);
  });
}

function lineasConstelaciones(constelaciones: Constelacion[]): LineSegments {
  const pos: number[] = [];
  for (const c of constelaciones) {
    for (const tramo of c.lineas) {
      for (let i = 1; i < tramo.length; i++) {
        pos.push(...vectorEcuatorial(...tramo[i - 1]).map((v) => v * 99.5));
        pos.push(...vectorEcuatorial(...tramo[i]).map((v) => v * 99.5));
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3));
  return new LineSegments(
    geo,
    new LineBasicMaterial({
      color: 0x8fb4ff,
      transparent: true,
      opacity: 0.35,
    }),
  );
}

function suelo(): Group {
  const g = new Group();
  const tierra = new Mesh(
    new SphereGeometry(
      R_SUELO,
      48,
      16,
      0,
      Math.PI * 2,
      Math.PI / 2,
      Math.PI / 2,
    ),
    new MeshBasicMaterial({
      color: 0x050c26,
      transparent: true,
      opacity: 0.9,
      side: BackSide,
      depthTest: false,
    }),
  );
  tierra.renderOrder = 10;
  const anillo: number[] = [];
  for (let i = 0; i < 128; i++) {
    anillo.push(...direccionDe(0, (i / 128) * 360).map((v) => v * R_SUELO));
  }
  const geo = new BufferGeometry();
  geo.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(anillo), 3),
  );
  const horizonte = new LineLoop(
    geo,
    new LineBasicMaterial({
      color: 0xff7d66,
      transparent: true,
      opacity: 0.6,
      depthTest: false,
    }),
  );
  horizonte.renderOrder = 11;
  g.add(tierra, horizonte);
  return g;
}

/** Una etiqueta HTML que se coloca sobre un punto del cielo. */
interface Etiqueta {
  el: HTMLSpanElement;
  punto: () => Vector3;
  ocultarBajoHorizonte: boolean;
}

/**
 * Monta el domo del cielo en un contenedor: canvas WebGL, capa de etiquetas y gestos.
 * @param alTocar recibe lo que se tocó, o null si se tocó el cielo vacío
 */
export function crearMapa(
  contenedor: HTMLElement,
  estrellas: FilaEstrella[],
  constelaciones: Constelacion[],
  alTocar: (seleccion: Seleccion | null) => void,
): ControlMapa {
  const canvas = document.createElement('canvas');
  canvas.className = 'mapa-canvas';
  const capa = document.createElement('div');
  capa.className = 'mapa-etiquetas';
  contenedor.append(canvas, capa);

  const renderer = new WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(densidadPixeles());
  renderer.setClearColor(new Color(0x040a22));
  const escena = new Scene();
  const camara = new PerspectiveCamera(70, 1, 0.1, 500);
  const mapa = texturaPunto();

  const cielo = new Group();
  cielo.matrixAutoUpdate = false;
  const capas = capasEstrellas(estrellas, mapa);
  const lineas = lineasConstelaciones(constelaciones);
  cielo.add(lineas, ...capas);
  const cuerposGrupo = new Group();
  escena.add(cielo, cuerposGrupo, suelo());

  const etiquetas: Etiqueta[] = [];
  const nuevaEtiqueta = (
    texto: string,
    clase: string,
    punto: () => Vector3,
    ocultar = true,
  ) => {
    const el = document.createElement('span');
    el.className = `mapa-etiqueta ${clase}`;
    el.textContent = texto;
    capa.appendChild(el);
    const e = { el, punto, ocultarBajoHorizonte: ocultar };
    etiquetas.push(e);
    return e;
  };
  for (const [texto, az] of RUMBOS) {
    const p = new Vector3(...direccionDe(2, az)).multiplyScalar(R_SUELO);
    nuevaEtiqueta(texto, 'mapa-rumbo', () => p, false);
  }
  const etiquetasConstelacion = constelaciones.map((c) => {
    const p = new Vector3(...vectorEcuatorial(...c.centro)).multiplyScalar(
      R_ESTRELLAS,
    );
    return nuevaEtiqueta(c.nombre, 'mapa-constelacion', () =>
      p.clone().applyMatrix4(cielo.matrix),
    );
  });
  estrellas.forEach(([ar, dec, mag, , nombre]) => {
    if (mag >= 1.3 || !nombre) return;
    const p = new Vector3(...vectorEcuatorial(ar, dec)).multiplyScalar(
      R_ESTRELLAS,
    );
    nuevaEtiqueta(nombre, 'mapa-estrella', () =>
      p.clone().applyMatrix4(cielo.matrix),
    );
  });
  let etiquetasCuerpos: Etiqueta[] = [];
  let cuerpos: CuerpoMapa[] = [];

  let yaw = 90;
  let pitch = 35;
  let fov = 70;
  let objetivo: { yaw: number; pitch: number } | null = null;
  let pendiente = 0;

  const ajustarTamano = () => {
    const { clientWidth: w, clientHeight: h } = contenedor;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    pedirCuadro();
  };

  const proyectar = (p: Vector3): { x: number; y: number } | null => {
    const v = p.clone().project(camara);
    if (v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2) return null;
    return {
      x: ((v.x + 1) / 2) * contenedor.clientWidth,
      y: ((1 - v.y) / 2) * contenedor.clientHeight,
    };
  };

  const colocarEtiquetas = () => {
    for (const e of etiquetas) {
      const p = e.punto();
      const pantalla = proyectar(p);
      const bajo = e.ocultarBajoHorizonte && p.y < -2;
      if (!pantalla || bajo || e.el.dataset.oculta === 'si') {
        e.el.style.display = 'none';
        continue;
      }
      e.el.style.display = '';
      e.el.style.transform = `translate(${pantalla.x}px, ${pantalla.y}px)`;
    }
  };

  const dibujar = () => {
    pendiente = 0;
    if (objetivo) {
      const dy = ((objetivo.yaw - yaw + 540) % 360) - 180;
      yaw += dy * 0.15;
      pitch += (objetivo.pitch - pitch) * 0.15;
      if (Math.abs(dy) < 0.05 && Math.abs(objetivo.pitch - pitch) < 0.05)
        objetivo = null;
    }
    camara.fov = fov;
    camara.updateProjectionMatrix();
    camara.position.set(0, 0, 0);
    camara.lookAt(new Vector3(...direccionDe(pitch, yaw)));
    renderer.render(escena, camara);
    colocarEtiquetas();
    if (objetivo) pedirCuadro();
  };

  function pedirCuadro() {
    if (!pendiente) pendiente = requestAnimationFrame(dibujar);
  }

  const nombreTocado = (x: number, y: number): Seleccion | null => {
    const lienzo = canvas.getBoundingClientRect();
    const [px, py] = [x + lienzo.left, y + lienzo.top];
    const i = etiquetasConstelacion.findIndex(({ el }) => {
      if (el.style.display === 'none') return false;
      const r = el.getBoundingClientRect();
      return (
        px >= r.left - MARGEN_NOMBRE &&
        px <= r.right + MARGEN_NOMBRE &&
        py >= r.top - MARGEN_NOMBRE &&
        py <= r.bottom + MARGEN_NOMBRE
      );
    });
    return i < 0 ? null : { tipo: 'constelacion', id: constelaciones[i].id };
  };

  const elegir = (x: number, y: number): Seleccion | null => {
    const nombre = nombreTocado(x, y);
    if (nombre) return nombre;
    let mejor: { s: Seleccion; d: number } | null = null;
    const probar = (s: Seleccion, p: Vector3) => {
      if (p.y < -2) return;
      const q = proyectar(p);
      if (!q) return;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < RADIO_TOQUE && (!mejor || d < mejor.d)) mejor = { s, d };
    };
    cuerpos.forEach((c) =>
      probar(
        { tipo: 'cuerpo', clave: c.clave },
        new Vector3(...c.direccion).multiplyScalar(R_CUERPOS),
      ),
    );
    estrellas.forEach(([ar, dec, mag], indice) => {
      if (mag >= MAG_TOCABLE) return;
      const p = new Vector3(...vectorEcuatorial(ar, dec)).multiplyScalar(
        R_ESTRELLAS,
      );
      probar({ tipo: 'estrella', indice }, p.applyMatrix4(cielo.matrix));
    });
    return (mejor as { s: Seleccion } | null)?.s ?? null;
  };

  const toques = new Map<number, { x: number; y: number }>();
  let inicioToque: { x: number; y: number; t: number; movio: boolean } | null =
    null;
  let distanciaPellizco = 0;

  const alPulsar = (ev: PointerEvent) => {
    canvas.setPointerCapture(ev.pointerId);
    toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (toques.size === 1)
      inicioToque = {
        x: ev.clientX,
        y: ev.clientY,
        t: performance.now(),
        movio: false,
      };
    if (toques.size === 2) {
      const [a, b] = [...toques.values()];
      distanciaPellizco = Math.hypot(a.x - b.x, a.y - b.y);
      if (inicioToque) inicioToque.movio = true;
    }
  };
  const alMover = (ev: PointerEvent) => {
    const antes = toques.get(ev.pointerId);
    if (!antes) return;
    toques.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (toques.size === 2) {
      const [a, b] = [...toques.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (distanciaPellizco)
        fov = Math.min(
          FOV_MAX,
          Math.max(FOV_MIN, (fov * distanciaPellizco) / d),
        );
      distanciaPellizco = d;
    } else {
      const gradosPorPixel = fov / contenedor.clientHeight;
      yaw = (yaw - (ev.clientX - antes.x) * gradosPorPixel + 360) % 360;
      pitch = Math.min(
        90,
        Math.max(-20, pitch + (ev.clientY - antes.y) * gradosPorPixel),
      );
      if (
        inicioToque &&
        Math.hypot(ev.clientX - inicioToque.x, ev.clientY - inicioToque.y) > 6
      ) {
        inicioToque.movio = true;
      }
    }
    objetivo = null;
    pedirCuadro();
  };
  const alSoltar = (ev: PointerEvent) => {
    toques.delete(ev.pointerId);
    if (toques.size < 2) distanciaPellizco = 0;
    if (
      toques.size === 0 &&
      inicioToque &&
      !inicioToque.movio &&
      performance.now() - inicioToque.t < 400
    ) {
      const r = canvas.getBoundingClientRect();
      alTocar(elegir(ev.clientX - r.left, ev.clientY - r.top));
    }
    if (toques.size === 0) inicioToque = null;
  };
  const alRueda = (ev: WheelEvent) => {
    ev.preventDefault();
    fov = Math.min(FOV_MAX, Math.max(FOV_MIN, fov * (1 + ev.deltaY * 0.001)));
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

  const fijarCielo = (matriz: number[], nuevos: CuerpoMapa[]) => {
    const [a, b, c, d, e, f, g, h, i] = matriz;
    cielo.matrix.copy(
      new Matrix4().set(a, d, g, 0, b, e, h, 0, c, f, i, 0, 0, 0, 0, 1),
    );
    cielo.matrixWorldNeedsUpdate = true;
    cuerposGrupo.children.forEach((o) => {
      (o as Points).geometry.dispose();
      ((o as Points).material as PointsMaterial).dispose();
    });
    cuerposGrupo.clear();
    etiquetasCuerpos.forEach((e) => {
      e.el.remove();
      etiquetas.splice(etiquetas.indexOf(e), 1);
    });
    cuerpos = nuevos;
    etiquetasCuerpos = nuevos.map((c) => {
      const p = new Vector3(...c.direccion).multiplyScalar(R_CUERPOS);
      const color = new Color(c.color);
      cuerposGrupo.add(
        puntos(p.toArray(), [color.r, color.g, color.b], c.tamano, mapa),
      );
      return nuevaEtiqueta(c.nombre, 'mapa-cuerpo', () => p);
    });
    pedirCuadro();
  };

  return {
    fijarCielo,
    mostrarConstelaciones: (visibles) => {
      lineas.visible = visibles;
      etiquetasConstelacion.forEach(
        (e) => (e.el.dataset.oculta = visibles ? 'no' : 'si'),
      );
      pedirCuadro();
    },
    mirarA: (direccion) => {
      const [x, y, z] = direccion;
      const alt = (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI;
      const az = ((Math.atan2(x, -z) * 180) / Math.PI + 360) % 360;
      objetivo = { yaw: az, pitch: Math.max(-20, Math.min(90, alt)) };
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
      escena.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as MeshBasicMaterial | undefined;
        mat?.dispose();
      });
      mapa.dispose();
      renderer.dispose();
      canvas.remove();
      capa.remove();
    },
  };
}
