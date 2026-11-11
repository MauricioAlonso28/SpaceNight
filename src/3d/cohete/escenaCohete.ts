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
  type Intersection,
  type Material,
  type MeshLambertMaterial,
} from 'three';
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
const COLOR_ELEGIDA = 0x9a3826;
const COLOR_ENCIMA = 0x3b2a26;
const OPACIDAD_CORTE = 0.38;
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
  elegir: (id: string | null) => void;
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
 * @property alElegir recibe el id de la pieza tocada, o null si se tocó el vacío
 */
export interface OpcionesEscena {
  nombre: (id: string) => string;
  alElegir: (id: string | null) => void;
}

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

/** Monta el cohete en un contenedor: canvas WebGL, etiquetas y gestos de ratón y trackpad. */
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
  const etiqueta = crearEtiqueta(contenedor);
  etiqueta.ocultar();

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
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
  escena.add(modelo.grupo);
  const tocables: Mesh[] = [];
  for (const p of modelo.piezas.values()) tocables.push(p.toque ?? p.malla);

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
  for (const m of recortables) {
    materiales(m).forEach((mat) => (mat.clippingPlanes = [plano]));
  }

  let vista: Vista = { ...VISTA_GENERAL };
  let animacion: {
    desde: Vista;
    hasta: Vista;
    inicio: number;
    duracion: number;
  } | null = null;
  let elegida: string | null = null;
  let encima: string | null = null;
  let corteManual = false;
  let corte = false;
  let pasos: PasoRecorrido[] = [];
  let pasoActivo = -1;
  let antesDelRecorrido: { vista: Vista; corte: boolean } | null = null;
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

  const aplicarCorte = (activo: boolean) => {
    if (corte === activo) return;
    corte = activo;
    for (const m of envolventes) {
      materiales(m).forEach((mat) => {
        mat.transparent = activo;
        mat.opacity = activo ? OPACIDAD_CORTE : 1;
        mat.depthWrite = !activo;
        mat.needsUpdate = true;
      });
    }
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
    const paso = pasos[pasoActivo];
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

  const dibujar = (ahora: number) => {
    pendiente = 0;
    avanzarAnimacion(ahora);
    colocarCamara();
    colocarPlano();
    renderer.render(escena, camara);
    colocarEtiqueta();
    if (animacion) pedirCuadro();
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

  const actualizarBrillos = () => {
    const resaltadas = new Set(pasos[pasoActivo]?.resalta ?? []);
    for (const p of modelo.piezas.values()) {
      const color =
        p.id === elegida || resaltadas.has(p.id)
          ? COLOR_ELEGIDA
          : p.id === encima
            ? COLOR_ENCIMA
            : 0;
      brillo(p.malla, color);
    }
    for (const c of modelo.cascos) {
      brillo(c, resaltadas.has('casco') ? COLOR_ELEGIDA : 0);
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
    elegida = id && modelo.piezas.has(id) ? id : null;
    actualizarBrillos();
  }

  const vistaDePaso = (paso: PasoRecorrido): Vista => {
    const pieza = paso.foco ? modelo.piezas.get(paso.foco) : undefined;
    return pieza ? vistaDePieza(pieza) : VISTA_GENERAL;
  };

  const irAlPaso = (progreso: number) => {
    if (!pasos.length) return;
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
    elegir,
    vistaGeneral: () => irA(VISTA_GENERAL),
    fijarCorte: (activo) => {
      corteManual = activo;
      aplicarCorte(activo);
      pedirCuadro();
    },
    iniciarRecorrido: (nuevos) => {
      antesDelRecorrido ??= { vista: { ...vista }, corte: corteManual };
      pasos = nuevos;
      pasoActivo = -1;
      elegida = null;
      const desde = { ...vista };
      irAlPaso(0);
      const destino = vista;
      vista = desde;
      irA(destino);
    },
    irAlPaso,
    salirRecorrido: () => {
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
      etiqueta.quitar();
    },
  };
}
