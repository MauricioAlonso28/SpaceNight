import './Medidor.css';

/**
 * Anillo con un valor de 0 a 100 en el centro; sin valor muestra una raya.
 * @param valor la puntuación, o null si no se puede calcular
 * @param etiqueta texto para lectores de pantalla
 */
export function Medidor({
  valor,
  etiqueta,
}: {
  valor: number | null;
  etiqueta: string;
}) {
  return (
    <svg
      className="medidor"
      viewBox="0 0 120 120"
      role="img"
      aria-label={etiqueta}
    >
      <circle className="medidor-fondo" cx="60" cy="60" r="50" />
      {valor !== null && (
        <circle
          className="medidor-valor"
          cx="60"
          cy="60"
          r="50"
          pathLength="100"
          strokeDasharray={`${valor} 100`}
          transform="rotate(-90 60 60)"
        />
      )}
      <text className="medidor-num" x="60" y="64" textAnchor="middle">
        {valor ?? '—'}
      </text>
      <text className="medidor-de" x="60" y="82" textAnchor="middle">
        de 100
      </text>
    </svg>
  );
}
