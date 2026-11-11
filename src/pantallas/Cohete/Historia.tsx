import { useState } from 'react';
import { Link } from 'react-router';
import { textos } from '../../idioma/idioma';
import { HITOS } from '../../servicios/cohete/historia';
import { CabezaNasa } from '../Nasa/CabezaNasa';
import './Historia.css';

const ES = {
  kicker: 'Cohete',
  titulo: 'Historia del cohete',
  lead: 'De las flechas de fuego a los cohetes que vuelven a su torre, con un peruano entre los pioneros.',
  pionero: 'Un peruano entre los pioneros',
  vida: 'Tiabaya, Arequipa, 1874 · Buenos Aires, 1945',
  ruta: ['Arequipa', 'París', 'Lima', 'Buenos Aires'],
  hechos: [
    'Estudió en París, donde, según contó, entre 1895 y 1897 probó un motor que quemaba peróxido de nitrógeno con un combustible líquido: un cohete de combustible líquido.',
    'Su motor no ardía de forma continua sino en pulsos, encendido por chispas, muchas veces por minuto.',
    'También imaginó un avión cohete, al que llamó «avión torpedo».',
    'Su rostro está en el billete de 100 soles, y el primer cohete sonda de la agencia espacial peruana lleva su nombre.',
  ],
  debate:
    'No quedaron registros de sus pruebas de la época: se conocen por su carta de 1927. Por eso unos lo consideran el primero y otros piden cautela.',
  motor: 'Motor de pulsos de Paulet, idealizado',
  linea: 'Línea de tiempo',
  todos: 'Todos los hitos',
  peru: 'Solo Perú',
  ver: 'Verlo en la app',
  tagPeru: 'Perú',
};

const EN: typeof ES = {
  kicker: 'Rocket',
  titulo: 'Rocket history',
  lead: 'From fire arrows to rockets that fly back to their tower, with a Peruvian among the pioneers.',
  pionero: 'A Peruvian among the pioneers',
  vida: 'Tiabaya, Arequipa, 1874 · Buenos Aires, 1945',
  ruta: ['Arequipa', 'Paris', 'Lima', 'Buenos Aires'],
  hechos: [
    'He studied in Paris where, by his account, between 1895 and 1897 he tested an engine burning nitrogen peroxide with a liquid fuel: a liquid-fuel rocket.',
    'His engine did not burn continuously but in pulses, lit by sparks, many times a minute.',
    'He also imagined a rocket plane, which he called the "torpedo plane".',
    'His face is on the 100-sol banknote, and the Peruvian space agency’s first sounding rocket bears his name.',
  ],
  debate:
    'No records of his tests survive from the time: they are known from his 1927 letter. So some consider him the first and others urge caution.',
  motor: 'Paulet’s pulse engine, idealized',
  linea: 'Timeline',
  todos: 'All milestones',
  peru: 'Peru only',
  ver: 'See it in the app',
  tagPeru: 'Peru',
};

/** Dibujo idealizado del motor de pulsos: cámara cónica, dos entradas de propelente y una llama que late. */
function MotorPulsos() {
  const t = textos({ es: ES, en: EN });
  return (
    <svg
      className="paulet-motor"
      viewBox="0 0 200 260"
      role="img"
      aria-label={t.motor}
    >
      <path d="M40 30 H160" className="paulet-tubo f" />
      <path d="M100 30 V58" className="paulet-tubo f" />
      <path d="M30 70 H70" className="paulet-tubo o" />
      <path d="M130 70 H170" className="paulet-tubo o" />
      <path
        d="M70 58 H130 L118 150 Q100 160 82 150 Z"
        className="paulet-camara"
      />
      <circle cx="100" cy="100" r="5" className="paulet-chispa" />
      <path d="M86 156 Q100 250 114 156 Z" className="paulet-llama" />
      <text x="40" y="22">
        F
      </text>
      <text x="160" y="62" textAnchor="end">
        N₂O₄
      </text>
    </svg>
  );
}

/** Vista Historia: Pedro Paulet en primer plano y la línea de tiempo, que se puede dejar solo con los hitos de Perú. */
export function Historia() {
  const t = textos({ es: ES, en: EN });
  const [soloPeru, setSoloPeru] = useState(false);
  const hitos = HITOS.filter((h) => !soloPeru || h.peru);

  return (
    <section className="nasa historia" aria-labelledby="t-historia">
      <CabezaNasa
        id="t-historia"
        kicker={t.kicker}
        titulo={t.titulo}
        lead={t.lead}
        vivo={false}
        fuentes={[
          { nombre: 'NASA History', url: 'https://www.nasa.gov/history/' },
          { nombre: 'CONIDA', url: 'https://www.gob.pe/conida' },
          {
            nombre: 'BCRP',
            url: 'https://www.bcrp.gob.pe/en/banknotes-and-coins/family-of-banknotes/s-100-bill.html',
          },
        ]}
      />

      <article className="paulet" aria-labelledby="t-paulet">
        <div className="paulet-nombre">
          <p className="nasa-rotulo">{t.pionero}</p>
          <h3 id="t-paulet">
            Pedro <span>Paulet</span>
          </h3>
          <p className="paulet-vida">{t.vida}</p>
          <ol className="paulet-ruta">
            {t.ruta.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ol>
        </div>
        <ul className="paulet-hechos">
          {t.hechos.map((h) => (
            <li key={h}>{h}</li>
          ))}
          <li className="paulet-debate">{t.debate}</li>
        </ul>
        <MotorPulsos />
      </article>

      <div className="historia-filtro">
        <h3>{t.linea}</h3>
        <div className="nasa-chips">
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={!soloPeru}
            onClick={() => setSoloPeru(false)}
          >
            {t.todos}
          </button>
          <button
            type="button"
            className="nasa-chip"
            aria-pressed={soloPeru}
            onClick={() => setSoloPeru(true)}
          >
            {t.peru}
          </button>
        </div>
      </div>
      <ol className="historia-linea">
        {hitos.map((h) => (
          <li key={h.id} className={h.peru ? 'peru' : undefined}>
            <p className="historia-anio">
              {h.anio}
              {h.fecha && <small>{textos(h.fecha)}</small>}
            </p>
            <div className="historia-hito">
              {h.peru && (
                <span className="nasa-etiqueta peligro">{t.tagPeru}</span>
              )}
              <h4>{textos(h.titulo)}</h4>
              <p>{textos(h.texto)}</p>
              {h.ruta && (
                <Link className="nasa-enlace" to={`/${h.ruta}`}>
                  {t.ver} →
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
