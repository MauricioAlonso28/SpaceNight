import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  anguloPantalla,
  escucharOrientacion,
  type FuenteRumbo,
} from '../../servicios/sensores/orientacion';
import {
  anguloFlecha,
  basesCamara,
  errorBrujula,
  proyectar,
  suavizar,
  type Bases,
  type Lectura,
} from '../../servicios/sensores/rotacion';
import { textos } from '../../idioma/idioma';
import type { ObjetoCamara } from './objetosCamara';

const ES = {
  region: 'Modo cámara',
  salir: 'Salir',
  objetivo: 'Objeto a buscar',
  centra: (n: string) => `Centra ${n} en el círculo y toca Listo.`,
  elObjeto: 'el objeto',
  listo: 'Listo',
  cancelar: 'Cancelar',
  calibrar: (n: string) => `Calibrar con ${n}`,
  unObjeto: 'un objeto',
  esperando: 'Leyendo la brújula…',
  sinDatos:
    'No llegan datos de orientación. En un ordenador no hay brújula ni giroscopio: prueba en el móvil o usa el Mapa del cielo.',
  sinPermiso:
    'Sin permiso de movimiento no se sabe hacia dónde apuntas. En iPhone se activa en Ajustes › Safari › Movimiento y orientación; luego vuelve a entrar.',
  relativa:
    'Este navegador no da el norte: calibra con la Luna o un planeta antes de fiarte de las etiquetas.',
  normal:
    'Si las etiquetas se desvían, mueve el móvil haciendo un 8 y calibra con la Luna o un planeta brillante.',
};

const EN: typeof ES = {
  region: 'Camera mode',
  salir: 'Exit',
  objetivo: 'Object to find',
  centra: (n) => `Center ${n} in the circle and tap Done.`,
  elObjeto: 'the object',
  listo: 'Done',
  cancelar: 'Cancel',
  calibrar: (n) => `Calibrate with ${n}`,
  unObjeto: 'an object',
  esperando: 'Reading the compass…',
  sinDatos:
    'No orientation data is arriving. A computer has no compass or gyroscope: try on your phone or use the Sky map.',
  sinPermiso:
    'Without motion permission the app cannot tell where you are pointing. On iPhone turn it on in Settings › Safari › Motion & Orientation Access, then come back.',
  relativa:
    'This browser does not give north: calibrate with the Moon or a planet before trusting the labels.',
  normal:
    'If the labels drift, move your phone in a figure 8 and calibrate with the Moon or a bright planet.',
};

function t() {
  return textos({ es: ES, en: EN });
}

export const FOV_LADO_LARGO = 65;
const SUAVIZADO = 0.2;
const ESPERA_SENSOR_MS = 2000;
const MARGEN_FLECHA = 44;

/** Lo que el visor muestra sobre el estado de los sensores. */
type EstadoSensor = 'esperando' | 'sin-datos' | 'sin-permiso' | FuenteRumbo;

function colocarFlecha(
  flecha: HTMLElement,
  objetivo: ObjetoCamara | undefined,
  bases: Bases,
  ancho: number,
  alto: number,
) {
  const p =
    objetivo &&
    proyectar(objetivo.direccion, bases, ancho, alto, FOV_LADO_LARGO);
  if (!objetivo || !p || p.dentro) {
    flecha.style.display = 'none';
    return;
  }
  const angulo = anguloFlecha(objetivo.direccion, bases);
  const r = (angulo * Math.PI) / 180;
  const x = ancho / 2 + Math.cos(r) * (ancho / 2 - MARGEN_FLECHA);
  const y = alto / 2 + Math.sin(r) * (alto / 2 - MARGEN_FLECHA);
  flecha.style.display = '';
  flecha.style.transform = `translate(${x}px, ${y}px) rotate(${angulo}deg)`;
}

/**
 * Vista a pantalla completa: vídeo de la cámara (o fondo oscuro) con las etiquetas donde deberían estar.
 * @param correccion declinación magnética más calibración, en grados
 * @param alCalibrar recibe el error medido al centrar el objetivo
 * @param aviso lo que pasó al abrir la cámara, si algo falló
 * @param sinPermiso si se negó el permiso de movimiento
 */
export function Visor({
  objetos,
  stream,
  aviso,
  sinPermiso,
  correccion,
  alCalibrar,
  alSalir,
  objetivoInicial,
}: {
  objetos: ObjetoCamara[];
  stream: MediaStream | null;
  aviso: string | null;
  sinPermiso: boolean;
  correccion: number;
  alCalibrar: (error: number) => void;
  alSalir: () => void;
  objetivoInicial: string | null;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const flecha = useRef<HTMLDivElement>(null);
  const lectura = useRef<Lectura | null>(null);
  const bases = useRef<Bases | null>(null);
  const datos = useRef({ objetos, correccion, objetivo: objetivoInicial });
  const [objetivo, setObjetivo] = useState(objetivoInicial);
  const [estado, setEstado] = useState<EstadoSensor>('esperando');
  const [calibrando, setCalibrando] = useState(false);

  useEffect(() => {
    datos.current = { objetos, correccion, objetivo };
  });

  useEffect(() => {
    if (video.current && stream) video.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    let recibido = false;
    const dejar = escucharOrientacion((l, fuente) => {
      lectura.current = l;
      if (!recibido) {
        recibido = true;
        setEstado(fuente);
      }
    });
    const espera = window.setTimeout(() => {
      if (!recibido) setEstado(sinPermiso ? 'sin-permiso' : 'sin-datos');
    }, ESPERA_SENSOR_MS);
    return () => {
      dejar();
      window.clearTimeout(espera);
    };
  }, [sinPermiso]);

  useEffect(() => {
    let cuadro = 0;
    const etiquetas = () =>
      [...(capa.current?.children ?? [])] as HTMLElement[];
    const animar = () => {
      cuadro = requestAnimationFrame(animar);
      const l = lectura.current;
      const div = capa.current;
      if (!l || !div) return;
      const {
        objetos: lista,
        correccion: corr,
        objetivo: clave,
      } = datos.current;
      const nueva = basesCamara(l, anguloPantalla(), corr);
      bases.current = bases.current
        ? suavizar(bases.current, nueva, SUAVIZADO)
        : nueva;
      const b = bases.current;
      const { clientWidth: ancho, clientHeight: alto } = div;
      for (const el of etiquetas()) {
        const o = lista.find((x) => x.clave === el.dataset.clave);
        const p = o && proyectar(o.direccion, b, ancho, alto, FOV_LADO_LARGO);
        el.style.display = p?.dentro ? '' : 'none';
        if (p?.dentro) el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      }
      if (flecha.current) {
        colocarFlecha(
          flecha.current,
          lista.find((o) => o.clave === clave),
          b,
          ancho,
          alto,
        );
      }
    };
    cuadro = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(cuadro);
  }, []);

  const elegido = objetos.find((o) => o.clave === objetivo);

  const terminarCalibracion = () => {
    if (bases.current && elegido)
      alCalibrar(errorBrujula(bases.current.adelante, elegido.direccion));
    setCalibrando(false);
  };

  return createPortal(
    <div className="visor" role="region" aria-label={t().region}>
      {stream ? (
        <video ref={video} className="visor-video" autoPlay playsInline muted />
      ) : (
        <div className="visor-oscuro" />
      )}
      <div className="visor-etiquetas" ref={capa} aria-hidden="true">
        {objetos.map((o) => (
          <span
            key={o.clave}
            data-clave={o.clave}
            className={`visor-etiqueta visor-${o.clase}${o.clave === objetivo ? ' visor-objetivo' : ''}`}
            style={{ display: 'none' }}
          >
            {o.nombre}
          </span>
        ))}
      </div>
      <div className="visor-mira" aria-hidden="true" />
      <div
        className="visor-flecha"
        ref={flecha}
        aria-hidden="true"
        style={{ display: 'none' }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M4 12h14M13 6l6 6-6 6" />
        </svg>
      </div>
      <div className="visor-arriba">
        <button type="button" className="boton" onClick={alSalir}>
          {t().salir}
        </button>
        <label className="oculto" htmlFor="objetivo">
          {t().objetivo}
        </label>
        <select
          id="objetivo"
          className="visor-select"
          value={objetivo ?? ''}
          onChange={(e) => setObjetivo(e.target.value)}
        >
          {objetos
            .filter((o) => o.clase !== 'constelacion' && o.altura > 0)
            .map((o) => (
              <option key={o.clave} value={o.clave}>
                {o.nombre}
              </option>
            ))}
        </select>
      </div>
      <div className="visor-abajo panel">
        {calibrando ? (
          <>
            <p>{t().centra(elegido?.nombre ?? t().elObjeto)}</p>
            <div className="visor-botones">
              <button
                type="button"
                className="boton"
                onClick={terminarCalibracion}
              >
                {t().listo}
              </button>
              <button
                type="button"
                className="boton"
                onClick={() => setCalibrando(false)}
              >
                {t().cancelar}
              </button>
            </div>
          </>
        ) : (
          <>
            {aviso && <p className="visor-aviso">{aviso}</p>}
            <p>{textoEstado(estado)}</p>
            <div className="visor-botones">
              <button
                type="button"
                className="boton"
                onClick={() => setCalibrando(true)}
                disabled={
                  !elegido || estado === 'sin-datos' || estado === 'sin-permiso'
                }
              >
                {t().calibrar(elegido?.nombre ?? t().unObjeto)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function textoEstado(estado: EstadoSensor): string {
  switch (estado) {
    case 'esperando':
      return t().esperando;
    case 'sin-datos':
      return t().sinDatos;
    case 'sin-permiso':
      return t().sinPermiso;
    case 'relativa':
      return t().relativa;
    default:
      return t().normal;
  }
}
