import { useEffect, useRef } from 'react';
import type { ControlCohete } from '../../3d/cohete/escenaCohete';
import type { Estado } from '../../3d/cohete/estados';
import { soportaWebGL } from '../../3d/soporte';
import { textos } from '../../idioma/idioma';

/**
 * El cohete 3D; carga three.js aparte y entrega su control cuando está listo.
 * @param nombre nombre visible de una pieza por su id
 * @param interior si una pieza va dentro del casco
 * @param alCambiar recibe cada cambio de estado de la escena y la pieza abierta
 * @param alListo recibe el control de la escena, o null al desmontarla
 */
export function EscenaCohete({
  nombre,
  interior,
  alCambiar,
  alListo,
}: {
  nombre: (id: string) => string;
  interior: (id: string) => boolean;
  alCambiar: (estado: Estado, id: string | null) => void;
  alListo: (control: ControlCohete | null) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const ultimo = useRef({ nombre, interior, alCambiar });

  useEffect(() => {
    ultimo.current = { nombre, interior, alCambiar };
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
        interior: (id) => ultimo.current.interior(id),
        alCambiar: (estado, id) => ultimo.current.alCambiar(estado, id),
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
    <div
      className="cohete-escena"
      ref={contenedor}
      role="img"
      aria-label={textos({
        es: 'Cohete en 3D, para ratón o trackpad. Todas las fichas están también en la lista de componentes.',
        en: '3D rocket for mouse or trackpad. Every card is also in the list of components.',
      })}
    >
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
