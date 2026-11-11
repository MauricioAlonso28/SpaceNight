import { useEffect, useMemo, useState } from 'react';
import { ListaEventos } from '../../componentes/ListaEventos/ListaEventos';
import { useJsonPublico, usePasosISS, useTleISS } from '../../estado/datos';
import { useEstado } from '../../estado/store';
import { letraCoordenada } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
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

const ES = {
  sobre: (lat: number, lon: number) =>
    `La Estación Espacial está sobre latitud ${lat}°, longitud ${lon}°`,
  mapa: 'Mapa del mundo',
  error: 'No se pudo descargar la órbita.',
  cargando: 'Cargando la órbita…',
  ahora: (lat: string, lon: string, km: string) =>
    `Ahora sobre ${lat}, ${lon}, a ${km} km de altura. El punto pequeño eres tú; la línea, su órbita de los últimos y próximos 45 minutos.`,
  proximos: 'Próximos pasos visibles',
  noPasa: 'No pasa a la vista en los próximos 3 días.',
  calculando: 'Calculando los pasos…',
};

const EN: typeof ES = {
  sobre: (lat, lon) =>
    `The Space Station is over latitude ${lat}°, longitude ${lon}°`,
  mapa: 'World map',
  error: 'Could not download the orbit.',
  cargando: 'Loading the orbit…',
  ahora: (lat, lon, km) =>
    `Now over ${lat}, ${lon}, ${km} km up. The small dot is you; the line is its orbit over the last and next 45 minutes.`,
  proximos: 'Next visible passes',
  noPasa: 'It does not pass in view in the next 3 days.',
  calculando: 'Working out the passes…',
};

function coordenada(valor: number, tipo: 'latitud' | 'longitud'): string {
  return `${formatearNumero(Math.abs(valor), 1)}° ${letraCoordenada(valor, tipo)}`;
}

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
  const t = textos({ es: ES, en: EN });
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
              ? t.sobre(
                  Math.round(orbita.punto.latitud),
                  Math.round(orbita.punto.longitud),
                )
              : t.mapa
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
          {tle.estado === 'error' && t.error}
          {tle.estado === 'cargando' && t.cargando}
          {orbita?.punto &&
            t.ahora(
              coordenada(orbita.punto.latitud, 'latitud'),
              coordenada(orbita.punto.longitud, 'longitud'),
              formatearNumero(orbita.punto.alturaKm),
            )}
        </figcaption>
      </figure>
      <h3 className="estacion-titulo">{t.proximos}</h3>
      <ListaEventos
        items={proximos.map((e) => itemEvento(e, hoy, formato))}
        vacia={pasos ? t.noPasa : t.calculando}
      />
    </div>
  );
}
