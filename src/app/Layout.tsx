import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Navegacion } from '../componentes/Navegacion/Navegacion';
import { Cabecera } from '../componentes/Cabecera/Cabecera';
import { Fondo3D } from '../componentes/Fondo3D/Fondo3D';
import { useEsEscritorio } from './escritorio';
import {
  useModoRojo,
  usePedirUbicacionUnaVez,
  useReloj,
} from '../estado/hooks';
import './Layout.css';

/** Marco común: fondo 3D, cabecera, la pantalla activa y la navegación; en escritorio la cabecera va dentro de la barra superior. */
export function Layout() {
  const escritorio = useEsEscritorio();
  useReloj();
  usePedirUbicacionUnaVez();
  useModoRojo();

  return (
    <>
      <Fondo3D />
      {escritorio && <Cabecera />}
      <main className="app">
        {!escritorio && <Cabecera />}
        <Suspense fallback={null}>
          <Outlet />
        </Suspense>
      </main>
      <Navegacion />
    </>
  );
}
