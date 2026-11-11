import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Aviso, Regla } from '../servicios/nasa/avisos';

/**
 * Avisos de NASA en vivo: los de ahora (los calcula MotorAvisos) y lo que se recuerda entre visitas.
 * @property vistos ids de avisos ya vistos
 * @property apagadas reglas que no deben avisar
 * @property notificado último aviso del sistema por regla, en ms, para no avisar más de una vez cada 6 horas
 */
interface EstadoAvisos {
  avisos: Aviso[];
  vistos: string[];
  apagadas: Regla[];
  notificado: Partial<Record<Regla, number>>;
  fijarAvisos: (avisos: Aviso[]) => void;
  marcarVistos: (ids: string[]) => void;
  alternarRegla: (r: Regla) => void;
  anotarNotificacion: (r: Regla, cuando: number) => void;
}

export const useAvisos = create<EstadoAvisos>()(
  persist(
    (set) => ({
      avisos: [],
      vistos: [],
      apagadas: [],
      notificado: {},
      fijarAvisos: (avisos) => set({ avisos }),
      marcarVistos: (ids) =>
        set((s) => ({
          vistos: [...new Set([...s.vistos, ...ids])].slice(-400),
        })),
      alternarRegla: (r) =>
        set((s) => ({
          apagadas: s.apagadas.includes(r)
            ? s.apagadas.filter((x) => x !== r)
            : [...s.apagadas, r],
        })),
      anotarNotificacion: (r, cuando) =>
        set((s) => ({ notificado: { ...s.notificado, [r]: cuando } })),
    }),
    {
      name: 'tu-cielo:avisos',
      partialize: (s) => ({
        vistos: s.vistos,
        apagadas: s.apagadas,
        notificado: s.notificado,
      }),
    },
  ),
);

/** Los avisos activos (sin las reglas apagadas) y cuántos no se han visto. */
export function useAvisosActivos() {
  const avisos = useAvisos((s) => s.avisos);
  const apagadas = useAvisos((s) => s.apagadas);
  const vistos = useAvisos((s) => s.vistos);
  const activos = avisos.filter((a) => !apagadas.includes(a.regla));
  const nuevos = activos.filter((a) => !vistos.includes(a.id));
  return { activos, nuevos };
}
