import { useJsonPublico } from '../../estado/datos';
import { distanciaKm, segundosLuz } from '../../servicios/astro/distancias';
import { cuerpoDe, type FichaCuerpo } from './datosExplorar';
import { textoDistancia, textoLuz, textoTamano } from './textosExplorar';
import '../../componentes/TarjetaPlaneta/TarjetaPlaneta.css';

/** Fichas del Sol, la Luna y los planetas, con la distancia a la Tierra calculada para ahora. */
export function Fichas({ fecha }: { fecha: Date }) {
  const datos = useJsonPublico<{ cuerpos: FichaCuerpo[] }>('planetas.json');
  if (datos === 'error') {
    return <p className="panel aviso">No se pudieron cargar las fichas.</p>;
  }
  if (!datos) return <p className="aviso">Cargando fichas…</p>;
  return (
    <div className="fichas">
      {datos.cuerpos.map((c) => {
        const km = distanciaKm(cuerpoDe(c.clave), fecha);
        return (
          <article key={c.clave} className="ficha panel">
            <div className="ficha-cabecera">
              <div className="ficha-esfera" aria-hidden="true">
                <div className={`esfera esfera-${c.clave}`}>
                  {c.clave === 'saturno' && <div className="anillo" />}
                </div>
              </div>
              <div>
                <h3>{c.nombre}</h3>
                <p className="ficha-tipo">{c.tipo}</p>
              </div>
            </div>
            <div>
              <dl>
                <div>
                  <dt>Distancia ahora</dt>
                  <dd>{textoDistancia(km)}</dd>
                </div>
                <div>
                  <dt>Su luz tarda</dt>
                  <dd>{textoLuz(segundosLuz(km))}</dd>
                </div>
                <div>
                  <dt>Tamaño</dt>
                  <dd>{textoTamano(c.diametroKm)}</dd>
                </div>
                <div>
                  <dt>Un día</dt>
                  <dd>{c.dia}</dd>
                </div>
                <div>
                  <dt>Un año</dt>
                  <dd>{c.anio}</dd>
                </div>
                <div>
                  <dt>Lunas</dt>
                  <dd>{c.lunas}</dd>
                </div>
              </dl>
              <p className="ficha-dato">{c.dato}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
