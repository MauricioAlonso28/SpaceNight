import { useEffect, useRef } from 'react';
import { cuandoEsteLibre } from '../../3d/soporte';
import './Fondo3D.css';

/** Cielo de fondo: degradado y estrellas en capas con profundidad, detrás de toda la app. */
export function Fondo3D() {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = contenedor.current;
    if (!div) return;
    let vigente = true;
    let destruir: (() => void) | undefined;
    const cancelar = cuandoEsteLibre(() => {
      import('../../3d/fondoEstrellas').then(({ crearFondoEstrellas }) => {
        if (vigente) destruir = crearFondoEstrellas(div);
      });
    });
    return () => {
      vigente = false;
      cancelar();
      destruir?.();
    };
  }, []);

  return <div className="fondo3d" ref={contenedor} aria-hidden="true" />;
}
