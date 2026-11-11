import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { GRUPOS, RUTAS_BARRA, nombreRuta } from '../../app/rutas';
import { useEsEscritorio } from '../../app/escritorio';
import { useAvisosActivos } from '../../estado/avisos';
import { textos } from '../../idioma/idioma';
import { ICONOS } from './iconos';
import './Navegacion.css';

const CLAVE_ABIERTO = 'tu-cielo:panel-abierto';

/** Ancho que ocupa el panel en escritorio, abierto o en riel. */
const ANCHO = { abierto: '256px', riel: '68px' };

const ES = {
  pantallas: 'Pantallas',
  abrir: 'Abrir el menú',
  cerrar: 'Cerrar el menú',
  mas: 'Más',
};

const EN: typeof ES = {
  pantallas: 'Screens',
  abrir: 'Open the menu',
  cerrar: 'Close the menu',
  mas: 'More',
};

function leerAbierto(): boolean {
  try {
    return localStorage.getItem(CLAVE_ABIERTO) !== '0';
  } catch {
    return true;
  }
}

function guardarAbierto(si: boolean): void {
  try {
    localStorage.setItem(CLAVE_ABIERTO, si ? '1' : '0');
  } catch {
    return;
  }
}

/** Icono de una pantalla por su ruta. */
function Icono({ clave }: { clave: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {ICONOS[clave]}
    </svg>
  );
}

/**
 * Navegación: en escritorio un panel a la izquierda que el botón ☰ abre y deja en riel de iconos, y recuerda cómo quedó;
 * en el móvil la barra inferior con las cuatro pantallas del cielo y Más, que abre una hoja desde abajo con el resto en filas de tres.
 */
export function Navegacion() {
  const t = textos({ es: ES, en: EN });
  const escritorio = useEsEscritorio();
  const ruta = useLocation().pathname;
  const [abiertoEscritorio, setAbiertoEscritorio] = useState(leerAbierto);
  const [abiertoEn, setAbiertoEn] = useState<string | null>(null);
  const abiertoMovil = abiertoEn === ruta;
  const setAbiertoMovil = (si: boolean) => setAbiertoEn(si ? ruta : null);
  const abierto = escritorio ? abiertoEscritorio : abiertoMovil;
  const conAviso = new Set(useAvisosActivos().nuevos.map((a) => a.ruta));

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--riel',
      escritorio ? ANCHO[abiertoEscritorio ? 'abierto' : 'riel'] : '0px',
    );
    window.dispatchEvent(new Event('resize'));
  }, [escritorio, abiertoEscritorio]);

  useEffect(() => {
    if (escritorio || !abiertoMovil) return;
    const alTeclear = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setAbiertoEn(null);
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [escritorio, abiertoMovil]);

  const alternar = () => {
    if (escritorio) {
      guardarAbierto(!abiertoEscritorio);
      setAbiertoEscritorio(!abiertoEscritorio);
    } else setAbiertoMovil(!abiertoMovil);
  };

  return (
    <>
      {escritorio && (
        <aside
          className={`panel-nav${abierto ? ' abierto' : ''}`}
          aria-label={t.pantallas}
        >
          <button
            type="button"
            className="panel-boton"
            aria-expanded={abierto}
            aria-controls="panel-lista"
            aria-label={abierto ? t.cerrar : t.abrir}
            onClick={alternar}
          >
            <Icono clave="mas" />
          </button>
          <nav id="panel-lista">
            {GRUPOS.map((g) => (
              <div key={g.id} className="panel-grupo">
                <p className="panel-titulo">{textos(g.nombre)}</p>
                {g.rutas.map((r) => (
                  <NavLink
                    key={r.path}
                    to={`/${r.path}`}
                    end
                    title={abierto ? undefined : nombreRuta(r)}
                    data-aviso={conAviso.has(r.path) || undefined}
                  >
                    <Icono clave={r.path} />
                    <span>{nombreRuta(r)}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>
      )}
      {!escritorio && abiertoMovil && (
        <>
          <div
            className="panel-velo"
            aria-hidden="true"
            onClick={() => setAbiertoMovil(false)}
          />
          <div
            className="hoja-nav"
            id="hoja-nav"
            role="dialog"
            aria-modal="true"
            aria-label={t.mas}
          >
            <button
              type="button"
              className="hoja-asa"
              aria-label={t.cerrar}
              onClick={() => setAbiertoMovil(false)}
            />
            {GRUPOS.filter((g) => g.id !== 'cielo')
              .reverse()
              .map((g) => (
                <section key={g.id} className="hoja-grupo">
                  <p className="panel-titulo">{textos(g.nombre)}</p>
                  <nav aria-label={textos(g.nombre)}>
                    {g.rutas.map((r) => (
                      <NavLink
                        key={r.path}
                        to={`/${r.path}`}
                        end
                        data-aviso={conAviso.has(r.path) || undefined}
                      >
                        <Icono clave={r.path} />
                        <span>{nombreRuta(r)}</span>
                      </NavLink>
                    ))}
                  </nav>
                </section>
              ))}
          </div>
        </>
      )}
      {!escritorio && (
        <div className="navegacion">
          <nav aria-label={t.pantallas}>
            {RUTAS_BARRA.map((r) => (
              <NavLink key={r.path} to={`/${r.path}`}>
                <Icono clave={r.path} />
                <span>{nombreRuta(r)}</span>
              </NavLink>
            ))}
            <button
              type="button"
              className="navegacion-mas"
              aria-expanded={abiertoMovil}
              aria-controls="hoja-nav"
              data-aviso={
                [...conAviso].some(
                  (r) => !RUTAS_BARRA.some((b) => b.path === r),
                ) || undefined
              }
              onClick={alternar}
            >
              <Icono clave="mas" />
              <span>{t.mas}</span>
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
