import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ControlLuna } from '../../3d/escenaLuna';
import { soportaWebGL } from '../../3d/soporte';
import './Luna3D.css';

/**
 * La Luna en 3D iluminada según su fase; se arrastra para girarla.
 * @param angulo ángulo de fase en grados, 0 nueva y 180 llena
 * @param hemisferioSur si el observador ve la Luna creciente iluminada por la izquierda
 * @param fraccion parte iluminada de 0 a 1, para el halo
 */
export function Luna3D({
  angulo,
  hemisferioSur,
  fraccion,
}: {
  angulo: number;
  hemisferioSur: boolean;
  fraccion: number;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const control = useRef<ControlLuna | null>(null);
  const fase = useRef({ angulo, hemisferioSur });
  const [con3d] = useState(soportaWebGL);

  useEffect(() => {
    const div = contenedor.current;
    if (!div || !con3d) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'luna3d-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'La Luna en 3D, iluminada según su fase');
    div.appendChild(canvas);
    let vigente = true;
    import('../../3d/escenaLuna').then(({ crearEscenaLuna }) => {
      if (!vigente) return;
      control.current = crearEscenaLuna(canvas);
      control.current.fijarFase(
        fase.current.angulo,
        fase.current.hemisferioSur,
      );
    });
    return () => {
      vigente = false;
      control.current?.destruir();
      control.current = null;
      canvas.remove();
    };
  }, [con3d]);

  useEffect(() => {
    fase.current = { angulo, hemisferioSur };
    control.current?.fijarFase(angulo, hemisferioSur);
  }, [angulo, hemisferioSur]);

  return (
    <div
      ref={contenedor}
      className={con3d ? 'luna3d' : 'luna3d luna3d-plana'}
      style={{ '--brillo': fraccion.toFixed(2) } as CSSProperties}
    />
  );
}
