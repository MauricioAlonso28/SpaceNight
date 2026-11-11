import { TarjetaPlaneta } from '../../componentes/TarjetaPlaneta/TarjetaPlaneta';
import type { NochePlaneta } from '../../servicios/astro/planetas';
import { NOMBRE_PLANETA, lineasPlaneta } from './textosPlanetas';

/** Tarjetas de los planetas que se ven esta noche, o un aviso si no hay ninguno. */
export function PlanetasVisibles({
  planetas,
  zona,
  formato24h,
}: {
  planetas: NochePlaneta[];
  zona: string;
  formato24h: boolean;
}) {
  const visibles = planetas.filter((p) => p.visible);
  if (visibles.length === 0) {
    return (
      <p className="panel aviso">
        Esta noche ningún planeta pasa de 10° de altura con el cielo oscuro.
        Prueba otra noche con el deslizador.
      </p>
    );
  }
  return (
    <div className="planetas">
      {visibles.map((p) => (
        <TarjetaPlaneta
          key={p.planeta}
          planeta={p.planeta}
          nombre={NOMBRE_PLANETA[p.planeta]}
          lineas={lineasPlaneta(p, zona, formato24h)}
          brillo={p.brillo}
        />
      ))}
    </div>
  );
}
