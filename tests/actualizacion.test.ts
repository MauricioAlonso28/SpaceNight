import { describe, expect, it, vi } from 'vitest';
import {
  alCambiarControlador,
  aplicarVersionNueva,
} from '../src/app/actualizacion';

describe('actualización de versión', () => {
  it('recarga en el acto si la página acaba de abrirse', () => {
    const recargar = vi.fn();
    alCambiarControlador(1_000, 4_000, false, recargar);
    expect(recargar).toHaveBeenCalledOnce();
  });

  it('recarga en el acto si la pestaña no se ve', () => {
    const recargar = vi.fn();
    alCambiarControlador(0, 600_000, true, recargar);
    expect(recargar).toHaveBeenCalledOnce();
  });

  it('con la página en uso espera al próximo cambio de pantalla, y solo una vez', () => {
    const recargar = vi.fn();
    alCambiarControlador(0, 600_000, false, recargar);
    expect(recargar).not.toHaveBeenCalled();
    aplicarVersionNueva(recargar);
    aplicarVersionNueva(recargar);
    expect(recargar).toHaveBeenCalledOnce();
  });

  it('sin versión nueva, cambiar de pantalla no recarga', () => {
    const recargar = vi.fn();
    aplicarVersionNueva(recargar);
    expect(recargar).not.toHaveBeenCalled();
  });
});
