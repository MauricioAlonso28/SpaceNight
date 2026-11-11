/** Estados de la sección: así las animaciones no se pisan. */
export type Estado = 'general' | 'recorrido' | 'pieza' | 'volviendo';

/** Lo que puede pasar: gestos del usuario y el final de una animación. */
export type Evento =
  'iniciarRecorrido' | 'salirRecorrido' | 'abrirPieza' | 'volver' | 'finVuelta';

/**
 * Situación completa: el estado y a cuál se vuelve al cerrar una pieza.
 * @property previo general o recorrido, según desde dónde se abrió la pieza
 */
export interface Situacion {
  estado: Estado;
  previo: 'general' | 'recorrido';
}

export const SITUACION_INICIAL: Situacion = {
  estado: 'general',
  previo: 'general',
};

/**
 * Aplica un evento; devuelve null si en ese estado no hace nada (por ejemplo, abrir otra pieza mientras una vuelve).
 */
export function transicion(s: Situacion, evento: Evento): Situacion | null {
  switch (evento) {
    case 'iniciarRecorrido':
      return s.estado === 'general'
        ? { estado: 'recorrido', previo: 'recorrido' }
        : null;
    case 'salirRecorrido':
      return s.estado === 'recorrido'
        ? { estado: 'general', previo: 'general' }
        : null;
    case 'abrirPieza':
      return s.estado === 'general' || s.estado === 'recorrido'
        ? { estado: 'pieza', previo: s.estado }
        : null;
    case 'volver':
      return s.estado === 'pieza' ? { ...s, estado: 'volviendo' } : null;
    case 'finVuelta':
      return s.estado === 'volviendo' ? { ...s, estado: s.previo } : null;
  }
}
