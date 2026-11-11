import { Box3 } from 'three';
import { describe, expect, it } from 'vitest';
import catalogoJson from '../public/data/cohete.json';
import { ALTO, crearModelo, IDS_MODELO, RADIO } from '../src/3d/cohete/modelo';
import type { CatalogoCohete } from '../src/pantallas/Cohete/catalogo';

const catalogo = catalogoJson as CatalogoCohete;
const modelo = crearModelo();

describe('modelo 3D del cohete', () => {
  it('tiene una malla por cada pieza del catálogo y ninguna más', () => {
    const piezas = catalogo.componentes
      .filter((c) => c.tipo === 'pieza')
      .map((c) => c.id)
      .sort();
    expect([...IDS_MODELO].sort()).toEqual(piezas);
    expect([...modelo.piezas.keys()].sort()).toEqual(piezas);
  });

  it('cada malla guarda su id para que el toque lo devuelva', () => {
    for (const [id, p] of modelo.piezas) {
      expect(p.malla.userData.id).toBe(id);
      if (p.toque) expect(p.toque.userData.id).toBe(id);
    }
  });

  it('las piezas chicas tienen una zona de toque más grande que ellas', () => {
    for (const p of modelo.piezas.values()) {
      if (!p.toque) continue;
      const pieza = new Box3().setFromObject(p.malla);
      const toque = new Box3().setFromObject(p.toque);
      expect(toque.containsBox(pieza)).toBe(true);
    }
  });

  it('todo cabe entre la boca de las toberas y la punta de la cofia', () => {
    const caja = new Box3().setFromObject(modelo.grupo);
    expect(caja.min.y).toBeGreaterThanOrEqual(0);
    expect(caja.max.y).toBeLessThanOrEqual(ALTO + 0.01);
    expect(caja.max.x).toBeLessThan(RADIO + 2);
  });

  it('las piezas que se recortan son las que tapan el interior', () => {
    const recortables = [...modelo.piezas.values()]
      .filter((p) => p.recortable)
      .map((p) => p.id)
      .sort();
    expect(recortables).toEqual(
      [
        'cofia',
        'interetapa',
        'tanque-combustible-1',
        'tanque-combustible-2',
        'tanque-oxigeno-1',
        'tanque-oxigeno-2',
      ].sort(),
    );
  });
});
