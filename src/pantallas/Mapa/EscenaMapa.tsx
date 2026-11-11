import { useEffect, useRef } from 'react';
import type { ControlMapa, CuerpoMapa, Seleccion } from '../../3d/escenaMapa';
import { soportaWebGL } from '../../3d/soporte';
import { textos } from '../../idioma/idioma';
import type { DatosMapa } from './datosMapa';

/**
 * El domo 3D del mapa; carga three.js aparte y avisa cuando está listo.
 * @param alListo recibe el control del mapa para girarlo hacia un objeto
 */
export function EscenaMapa({
  datos,
  matriz,
  cuerpos,
  constelaciones,
  alTocar,
  alListo,
}: {
  datos: DatosMapa;
  matriz: number[];
  cuerpos: CuerpoMapa[];
  constelaciones: boolean;
  alTocar: (s: Seleccion | null) => void;
  alListo: (control: ControlMapa | null) => void;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const control = useRef<ControlMapa | null>(null);
  const ultimo = useRef({ matriz, cuerpos, constelaciones, alTocar });

  useEffect(() => {
    ultimo.current = { matriz, cuerpos, constelaciones, alTocar };
  });

  useEffect(() => {
    const div = contenedor.current;
    if (!div || !soportaWebGL()) return;
    let vigente = true;
    import('../../3d/escenaMapa').then(({ crearMapa }) => {
      if (!vigente) return;
      const c = crearMapa(div, datos.estrellas, datos.constelaciones, (s) =>
        ultimo.current.alTocar(s),
      );
      c.fijarCielo(ultimo.current.matriz, ultimo.current.cuerpos);
      c.mostrarConstelaciones(ultimo.current.constelaciones);
      control.current = c;
      alListo(c);
    });
    return () => {
      vigente = false;
      control.current?.destruir();
      control.current = null;
      alListo(null);
    };
  }, [datos, alListo]);

  useEffect(() => {
    control.current?.fijarCielo(matriz, cuerpos);
  }, [matriz, cuerpos]);

  useEffect(() => {
    control.current?.mostrarConstelaciones(constelaciones);
  }, [constelaciones]);

  return (
    <div className="mapa-escena" ref={contenedor}>
      {!soportaWebGL() && (
        <p className="mapa-aviso">
          {textos({
            es: 'Este navegador no puede dibujar el mapa en 3D.',
            en: 'This browser cannot draw the 3D map.',
          })}
        </p>
      )}
    </div>
  );
}
