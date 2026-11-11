import { describe, expect, it } from 'vitest';
import {
  imagenDe,
  masFrecuente,
  urlBusqueda,
} from '../src/servicios/nasa/imagenes';

describe('archivo de imágenes', () => {
  it('elige la versión pequeña para el mosaico, la grande para el visor y guarda la proporción', () => {
    const base = 'http://images-assets.nasa.gov/image/x/x';
    const img = imagenDe({
      href: 'h',
      data: [
        {
          nasa_id: 'as11 40',
          title: 'Aldrin',
          description: '<p>Buzz</p> en la Luna',
          date_created: '1969-07-20T00:00:00Z',
          center: 'JSC',
        },
      ],
      links: [
        { href: `${base}~thumb.jpg`, rel: 'preview', width: 487, height: 640 },
        {
          href: `${base}~small.jpg`,
          rel: 'alternate',
          width: 487,
          height: 640,
        },
        {
          href: `${base}~large.jpg`,
          rel: 'alternate',
          width: 1463,
          height: 1920,
        },
      ],
    })!;
    expect(img.mosaico).toBe(
      'https://images-assets.nasa.gov/image/x/x~small.jpg',
    );
    expect(img.grande).toBe(
      'https://images-assets.nasa.gov/image/x/x~large.jpg',
    );
    expect([img.ancho, img.alto]).toEqual([487, 640]);
    expect(img.descripcion).toBe('Buzz en la Luna');
    expect(img.pagina).toBe('https://images.nasa.gov/details/as11%2040');
    expect(imagenDe({ href: 'h', data: [], links: [] })).toBeNull();
  });

  it('arma la búsqueda paginada y cuenta el centro más frecuente', () => {
    expect(urlBusqueda(' Apollo 11 ', 2)).toBe(
      'https://images-api.nasa.gov/search?q=Apollo%2011&media_type=image&page_size=36&page=2',
    );
    expect(masFrecuente(['JSC', 'KSC', 'JSC', null])).toBe('JSC');
    expect(masFrecuente([])).toBeNull();
  });
});
