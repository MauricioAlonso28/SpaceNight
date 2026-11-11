import { describe, expect, it } from 'vitest';
import estrellasJson from '../public/data/estrellas.json';
import constelacionesJson from '../public/data/constelaciones.json';
import { matrizCielo } from '../src/servicios/astro/cielo';
import type {
  Constelacion,
  FilaEstrella,
} from '../src/servicios/astro/estrellas';
import { fichaDe, nombreConstelacion } from '../src/pantallas/Mapa/ficha';
import { LIMA } from '../src/tipos/ubicacion';
import { lima } from './referencia';

const estrellas = estrellasJson.estrellas as FilaEstrella[];
const constelaciones = constelacionesJson.constelaciones as Constelacion[];
const matriz = matrizCielo(lima(2026, 12, 16, 3), LIMA);

describe('ficha de una constelación', () => {
  it('tocar el nombre de Lobo abre la ficha de Lobo, no la de una estrella cercana', () => {
    const f = fichaDe(
      { tipo: 'constelacion', id: 'Lup' },
      estrellas,
      constelaciones,
      [],
      matriz,
    )!;
    expect(f.titulo).toBe('Lobo');
    expect(f.subtitulo).toBe('Constelación · Lupus');
    expect(f.datos[0][0]).toBe('Estrella más brillante');
    expect(f.datos[0][1]).toMatch(/^α Lup \(2,3\)$/);
  });

  it('Centauro: Rigil Kentaurus con magnitud 0,0, sin signo menos', () => {
    const f = fichaDe(
      { tipo: 'constelacion', id: 'Cen' },
      estrellas,
      constelaciones,
      [],
      matriz,
    )!;
    expect(f.datos[0][1]).toBe('Rigil Kentaurus (0,0)');
  });

  it('Orión: su estrella más brillante es Rigel', () => {
    const f = fichaDe(
      { tipo: 'constelacion', id: 'Ori' },
      estrellas,
      constelaciones,
      [],
      matriz,
    )!;
    expect(f.datos[0][1]).toMatch(/^Rigel /);
  });

  it('la Cruz del Sur a las 3 de la madrugada del 16 de diciembre está sobre el horizonte', () => {
    const f = fichaDe(
      { tipo: 'constelacion', id: 'Cru' },
      estrellas,
      constelaciones,
      [],
      matriz,
    )!;
    expect(f.datos.map(([k]) => k)).toContain('Altura');
  });
});

describe('cada estrella dice su propia constelación', () => {
  it('todas las estrellas tocables nombran la constelación de su abreviatura', () => {
    for (const fila of estrellas.filter((e) => e[2] < 4)) {
      const esperado = constelaciones.find((c) => c.id === fila[6])!.nombre;
      const f = fichaDe(
        { tipo: 'estrella', indice: estrellas.indexOf(fila) },
        estrellas,
        constelaciones,
        [],
        matriz,
      )!;
      expect(f.subtitulo.endsWith(`Estrella de ${esperado}`)).toBe(true);
    }
  });

  it('una abreviatura vacía no cae en la primera constelación de la lista', () => {
    expect(nombreConstelacion('', constelaciones)).toBe('');
    expect(nombreConstelacion('Cru', constelaciones)).toBe('Cruz del Sur');
  });
});
