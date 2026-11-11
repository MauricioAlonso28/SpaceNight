import { useEffect, useMemo, useRef, useState } from 'react';
import type { ControlGlobo } from '../../3d/escenaTierra';
import { soportaWebGL } from '../../3d/soporte';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { nombreLugar } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import { useApiEnVivo } from '../../servicios/nasa/datos';
import {
  COLOR_CATEGORIA,
  NOMBRE_CATEGORIA,
  contarCategorias,
  masCercano,
  resumirEvento,
  type EventoEonet,
  type EventoResumido,
} from '../../servicios/nasa/eonet';
import {
  distanciaSuperficieKm,
  haceCuanto,
} from '../../servicios/nasa/formato';
import { CabezaNasa, Cifra, SinDatos } from './CabezaNasa';
import './Eventos.css';

const ES = {
  titulo: 'Eventos naturales',
  lead: 'Incendios, volcanes, tormentas y hielo que los satélites de la NASA siguen ahora mismo. Cada punto late donde ocurre; las tormentas dejan su recorrido.',
  abiertos: 'eventos activos',
  categorias: 'categorías',
  cercano: (lugar: string) => `el más cercano a ${lugar}`,
  todos: 'Todos',
  filtrar: 'Filtrar por tipo',
  lista: 'En vivo',
  globo:
    'Globo terráqueo con los eventos naturales activos; arrástralo para girarlo',
  sin3d:
    'Este navegador no puede dibujar el globo en 3D; la lista tiene todos los eventos.',
  fuente: 'Fuente',
  km: (k: string) => `a ${k} km de ti`,
  visto: 'Última observación',
  magnitud: 'Magnitud',
  ninguno: 'No hay eventos de este tipo ahora.',
};

const EN: typeof ES = {
  titulo: 'Natural events',
  lead: 'Wildfires, volcanoes, storms and ice that NASA satellites are tracking right now. Each dot pulses where it happens; storms leave their track.',
  abiertos: 'active events',
  categorias: 'categories',
  cercano: (lugar) => `the closest to ${lugar}`,
  todos: 'All',
  filtrar: 'Filter by type',
  lista: 'Live',
  globo: 'Globe with the active natural events; drag to turn it',
  sin3d: 'This browser cannot draw the 3D globe; the list has every event.',
  fuente: 'Source',
  km: (k) => `${k} km from you`,
  visto: 'Last observed',
  magnitud: 'Magnitude',
  ninguno: 'No events of this type right now.',
};

const EONET = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const RECIENTES = `${EONET}?status=open&days=60`;
const VOLCANES = `${EONET}?status=open&category=volcanoes`;

/** El globo 3D: lo carga aparte y le pasa los eventos, el elegido y tu ubicación. */
function Globo({
  eventos,
  elegido,
  lat,
  lon,
  alElegir,
}: {
  eventos: EventoResumido[];
  elegido: string | null;
  lat: number;
  lon: number;
  alElegir: (id: string | null) => void;
}) {
  const t = textos({ es: ES, en: EN });
  const lienzo = useRef<HTMLCanvasElement>(null);
  const [control, setControl] = useState<ControlGlobo | null>(null);
  const [fallo, setFallo] = useState(!soportaWebGL());
  const elegir = useRef(alElegir);

  useEffect(() => {
    elegir.current = alElegir;
  });

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas || fallo) return;
    let vigente = true;
    let c: ControlGlobo | null = null;
    import('../../3d/escenaTierra')
      .then((m) => m.crearGlobo(canvas, (id) => elegir.current(id)))
      .then((g) => {
        if (!g) return setFallo(true);
        if (!vigente) return g.destruir();
        c = g;
        setControl(g);
      })
      .catch(() => setFallo(true));
    return () => {
      vigente = false;
      c?.destruir();
    };
  }, [fallo]);

  useEffect(() => {
    control?.fijarUsuario(lat, lon);
  }, [control, lat, lon]);

  useEffect(() => {
    control?.fijarPuntos(
      eventos.map((e) => ({
        id: e.id,
        lat: e.lat,
        lon: e.lon,
        color: COLOR_CATEGORIA[e.categoria] ?? '#ffffff',
        recorrido: e.categoria === 'severeStorms' ? e.recorrido : undefined,
      })),
    );
  }, [control, eventos]);

  useEffect(() => {
    control?.enfocar(elegido);
  }, [control, elegido, eventos]);

  if (fallo) return <p className="eventos-sin3d">{t.sin3d}</p>;
  return (
    <canvas
      ref={lienzo}
      className="eventos-globo"
      role="img"
      aria-label={t.globo}
    />
  );
}

/** Vista Eventos naturales: el globo con los eventos activos, sus cifras, filtros, el más cercano y la lista en vivo. */
export function Eventos() {
  const t = textos({ es: ES, en: EN });
  const ahora = useAhora();
  const ubicacion = useEstado((s) => s.ubicacion);
  const recientes = useApiEnVivo<{ events: EventoEonet[] }>(
    RECIENTES,
    10 * 60_000,
  );
  const volcanes = useApiEnVivo<{ events: EventoEonet[] }>(
    VOLCANES,
    60 * 60_000,
  );
  const datos =
    recientes === 'error' && volcanes === 'error'
      ? 'error'
      : recientes && recientes !== 'error'
        ? recientes
        : null;
  const [categoria, setCategoria] = useState<string | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);

  const todos = useMemo(() => {
    if (!datos || datos === 'error') return [];
    const extra = volcanes && volcanes !== 'error' ? volcanes.events : [];
    const vistos = new Set<string>();
    return [...datos.events, ...extra]
      .filter((e) => !vistos.has(e.id) && vistos.add(e.id))
      .map(resumirEvento)
      .filter((e): e is EventoResumido => e !== null)
      .sort((a, b) => b.fecha - a.fecha);
  }, [datos, volcanes]);
  const visibles = useMemo(
    () => (categoria ? todos.filter((e) => e.categoria === categoria) : todos),
    [todos, categoria],
  );
  const conteo = contarCategorias(todos);
  const cercano = masCercano(todos, ubicacion.latitud, ubicacion.longitud);
  const actual = todos.find((e) => e.id === elegido) ?? null;

  const cabeza = (
    <CabezaNasa
      id="t-eventos"
      titulo={t.titulo}
      lead={t.lead}
      fuentes={[{ nombre: 'NASA EONET', url: 'https://eonet.gsfc.nasa.gov/' }]}
    />
  );
  if (!todos.length) {
    return (
      <section className="nasa" aria-labelledby="t-eventos">
        {cabeza}
        <SinDatos error={datos === 'error'} />
      </section>
    );
  }

  const nombreCat = (id: string) =>
    textos(NOMBRE_CATEGORIA[id] ?? { es: id, en: id });

  return (
    <section className="nasa naturales" aria-labelledby="t-eventos">
      {cabeza}
      <dl className="nasa-cifras">
        <Cifra valor={todos.length} etiqueta={t.abiertos} />
        {conteo.slice(0, 3).map(([id, n]) => (
          <Cifra key={id} valor={n} etiqueta={nombreCat(id).toLowerCase()} />
        ))}
        {cercano && (
          <Cifra
            valor={cercano.km}
            unidad="km"
            etiqueta={`${t.cercano(nombreLugar(ubicacion))} · ${cercano.evento.titulo}`}
            acento
          />
        )}
      </dl>
      <div className="eventos-cuerpo">
        <div className="eventos-escena">
          <Globo
            eventos={visibles}
            elegido={elegido}
            lat={ubicacion.latitud}
            lon={ubicacion.longitud}
            alElegir={setElegido}
          />
          {actual && (
            <article className="eventos-ficha" key={actual.id}>
              <p
                className="nasa-rotulo"
                style={{ color: COLOR_CATEGORIA[actual.categoria] }}
              >
                {nombreCat(actual.categoria)}
              </p>
              <h3>{actual.titulo}</h3>
              <p>
                {t.visto} {haceCuanto(actual.fecha, ahora)} ·{' '}
                {t.km(
                  formatearNumero(
                    distanciaSuperficieKm(
                      ubicacion.latitud,
                      ubicacion.longitud,
                      actual.lat,
                      actual.lon,
                    ),
                  ),
                )}
                {actual.magnitud && ` · ${t.magnitud} ${actual.magnitud}`}
              </p>
              <a
                className="nasa-enlace"
                href={actual.fuente}
                target="_blank"
                rel="noreferrer"
              >
                {t.fuente} ↗
              </a>
            </article>
          )}
        </div>
        <div className="eventos-lado">
          <div className="nasa-chips" role="group" aria-label={t.filtrar}>
            <button
              type="button"
              className="nasa-chip"
              aria-pressed={categoria === null}
              onClick={() => setCategoria(null)}
            >
              {t.todos} · {todos.length}
            </button>
            {conteo.map(([id, n]) => (
              <button
                key={id}
                type="button"
                className="nasa-chip"
                aria-pressed={categoria === id}
                onClick={() => setCategoria(categoria === id ? null : id)}
              >
                <i style={{ background: COLOR_CATEGORIA[id] }} />
                {nombreCat(id)} · {n}
              </button>
            ))}
          </div>
          <p className="nasa-rotulo eventos-rotulo">
            <span className="nasa-vivo" aria-hidden="true" /> {t.lista}
          </p>
          {visibles.length === 0 ? (
            <p className="aviso">{t.ninguno}</p>
          ) : (
            <ol className="naturales-lista">
              {visibles.slice(0, 120).map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    aria-pressed={e.id === elegido}
                    onClick={() => setElegido(e.id === elegido ? null : e.id)}
                  >
                    <i style={{ background: COLOR_CATEGORIA[e.categoria] }} />
                    <span className="naturales-nombre">{e.titulo}</span>
                    <span className="naturales-cuando">
                      {haceCuanto(e.fecha, ahora)}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
