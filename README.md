# SpaceNight

Web app personal que muestra qué hay en el cielo de Lima cada noche: la Luna, los
planetas, la Estación Espacial, el clima y los eventos del mes. Todo se calcula en
el navegador y se publica en GitHub Pages.

La interfaz está en inglés por defecto y pasa a español si el navegador lo
prefiere; en Ajustes se puede fijar el idioma. Los textos de cada pantalla
están junto a ella, en un objeto `ES` y su traducción `EN` (ver `src/idioma/`).

## Comandos

```bash
npm install
npm run dev           # servidor local
npm test              # pruebas con Vitest
npm run lint          # oxlint
npm run format        # Prettier
npm run build         # compila a dist/
```

Cada push a `main` pasa lint, formato, pruebas y build, y publica `dist/` en
GitHub Pages. Las rutas usan hash (`#/esta-noche`) para que recargar no dé 404.

Es una PWA: se puede instalar en el móvil y funciona sin conexión (el service
worker guarda la app, los catálogos y las tipografías; el clima y la órbita de
la Estación usan la última copia guardada).

## Datos

Los catálogos de `public/data/` se regeneran con los scripts de `scripts/`
(estrellas HYG, constelaciones de d3-celestial y mapa del mundo de Natural
Earth). Las fuentes y licencias están en `public/data/LICENCIAS.md`.

## NASA en vivo

Ocho vistas con datos de la NASA (`#/nasa`): asteroides (semana, 60 días y
recién descubiertos), la Tierra (EPIC y mapa por satélite de GIBS), Sol y Luna
(SDO y Dial-A-Moon), naves lejanas (Horizons), eventos naturales, bólidos y
Sentry, exoplanetas y el archivo de imágenes con la foto del día. Hay avisos en vivo en la campana de la cabecera.

- EONET, EPIC y la biblioteca de imágenes se piden en vivo desde el navegador.
- NeoWs, JPL Fireball, JPL Sentry y el Exoplanet Archive no se pueden pedir
  desde el navegador (falta CORS o hace falta clave). `npm run datos:nasa`
  (`scripts/datos-nasa.mjs`) los descarga y recorta en `public/data/nasa/`.
  Corre solo antes de cada `npm run build`, así que cada despliegue los
  refresca. Esos archivos no se guardan en git.
- La clave de NeoWs sale de `NASA_API_KEY`, en `.env.local` (ignorado por git) o en el entorno. Sin ella se usa
  `DEMO_KEY`, que admite 10 consultas por hora.

El flujo de despliegue corre también cada 6 horas (`schedule`) y pasa
`NASA_API_KEY` desde los secretos del repo al paso de build.

## Cohete

Además del cohete en 3D (solo escritorio), la sección tiene vistas para
cualquier pantalla: los próximos lanzamientos del mundo (Launch Library 2, de
The Space Devs, descargado por el mismo `scripts/datos-nasa.mjs` en
`public/data/nasa/lanzamientos.json`), con cuenta atrás, secuencia de vuelo y
avisos en la campana para los que despegan en las próximas 6 horas.

El simulador de vuelo (`#/cohete/vuelo`) integra paso a paso un cohete de dos
etapas con los números públicos del Falcon 9 (`src/servicios/cohete/vuelo.ts`):
gravedad, atmósfera exponencial, empuje que cambia con la presión y guiado
sencillo. La carga y el modo de recuperación cambian si llega a órbita. La
pestaña de aterrizaje simula el regreso de la primera etapa (encendido de
regreso, reentrada y aterrizaje con un motor) en barcaza o en la base.

«Arma tu cohete» (`#/cohete/arma`) aplica la ecuación de Tsiolkovsky etapa por
etapa (`src/servicios/cohete/tsiolkovsky.ts`) y compara el Δv con el que hace
falta para la órbita baja, la geoestacionaria, la Luna, Marte y Júpiter.
