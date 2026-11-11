import { useJsonPublico } from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import { distanciaKm, segundosLuz } from '../../servicios/astro/distancias';
import { cuerpoDe, type FichaCuerpo } from './datosExplorar';
import { textoDistancia, textoLuz, textoTamano } from './textosExplorar';
import '../../componentes/TarjetaPlaneta/TarjetaPlaneta.css';

const ES = {
  error: 'No se pudieron cargar las fichas.',
  cargando: 'Cargando fichas…',
  distancia: 'Distancia ahora',
  luz: 'Su luz tarda',
  tamano: 'Tamaño',
  dia: 'Un día',
  anio: 'Un año',
  lunas: 'Lunas',
};

const EN: typeof ES = {
  error: 'Could not load the fact sheets.',
  cargando: 'Loading fact sheets…',
  distancia: 'Distance now',
  luz: 'Its light takes',
  tamano: 'Size',
  dia: 'A day',
  anio: 'A year',
  lunas: 'Moons',
};

/** Fichas del Sol, la Luna y los planetas, con la distancia a la Tierra calculada para ahora. */
export function Fichas({ fecha }: { fecha: Date }) {
  const t = textos({ es: ES, en: EN });
  const datos = useJsonPublico<{ cuerpos: FichaCuerpo[] }>('planetas.json');
  if (datos === 'error') {
    return <p className="panel aviso">{t.error}</p>;
  }
  if (!datos) return <p className="aviso">{t.cargando}</p>;
  return (
    <div className="fichas">
      {datos.cuerpos.map((cuerpo) => {
        const c = textos({ es: cuerpo, en: { ...cuerpo, ...cuerpo.en } });
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
                  <dt>{t.distancia}</dt>
                  <dd>{textoDistancia(km)}</dd>
                </div>
                <div>
                  <dt>{t.luz}</dt>
                  <dd>{textoLuz(segundosLuz(km))}</dd>
                </div>
                <div>
                  <dt>{t.tamano}</dt>
                  <dd>{textoTamano(c.diametroKm)}</dd>
                </div>
                <div>
                  <dt>{t.dia}</dt>
                  <dd>{c.dia}</dd>
                </div>
                <div>
                  <dt>{t.anio}</dt>
                  <dd>{c.anio}</dd>
                </div>
                <div>
                  <dt>{t.lunas}</dt>
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
