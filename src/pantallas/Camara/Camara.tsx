import { useEffect, useMemo, useState } from 'react';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { nombreLugar } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import { formatearDecimal } from '../../servicios/formato';
import {
  abrirCamaraTrasera,
  cerrarCamara,
} from '../../servicios/sensores/camara';
import { declinacion } from '../../servicios/sensores/declinacion';
import { pedirPermisoOrientacion } from '../../servicios/sensores/orientacion';
import { useDatosMapa } from '../Mapa/datosMapa';
import { objetivoInicial, objetosCamara } from './objetosCamara';
import { Visor } from './Visor';
import './Camara.css';

const ES = {
  sinCamara: 'No se pudo abrir la cámara: se muestra sobre fondo oscuro.',
  titulo: 'Modo cámara',
  intro:
    'Apunta el móvil al cielo y verás los nombres de los planetas, las estrellas brillantes y las constelaciones justo donde están.',
  permisos:
    'Para eso la app pide dos permisos: la cámara trasera, para ver el cielo de fondo, y los sensores de movimiento, para saber hacia dónde apuntas. La imagen no sale del teléfono.',
  activar: 'Activar cámara y brújula',
  sinCamaraBoton: 'Usar sin cámara',
  declinacion: (lugar: string, grados: string) =>
    `Declinación magnética en ${lugar}: ${grados}° (World Magnetic Model 2025).`,
  calibracion: (grados: string) => ` Calibración guardada: ${grados}°.`,
  borrar: 'Borrar calibración',
};

const EN: typeof ES = {
  sinCamara: 'Could not open the camera: showing a dark background instead.',
  titulo: 'Camera mode',
  intro:
    'Point your phone at the sky to see the names of the planets, the bright stars and the constellations right where they are.',
  permisos:
    'For that the app asks for two permissions: the rear camera, to show the sky behind, and the motion sensors, to know where you are pointing. The image never leaves your phone.',
  activar: 'Turn on camera and compass',
  sinCamaraBoton: 'Use without camera',
  declinacion: (lugar, grados) =>
    `Magnetic declination in ${lugar}: ${grados}° (World Magnetic Model 2025).`,
  calibracion: (grados) => ` Saved calibration: ${grados}°.`,
  borrar: 'Clear calibration',
};

const decimal = (n: number) => formatearDecimal(n);

/** Modo cámara: explica qué permisos pide, abre la cámara trasera y rotula el cielo encima. */
export function Camara() {
  const t = textos({ es: ES, en: EN });
  const ahora = useAhora();
  const ubicacion = useEstado((s) => s.ubicacion);
  const calibracion = useEstado((s) => s.ajustes.calibracionBrujula);
  const cambiarAjustes = useEstado((s) => s.cambiarAjustes);
  const datos = useDatosMapa();
  const [activo, setActivo] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);

  const minuto = Math.floor(ahora.getTime() / 60_000);
  const objetos = useMemo(
    () =>
      objetosCamara(
        new Date(minuto * 60_000),
        ubicacion,
        datos && datos !== 'error' ? datos : null,
      ),
    [minuto, ubicacion, datos],
  );
  const decl = useMemo(() => declinacion(ubicacion), [ubicacion]);

  useEffect(() => () => cerrarCamara(stream), [stream]);

  const empezar = async (conCamara: boolean) => {
    setAviso(null);
    setSinPermiso(!(await pedirPermisoOrientacion()));
    if (conCamara) {
      try {
        setStream(await abrirCamaraTrasera());
      } catch {
        setAviso(t.sinCamara);
      }
    }
    setActivo(true);
  };

  const salir = () => {
    cerrarCamara(stream);
    setStream(null);
    setActivo(false);
  };

  if (activo) {
    return (
      <Visor
        objetos={objetos}
        stream={stream}
        aviso={aviso}
        sinPermiso={sinPermiso}
        correccion={decl + calibracion}
        objetivoInicial={objetivoInicial(objetos)}
        alCalibrar={(error) =>
          cambiarAjustes({ calibracionBrujula: calibracion + error })
        }
        alSalir={salir}
      />
    );
  }

  return (
    <section className="camara-inicio" aria-labelledby="t-camara">
      <h2 id="t-camara">{t.titulo}</h2>
      <p>{t.intro}</p>
      <p>{t.permisos}</p>
      <div className="camara-botones">
        <button
          type="button"
          className="boton boton-principal"
          onClick={() => empezar(true)}
        >
          {t.activar}
        </button>
        <button type="button" className="boton" onClick={() => empezar(false)}>
          {t.sinCamaraBoton}
        </button>
      </div>
      {aviso && <p className="camara-aviso">{aviso}</p>}
      <p className="pie">
        {t.declinacion(nombreLugar(ubicacion), decimal(decl))}
        {calibracion !== 0 && t.calibracion(decimal(calibracion))}
        {calibracion !== 0 && (
          <>
            {' '}
            <button
              type="button"
              className="enlace"
              onClick={() => cambiarAjustes({ calibracionBrujula: 0 })}
            >
              {t.borrar}
            </button>
          </>
        )}
      </p>
    </section>
  );
}
