import { useMemo } from 'react';
import { ListaEventos } from '../../componentes/ListaEventos/ListaEventos';
import {
  useEventos,
  useLluvias,
  usePronostico,
  type PasosCalculados,
} from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import { pasosEntre } from '../../servicios/astro/eventos';
import { fraccionIluminada } from '../../servicios/astro/luna';
import { nocheSol } from '../../servicios/astro/sol';
import { inicioDelDia, sumarDias } from '../../servicios/tiempo';
import type { Ubicacion } from '../../tipos/ubicacion';
import { CondicionesCielo } from './CondicionesCielo';
import { vistaCondiciones } from './condiciones';
import { itemEvento } from './textosEventos';

export const DIAS_EVENTOS = 30;
const MS_HORA = 3_600_000;
const HORAS_ORBITA_VIEJA = 24;

const ES = {
  condiciones: '¿Se ve bien hoy?',
  eventos: 'Próximos eventos',
  nada: (dias: number) => `Nada destacado en los próximos ${dias} días.`,
  calculando: 'Calculando los eventos…',
  orbitaVieja: (horas: number) =>
    `Sin conexión: la órbita de la Estación es de hace ${horas} horas y sus pasos pueden tener minutos de error.`,
};

const EN: typeof ES = {
  condiciones: 'Is it a good night?',
  eventos: 'Coming up',
  nada: (dias) => `Nothing notable in the next ${dias} days.`,
  calculando: 'Working out the events…',
  orbitaVieja: (horas) =>
    `Offline: the Space Station orbit is ${horas} hours old and its passes may be minutes off.`,
};

/**
 * Paneles ¿Se ve bien hoy? y Próximos eventos de la noche que se está mirando.
 * @param inicioNoche las 18:00 de esa noche, en milisegundos
 * @param iss pasos de la Estación ya calculados, o null mientras carga la órbita
 */
export function CieloYEventos({
  fecha,
  inicioNoche,
  ahora,
  ubicacion,
  formato24h,
  iss,
}: {
  fecha: Date;
  inicioNoche: number;
  ahora: Date;
  ubicacion: Ubicacion;
  formato24h: boolean;
  iss: PasosCalculados | null;
}) {
  const t = textos({ es: ES, en: EN });
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
  const hasta = sumarDias(new Date(hoy), DIAS_EVENTOS).getTime();
  const astro = useEventos(hoy, hasta, ubicacion, lluvias);
  const eventos = useMemo(
    () =>
      [
        ...(astro ?? []),
        ...(iss ? pasosEntre(iss.pasos, new Date(hoy), new Date(hasta)) : []),
      ].sort((a, b) => a.fecha.getTime() - b.fecha.getTime()),
    [astro, iss, hoy, hasta],
  );

  const vista = vistaCondiciones(
    carga,
    oscuro.inicio,
    oscuro.fin,
    oscuro.luna,
    ubicacion.bortle,
    formato,
  );
  const orbitaVieja = iss && iss.horasDescarga > HORAS_ORBITA_VIEJA;

  return (
    <div className="dos">
      <section className="seccion" aria-labelledby="t-cond">
        <h2 id="t-cond">{t.condiciones}</h2>
        <CondicionesCielo vista={vista} />
      </section>
      <section className="seccion" aria-labelledby="t-eventos">
        <h2 id="t-eventos">{t.eventos}</h2>
        <ListaEventos
          items={eventos.map((e) => itemEvento(e, new Date(hoy), formato))}
          vacia={astro ? t.nada(DIAS_EVENTOS) : t.calculando}
        />
        {orbitaVieja && (
          <p className="condiciones-aviso">
            {t.orbitaVieja(Math.round(iss.horasDescarga))}
          </p>
        )}
      </section>
    </div>
  );
}
