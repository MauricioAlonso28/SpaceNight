import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { Layout } from './Layout';
import { RUTA_AJUSTES, RUTA_INICIAL } from './rutas';
import { EstaNoche } from '../pantallas/EstaNoche/EstaNoche';
import { Mapa } from '../pantallas/Mapa/Mapa';
import { Camara } from '../pantallas/Camara/Camara';
import { Explorar } from '../pantallas/Explorar/Explorar';
import { Ajustes } from '../pantallas/Ajustes/Ajustes';

/** Raíz de la app: HashRouter para que GitHub Pages no dé 404 al recargar. */
export function App() {
  return (
    <HashRouter>
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
