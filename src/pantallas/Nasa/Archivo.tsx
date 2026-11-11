import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from 'react';
import { idioma, textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import {
  MISIONES,
  imagenDe,
  masFrecuente,
  misionDelDia,
  urlBusqueda,
  type ImagenNasa,
  type RespuestaImagenes,
} from '../../servicios/nasa/imagenes';
import { CabezaNasa, Cifra, SinDatos } from './CabezaNasa';
import { FotoDelDia } from './FotoDelDia';
import './Archivo.css';

const ES = {
  titulo: 'Archivo de imágenes',
  lead: 'Más de 140 000 fotos de la NASA, desde el programa Mercury hasta el telescopio Webb. Busca lo que quieras o empieza por una misión.',
  buscar: 'Buscar en el archivo de la NASA',
  ejemplo: 'nebulosa, eclipse, Saturno, astronauta…',
  ir: 'Buscar',
  misiones: 'Misiones',
  hoy: 'Hoy',
  resultados: 'imágenes encontradas',
  desde: 'la más antigua',
  centro: 'centro con más fotos',
  mas: 'Ver más',
  nada: 'No hay imágenes para esa búsqueda.',
  cerrar: 'Cerrar',
  anterior: 'Anterior',
  siguiente: 'Siguiente',
  original: 'Ver en images.nasa.gov',
  mosaico: (q: string) => `Imágenes de la NASA para «${q}»`,
};

const EN: typeof ES = {
  titulo: 'Image archive',
  lead: 'More than 140,000 NASA photos, from the Mercury program to the Webb telescope. Search anything or start with a mission.',
  buscar: 'Search the NASA archive',
  ejemplo: 'nebula, eclipse, Saturn, astronaut…',
  ir: 'Search',
  misiones: 'Missions',
  hoy: 'Today',
  resultados: 'images found',
  desde: 'the oldest',
  centro: 'centre with the most photos',
  mas: 'Show more',
  nada: 'No images for that search.',
  cerrar: 'Close',
  anterior: 'Previous',
  siguiente: 'Next',
  original: 'See on images.nasa.gov',
  mosaico: (q) => `NASA images for “${q}”`,
};

/** Año de una fecha en ms. */
const anio = (ms: number) => new Date(ms).getUTCFullYear();

/** Visor a pantalla completa de una imagen, con su texto, flechas y Esc para cerrar. */
function Visor({
  imagen,
  alCerrar,
  alMover,
}: {
  imagen: ImagenNasa;
  alCerrar: () => void;
  alMover: (paso: number) => void;
}) {
  const t = textos({ es: ES, en: EN });
  useEffect(() => {
    const teclas = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') alCerrar();
      if (ev.key === 'ArrowRight') alMover(1);
      if (ev.key === 'ArrowLeft') alMover(-1);
    };
    window.addEventListener('keydown', teclas);
    return () => window.removeEventListener('keydown', teclas);
  }, [alCerrar, alMover]);
  const fecha = new Intl.DateTimeFormat(idioma() === 'es' ? 'es-PE' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(imagen.fecha);
  return (
    <div
      className="archivo-visor"
      role="dialog"
      aria-modal="true"
      aria-label={imagen.titulo}
    >
      <button
        type="button"
        className="archivo-velo"
        aria-label={t.cerrar}
        onClick={alCerrar}
      />
      <figure>
        <img src={imagen.grande} alt={imagen.titulo} key={imagen.id} />
        <figcaption>
          <p className="nasa-rotulo">
            {fecha}
            {imagen.centro && ` · ${imagen.centro}`}
          </p>
          <h3>{imagen.titulo}</h3>
          {imagen.descripcion && (
            <p className="archivo-texto">{imagen.descripcion}</p>
          )}
          <a
            className="nasa-enlace"
            href={imagen.pagina}
            target="_blank"
            rel="noreferrer"
          >
            {t.original} ↗
          </a>
        </figcaption>
      </figure>
      <button
        type="button"
        className="archivo-flecha izq"
        aria-label={t.anterior}
        onClick={() => alMover(-1)}
      >
        ‹
      </button>
      <button
        type="button"
        className="archivo-flecha der"
        aria-label={t.siguiente}
        onClick={() => alMover(1)}
      >
        ›
      </button>
      <button
        type="button"
        className="archivo-cerrar"
        aria-label={t.cerrar}
        onClick={alCerrar}
      >
        ×
      </button>
    </div>
  );
}

/** Vista Archivo: buscador con atajos por misión, cifras de la búsqueda, mosaico y visor. */
export function Archivo() {
  const t = textos({ es: ES, en: EN });
  const [peticion, setPeticion] = useState(() => ({ q: misionDelDia(), n: 1 }));
  const [texto, setTexto] = useState('');
  const [paginas, setPaginas] = useState<{
    q: string;
    n: number;
    imagenes: ImagenNasa[];
    total: number;
  } | null>(null);
  const [fallida, setFallida] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<number | null>(null);
  const consulta = peticion.q;
  const clave = `${peticion.q}|${peticion.n}`;
  const error = fallida === clave;
  const cargando =
    !error && (paginas?.q !== peticion.q || paginas.n !== peticion.n);
  const setConsulta = (q: string) => setPeticion({ q, n: 1 });

  useEffect(() => {
    let vigente = true;
    const { q, n } = peticion;
    fetch(urlBusqueda(q, n))
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP_${r.status}`);
        return r.json() as Promise<RespuestaImagenes>;
      })
      .then((j) => {
        if (!vigente) return;
        const nuevas = j.collection.items
          .map(imagenDe)
          .filter((i): i is ImagenNasa => i !== null);
        setPaginas((p) => ({
          q,
          n,
          total: j.collection.metadata.total_hits,
          imagenes:
            n === 1 || !p || p.q !== q ? nuevas : [...p.imagenes, ...nuevas],
        }));
      })
      .catch(() => vigente && setFallida(`${q}|${n}`));
    return () => {
      vigente = false;
    };
  }, [peticion]);

  const imagenes = useMemo(() => paginas?.imagenes ?? [], [paginas]);
  const buscar = (ev: FormEvent) => {
    ev.preventDefault();
    if (texto.trim()) setConsulta(texto.trim());
  };
  const mover = (paso: number) =>
    setAbierta((i) =>
      i === null ? null : (i + paso + imagenes.length) % imagenes.length,
    );

  const antigua = imagenes.length
    ? Math.min(...imagenes.map((i) => i.fecha))
    : null;
  const centro = masFrecuente(imagenes.map((i) => i.centro));
  const nombreMision = (q: string) => MISIONES.find((m) => m.q === q);

  return (
    <section className="nasa archivo" aria-labelledby="t-archivo">
      <CabezaNasa
        id="t-archivo"
        titulo={t.titulo}
        lead={t.lead}
        fuentes={[
          {
            nombre: 'NASA Image and Video Library',
            url: 'https://images.nasa.gov/',
          },
        ]}
      />
      <FotoDelDia />
      <form className="archivo-buscar" role="search" onSubmit={buscar}>
        <label htmlFor="archivo-q" className="oculto">
          {t.buscar}
        </label>
        <input
          id="archivo-q"
          type="search"
          placeholder={t.ejemplo}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button type="submit" className="boton">
          {t.ir}
        </button>
      </form>
      <div
        className="nasa-chips archivo-misiones"
        role="group"
        aria-label={t.misiones}
      >
        {MISIONES.map((m) => (
          <button
            key={m.q}
            type="button"
            className="nasa-chip"
            aria-pressed={consulta === m.q}
            onClick={() => setConsulta(m.q)}
          >
            {m.q === misionDelDia() && (
              <i style={{ background: 'var(--acento)' }} />
            )}
            {textos(m.nombre)}
          </button>
        ))}
      </div>

      {paginas && paginas.q === consulta && (
        <dl className="nasa-cifras">
          <Cifra
            valor={paginas.total}
            etiqueta={`${t.resultados} · ${textos(nombreMision(consulta)?.nombre ?? { es: consulta, en: consulta })}`}
          />
          {antigua !== null && (
            <Cifra valor={anio(antigua)} etiqueta={t.desde} anio />
          )}
          {centro && (
            <div className="nasa-cifra">
              <dd>{centro}</dd>
              <dt>{t.centro}</dt>
            </div>
          )}
        </dl>
      )}

      {error && !imagenes.length && <SinDatos error />}
      {!error && paginas?.q === consulta && !imagenes.length && (
        <p className="aviso">{t.nada}</p>
      )}
      {!paginas && !error && <SinDatos error={false} />}

      <ul className="archivo-mosaico" aria-label={t.mosaico(consulta)}>
        {imagenes.map((img, i) => (
          <li
            key={img.id + i}
            style={
              {
                '--proporcion': `${img.ancho} / ${img.alto}`,
                '--retraso': `${(i % 36) * 30}ms`,
              } as CSSProperties
            }
          >
            <button type="button" onClick={() => setAbierta(i)}>
              <img src={img.mosaico} alt={img.titulo} loading="lazy" />
              <span>
                <strong>{img.titulo}</strong>
                <small>{anio(img.fecha)}</small>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {paginas && paginas.q === consulta && imagenes.length < paginas.total && (
        <button
          type="button"
          className="boton archivo-mas"
          disabled={cargando}
          onClick={() => setPeticion({ q: consulta, n: paginas.n + 1 })}
        >
          {cargando
            ? '…'
            : `${t.mas} · ${formatearNumero(paginas.total - imagenes.length)}`}
        </button>
      )}
      {abierta !== null && imagenes[abierta] && (
        <Visor
          imagen={imagenes[abierta]}
          alCerrar={() => setAbierta(null)}
          alMover={mover}
        />
      )}
    </section>
  );
}
