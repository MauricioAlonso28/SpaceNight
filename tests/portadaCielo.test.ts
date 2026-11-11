import { describe, expect, it } from 'vitest';
import { migrarEstado } from '../src/estado/store';
import type { Evento } from '../src/servicios/astro/eventos';
import {
  luzCiudad,
  vistaCondiciones,
} from '../src/pantallas/EstaNoche/condiciones';
import { itemEvento } from '../src/pantallas/EstaNoche/textosEventos';
import { lima } from './referencia';

const FORMATO = { zona: 'America/Lima', formato24h: true };
const inicio = lima(2026, 11, 10, 19, 30);
const fin = lima(2026, 11, 11, 4, 15);

function listo(nubes: number, humedad: number, caducado = false) {
  const horas = [20, 22, 24, 26].map((h) => ({
    t: lima(2026, 11, 10, h).getTime(),
    nubes,
    humedad,
    visibilidad: 20000,
  }));
  return {
    estado: 'listo' as const,
    resultado: {
      valor: { horas },
      guardado: lima(2026, 11, 10, 18).getTime(),
      caducado,
    },
  };
}

describe('panel ¿Se ve bien hoy?', () => {
  it('con el pronóstico del ejemplo del plan sale Regular', () => {
    const v = vistaCondiciones(listo(30, 84), inicio, fin, 0.5, 8, FORMATO);
    expect(v.puntuacion).toBe(42);
    expect(v.titulo).toBe('Regular');
    expect(v.aviso).toBeNull();
  });

  it('la puntuación cambia con el pronóstico: noche despejada y seca', () => {
    const v = vistaCondiciones(listo(0, 60), inicio, fin, 0.03, 8, FORMATO);
    expect(v.puntuacion).toBe(72);
    expect(v.titulo).toBe('Bueno');
  });

  it('sin conexión usa la copia guardada y lo avisa con la hora', () => {
    const v = vistaCondiciones(
      listo(30, 84, true),
      inicio,
      fin,
      0.5,
      8,
      FORMATO,
    );
    expect(v.puntuacion).toBe(42);
    expect(v.aviso).toBe('Sin conexión: pronóstico guardado a las 18:00.');
  });

  it('más allá de 16 días no inventa: sin puntuación y con aviso', () => {
    const lejos = lima(2026, 12, 5, 20);
    const v = vistaCondiciones(listo(30, 84), lejos, lejos, 0.5, 8, FORMATO);
    expect(v.puntuacion).toBeNull();
    expect(v.aviso).toMatch(/16 días/);
  });

  it('mientras carga o si falla tampoco hay puntuación', () => {
    expect(
      vistaCondiciones({ estado: 'cargando' }, inicio, fin, 0, 8, FORMATO)
        .puntuacion,
    ).toBeNull();
    expect(
      vistaCondiciones({ estado: 'error' }, inicio, fin, 0, 8, FORMATO).aviso,
    ).toMatch(/No se pudo/);
  });

  it('nombra la luz de la ciudad según Bortle', () => {
    expect([1, 4, 6, 8].map(luzCiudad)).toEqual([
      'Baja',
      'Media',
      'Alta',
      'Muy alta',
    ]);
  });
});

describe('textos de los eventos', () => {
  const hoy = lima(2026, 11, 10);

  it('lluvia: cuenta los días que faltan y aconseja según el radiante', () => {
    const e: Evento = {
      tipo: 'lluvia',
      fecha: lima(2026, 11, 17),
      lluvia: {
        codigo: 'LEO',
        nombre: 'Leónidas',
        nombreEn: 'Leonids',
        pico: '2026-11-17',
        tasa: 15,
        ar: 152,
        dec: 22,
      },
      alturaRadiante: 56,
    };
    const item = itemEvento(e, hoy, FORMATO);
    expect(item.titulo).toBe('Faltan 7 días para las Leónidas');
    expect(item.detalle).toMatch(
      /^Pico el 17 de noviembre\. En cielo oscuro, hasta 15 meteoros por hora/,
    );
    expect(item.detalle).toMatch(/Mira después de medianoche/);
    expect(itemEvento({ ...e, fecha: hoy }, hoy, FORMATO).titulo).toBe(
      'Hoy es el pico de las Leónidas',
    );
    expect(
      itemEvento({ ...e, alturaRadiante: 2 }, hoy, FORMATO).detalle,
    ).toMatch(/radiante queda bajo/);
  });

  it('conjunción con la separación en grados y coma decimal', () => {
    const item = itemEvento(
      {
        tipo: 'conjuncion',
        fecha: lima(2026, 11, 15, 18),
        a: 'marte',
        b: 'jupiter',
        separacion: 1.193,
      },
      hoy,
      FORMATO,
    );
    expect(item.titulo).toBe('Marte y Júpiter muy juntos el 15 de noviembre');
    expect(item.detalle).toMatch(/^A 1,2° uno del otro/);
  });

  it('eclipse de Sol en español, con la hora del máximo y el aviso del filtro', () => {
    const item = itemEvento(
      {
        tipo: 'eclipse-sol',
        fecha: new Date('2027-02-06T15:17:00Z'),
        clase: 'partial',
        oscurecimiento: 0.02,
      },
      hoy,
      FORMATO,
    );
    expect(item.titulo).toBe('Eclipse parcial de Sol el 6 de febrero');
    expect(item.detalle).toBe(
      'Desde aquí la Luna tapa el 2 % del Sol, con el máximo a las 10:17. Nunca lo mires sin filtro solar.',
    );
  });
});

describe('estado guardado de versiones anteriores', () => {
  it('añade Bortle 8 a Lima y 7 a una ubicación de GPS', () => {
    const lima1 = migrarEstado({ ubicacion: { nombre: 'Lima' } }, 1) as {
      ubicacion: { bortle: number };
    };
    const gps1 = migrarEstado({ ubicacion: { nombre: 'Tu ubicación' } }, 1) as {
      ubicacion: { bortle: number };
    };
    expect(lima1.ubicacion.bortle).toBe(8);
    expect(gps1.ubicacion.bortle).toBe(7);
  });
});
