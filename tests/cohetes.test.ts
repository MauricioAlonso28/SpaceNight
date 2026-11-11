import { describe, expect, it } from 'vitest';
import {
  COHETES,
  altoDibujado,
  ordenarCohetes,
} from '../src/servicios/cohete/cohetes';

describe('cohetes a escala', () => {
  it('cada silueta mide lo mismo que la altura publicada', () => {
    for (const c of COHETES) expect(altoDibujado(c)).toBeCloseTo(c.alto, 5);
  });

  it('los propulsores laterales no pasan de la altura del cohete', () => {
    for (const c of COHETES.filter((x) => x.laterales)) {
      expect(c.laterales!.desde + c.laterales!.alto).toBeLessThanOrEqual(
        c.alto,
      );
    }
  });

  it('ids únicos y textos en los dos idiomas', () => {
    expect(new Set(COHETES.map((c) => c.id)).size).toBe(COHETES.length);
    for (const c of COHETES) {
      expect(c.dato.es.length).toBeGreaterThan(20);
      expect(c.dato.en.length).toBeGreaterThan(20);
    }
  });

  it('ordena por altura, año y carga, con los sin carga al principio', () => {
    expect(ordenarCohetes(COHETES, 'alto').at(-1)?.id).toBe('starship');
    expect(ordenarCohetes(COHETES, 'anio')[0].id).toBe('v2');
    const porCarga = ordenarCohetes(COHETES, 'leo');
    expect(porCarga[0].leo).toBeNull();
    expect(porCarga.at(-1)?.id).toBe('saturnv');
  });
});
