import { describe, expect, it } from 'vitest';
import { nochePlanetas } from '../src/servicios/astro/planetas';
import { colorCielo, filasNoche } from '../src/pantallas/EstaNoche/filasNoche';
import {
  articuloHora,
  lineasPlaneta,
} from '../src/pantallas/EstaNoche/textosPlanetas';
import { LIMA } from '../src/tipos/ubicacion';
import { lima } from './referencia';

const noche = nochePlanetas(lima(2026, 11, 10, 21), LIMA);
const planeta = (nombre: string) =>
  noche.planetas.find((p) => p.planeta === nombre)!;

describe('textos de las tarjetas', () => {
  it('usa «la» para la una y «las» para el resto', () => {
    expect(articuloHora(lima(2026, 1, 1, 1, 30), 'America/Lima', true)).toBe(
      'la',
    );
    expect(articuloHora(lima(2026, 1, 1, 13, 30), 'America/Lima', true)).toBe(
      'las',
    );
    expect(articuloHora(lima(2026, 1, 1, 13, 30), 'America/Lima', false)).toBe(
      'la',
    );
    expect(articuloHora(lima(2026, 1, 1, 21), 'America/Lima', true)).toBe(
      'las',
    );
  });

  it('Saturno: aparece por el este al oscurecer y está más alto hacia las 21', () => {
    const [aparece, alto, pista] = lineasPlaneta(
      planeta('saturno'),
      LIMA.zona,
      true,
    );
    expect(aparece).toMatch(/^Por el este desde las 19:\d\d$/);
    expect(alto).toMatch(/^Más alto a las 21:\d\d, hacia el /);
    expect(pista).toContain('anillos');
  });

  it('Júpiter sale de madrugada y sigue subiendo hasta el amanecer', () => {
    const [aparece, alto] = lineasPlaneta(planeta('jupiter'), LIMA.zona, true);
    expect(aparece).toMatch(/^Por el este desde la 01:\d\d$/);
    expect(alto).toMatch(/^Sigue subiendo hasta las 04:\d\d$/);
  });
});

describe('planeta que se ve solo un momento', () => {
  it('Venus asoma unos minutos antes del amanecer: lo dice sin contradecirse', () => {
    const venus = planeta('venus');
    const lineas = lineasPlaneta(
      { ...venus, visible: true, ultimaVez: venus.aparece },
      LIMA.zona,
      true,
    );
    if (!venus.visible) return;
    expect(lineas[0]).toMatch(/^Solo un rato por el este, hacia las 04:\d\d$/);
    expect(lineas[1]).toBe('Muy bajo: busca un horizonte despejado');
  });
});

describe('línea de la noche', () => {
  it('el cielo va del rosado del atardecer al negro de la noche cerrada', () => {
    expect(colorCielo(5)).toBe('rgb(154,112,144)');
    expect(colorCielo(-6)).toBe('rgb(58,52,120)');
    expect(colorCielo(-9)).toBe('rgb(38,38,95)');
    expect(colorCielo(-30)).toBe('rgb(5,9,32)');
  });

  it('tiene filas de cielo, Luna y cada planeta visible, en ese orden', () => {
    const filas = filasNoche(
      noche.ventana,
      noche.instantes,
      noche.sol,
      noche.luna,
      noche.planetas,
      (f) => f.toFixed(2),
    );
    const nombres = filas.map((f) => f.nombre);
    expect(nombres.slice(0, 2)).toEqual(['Cielo oscuro', 'Luna']);
    expect(nombres).toEqual(
      expect.arrayContaining(['Marte', 'Júpiter', 'Saturno']),
    );
    expect(nombres).not.toContain('Mercurio');
  });

  it('la Luna del 10 de noviembre ya se puso a las 19:33: su barra va de 18:00 a esa hora', () => {
    const filas = filasNoche(
      noche.ventana,
      noche.instantes,
      noche.sol,
      noche.luna,
      noche.planetas,
      (f) => f.toFixed(2),
    );
    const luna = filas.find((f) => f.nombre === 'Luna')!;
    expect(luna.tramos).toHaveLength(1);
    expect(luna.tramos![0].desde).toBe(0);
    const horaPuesta = 18 + luna.tramos![0].hasta * 12;
    expect(horaPuesta).toBeGreaterThan(19.3);
    expect(horaPuesta).toBeLessThan(19.6);
  });
});
