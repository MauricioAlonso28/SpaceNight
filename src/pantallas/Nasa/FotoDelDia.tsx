import { useState } from 'react';
import { idioma, textos } from '../../idioma/idioma';
import { useApod } from '../../servicios/nasa/datos';

const ES = {
  rotulo: 'Foto astronómica del día',
  leer: 'Leer la explicación',
  ocultar: 'Ocultar',
  credito: 'Crédito',
  ver: 'Ver en APOD',
  video: 'Ver el video',
};

const EN: typeof ES = {
  rotulo: 'Astronomy picture of the day',
  leer: 'Read the explanation',
  ocultar: 'Hide',
  credito: 'Credit',
  ver: 'See on APOD',
  video: 'Watch the video',
};

/** Página de APOD de una fecha («2026-11-11» → apod.nasa.gov/apod/ap261111.html). */
const paginaApod = (fecha: string) =>
  `https://apod.nasa.gov/apod/ap${fecha.slice(2, 4)}${fecha.slice(5, 7)}${fecha.slice(8, 10)}.html`;

/** La foto astronómica del día de la NASA sobre el archivo; no ocupa nada si hoy no se pudo descargar. */
export function FotoDelDia() {
  const t = textos({ es: ES, en: EN });
  const datos = useApod();
  const [abierta, setAbierta] = useState(false);
  if (!datos || datos === 'error') return null;
  const esVideo = datos.tipo === 'video';
  const imagen = esVideo ? datos.miniatura : datos.url;
  const fecha = new Intl.DateTimeFormat(idioma() === 'es' ? 'es-PE' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(Date.parse(`${datos.fecha}T12:00:00Z`));

  return (
    <article className="apod" aria-labelledby="t-apod">
      {imagen && (
        <a
          className="apod-imagen"
          href={esVideo ? datos.url : (datos.hd ?? datos.url)}
          target="_blank"
          rel="noreferrer"
        >
          <img src={imagen} alt={datos.titulo} />
          {esVideo && <span className="apod-play">▶ {t.video}</span>}
        </a>
      )}
      <div className="apod-texto">
        <p className="nasa-rotulo">
          {t.rotulo} · {fecha}
        </p>
        <h3 id="t-apod">{datos.titulo}</h3>
        {datos.credito && (
          <p className="apod-credito">
            {t.credito}: {datos.credito}
          </p>
        )}
        <p className={`apod-explicacion${abierta ? ' abierta' : ''}`}>
          {datos.texto}
        </p>
        <div className="nasa-chips">
          <button
            type="button"
            className="nasa-chip"
            onClick={() => setAbierta(!abierta)}
          >
            {abierta ? t.ocultar : t.leer}
          </button>
          <a
            className="nasa-enlace"
            href={paginaApod(datos.fecha)}
            target="_blank"
            rel="noreferrer"
          >
            {t.ver} ↗
          </a>
        </div>
      </div>
    </article>
  );
}
