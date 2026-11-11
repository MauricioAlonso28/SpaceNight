import { useCallback, useEffect, useRef, useState } from 'react';
import type { ControlVisor } from '../../3d/cohete/visorModelo';
import { idioma, textos } from '../../idioma/idioma';
import { FichaPieza } from './FichaPieza';
import {
  borrarModelo,
  direccionModelo,
  estaGuardado,
  obtenerModelo,
  recordarModelo,
  ultimoModelo,
} from './guardadoModelos';
import { MODELOS_NASA, tamanoLegible, type ModeloNasa } from './modelosNasa';

const ES = {
  titulo: 'Modelos reales de la NASA',
  intro:
    'De NASA 3D Resources. Cada uno se descarga una sola vez y queda guardado en este navegador.',
  descargar: (tam: string) => `Descargar · ${tam}`,
  guardado: 'Guardado · ver sin descargar',
  enPantalla: 'En pantalla',
  cargando: (pct: number) => `Descargando… ${pct} %`,
  abriendo: 'Abriendo…',
  error:
    'No se pudo descargar el modelo. Revisa la conexión e inténtalo otra vez.',
  vacio: 'Elige un modelo de la lista para verlo aquí.',
  gestos: 'Arrastra para girar · rueda o pellizco para acercar',
  gestosPiezas:
    'Arrastra para girar · rueda o pellizco para acercar · clic en una etapa para abrirla',
  credito: 'Crédito',
  fuente: 'Ficha en NASA 3D Resources',
  borrar: (tam: string) => `Borrar la copia guardada (${tam})`,
  cerrar: 'Volver al cohete genérico',
  separar: 'Separar etapas',
  etapas: 'Etapas',
};

const EN: typeof ES = {
  titulo: 'Real NASA models',
  intro:
    'From NASA 3D Resources. Each one downloads only once and stays saved in this browser.',
  descargar: (tam) => `Download · ${tam}`,
  guardado: 'Saved · view without downloading',
  enPantalla: 'On screen',
  cargando: (pct) => `Downloading… ${pct}%`,
  abriendo: 'Opening…',
  error: 'Could not download the model. Check your connection and try again.',
  vacio: 'Pick a model from the list to view it here.',
  gestos: 'Drag to turn · wheel or pinch to zoom',
  gestosPiezas:
    'Drag to turn · wheel or pinch to zoom · click a stage to open it',
  credito: 'Credit',
  fuente: 'Page on NASA 3D Resources',
  borrar: (tam) => `Delete the saved copy (${tam})`,
  cerrar: 'Back to the generic rocket',
  separar: 'Separate stages',
  etapas: 'Stages',
};

type Carga =
  | { estado: 'nada' }
  | { estado: 'cargando'; id: string; fraccion: number | null }
  | { estado: 'listo'; id: string }
  | { estado: 'error'; id: string };

const BASE = import.meta.env.BASE_URL;

/**
 * Modelos reales de la NASA a pantalla completa: la lista a la izquierda, el modelo en el centro y la ficha de una etapa a la derecha.
 * Cada modelo se descarga una vez y se guarda en la caché del navegador; al volver se abre el último que se vio.
 * @param alCerrar vuelve al cohete genérico
 */
export function VisorModelos({ alCerrar }: { alCerrar: () => void }) {
  const t = textos({ es: ES, en: EN });
  const raiz = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const visor = useRef<Promise<ControlVisor | null> | null>(null);
  const [carga, setCarga] = useState<Carga>({ estado: 'nada' });
  const [guardados, setGuardados] = useState<Set<string>>(new Set());
  const [separado, setSeparado] = useState(false);
  const [abierta, setAbierta] = useState<string | null>(null);
  const actual =
    carga.estado === 'listo'
      ? MODELOS_NASA.find((m) => m.id === carga.id)
      : undefined;
  const pieza = actual?.piezas?.find((p) => p.id === abierta);

  const abrir = useCallback((id: string | null) => {
    setAbierta(id);
    void visor.current?.then((c) => c?.abrir(id));
  }, []);

  const ver = useCallback(async (m: ModeloNasa) => {
    if (!visor.current) return;
    const direccion = direccionModelo(m, BASE);
    setCarga({ estado: 'cargando', id: m.id, fraccion: null });
    setAbierta(null);
    setSeparado(false);
    try {
      const datos = await obtenerModelo(direccion, m.bytes, (fraccion) =>
        setCarga({ estado: 'cargando', id: m.id, fraccion }),
      );
      setGuardados((g) => new Set(g).add(m.id));
      const control = await visor.current;
      if (!control) return;
      await control.cargar(
        datos,
        m.piezas?.map((p) => p.id),
      );
      recordarModelo(m.id);
      setCarga({ estado: 'listo', id: m.id });
    } catch {
      setCarga({ estado: 'error', id: m.id });
    }
  }, []);

  useEffect(() => {
    const div = lienzo.current;
    if (!div) return;
    let vigente = true;
    let control: ControlVisor | null = null;
    visor.current = import('../../3d/cohete/visorModelo').then(
      ({ crearVisor }) => {
        if (!vigente) return null;
        control = crearVisor(div, abrir);
        return control;
      },
    );
    return () => {
      vigente = false;
      visor.current = null;
      control?.destruir();
    };
  }, [abrir]);

  useEffect(() => {
    let vigente = true;
    void Promise.all(
      MODELOS_NASA.map(async (m) =>
        (await estaGuardado(direccionModelo(m, BASE))) ? m.id : null,
      ),
    ).then((ids) => {
      if (!vigente) return;
      const conjunto = new Set(ids.filter((id): id is string => !!id));
      setGuardados(conjunto);
      const ultimo = MODELOS_NASA.find((m) => m.id === ultimoModelo());
      if (ultimo && conjunto.has(ultimo.id)) void ver(ultimo);
    });
    return () => {
      vigente = false;
    };
  }, [ver]);

  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') abrir(null);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierta, abrir]);

  useEffect(() => {
    const caja = raiz.current;
    if (!caja) return;
    const medir = () => {
      const r = caja.getBoundingClientRect();
      const izquierda =
        (lista.current?.getBoundingClientRect().right ?? r.left) - r.left;
      const ficha = caja.querySelector('.cohete-ficha');
      const derecha = ficha ? r.right - ficha.getBoundingClientRect().left : 0;
      void visor.current?.then((c) => c?.fijarMargenes(izquierda, derecha));
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(caja);
    return () => observador.disconnect();
  }, [pieza?.id]);

  const separar = () => {
    setSeparado(!separado);
    void visor.current?.then((c) => c?.separar(!separado));
  };

  const borrar = async (m: ModeloNasa) => {
    await borrarModelo(direccionModelo(m, BASE));
    setGuardados((g) => {
      const nuevo = new Set(g);
      nuevo.delete(m.id);
      return nuevo;
    });
  };

  const estadoDe = (m: ModeloNasa) => {
    if ('id' in carga && carga.id === m.id) {
      if (carga.estado === 'listo') return t.enPantalla;
      if (carga.estado === 'cargando') {
        return carga.fraccion === null
          ? t.abriendo
          : t.cargando(Math.round(carga.fraccion * 100));
      }
    }
    return guardados.has(m.id)
      ? t.guardado
      : t.descargar(tamanoLegible(m.bytes, idioma()));
  };

  const ocupado = carga.estado === 'cargando';

  return (
    <section className="cohete-modelos" aria-labelledby="t-modelos" ref={raiz}>
      <div
        className="cohete-modelos-lienzo"
        ref={lienzo}
        role="img"
        aria-label={actual ? textos(actual.nombre) : t.titulo}
      />
      <div className="cohete-modelos-lista" ref={lista}>
        <h3 id="t-modelos">{t.titulo}</h3>
        <p className="cohete-modelos-intro">{t.intro}</p>
        <ol>
          {MODELOS_NASA.map((m) => {
            const activo = 'id' in carga && carga.id === m.id;
            const enPantalla = activo && carga.estado === 'listo';
            return (
              <li key={m.id} data-activo={activo || undefined}>
                <button
                  type="button"
                  className="cohete-modelos-elegir"
                  aria-current={enPantalla || undefined}
                  disabled={ocupado || enPantalla}
                  onClick={() => ver(m)}
                >
                  <strong>{textos(m.nombre)}</strong>
                  <span data-guardado={guardados.has(m.id) || undefined}>
                    {estadoDe(m)}
                  </span>
                </button>
                {activo && (
                  <div className="cohete-modelos-detalle">
                    <p>{textos(m.descripcion)}</p>
                    <small>
                      {t.credito}: {m.credito} ·{' '}
                      <a href={m.pagina} target="_blank" rel="noreferrer">
                        {t.fuente}
                      </a>
                    </small>
                    {carga.estado === 'error' && (
                      <p className="cohete-modelos-error" role="alert">
                        {t.error}
                      </p>
                    )}
                    {enPantalla && m.piezas && (
                      <div className="cohete-modelos-etapas">
                        <span>{t.etapas}</span>
                        <button
                          type="button"
                          className="cohete-chip cohete-chip-separar"
                          aria-pressed={separado}
                          onClick={separar}
                        >
                          {t.separar}
                        </button>
                        {m.piezas.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="cohete-chip"
                            aria-pressed={abierta === p.id}
                            onClick={() =>
                              abrir(abierta === p.id ? null : p.id)
                            }
                          >
                            {textos(p.nombre)}
                          </button>
                        ))}
                      </div>
                    )}
                    {guardados.has(m.id) && !ocupado && (
                      <button
                        type="button"
                        className="cohete-enlace"
                        onClick={() => borrar(m)}
                      >
                        {t.borrar(tamanoLegible(m.bytes, idioma()))}
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <button type="button" className="cohete-enlace" onClick={alCerrar}>
          ← {t.cerrar}
        </button>
      </div>
      {carga.estado === 'nada' && (
        <p className="cohete-modelos-aviso">{t.vacio}</p>
      )}
      {carga.estado === 'listo' && (
        <p className="cohete-modelos-gestos">
          {actual?.piezas ? t.gestosPiezas : t.gestos}
        </p>
      )}
      {actual && pieza && (
        <FichaPieza
          pieza={pieza}
          modelo={textos(actual.nombre)}
          fuentes={actual.fuentes ?? []}
          alVolver={() => abrir(null)}
        />
      )}
    </section>
  );
}
