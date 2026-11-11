import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ControlLuna } from '../../3d/escenaLuna';
import { ceder, cuandoEsteLibre, soportaWebGL } from '../../3d/soporte';
import { textos } from '../../idioma/idioma';
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
  const [con3d, setCon3d] = useState(soportaWebGL);

  useEffect(() => {
    const div = contenedor.current;
    if (!div || !con3d) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'luna3d-canvas';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute(
      'aria-label',
      textos({
        es: 'La Luna en 3D, iluminada según su fase',
        en: 'The Moon in 3D, lit according to its phase',
      }),
    );
    div.appendChild(canvas);
    let vigente = true;
    const cancelar = cuandoEsteLibre(() => {
      void (async () => {
        const { crearEscenaLuna, lienzoLuna } =
          await import('../../3d/escenaLuna');
        await ceder();
        if (!vigente) return;
        const lienzo = lienzoLuna();
        await ceder();
        if (!vigente) return;
        try {
          control.current = crearEscenaLuna(canvas, lienzo);
          control.current.fijarFase(
            fase.current.angulo,
            fase.current.hemisferioSur,
          );
        } catch {
          canvas.remove();
          setCon3d(false);
        }
      })();
    });
    return () => {
      vigente = false;
      cancelar();
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
