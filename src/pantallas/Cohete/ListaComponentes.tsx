import { textos } from '../../idioma/idioma';
import type { ComponenteCohete, ZonaCohete } from './catalogo';
import { ContenidoFicha, LineaZona } from './Ficha';

const ES = {
  titulo: 'Componentes',
  intro:
    'Las 30 fichas también se leen aquí, sin 3D. Abre un componente para ver su ficha completa.',
  ver3d: 'Ver en el cohete 3D',
};

const EN: typeof ES = {
  titulo: 'Components',
  intro:
    'All 30 cards can also be read here, without 3D. Open a component to see its full card.',
  ver3d: 'Show on the 3D rocket',
};

/**
 * Lista de componentes por zona, con cada ficha desplegable: la alternativa sin 3D para lectores de pantalla y teclado.
 * @param puedeVer3D si la escena está lista y libre para sacar una pieza
 * @param alVer3D saca la pieza en el cohete 3D
 */
export function ListaComponentes({
  zonas,
  componentes,
  abierta,
  puedeVer3D,
  alVer3D,
}: {
  zonas: ZonaCohete[];
  componentes: ComponenteCohete[];
  abierta: string | null;
  puedeVer3D: boolean;
  alVer3D: (c: ComponenteCohete) => void;
}) {
  const t = textos({ es: ES, en: EN });

  return (
    <section
      className="cohete-lista"
      id="lista-cohete"
      aria-labelledby="t-lista-cohete"
      tabIndex={-1}
    >
      <h3 id="t-lista-cohete" className="cohete-subtitulo">
        {t.titulo}
      </h3>
      <p className="cohete-intro">{t.intro}</p>
      <div className="cohete-zonas">
        {zonas.map((zona) => (
          <section key={zona.id} className="cohete-zona">
            <h4>{textos(zona.nombre)}</h4>
            {componentes
              .filter((c) => c.zona === zona.id)
              .map((c) => (
                <details
                  key={c.id}
                  className="cohete-detalle"
                  data-abierta={abierta === c.id || undefined}
                >
                  <summary>
                    <LineaZona componente={c} zona="" />
                    <strong>{textos(c.nombre)}</strong>
                    <small>{textos(c.resumen)}</small>
                  </summary>
                  <div className="cohete-detalle-cuerpo">
                    <ContenidoFicha componente={c} Titulo="h5" />
                    <button
                      type="button"
                      className="cohete-boton"
                      disabled={!puedeVer3D}
                      onClick={() => alVer3D(c)}
                    >
                      {t.ver3d}
                    </button>
                  </div>
                </details>
              ))}
          </section>
        ))}
      </div>
    </section>
  );
}
