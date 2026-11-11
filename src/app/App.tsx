import { lazy, useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router';
import { useEstado } from '../estado/store';
import { fijarIdioma, resolverIdioma } from '../idioma/idioma';
import { EstaNoche } from '../pantallas/EstaNoche/EstaNoche';
import { Layout } from './Layout';
import { DESTINO_INICIAL, RUTA_AJUSTES } from './rutas';

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
const Cohete = lazy(() =>
  import('../pantallas/Cohete/Cohete').then((m) => ({ default: m.Cohete })),
);
const Lanzamientos = lazy(() =>
  import('../pantallas/Cohete/Lanzamientos').then((m) => ({
    default: m.Lanzamientos,
  })),
);
const Vuelo = lazy(() =>
  import('../pantallas/Cohete/Vuelo').then((m) => ({ default: m.Vuelo })),
);
const Arma = lazy(() =>
  import('../pantallas/Cohete/Arma').then((m) => ({ default: m.Arma })),
);
const Comparador = lazy(() =>
  import('../pantallas/Cohete/Comparador').then((m) => ({
    default: m.Comparador,
  })),
);
const Motores = lazy(() =>
  import('../pantallas/Cohete/Motores').then((m) => ({ default: m.Motores })),
);
const Historia = lazy(() =>
  import('../pantallas/Cohete/Historia').then((m) => ({
    default: m.Historia,
  })),
);
const NasaInicio = lazy(() =>
  import('../pantallas/Nasa/NasaInicio').then((m) => ({
    default: m.NasaInicio,
  })),
);
const Asteroides = lazy(() =>
  import('../pantallas/Nasa/Asteroides').then((m) => ({
    default: m.Asteroides,
  })),
);
const Tierra = lazy(() =>
  import('../pantallas/Nasa/Tierra').then((m) => ({ default: m.Tierra })),
);
const Eventos = lazy(() =>
  import('../pantallas/Nasa/Eventos').then((m) => ({ default: m.Eventos })),
);
const Bolidos = lazy(() =>
  import('../pantallas/Nasa/Bolidos').then((m) => ({ default: m.Bolidos })),
);
const Exoplanetas = lazy(() =>
  import('../pantallas/Nasa/Exoplanetas').then((m) => ({
    default: m.Exoplanetas,
  })),
);
const Archivo = lazy(() =>
  import('../pantallas/Nasa/Archivo').then((m) => ({ default: m.Archivo })),
);
const SolLuna = lazy(() =>
  import('../pantallas/Nasa/SolLuna').then((m) => ({ default: m.SolLuna })),
);
const Naves = lazy(() =>
  import('../pantallas/Nasa/Naves').then((m) => ({ default: m.Naves })),
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
          <Route index element={<Navigate to={DESTINO_INICIAL} replace />} />
          <Route path="esta-noche" element={<EstaNoche />} />
          <Route path="mapa" element={<Mapa />} />
          <Route path="camara" element={<Camara />} />
          <Route path="explorar" element={<Explorar />} />
          <Route path="cohete" element={<Cohete />} />
          <Route path="cohete/lanzamientos" element={<Lanzamientos />} />
          <Route path="cohete/vuelo" element={<Vuelo />} />
          <Route path="cohete/arma" element={<Arma />} />
          <Route path="cohete/escala" element={<Comparador />} />
          <Route path="cohete/motores" element={<Motores />} />
          <Route path="cohete/historia" element={<Historia />} />
          <Route path="nasa" element={<NasaInicio />} />
          <Route path="nasa/asteroides" element={<Asteroides />} />
          <Route path="nasa/tierra" element={<Tierra />} />
          <Route path="nasa/eventos" element={<Eventos />} />
          <Route path="nasa/sol-luna" element={<SolLuna />} />
          <Route path="nasa/naves" element={<Naves />} />
          <Route path="nasa/bolidos" element={<Bolidos />} />
          <Route path="nasa/exoplanetas" element={<Exoplanetas />} />
          <Route path="nasa/archivo" element={<Archivo />} />
          <Route path={RUTA_AJUSTES.path} element={<Ajustes />} />
          <Route path="*" element={<Navigate to={DESTINO_INICIAL} replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
