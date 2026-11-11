import {
  Color,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  Object3D,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Intersection,
  type Material,
  type MeshLambertMaterial,
} from 'three';
import { DURACION_DESPIECE, anguloCorto, fases } from './despiece';
import {
  SITUACION_INICIAL,
  transicion,
  type Estado,
  type Evento,
} from './estados';
import { ALTO, crearModelo, type PiezaModelo } from './modelo';
import {
  VISTA_GENERAL,
  acotar,
  interpolarVista,
  suave,
  vistaDePieza,
  type Vista,
} from './vistas';

const DISTANCIA_MIN = 5;
const DISTANCIA_MAX = 170;
const ELEVACION_MIN = -25;
const ELEVACION_MAX = 70;
const MOVIMIENTO_CLIC = 5;
const ARRASTRE_VOLVER = 60;
const DESLIZ_VOLVER = 110;
const COLOR_ELEGIDA = 0x9a3826;
const COLOR_ENCIMA = 0x3b2a26;
const SILUETA = new Color(0x18224a);
const OPACIDAD_CORTE = 0.38;
const GIRO_POR_SEGUNDO = 0.35;
const LEJOS = 1e6;
const SVG = 'http://www.w3.org/2000/svg';

/**
 * Un paso del recorrido con scroll.
 * @property resalta piezas que se iluminan; 'casco' ilumina los cascos de aluminio
 * @property foco pieza que la cámara encuadra, o null para ver el cohete entero
 */
export interface PasoRecorrido {
  nombre: string;
  interior: boolean;
  foco: string | null;
  resalta: string[];
}

/** Lo que la interfaz puede pedirle a la escena. */
export interface ControlCohete {
  abrir: (id: string, resalta?: string[]) => void;
  volver: () => void;
  vistaGeneral: () => void;
  fijarCorte: (activo: boolean) => void;
  iniciarRecorrido: (pasos: PasoRecorrido[]) => void;
  irAlPaso: (progreso: number) => void;
  salirRecorrido: () => void;
  destruir: () => void;
}

/**
 * Opciones de la escena.
 * @property nombre texto que se muestra al pasar el puntero sobre una pieza
 * @property interior si la pieza va dentro del casco y lo atraviesa al salir
 * @property alCambiar recibe cada cambio de estado y la pieza abierta, si la hay
 */
export interface OpcionesEscena {
  nombre: (id: string) => string;
  interior: (id: string) => boolean;
  alCambiar: (estado: Estado, id: string | null) => void;
}

/**
 * Una pieza sacada del cohete: de dónde sale, adónde va y cuánto lleva de animación.
 * @property t segundos de animación, de 0 (en su sitio) a DURACION_DESPIECE (centrada)
 * @property sentido 1 al abrir, -1 al volver, 0 quieta
 */
interface Despiece {
  id: string;
  pieza: PiezaModelo | null;
  resalta: Set<string>;
  pivote: Object3D | null;
  centro: Vector3;
  salida: Vector3;
  destino: Vector3;
  escala: number;
  foco: Vector3;
  aparte: Vector3;
  t: number;
  sentido: 1 | -1 | 0;
  giro: number;
  giroVuelta: number;
  atravesar: boolean;
}

function materiales(malla: Mesh): Material[] {
  return Array.isArray(malla.material) ? malla.material : [malla.material];
}

function brillo(malla: Mesh, color: number | Color): void {
  for (const m of materiales(malla)) {
    const emisivo = (m as MeshLambertMaterial).emissive;
    if (typeof color === 'number') emisivo?.setHex(color);
    else emisivo?.copy(color);
  }
}

/** Equipo modesto: pocos núcleos o poca memoria; ahí se dibuja con menos detalle. */
function gamaBaja(): boolean {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.hardwareConcurrency ?? 8) <= 4 || (n.deviceMemory ?? 8) <= 4;
}

/** Densidad de píxeles hasta 1,5, y 1 en gama baja: el cohete se ve nítido sin cargar la GPU. */
function densidad(): number {
  return gamaBaja() ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
}

function reducirMovimiento(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Etiqueta HTML con una línea SVG hasta su pieza. */
function crearEtiqueta(capa: HTMLElement) {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'cohete-lineas');
  const linea = document.createElementNS(SVG, 'line');
  const punto = document.createElementNS(SVG, 'circle');
  punto.setAttribute('r', '4');
  svg.append(linea, punto);
  const caja = document.createElement('div');
  caja.className = 'cohete-etiqueta3d';
  capa.append(svg, caja);
  return {
    mostrar: (texto: string, x: number, y: number, ancho: number) => {
      caja.textContent = texto;
      caja.hidden = false;
      svg.style.display = '';
      const izquierda = x > ancho * 0.42;
      const cx = izquierda
        ? Math.max(16, x - 230)
        : Math.min(ancho - 16, x + 230);
      const cy = Math.max(24, y - 70);
      caja.style.transform = `translate(${cx}px, ${cy}px) translate(${izquierda ? '0' : '-100%'}, -50%)`;
      const bx = izquierda ? cx + caja.offsetWidth : cx - caja.offsetWidth;
      linea.setAttribute('x1', String(bx));
      linea.setAttribute('y1', String(cy));
      linea.setAttribute('x2', String(x));
      linea.setAttribute('y2', String(y));
      punto.setAttribute('cx', String(x));
      punto.setAttribute('cy', String(y));
    },
    ocultar: () => {
      caja.hidden = true;
      svg.style.display = 'none';
    },
    quitar: () => {
      svg.remove();
      caja.remove();
    },
  };
}

/** Monta el cohete en un contenedor: canvas WebGL, etiquetas, gestos de ratón y trackpad y el despiece. */
export function crearEscena(
  contenedor: HTMLElement,
  opciones: OpcionesEscena,
): ControlCohete {
  const canvas = document.createElement('canvas');
  canvas.className = 'cohete-canvas';
  canvas.tabIndex = -1;
  const pista = document.createElement('div');
  pista.className = 'cohete-pista';
  pista.hidden = true;
  contenedor.append(canvas, pista);
  const etiqueta = crearEtiqueta(contenedor);
  etiqueta.ocultar();

  const renderer = new WebGLRenderer({
    canvas,
    antialias: !gamaBaja(),
    alpha: true,
  });
  renderer.setPixelRatio(densidad());
  renderer.setClearColor(0x000000, 0);
  renderer.localClippingEnabled = true;
  const escena = new Scene();
  const camara = new PerspectiveCamera(35, 1, 0.5, 600);
  const luz = new DirectionalLight(0xffffff, 2.2);
  luz.position.set(-1, 0.7, 0.55);
  camara.add(luz);
  escena.add(camara, new HemisphereLight(0xe6eeff, 0x1c2547, 1.4));

  const modelo = crearModelo();
  const { grupo } = modelo;
  escena.add(grupo);
  const tocables: Mesh[] = [];
  for (const p of modelo.piezas.values()) tocables.push(p.toque ?? p.malla);
  const visibles: Mesh[] = [
    ...modelo.cascos,
    ...[...modelo.piezas.values()].map((p) => p.malla),
  ];
  const coloresBase = new Map<Material, Color>();
  for (const m of visibles.flatMap(materiales)) {
    coloresBase.set(m, (m as MeshLambertMaterial).color.clone());
  }

  const plano = new Plane(new Vector3(0, 0, -1), LEJOS);
  const recortables: Mesh[] = [
    ...modelo.cascos,
    ...[...modelo.piezas.values()]
      .filter((p) => p.recortable)
      .map((p) => p.malla),
  ];
  const envolventes = new Set<Mesh>([
    ...modelo.cascos,
    modelo.piezas.get('cofia')!.malla,
    modelo.piezas.get('interetapa')!.malla,
  ]);

  let situacion = SITUACION_INICIAL;
  let vista: Vista = { ...VISTA_GENERAL };
  let animacion: {
    desde: Vista;
    hasta: Vista;
    inicio: number;
    duracion: number;
  } | null = null;
  let encima: string | null = null;
  let corteManual = false;
  let corte = false;
  let pasos: PasoRecorrido[] = [];
  let pasoActivo = -1;
  let antesDelRecorrido: { vista: Vista; corte: boolean } | null = null;
  let despiece: Despiece | null = null;
  let ultimoCuadro = 0;
  let pendiente = 0;

  const cambiar = (evento: Evento, id: string | null = null): boolean => {
    const nueva = transicion(situacion, evento);
    if (!nueva) return false;
    situacion = nueva;
    opciones.alCambiar(nueva.estado, id);
    return true;
  };

  const colocarCamara = () => {
    const az = (vista.azimut * Math.PI) / 180;
    const el = (vista.elevacion * Math.PI) / 180;
    camara.position.set(
      vista.distancia * Math.cos(el) * Math.sin(az),
      vista.objetivoY + vista.distancia * Math.sin(el),
      vista.distancia * Math.cos(el) * Math.cos(az),
    );
    camara.lookAt(0, vista.objetivoY, 0);
    camara.updateMatrixWorld();
  };

  const colocarPlano = () => {
    if (!corte) {
      plano.constant = LEJOS;
      return;
    }
    plano.normal.set(-camara.position.x, 0, -camara.position.z).normalize();
    plano.constant = 0;
  };

  const pintarMateriales = () => {
    const enVuelo = despiece?.pieza?.malla;
    for (const m of recortables) {
      materiales(m).forEach((mat) => {
        mat.clippingPlanes = m === enVuelo ? [] : [plano];
        mat.needsUpdate = true;
      });
    }
    for (const m of envolventes) {
      const transparente = corte && m !== enVuelo;
      materiales(m).forEach((mat) => {
        mat.transparent = transparente;
        mat.opacity = transparente ? OPACIDAD_CORTE : 1;
        mat.depthWrite = !transparente;
        mat.needsUpdate = true;
      });
    }
  };

  const aplicarCorte = (activo: boolean) => {
    if (corte === activo) return;
    corte = activo;
    pintarMateriales();
  };

  const avanzarAnimacion = (ahora: number) => {
    if (!animacion) return;
    const t = acotar((ahora - animacion.inicio) / animacion.duracion, 0, 1);
    vista = interpolarVista(animacion.desde, animacion.hasta, suave(t));
    if (t >= 1) animacion = null;
  };

  const anclaEnPantalla = (pieza: PiezaModelo) => {
    const v = pieza.ancla.clone().project(camara);
    if (v.z > 1 || Math.abs(v.x) > 1.05 || Math.abs(v.y) > 1.05) return null;
    return {
      x: ((v.x + 1) / 2) * contenedor.clientWidth,
      y: ((1 - v.y) / 2) * contenedor.clientHeight,
    };
  };

  const colocarEtiqueta = () => {
    const paso = situacion.estado === 'recorrido' ? pasos[pasoActivo] : null;
    const pieza = paso?.foco ? modelo.piezas.get(paso.foco) : undefined;
    const pantalla = pieza ? anclaEnPantalla(pieza) : null;
    if (!paso || !pantalla) {
      etiqueta.ocultar();
      return;
    }
    etiqueta.mostrar(
      paso.nombre,
      pantalla.x,
      pantalla.y,
      contenedor.clientWidth,
    );
  };

  const resaltadas = (): Set<string> => {
    if (despiece) return despiece.resalta;
    if (situacion.estado === 'recorrido')
      return new Set(pasos[pasoActivo]?.resalta ?? []);
    return new Set();
  };

  const actualizarBrillos = () => {
    const luces = resaltadas();
    for (const p of modelo.piezas.values()) {
      if (despiece?.pieza === p) continue;
      const color = luces.has(p.id)
        ? COLOR_ELEGIDA
        : p.id === encima
          ? COLOR_ENCIMA
          : 0;
      brillo(p.malla, color);
    }
    for (const c of modelo.cascos) {
      brillo(c, luces.has('casco') ? COLOR_ELEGIDA : 0);
    }
    pedirCuadro();
  };

  const atenuar = (k: number) => {
    const enVuelo = despiece?.pieza?.malla;
    for (const malla of visibles) {
      if (malla === enVuelo) continue;
      for (const m of materiales(malla)) {
        const base = coloresBase.get(m);
        if (base) (m as MeshLambertMaterial).color.copy(base).lerp(SILUETA, k);
      }
    }
  };

  const atravesarCasco = (k: number) => {
    for (const m of envolventes) {
      materiales(m).forEach((mat) => {
        if (!mat.transparent) {
          mat.transparent = true;
          mat.depthWrite = false;
          mat.needsUpdate = true;
        }
        mat.opacity = Math.min(corte ? OPACIDAD_CORTE : 1, 1 - 0.75 * k);
      });
    }
  };

  const aplicarPose = (d: Despiece) => {
    const f = fases(d.t);
    if (d.pieza) {
      brillo(
        d.pieza.malla,
        new Color(COLOR_ELEGIDA).multiplyScalar(
          f.resalte * (1 - 0.65 * f.alCentro),
        ),
      );
    }
    if (d.pivote) {
      const salida = d.centro.clone().addScaledVector(d.salida, f.extraccion);
      d.pivote.position.copy(salida.lerp(d.destino, f.alCentro));
      d.pivote.scale.setScalar(1 + (d.escala - 1) * f.alCentro);
      d.pivote.rotation.y =
        d.sentido === -1 ? d.giroVuelta * f.alCentro : d.giro;
    }
    if (!d.pieza) return;
    const s = 1 - 0.45 * f.extraccion;
    grupo.scale.setScalar(s);
    grupo.position
      .copy(d.foco)
      .multiplyScalar(1 - s)
      .addScaledVector(d.aparte, f.extraccion);
    atenuar(0.85 * f.extraccion);
    if (d.atravesar) atravesarCasco(f.extraccion);
  };

  const terminarVuelta = (d: Despiece) => {
    if (d.pivote && d.pieza) {
      const malla = d.pieza.malla;
      d.pivote.remove(malla);
      escena.remove(d.pivote);
      malla.position.set(0, 0, 0);
      grupo.add(malla);
    }
    grupo.position.set(0, 0, 0);
    grupo.scale.setScalar(1);
    despiece = null;
    atenuar(0);
    pintarMateriales();
    cambiar('finVuelta');
    actualizarBrillos();
  };

  const avanzarDespiece = (dt: number) => {
    const d = despiece;
    if (!d) return false;
    if (d.sentido === 1) {
      d.t = Math.min(DURACION_DESPIECE, d.t + dt);
      if (d.t >= DURACION_DESPIECE) d.sentido = 0;
    } else if (d.sentido === -1) {
      d.t = Math.max(0, d.t - dt);
    } else if (d.pivote && !reducirMovimiento()) {
      d.giro += dt * GIRO_POR_SEGUNDO;
    }
    aplicarPose(d);
    if (d.sentido === -1 && d.t <= 0) {
      terminarVuelta(d);
      return false;
    }
    return d.sentido !== 0 || (d.pivote !== null && !reducirMovimiento());
  };

  const dibujar = (ahora: number) => {
    pendiente = 0;
    const dt = ultimoCuadro ? Math.min((ahora - ultimoCuadro) / 1000, 0.05) : 0;
    ultimoCuadro = ahora;
    avanzarAnimacion(ahora);
    const sigue = avanzarDespiece(dt);
    colocarCamara();
    colocarPlano();
    renderer.render(escena, camara);
    colocarEtiqueta();
    if (animacion || sigue) pedirCuadro();
    else ultimoCuadro = 0;
  };

  function pedirCuadro() {
    if (!pendiente) pendiente = requestAnimationFrame(dibujar);
  }

  const irA = (destino: Vista, duracion = 700) => {
    if (reducirMovimiento() || duracion <= 0) {
      vista = { ...destino };
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

  const fundir = () => {
    if (!reducirMovimiento()) return;
    contenedor.classList.remove('cohete-fundido');
    void contenedor.offsetWidth;
    contenedor.classList.add('cohete-fundido');
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

  const visible = (golpe: Intersection) => {
    const malla = golpe.object as Mesh;
    if (!corte || !recortables.includes(malla)) return true;
    return plano.distanceToPoint(golpe.point) >= 0;
  };

  const piezaEn = (x: number, y: number): string | null => {
    rayoDesde(x, y);
    const golpe = raycaster.intersectObjects(tocables, false).find(visible);
    return (golpe?.object.userData.id as string | undefined) ?? null;
  };

  const libre = () =>
    situacion.estado === 'general' || situacion.estado === 'recorrido';

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

  const sacar = (pieza: PiezaModelo): Partial<Despiece> => {
    const geometria = pieza.malla.geometry;
    geometria.computeBoundingSphere();
    const centro = geometria.boundingSphere!.center.clone();
    const radio = geometria.boundingSphere!.radius;
    const pivote = new Object3D();
    pivote.position.copy(centro);
    pieza.malla.position.copy(centro).negate();
    pivote.add(pieza.malla);
    escena.add(pivote);

    const derecha = new Vector3().setFromMatrixColumn(camara.matrixWorld, 0);
    const haciaCamara = new Vector3(
      camara.position.x,
      0,
      camara.position.z,
    ).normalize();
    const medioAlto =
      vista.distancia * Math.tan(((camara.fov / 2) * Math.PI) / 180);
    const medioAncho = medioAlto * camara.aspect;
    const foco = new Vector3(0, vista.objetivoY, 0);
    const fuera = new Vector3(pieza.ancla.x, 0, pieza.ancla.z);
    const direccion =
      pieza.salida === 'abajo'
        ? new Vector3(0, -1, 0)
        : pieza.salida === 'arriba'
          ? new Vector3(0, 1, 0)
          : pieza.salida === 'radial' && fuera.length() > 0.3
            ? fuera.normalize()
            : haciaCamara;
    return {
      pivote,
      centro,
      salida: direccion.multiplyScalar(radio * 0.6 + 1.5),
      destino: foco.clone().addScaledVector(derecha, -0.38 * medioAncho),
      escala: (0.5 * medioAlto) / Math.max(radio, 0.2),
      foco,
      aparte: derecha.multiplyScalar(-0.75 * medioAncho),
      atravesar: !corte && opciones.interior(pieza.id),
    };
  };

  const abrir = (id: string, resalta: string[] = []) => {
    if (!libre()) return;
    const pieza = modelo.piezas.get(id) ?? null;
    animacion = null;
    mostrarPista(null);
    etiqueta.ocultar();
    despiece = {
      id,
      pieza,
      resalta: new Set(pieza ? [] : resalta),
      pivote: null,
      centro: new Vector3(),
      salida: new Vector3(),
      destino: new Vector3(),
      escala: 1,
      foco: new Vector3(),
      aparte: new Vector3(),
      t: 0,
      sentido: 1,
      giro: 0,
      giroVuelta: 0,
      atravesar: false,
      ...(pieza ? sacar(pieza) : {}),
    };
    pintarMateriales();
    if (reducirMovimiento() || !pieza) {
      despiece.t = DURACION_DESPIECE;
      despiece.sentido = 0;
      fundir();
    }
    actualizarBrillos();
    cambiar('abrirPieza', id);
    pedirCuadro();
  };

  const volver = () => {
    const d = despiece;
    if (!d || !cambiar('volver', d.id)) return;
    d.giroVuelta = anguloCorto(d.giro);
    d.sentido = -1;
    if (reducirMovimiento() || !d.pieza) {
      d.t = 0;
      fundir();
    }
    pedirCuadro();
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

  const girarODesplazar = (dx: number, dy: number, desplazar: boolean) => {
    if (desplazar) {
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

  const alMover = (ev: PointerEvent) => {
    if (!arrastre) {
      if (libre())
        mostrarPista(piezaEn(ev.clientX, ev.clientY), ev.clientX, ev.clientY);
      return;
    }
    const dx = ev.clientX - arrastre.x;
    const dy = ev.clientY - arrastre.y;
    arrastre.x = ev.clientX;
    arrastre.y = ev.clientY;
    const total = ev.clientX - arrastre.inicioX;
    if (Math.hypot(total, ev.clientY - arrastre.inicioY) > MOVIMIENTO_CLIC) {
      arrastre.movio = true;
      mostrarPista(null);
    }
    if (situacion.estado === 'pieza') {
      if (total < -ARRASTRE_VOLVER) {
        arrastre = null;
        volver();
      }
      return;
    }
    if (libre()) girarODesplazar(dx, dy, arrastre.desplazar);
  };

  const alSoltar = (ev: PointerEvent) => {
    if (!arrastre) return;
    const fueClic = !arrastre.movio && ev.type === 'pointerup';
    arrastre = null;
    if (!libre()) return;
    const id = piezaEn(ev.clientX, ev.clientY);
    mostrarPista(id, ev.clientX, ev.clientY);
    if (fueClic && id) abrir(id);
  };

  const planoEje = new Plane();
  const corteEje = new Vector3();

  const alturaBajo = (x: number, y: number): number | null => {
    rayoDesde(x, y);
    const haciaCamara = new Vector3(
      camara.position.x,
      0,
      camara.position.z,
    ).normalize();
    planoEje.setFromNormalAndCoplanarPoint(haciaCamara, new Vector3());
    return raycaster.ray.intersectPlane(planoEje, corteEje) ? corteEje.y : null;
  };

  let deslizHorizontal = 0;
  let finDesliz = 0;

  const deslizarParaVolver = (dx: number) => {
    deslizHorizontal += dx;
    window.clearTimeout(finDesliz);
    finDesliz = window.setTimeout(() => (deslizHorizontal = 0), 250);
    if (Math.abs(deslizHorizontal) > DESLIZ_VOLVER) {
      deslizHorizontal = 0;
      volver();
    }
  };

  const acercar = (ev: WheelEvent) => {
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

  const alRueda = (ev: WheelEvent) => {
    ev.preventDefault();
    if (situacion.estado === 'pieza') {
      if (!ev.ctrlKey && Math.abs(ev.deltaX) > Math.abs(ev.deltaY))
        deslizarParaVolver(ev.deltaX);
      return;
    }
    if (libre()) acercar(ev);
  };

  const alTecla = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && situacion.estado === 'pieza') volver();
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
  window.addEventListener('keydown', alTecla);
  const observador = new ResizeObserver(ajustarTamano);
  observador.observe(contenedor);
  pintarMateriales();
  ajustarTamano();

  const vistaDePaso = (paso: PasoRecorrido): Vista => {
    const pieza = paso.foco ? modelo.piezas.get(paso.foco) : undefined;
    return pieza ? vistaDePieza(pieza) : VISTA_GENERAL;
  };

  const irAlPaso = (progreso: number) => {
    if (situacion.estado !== 'recorrido' || !pasos.length) return;
    const p = acotar(progreso, 0, pasos.length - 1);
    const i = Math.floor(p);
    const siguiente = Math.min(i + 1, pasos.length - 1);
    animacion = null;
    vista = interpolarVista(
      vistaDePaso(pasos[i]),
      vistaDePaso(pasos[siguiente]),
      suave(p - i),
    );
    const activo = Math.round(p);
    if (activo !== pasoActivo) {
      pasoActivo = activo;
      aplicarCorte(corteManual || pasos[activo].interior);
      actualizarBrillos();
    }
    pedirCuadro();
  };

  return {
    abrir,
    volver,
    vistaGeneral: () => {
      if (situacion.estado === 'general') irA(VISTA_GENERAL);
    },
    fijarCorte: (activo) => {
      corteManual = activo;
      if (situacion.estado === 'general') aplicarCorte(activo);
      pedirCuadro();
    },
    iniciarRecorrido: (nuevos) => {
      if (!nuevos.length || !cambiar('iniciarRecorrido')) return;
      antesDelRecorrido = { vista: { ...vista }, corte: corteManual };
      pasos = nuevos;
      pasoActivo = -1;
      const desde = { ...vista };
      irAlPaso(0);
      const destino = vista;
      vista = desde;
      irA(destino);
    },
    irAlPaso,
    salirRecorrido: () => {
      if (!cambiar('salirRecorrido')) return;
      pasos = [];
      pasoActivo = -1;
      etiqueta.ocultar();
      const antes = antesDelRecorrido;
      antesDelRecorrido = null;
      aplicarCorte(antes?.corte ?? corteManual);
      actualizarBrillos();
      irA(antes?.vista ?? VISTA_GENERAL);
    },
    destruir: () => {
      cancelAnimationFrame(pendiente);
      window.clearTimeout(finDesliz);
      observador.disconnect();
      canvas.removeEventListener('pointerdown', alPulsar);
      canvas.removeEventListener('pointermove', alMover);
      canvas.removeEventListener('pointerup', alSoltar);
      canvas.removeEventListener('pointercancel', alSoltar);
      canvas.removeEventListener('pointerleave', alSalir);
      canvas.removeEventListener('wheel', alRueda);
      canvas.removeEventListener('contextmenu', sinMenu);
      window.removeEventListener('keydown', alTecla);
      escena.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        o.geometry.dispose();
        materiales(o).forEach((m) => m.dispose());
      });
      renderer.dispose();
      canvas.remove();
      pista.remove();
      etiqueta.quitar();
    },
  };
}
