import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LIMA, type Ubicacion } from '../tipos/ubicacion';

/** Preferencias que el usuario cambia en Ajustes. */
export interface Ajustes {
  formato24h: boolean;
  modoRojo: boolean;
}

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

export const useEstado = create<EstadoApp>()(
  persist(
    (set) => ({
      ubicacion: LIMA,
      ubicacionPreguntada: false,
      ajustes: { formato24h: true, modoRojo: false },
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
      version: 1,
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
