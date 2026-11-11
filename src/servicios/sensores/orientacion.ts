import { alphaDesdeRumbo, type Lectura } from './rotacion';

/** De dónde sale el rumbo: brújula de iPhone, orientación absoluta de Android o solo relativa. */
export type FuenteRumbo = 'ios' | 'absoluta' | 'relativa';

interface EventoIOS extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

interface ConstructorIOS {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

/** iPhone pide permiso explícito, desde un toque, para leer los sensores de movimiento. */
export function necesitaPermiso(): boolean {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as unknown as ConstructorIOS)
      .requestPermission === 'function'
  );
}

/** Pide el permiso de orientación; en navegadores que no lo piden, devuelve true. */
export async function pedirPermisoOrientacion(): Promise<boolean> {
  if (!necesitaPermiso()) return true;
  try {
    const pedir = (DeviceOrientationEvent as unknown as ConstructorIOS)
      .requestPermission!;
    return (await pedir()) === 'granted';
  } catch {
    return false;
  }
}

/** Ángulo de giro de la pantalla: 0 en vertical, 90 o 270 en horizontal. */
export function anguloPantalla(): number {
  const angulo =
    screen.orientation?.angle ??
    (window as unknown as { orientation?: number }).orientation ??
    0;
  return ((angulo % 360) + 360) % 360;
}

function leer(ev: DeviceOrientationEvent): {
  lectura: Lectura;
  fuente: FuenteRumbo;
} | null {
  if (ev.alpha == null || ev.beta == null || ev.gamma == null) return null;
  const rumboIOS = (ev as EventoIOS).webkitCompassHeading;
  if (typeof rumboIOS === 'number' && rumboIOS >= 0) {
    return {
      lectura: {
        alpha: alphaDesdeRumbo(rumboIOS),
        beta: ev.beta,
        gamma: ev.gamma,
      },
      fuente: 'ios',
    };
  }
  return {
    lectura: { alpha: ev.alpha, beta: ev.beta, gamma: ev.gamma },
    fuente: ev.absolute ? 'absoluta' : 'relativa',
  };
}

/**
 * Escucha la orientación del móvil; en Android usa el evento absoluto, que mide desde el norte magnético.
 * @returns la función que deja de escuchar
 */
export function escucharOrientacion(
  alLeer: (lectura: Lectura, fuente: FuenteRumbo) => void,
): () => void {
  const evento =
    'ondeviceorientationabsolute' in window
      ? 'deviceorientationabsolute'
      : 'deviceorientation';
  const manejar = (ev: Event) => {
    const r = leer(ev as DeviceOrientationEvent);
    if (r) alLeer(r.lectura, r.fuente);
  };
  window.addEventListener(evento, manejar);
  return () => window.removeEventListener(evento, manejar);
}
