import { useEffect, useMemo, useState } from 'react';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
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

function decimal(n: number): string {
  return n.toFixed(1).replace('.', ',').replace('-', '−');
}

/** Modo cámara: explica qué permisos pide, abre la cámara trasera y rotula el cielo encima. */
export function Camara() {
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
        setAviso('No se pudo abrir la cámara: se muestra sobre fondo oscuro.');
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
      <h2 id="t-camara">Modo cámara</h2>
      <p>
        Apunta el móvil al cielo y verás los nombres de los planetas, las
        estrellas brillantes y las constelaciones justo donde están.
      </p>
      <p>
        Para eso la app pide dos permisos: la cámara trasera, para ver el cielo
        de fondo, y los sensores de movimiento, para saber hacia dónde apuntas.
        La imagen no sale del teléfono.
      </p>
      <div className="camara-botones">
        <button
          type="button"
          className="boton boton-principal"
          onClick={() => empezar(true)}
        >
          Activar cámara y brújula
        </button>
        <button type="button" className="boton" onClick={() => empezar(false)}>
          Usar sin cámara
        </button>
      </div>
      {aviso && <p className="camara-aviso">{aviso}</p>}
      <p className="pie">
        Declinación magnética en {ubicacion.nombre}: {decimal(decl)}° (World
        Magnetic Model 2025).
        {calibracion !== 0 &&
          ` Calibración guardada: ${decimal(calibracion)}°.`}
        {calibracion !== 0 && (
          <>
            {' '}
            <button
              type="button"
              className="enlace"
              onClick={() => cambiarAjustes({ calibracionBrujula: 0 })}
            >
              Borrar calibración
            </button>
          </>
        )}
      </p>
    </section>
  );
}
