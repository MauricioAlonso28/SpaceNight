import { useState } from 'react';
import type { Astro } from '../../3d/escenaAstro';
import { Astro3D } from '../../componentes/Astro3D/Astro3D';
import { Retrato } from '../../componentes/Retrato/Retrato';
import { useJsonPublico } from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import { distanciaKm, segundosLuz } from '../../servicios/astro/distancias';
import { cuerpoDe, type FichaCuerpo } from './datosExplorar';
import { textoDistancia, textoLuz, textoTamano } from './textosExplorar';

const ES = {
  error: 'No se pudieron cargar las fichas.',
  cargando: 'Cargando fichas…',
  cuerpos: 'Cuerpos del sistema solar',
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
  cuerpos: 'Bodies of the solar system',
  distancia: 'Distance now',
  luz: 'Its light takes',
  tamano: 'Size',
  dia: 'A day',
  anio: 'A year',
  lunas: 'Moons',
};

/** Lado de cada imagen en la fila de cuerpos: más grande cuanto mayor es, sin llegar a la escala real. */
const TAMANO_SELECTOR: Partial<Record<Astro, number>> = {
  sol: 64,
  luna: 32,
  mercurio: 30,
  venus: 40,
  marte: 36,
  jupiter: 56,
  saturno: 52,
};

/** Fichas del Sol, la Luna y los planetas: una fila para elegir y una sola ficha grande con el cuerpo en 3D y la distancia calculada para ahora. */
export function Fichas({ fecha }: { fecha: Date }) {
  const t = textos({ es: ES, en: EN });
  const datos = useJsonPublico<{ cuerpos: FichaCuerpo[] }>('planetas.json');
  const [elegido, setElegido] = useState<Astro>('jupiter');
  if (datos === 'error') return <p className="aviso">{t.error}</p>;
  if (!datos) return <p className="aviso">{t.cargando}</p>;

  const cuerpos = datos.cuerpos.map((cuerpo) =>
    textos({ es: cuerpo, en: { ...cuerpo, ...cuerpo.en } }),
  );
  const c = cuerpos.find((x) => x.clave === elegido) ?? cuerpos[0];
  const km = distanciaKm(cuerpoDe(c.clave), fecha);
  const filas: [string, string][] = [
    [t.distancia, textoDistancia(km)],
    [t.luz, textoLuz(segundosLuz(km))],
    [t.tamano, textoTamano(c.diametroKm)],
    [t.dia, c.dia],
    [t.anio, c.anio],
    [t.lunas, c.lunas],
  ];

  return (
    <div className="atlas">
      <div className="atlas-selector" role="tablist" aria-label={t.cuerpos}>
        {cuerpos.map((x) => (
          <button
            key={x.clave}
            type="button"
            role="tab"
            aria-selected={x.clave === c.clave}
            aria-controls="atlas-ficha"
            className="atlas-cuerpo"
            onClick={() => setElegido(x.clave as Astro)}
          >
            <Retrato
              astro={x.clave as Astro}
              tamano={TAMANO_SELECTOR[x.clave as Astro] ?? 40}
            />
            <span>{x.nombre}</span>
          </button>
        ))}
      </div>
      <article
        className="atlas-ficha"
        id="atlas-ficha"
        role="tabpanel"
        aria-labelledby="atlas-nombre"
      >
        <div className="atlas-3d">
          <Astro3D astro={c.clave as Astro} nombre={c.nombre} />
        </div>
        <div className="atlas-texto">
          <p className="atlas-tipo">{c.tipo}</p>
          <h3 id="atlas-nombre">{c.nombre}</h3>
          <p className="atlas-dato">{c.dato}</p>
          <dl>
            {filas.map(([nombre, valor]) => (
              <div key={nombre}>
                <dt>{nombre}</dt>
                <dd>{valor}</dd>
              </div>
            ))}
          </dl>
        </div>
      </article>
    </div>
  );
}
