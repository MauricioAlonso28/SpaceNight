# Tu cielo esta noche

Web app personal que muestra qué hay en el cielo de Lima cada noche: la Luna, los
planetas, la Estación Espacial, el clima y los eventos del mes. Todo se calcula en
el navegador y se publica en GitHub Pages.

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
