import { describe, expect, it } from 'vitest';
import {
  anguloSolNave,
  horaSolar,
  instanteFoto,
  urlFoto,
  type FotoEpic,
} from '../src/servicios/nasa/epic';

const foto: FotoEpic = {
  identifier: '20261109005515',
  image: 'epic_1b_20261109005515',
  date: '2026-11-09 00:55:15',
  centroid_coordinates: { lat: -9.88, lon: 152.97 },
  dscovr_j2000_position: { x: 1_000_000, y: 100_000, z: 0 },
  sun_j2000_position: { x: 150_000_000, y: 0, z: 0 },
};

describe('EPIC', () => {
  it('la fecha de la API es UTC', () => {
    expect(instanteFoto(foto)).toBe(Date.UTC(2026, 10, 9, 0, 55, 15));
  });

  it('arma la dirección de la foto y de la miniatura por fecha', () => {
    expect(urlFoto(foto)).toBe(
      'https://epic.gsfc.nasa.gov/archive/natural/2026/11/09/jpg/epic_1b_20261109005515.jpg',
    );
    expect(urlFoto(foto, 'thumbs')).toContain(
      '/thumbs/epic_1b_20261109005515.jpg',
    );
  });

  it('el ángulo Sol–nave sale de los dos vectores', () => {
    expect(anguloSolNave(foto)).toBeCloseTo(5.71, 1);
  });

  it('hora solar: 0:55 UTC a 153° E son casi las 11:07', () => {
    expect(horaSolar(instanteFoto(foto), 152.97)).toBeCloseTo(11.11, 1);
    expect(horaSolar(Date.UTC(2026, 0, 1, 2), -75)).toBeCloseTo(21, 5);
  });
});
