/**
 * Convierte el contorno de tierras de Natural Earth (1:110 m) en un trazado SVG equirrectangular en public/data/mundo.json.
 * Uso: node scripts/preparar-mundo.mjs <ne_110m_land.geojson>
 * Fuente: https://www.naturalearthdata.com (dominio público).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SALIDA = new URL('../public/data/mundo.json', import.meta.url);

/** Un anillo de coordenadas [lon, lat] a un subtrazado SVG con x = lon + 180 e y = 90 − lat. */
function anillo(coordenadas) {
  return (
    coordenadas
      .map(([lon, lat], i) => {
        const x = Math.round((lon + 180) * 10) / 10;
        const y = Math.round((90 - lat) * 10) / 10;
        return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
      })
      .join('') + 'Z'
  );
}

const ruta = process.argv[2];
if (!ruta) {
  console.error('Uso: node scripts/preparar-mundo.mjs <ne_110m_land.geojson>');
  process.exit(1);
}
const tierras = JSON.parse(readFileSync(ruta, 'utf8')).features;
const trazado = tierras
  .flatMap((f) =>
    f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates,
  )
  .map((poligono) => anillo(poligono[0]))
  .join('');

writeFileSync(
  SALIDA,
  JSON.stringify({
    fuente: 'Natural Earth, ne_110m_land (www.naturalearthdata.com)',
    licencia: 'Dominio público',
    ancho: 360,
    alto: 180,
    trazado,
  }),
);
console.log(`${tierras.length} tierras, ${trazado.length} caracteres`);
