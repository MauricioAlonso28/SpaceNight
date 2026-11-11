import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import type { ControlMapa, Seleccion } from '../../3d/escenaMapa';
import { useFechaVista } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import {
  aplicar,
  matrizCielo,
  vectorEcuatorial,
  type Vec3,
} from '../../servicios/astro/cielo';
import { formatearHora } from '../../servicios/formato';
import { buscar, type Buscable } from './buscar';
import { cuerposEn } from './cuerpos';
import { useDatosMapa, type DatosMapa } from './datosMapa';
import { EscenaMapa } from './EscenaMapa';
import { fichaDe } from './ficha';
import './Mapa.css';

const MS_HORA = 3_600_000;

interface Destino extends Buscable {
  direccion: () => Vec3;
  seleccion: Seleccion | null;
}

function destinos(
  datos: DatosMapa,
  matriz: number[],
  cuerpos: ReturnType<typeof cuerposEn>,
): Destino[] {
  const lista: Destino[] = cuerpos.map((c) => ({
    clave: c.clave,
    nombres: [c.nombre],
    prioridad: 0,
    direccion: () => c.direccion,
    seleccion: { tipo: 'cuerpo', clave: c.clave },
  }));
  for (const c of datos.constelaciones) {
    lista.push({
      clave: c.id,
      nombres: [c.nombre, c.latin],
      prioridad: 1,
      direccion: () => aplicar(matriz, vectorEcuatorial(...c.centro)),
      seleccion: { tipo: 'constelacion', id: c.id },
    });
  }
  datos.estrellas.forEach(([ar, dec, , , nombre, designacion], indice) => {
    if (!nombre && !designacion) return;
    lista.push({
      clave: `estrella-${indice}`,
      nombres: [nombre, designacion].filter(Boolean),
      prioridad: 2,
      direccion: () => aplicar(matriz, vectorEcuatorial(ar, dec)),
      seleccion: { tipo: 'estrella', indice },
    });
  });
  return lista;
}

/** Mapa del cielo: domo 3D, buscador, deslizador de horas y ficha del objeto tocado. */
export function Mapa() {
  const datos = useDatosMapa();
  const base = useFechaVista();
  const ubicacion = useEstado((s) => s.ubicacion);
  const formato24h = useEstado((s) => s.ajustes.formato24h);
  const [horas, setHoras] = useState(0);
  const [lineas, setLineas] = useState(true);
  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [consulta, setConsulta] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const control = useRef<ControlMapa | null>(null);

  const minutoBase = Math.floor(base.getTime() / 60_000);
  const fecha = useMemo(
    () => new Date(minutoBase * 60_000 + horas * MS_HORA),
    [minutoBase, horas],
  );
  const matriz = useMemo(
    () => matrizCielo(fecha, ubicacion),
    [fecha, ubicacion],
  );
  const cuerpos = useMemo(
    () => cuerposEn(fecha, ubicacion),
    [fecha, ubicacion],
  );
  const alListo = useCallback((c: ControlMapa | null) => {
    control.current = c;
  }, []);

  if (datos === 'error') {
    return (
      <p className="panel aviso">No se pudo cargar el catálogo de estrellas.</p>
    );
  }
  if (!datos) return <p className="mapa-cargando">Cargando estrellas…</p>;

  const ficha = seleccion
    ? fichaDe(seleccion, datos.estrellas, datos.constelaciones, cuerpos, matriz)
    : null;

  const alBuscar = (ev: FormEvent) => {
    ev.preventDefault();
    const d = buscar(consulta, destinos(datos, matriz, cuerpos));
    if (!d) {
      setAviso(`No encuentro «${consulta}».`);
      return;
    }
    const dir = d.direccion();
    control.current?.mirarA(dir);
    setSeleccion(d.seleccion);
    setAviso(
      dir[1] < 0 ? `${d.nombres[0]} está ahora bajo el horizonte.` : null,
    );
  };

  const hora = formatearHora(fecha, ubicacion.zona, formato24h);

  return (
    <section className="mapa" aria-labelledby="t-mapa">
      <h2 id="t-mapa" className="mapa-titulo">
        Mapa del cielo
      </h2>
      <div className="mapa-marco">
        <EscenaMapa
          datos={datos}
          matriz={matriz}
          cuerpos={cuerpos}
          constelaciones={lineas}
          alTocar={setSeleccion}
          alListo={alListo}
        />
        {ficha && (
          <div
            className="mapa-ficha panel"
            role="dialog"
            aria-label={ficha.titulo}
          >
            <button
              type="button"
              className="mapa-cerrar"
              aria-label="Cerrar ficha"
              onClick={() => setSeleccion(null)}
            >
              ×
            </button>
            <h3>{ficha.titulo}</h3>
            <p className="mapa-ficha-sub">{ficha.subtitulo}</p>
            <dl>
              {ficha.datos.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
      <p className="mapa-ayuda">
        Arrastra para mirar alrededor, pellizca o usa la rueda para acercar y
        toca un objeto para ver su ficha.
      </p>
      <form className="mapa-buscar" onSubmit={alBuscar} role="search">
        <label htmlFor="buscar-cielo" className="oculto">
          Buscar en el cielo
        </label>
        <input
          id="buscar-cielo"
          type="search"
          placeholder="Júpiter, Orión, Sirius…"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="boton">
          Buscar
        </button>
      </form>
      {aviso && <p className="mapa-aviso-busqueda">{aviso}</p>}
      <div className="deslizador mapa-horas">
        <label htmlFor="horas-mapa">
          <span>Adelantar horas</span>
          <output htmlFor="horas-mapa">
            {horas === 0
              ? `Ahora, ${hora}`
              : `+${String(horas).replace('.', ',')} h, ${hora}`}
          </output>
        </label>
        <input
          id="horas-mapa"
          type="range"
          min={0}
          max={24}
          step={0.25}
          value={horas}
          onChange={(e) => setHoras(Number(e.target.value))}
        />
      </div>
      <label className="mapa-interruptor">
        <input
          type="checkbox"
          checked={lineas}
          onChange={(e) => setLineas(e.target.checked)}
        />
        Mostrar constelaciones
      </label>
      <p className="pie">
        Estrellas: HYG Database v4.1 (astronexus), CC BY-SA 4.0. Líneas y
        nombres de constelaciones: d3-celestial (Olaf Frohn), BSD-3-Clause.
      </p>
    </section>
  );
}
