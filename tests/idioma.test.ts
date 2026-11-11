import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import lluviasJson from '../public/data/lluvias-2026-2027.json';
import planetasJson from '../public/data/planetas.json';
import {
  letraCoordenada,
  nombreLugar,
  nombrePlaneta,
  rumboCorto,
} from '../src/idioma/comunes';
import {
  detectarIdioma,
  fijarIdioma,
  resolverIdioma,
} from '../src/idioma/idioma';
import { textoCuando } from '../src/pantallas/EstaNoche/textos';
import { itemEvento } from '../src/pantallas/EstaNoche/textosEventos';
import { lineasPlaneta } from '../src/pantallas/EstaNoche/textosPlanetas';
import {
  textoLuz,
  textoTamano,
} from '../src/pantallas/Explorar/textosExplorar';
import type { Evento } from '../src/servicios/astro/eventos';
import type { NochePlaneta } from '../src/servicios/astro/planetas';
import {
  formatearDecimal,
  formatearFechaLarga,
  formatearHora,
  formatearNumero,
} from '../src/servicios/formato';
import { LIMA, NOMBRE_GPS } from '../src/tipos/ubicacion';
import { lima } from './referencia';

describe('idioma del navegador', () => {
  it('usa el primero de los preferidos que la app tiene', () => {
    expect(detectarIdioma(['es-PE', 'en-US'])).toBe('es');
    expect(detectarIdioma(['en-GB', 'es'])).toBe('en');
    expect(detectarIdioma(['fr-FR', 'es-MX'])).toBe('es');
    expect(detectarIdioma(['ES'])).toBe('es');
  });

  it('sin español ni inglés entre los preferidos, inglés', () => {
    expect(detectarIdioma(['fr-FR', 'de'])).toBe('en');
    expect(detectarIdioma([])).toBe('en');
  });

  it('una preferencia fija manda sobre el navegador', () => {
    expect(resolverIdioma('es')).toBe('es');
    expect(resolverIdioma('en')).toBe('en');
  });
});

describe('textos en inglés', () => {
  beforeEach(() => fijarIdioma('en'));
  afterEach(() => fijarIdioma('es'));

  it('números y fechas con el formato inglés', () => {
    expect(formatearNumero(402_263)).toBe('402,263');
    expect(formatearNumero(1.5, 1)).toBe('1.5');
    expect(formatearDecimal(-0.04)).toBe('0.0');
    expect(formatearDecimal(-1.26)).toBe('−1.3');
    const noche = lima(2026, 11, 11, 21, 5);
    expect(formatearFechaLarga(noche, LIMA.zona)).toBe(
      'Wednesday, November 11',
    );
    expect(formatearHora(noche, LIMA.zona, false)).toBe('9:05 PM');
  });

  it('rumbos, coordenadas, planetas y el lugar del GPS', () => {
    expect(rumboCorto('SO')).toBe('SW');
    expect(rumboCorto('NO')).toBe('NW');
    expect(letraCoordenada(-77, 'longitud')).toBe('W');
    expect(nombrePlaneta('jupiter')).toBe('Jupiter');
    expect(nombreLugar({ ...LIMA, nombre: NOMBRE_GPS })).toBe('Your location');
    expect(nombreLugar(LIMA)).toBe('Lima');
  });

  it('deslizador y fichas', () => {
    expect(textoCuando(0, 'Nov 11')).toBe('Today');
    expect(textoCuando(1, 'Nov 12')).toBe('Tomorrow, Nov 12');
    expect(textoLuz(500)).toBe('8 minutes');
    expect(textoLuz(4320)).toBe('1 hour and 12 minutes');
    expect(textoTamano(139_820)).toBe('11 times the Earth');
  });

  it('una tarjeta de planeta sin artículos españoles', () => {
    const p = {
      planeta: 'venus',
      visible: true,
      aparece: lima(2026, 11, 11, 19),
      rumboAparece: 'O',
      ultimaVez: lima(2026, 11, 11, 21),
      masAlto: lima(2026, 11, 11, 19),
      rumboMasAlto: 'O',
    } as NochePlaneta;
    expect(lineasPlaneta(p, LIMA.zona, true)).toEqual([
      'In the west from 19:00',
      'Visible until 21:00, sinking lower',
      'The brightest point in the sky after the Moon',
    ]);
  });

  it('una lluvia de meteoros con su nombre inglés', () => {
    const leonidas = lluviasJson.lluvias.find((l) => l.codigo === 'LEO')!;
    const e: Evento = {
      tipo: 'lluvia',
      fecha: lima(2026, 11, 17),
      lluvia: leonidas,
      alturaRadiante: 40,
    };
    const item = itemEvento(e, lima(2026, 11, 10), {
      zona: LIMA.zona,
      formato24h: true,
    });
    expect(item.titulo).toBe('7 days until the Leonids');
    expect(item.detalle.startsWith('Peaks on November 17.')).toBe(true);
  });
});

describe('datos traducidos', () => {
  it('cada lluvia tiene nombre en inglés', () => {
    for (const l of lluviasJson.lluvias) expect(l.nombreEn).toBeTruthy();
  });

  it('cada ficha tiene todos sus textos en inglés', () => {
    for (const c of planetasJson.cuerpos) {
      for (const campo of ['nombre', 'tipo', 'dia', 'anio', 'lunas', 'dato']) {
        expect(c.en[campo as keyof typeof c.en]).toBeTruthy();
      }
    }
  });
});
