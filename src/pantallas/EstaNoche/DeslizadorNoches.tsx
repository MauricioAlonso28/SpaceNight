import { useMemo, type CSSProperties } from 'react';
import { useAhora } from '../../estado/hooks';
import { useEstado } from '../../estado/store';
import { textos } from '../../idioma/idioma';
import { fraccionIluminada } from '../../servicios/astro/luna';
import { formatearDiaCorto } from '../../servicios/formato';
import { inicioDelDia, sumarDias } from '../../servicios/tiempo';
import { textoCuando } from './textos';

export const DIAS_MAX = 30;

function mezcla(a: number[], b: number[], t: number): string {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',');
}

/** Degradado de la pista: cada tramo tan claro como la Luna de ese día. */
function degradadoLuna(ahora: Date): string {
  const paradas: string[] = [];
  for (let d = 0; d <= DIAS_MAX; d++) {
    const luz = fraccionIluminada(sumarDias(ahora, d));
    const color = mezcla([26, 31, 61], [243, 234, 210], luz);
    paradas.push(`rgb(${color}) ${((d / DIAS_MAX) * 100).toFixed(1)}%`);
  }
  return `linear-gradient(90deg, ${paradas.join(', ')})`;
}

/** Deslizador Ver otras noches: mueve la fecha vista hasta 30 días adelante. */
export function DeslizadorNoches() {
  const ahora = useAhora();
  const dias = useEstado((s) => s.diasAdelante);
  const fijar = useEstado((s) => s.fijarDiasAdelante);
  const zona = useEstado((s) => s.ubicacion.zona);
  const inicioHoy = inicioDelDia(ahora, zona).getTime();
  const pista = useMemo(() => degradadoLuna(new Date(inicioHoy)), [inicioHoy]);
  const cuando = textoCuando(
    dias,
    formatearDiaCorto(sumarDias(ahora, dias), zona),
  );

  return (
    <div className="deslizador">
      <label htmlFor="dias">
        <span>
          {textos({ es: 'Ver otras noches', en: 'See other nights' })}
        </span>
        <output htmlFor="dias">{cuando}</output>
      </label>
      <input
        type="range"
        id="dias"
        min={0}
        max={DIAS_MAX}
        step={1}
        value={dias}
        aria-valuetext={cuando}
        onChange={(e) => fijar(Number(e.target.value))}
        style={{ '--pista-luna': pista } as CSSProperties}
      />
    </div>
  );
}
