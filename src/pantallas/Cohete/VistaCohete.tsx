import { useJsonPublico } from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import { ARCHIVO_CATALOGO, type CatalogoCohete } from './catalogo';

const ES = {
  titulo: 'Cohete',
  intro:
    'Un cohete genérico de dos etapas que se gira, se recorre con el scroll y se desarma pieza a pieza.',
  pronto: (n: number) =>
    `El modelo 3D está en construcción. Por ahora, sus ${n} componentes:`,
  interior: 'interior',
  error: 'No se pudo cargar la lista de componentes.',
};

const EN: typeof ES = {
  titulo: 'Rocket',
  intro:
    'A generic two-stage rocket you can turn, scroll through and take apart piece by piece.',
  pronto: (n) =>
    `The 3D model is under construction. For now, here are its ${n} components:`,
  interior: 'inside',
  error: 'Could not load the list of components.',
};

/** Vista de escritorio de la sección Cohete; por ahora, la lista de componentes por zona. */
export function VistaCohete() {
  const t = textos({ es: ES, en: EN });
  const catalogo = useJsonPublico<CatalogoCohete>(ARCHIVO_CATALOGO);

  return (
    <section className="cohete" aria-labelledby="t-cohete">
      <h2 id="t-cohete" className="cohete-titulo">
        {t.titulo}
      </h2>
      <p className="cohete-intro">{t.intro}</p>
      {catalogo === 'error' && <p>{t.error}</p>}
      {catalogo && catalogo !== 'error' && (
        <>
          <p className="cohete-intro">
            {t.pronto(catalogo.componentes.length)}
          </p>
          <div className="cohete-zonas">
            {catalogo.zonas.map((zona) => (
              <section key={zona.id} className="cohete-zona">
                <h3>{textos(zona.nombre)}</h3>
                <ol>
                  {catalogo.componentes
                    .filter((c) => c.zona === zona.id)
                    .map((c) => (
                      <li key={c.id} value={c.recorrido}>
                        <span>{textos(c.nombre)}</span>
                        {c.interior && (
                          <span className="cohete-etiqueta">{t.interior}</span>
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
