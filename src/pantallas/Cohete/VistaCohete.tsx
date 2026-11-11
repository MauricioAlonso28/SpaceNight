import { useCallback, useMemo, useRef, useState } from 'react';
import type {
  ControlCohete,
  PasoRecorrido,
} from '../../3d/cohete/escenaCohete';
import type { Estado } from '../../3d/cohete/estados';
import { useJsonPublico } from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import { Carril } from './Carril';
import {
  ARCHIVO_CATALOGO,
  enOrdenDeRecorrido,
  type CatalogoCohete,
  type ComponenteCohete,
} from './catalogo';
import { EscenaCohete } from './EscenaCohete';
import { Ficha } from './Ficha';

const ES = {
  titulo: 'Cohete',
  intro:
    'Un cohete genérico de dos etapas. Gíralo, acércate y toca una pieza para sacarla y ver para qué sirve.',
  gestos:
    'Arrastra para girar · rueda o pellizco para acercar · clic derecho o Mayús + arrastre para subir y bajar · clic para sacar una pieza',
  general: 'Vista general',
  recorrido: 'Recorrido',
  corte: 'Vista de corte',
  corteAuto:
    'En el recorrido el corte se activa solo en las piezas interiores.',
  componentes: 'Componentes',
  interior: 'interior',
  material: 'material',
  error: 'No se pudo cargar la lista de componentes.',
};

const EN: typeof ES = {
  titulo: 'Rocket',
  intro:
    'A generic two-stage rocket. Turn it, zoom in and click a piece to take it out and see what it does.',
  gestos:
    'Drag to turn · wheel or pinch to zoom · right-click or Shift + drag to move up and down · click to take a piece out',
  general: 'Overview',
  recorrido: 'Tour',
  corte: 'Cutaway view',
  corteAuto:
    'During the tour the cutaway turns on by itself for inside pieces.',
  componentes: 'Components',
  interior: 'inside',
  material: 'material',
  error: 'Could not load the list of components.',
};

/** Paso de la escena para un componente: encuadra la pieza, o el cohete entero si es un material. */
function pasoDe(c: ComponenteCohete): PasoRecorrido {
  const pieza = c.tipo === 'pieza';
  return {
    nombre: textos(c.nombre),
    interior: c.interior,
    foco: pieza ? c.id : null,
    resalta: pieza ? [c.id] : (c.usadoEn ?? []),
  };
}

/** Vista de escritorio de la sección Cohete: el cohete 3D, el recorrido, el despiece y la lista de componentes. */
export function VistaCohete() {
  const t = textos({ es: ES, en: EN });
  const catalogo = useJsonPublico<CatalogoCohete>(ARCHIVO_CATALOGO);
  const [control, setControl] = useState<ControlCohete | null>(null);
  const [estado, setEstado] = useState<Estado>('general');
  const [abierta, setAbierta] = useState<string | null>(null);
  const [enRecorrido, setEnRecorrido] = useState(false);
  const [corte, setCorte] = useState(false);
  const [activo, setActivo] = useState(0);
  const lienzo = useRef<HTMLDivElement>(null);

  const datos = catalogo && catalogo !== 'error' ? catalogo : null;
  const ordenados = useMemo(
    () => (datos ? enOrdenDeRecorrido(datos.componentes) : []),
    [datos],
  );
  const porId = useMemo(
    () => new Map(ordenados.map((c) => [c.id, c])),
    [ordenados],
  );

  const nombre = useCallback(
    (id: string) => {
      const c = porId.get(id);
      return c ? textos(c.nombre) : id;
    },
    [porId],
  );
  const interior = useCallback(
    (id: string) => porId.get(id)?.interior ?? false,
    [porId],
  );
  const alCambiar = useCallback((nuevo: Estado, id: string | null) => {
    setEstado(nuevo);
    if (nuevo === 'pieza') setAbierta(id);
    if (nuevo === 'general' || nuevo === 'recorrido' || nuevo === 'volviendo')
      setAbierta(null);
  }, []);

  const libre = estado === 'general' || estado === 'recorrido';

  const abrir = (c: ComponenteCohete) => {
    if (!libre) return;
    lienzo.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    control?.abrir(c.id, c.usadoEn);
  };

  const empezarRecorrido = () => {
    if (!control || !ordenados.length) return;
    setActivo(0);
    setEnRecorrido(true);
    control.iniciarRecorrido(ordenados.map(pasoDe));
  };

  const terminarRecorrido = () => {
    setEnRecorrido(false);
    control?.salirRecorrido();
  };

  const alProgreso = (p: number) => {
    control?.irAlPaso(p);
    setActivo(Math.round(Math.min(Math.max(p, 0), ordenados.length - 1)));
  };

  const cambiarCorte = () => {
    setCorte(!corte);
    control?.fijarCorte(!corte);
  };

  const componente = abierta ? porId.get(abierta) : undefined;
  const zona = (id: string) => {
    const z = datos?.zonas.find((zona) => zona.id === id);
    return z ? textos(z.nombre) : id;
  };

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
            disabled={!control || !libre}
            onClick={() =>
              enRecorrido ? terminarRecorrido() : control?.vistaGeneral()
            }
          >
            {t.general}
          </button>
          <button
            type="button"
            className="cohete-boton"
            aria-pressed={enRecorrido}
            disabled={!control || !ordenados.length || !libre}
            onClick={() =>
              enRecorrido ? terminarRecorrido() : empezarRecorrido()
            }
          >
            {t.recorrido}
          </button>
          <button
            type="button"
            className="cohete-boton"
            aria-pressed={corte}
            disabled={!control || enRecorrido || !libre}
            title={enRecorrido ? t.corteAuto : undefined}
            onClick={cambiarCorte}
          >
            {t.corte}
          </button>
        </div>
      </div>

      <div className={`cohete-marco${enRecorrido ? ' con-carril' : ''}`}>
        <div
          className={`cohete-lienzo${componente ? ' con-ficha' : ''}`}
          ref={lienzo}
        >
          <EscenaCohete
            nombre={nombre}
            interior={interior}
            alCambiar={alCambiar}
            alListo={setControl}
          />
          {componente && (
            <Ficha
              componente={componente}
              zona={zona(componente.zona)}
              alVolver={() => control?.volver()}
            />
          )}
        </div>
        {enRecorrido && datos && (
          <Carril
            componentes={ordenados}
            zonas={datos.zonas}
            activo={activo}
            bloqueado={!libre}
            alProgreso={alProgreso}
          />
        )}
      </div>
      <p className="cohete-gestos">{t.gestos}</p>

      {catalogo === 'error' && <p>{t.error}</p>}
      {datos && (
        <>
          <h3 className="cohete-subtitulo">{t.componentes}</h3>
          <div className="cohete-zonas">
            {datos.zonas.map((z) => (
              <section key={z.id} className="cohete-zona">
                <h4>{textos(z.nombre)}</h4>
                <ol>
                  {ordenados
                    .filter((c) => c.zona === z.id)
                    .map((c) => (
                      <li key={c.id} value={c.recorrido}>
                        <button
                          type="button"
                          className="cohete-item"
                          aria-pressed={abierta === c.id}
                          disabled={!control || !libre}
                          onClick={() => abrir(c)}
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
