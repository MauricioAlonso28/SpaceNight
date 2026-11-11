import { describe, expect, it } from 'vitest';
import { RUTA_AJUSTES, RUTA_INICIAL, RUTAS_BARRA } from '../src/app/rutas';

describe('rutas', () => {
  it('la barra de navegación tiene las cinco pantallas en orden', () => {
    expect(RUTAS_BARRA.map((r) => r.path)).toEqual([
      'esta-noche',
      'mapa',
      'camara',
      'explorar',
      'cohete',
    ]);
  });

  it('la ruta inicial es una pantalla de la barra', () => {
    expect(RUTAS_BARRA.some((r) => r.path === RUTA_INICIAL)).toBe(true);
  });

  it('ajustes no está en la barra de navegación', () => {
    expect(RUTAS_BARRA.some((r) => r.path === RUTA_AJUSTES.path)).toBe(false);
  });
});
