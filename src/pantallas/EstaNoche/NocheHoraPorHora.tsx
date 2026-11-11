import { LineaNoche } from '../../componentes/LineaNoche/LineaNoche';
import {
  HORAS_NOCHE,
  fraccionVentana,
  type Posicion,
  type VentanaNoche,
} from '../../servicios/astro/noche';
import type { NochePlaneta } from '../../servicios/astro/planetas';
import { formatearHora } from '../../servicios/formato';
import { filasNoche } from './filasNoche';

const MS_HORA = 3_600_000;

/** Panel Tu noche, hora por hora: cielo, Luna y planetas de 18:00 a 06:00. */
export function NocheHoraPorHora({
  ventana,
  instantes,
  sol,
  luna,
  planetas,
  ahora,
  zona,
  formato24h,
}: {
  ventana: VentanaNoche;
  instantes: Date[];
  sol: Posicion[];
  luna: Posicion[];
  planetas: NochePlaneta[];
  ahora: Date;
  zona: string;
  formato24h: boolean;
}) {
  const enHora = (f: number) =>
    formatearHora(
      new Date(ventana.inicio.getTime() + f * HORAS_NOCHE * MS_HORA),
      zona,
      formato24h,
    );
  const marcas = [0, 3, 6, 9, 12].map((h) => ({
    texto: enHora(h / HORAS_NOCHE),
    posicion: h / HORAS_NOCHE,
  }));
  const posAhora = fraccionVentana(ahora, ventana);
  const filas = filasNoche(ventana, instantes, sol, luna, planetas, enHora);

  return (
    <div className="panel">
      <LineaNoche
        filas={filas}
        marcas={marcas}
        ahora={posAhora >= 0 && posAhora <= 1 ? posAhora : null}
      />
      <p className="leyenda">
        Cada barra marca cuándo está sobre el horizonte. La primera fila muestra
        cuándo el cielo está oscuro de verdad.
      </p>
    </div>
  );
}
