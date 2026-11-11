import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { RUTAS_NASA, nombreRuta } from '../../app/rutas';
import { ICONOS } from '../../componentes/Navegacion/iconos';
import { useJsonPublico } from '../../estado/datos';
import { useAvisosActivos } from '../../estado/avisos';
import { useEstado } from '../../estado/store';
import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import type { ResumenNasa } from '../../servicios/nasa/avisos';
import { useApiEnVivo } from '../../servicios/nasa/datos';
import {
  masCercano,
  resumirEvento,
  type EventoEonet,
  type EventoResumido,
} from '../../servicios/nasa/eonet';
import { urlFoto, type FotoEpic } from '../../servicios/nasa/epic';
import { cuentaAtras, haceCuanto } from '../../servicios/nasa/formato';
import { MISIONES, misionDelDia } from '../../servicios/nasa/imagenes';
import { CabezaNasa } from './CabezaNasa';
import './NasaInicio.css';

const ES = {
  titulo: 'NASA en vivo',
  lead: 'Lo que pasa ahora mismo según la NASA: asteroides que se acercan, la Tierra vista desde lejos, incendios y tormentas, bólidos, planetas de otras estrellas y su archivo de fotos.',
  proximo: (n: string, ld: string) => `${n} pasa a ${ld} distancias lunares`,
  semana: (n: number) => `${n} asteroides esta semana`,
  fotos: (n: number, d: string) => `${n} fotos del ${d}`,
  activos: (n: number) => `${n} activos en la última semana`,
  cerca: (t: string, km: string) => `el más cercano: ${t}, a ${km} km`,
  ultimo: (kt: string) => `el último liberó ${kt} kt`,
  registrados: (n: string) => `${n} registrados desde 1988`,
  confirmados: 'planetas confirmados alrededor de otras estrellas',
  mision: 'la misión del día en el archivo',
  avisos: 'Avisos',
  sinAvisos: 'Sin avisos por ahora.',
  abrir: 'Abrir',
  cargando: '…',
};

const EN: typeof ES = {
  titulo: 'NASA live',
  lead: 'What is happening right now according to NASA: approaching asteroids, Earth seen from afar, fires and storms, fireballs, planets around other stars and its photo archive.',
  proximo: (n, ld) => `${n} passes at ${ld} lunar distances`,
  semana: (n) => `${n} asteroids this week`,
  fotos: (n, d) => `${n} photos from ${d}`,
  activos: (n) => `${n} active in the last week`,
  cerca: (t, km) => `the closest: ${t}, ${km} km away`,
  ultimo: (kt) => `the latest released ${kt} kt`,
  registrados: (n) => `${n} recorded since 1988`,
  confirmados: 'planets confirmed around other stars',
  mision: 'mission of the day in the archive',
  avisos: 'Alerts',
  sinAvisos: 'No alerts right now.',
  abrir: 'Open',
  cargando: '…',
};

/** Un segundero para la cuenta atrás. */
function useSegundero(): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return ahora;
}

/** Una línea del tablero: icono, nombre de la vista, valor grande, detalle y enlace. */
function Linea({
  ruta,
  valor,
  detalle,
  visual,
}: {
  ruta: string;
  valor: ReactNode;
  detalle: ReactNode;
  visual?: ReactNode;
}) {
  const r = RUTAS_NASA.find((x) => x.path === ruta)!;
  return (
    <li className="tablero-linea">
      <Link to={`/${ruta}`}>
        <span className="tablero-icono" aria-hidden="true">
          <svg viewBox="0 0 24 24">{ICONOS[ruta]}</svg>
        </span>
        <span className="tablero-nombre">{nombreRuta(r)}</span>
        <span className="tablero-valor">{valor}</span>
        <span className="tablero-detalle">{detalle}</span>
        {visual && <span className="tablero-visual">{visual}</span>}
        <span className="tablero-flecha" aria-hidden="true">
          →
        </span>
      </Link>
    </li>
  );
}

/** Portada de NASA en vivo: una línea viva por vista y los avisos al lado. */
export function NasaInicio() {
  const t = textos({ es: ES, en: EN });
  const ahora = useSegundero();
  const ubicacion = useEstado((s) => s.ubicacion);
  const resumen = useJsonPublico<ResumenNasa>('nasa/resumen.json');
  const fotos = useApiEnVivo<FotoEpic[]>(
    'https://epic.gsfc.nasa.gov/api/natural',
    30 * 60_000,
  );
  const eonet = useApiEnVivo<{ events: EventoEonet[] }>(
    'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=7',
    10 * 60_000,
  );
  const { activos } = useAvisosActivos();

  const r = resumen && resumen !== 'error' ? resumen : null;
  const eventos = useMemo(
    () =>
      eonet && eonet !== 'error'
        ? eonet.events
            .map(resumirEvento)
            .filter((e): e is EventoResumido => e !== null)
        : [],
    [eonet],
  );
  const cercano = masCercano(eventos, ubicacion.latitud, ubicacion.longitud);
  const proximo = r?.neo?.proximos.find((a) => a.fecha > ahora) ?? null;
  const foto = fotos && fotos !== 'error' ? fotos.at(-1) : undefined;
  const mision = MISIONES.find((m) => m.q === misionDelDia());

  return (
    <section className="nasa nasa-inicio" aria-labelledby="t-nasa">
      <CabezaNasa
        id="t-nasa"
        titulo={t.titulo}
        lead={t.lead}
        generado={r?.generado}
        fuentes={[{ nombre: 'api.nasa.gov', url: 'https://api.nasa.gov/' }]}
      />
      <div className="tablero">
        <ol className="tablero-lineas">
          <Linea
            ruta="nasa/asteroides"
            valor={proximo ? cuentaAtras(proximo.fecha, ahora) : t.cargando}
            detalle={
              proximo
                ? t.proximo(
                    proximo.nombre,
                    formatearNumero(proximo.distanciaLunar, 1),
                  )
                : r?.neo
                  ? t.semana(r.neo.total)
                  : ''
            }
          />
          <Linea
            ruta="nasa/tierra"
            valor={foto ? foto.date.slice(11, 16) + ' UTC' : t.cargando}
            detalle={
              foto && fotos !== 'error' && fotos
                ? t.fotos(fotos.length, foto.date.slice(0, 10))
                : ''
            }
            visual={
              foto ? <img src={urlFoto(foto, 'thumbs')} alt="" /> : undefined
            }
          />
          <Linea
            ruta="nasa/eventos"
            valor={
              eventos.length ? formatearNumero(eventos.length) : t.cargando
            }
            detalle={
              cercano
                ? `${t.activos(eventos.length)} · ${t.cerca(cercano.evento.titulo, formatearNumero(cercano.km))}`
                : ''
            }
          />
          <Linea
            ruta="nasa/bolidos"
            valor={r?.bolido ? haceCuanto(r.bolido.fecha, ahora) : t.cargando}
            detalle={
              r?.bolido && r.bolidosTotal
                ? `${t.ultimo(formatearNumero(r.bolido.kt, 2))} · ${t.registrados(formatearNumero(r.bolidosTotal))}`
                : ''
            }
          />
          <Linea
            ruta="nasa/exoplanetas"
            valor={r?.exoplanetas ? formatearNumero(r.exoplanetas) : t.cargando}
            detalle={t.confirmados}
          />
          <Linea
            ruta="nasa/archivo"
            valor={mision ? textos(mision.nombre) : ''}
            detalle={t.mision}
          />
        </ol>
        <aside className="tablero-avisos" aria-labelledby="t-avisos">
          <h3 id="t-avisos" className="nasa-rotulo">
            <span className="nasa-vivo" aria-hidden="true" /> {t.avisos}
          </h3>
          {activos.length === 0 ? (
            <p className="aviso">{t.sinAvisos}</p>
          ) : (
            <ol>
              {activos.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link to={`/${a.ruta}`}>
                    <strong>{a.titulo}</strong>
                    <span>{a.detalle}</span>
                    <small>{haceCuanto(a.fecha, ahora)}</small>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </section>
  );
}
