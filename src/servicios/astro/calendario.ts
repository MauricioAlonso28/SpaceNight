import {
  MoonPhase,
  NextMoonQuarter,
  SearchMoonQuarter,
} from 'astronomy-engine';
import { medianocheLocal, partesEnZona } from '../tiempo';

export type Cuarto =
  'nueva' | 'cuarto-creciente' | 'llena' | 'cuarto-menguante';

const CUARTOS: readonly Cuarto[] = [
  'nueva',
  'cuarto-creciente',
  'llena',
  'cuarto-menguante',
];

/** Un día del calendario: su fecha, el ángulo de fase a mediodía y si cae en el mes. */
export interface DiaCalendario {
  dia: number;
  inicio: Date;
  anguloFase: number;
  delMes: boolean;
}

/** Instante exacto de una fase principal de la Luna. */
export interface FasePrincipal {
  fecha: Date;
  cuarto: Cuarto;
}

/**
 * Semanas del mes de lunes a domingo, con los días del mes anterior y siguiente para completar.
 * @param mes de 1 a 12
 */
export function semanasDelMes(
  anio: number,
  mes: number,
  zona: string,
): DiaCalendario[][] {
  const diaSemana = (new Date(Date.UTC(anio, mes - 1, 1)).getUTCDay() + 6) % 7;
  const diasMes = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const celdas = Math.ceil((diaSemana + diasMes) / 7) * 7;
  const dias: DiaCalendario[] = [];
  for (let i = 0; i < celdas; i++) {
    const n = i - diaSemana + 1;
    const inicio = medianocheLocal(anio, mes, n, zona);
    const mediodia = new Date(inicio.getTime() + 12 * 3_600_000);
    dias.push({
      dia: partesEnZona(mediodia, zona).dia,
      inicio,
      anguloFase: MoonPhase(mediodia),
      delMes: n >= 1 && n <= diasMes,
    });
  }
  return Array.from({ length: celdas / 7 }, (_, s) =>
    dias.slice(s * 7, s * 7 + 7),
  );
}

/** Lunas nuevas, cuartos y llenas entre dos fechas, en orden. */
export function fasesEntre(desde: Date, hasta: Date): FasePrincipal[] {
  const lista: FasePrincipal[] = [];
  for (
    let q = SearchMoonQuarter(desde);
    q.time.date < hasta;
    q = NextMoonQuarter(q)
  ) {
    lista.push({ fecha: q.time.date, cuarto: CUARTOS[q.quarter] });
  }
  return lista;
}
