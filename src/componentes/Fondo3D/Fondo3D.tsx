import { useEffect, useRef } from 'react';
import { soportaWebGL } from '../../3d/soporte';
import './Fondo3D.css';

/** Cielo de fondo: degradado y campo de estrellas 3D detrás de toda la app. */
export function Fondo3D() {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const div = contenedor.current;
    if (!div || !soportaWebGL()) return;
    const canvas = document.createElement('canvas');
    div.appendChild(canvas);
    let vigente = true;
    let destruir: (() => void) | undefined;
    import('../../3d/fondoEstrellas').then(({ crearFondoEstrellas }) => {
      if (vigente) destruir = crearFondoEstrellas(canvas);
    });
    return () => {
      vigente = false;
      destruir?.();
      canvas.remove();
    };
  }, []);

  return <div className="fondo3d" ref={contenedor} aria-hidden="true" />;
}
