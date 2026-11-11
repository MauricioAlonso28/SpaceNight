# Licencias de los datos

Los archivos de `public/data/` vienen de estas fuentes. Se regeneran con los scripts de `scripts/`.

## estrellas.json

- Fuente: [HYG Database v4.1](https://github.com/astronexus/HYG-Database), de astronexus.
- Licencia: [Creative Commons Attribution-ShareAlike 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Cambios: solo las estrellas hasta magnitud 5,5, con ascensión recta pasada a grados y las letras de Bayer en griego. Por la cláusula ShareAlike, `estrellas.json` se comparte con la misma licencia CC BY-SA 4.0.
- Generado con `node scripts/preparar-estrellas.mjs <hygdata_v41.csv>`.

## constelaciones.json

- Fuente: [d3-celestial](https://github.com/ofrohn/d3-celestial), de Olaf Frohn (`data/constellations.lines.json` y `data/constellations.json`).
- Licencia: BSD-3-Clause, texto completo abajo.
- Cambios: longitudes pasadas a ascensión recta de 0 a 360°, nombres en español y espacios normalizados.
- Generado con `node scripts/preparar-constelaciones.mjs <constellations.lines.json> <constellations.json>`.

````
Copyright (c) 2015, Olaf Frohn
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.```

## lluvias-2026-2027.json

- Fechas de pico y tasas típicas del calendario de la [International Meteor Organization](https://www.imo.net/), copiadas a mano.
````

## mundo.json

- Fuente: [Natural Earth](https://www.naturalearthdata.com), capa `ne_110m_land`.
- Licencia: dominio público.
- Generado con `node scripts/preparar-mundo.mjs <ne_110m_land.geojson>` (proyección equirrectangular de 360 × 180).

## planetas.json

- Datos de las [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/), redactados a mano. La distancia a la Tierra no está aquí: se calcula en el momento con Astronomy Engine.

## Tipografías (public/fuentes)

- Cormorant Garamond, de Christian Thalmann, e IBM Plex Sans, de IBM. Archivos `woff2` del subconjunto latino, tomados de Fontsource.
- Licencia: [SIL Open Font License 1.1](https://openfontlicense.org).
