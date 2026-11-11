import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PreferenciaIdioma } from '../idioma/idioma';
import { BORTLE_ESTIMADO, LIMA, type Ubicacion } from '../tipos/ubicacion';

/** Preferencias que el usuario cambia en Ajustes. */
export interface Ajustes {
  formato24h: boolean;
  modoRojo: boolean;
  calibracionBrujula: number;
  idioma: PreferenciaIdioma;
}

export const AJUSTES_INICIALES: Ajustes = {
  formato24h: true,
  modoRojo: false,
  calibracionBrujula: 0,
  idioma: 'auto',
};

/** Estado global: dónde se observa, qué fecha se mira y los ajustes. */
export interface EstadoApp {
  ubicacion: Ubicacion;
  ubicacionPreguntada: boolean;
  ajustes: Ajustes;
  ahora: Date;
  fechaSimulada: Date | null;
  diasAdelante: number;
  fijarUbicacion: (ubicacion: Ubicacion) => void;
  marcarUbicacionPreguntada: () => void;
  cambiarAjustes: (cambios: Partial<Ajustes>) => void;
  fijarDiasAdelante: (dias: number) => void;
  fijarFechaSimulada: (fecha: Date | null) => void;
  avanzarReloj: () => void;
}

/**
 * Lee ?fecha=2026-11-24T21:00 de la URL para probar cualquier noche sin esperar.
 * @param busqueda la parte de la URL antes del hash
 */
export function fechaDeUrl(busqueda: string): Date | null {
  const valor = new URLSearchParams(busqueda).get('fecha');
  if (!valor) return null;
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/**
 * Pone al día lo guardado por versiones anteriores: la v1 no tenía Bortle, la v2 no tenía calibración de brújula y la v3 no tenía idioma.
 * @param guardado lo que había en localStorage
 * @param version la versión con la que se guardó
 */
export function migrarEstado(guardado: unknown, version: number): unknown {
  const s = guardado as {
    ubicacion?: Partial<Ubicacion>;
    ajustes?: Partial<Ajustes>;
  } | null;
  if (version < 2 && s?.ubicacion && s.ubicacion.bortle === undefined) {
    const esLima = s.ubicacion.nombre === LIMA.nombre;
    s.ubicacion.bortle = esLima ? LIMA.bortle : BORTLE_ESTIMADO;
  }
  if (version < 4 && s) {
    s.ajustes = { ...AJUSTES_INICIALES, ...s.ajustes };
  }
  return s;
}

export const useEstado = create<EstadoApp>()(
  persist(
    (set) => ({
      ubicacion: LIMA,
      ubicacionPreguntada: false,
      ajustes: AJUSTES_INICIALES,
      ahora: new Date(),
      fechaSimulada:
        typeof location === 'undefined' ? null : fechaDeUrl(location.search),
      diasAdelante: 0,
      fijarUbicacion: (ubicacion) => set({ ubicacion }),
      marcarUbicacionPreguntada: () => set({ ubicacionPreguntada: true }),
      cambiarAjustes: (cambios) =>
        set((s) => ({ ajustes: { ...s.ajustes, ...cambios } })),
      fijarDiasAdelante: (dias) => set({ diasAdelante: dias }),
      fijarFechaSimulada: (fecha) => set({ fechaSimulada: fecha }),
      avanzarReloj: () => set({ ahora: new Date() }),
    }),
    {
      name: 'tu-cielo',
      version: 4,
      migrate: migrarEstado,
      partialize: (s) => ({
        ubicacion: s.ubicacion,
        ubicacionPreguntada: s.ubicacionPreguntada,
        ajustes: s.ajustes,
      }),
    },
  ),
);

declare global {
  interface Window {
    tuCielo?: { fijarFecha: (iso: string | null) => void };
  }
}

if (typeof window !== 'undefined') {
  window.tuCielo = {
    fijarFecha: (iso) =>
      useEstado.getState().fijarFechaSimulada(iso ? new Date(iso) : null),
  };
}
