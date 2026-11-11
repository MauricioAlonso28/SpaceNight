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
