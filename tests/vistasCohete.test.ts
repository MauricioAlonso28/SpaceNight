import { describe, expect, it } from 'vitest';
import catalogoJson from '../public/data/cohete.json';
import { crearModelo } from '../src/3d/cohete/modelo';
import {
  VISTA_GENERAL,
  giroCorto,
  interpolarVista,
  vistaDePieza,
} from '../src/3d/cohete/vistas';
import {
  enOrdenDeRecorrido,
  type CatalogoCohete,
} from '../src/pantallas/Cohete/catalogo';

const catalogo = catalogoJson as CatalogoCohete;
const modelo = crearModelo();

describe('vistas de la cámara del cohete', () => {
  it('gira por el camino más corto al cruzar el norte', () => {
    expect(giroCorto(350, 10)).toBe(20);
    expect(giroCorto(10, 350)).toBe(-20);
    const medio = interpolarVista(
      { ...VISTA_GENERAL, azimut: 350 },
      { ...VISTA_GENERAL, azimut: 10 },
      0.5,
    );
    expect(medio.azimut).toBeCloseTo(0);
  });

  it('en los extremos devuelve las vistas de origen y destino', () => {
    const a = { azimut: 10, elevacion: 0, distancia: 20, objetivoY: 5 };
    const b = { azimut: 90, elevacion: 30, distancia: 60, objetivoY: 50 };
    expect(interpolarVista(a, b, 0)).toEqual(a);
    expect(interpolarVista(a, b, 1)).toEqual(b);
  });

  it('mira de frente a una pieza que está a un lado del cohete', () => {
    const aleta = modelo.piezas.get('aletas-rejilla')!;
    const v = vistaDePieza(aleta);
    const esperado =
      ((Math.atan2(aleta.ancla.x, aleta.ancla.z) * 180) / Math.PI + 360) % 360;
    expect(v.azimut).toBeCloseTo(esperado);
    expect(v.objetivoY).toBeCloseTo(aleta.ancla.y);
  });

  it('mira las toberas desde abajo', () => {
    expect(vistaDePieza(modelo.piezas.get('tobera')!).elevacion).toBeLessThan(
      0,
    );
  });

  it('el recorrido baja de la punta a los motores', () => {
    const alturas = enOrdenDeRecorrido(catalogo.componentes)
      .filter((c) => c.tipo === 'pieza')
      .map((c) => modelo.piezas.get(c.id)!.ancla.y);
    const zonas = [alturas.slice(0, 4), alturas.slice(-7)];
    expect(Math.min(...zonas[0])).toBeGreaterThan(Math.max(...zonas[1]));
  });

  it('cada material dice en qué piezas se usa, y esas piezas existen', () => {
    for (const c of catalogo.componentes.filter((c) => c.tipo === 'material')) {
      expect(c.usadoEn?.length).toBeGreaterThan(0);
      for (const id of c.usadoEn!) {
        expect(id === 'casco' || modelo.piezas.has(id)).toBe(true);
      }
    }
  });
});
