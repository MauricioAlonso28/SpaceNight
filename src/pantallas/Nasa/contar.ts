import { useEffect, useRef, useState } from 'react';

function reducirMovimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Un número que sube desde cero al aparecer y, si el valor cambia después, pasa del que mostraba al nuevo en menos de un segundo. */
export function useContar(objetivo: number, ms = 900): number {
  const [valor, setValor] = useState(() =>
    reducirMovimiento() ? objetivo : 0,
  );
  const mostrado = useRef(valor);
  useEffect(() => {
    if (reducirMovimiento()) {
      const id = requestAnimationFrame(() => setValor(objetivo));
      return () => cancelAnimationFrame(id);
    }
    let cuadro = 0;
    const desde = mostrado.current;
    const inicio = performance.now();
    const paso = (t: number) => {
      const k = Math.min((t - inicio) / ms, 1);
      const v = desde + (objetivo - desde) * (1 - (1 - k) ** 3);
      mostrado.current = v;
      setValor(v);
      if (k < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo, ms]);
  return valor;
}
