import { useSyncExternalStore } from 'react';

/** Pantalla ancha con ratón o trackpad; Navegacion.css y Layout.css repiten esta consulta. */
export const CONSULTA_ESCRITORIO = '(min-width: 1024px) and (pointer: fine)';

function consulta(): MediaQueryList | null {
  if (typeof window === 'undefined' || !window.matchMedia) return null;
  return window.matchMedia(CONSULTA_ESCRITORIO);
}

function suscribir(avisar: () => void): () => void {
  const mq = consulta();
  mq?.addEventListener('change', avisar);
  return () => mq?.removeEventListener('change', avisar);
}

function leer(): boolean {
  return consulta()?.matches ?? false;
}

/** Si la ventana cuenta como escritorio; cambia al redimensionarla o al cambiar de puntero. */
export function useEsEscritorio(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}
