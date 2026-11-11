import { describe, expect, it } from 'vitest';
import { RUTA_AJUSTES, RUTA_INICIAL, RUTAS_BARRA } from '../src/app/rutas';

describe('rutas', () => {
  it('la barra inferior tiene las cuatro pantallas en orden', () => {
    expect(RUTAS_BARRA.map((r) => r.path)).toEqual([
      'esta-noche',
      'mapa',
      'camara',
      'explorar',
    ]);
  });

  it('la ruta inicial es una pantalla de la barra', () => {
    expect(RUTAS_BARRA.some((r) => r.path === RUTA_INICIAL)).toBe(true);
  });

  it('ajustes no está en la barra inferior', () => {
    expect(RUTAS_BARRA.some((r) => r.path === RUTA_AJUSTES.path)).toBe(false);
  });
});
