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

## ../texturas/*.webp

- Fuente: [Solar System Scope](https://www.solarsystemscope.com/textures/), texturas de 2k del Sol, la Luna, Mercurio, Venus (atmósfera), Marte, Júpiter, Saturno, el anillo de Saturno y la Tierra (mapa diurno).
- Licencia: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).
- Cambios: reducidas a 1024 × 512 (el anillo a 1024 × 64; la Tierra queda en 2048 × 1024 para el globo) y pasadas a WebP.

## ../modelos/*.glb

- Fuente: [NASA 3D Resources](https://science.nasa.gov/3d-resources/), descargados el 11 de noviembre de 2026. Todos van sin cambios salvo el Saturno V.
  - `saturno-v.glb`: [Saturn V](https://science.nasa.gov/3d-resources/saturn-v/), crédito NASA/Michael D. Carbajal. Partido en sus ocho piezas (S-IC, S-II, S-IVB, unidad de instrumentos, adaptador, módulo de servicio, módulo de mando y torre de escape) con `node scripts/despiezar-saturno.mjs <saturn_v.glb>`, que corta el cuerpo por alturas y quita unas animaciones vacías de la exportación. Las mallas, materiales y texturas son las de la NASA.
  - `transbordador.glb`: [Space Shuttle (D)](https://science.nasa.gov/3d-resources/space-shuttle-d/), crédito NASA/Johnson Space Center.
  - `tanque-externo.glb` y `propulsor-solido.glb`: [Space Shuttle Parts](https://science.nasa.gov/3d-resources/space-shuttle-parts/), crédito NASA/Johnson Space Center.
- Uso: la NASA no otorga licencias sobre su material; según sus [pautas de uso de imágenes y medios](https://www.nasa.gov/nasa-brand-center/images-and-media/), los modelos 3D de la NASA en general no tienen derechos de autor en Estados Unidos. Se cita a la NASA como fuente y nada aquí sugiere que la NASA respalde esta app. Las marcas que se ven en los modelos (por ejemplo, en las alas del transbordador) son parte del vehículo real tal como la NASA lo publicó; la app no las usa como logotipo propio.

## Decodificador Draco

- El transbordador viene comprimido con [Draco](https://github.com/google/draco), de Google. Su decodificador (`draco_decoder.wasm` y `draco_wasm_wrapper.js`) viene con three.js en `three/examples/jsm/libs/draco/gltf/`, y Vite lo copia a `assets/` al compilar; solo se descarga al abrir ese modelo.
- Licencia: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0).

## nasa/*.json y NASA en vivo

Los genera `scripts/datos-nasa.mjs` en cada despliegue. Las fuentes en vivo se piden desde el navegador.

- [NASA NeoWs](https://api.nasa.gov/): asteroides que pasan cerca de la Tierra.
- [JPL Fireball](https://ssd-api.jpl.nasa.gov/doc/fireball.html): bólidos registrados por sensores del gobierno de EE. UU.
- [JPL Sentry](https://ssd-api.jpl.nasa.gov/doc/sentry.html): lista de vigilancia de impactos.
- [NASA Exoplanet Archive](https://exoplanetarchive.ipac.caltech.edu/), tabla `pscomppars`: operado por Caltech/IPAC para la NASA.
- En vivo: [NASA EONET](https://eonet.gsfc.nasa.gov/), [NASA EPIC](https://epic.gsfc.nasa.gov/) (cámara de la nave DSCOVR de NOAA) y la [NASA Image and Video Library](https://images.nasa.gov/).
- Uso: los datos y la mayoría de las imágenes de la NASA no tienen derechos de autor en EE. UU. según sus [pautas de uso](https://www.nasa.gov/nasa-brand-center/images-and-media/). Se cita la fuente de cada uno y nada aquí sugiere que la NASA respalde esta app. Algunas imágenes del archivo pueden tener créditos de terceros, que se ven en su página de images.nasa.gov.
