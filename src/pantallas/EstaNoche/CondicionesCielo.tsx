import type { CSSProperties } from 'react';
import { Medidor } from '../../componentes/Medidor/Medidor';
import { textos } from '../../idioma/idioma';
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

const ES = {
  sinPronostico: 'Calidad del cielo: sin pronóstico',
  calidad: (n: number, titulo: string) =>
    `Calidad del cielo: ${n} de 100, ${titulo}`,
  nubes: 'Nubes',
  humedad: 'Humedad',
  luz: 'Luz de la ciudad',
  luna: 'Luna',
};

const EN: typeof ES = {
  sinPronostico: 'Sky quality: no forecast',
  calidad: (n, titulo) => `Sky quality: ${n} out of 100, ${titulo}`,
  nubes: 'Clouds',
  humedad: 'Humidity',
  luz: 'City light',
  luna: 'Moon',
};

/** Panel ¿Se ve bien hoy?: medidor de 0 a 100, su lectura y los cuatro factores. */
export function CondicionesCielo({ vista }: { vista: VistaCondiciones }) {
  const t = textos({ es: ES, en: EN });
  return (
    <div className="panel condiciones">
      <Medidor
        valor={vista.puntuacion}
        etiqueta={
          vista.puntuacion === null
            ? t.sinPronostico
            : t.calidad(vista.puntuacion, vista.titulo)
        }
      />
      <div>
        <p className="condiciones-titulo">{vista.titulo}</p>
        <p className="condiciones-texto">{vista.texto}</p>
      </div>
      <ul className="medidas">
        <Barra nombre={t.nubes} valor={vista.nubes} texto={pct(vista.nubes)} />
        <Barra
          nombre={t.humedad}
          valor={vista.humedad}
          texto={pct(vista.humedad)}
        />
        <Barra
          nombre={t.luz}
          valor={(vista.bortle / 9) * 100}
          texto={luzCiudad(vista.bortle)}
          alta={vista.bortle >= 7}
        />
        <Barra
          nombre={t.luna}
          valor={vista.luna * 100}
          texto={pct(vista.luna * 100)}
        />
      </ul>
      {vista.aviso && <p className="condiciones-aviso">{vista.aviso}</p>}
    </div>
  );
}
