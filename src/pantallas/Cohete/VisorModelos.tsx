import { useCallback, useEffect, useRef, useState } from 'react';
import type { ControlVisor } from '../../3d/cohete/visorModelo';
import { idioma, textos } from '../../idioma/idioma';
import { FichaPieza } from './FichaPieza';
import { MODELOS_NASA, tamanoLegible, type ModeloNasa } from './modelosNasa';

const ES = {
  titulo: 'Modelos reales de la NASA',
  intro:
    'Modelos 3D de NASA 3D Resources. Cada uno se descarga solo cuando lo pides.',
  ver: (tam: string) => `Descargar y ver (${tam})`,
  cargando: (pct: number) => `Descargando… ${pct} %`,
  error:
    'No se pudo descargar el modelo. Revisa la conexión e inténtalo otra vez.',
  vacio: 'Elige un modelo de la lista para verlo aquí.',
  gestos: 'Arrastra para girar · rueda o pellizco para acercar',
  credito: 'Crédito',
  fuente: 'Ficha en NASA 3D Resources',
  cerrar: 'Volver al cohete genérico',
  separar: 'Separar etapas',
  etapas: 'Etapas',
  gestosPiezas:
    'Arrastra para girar · rueda o pellizco para acercar · clic en una etapa para abrirla',
};

const EN: typeof ES = {
  titulo: 'Real NASA models',
  intro:
    '3D models from NASA 3D Resources. Each one downloads only when you ask.',
  ver: (tam) => `Download and view (${tam})`,
  cargando: (pct) => `Downloading… ${pct}%`,
  error: 'Could not download the model. Check your connection and try again.',
  vacio: 'Pick a model from the list to view it here.',
  gestos: 'Drag to turn · wheel or pinch to zoom',
  credito: 'Credit',
  fuente: 'Page on NASA 3D Resources',
  cerrar: 'Back to the generic rocket',
  separar: 'Separate stages',
  etapas: 'Stages',
  gestosPiezas:
    'Drag to turn · wheel or pinch to zoom · click a stage to open it',
};

type Carga =
  | { estado: 'nada' }
  | { estado: 'cargando'; id: string; fraccion: number }
  | { estado: 'listo'; id: string }
  | { estado: 'error'; id: string };

/**
 * Panel con modelos reales de la NASA: la lista con el tamaño de cada descarga y un visor que carga three.js y el modelo bajo demanda.
 * @param alCerrar vuelve al cohete genérico
 */
export function VisorModelos({ alCerrar }: { alCerrar: () => void }) {
  const t = textos({ es: ES, en: EN });
  const lienzo = useRef<HTMLDivElement>(null);
  const visor = useRef<Promise<ControlVisor | null> | null>(null);
  const [carga, setCarga] = useState<Carga>({ estado: 'nada' });
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

  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') abrir(null);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierta, abrir]);

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

  const ver = async (m: ModeloNasa) => {
    if (!visor.current) return;
    setCarga({ estado: 'cargando', id: m.id, fraccion: 0 });
    setAbierta(null);
    setSeparado(false);
    try {
      const control = await visor.current;
      if (!control) return;
      await control.cargar(
        `${import.meta.env.BASE_URL}modelos/${m.archivo}`,
        (fraccion) => setCarga({ estado: 'cargando', id: m.id, fraccion }),
        m.piezas?.map((p) => p.id),
      );
      setCarga({ estado: 'listo', id: m.id });
    } catch {
      setCarga({ estado: 'error', id: m.id });
    }
  };

  const separar = () => {
    setSeparado(!separado);
    void visor.current?.then((c) => c?.separar(!separado));
  };

  const ocupado = carga.estado === 'cargando';

  return (
    <section className="cohete-modelos" aria-labelledby="t-modelos">
      <div className="cohete-modelos-lista">
        <h3 id="t-modelos">{t.titulo}</h3>
        <p className="cohete-intro">{t.intro}</p>
        <ul>
          {MODELOS_NASA.map((m) => {
            const activo = 'id' in carga && carga.id === m.id;
            return (
              <li key={m.id} data-activo={activo || undefined}>
                <strong>{textos(m.nombre)}</strong>
                <p>{textos(m.descripcion)}</p>
                <small>
                  {t.credito}: {m.credito} ·{' '}
                  <a href={m.pagina} target="_blank" rel="noreferrer">
                    {t.fuente}
                  </a>
                </small>
                <button
                  type="button"
                  className="cohete-boton"
                  disabled={ocupado}
                  onClick={() => ver(m)}
                >
                  {activo && carga.estado === 'cargando'
                    ? t.cargando(Math.round(carga.fraccion * 100))
                    : t.ver(tamanoLegible(m.bytes, idioma()))}
                </button>
                {activo && actual?.piezas && (
                  <div className="cohete-modelos-etapas">
                    <span>{t.etapas}</span>
                    {actual.piezas.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="cohete-chip"
                        aria-pressed={abierta === p.id}
                        onClick={() => abrir(abierta === p.id ? null : p.id)}
                      >
                        {textos(p.nombre)}
                      </button>
                    ))}
                  </div>
                )}
                {activo && carga.estado === 'error' && (
                  <p className="cohete-modelos-error" role="alert">
                    {t.error}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
        <button type="button" className="cohete-boton" onClick={alCerrar}>
          ← {t.cerrar}
        </button>
      </div>
      <div className="cohete-modelos-visor">
        <div
          className="cohete-modelos-lienzo"
          ref={lienzo}
          role="img"
          aria-label={t.titulo}
        />
        {carga.estado === 'nada' && (
          <p className="cohete-modelos-aviso">{t.vacio}</p>
        )}
        {carga.estado === 'listo' && (
          <p className="cohete-modelos-gestos">
            {actual?.piezas ? t.gestosPiezas : t.gestos}
          </p>
        )}
        {actual?.piezas && (
          <button
            type="button"
            className="cohete-boton cohete-modelos-separar"
            aria-pressed={separado}
            onClick={separar}
          >
            {t.separar}
          </button>
        )}
        {actual && pieza && (
          <FichaPieza
            pieza={pieza}
            modelo={textos(actual.nombre)}
            fuentes={actual.fuentes ?? []}
            alVolver={() => abrir(null)}
          />
        )}
      </div>
    </section>
  );
}
