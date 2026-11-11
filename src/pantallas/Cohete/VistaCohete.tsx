import { useCallback, useMemo, useState } from 'react';
import type {
  ControlCohete,
  PasoRecorrido,
} from '../../3d/cohete/escenaCohete';
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

const ES = {
  titulo: 'Cohete',
  intro:
    'Un cohete genérico de dos etapas. Gíralo, acércate y toca una pieza para ver qué es.',
  gestos:
    'Arrastra para girar · rueda o pellizco para acercar · clic derecho o Mayús + arrastre para subir y bajar · clic para elegir',
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
    'A generic two-stage rocket. Turn it, zoom in and click a piece to see what it is.',
  gestos:
    'Drag to turn · wheel or pinch to zoom · right-click or Shift + drag to move up and down · click to pick',
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

type Modo = 'general' | 'recorrido';

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

/** Vista de escritorio de la sección Cohete: el cohete 3D, el recorrido y la lista de componentes. */
export function VistaCohete() {
  const t = textos({ es: ES, en: EN });
  const catalogo = useJsonPublico<CatalogoCohete>(ARCHIVO_CATALOGO);
  const [control, setControl] = useState<ControlCohete | null>(null);
  const [elegida, setElegida] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>('general');
  const [corte, setCorte] = useState(false);
  const [activo, setActivo] = useState(0);

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

  const elegir = (id: string | null) => {
    setElegida(id);
    control?.elegir(id);
  };

  const empezarRecorrido = () => {
    if (!control || !ordenados.length) return;
    setElegida(null);
    setActivo(0);
    setModo('recorrido');
    control.iniciarRecorrido(ordenados.map(pasoDe));
  };

  const terminarRecorrido = () => {
    setModo('general');
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
            onClick={() =>
              modo === 'recorrido'
                ? terminarRecorrido()
                : control?.vistaGeneral()
            }
          >
            {t.general}
          </button>
          <button
            type="button"
            className="cohete-boton"
            aria-pressed={modo === 'recorrido'}
            disabled={!control || !ordenados.length}
            onClick={() =>
              modo === 'recorrido' ? terminarRecorrido() : empezarRecorrido()
            }
          >
            {t.recorrido}
          </button>
          <button
            type="button"
            className="cohete-boton"
            aria-pressed={corte}
            disabled={!control || modo === 'recorrido'}
            title={modo === 'recorrido' ? t.corteAuto : undefined}
            onClick={cambiarCorte}
          >
            {t.corte}
          </button>
        </div>
      </div>

      <div
        className={`cohete-marco${modo === 'recorrido' ? ' con-carril' : ''}`}
      >
        <div className="cohete-lienzo">
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
        {modo === 'recorrido' && datos && (
          <Carril
            componentes={ordenados}
            zonas={datos.zonas}
            activo={activo}
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
            {datos.zonas.map((zona) => (
              <section key={zona.id} className="cohete-zona">
                <h4>{textos(zona.nombre)}</h4>
                <ol>
                  {ordenados
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
