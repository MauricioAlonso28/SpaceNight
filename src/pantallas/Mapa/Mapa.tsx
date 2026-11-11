import { useCallback, useMemo, useRef, useState, type FormEvent } from 'react';
import type { ControlMapa, Seleccion } from '../../3d/escenaMapa';
import { useFechaVista } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { textos } from '../../idioma/idioma';
import {
  aplicar,
  matrizCielo,
  vectorEcuatorial,
  type Vec3,
} from '../../servicios/astro/cielo';
import { formatearHora, formatearNumero } from '../../servicios/formato';
import { buscar, type Buscable } from './buscar';
import { cuerposEn } from './cuerpos';
import { useDatosMapa, type DatosMapa } from './datosMapa';
import { EscenaMapa } from './EscenaMapa';
import { fichaDe } from './ficha';
import './Mapa.css';

const MS_HORA = 3_600_000;

const ES = {
  errorCatalogo: 'No se pudo cargar el catálogo de estrellas.',
  cargando: 'Cargando estrellas…',
  noEncuentro: (q: string) => `No encuentro «${q}».`,
  bajoHorizonte: (n: string) => `${n} está ahora bajo el horizonte.`,
  titulo: 'Mapa del cielo',
  cerrar: 'Cerrar ficha',
  ayuda:
    'Arrastra para mirar alrededor, pellizca o usa la rueda para acercar y toca un objeto para ver su ficha.',
  buscarEtiqueta: 'Buscar en el cielo',
  ejemplo: 'Júpiter, Orión, Sirius…',
  buscar: 'Buscar',
  adelantar: 'Adelantar horas',
  ahora: (h: string) => `Ahora, ${h}`,
  mas: (horas: string, h: string) => `+${horas} h, ${h}`,
  constelaciones: 'Mostrar constelaciones',
  pie: 'Estrellas: HYG Database v4.1 (astronexus), CC BY-SA 4.0. Líneas y nombres de constelaciones: d3-celestial (Olaf Frohn), BSD-3-Clause.',
};

const EN: typeof ES = {
  errorCatalogo: 'Could not load the star catalog.',
  cargando: 'Loading stars…',
  noEncuentro: (q) => `Can't find "${q}".`,
  bajoHorizonte: (n) => `${n} is below the horizon right now.`,
  titulo: 'Sky map',
  cerrar: 'Close card',
  ayuda:
    'Drag to look around, pinch or use the wheel to zoom, and tap an object to see its card.',
  buscarEtiqueta: 'Search the sky',
  ejemplo: 'Jupiter, Orion, Sirius…',
  buscar: 'Search',
  adelantar: 'Move time forward',
  ahora: (h) => `Now, ${h}`,
  mas: (horas, h) => `+${horas} h, ${h}`,
  constelaciones: 'Show constellations',
  pie: 'Stars: HYG Database v4.1 (astronexus), CC BY-SA 4.0. Constellation lines and names: d3-celestial (Olaf Frohn), BSD-3-Clause.',
};

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
  const t = textos({ es: ES, en: EN });
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
    return <p className="panel aviso">{t.errorCatalogo}</p>;
  }
  if (!datos) return <p className="mapa-cargando">{t.cargando}</p>;

  const ficha = seleccion
    ? fichaDe(seleccion, datos.estrellas, datos.constelaciones, cuerpos, matriz)
    : null;

  const alBuscar = (ev: FormEvent) => {
    ev.preventDefault();
    const d = buscar(consulta, destinos(datos, matriz, cuerpos));
    if (!d) {
      setAviso(t.noEncuentro(consulta));
      return;
    }
    const dir = d.direccion();
    control.current?.mirarA(dir);
    setSeleccion(d.seleccion);
    setAviso(dir[1] < 0 ? t.bajoHorizonte(d.nombres[0]) : null);
  };

  const hora = formatearHora(fecha, ubicacion.zona, formato24h);

  return (
    <section className="mapa" aria-labelledby="t-mapa">
      <h2 id="t-mapa" className="mapa-titulo">
        {t.titulo}
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
              aria-label={t.cerrar}
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
      <p className="mapa-ayuda">{t.ayuda}</p>
      <form className="mapa-buscar" onSubmit={alBuscar} role="search">
        <label htmlFor="buscar-cielo" className="oculto">
          {t.buscarEtiqueta}
        </label>
        <input
          id="buscar-cielo"
          type="search"
          placeholder={t.ejemplo}
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          autoComplete="off"
        />
        <button type="submit" className="boton">
          {t.buscar}
        </button>
      </form>
      {aviso && <p className="mapa-aviso-busqueda">{aviso}</p>}
      <div className="deslizador mapa-horas">
        <label htmlFor="horas-mapa">
          <span>{t.adelantar}</span>
          <output htmlFor="horas-mapa">
            {horas === 0
              ? t.ahora(hora)
              : t.mas(formatearNumero(horas, 2), hora)}
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
        {t.constelaciones}
      </label>
      <p className="pie">{t.pie}</p>
    </section>
  );
}
