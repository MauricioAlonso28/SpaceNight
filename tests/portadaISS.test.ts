import { describe, expect, it } from 'vitest';
import tleTexto from './datos/iss-2026-11-10.tle?raw';
import { pasosEntre } from '../src/servicios/astro/eventos';
import { ventanaNoche } from '../src/servicios/astro/noche';
import { leerTle, pasosVisibles } from '../src/servicios/satelites/iss';
import { filaEstacion } from '../src/pantallas/EstaNoche/filasNoche';
import { itemPasoISS } from '../src/pantallas/EstaNoche/textosEventos';
import { LIMA } from '../src/tipos/ubicacion';
import { lima } from './referencia';

const FORMATO = { zona: 'America/Lima', formato24h: true };
const pasos = pasosVisibles(
  leerTle(tleTexto),
  LIMA,
  lima(2026, 11, 10),
  6 * 24,
);

describe('pasos de la Estación en la portada', () => {
  it('el del 12 de noviembre: título con el día y detalle con duración, rumbos y altura', () => {
    const paso = pasos[2];
    const item = itemPasoISS(paso, lima(2026, 11, 10), FORMATO);
    expect(item.titulo).toBe(
      'La Estación Espacial pasa el jueves 12 a las 04:39',
    );
    expect(item.detalle).toBe(
      'Se ve unos 5 minutos, del noroeste al sureste, hasta 54° de altura. Es el punto brillante que cruza sin parpadear.',
    );
  });

  it('dice hoy y mañana según el día que se mira', () => {
    const paso = pasos[1];
    expect(itemPasoISS(paso, lima(2026, 11, 11), FORMATO).titulo).toMatch(
      /pasa hoy a las 03:5\d$/,
    );
    expect(itemPasoISS(paso, lima(2026, 11, 10), FORMATO).titulo).toMatch(
      /pasa mañana a las 03:5\d$/,
    );
  });

  it('un paso de un minuto lo dice en singular', () => {
    const detalle = itemPasoISS(pasos[5], lima(2026, 11, 15), FORMATO).detalle;
    expect(detalle).toMatch(/^Se ve apenas un minuto, por el sur, /);
  });

  it('la noche del 11 al 12 tiene un punto a las 04:39 en la fila Estación', () => {
    const ventana = ventanaNoche(lima(2026, 11, 11, 21), LIMA.zona);
    const fila = filaEstacion(pasos, ventana, (f) => (18 + f * 12).toFixed(2));
    expect(fila?.puntos).toHaveLength(1);
    const hora = 18 + fila!.puntos![0] * 12 - 24;
    expect(hora).toBeCloseTo(4 + 39 / 60, 1);
  });

  it('sin predicción para esa noche no hay fila; sin pasos, la fila lo dice', () => {
    const ventana = ventanaNoche(lima(2026, 11, 11, 21), LIMA.zona);
    expect(filaEstacion(null, ventana, String)).toBeNull();
    expect(filaEstacion([], ventana, String)?.descripcion).toBe(
      'La Estación Espacial no pasa a la vista esta noche',
    );
  });

  it('entre los eventos solo entran los pasos del tramo pedido', () => {
    const lista = pasosEntre(pasos, lima(2026, 11, 12), lima(2026, 11, 14));
    expect(lista.map((e) => e.fecha.getUTCDate())).toEqual([12, 13]);
  });
});
