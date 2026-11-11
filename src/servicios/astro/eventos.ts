import {
  AngleBetween,
  ApsisKind,
  Body,
  Elongation,
  GeoVector,
  NextLunarApsis,
  NextLunarEclipse,
  NextLocalSolarEclipse,
  SearchLocalSolarEclipse,
  SearchLunarApsis,
  SearchLunarEclipse,
  SearchMoonPhase,
} from 'astronomy-engine';
import type { Ubicacion } from '../../tipos/ubicacion';
import type { PasoISS } from '../satelites/iss';
import { MS_DIA, medianocheLocal, sumarDias } from '../tiempo';
import { posicion, ventanaNoche } from './noche';
import { observador } from './observador';
import { CUERPO, PLANETAS, type Planeta } from './planetas';

export const SEPARACION_CONJUNCION = 3;
export const ELONGACION_MINIMA = 15;
export const OSCURECIMIENTO_MINIMO = 0.01;

/** Una lluvia de meteoros tal como viene del JSON del repositorio. */
export interface Lluvia {
  codigo: string;
  nombre: string;
  nombreEn: string;
  pico: string;
  tasa: number;
  ar: number;
  dec: number;
}

export type Evento =
  | { tipo: 'lluvia'; fecha: Date; lluvia: Lluvia; alturaRadiante: number }
  | {
      tipo: 'eclipse-luna';
      fecha: Date;
      clase: string;
      visible: 'entero' | 'parcial';
    }
  | { tipo: 'eclipse-sol'; fecha: Date; clase: string; oscurecimiento: number }
  | { tipo: 'superluna'; fecha: Date; distanciaKm: number }
  | { tipo: 'iss'; fecha: Date; paso: PasoISS }
  | {
      tipo: 'conjuncion';
      fecha: Date;
      a: Planeta;
      b: Planeta;
      separacion: number;
    };

/** Altura máxima que alcanza el radiante de una lluvia desde una latitud. */
export function alturaMaximaRadiante(latitud: number, dec: number): number {
  return 90 - Math.abs(latitud - dec);
}

/** Picos de lluvias de meteoros entre dos fechas, con la altura máxima del radiante. */
export function lluviasEntre(
  lluvias: Lluvia[],
  desde: Date,
  hasta: Date,
  ubicacion: Ubicacion,
): Evento[] {
  return lluvias.flatMap((l) => {
    const [a, m, d] = l.pico.split('-').map(Number);
    const fecha = medianocheLocal(a, m, d, ubicacion.zona);
    if (fecha < desde || fecha >= hasta) return [];
    const alturaRadiante = alturaMaximaRadiante(ubicacion.latitud, l.dec);
    return [{ tipo: 'lluvia' as const, fecha, lluvia: l, alturaRadiante }];
  });
}

function parteVisibleEclipse(
  pico: Date,
  minutos: number,
  ubicacion: Ubicacion,
): 'entero' | 'parcial' | null {
  const alturas: number[] = [];
  for (let m = -minutos; m <= minutos; m += 10) {
    const t = new Date(pico.getTime() + m * 60_000);
    alturas.push(posicion(Body.Moon, t, ubicacion).altura);
  }
  const arriba = alturas.filter((h) => h > 0).length;
  if (arriba === 0) return null;
  return arriba === alturas.length ? 'entero' : 'parcial';
}

/** Eclipses de Luna con la Luna sobre el horizonte en algún momento. */
export function eclipsesLunaEntre(
  desde: Date,
  hasta: Date,
  ubicacion: Ubicacion,
): Evento[] {
  const lista: Evento[] = [];
  for (
    let e = SearchLunarEclipse(desde);
    e.peak.date < hasta;
    e = NextLunarEclipse(e.peak)
  ) {
    const visible = parteVisibleEclipse(e.peak.date, e.sd_penum, ubicacion);
    if (visible) {
      lista.push({
        tipo: 'eclipse-luna',
        fecha: e.peak.date,
        clase: e.kind,
        visible,
      });
    }
  }
  return lista;
}

/** Eclipses de Sol que se ven desde la ubicación con el Sol alto y algo tapado. */
export function eclipsesSolEntre(
  desde: Date,
  hasta: Date,
  ubicacion: Ubicacion,
): Evento[] {
  const obs = observador(ubicacion);
  const lista: Evento[] = [];
  for (
    let e = SearchLocalSolarEclipse(desde, obs);
    e.peak.time.date < hasta;
    e = NextLocalSolarEclipse(e.peak.time, obs)
  ) {
    const tapado = e.obscuration ?? 0;
    if (e.peak.altitude > 0 && tapado >= OSCURECIMIENTO_MINIMO) {
      lista.push({
        tipo: 'eclipse-sol',
        fecha: e.peak.time.date,
        clase: e.kind,
        oscurecimiento: tapado,
      });
    }
  }
  return lista;
}

/** Lunas llenas a menos de un día del perigeo. */
export function superlunasEntre(desde: Date, hasta: Date): Evento[] {
  const lista: Evento[] = [];
  for (
    let ap = SearchLunarApsis(sumarDias(desde, -2));
    ap.time.date < sumarDias(hasta, 2);
    ap = NextLunarApsis(ap)
  ) {
    if (ap.kind !== ApsisKind.Pericenter) continue;
    const llena = SearchMoonPhase(180, sumarDias(ap.time.date, -2), 4);
    if (!llena) continue;
    const dias =
      Math.abs(llena.date.getTime() - ap.time.date.getTime()) / MS_DIA;
    if (dias <= 1 && llena.date >= desde && llena.date < hasta) {
      lista.push({
        tipo: 'superluna',
        fecha: llena.date,
        distanciaKm: ap.dist_km,
      });
    }
  }
  return lista;
}

function separacion(a: Planeta, b: Planeta, t: Date): number {
  return AngleBetween(
    GeoVector(CUERPO[a], t, true),
    GeoVector(CUERPO[b], t, true),
  );
}

function lejosDelSol(a: Planeta, b: Planeta, t: Date): boolean {
  return [a, b].every(
    (p) => Elongation(CUERPO[p], t).elongation >= ELONGACION_MINIMA,
  );
}

function conjuncionesPar(a: Planeta, b: Planeta, noches: Date[]): Evento[] {
  const lista: Evento[] = [];
  let mejor: { fecha: Date; sep: number } | null = null;
  const cerrar = () => {
    if (mejor)
      lista.push({
        tipo: 'conjuncion',
        fecha: mejor.fecha,
        a,
        b,
        separacion: mejor.sep,
      });
    mejor = null;
  };
  for (const t of noches) {
    const sep = separacion(a, b, t);
    if (sep < SEPARACION_CONJUNCION && lejosDelSol(a, b, t)) {
      if (!mejor || sep < mejor.sep) mejor = { fecha: t, sep };
    } else {
      cerrar();
    }
  }
  cerrar();
  return lista;
}

/** Parejas de planetas a menos de 3° y lejos del Sol, una por acercamiento, en su noche más cercana. */
export function conjuncionesEntre(
  desde: Date,
  hasta: Date,
  ubicacion: Ubicacion,
): Evento[] {
  const noches: Date[] = [];
  for (let d = desde; d < hasta; d = sumarDias(d, 1)) {
    const v = ventanaNoche(
      new Date(d.getTime() + 12 * 3_600_000),
      ubicacion.zona,
    );
    noches.push(v.inicio);
  }
  const lista: Evento[] = [];
  PLANETAS.forEach((a, i) =>
    PLANETAS.slice(i + 1).forEach((b) =>
      lista.push(...conjuncionesPar(a, b, noches)),
    ),
  );
  return lista;
}

/** Pasos de la Estación que aparecen entre dos fechas, como eventos. */
export function pasosEntre(
  pasos: PasoISS[],
  desde: Date,
  hasta: Date,
): Evento[] {
  return pasos
    .filter((p) => p.aparece.fecha >= desde && p.aparece.fecha < hasta)
    .map((paso) => ({ tipo: 'iss' as const, fecha: paso.aparece.fecha, paso }));
}

/**
 * Todos los eventos entre dos fechas, ordenados por fecha.
 * @param lluvias el calendario de lluvias del JSON
 */
export function eventosEntre(
  desde: Date,
  hasta: Date,
  ubicacion: Ubicacion,
  lluvias: Lluvia[],
): Evento[] {
  return [
    ...lluviasEntre(lluvias, desde, hasta, ubicacion),
    ...eclipsesLunaEntre(desde, hasta, ubicacion),
    ...eclipsesSolEntre(desde, hasta, ubicacion),
    ...superlunasEntre(desde, hasta),
    ...conjuncionesEntre(desde, hasta, ubicacion),
  ].sort((x, y) => x.fecha.getTime() - y.fecha.getTime());
}
