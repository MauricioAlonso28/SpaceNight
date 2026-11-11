import { useState } from 'react';
import { useEstado } from '../../estado/store';
import { letraCoordenada, nombreLugar } from '../../idioma/comunes';
import {
  idiomaNavegador,
  textos,
  type PreferenciaIdioma,
} from '../../idioma/idioma';
import { formatearNumero } from '../../servicios/formato';
import { pedirUbicacion } from '../../servicios/sensores/ubicacion';
import { CIUDADES } from '../../tipos/ciudades';
import './Ajustes.css';

const GPS = 'gps';

const ES = {
  titulo: 'Ajustes',
  sinGps:
    'No se pudo leer la ubicación. Revisa el permiso del navegador o elige una ciudad.',
  ubicacion: 'Ubicación',
  ciudad: 'Ciudad',
  buscando: 'Buscando…',
  usarGps: 'Usar mi ubicación (GPS)',
  idioma: 'Idioma',
  auto: (nombre: string) => `Automático (${nombre})`,
  pantalla: 'Pantalla',
  modoRojo: 'Modo rojo nocturno',
  modoRojoNota: 'Todo en rojo para no perder la visión de noche al observar.',
  formato: 'Formato de hora',
  h24: '24 horas (21:30)',
  h12: '12 horas (9:30 p. m.)',
  brujula: 'Brújula del modo cámara',
  sinCalibrar:
    'Sin calibrar. Calíbrala desde el modo cámara centrando la Luna o un planeta.',
  correccion: (g: string) => `Corrección guardada: ${g}°.`,
  borrar: 'Borrar calibración',
};

const EN: typeof ES = {
  titulo: 'Settings',
  sinGps:
    'Could not read your location. Check the browser permission or pick a city.',
  ubicacion: 'Location',
  ciudad: 'City',
  buscando: 'Searching…',
  usarGps: 'Use my location (GPS)',
  idioma: 'Language',
  auto: (nombre) => `Automatic (${nombre})`,
  pantalla: 'Display',
  modoRojo: 'Red night mode',
  modoRojoNota:
    'Everything in red so you keep your night vision while observing.',
  formato: 'Time format',
  h24: '24-hour (21:30)',
  h12: '12-hour (9:30 PM)',
  brujula: 'Camera mode compass',
  sinCalibrar:
    'Not calibrated. Calibrate it from camera mode by centering the Moon or a planet.',
  correccion: (g) => `Saved correction: ${g}°.`,
  borrar: 'Clear calibration',
};

const NOMBRE_IDIOMA = { es: 'Español', en: 'English' };

/** Ajustes: ubicación (GPS o ciudad), modo rojo nocturno, formato de hora y calibración de la brújula. */
export function Ajustes() {
  const t = textos({ es: ES, en: EN });
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
    else setAviso(t.sinGps);
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
      <h2 id="t-ajustes">{t.titulo}</h2>

      <fieldset className="panel">
        <legend>{t.ubicacion}</legend>
        <p className="ajustes-actual">
          {nombreLugar(ubicacion)}:{' '}
          {formatearNumero(Math.abs(ubicacion.latitud), 2)}°{' '}
          {letraCoordenada(ubicacion.latitud, 'latitud')},{' '}
          {formatearNumero(Math.abs(ubicacion.longitud), 2)}°{' '}
          {letraCoordenada(ubicacion.longitud, 'longitud')}
        </p>
        <label htmlFor="ciudad">{t.ciudad}</label>
        <select
          id="ciudad"
          value={ciudad ? ciudad.nombre : GPS}
          onChange={(e) => elegirCiudad(e.target.value)}
        >
          {!ciudad && <option value={GPS}>{nombreLugar(ubicacion)}</option>}
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
          {buscando ? t.buscando : t.usarGps}
        </button>
        {aviso && <p className="ajustes-aviso">{aviso}</p>}
      </fieldset>

      <fieldset className="panel">
        <legend>{t.idioma}</legend>
        <label htmlFor="idioma" className="oculto">
          {t.idioma}
        </label>
        <select
          id="idioma"
          value={ajustes.idioma}
          onChange={(e) =>
            cambiarAjustes({ idioma: e.target.value as PreferenciaIdioma })
          }
        >
          <option value="auto">
            {t.auto(NOMBRE_IDIOMA[idiomaNavegador()])}
          </option>
          <option value="en" lang="en">
            {NOMBRE_IDIOMA.en}
          </option>
          <option value="es" lang="es">
            {NOMBRE_IDIOMA.es}
          </option>
        </select>
      </fieldset>

      <fieldset className="panel">
        <legend>{t.pantalla}</legend>
        <label className="interruptor">
          <input
            type="checkbox"
            checked={ajustes.modoRojo}
            onChange={(e) => cambiarAjustes({ modoRojo: e.target.checked })}
          />
          <span>
            {t.modoRojo}
            <small>{t.modoRojoNota}</small>
          </span>
        </label>
      </fieldset>

      <fieldset className="panel">
        <legend>{t.formato}</legend>
        <label className="opcion">
          <input
            type="radio"
            name="formato"
            checked={ajustes.formato24h}
            onChange={() => cambiarAjustes({ formato24h: true })}
          />
          {t.h24}
        </label>
        <label className="opcion">
          <input
            type="radio"
            name="formato"
            checked={!ajustes.formato24h}
            onChange={() => cambiarAjustes({ formato24h: false })}
          />
          {t.h12}
        </label>
      </fieldset>

      <fieldset className="panel">
        <legend>{t.brujula}</legend>
        <p className="ajustes-actual">
          {ajustes.calibracionBrujula === 0
            ? t.sinCalibrar
            : t.correccion(formatearNumero(ajustes.calibracionBrujula, 1))}
        </p>
        {ajustes.calibracionBrujula !== 0 && (
          <button
            type="button"
            className="boton"
            onClick={() => cambiarAjustes({ calibracionBrujula: 0 })}
          >
            {t.borrar}
          </button>
        )}
      </fieldset>
    </section>
  );
}
