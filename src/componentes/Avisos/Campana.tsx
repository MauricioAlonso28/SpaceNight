import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAhora } from '../../estado/hooks';
import { useAvisos, useAvisosActivos } from '../../estado/avisos';
import { textos } from '../../idioma/idioma';
import { REGLAS, type Regla } from '../../servicios/nasa/avisos';
import { haceCuanto } from '../../servicios/nasa/formato';
import '../../pantallas/Nasa/Nasa.css';
import './Avisos.css';

const ES = {
  avisos: 'Avisos en vivo',
  nuevos: (n: number) => `${n} sin ver`,
  ninguno: 'Sin avisos por ahora.',
  fuente: 'Fuente',
  ver: 'Ver',
  notificar: 'Avisarme también con notificaciones',
  notificando: 'Notificaciones activadas',
  bloqueadas: 'Las notificaciones están bloqueadas en este navegador.',
  nota: 'Las notificaciones solo llegan con la app abierta en alguna pestaña.',
  reglas: 'Qué avisar',
  regla: {
    asteroide: 'Asteroides más cerca que la Luna',
    evento: 'Eventos naturales a menos de 500 km y tormentas',
    bolido: 'Bólidos nuevos',
    tierra: 'Fotos nuevas de la Tierra',
    exoplanetas: 'Cambios en el total de exoplanetas',
    lanzamiento: 'Cohetes que despegan en las próximas 6 horas',
  } as Record<Regla, string>,
  cerrar: 'Cerrar',
};

const EN: typeof ES = {
  avisos: 'Live alerts',
  nuevos: (n) => `${n} unseen`,
  ninguno: 'No alerts right now.',
  fuente: 'Source',
  ver: 'View',
  notificar: 'Also alert me with notifications',
  notificando: 'Notifications on',
  bloqueadas: 'Notifications are blocked in this browser.',
  nota: 'Notifications only arrive while the app is open in some tab.',
  reglas: 'What to alert',
  regla: {
    asteroide: 'Asteroids closer than the Moon',
    evento: 'Natural events within 500 km, and storms',
    bolido: 'New fireballs',
    tierra: 'New photos of Earth',
    exoplanetas: 'Changes in the exoplanet total',
    lanzamiento: 'Rockets lifting off in the next 6 hours',
  },
  cerrar: 'Close',
};

let tostadoEnSesion: string | null = null;

/** Estado del permiso de notificaciones. */
function permisoActual(): NotificationPermission | 'sin-soporte' {
  return typeof Notification === 'undefined'
    ? 'sin-soporte'
    : Notification.permission;
}

/**
 * Campana de avisos en vivo en la cabecera: un número con los nuevos, la lista con enlaces, el permiso de notificaciones y qué reglas avisan.
 * El aviso más reciente sin ver aparece una vez por visita en una tostada abajo.
 */
export function Campana() {
  const t = textos({ es: ES, en: EN });
  const ahora = useAhora();
  const { activos, nuevos } = useAvisosActivos();
  const marcarVistos = useAvisos((s) => s.marcarVistos);
  const apagadas = useAvisos((s) => s.apagadas);
  const alternarRegla = useAvisos((s) => s.alternarRegla);
  const [abierta, setAbierta] = useState(false);
  const [permiso, setPermiso] = useState(permisoActual);
  const [tostada, setTostada] = useState<string | null>(null);
  const raiz = useRef<HTMLDivElement>(null);

  const primero = nuevos[0]?.id ?? null;
  useEffect(() => {
    if (!primero || tostadoEnSesion === primero) return;
    tostadoEnSesion = primero;
    const mostrar = window.setTimeout(() => setTostada(primero), 1200);
    const ocultar = window.setTimeout(() => setTostada(null), 9000);
    return () => {
      window.clearTimeout(mostrar);
      window.clearTimeout(ocultar);
    };
  }, [primero]);

  useEffect(() => {
    if (!abierta) return;
    const fuera = (ev: PointerEvent) => {
      if (!raiz.current?.contains(ev.target as Node)) setAbierta(false);
    };
    const tecla = (ev: KeyboardEvent) =>
      ev.key === 'Escape' && setAbierta(false);
    window.addEventListener('pointerdown', fuera);
    window.addEventListener('keydown', tecla);
    return () => {
      window.removeEventListener('pointerdown', fuera);
      window.removeEventListener('keydown', tecla);
    };
  }, [abierta]);

  const alternar = () => {
    if (!abierta) marcarVistos(activos.map((a) => a.id));
    setAbierta(!abierta);
    setTostada(null);
  };
  const pedirPermiso = () => {
    if (typeof Notification === 'undefined') return;
    void Notification.requestPermission().then(setPermiso);
  };
  const aviso = activos.find((a) => a.id === tostada);

  return (
    <div className="campana" ref={raiz}>
      <button
        type="button"
        className="campana-boton"
        aria-label={`${t.avisos}${nuevos.length ? `, ${t.nuevos(nuevos.length)}` : ''}`}
        aria-expanded={abierta}
        onClick={alternar}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" />
        </svg>
        {nuevos.length > 0 && (
          <span className="campana-numero">{nuevos.length}</span>
        )}
      </button>
      {abierta && (
        <div className="campana-panel" role="dialog" aria-label={t.avisos}>
          <p className="nasa-rotulo">
            <span className="nasa-vivo" aria-hidden="true" /> {t.avisos}
          </p>
          {activos.length === 0 ? (
            <p className="campana-vacio">{t.ninguno}</p>
          ) : (
            <ol>
              {activos.map((a) => (
                <li key={a.id}>
                  <Link to={`/${a.ruta}`} onClick={() => setAbierta(false)}>
                    <strong>{a.titulo}</strong>
                    <span>{a.detalle}</span>
                    <small>{haceCuanto(a.fecha, ahora)}</small>
                  </Link>
                  {a.enlace && (
                    <a
                      href={a.enlace}
                      target="_blank"
                      rel="noreferrer"
                      className="campana-fuente"
                    >
                      {t.fuente} ↗
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
          <div className="campana-ajustes">
            {permiso === 'default' && (
              <button
                type="button"
                className="nasa-chip"
                onClick={pedirPermiso}
              >
                {t.notificar}
              </button>
            )}
            {permiso === 'granted' && <p>{t.notificando}</p>}
            {permiso === 'denied' && <p>{t.bloqueadas}</p>}
            <p className="campana-nota">{t.nota}</p>
            <fieldset>
              <legend>{t.reglas}</legend>
              {REGLAS.map((r) => (
                <label key={r}>
                  <input
                    type="checkbox"
                    checked={!apagadas.includes(r)}
                    onChange={() => alternarRegla(r)}
                  />
                  {t.regla[r]}
                </label>
              ))}
            </fieldset>
          </div>
        </div>
      )}
      {aviso && !abierta && (
        <div className="campana-tostada" role="status">
          <span className="nasa-vivo" aria-hidden="true" />
          <Link to={`/${aviso.ruta}`} onClick={() => setTostada(null)}>
            <strong>{aviso.titulo}</strong>
            <span>{aviso.detalle}</span>
          </Link>
          <button
            type="button"
            aria-label={t.cerrar}
            onClick={() => setTostada(null)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
