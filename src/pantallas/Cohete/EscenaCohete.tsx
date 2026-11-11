import { useEffect, useRef } from 'react';
import type { ControlCohete } from '../../3d/cohete/escenaCohete';
import { soportaWebGL } from '../../3d/soporte';
import { textos } from '../../idioma/idioma';

/**
 * El cohete 3D; carga three.js aparte y entrega su control cuando está listo.
 * @param nombre nombre visible de una pieza por su id
 * @param alListo recibe el control de la escena, o null al desmontarla
 */
export function EscenaCohete({
  nombre,
  alElegir,
  alListo,
}: {
  nombre: (id: string) => string;
  alElegir: (id: string | null) => void;
  alListo: (control: ControlCohete | null) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const ultimo = useRef({ nombre, alElegir });

  useEffect(() => {
    ultimo.current = { nombre, alElegir };
  });

  useEffect(() => {
    const div = contenedor.current;
    if (!div || !soportaWebGL()) return;
    let vigente = true;
    let control: ControlCohete | null = null;
    import('../../3d/cohete/escenaCohete').then(({ crearEscena }) => {
      if (!vigente) return;
      control = crearEscena(div, {
        nombre: (id) => ultimo.current.nombre(id),
        alElegir: (id) => ultimo.current.alElegir(id),
      });
      alListo(control);
    });
    return () => {
      vigente = false;
      control?.destruir();
      alListo(null);
    };
  }, [alListo]);

  return (
    <div className="cohete-escena" ref={contenedor}>
      {!soportaWebGL() && (
        <p className="cohete-sin3d">
          {textos({
            es: 'Este navegador no puede dibujar el cohete en 3D.',
            en: 'This browser cannot draw the 3D rocket.',
          })}
        </p>
      )}
    </div>
  );
}
