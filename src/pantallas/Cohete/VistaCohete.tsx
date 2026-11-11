import { useCallback, useMemo, useState } from 'react';
import type { ControlCohete } from '../../3d/cohete/escenaCohete';
import { useJsonPublico } from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import {
  ARCHIVO_CATALOGO,
  type CatalogoCohete,
  type ComponenteCohete,
} from './catalogo';
import { EscenaCohete } from './EscenaCohete';

const ES = {
  titulo: 'Cohete',
  intro:
    'Un cohete genérico de dos etapas. Gíralo, acércate y toca una pieza para ver qué es.',
  gestos:
    'Arrastra para girar · rueda o pellizco para acercar · clic derecho o Mayús + arrastre para subir y bajar · clic para elegir',
  general: 'Vista general',
  componentes: 'Componentes',
  interior: 'interior',
  material: 'material',
  error: 'No se pudo cargar la lista de componentes.',
};

const EN: typeof ES = {
  titulo: 'Rocket',
  intro:
    'A generic two-stage rocket. Turn it, zoom in and click a piece to see what it is.',
  gestos:
    'Drag to turn · wheel or pinch to zoom · right-click or Shift + drag to move up and down · click to pick',
  general: 'Overview',
  componentes: 'Components',
  interior: 'inside',
  material: 'material',
  error: 'Could not load the list of components.',
};

/** Vista de escritorio de la sección Cohete: el cohete 3D y la lista de sus componentes. */
export function VistaCohete() {
  const t = textos({ es: ES, en: EN });
  const catalogo = useJsonPublico<CatalogoCohete>(ARCHIVO_CATALOGO);
  const [control, setControl] = useState<ControlCohete | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);

  const porId = useMemo(() => {
    const m = new Map<string, ComponenteCohete>();
    if (catalogo && catalogo !== 'error')
      catalogo.componentes.forEach((c) => m.set(c.id, c));
    return m;
  }, [catalogo]);

  const nombre = useCallback(
    (id: string) => {
      const c = porId.get(id);
      return c ? textos(c.nombre) : id;
    },
    [porId],
  );

  const elegir = (id: string | null) => {
    setElegida(id);
    control?.elegir(id);
  };

  const componente = elegida ? porId.get(elegida) : undefined;

  return (
    <section className="cohete" aria-labelledby="t-cohete">
      <div className="cohete-cabeza">
        <div>
          <h2 id="t-cohete" className="cohete-titulo">
            {t.titulo}
          </h2>
          <p className="cohete-intro">{t.intro}</p>
        </div>
        <div className="cohete-herramientas">
          <button
            type="button"
            className="cohete-boton"
            onClick={() => control?.vistaGeneral()}
          >
            {t.general}
          </button>
        </div>
      </div>

      <div className="cohete-marco">
        <EscenaCohete
          nombre={nombre}
          alElegir={setElegida}
          alListo={setControl}
        />
        {componente && (
          <div className="cohete-elegida" aria-live="polite">
            <strong>{textos(componente.nombre)}</strong>
            <span>{textos(componente.resumen)}</span>
          </div>
        )}
      </div>
      <p className="cohete-gestos">{t.gestos}</p>

      {catalogo === 'error' && <p>{t.error}</p>}
      {catalogo && catalogo !== 'error' && (
        <>
          <h3 className="cohete-subtitulo">{t.componentes}</h3>
          <div className="cohete-zonas">
            {catalogo.zonas.map((zona) => (
              <section key={zona.id} className="cohete-zona">
                <h4>{textos(zona.nombre)}</h4>
                <ol>
                  {catalogo.componentes
                    .filter((c) => c.zona === zona.id)
                    .map((c) => (
                      <li key={c.id} value={c.recorrido}>
                        <button
                          type="button"
                          className="cohete-item"
                          aria-pressed={elegida === c.id}
                          disabled={c.tipo === 'material'}
                          onClick={() => elegir(elegida === c.id ? null : c.id)}
                        >
                          {textos(c.nombre)}
                        </button>
                        {c.interior && (
                          <span className="cohete-etiqueta">{t.interior}</span>
                        )}
                        {c.tipo === 'material' && (
                          <span className="cohete-etiqueta">{t.material}</span>
                        )}
                        <small>{textos(c.resumen)}</small>
                      </li>
                    ))}
                </ol>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
