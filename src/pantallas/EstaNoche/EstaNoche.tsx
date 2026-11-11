import { useMemo } from 'react';
import { Luna3D } from '../../componentes/Luna3D/Luna3D';
import { usePasosISS } from '../../estado/datos';
import { useAhora, useFechaVista } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { datosLuna } from '../../servicios/astro/luna';
import { HORAS_NOCHE, ventanaNoche } from '../../servicios/astro/noche';
import { nochePlanetas } from '../../servicios/astro/planetas';
import { nocheSol } from '../../servicios/astro/sol';
import { formatearDiaCorto, formatearHora } from '../../servicios/formato';
import { inicioDelDia, sumarDias } from '../../servicios/tiempo';
import { CieloYEventos } from './CieloYEventos';
import { DeslizadorNoches } from './DeslizadorNoches';
import { NocheHoraPorHora } from './NocheHoraPorHora';
import { PlanetasVisibles } from './PlanetasVisibles';
import { NOMBRE_FASE, notaFase } from './textos';
import './EstaNoche.css';

const MS_HORA = 3_600_000;

/** Portada: la Luna, los planetas, la noche hora por hora, el cielo y los eventos. */
export function EstaNoche() {
  const fecha = useFechaVista();
  const ahora = useAhora();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const luna = useMemo(() => datosLuna(fecha, ubicacion), [fecha, ubicacion]);
  const sol = useMemo(() => nocheSol(fecha, ubicacion), [fecha, ubicacion]);
  const inicioNoche = ventanaNoche(fecha, ubicacion.zona).inicio.getTime();
  const noche = useMemo(
    () => nochePlanetas(new Date(inicioNoche), ubicacion),
    [inicioNoche, ubicacion],
  );
  const hemisferioSur = ubicacion.latitud < 0;
  const iss = usePasosISS(ubicacion, Math.floor(ahora.getTime() / MS_HORA));
  const nocheCubierta =
    iss !== null &&
    inicioNoche >= iss.desde.getTime() &&
    inicioNoche + HORAS_NOCHE * MS_HORA <= iss.hasta.getTime();

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
      <section className="seccion" aria-labelledby="t-planetas">
        <h2 id="t-planetas">Planetas visibles</h2>
        <PlanetasVisibles
          planetas={noche.planetas}
          zona={ubicacion.zona}
          formato24h={formato24h}
        />
      </section>
      <section className="seccion" aria-labelledby="t-noche">
        <h2 id="t-noche">Tu noche, hora por hora</h2>
        <NocheHoraPorHora
          {...noche}
          ahora={ahora}
          zona={ubicacion.zona}
          formato24h={formato24h}
          estacion={nocheCubierta ? iss.pasos : null}
        />
      </section>
      <CieloYEventos
        fecha={fecha}
        inicioNoche={inicioNoche}
        ahora={ahora}
        ubicacion={ubicacion}
        formato24h={formato24h}
        iss={iss}
      />
      <p className="pie">
        Clima de Open-Meteo, con una hora de caché. Órbita de la Estación de
        CelesTrak, con 12 horas de caché. Lluvias de meteoros según la IMO.
      </p>
    </>
  );
}
