import { useMemo, useState } from 'react';
import { useLluvias } from '../../estado/datos';
import { textos } from '../../idioma/idioma';
import { semanasDelMes } from '../../servicios/astro/calendario';
import { formatearHora } from '../../servicios/formato';
import { partesEnZona } from '../../servicios/tiempo';
import type { Ubicacion } from '../../tipos/ubicacion';
import { IconoFase } from './IconoFase';
import { lineasDelMes } from './datosExplorar';

const ES = {
  dias: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  meses: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
  anterior: 'Mes anterior',
  siguiente: 'Mes siguiente',
};

const EN: typeof ES = {
  dias: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  meses: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  anterior: 'Previous month',
  siguiente: 'Next month',
};

/** Calendario mensual con la fase de cada día y la lista de fases y eventos. */
export function Calendario({
  fecha,
  ubicacion,
  formato24h,
}: {
  fecha: Date;
  ubicacion: Ubicacion;
  formato24h: boolean;
}) {
  const t = textos({ es: ES, en: EN });
  const hoy = partesEnZona(fecha, ubicacion.zona);
  const [mes, setMes] = useState({ anio: hoy.anio, mes: hoy.mes });
  const lluvias = useLluvias();
  const semanas = useMemo(
    () => semanasDelMes(mes.anio, mes.mes, ubicacion.zona),
    [mes, ubicacion.zona],
  );
  const lineas = useMemo(
    () => lineasDelMes(mes.anio, mes.mes, ubicacion, lluvias),
    [mes, ubicacion, lluvias],
  );
  const conEvento = new Set(
    lineas.map((l) => partesEnZona(l.fecha, ubicacion.zona).dia),
  );
  const mover = (d: number) =>
    setMes(({ anio, mes: m }) => {
      const t = m - 1 + d;
      return {
        anio: anio + Math.floor(t / 12),
        mes: (((t % 12) + 12) % 12) + 1,
      };
    });
  const esHoy = (inicio: Date) => {
    const p = partesEnZona(
      new Date(inicio.getTime() + 12 * 3_600_000),
      ubicacion.zona,
    );
    return p.anio === hoy.anio && p.mes === hoy.mes && p.dia === hoy.dia;
  };

  return (
    <div className="calendario">
      <div className="calendario-cabecera">
        <button
          type="button"
          className="boton"
          aria-label={t.anterior}
          onClick={() => mover(-1)}
        >
          ‹
        </button>
        <h3>
          {t.meses[mes.mes - 1]} {mes.anio}
        </h3>
        <button
          type="button"
          className="boton"
          aria-label={t.siguiente}
          onClick={() => mover(1)}
        >
          ›
        </button>
      </div>
      <table className="calendario-tabla">
        <thead>
          <tr>
            {t.dias.map((d, i) => (
              <th key={i} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {semanas.map((s) => (
            <tr key={s[0].inicio.getTime()}>
              {s.map((d) => (
                <td
                  key={d.inicio.getTime()}
                  className={[
                    d.delMes ? '' : 'fuera',
                    esHoy(d.inicio) ? 'hoy' : '',
                    d.delMes && conEvento.has(d.dia) ? 'con-evento' : '',
                  ].join(' ')}
                >
                  <span className="calendario-dia">{d.dia}</span>
                  <IconoFase
                    angulo={d.anguloFase}
                    hemisferioSur={ubicacion.latitud < 0}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="calendario-lista panel">
        {lineas.map((l) => (
          <li key={`${l.titulo}-${l.fecha.getTime()}`}>
            <span className="calendario-fecha">
              {partesEnZona(l.fecha, ubicacion.zona).dia}
              {l.fase &&
                ` · ${formatearHora(l.fecha, ubicacion.zona, formato24h)}`}
            </span>
            <span>{l.titulo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
