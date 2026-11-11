import { useMemo } from 'react';
import { Luna3D } from '../../componentes/Luna3D/Luna3D';
import { useAhora, useFechaVista } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { datosLuna } from '../../servicios/astro/luna';
import { nocheSol } from '../../servicios/astro/sol';
import { formatearDiaCorto, formatearHora } from '../../servicios/formato';
import { inicioDelDia, sumarDias } from '../../servicios/tiempo';
import { DeslizadorNoches } from './DeslizadorNoches';
import { NOMBRE_FASE, notaFase } from './textos';
import './EstaNoche.css';

/** Portada: la Luna real de la noche elegida y el Sol de esa noche. */
export function EstaNoche() {
  const fecha = useFechaVista();
  const ahora = useAhora();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const luna = useMemo(() => datosLuna(fecha, ubicacion), [fecha, ubicacion]);
  const sol = useMemo(() => nocheSol(fecha, ubicacion), [fecha, ubicacion]);
  const hemisferioSur = ubicacion.latitud < 0;

  const hora = (f: Date | null) =>
    f ? formatearHora(f, ubicacion.zona, formato24h) : '—';
  const dia = (f: Date) => {
    const manana = sumarDias(inicioDelDia(ahora, ubicacion.zona), 1);
    return f < manana ? 'Hoy' : formatearDiaCorto(f, ubicacion.zona);
  };
  const ciclo =
    luna.diaCiclo < 1
      ? 'recién empieza su ciclo'
      : `día ${Math.round(luna.diaCiclo)} de su ciclo de 29,5`;

  return (
    <>
      <section className="luna" aria-labelledby="fase">
        <Luna3D
          angulo={luna.angulo}
          hemisferioSur={hemisferioSur}
          fraccion={luna.fraccion}
        />
        <div>
          <h2 id="fase" className="luna-fase">
            {NOMBRE_FASE[luna.fase]}
          </h2>
          <p className="luna-detalle">
            {Math.round(luna.fraccion * 100)}% iluminada, {ciclo}
          </p>
          <dl className="luna-datos">
            <div>
              <dt>Sale</dt>
              <dd title={luna.salida ? undefined : 'No sale este día'}>
                {hora(luna.salida)}
              </dd>
            </div>
            <div>
              <dt>Se pone</dt>
              <dd title={luna.puesta ? undefined : 'No se pone este día'}>
                {hora(luna.puesta)}
              </dd>
            </div>
            <div>
              <dt>Luna llena</dt>
              <dd>{dia(luna.proximaLlena)}</dd>
            </div>
            <div>
              <dt>Luna nueva</dt>
              <dd>{dia(luna.proximaNueva)}</dd>
            </div>
          </dl>
          <p className="luna-nota">{notaFase(luna.fase, hemisferioSur)}</p>
          <p className="luna-nota">
            El Sol se pone a las {hora(sol.puesta)}. Noche cerrada de{' '}
            {hora(sol.nocheInicio)} a {hora(sol.nocheFin)}.
          </p>
          <DeslizadorNoches />
        </div>
      </section>
      <p className="pie">
        Planetas, la noche hora por hora, el clima y los eventos llegan en las
        próximas fases.
      </p>
    </>
  );
}
