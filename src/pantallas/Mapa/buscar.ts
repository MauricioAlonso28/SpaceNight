/** Algo que se puede buscar en el mapa. */
export interface Buscable {
  clave: string;
  nombres: string[];
  prioridad: number;
}

/** Minúsculas y sin tildes, para comparar lo que se escribe con los nombres. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function puntaje(nombre: string, consulta: string): number {
  const n = normalizar(nombre);
  if (n === consulta) return 3;
  if (n.startsWith(consulta)) return 2;
  if (n.includes(consulta)) return 1;
  return 0;
}

/**
 * El objeto que mejor encaja: primero el nombre exacto, luego el que empieza igual y luego el que lo contiene.
 * A igual encaje gana la prioridad más baja (planetas antes que estrellas).
 */
export function buscar<T extends Buscable>(
  consulta: string,
  lista: readonly T[],
): T | null {
  const q = normalizar(consulta);
  if (q.length < 2) return null;
  let mejor: { item: T; p: number } | null = null;
  for (const item of lista) {
    const p = Math.max(...item.nombres.map((n) => puntaje(n, q)));
    if (p === 0) continue;
    const gana =
      !mejor ||
      p > mejor.p ||
      (p === mejor.p && item.prioridad < mejor.item.prioridad);
    if (gana) mejor = { item, p };
  }
  return mejor?.item ?? null;
}
