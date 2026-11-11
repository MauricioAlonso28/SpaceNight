import { useEffect, useState } from 'react';

function reducirMovimiento(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/** Un número que sube desde cero hasta su valor en menos de un segundo al aparecer. */
export function useContar(objetivo: number, ms = 900): number {
  const [valor, setValor] = useState(() =>
    reducirMovimiento() ? objetivo : 0,
  );
  useEffect(() => {
    if (reducirMovimiento()) {
      const id = requestAnimationFrame(() => setValor(objetivo));
      return () => cancelAnimationFrame(id);
    }
    let cuadro = 0;
    const inicio = performance.now();
    const paso = (t: number) => {
      const k = Math.min((t - inicio) / ms, 1);
      setValor(objetivo * (1 - (1 - k) ** 3));
      if (k < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo, ms]);
  return valor;
}
