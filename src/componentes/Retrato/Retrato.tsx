import { useEffect, useState, type CSSProperties } from 'react';
import type { Astro } from '../../3d/escenaAstro';
import { cuandoEsteLibre, soportaWebGL } from '../../3d/soporte';
import './Retrato.css';

/**
 * Imagen realista de un cuerpo, hecha con su textura en 3D; mientras se dibuja (o sin WebGL) se ve una esfera de color.
 * @param tamano lado en píxeles; Saturno ocupa el mismo cuadrado con sus anillos
 */
export function Retrato({ astro, tamano }: { astro: Astro; tamano: number }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!soportaWebGL()) return;
    let vigente = true;
    const cancelar = cuandoEsteLibre(() => {
      import('../../3d/escenaAstro')
        .then((m) => m.retratoAstro(astro))
        .then((url) => vigente && setSrc(url))
        .catch(() => undefined);
    });
    return () => {
      vigente = false;
      cancelar();
    };
  }, [astro]);

  return (
    <span
      className={`retrato retrato-${astro}`}
      style={{ '--tam': `${tamano}px` } as CSSProperties}
      aria-hidden="true"
    >
      {src ? (
        <img src={src} alt="" width={tamano} height={tamano} />
      ) : (
        <span className="retrato-esfera" />
      )}
    </span>
  );
}
