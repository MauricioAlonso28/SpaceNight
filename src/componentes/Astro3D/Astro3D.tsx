import { useEffect, useRef, useState } from 'react';
import type { Astro } from '../../3d/escenaAstro';
import { soportaWebGL } from '../../3d/soporte';
import { textos } from '../../idioma/idioma';
import { Retrato } from '../Retrato/Retrato';

/**
 * Un cuerpo en 3D con su textura real, que gira despacio y se arrastra; sin WebGL queda su imagen fija.
 * @param nombre nombre visible, para el texto alternativo
 */
export function Astro3D({ astro, nombre }: { astro: Astro; nombre: string }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [fallo, setFallo] = useState(!soportaWebGL());

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas || fallo) return;
    let vigente = true;
    let destruir: (() => void) | null = null;
    import('../../3d/escenaAstro')
      .then((m) => m.crearEscenaAstro(canvas, astro))
      .then((control) => {
        if (!control) return setFallo(true);
        if (vigente) destruir = control.destruir;
        else control.destruir();
      })
      .catch(() => setFallo(true));
    return () => {
      vigente = false;
      destruir?.();
    };
  }, [astro, fallo]);

  if (fallo) return <Retrato astro={astro} tamano={320} />;
  return (
    <canvas
      key={astro}
      ref={lienzo}
      className="astro3d"
      role="img"
      aria-label={textos({
        es: `${nombre} en 3D; arrástralo para girarlo`,
        en: `${nombre} in 3D; drag to turn it`,
      })}
    />
  );
}
