const MARGEN_CARGA_MS = 10_000;
const CADA_MS = 30 * 60_000;

let versionNueva = false;

/** Decide qué hacer cuando un service worker nuevo toma el control: recarga ya si la página acaba de abrirse o no se ve, y si no lo deja para el próximo cambio de pantalla. */
export function alCambiarControlador(
  cargadaEn: number,
  ahora: number,
  oculta: boolean,
  recargar: () => void,
): void {
  if (ahora - cargadaEn < MARGEN_CARGA_MS || oculta) recargar();
  else versionNueva = true;
}

/** Al cambiar de pantalla, recarga si ya hay una versión nueva esperando. */
export function aplicarVersionNueva(recargar = () => window.location.reload()) {
  if (versionNueva) {
    versionNueva = false;
    recargar();
  }
}

/** Vigila las versiones nuevas: busca una cada media hora y al volver a la pestaña, y la aplica sin interrumpir lo que se está haciendo; la primera toma de control de una visita nueva no cuenta como versión. */
export function vigilarVersiones(): void {
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : null;
  if (!sw) return;
  const cargadaEn = Date.now();
  let controlada = Boolean(sw.controller);
  sw.addEventListener('controllerchange', () => {
    if (!controlada) {
      controlada = true;
      return;
    }
    alCambiarControlador(cargadaEn, Date.now(), document.hidden, () =>
      window.location.reload(),
    );
  });
  void sw.ready.then((registro) => {
    const buscar = () => void registro.update().catch(() => undefined);
    window.setInterval(buscar, CADA_MS);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') buscar();
    });
  });
}
