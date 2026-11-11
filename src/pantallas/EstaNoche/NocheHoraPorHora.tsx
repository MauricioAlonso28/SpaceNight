import {
  LineaNoche,
  type FilaLinea,
} from '../../componentes/LineaNoche/LineaNoche';
import {
  HORAS_NOCHE,
  fraccionVentana,
  type Posicion,
  type VentanaNoche,
} from '../../servicios/astro/noche';
import type { NochePlaneta } from '../../servicios/astro/planetas';
import { textos } from '../../idioma/idioma';
import { formatearHora } from '../../servicios/formato';
import type { PasoISS } from '../../servicios/satelites/iss';
import { filasNoche } from './filasNoche';
import { lineasPlaneta } from './textosPlanetas';

const MS_HORA = 3_600_000;

/** La noche de 18:00 a 06:00: cielo, Luna, cada planeta visible con su imagen y dónde buscarlo, y la Estación. */
export function NocheHoraPorHora({
  ventana,
  instantes,
  sol,
  luna,
  planetas,
  ahora,
  zona,
  formato24h,
  estacion,
}: {
  ventana: VentanaNoche;
  instantes: Date[];
  sol: Posicion[];
  luna: Posicion[];
  planetas: NochePlaneta[];
  ahora: Date;
  zona: string;
  formato24h: boolean;
  estacion: PasoISS[] | null;
}) {
  const enHora = (f: number) =>
    formatearHora(
      new Date(ventana.inicio.getTime() + f * HORAS_NOCHE * MS_HORA),
      zona,
      formato24h,
    );
  const marcas = [0, 3, 6, 9, 12].map((h) => ({
    texto: enHora(h / HORAS_NOCHE),
    posicion: h / HORAS_NOCHE,
  }));
  const posAhora = fraccionVentana(ahora, ventana);
  const visibles = new Map(
    planetas.filter((p) => p.visible).map((p) => [p.planeta as string, p]),
  );
  const filas = filasNoche(
    ventana,
    instantes,
    sol,
    luna,
    planetas,
    enHora,
    estacion,
  ).map((f): FilaLinea => {
    const p = f.clave ? visibles.get(f.clave) : undefined;
    if (f.clave === 'luna') return { ...f, retrato: 'luna', notas: [] };
    if (!p) return f;
    return {
      ...f,
      retrato: p.planeta,
      notas: lineasPlaneta(p, zona, formato24h),
      brillo: p.brillo,
    };
  });

  return (
    <div className="noche">
      {visibles.size === 0 && (
        <p className="aviso">
          {textos({
            es: 'Esta noche ningún planeta pasa de 10° de altura con el cielo oscuro. Prueba otra noche con el deslizador.',
            en: 'Tonight no planet climbs above 10° while the sky is dark. Try another night with the slider.',
          })}
        </p>
      )}
      <LineaNoche
        filas={filas}
        marcas={marcas}
        ahora={posAhora >= 0 && posAhora <= 1 ? posAhora : null}
      />
      <p className="leyenda">
        {textos({
          es: 'Cada barra marca cuándo está sobre el horizonte. La primera fila muestra cuándo el cielo está oscuro de verdad.',
          en: 'Each bar shows when it is above the horizon. The first row shows when the sky is truly dark.',
        })}
        {estacion &&
          textos({
            es: ' Los puntos son los pasos visibles de la Estación.',
            en: ' The dots are the visible Space Station passes.',
          })}
      </p>
    </div>
  );
}
