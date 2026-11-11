import { useMemo } from 'react';
import { Luna3D } from '../../componentes/Luna3D/Luna3D';
import { useNochePlanetas, usePasosISS } from '../../estado/datos';
import { useAhora, useFechaVista } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { textos } from '../../idioma/idioma';
import { datosLuna } from '../../servicios/astro/luna';
import { HORAS_NOCHE, ventanaNoche } from '../../servicios/astro/noche';
import { nocheSol } from '../../servicios/astro/sol';
import { formatearDiaCorto, formatearHora } from '../../servicios/formato';
import { inicioDelDia, sumarDias } from '../../servicios/tiempo';
import { CieloYEventos } from './CieloYEventos';
import { DeslizadorNoches } from './DeslizadorNoches';
import { NocheHoraPorHora } from './NocheHoraPorHora';
import { PlanetasVisibles } from './PlanetasVisibles';
import { nombreFase, notaFase } from './textos';
import './EstaNoche.css';

const MS_HORA = 3_600_000;

const ES = {
  hoy: 'Hoy',
  empieza: 'recién empieza su ciclo',
  diaCiclo: (n: number) => `día ${n} de su ciclo de 29,5`,
  iluminada: (pct: number, ciclo: string) => `${pct}% iluminada, ${ciclo}`,
  sale: 'Sale',
  noSale: 'No sale este día',
  sePone: 'Se pone',
  noSePone: 'No se pone este día',
  llena: 'Luna llena',
  nueva: 'Luna nueva',
  sol: (puesta: string, inicio: string, fin: string) =>
    `El Sol se pone a las ${puesta}. Noche cerrada de ${inicio} a ${fin}.`,
  planetas: 'Planetas visibles',
  calculandoPlanetas: 'Calculando los planetas…',
  noche: 'Tu noche, hora por hora',
  calculandoNoche: 'Calculando la noche…',
  pie: 'Clima de Open-Meteo, con una hora de caché. Órbita de la Estación de CelesTrak, con 12 horas de caché. Lluvias de meteoros según la IMO.',
};

const EN: typeof ES = {
  hoy: 'Today',
  empieza: 'its cycle is just starting',
  diaCiclo: (n) => `day ${n} of its 29.5-day cycle`,
  iluminada: (pct, ciclo) => `${pct}% lit, ${ciclo}`,
  sale: 'Rises',
  noSale: 'Does not rise this day',
  sePone: 'Sets',
  noSePone: 'Does not set this day',
  llena: 'Full Moon',
  nueva: 'New Moon',
  sol: (puesta, inicio, fin) =>
    `The Sun sets at ${puesta}. Full darkness from ${inicio} to ${fin}.`,
  planetas: 'Visible planets',
  calculandoPlanetas: 'Working out the planets…',
  noche: 'Your night, hour by hour',
  calculandoNoche: 'Working out the night…',
  pie: 'Weather from Open-Meteo, cached for an hour. Space Station orbit from CelesTrak, cached for 12 hours. Meteor showers from the IMO.',
};

/** Portada: la Luna, los planetas, la noche hora por hora, el cielo y los eventos. */
export function EstaNoche() {
  const t = textos({ es: ES, en: EN });
  const fecha = useFechaVista();
  const ahora = useAhora();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const luna = useMemo(() => datosLuna(fecha, ubicacion), [fecha, ubicacion]);
  const sol = useMemo(() => nocheSol(fecha, ubicacion), [fecha, ubicacion]);
  const inicioNoche = ventanaNoche(fecha, ubicacion.zona).inicio.getTime();
  const noche = useNochePlanetas(inicioNoche, ubicacion);
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
    return f < manana ? t.hoy : formatearDiaCorto(f, ubicacion.zona);
  };
  const ciclo =
    luna.diaCiclo < 1 ? t.empieza : t.diaCiclo(Math.round(luna.diaCiclo));

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
            {nombreFase(luna.fase)}
          </h2>
          <p className="luna-detalle">
            {t.iluminada(Math.round(luna.fraccion * 100), ciclo)}
          </p>
          <dl className="luna-datos">
            <div>
              <dt>{t.sale}</dt>
              <dd title={luna.salida ? undefined : t.noSale}>
                {hora(luna.salida)}
              </dd>
            </div>
            <div>
              <dt>{t.sePone}</dt>
              <dd title={luna.puesta ? undefined : t.noSePone}>
                {hora(luna.puesta)}
              </dd>
            </div>
            <div>
              <dt>{t.llena}</dt>
              <dd>{dia(luna.proximaLlena)}</dd>
            </div>
            <div>
              <dt>{t.nueva}</dt>
              <dd>{dia(luna.proximaNueva)}</dd>
            </div>
          </dl>
          <p className="luna-nota">{notaFase(luna.fase, hemisferioSur)}</p>
          <p className="luna-nota">
            {t.sol(hora(sol.puesta), hora(sol.nocheInicio), hora(sol.nocheFin))}
          </p>
          <DeslizadorNoches />
        </div>
      </section>
      <section className="seccion" aria-labelledby="t-planetas">
        <h2 id="t-planetas">{t.planetas}</h2>
        {noche ? (
          <PlanetasVisibles
            planetas={noche.planetas}
            zona={ubicacion.zona}
            formato24h={formato24h}
          />
        ) : (
          <p className="aviso">{t.calculandoPlanetas}</p>
        )}
      </section>
      <section className="seccion" aria-labelledby="t-noche">
        <h2 id="t-noche">{t.noche}</h2>
        {noche ? (
          <NocheHoraPorHora
            {...noche}
            ahora={ahora}
            zona={ubicacion.zona}
            formato24h={formato24h}
            estacion={nocheCubierta ? iss.pasos : null}
          />
        ) : (
          <p className="aviso">{t.calculandoNoche}</p>
        )}
      </section>
      <CieloYEventos
        fecha={fecha}
        inicioNoche={inicioNoche}
        ahora={ahora}
        ubicacion={ubicacion}
        formato24h={formato24h}
        iss={iss}
      />
      <p className="pie">{t.pie}</p>
    </>
  );
}
