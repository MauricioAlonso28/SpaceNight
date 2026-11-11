import type { PointerEvent } from 'react';
import type { Planeta } from '../../servicios/astro/planetas';
import { textos } from '../../idioma/idioma';
import './TarjetaPlaneta.css';

/** Esfera dibujada con CSS para cada planeta; Saturno lleva anillo. */
function Esfera({ planeta }: { planeta: Planeta }) {
  return (
    <div className={`esfera esfera-${planeta}`}>
      {planeta === 'saturno' && <div className="anillo" />}
    </div>
  );
}

function inclinar(ev: PointerEvent<HTMLElement>) {
  if (ev.pointerType !== 'mouse') return;
  const el = ev.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (ev.clientX - r.left) / r.width - 0.5;
  const y = (ev.clientY - r.top) / r.height - 0.5;
  el.classList.add('activa');
  el.style.setProperty('--ry', `${(x * 24).toFixed(2)}deg`);
  el.style.setProperty('--rx', `${(-y * 20).toFixed(2)}deg`);
}

function soltar(ev: PointerEvent<HTMLElement>) {
  const el = ev.currentTarget;
  el.classList.remove('activa');
  el.style.removeProperty('--ry');
  el.style.removeProperty('--rx');
}

/**
 * Tarjeta en relieve de un planeta visible: esfera, nombre, cuándo y dónde mirar y brillo.
 * @param lineas textos bajo el nombre; el primero en color normal y el resto suaves
 * @param brillo puntos de 1 a 5
 */
export function TarjetaPlaneta({
  planeta,
  nombre,
  lineas,
  brillo,
}: {
  planeta: Planeta;
  nombre: string;
  lineas: string[];
  brillo: number;
}) {
  return (
    <article
      className="planeta"
      onPointerMove={inclinar}
      onPointerLeave={soltar}
    >
      <div className="cristal" />
      <div className="esfera-caja">
        <Esfera planeta={planeta} />
      </div>
      <div className="planeta-texto">
        <h3>{nombre}</h3>
        {lineas.map((l, i) => (
          <p key={l} className={i === 0 ? undefined : 'suave'}>
            {l}
          </p>
        ))}
        <div
          className="brillo"
          role="img"
          aria-label={textos({
            es: `Brillo ${brillo} de 5`,
            en: `Brightness ${brillo} of 5`,
          })}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={n <= brillo ? 'on' : undefined} />
          ))}
        </div>
      </div>
    </article>
  );
}
