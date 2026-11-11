import { useState } from 'react';
import { useEstado } from '../../estado/store';
import { formatearNumero } from '../../servicios/formato';
import { pedirUbicacion } from '../../servicios/sensores/ubicacion';
import { CIUDADES } from '../../tipos/ciudades';
import './Ajustes.css';

const GPS = 'gps';

/** Ajustes: ubicación (GPS o ciudad), modo rojo nocturno, formato de hora y calibración de la brújula. */
export function Ajustes() {
  const ubicacion = useEstado((s) => s.ubicacion);
  const ajustes = useEstado((s) => s.ajustes);
  const fijarUbicacion = useEstado((s) => s.fijarUbicacion);
  const cambiarAjustes = useEstado((s) => s.cambiarAjustes);
  const [aviso, setAviso] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const ciudad = CIUDADES.find((c) => c.nombre === ubicacion.nombre);

  const usarGps = async () => {
    setBuscando(true);
    setAviso(null);
    const u = await pedirUbicacion();
    setBuscando(false);
    if (u) fijarUbicacion(u);
    else
      setAviso(
        'No se pudo leer la ubicación. Revisa el permiso del navegador o elige una ciudad.',
      );
  };

  const elegirCiudad = (nombre: string) => {
    if (nombre === GPS) {
      void usarGps();
      return;
    }
    const c = CIUDADES.find((x) => x.nombre === nombre);
    if (c) fijarUbicacion(c);
  };

  return (
    <section className="ajustes" aria-labelledby="t-ajustes">
      <h2 id="t-ajustes">Ajustes</h2>

      <fieldset className="panel">
        <legend>Ubicación</legend>
        <p className="ajustes-actual">
          {ubicacion.nombre}: {formatearNumero(Math.abs(ubicacion.latitud), 2)}°{' '}
          {ubicacion.latitud < 0 ? 'S' : 'N'},{' '}
          {formatearNumero(Math.abs(ubicacion.longitud), 2)}°{' '}
          {ubicacion.longitud < 0 ? 'O' : 'E'}
        </p>
        <label htmlFor="ciudad">Ciudad</label>
        <select
          id="ciudad"
          value={ciudad ? ciudad.nombre : GPS}
          onChange={(e) => elegirCiudad(e.target.value)}
        >
          {!ciudad && <option value={GPS}>{ubicacion.nombre}</option>}
          {CIUDADES.map((c) => (
            <option key={c.nombre} value={c.nombre}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="boton"
          onClick={usarGps}
          disabled={buscando}
        >
          {buscando ? 'Buscando…' : 'Usar mi ubicación (GPS)'}
        </button>
        {aviso && <p className="ajustes-aviso">{aviso}</p>}
      </fieldset>

      <fieldset className="panel">
        <legend>Pantalla</legend>
        <label className="interruptor">
          <input
            type="checkbox"
            checked={ajustes.modoRojo}
            onChange={(e) => cambiarAjustes({ modoRojo: e.target.checked })}
          />
          <span>
            Modo rojo nocturno
            <small>
              Todo en rojo para no perder la visión de noche al observar.
            </small>
          </span>
        </label>
      </fieldset>

      <fieldset className="panel">
        <legend>Formato de hora</legend>
        <label className="opcion">
          <input
            type="radio"
            name="formato"
            checked={ajustes.formato24h}
            onChange={() => cambiarAjustes({ formato24h: true })}
          />
          24 horas (21:30)
        </label>
        <label className="opcion">
          <input
            type="radio"
            name="formato"
            checked={!ajustes.formato24h}
            onChange={() => cambiarAjustes({ formato24h: false })}
          />
          12 horas (9:30 p. m.)
        </label>
      </fieldset>

      <fieldset className="panel">
        <legend>Brújula del modo cámara</legend>
        <p className="ajustes-actual">
          {ajustes.calibracionBrujula === 0
            ? 'Sin calibrar. Calíbrala desde el modo cámara centrando la Luna o un planeta.'
            : `Corrección guardada: ${formatearNumero(ajustes.calibracionBrujula, 1)}°.`}
        </p>
        {ajustes.calibracionBrujula !== 0 && (
          <button
            type="button"
            className="boton"
            onClick={() => cambiarAjustes({ calibracionBrujula: 0 })}
          >
            Borrar calibración
          </button>
        )}
      </fieldset>
    </section>
  );
}
