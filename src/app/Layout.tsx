import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Navegacion } from '../componentes/Navegacion/Navegacion';
import { Cabecera } from '../componentes/Cabecera/Cabecera';
import { Fondo3D } from '../componentes/Fondo3D/Fondo3D';
import { MotorAvisos } from '../componentes/Avisos/MotorAvisos';
import { useEsEscritorio } from './escritorio';
import {
  useModoRojo,
  usePedirUbicacionUnaVez,
  useReloj,
} from '../estado/hooks';
import './Layout.css';

/** Marco común: fondo 3D, cabecera, la pantalla activa y la navegación; en escritorio la cabecera va dentro de la barra superior. Cada pantalla nueva empieza arriba del todo. */
export function Layout() {
  const escritorio = useEsEscritorio();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  useReloj();
  usePedirUbicacionUnaVez();
  useModoRojo();

  return (
    <>
      <Fondo3D />
      <MotorAvisos />
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
