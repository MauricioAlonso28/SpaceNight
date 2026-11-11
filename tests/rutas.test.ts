import { resolvePath } from 'react-router';
import { describe, expect, it } from 'vitest';
import {
  DESTINO_INICIAL,
  GRUPOS,
  RUTA_AJUSTES,
  RUTA_INICIAL,
  RUTAS_BARRA,
  RUTAS_NASA,
} from '../src/app/rutas';

describe('rutas', () => {
  it('la barra del móvil tiene las cuatro pantallas del cielo en orden', () => {
    expect(RUTAS_BARRA.map((r) => r.path)).toEqual([
      'esta-noche',
      'mapa',
      'camara',
      'explorar',
    ]);
  });

  it('el panel lista cielo, cohete y NASA en vivo con sus ocho vistas', () => {
    expect(GRUPOS.map((g) => g.id)).toEqual(['cielo', 'cohete', 'nasa']);
    expect(RUTAS_NASA).toHaveLength(8);
    const todas = GRUPOS.flatMap((g) => g.rutas.map((r) => r.path));
    expect(new Set(todas).size).toBe(todas.length);
    expect(todas).toContain('cohete');
  });

  it('la ruta inicial es una pantalla de la barra', () => {
    expect(RUTAS_BARRA.some((r) => r.path === RUTA_INICIAL)).toBe(true);
  });

  it('ajustes no está en la barra de navegación', () => {
    expect(RUTAS_BARRA.some((r) => r.path === RUTA_AJUSTES.path)).toBe(false);
  });

  it('una ruta que no existe redirige a la inicial, no a una ruta anidada', () => {
    for (const desde of ['/no-existe', '/cohete/algo', '/']) {
      expect(resolvePath(DESTINO_INICIAL, desde).pathname).toBe('/esta-noche');
    }
  });

  it('el destino relativo es el que crecía sin fin', () => {
    expect(resolvePath(RUTA_INICIAL, '/no-existe').pathname).toBe(
      '/no-existe/esta-noche',
    );
  });
});
