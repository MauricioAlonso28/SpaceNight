import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { BarraInferior } from '../componentes/BarraInferior/BarraInferior';
import { Cabecera } from '../componentes/Cabecera/Cabecera';
import { Fondo3D } from '../componentes/Fondo3D/Fondo3D';
import {
  useModoRojo,
  usePedirUbicacionUnaVez,
  useReloj,
} from '../estado/hooks';
import './Layout.css';

/** Marco común: fondo 3D, cabecera, la pantalla activa y la barra inferior. */
export function Layout() {
  useReloj();
  usePedirUbicacionUnaVez();
  useModoRojo();

  return (
    <>
      <Fondo3D />
      <main className="app">
        <Cabecera />
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <BarraInferior />
    </>
  );
}
