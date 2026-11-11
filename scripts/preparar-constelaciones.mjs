/**
 * Junta las líneas y los nombres en español de las constelaciones de d3-celestial en public/data/constelaciones.json.
 * Uso: node scripts/preparar-constelaciones.mjs <constellations.lines.json> <constellations.json>
 * Fuente: https://github.com/ofrohn/d3-celestial (BSD-3-Clause, Copyright (c) 2015, Olaf Frohn).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SALIDA = new URL('../public/data/constelaciones.json', import.meta.url);

/** Longitud de d3-celestial (−180 a 180) a ascensión recta en grados (0 a 360). */
function ar(lon) {
  return Math.round((((lon % 360) + 360) % 360) * 1000) / 1000;
}

/** Espacios normales en lugar de los de no separación que trae la fuente. */
function limpiar(texto) {
  return texto.replace(/\s+/g, ' ').trim();
}

const [rutaLineas, rutaNombres] = process.argv.slice(2);
if (!rutaLineas || !rutaNombres) {
  console.error(
    'Uso: node scripts/preparar-constelaciones.mjs <lines.json> <constellations.json>',
  );
  process.exit(1);
}
const lineas = JSON.parse(readFileSync(rutaLineas, 'utf8')).features;
const nombres = new Map(
  JSON.parse(readFileSync(rutaNombres, 'utf8')).features.map((f) => [f.id, f]),
);

const constelaciones = lineas.map((f) => {
  const n = nombres.get(f.id) ?? nombres.get(f.id.replace(/\d$/, ''));
  const [lon, lat] = n.properties.display ?? n.geometry.coordinates;
  return {
    id: f.id,
    nombre: limpiar(n.properties.es ?? n.properties.name),
    latin: limpiar(n.properties.name),
    centro: [ar(lon), lat],
    lineas: f.geometry.coordinates.map((tramo) =>
      tramo.map(([lo, la]) => [ar(lo), Math.round(la * 1000) / 1000]),
    ),
  };
});

writeFileSync(
  SALIDA,
  JSON.stringify({
    fuente: 'd3-celestial, Olaf Frohn (github.com/ofrohn/d3-celestial)',
    licencia:
      'BSD-3-Clause. Copyright (c) 2015, Olaf Frohn. All rights reserved.',
    constelaciones,
  }),
);
console.log(`${constelaciones.length} constelaciones`);
