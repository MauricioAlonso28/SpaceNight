import { lazy, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { useEstado } from '../estado/store';
import { fijarIdioma, resolverIdioma } from '../idioma/idioma';
import { EstaNoche } from '../pantallas/EstaNoche/EstaNoche';
import { Layout } from './Layout';
import { RUTA_AJUSTES, RUTA_INICIAL } from './rutas';

const Mapa = lazy(() =>
  import('../pantallas/Mapa/Mapa').then((m) => ({ default: m.Mapa })),
);
const Camara = lazy(() =>
  import('../pantallas/Camara/Camara').then((m) => ({ default: m.Camara })),
);
const Explorar = lazy(() =>
  import('../pantallas/Explorar/Explorar').then((m) => ({
    default: m.Explorar,
  })),
);
const Ajustes = lazy(() =>
  import('../pantallas/Ajustes/Ajustes').then((m) => ({ default: m.Ajustes })),
);

/** Raíz de la app: fija el idioma y monta el HashRouter, para que GitHub Pages no dé 404 al recargar. */
export function App() {
  const preferencia = useEstado((s) => s.ajustes.idioma);
  const idioma = resolverIdioma(preferencia);
  fijarIdioma(idioma);

  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  return (
    <HashRouter key={idioma}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to={RUTA_INICIAL} replace />} />
          <Route path="esta-noche" element={<EstaNoche />} />
          <Route path="mapa" element={<Mapa />} />
          <Route path="camara" element={<Camara />} />
          <Route path="explorar" element={<Explorar />} />
          <Route path={RUTA_AJUSTES.path} element={<Ajustes />} />
          <Route path="*" element={<Navigate to={RUTA_INICIAL} replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
