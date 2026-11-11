import { useMemo } from 'react';
import { ListaEventos } from '../../componentes/ListaEventos/ListaEventos';
import { useLluvias, usePronostico } from '../../estado/datos';
import { eventosEntre } from '../../servicios/astro/eventos';
import { fraccionIluminada } from '../../servicios/astro/luna';
import { nocheSol } from '../../servicios/astro/sol';
import { inicioDelDia, sumarDias } from '../../servicios/tiempo';
import type { Ubicacion } from '../../tipos/ubicacion';
import { CondicionesCielo } from './CondicionesCielo';
import { vistaCondiciones } from './condiciones';
import { itemEvento } from './textosEventos';

export const DIAS_EVENTOS = 30;
const MS_HORA = 3_600_000;

/**
 * Paneles ¿Se ve bien hoy? y Próximos eventos de la noche que se está mirando.
 * @param inicioNoche las 18:00 de esa noche, en milisegundos
 */
export function CieloYEventos({
  fecha,
  inicioNoche,
  ahora,
  ubicacion,
  formato24h,
}: {
  fecha: Date;
  inicioNoche: number;
  ahora: Date;
  ubicacion: Ubicacion;
  formato24h: boolean;
}) {
  const carga = usePronostico(ubicacion, Math.floor(ahora.getTime() / MS_HORA));
  const lluvias = useLluvias();
  const formato = { zona: ubicacion.zona, formato24h };

  const oscuro = useMemo(() => {
    const s = nocheSol(new Date(inicioNoche), ubicacion);
    const inicio = s.nocheInicio ?? s.puesta ?? new Date(inicioNoche);
    const fin = s.nocheFin ?? s.salida ?? new Date(inicioNoche + 12 * MS_HORA);
    const mitad = new Date((inicio.getTime() + fin.getTime()) / 2);
    return { inicio, fin, luna: fraccionIluminada(mitad) };
  }, [inicioNoche, ubicacion]);

  const hoy = inicioDelDia(fecha, ubicacion.zona).getTime();
  const eventos = useMemo(
    () =>
      eventosEntre(
        new Date(hoy),
        sumarDias(new Date(hoy), DIAS_EVENTOS),
        ubicacion,
        lluvias,
      ),
    [hoy, ubicacion, lluvias],
  );

  const vista = vistaCondiciones(
    carga,
    oscuro.inicio,
    oscuro.fin,
    oscuro.luna,
    ubicacion.bortle,
    formato,
  );

  return (
    <div className="dos">
      <section className="seccion" aria-labelledby="t-cond">
        <h2 id="t-cond">¿Se ve bien hoy?</h2>
        <CondicionesCielo vista={vista} />
      </section>
      <section className="seccion" aria-labelledby="t-eventos">
        <h2 id="t-eventos">Próximos eventos</h2>
        <ListaEventos
          items={eventos.map((e) => itemEvento(e, new Date(hoy), formato))}
          vacia={`Nada destacado en los próximos ${DIAS_EVENTOS} días.`}
        />
      </section>
    </div>
  );
}
