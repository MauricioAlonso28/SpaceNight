import type { CSSProperties } from 'react';
import { Medidor } from '../../componentes/Medidor/Medidor';
import { luzCiudad, type VistaCondiciones } from './condiciones';

function Barra({
  nombre,
  valor,
  texto,
  alta = false,
}: {
  nombre: string;
  valor: number | null;
  texto: string;
  alta?: boolean;
}) {
  return (
    <li>
      <span>{nombre}</span>
      <span className="barrita">
        {valor !== null && (
          <i
            className={alta ? 'alta' : undefined}
            style={{ '--v': `${Math.round(valor)}%` } as CSSProperties}
          />
        )}
      </span>
      <b>{texto}</b>
    </li>
  );
}

const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v)}%`);

/** Panel ¿Se ve bien hoy?: medidor de 0 a 100, su lectura y los cuatro factores. */
export function CondicionesCielo({ vista }: { vista: VistaCondiciones }) {
  return (
    <div className="panel condiciones">
      <Medidor
        valor={vista.puntuacion}
        etiqueta={
          vista.puntuacion === null
            ? 'Calidad del cielo: sin pronóstico'
            : `Calidad del cielo: ${vista.puntuacion} de 100, ${vista.titulo}`
        }
      />
      <div>
        <p className="condiciones-titulo">{vista.titulo}</p>
        <p className="condiciones-texto">{vista.texto}</p>
      </div>
      <ul className="medidas">
        <Barra nombre="Nubes" valor={vista.nubes} texto={pct(vista.nubes)} />
        <Barra
          nombre="Humedad"
          valor={vista.humedad}
          texto={pct(vista.humedad)}
        />
        <Barra
          nombre="Luz de la ciudad"
          valor={(vista.bortle / 9) * 100}
          texto={luzCiudad(vista.bortle)}
          alta={vista.bortle >= 7}
        />
        <Barra
          nombre="Luna"
          valor={vista.luna * 100}
          texto={pct(vista.luna * 100)}
        />
      </ul>
      {vista.aviso && <p className="condiciones-aviso">{vista.aviso}</p>}
    </div>
  );
}
