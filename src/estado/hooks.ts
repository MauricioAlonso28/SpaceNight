import { useEffect, useMemo } from 'react';
import { MS_DIA } from '../servicios/tiempo';
import { pedirUbicacion } from '../servicios/sensores/ubicacion';
import { useEstado } from './store';

/** El instante de referencia: la fecha simulada si la hay, si no el reloj real. */
export function useAhora(): Date {
  const ahora = useEstado((s) => s.ahora);
  const simulada = useEstado((s) => s.fechaSimulada);
  return simulada ?? ahora;
}

/** El instante que se está mirando: ahora más los días elegidos en el deslizador. */
export function useFechaVista(): Date {
  const base = useAhora();
  const dias = useEstado((s) => s.diasAdelante);
  return useMemo(() => new Date(base.getTime() + dias * MS_DIA), [base, dias]);
}

/** Avanza el reloj del store al empezar cada minuto. */
export function useReloj(): void {
  const avanzar = useEstado((s) => s.avanzarReloj);
  useEffect(() => {
    let intervalo: number | undefined;
    const hastaMinuto = 60_000 - (Date.now() % 60_000);
    const espera = window.setTimeout(() => {
      avanzar();
      intervalo = window.setInterval(avanzar, 60_000);
    }, hastaMinuto);
    const alVolver = () => {
      if (document.visibilityState === 'visible') avanzar();
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearTimeout(espera);
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [avanzar]);
}

/** Pide la ubicación una sola vez; si se niega se queda Lima. */
export function usePedirUbicacionUnaVez(): void {
  const preguntada = useEstado((s) => s.ubicacionPreguntada);
  const fijar = useEstado((s) => s.fijarUbicacion);
  const marcar = useEstado((s) => s.marcarUbicacionPreguntada);
  useEffect(() => {
    if (preguntada) return;
    let vigente = true;
    pedirUbicacion().then((ubicacion) => {
      if (!vigente) return;
      if (ubicacion) fijar(ubicacion);
      marcar();
    });
    return () => {
      vigente = false;
    };
  }, [preguntada, fijar, marcar]);
}

const COLOR_BARRA = { normal: '#061236', rojo: '#000000' };

/** Pone el modo rojo nocturno en <html> y en el color de la barra del navegador. */
export function useModoRojo(): void {
  const rojo = useEstado((s) => s.ajustes.modoRojo);
  useEffect(() => {
    const raiz = document.documentElement;
    if (rojo) raiz.dataset.tema = 'rojo';
    else delete raiz.dataset.tema;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', rojo ? COLOR_BARRA.rojo : COLOR_BARRA.normal);
  }, [rojo]);
}
