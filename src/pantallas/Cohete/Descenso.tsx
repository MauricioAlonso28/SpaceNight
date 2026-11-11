import { textos } from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import type { Muestra } from '../../servicios/cohete/vuelo';

const TECHO = 3_000;
const SUELO = 372;
const ALTO_UTIL = 320;

/**
 * Acercamiento a los últimos 3 km del regreso: la etapa de pie, con llama cuando empuja y patas al final, sobre la barcaza o la plataforma.
 * @param destino dónde se posa
 */
export function Descenso({
  m,
  terminado,
  destino,
}: {
  m: Muestra;
  terminado: boolean;
  destino: 'barcaza' | 'base';
}) {
  const t = textos({
    es: {
      titulo: 'Los últimos 3 km',
      arriba: (km: string) => `↑ a ${km} km`,
      barcaza: 'Barcaza',
      base: 'Plataforma',
    },
    en: {
      titulo: 'The last 3 km',
      arriba: (km: string) => `↑ ${km} km up`,
      barcaza: 'Drone ship',
      base: 'Landing pad',
    },
  });
  const h = Math.max(0, m.altura);
  const y = SUELO - (Math.min(h, TECHO) / TECHO) * ALTO_UTIL;
  const llama =
    m.empuje > 0 && !terminado ? Math.min(3, m.empuje / 845_000) : 0;
  const patas = h < 400 || terminado;
  return (
    <figure className="descenso" aria-label={t.titulo}>
      <figcaption className="nasa-rotulo">{t.titulo}</figcaption>
      <svg viewBox="0 0 160 420" aria-hidden="true">
        <defs>
          <linearGradient id="descenso-cielo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0b1b52" stopOpacity="0" />
            <stop offset="1" stopColor="#3a6fd8" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="40"
          width="160"
          height={SUELO - 40}
          fill="url(#descenso-cielo)"
        />
        {[1000, 2000, 3000].map((n) => (
          <g key={n}>
            <line
              x1="0"
              x2="14"
              y1={SUELO - (n / TECHO) * ALTO_UTIL}
              y2={SUELO - (n / TECHO) * ALTO_UTIL}
              className="descenso-marca"
            />
            <text
              x="18"
              y={SUELO - (n / TECHO) * ALTO_UTIL + 4}
              className="descenso-texto"
            >
              {n / 1000} km
            </text>
          </g>
        ))}
        {destino === 'barcaza' ? (
          <g className="descenso-barcaza">
            <path d={`M22 ${SUELO} h116 l-8 14 h-100 z`} />
            <circle cx="80" cy={SUELO - 1} r="12" className="descenso-diana" />
          </g>
        ) : (
          <g className="descenso-base">
            <rect x="0" y={SUELO} width="160" height="48" />
            <circle cx="80" cy={SUELO} r="18" className="descenso-diana" />
          </g>
        )}
        {h <= TECHO && (
          <g transform={`translate(80 ${y})`} className="descenso-etapa">
            {llama > 0 && (
              <path
                d={`M-5 0 L0 ${18 + llama * 16} L5 0 Z`}
                className="descenso-llama"
              />
            )}
            {patas && (
              <path d="M-5 -6 L-13 2 M5 -6 L13 2" className="descenso-patas" />
            )}
            <rect x="-5" y="-62" width="10" height="62" rx="1.5" />
            <path
              d="M-5 -58 h-4 v4 h4 M5 -58 h4 v4 h-4"
              className="descenso-aletas"
            />
          </g>
        )}
        {h > TECHO && (
          <text
            x="80"
            y="150"
            textAnchor="middle"
            className="descenso-texto fuerte"
          >
            {t.arriba(formatearNumero(h / 1000, 1))}
          </text>
        )}
        <text
          x="152"
          y={SUELO + 30}
          textAnchor="end"
          className="descenso-texto"
        >
          {destino === 'barcaza' ? t.barcaza : t.base}
        </text>
      </svg>
      <p className="descenso-datos">
        <strong>{formatearNumero(h)} m</strong>
        <span>{formatearNumero(m.vertical, 0)} m/s</span>
      </p>
    </figure>
  );
}
