import { TarjetaPlaneta } from '../../componentes/TarjetaPlaneta/TarjetaPlaneta';
import type { NochePlaneta } from '../../servicios/astro/planetas';
import { nombrePlaneta } from '../../idioma/comunes';
import { textos } from '../../idioma/idioma';
import { lineasPlaneta } from './textosPlanetas';

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
        {textos({
          es: 'Esta noche ningún planeta pasa de 10° de altura con el cielo oscuro. Prueba otra noche con el deslizador.',
          en: 'Tonight no planet climbs above 10° while the sky is dark. Try another night with the slider.',
        })}
      </p>
    );
  }
  return (
    <div className="planetas">
      {visibles.map((p) => (
        <TarjetaPlaneta
          key={p.planeta}
          planeta={p.planeta}
          nombre={nombrePlaneta(p.planeta)}
          lineas={lineasPlaneta(p, zona, formato24h)}
          brillo={p.brillo}
        />
      ))}
    </div>
  );
}
