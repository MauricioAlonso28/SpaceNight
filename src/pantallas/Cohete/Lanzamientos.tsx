import { useEffect, useState } from 'react';
import { useEstado } from '../../estado/store';
import { idioma, textos } from '../../idioma/idioma';
import { formatearHora, formatearNumero } from '../../servicios/formato';
import {
  agruparLanzamientos,
  cuandoLanzamiento,
  estadoLanzamiento,
  nombreEvento,
  relojLanzamiento,
  siguienteConHora,
  tieneHora,
  useLanzamientos,
  type Lanzamiento,
  type LanzamientoHecho,
} from '../../servicios/cohete/lanzamientos';
import { CabezaNasa, Cifra, SinDatos } from '../Nasa/CabezaNasa';
import './Lanzamientos.css';

const ES = {
  kicker: 'Cohete',
  titulo: 'Próximos lanzamientos',
  lead: 'Todos los cohetes que van a despegar en el mundo, con la hora en tu zona, la cuenta atrás y dónde verlo en directo.',
  siguiente: 'Próximo despegue',
  elegido: 'Lanzamiento elegido',
  ventana: (a: string, b: string) => `Ventana de ${a} a ${b}`,
  verDirecto: 'Ver en directo',
  verVideo: 'Ver la transmisión',
  enVivo: 'En vivo',
  propulsor: (s: string, n: number | null) =>
    n ? `Propulsor ${s}, en su vuelo n.º ${n}` : `Propulsor ${s}`,
  aterriza: (lugar: string, km: number | null) =>
    km ? `vuelve a ${lugar}, a ${formatearNumero(km)} km` : `vuelve a ${lugar}`,
  vuelveBase: 'aterriza junto a la plataforma',
  alto: 'de alto',
  empuje: 'de empuje al despegar',
  leo: 'a órbita baja',
  exito: (e: number, t: number) => `${e} de ${t} con éxito`,
  cronologia: 'La secuencia',
  calendario: 'Calendario',
  hoy: 'Hoy',
  manana: 'Mañana',
  porConfirmar: 'fecha por confirmar',
  verMas: (n: number) => `Ver ${n} más con fecha por confirmar`,
  verMenos: 'Ocultar los que tienen fecha por confirmar',
  recientes: 'Los últimos despegues',
  orbita: 'Órbita',
  ninguno: 'Elige un lanzamiento del calendario.',
  probabilidad: (p: number) => `${p} % de buen tiempo`,
};

const EN: typeof ES = {
  kicker: 'Rocket',
  titulo: 'Upcoming launches',
  lead: 'Every rocket about to lift off around the world, with the time in your zone, the countdown and where to watch it live.',
  siguiente: 'Next liftoff',
  elegido: 'Selected launch',
  ventana: (a, b) => `Window from ${a} to ${b}`,
  verDirecto: 'Watch live',
  verVideo: 'Watch the webcast',
  enVivo: 'Live',
  propulsor: (s, n) => (n ? `Booster ${s}, on flight #${n}` : `Booster ${s}`),
  aterriza: (lugar, km) =>
    km
      ? `returns to ${lugar}, ${formatearNumero(km)} km away`
      : `returns to ${lugar}`,
  vuelveBase: 'lands next to the pad',
  alto: 'tall',
  empuje: 'of liftoff thrust',
  leo: 'to low orbit',
  exito: (e, t) => `${e} of ${t} successful`,
  cronologia: 'The sequence',
  calendario: 'Calendar',
  hoy: 'Today',
  manana: 'Tomorrow',
  porConfirmar: 'date to be confirmed',
  verMas: (n) => `Show ${n} more with a date to be confirmed`,
  verMenos: 'Hide the ones with a date to be confirmed',
  recientes: 'Latest liftoffs',
  orbita: 'Orbit',
  ninguno: 'Pick a launch from the calendar.',
  probabilidad: (p) => `${p}% chance of good weather`,
};

/** Un reloj que avanza cada segundo, para la cuenta atrás. */
function useSegundos(): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return ahora;
}

/** Etiqueta del estado de un lanzamiento con su color. */
function Estado({ abrev }: { abrev: string }) {
  const e = estadoLanzamiento(abrev);
  return <span className={`lanz-estado ${e.tono}`}>{e.texto}</span>;
}

/** La cronología de un lanzamiento: cada evento a su hora relativa, con los ya pasados apagados. */
function Cronologia({ l, ahora }: { l: Lanzamiento; ahora: number }) {
  const t = textos({ es: ES, en: EN });
  const desde = (ahora - l.net) / 1000;
  return (
    <section className="lanz-crono" aria-labelledby="t-crono">
      <h4 id="t-crono" className="nasa-rotulo">
        {t.cronologia}
      </h4>
      <ol>
        {l.eventos.map((e) => (
          <li
            key={`${e.id}-${e.t}`}
            className={e.t <= desde ? 'pasado' : undefined}
            data-despegue={e.id === 10 || undefined}
          >
            <time>{relojLanzamiento(l.net, l.net + e.t * 1000)}</time>
            <span>{nombreEvento(e)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** El lanzamiento destacado: cuenta atrás, misión, propulsor, transmisión, datos del cohete y su secuencia. */
function Destacado({
  l,
  ahora,
  esSiguiente,
}: {
  l: Lanzamiento;
  ahora: number;
  esSiguiente: boolean;
}) {
  const t = textos({ es: ES, en: EN });
  const zona = useEstado((s) => s.ubicacion.zona);
  const h24 = useEstado((s) => s.ajustes.formato24h);
  const hora = (d: Date) => formatearHora(d, zona, h24);
  const p = l.perfil;
  const at = l.propulsor?.aterrizaje;
  return (
    <article className="lanz-destacado" aria-labelledby="t-destacado">
      <div className="lanz-principal">
        <p className="nasa-rotulo">
          {esSiguiente ? t.siguiente : t.elegido} · <Estado abrev={l.estado} />
          {l.enVivo && <span className="lanz-envivo">{t.enVivo}</span>}
        </p>
        <p className="lanz-reloj" aria-live="off">
          {tieneHora(l)
            ? relojLanzamiento(l.net, ahora)
            : cuandoLanzamiento(l, zona, hora)}
        </p>
        <h3 id="t-destacado">{l.nombre}</h3>
        <p className="lanz-linea">
          <strong>{l.cohete}</strong>
          {l.proveedor && ` · ${l.proveedor}`}
        </p>
        <p className="lanz-linea">
          {l.sitio}
          {tieneHora(l) && ` · ${cuandoLanzamiento(l, zona, hora)}`}
        </p>
        {l.ventana && l.ventana[1] > l.ventana[0] && (
          <p className="lanz-linea suave">
            {t.ventana(
              hora(new Date(l.ventana[0])),
              hora(new Date(l.ventana[1])),
            )}
          </p>
        )}
        {l.propulsor?.serie && (
          <p className="lanz-linea suave">
            {t.propulsor(l.propulsor.serie, l.propulsor.vuelo)}
            {at &&
              ` · ${at.tipo === 'RTLS' ? t.vuelveBase : t.aterriza(at.lugarNombre ?? at.lugar ?? '', at.km)}`}
          </p>
        )}
        {l.probabilidad !== null && (
          <p className="lanz-linea suave">{t.probabilidad(l.probabilidad)}</p>
        )}
        {l.descripcion && <p className="lanz-descripcion">{l.descripcion}</p>}
        <div className="nasa-chips">
          {l.video && (
            <a
              className="nasa-chip lanz-video"
              href={l.video}
              target="_blank"
              rel="noreferrer"
            >
              ▶ {l.enVivo ? t.verDirecto : t.verVideo}
            </a>
          )}
          {l.orbitaNombre && (
            <span className="nasa-etiqueta">
              {t.orbita}: {l.orbitaNombre}
            </span>
          )}
        </div>
      </div>
      <div className="lanz-lateral">
        <dl className="nasa-cifras lanz-cifras">
          {p.alto !== null && (
            <Cifra valor={p.alto} unidad="m" etiqueta={t.alto} decimales={1} />
          )}
          {p.empuje !== null && (
            <Cifra valor={p.empuje} unidad="kN" etiqueta={t.empuje} />
          )}
          {p.leo !== null && (
            <Cifra valor={p.leo} unidad="kg" etiqueta={t.leo} />
          )}
          {p.lanzamientos ? (
            <Cifra
              valor={(100 * (p.exitos ?? 0)) / p.lanzamientos}
              unidad="%"
              decimales={1}
              etiqueta={t.exito(p.exitos ?? 0, p.lanzamientos)}
              acento
            />
          ) : null}
        </dl>
        {l.eventos.length > 0 && <Cronologia l={l} ahora={ahora} />}
      </div>
    </article>
  );
}

/** Título de un grupo del calendario: hoy, mañana, el día o el mes por confirmar. */
function tituloGrupo(
  clave: string,
  conDia: boolean,
  zona: string,
  ahora: number,
) {
  const t = textos({ es: ES, en: EN });
  const loc = idioma() === 'es' ? 'es-PE' : 'en-US';
  if (!conDia) {
    const fecha = Date.parse(`${clave.slice(1)}-15T12:00:00Z`);
    const mes = new Intl.DateTimeFormat(loc, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(fecha);
    return `${mes} · ${t.porConfirmar}`;
  }
  const dia = (ms: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: zona }).format(ms);
  if (clave === dia(ahora)) return t.hoy;
  if (clave === dia(ahora + 86_400_000)) return t.manana;
  return new Intl.DateTimeFormat(loc, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(Date.parse(`${clave}T12:00:00Z`));
}

/** Los últimos lanzamientos hechos, con su resultado. */
function Recientes({ lista }: { lista: LanzamientoHecho[] }) {
  const t = textos({ es: ES, en: EN });
  const zona = useEstado((s) => s.ubicacion.zona);
  if (!lista.length) return null;
  const loc = idioma() === 'es' ? 'es-PE' : 'en-US';
  return (
    <section className="lanz-recientes" aria-labelledby="t-recientes">
      <h3 id="t-recientes">{t.recientes}</h3>
      <ol>
        {lista.map((r) => (
          <li key={r.id}>
            <Estado abrev={r.estado} />
            <strong>{r.cohete}</strong>
            <span>{r.nombre}</span>
            <small>
              {new Intl.DateTimeFormat(loc, {
                day: 'numeric',
                month: 'short',
                timeZone: zona,
              }).format(r.net)}
              {r.video && (
                <>
                  {' · '}
                  <a
                    className="nasa-enlace"
                    href={r.video}
                    target="_blank"
                    rel="noreferrer"
                  >
                    ▶
                  </a>
                </>
              )}
            </small>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Vista Próximos lanzamientos: el destacado con su cuenta atrás, el calendario por días y los últimos despegues. */
export function Lanzamientos() {
  const t = textos({ es: ES, en: EN });
  const datos = useLanzamientos();
  const ahora = useSegundos();
  const zona = useEstado((s) => s.ubicacion.zona);
  const h24 = useEstado((s) => s.ajustes.formato24h);
  const [elegido, setElegido] = useState<string | null>(null);
  const [verTodos, setVerTodos] = useState(false);
  const listos = datos && datos !== 'error' ? datos : null;

  const cabeza = (
    <CabezaNasa
      id="t-lanz"
      kicker={t.kicker}
      titulo={t.titulo}
      lead={t.lead}
      generado={listos?.generado}
      fuentes={[
        {
          nombre: 'Launch Library 2 · The Space Devs',
          url: 'https://thespacedevs.com/llapi',
        },
      ]}
    />
  );
  if (!listos) {
    return (
      <section className="nasa" aria-labelledby="t-lanz">
        {cabeza}
        <SinDatos error={datos === 'error'} />
      </section>
    );
  }

  const proximos = listos.proximos.filter(
    (l) => l.net > ahora - 3_600_000 || !tieneHora(l),
  );
  const siguiente = siguienteConHora(proximos, ahora) ?? proximos[0] ?? null;
  const destacado = proximos.find((l) => l.id === elegido) ?? siguiente;
  const hora = (d: Date) => formatearHora(d, zona, h24);
  const grupos = agruparLanzamientos(proximos, zona);
  const sinDia = grupos
    .filter((g) => !g.conDia)
    .reduce((n, g) => n + g.lanzamientos.length, 0);

  return (
    <section className="nasa lanz" aria-labelledby="t-lanz">
      {cabeza}
      {destacado ? (
        <Destacado
          l={destacado}
          ahora={ahora}
          esSiguiente={destacado === siguiente}
        />
      ) : (
        <p className="aviso">{t.ninguno}</p>
      )}
      <div className="lanz-cuerpo">
        <section className="lanz-calendario" aria-labelledby="t-calendario">
          <h3 id="t-calendario">{t.calendario}</h3>
          {grupos
            .filter((g) => g.conDia || verTodos)
            .map((g) => (
              <div key={g.clave} className="lanz-dia">
                <h4>{tituloGrupo(g.clave, g.conDia, zona, ahora)}</h4>
                <ul>
                  {g.lanzamientos.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        aria-pressed={l === destacado}
                        onClick={() => {
                          setElegido(l.id);
                          document
                            .querySelector('.lanz-destacado')
                            ?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start',
                            });
                        }}
                      >
                        <time>
                          {tieneHora(l)
                            ? `${l.precision === 'HR' ? '~' : ''}${hora(new Date(l.net))}`
                            : '—'}
                        </time>
                        <span className="lanz-mision">
                          <strong>{l.cohete}</strong>
                          <span>{l.nombre}</span>
                        </span>
                        <span className="lanz-sitio">
                          {l.sitio?.split(',')[0]}
                        </span>
                        <span className="lanz-fin">
                          {l.orbita && <small>{l.orbita}</small>}
                          <Estado abrev={l.estado} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          {sinDia > 0 && (
            <button
              type="button"
              className="nasa-chip lanz-mas"
              aria-expanded={verTodos}
              onClick={() => setVerTodos(!verTodos)}
            >
              {verTodos ? t.verMenos : t.verMas(sinDia)}
            </button>
          )}
        </section>
        <Recientes lista={listos.recientes} />
      </div>
    </section>
  );
}
