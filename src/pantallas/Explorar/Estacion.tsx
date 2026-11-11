import { useEffect, useMemo, useState } from 'react';
import { ListaEventos } from '../../componentes/ListaEventos/ListaEventos';
import { useJsonPublico, usePasosISS, useTleISS } from '../../estado/datos';
import { useEstado } from '../../estado/store';
import { pasosEntre } from '../../servicios/astro/eventos';
import { formatearNumero } from '../../servicios/formato';
import { posicionISS, trazaISS } from '../../servicios/satelites/iss';
import { inicioDelDia } from '../../servicios/tiempo';
import type { Ubicacion } from '../../tipos/ubicacion';
import { itemEvento } from '../EstaNoche/textosEventos';
import { tramosTraza } from './datosExplorar';

const MS_HORA = 3_600_000;
const REFRESCO_MS = 5000;
const MINUTOS_TRAZA = 45;

/** La Estación Espacial ahora sobre el mapa del mundo, su traza y sus próximos pasos visibles. */
export function Estacion({
  ahora,
  ubicacion,
  formato24h,
}: {
  ahora: Date;
  ubicacion: Ubicacion;
  formato24h: boolean;
}) {
  const hora = Math.floor(ahora.getTime() / MS_HORA);
  const tle = useTleISS(hora);
  const pasos = usePasosISS(ubicacion, hora);
  const mundo = useJsonPublico<{ trazado: string }>('mundo.json');
  const simulada = useEstado((s) => s.fechaSimulada);
  const [inicio] = useState(() => Date.now());
  const [instante, setInstante] = useState(inicio);

  useEffect(() => {
    const id = window.setInterval(() => setInstante(Date.now()), REFRESCO_MS);
    return () => window.clearInterval(id);
  }, []);

  const fecha = useMemo(
    () =>
      simulada
        ? new Date(simulada.getTime() + (instante - inicio))
        : new Date(instante),
    [simulada, instante, inicio],
  );
  const orbita = useMemo(() => {
    if (tle.estado !== 'listo') return null;
    const t = tle.resultado.valor;
    return {
      punto: posicionISS(t, fecha),
      traza: trazaISS(t, fecha, MINUTOS_TRAZA),
    };
  }, [tle, fecha]);

  const hoy = inicioDelDia(ahora, ubicacion.zona);
  const proximos = pasos
    ? pasosEntre(pasos.pasos, ahora, new Date(ahora.getTime() + 72 * MS_HORA))
    : [];
  const formato = { zona: ubicacion.zona, formato24h };

  return (
    <div className="estacion">
      <figure className="estacion-mapa panel">
        <svg
          viewBox="0 0 360 180"
          role="img"
          aria-label={
            orbita?.punto
              ? `La Estación Espacial está sobre latitud ${Math.round(orbita.punto.latitud)}°, longitud ${Math.round(orbita.punto.longitud)}°`
              : 'Mapa del mundo'
          }
        >
          <rect width="360" height="180" className="estacion-mar" />
          {mundo && mundo !== 'error' && (
            <path d={mundo.trazado} className="estacion-tierra" />
          )}
          {orbita?.traza &&
            tramosTraza(orbita.traza).map((t) => (
              <polyline
                key={t.slice(0, 20)}
                points={t}
                className="estacion-traza"
              />
            ))}
          <circle
            cx={ubicacion.longitud + 180}
            cy={90 - ubicacion.latitud}
            r="2.2"
            className="estacion-tu"
          />
          {orbita?.punto && (
            <circle
              cx={orbita.punto.longitud + 180}
              cy={90 - orbita.punto.latitud}
              r="3.2"
              className="estacion-iss"
            />
          )}
        </svg>
        <figcaption>
          {tle.estado === 'error' && 'No se pudo descargar la órbita.'}
          {tle.estado === 'cargando' && 'Cargando la órbita…'}
          {orbita?.punto &&
            `Ahora sobre ${formatearNumero(Math.abs(orbita.punto.latitud), 1)}° ${orbita.punto.latitud >= 0 ? 'N' : 'S'}, ${formatearNumero(Math.abs(orbita.punto.longitud), 1)}° ${orbita.punto.longitud >= 0 ? 'E' : 'O'}, a ${formatearNumero(orbita.punto.alturaKm)} km de altura. El punto pequeño eres tú; la línea, su órbita de los últimos y próximos 45 minutos.`}
        </figcaption>
      </figure>
      <h3 className="estacion-titulo">Próximos pasos visibles</h3>
      <ListaEventos
        items={proximos.map((e) => itemEvento(e, hoy, formato))}
        vacia={
          pasos
            ? 'No pasa a la vista en los próximos 3 días.'
            : 'Calculando los pasos…'
        }
      />
    </div>
  );
}
