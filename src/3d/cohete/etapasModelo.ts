import { Box3, Mesh, Vector3, type Material, type Object3D } from 'three';
import { suave } from './vistas';

/** Lo que tarda en segundos separar las etapas o sacar una pieza. */
export const DURACION_ETAPAS = 0.6;

/** Opacidad de las piezas que no están abiertas, con una pieza ya fuera. */
const OPACIDAD_RESTO = 0.2;

/**
 * Mueve un valor hacia su meta a velocidad constante, sin pasarse.
 * @param duracion segundos para ir de 0 a 1; con 0 llega de golpe
 */
export function acercar(
  actual: number,
  meta: number,
  dt: number,
  duracion = DURACION_ETAPAS,
): number {
  const paso = duracion > 0 ? dt / duracion : 1;
  return actual < meta
    ? Math.min(meta, actual + paso)
    : Math.max(meta, actual - paso);
}

/** Altura extra de cada etapa en la vista separada: cada una sube un hueco más que la de debajo. */
export function alturasSeparadas(n: number, hueco: number): number[] {
  return Array.from({ length: n }, (_, i) => i * hueco);
}

interface Pieza {
  id: string;
  objeto: Object3D;
  base: Vector3;
  centro: Vector3;
  radio: number;
  materiales: Material[];
}

/**
 * Hacia dónde mira la cámara: el modelo entero o la pieza abierta.
 * @property mezcla 0 con el modelo entero, 1 con la pieza ya fuera
 */
export interface Enfoque {
  centro: Vector3;
  radio: number;
  mezcla: number;
}

/** Control de las etapas de un modelo que se puede desarmar. */
export interface Etapas {
  separar: (si: boolean) => void;
  abrir: (id: string, lado: Vector3) => void;
  cerrar: () => void;
  avanzar: (dt: number) => boolean;
  enfoque: () => Enfoque;
  piezaDe: (objeto: Object3D) => string | null;
}

/** Da a una etapa materiales propios, para poder apagarla sola, y guarda su sitio, centro y radio. */
function prepararPieza(id: string, objeto: Object3D): Pieza {
  const materiales: Material[] = [];
  objeto.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    const propios = (Array.isArray(o.material) ? o.material : [o.material]).map(
      (m: Material) => m.clone(),
    );
    o.material = Array.isArray(o.material) ? propios : propios[0];
    materiales.push(...propios);
  });
  const caja = new Box3().setFromObject(objeto);
  return {
    id,
    objeto,
    base: objeto.position.clone(),
    centro: caja.getCenter(new Vector3()),
    radio: caja.getSize(new Vector3()).length() / 2 || 1,
    materiales,
  };
}

/** Opacidad de todos los materiales de una etapa; por debajo de 1 deja de tapar a las demás. */
function fijarOpacidad(p: Pieza, opacidad: number): void {
  for (const m of p.materiales) {
    m.transparent = opacidad < 1;
    m.depthWrite = opacidad >= 1;
    m.opacity = opacidad;
  }
}

/**
 * Prepara las etapas de un modelo ya centrado: cada una es un hijo con nombre propio, de abajo arriba.
 * Separar abre un hueco entre etapas; abrir saca una pieza hacia un lado y apaga las demás.
 * @param ids nombres de los nodos de cada etapa, de abajo arriba
 * @param radioModelo radio de la esfera que envuelve el modelo entero
 * @param moverse false con movimiento reducido: todo llega de golpe
 * @returns null si al modelo le falta alguna de las etapas
 */
export function crearEtapas(
  modelo: Object3D,
  ids: readonly string[],
  radioModelo: number,
  moverse: boolean,
): Etapas | null {
  modelo.updateMatrixWorld(true);
  const objetos = ids.map((id) => modelo.getObjectByName(id));
  if (!ids.length || objetos.some((o) => !o)) return null;
  const piezas = ids.map((id, i) => prepararPieza(id, objetos[i]!));
  const hueco = radioModelo * 0.06;
  const alturas = alturasSeparadas(piezas.length, hueco);
  const duracion = moverse ? DURACION_ETAPAS : 0;
  const separacion = { valor: 0, meta: 0 };
  const extraccion = { valor: 0, meta: 0 };
  const lado = new Vector3(1, 0, 0);
  let abierta: Pieza | null = null;

  const desplazamiento = (p: Pieza, i: number) => {
    const d = new Vector3(0, alturas[i] * suave(separacion.valor), 0);
    if (p === abierta) {
      d.addScaledVector(lado, radioModelo * 0.2 * suave(extraccion.valor));
    }
    return d;
  };

  const colocar = () => {
    const apagado = 1 - (1 - OPACIDAD_RESTO) * suave(extraccion.valor);
    piezas.forEach((p, i) => {
      p.objeto.position.copy(p.base).add(desplazamiento(p, i));
      fijarOpacidad(p, p === abierta ? 1 : apagado);
    });
  };

  return {
    separar: (si) => {
      separacion.meta = si ? 1 : 0;
    },
    abrir: (id, haciaLado) => {
      const pieza = piezas.find((p) => p.id === id) ?? null;
      if (!pieza || pieza === abierta) return;
      if (abierta) extraccion.valor = 0;
      abierta = pieza;
      lado.copy(haciaLado).normalize();
      extraccion.meta = 1;
    },
    cerrar: () => {
      extraccion.meta = 0;
    },
    avanzar: (dt) => {
      separacion.valor = acercar(
        separacion.valor,
        separacion.meta,
        dt,
        duracion,
      );
      extraccion.valor = acercar(
        extraccion.valor,
        extraccion.meta,
        dt,
        duracion,
      );
      colocar();
      if (extraccion.valor === 0 && extraccion.meta === 0) abierta = null;
      return (
        separacion.valor !== separacion.meta ||
        extraccion.valor !== extraccion.meta
      );
    },
    enfoque: () => {
      const alto = alturas[alturas.length - 1] * suave(separacion.valor);
      const general = new Vector3(0, alto / 2, 0);
      if (!abierta) {
        return { centro: general, radio: radioModelo + alto / 2, mezcla: 0 };
      }
      const i = piezas.indexOf(abierta);
      const encuadre = Math.max(abierta.radio * 1.5, radioModelo * 0.2);
      const centro = abierta.centro.clone().add(desplazamiento(abierta, i));
      const mezcla = suave(extraccion.valor);
      const radioGeneral = radioModelo + alto / 2;
      return {
        centro: general.lerp(centro, mezcla),
        radio: radioGeneral + (encuadre - radioGeneral) * mezcla,
        mezcla,
      };
    },
    piezaDe: (objeto) => {
      for (let o: Object3D | null = objeto; o; o = o.parent) {
        const p = piezas.find((x) => x.objeto === o);
        if (p) return p.id;
      }
      return null;
    },
  };
}
