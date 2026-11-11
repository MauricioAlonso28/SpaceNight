import { useEffect, useState } from 'react';
import { useJsonPublico } from '../../estado/datos';

/**
 * Un asteroide que pasa cerca de la Tierra esta semana, según NeoWs.
 * @property fecha momento del máximo acercamiento, en ms
 * @property diametroM diámetro estimado mínimo y máximo, en metros
 */
export interface Asteroide {
  id: string;
  nombre: string;
  url: string;
  peligroso: boolean;
  sentry: boolean;
  diametroM: [number, number];
  fecha: number;
  distanciaKm: number;
  distanciaLunar: number;
  velocidadKms: number;
}

/** Los asteroides de la semana. */
export interface DatosNeo {
  generado: string;
  desde: string;
  hasta: string;
  objetos: Asteroide[];
}

/** Un bólido: fecha en ms, energía de impacto en kt, latitud, longitud, altura en km y velocidad en km/s (estos cuatro pueden faltar). */
export type FilaBolido = [
  number,
  number,
  number | null,
  number | null,
  number | null,
  number | null,
];

/** Los bólidos registrados desde 1988. */
export interface DatosBolidos {
  generado: string;
  filas: FilaBolido[];
}

/**
 * Un objeto de la lista de vigilancia Sentry.
 * @property probabilidad probabilidad acumulada de impacto, de 0 a 1
 * @property palermo escala de Palermo acumulada (menos de −2: sin motivo de preocupación)
 * @property anios años con posibles impactos, como «2095-2122»
 */
export interface ObjetoSentry {
  des: string;
  nombre: string;
  probabilidad: number;
  palermo: number;
  torino: number;
  diametroKm: number;
  anios: string;
  impactos: number;
  velocidadKms: number;
}

/** La lista Sentry: cuántos objetos vigila y los más probables. */
export interface DatosSentry {
  generado: string;
  total: number;
  objetos: ObjetoSentry[];
}

/** Un exoplaneta: nombre, estrella, año, método (índice), radio en radios terrestres, período en días, insolación, temperatura en K y distancia en pc. */
export type FilaExoplaneta = [
  string,
  string,
  number,
  number,
  number | null,
  number | null,
  number | null,
  number | null,
  number | null,
];

/** Los exoplanetas confirmados y los métodos con que se hallaron. */
export interface DatosExoplanetas {
  generado: string;
  metodos: string[];
  filas: FilaExoplaneta[];
}

/** Asteroides de la semana; null mientras cargan y 'error' si no hay datos. */
export const useNeo = () => useJsonPublico<DatosNeo>('nasa/neo.json');

/** Bólidos; null mientras cargan y 'error' si no hay datos. */
export const useBolidos = () =>
  useJsonPublico<DatosBolidos>('nasa/bolidos.json');

/** Lista Sentry; null mientras carga y 'error' si no hay datos. */
export const useSentry = () => useJsonPublico<DatosSentry>('nasa/sentry.json');

/** Exoplanetas; null mientras cargan y 'error' si no hay datos. */
export const useExoplanetas = () =>
  useJsonPublico<DatosExoplanetas>('nasa/exoplanetas.json');

/**
 * Pide una API que el navegador puede llamar directamente y la vuelve a pedir cada cierto tiempo mientras la vista está abierta.
 * @param url null para no pedir nada todavía
 * @param cadaMs cada cuánto se refresca; 0 para pedirla una sola vez
 * @returns null mientras carga y 'error' si falla sin datos previos
 */
export function useApiEnVivo<T>(
  url: string | null,
  cadaMs = 0,
): T | null | 'error' {
  const [datos, setDatos] = useState<{
    url: string;
    valor: T | 'error';
  } | null>(null);
  useEffect(() => {
    if (!url) return;
    let vigente = true;
    const pedir = () =>
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP_${r.status}`);
          return r.json() as Promise<T>;
        })
        .then(
          (valor) => vigente && setDatos({ url, valor }),
          () =>
            vigente &&
            setDatos((d) => (d?.url === url ? d : { url, valor: 'error' })),
        );
    void pedir();
    const id = cadaMs ? window.setInterval(pedir, cadaMs) : 0;
    return () => {
      vigente = false;
      window.clearInterval(id);
    };
  }, [url, cadaMs]);
  return datos?.url === url ? datos.valor : null;
}
