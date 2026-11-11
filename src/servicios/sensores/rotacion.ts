import type { Vec3 } from '../astro/cielo';

const RAD = Math.PI / 180;

/** Ángulos del sensor de orientación en grados, con alpha ya medido desde el norte magnético. */
export interface Lectura {
  alpha: number;
  beta: number;
  gamma: number;
}

/** Hacia dónde mira la cámara trasera y cómo está girada, en el marco del mapa (x este, y cénit, z sur). */
export interface Bases {
  adelante: Vec3;
  arriba: Vec3;
  derecha: Vec3;
}

/** Punto proyectado: coordenadas en pantalla y si cae dentro del encuadre. */
export interface Proyeccion {
  x: number;
  y: number;
  delante: boolean;
  dentro: boolean;
}

function rotar(lectura: Lectura, v: Vec3): Vec3 {
  const [a, b, g] = [
    lectura.alpha * RAD,
    lectura.beta * RAD,
    lectura.gamma * RAD,
  ];
  const [ca, sa, cb, sb, cg, sg] = [
    Math.cos(a),
    Math.sin(a),
    Math.cos(b),
    Math.sin(b),
    Math.cos(g),
    Math.sin(g),
  ];
  const y1: Vec3 = [cg * v[0] + sg * v[2], v[1], -sg * v[0] + cg * v[2]];
  const x1: Vec3 = [y1[0], cb * y1[1] - sb * y1[2], sb * y1[1] + cb * y1[2]];
  return [ca * x1[0] - sa * x1[1], sa * x1[0] + ca * x1[1], x1[2]];
}

function enuAMapa([e, n, u]: Vec3): Vec3 {
  return [e, u, -n];
}

/**
 * Bases de la cámara según el sensor (R = Rz(α)·Rx(β)·Ry(γ), del W3C) y el giro de la pantalla.
 * @param correccion grados a sumar al rumbo: declinación magnética más la calibración
 * @param anguloPantalla 0 en vertical, 90 o 270 en horizontal (screen.orientation.angle)
 */
export function basesCamara(
  lectura: Lectura,
  anguloPantalla: number,
  correccion: number,
): Bases {
  const l = { ...lectura, alpha: lectura.alpha - correccion };
  const t = anguloPantalla * RAD;
  const derechaDispositivo: Vec3 = [Math.cos(t), -Math.sin(t), 0];
  const arribaDispositivo: Vec3 = [Math.sin(t), Math.cos(t), 0];
  return {
    adelante: enuAMapa(rotar(l, [0, 0, -1])),
    arriba: enuAMapa(rotar(l, arribaDispositivo)),
    derecha: enuAMapa(rotar(l, derechaDispositivo)),
  };
}

/** Rumbo de una brújula (horario desde el norte) a alpha del W3C (antihorario). */
export function alphaDesdeRumbo(rumbo: number): number {
  return (360 - rumbo) % 360;
}

const punto = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function normalizar(v: Vec3): Vec3 {
  const n = Math.hypot(...v) || 1;
  return [v[0] / n, v[1] / n, v[2] / n];
}

function cruz(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

/**
 * Avanza una fracción hacia la nueva orientación para que las etiquetas no tiemblen.
 * @param fraccion 0,2 en cada fotograma, como dice el plan
 */
export function suavizar(antes: Bases, nueva: Bases, fraccion: number): Bases {
  const mezcla = (a: Vec3, b: Vec3): Vec3 =>
    normalizar([
      a[0] + (b[0] - a[0]) * fraccion,
      a[1] + (b[1] - a[1]) * fraccion,
      a[2] + (b[2] - a[2]) * fraccion,
    ]);
  const adelante = mezcla(antes.adelante, nueva.adelante);
  const casiArriba = mezcla(antes.arriba, nueva.arriba);
  const derecha = normalizar(cruz(adelante, casiArriba));
  return { adelante, arriba: cruz(derecha, adelante), derecha };
}

/**
 * Proyecta una dirección del cielo en la pantalla como una cámara de agujero.
 * @param fovLargo campo de visión en grados sobre el lado largo de la pantalla
 */
export function proyectar(
  direccion: Vec3,
  b: Bases,
  ancho: number,
  alto: number,
  fovLargo: number,
): Proyeccion {
  const z = punto(direccion, b.adelante);
  const x = punto(direccion, b.derecha);
  const y = punto(direccion, b.arriba);
  const focal = Math.max(ancho, alto) / 2 / Math.tan((fovLargo * RAD) / 2);
  const delante = z > 1e-6;
  const px = ancho / 2 + (delante ? (x / z) * focal : x * 1e6);
  const py = alto / 2 - (delante ? (y / z) * focal : y * 1e6);
  const dentro = delante && px >= 0 && px <= ancho && py >= 0 && py <= alto;
  return { x: px, y: py, delante, dentro };
}

/** Ángulo en grados (0 = derecha, 90 = abajo) hacia el que apunta la flecha guía. */
export function anguloFlecha(direccion: Vec3, b: Bases): number {
  const x = punto(direccion, b.derecha);
  const y = punto(direccion, b.arriba);
  return (Math.atan2(-y, x) * 180) / Math.PI;
}

/** Separación en grados entre dos direcciones. */
export function separacion(a: Vec3, b: Vec3): number {
  return (
    (Math.acos(Math.max(-1, Math.min(1, punto(normalizar(a), normalizar(b))))) *
      180) /
    Math.PI
  );
}

/** Azimut en grados (0 = norte) de una dirección del marco del mapa. */
export function azimutDe(v: Vec3): number {
  return ((Math.atan2(v[0], -v[2]) * 180) / Math.PI + 360) % 360;
}

/**
 * Error de la brújula al centrar un objeto: grados que hay que sumar al rumbo medido.
 * @param real dirección verdadera del objeto que el usuario centró
 */
export function errorBrujula(adelante: Vec3, real: Vec3): number {
  const d = azimutDe(real) - azimutDe(adelante);
  return ((d + 540) % 360) - 180;
}
