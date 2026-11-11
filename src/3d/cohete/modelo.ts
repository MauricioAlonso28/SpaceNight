import {
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  type Material,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Radio del cuerpo del cohete, en metros. */
export const RADIO = 2.6;
const RADIO_COFIA = 3.1;

/** Altura total, de la boca de las toberas a la punta de la cofia. */
export const ALTO = 72.6;

const COLORES = {
  aluminio: 0xe9e7e1,
  carbono: 0x24272d,
  cofia: 0xf3f2ee,
  oxigeno: 0x9fc2ee,
  combustible: 0xd9a657,
  acero: 0xb4b9c2,
  titanio: 0x8c9098,
  oscuro: 0x34373d,
  oro: 0xd4a53c,
  panel: 0x2a4785,
  escudo: 0x4a433d,
  tobera: 0xa47f63,
} as const;

type Acabado = keyof typeof COLORES;

/** Cuánto brilla y cuánto refleja cada acabado, de 0 a 1: pintura mate, metal pulido, lámina de oro, fibra de carbono. */
const SUPERFICIE: Record<Acabado, { rugosidad: number; metal: number }> = {
  aluminio: { rugosidad: 0.42, metal: 0.55 },
  carbono: { rugosidad: 0.38, metal: 0.15 },
  cofia: { rugosidad: 0.32, metal: 0 },
  oxigeno: { rugosidad: 0.4, metal: 0.35 },
  combustible: { rugosidad: 0.4, metal: 0.35 },
  acero: { rugosidad: 0.3, metal: 0.85 },
  titanio: { rugosidad: 0.45, metal: 0.9 },
  oscuro: { rugosidad: 0.6, metal: 0.2 },
  oro: { rugosidad: 0.22, metal: 1 },
  panel: { rugosidad: 0.25, metal: 0.4 },
  escudo: { rugosidad: 0.85, metal: 0 },
  tobera: { rugosidad: 0.38, metal: 0.75 },
};

/** Hacia dónde sale una pieza al desarmarla. */
export type Salida = 'radial' | 'camara' | 'abajo' | 'arriba';

/**
 * Una pieza del modelo ya colocada en el cohete.
 * @property ancla punto de la pieza al que apuntan su etiqueta y la cámara
 * @property radio tamaño aproximado, para encuadrarla
 * @property recortable si la vista de corte le quita la mitad delantera
 * @property toque malla invisible y más grande para acertar a piezas chicas
 */
export interface PiezaModelo {
  id: string;
  malla: Mesh;
  ancla: Vector3;
  radio: number;
  recortable: boolean;
  salida: Salida;
  toque: Mesh | null;
}

/** El cohete armado: su grupo, las piezas por id y los cascos que no se eligen. */
export interface ModeloCohete {
  grupo: Group;
  piezas: Map<string, PiezaModelo>;
  cascos: Mesh[];
}

interface Definicion {
  id: string;
  acabado: Acabado | Acabado[];
  partes: () => BufferGeometry[];
  recortable?: boolean;
  pequena?: boolean;
  salida?: Salida;
}

const grados = (g: number) => (g * Math.PI) / 180;

function material(acabado: Acabado): Material {
  return new MeshStandardMaterial({
    color: COLORES[acabado],
    metalness: SUPERFICIE[acabado].metal,
    roughness: SUPERFICIE[acabado].rugosidad,
    side: DoubleSide,
  });
}

/** Mueve una pieza a cierta distancia del eje, a cierta altura y en cierto ángulo (en grados). */
function situar(
  g: BufferGeometry,
  radio: number,
  y: number,
  angulo = 0,
): BufferGeometry {
  g.translate(radio, y, 0);
  g.rotateY(grados(angulo));
  return g;
}

function cilindro(
  rArriba: number,
  rAbajo: number,
  alto: number,
  yCentro: number,
  abierto = false,
): BufferGeometry {
  return new CylinderGeometry(rArriba, rAbajo, alto, 48, 1, abierto).translate(
    0,
    yCentro,
    0,
  );
}

function caja(
  x: number,
  y: number,
  z: number,
  radio: number,
  yCentro: number,
  angulo = 0,
): BufferGeometry {
  return situar(new BoxGeometry(x, y, z), radio, yCentro, angulo);
}

function anillo(radio: number, tubo: number, y: number): BufferGeometry {
  return new TorusGeometry(radio, tubo, 8, 64)
    .rotateX(Math.PI / 2)
    .translate(0, y, 0);
}

/** Tobera acampanada, de la boca (abajo) a la garganta (arriba). */
function campana(
  rBoca: number,
  rGarganta: number,
  alto: number,
  y0: number,
): BufferGeometry {
  const puntos: Vector2[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    puntos.push(
      new Vector2(
        rGarganta + (rBoca - rGarganta) * (1 - t) ** 1.7,
        y0 + t * alto,
      ),
    );
  }
  return new LatheGeometry(puntos, 40);
}

/** Tanque cilíndrico con domos en los extremos. */
function tanque(radio: number, y0: number, y1: number): BufferGeometry {
  const domo = radio * 0.45;
  const puntos: Vector2[] = [];
  for (let i = 0; i <= 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
    puntos.push(
      new Vector2(
        Math.max(radio * Math.cos(a), 0.001),
        y0 + domo + domo * Math.sin(a),
      ),
    );
  }
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    puntos.push(
      new Vector2(
        Math.max(radio * Math.cos(a), 0.001),
        y1 - domo + domo * Math.sin(a),
      ),
    );
  }
  return new LatheGeometry(puntos, 56);
}

function cofia(): BufferGeometry {
  const puntos = [new Vector2(RADIO, 58.5), new Vector2(RADIO_COFIA, 59.3)];
  const base = 65.5;
  const largo = 7;
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    puntos.push(
      new Vector2(
        Math.max(RADIO_COFIA * Math.cos((t * Math.PI) / 2) ** 0.72, 0.001),
        base + t * largo,
      ),
    );
  }
  return new LatheGeometry(puntos, 64);
}

function aletaRejilla(angulo: number): BufferGeometry {
  const barras: BufferGeometry[] = [];
  const largo = 1.4;
  const ancho = 1.2;
  for (let i = 0; i <= 5; i++) {
    barras.push(
      new BoxGeometry(largo, 0.22, 0.05).translate(
        0,
        0,
        -ancho / 2 + (i * ancho) / 5,
      ),
    );
  }
  for (let i = 0; i <= 6; i++) {
    barras.push(
      new BoxGeometry(0.05, 0.22, ancho).translate(
        -largo / 2 + (i * largo) / 6,
        0,
        0,
      ),
    );
  }
  const rejilla = mergeGeometries(barras);
  barras.forEach((b) => b.dispose());
  return situar(rejilla, RADIO + 0.1 + largo / 2, 39, angulo);
}

function propulsorControl(angulo: number): BufferGeometry {
  const capsula = new BoxGeometry(0.3, 0.55, 0.42);
  const boquilla = new CylinderGeometry(0.05, 0.1, 0.18, 12)
    .rotateZ(-Math.PI / 2)
    .translate(0.22, 0, 0);
  const g = mergeGeometries([capsula, boquilla]);
  capsula.dispose();
  boquilla.dispose();
  return situar(g, RADIO + 0.14, 57.9, angulo);
}

const DEFINICIONES: Definicion[] = [
  {
    id: 'cofia',
    acabado: 'cofia',
    partes: () => [cofia()],
    recortable: true,
    salida: 'arriba',
  },
  {
    id: 'satelite',
    acabado: ['oro', 'panel', 'acero'],
    partes: () => [
      new BoxGeometry(1.7, 2.5, 1.7).translate(0, 60.9, 0),
      mergeGeometries([
        new BoxGeometry(0.08, 2.3, 1.5).translate(0.95, 60.9, 0),
        new BoxGeometry(0.08, 2.3, 1.5).translate(-0.95, 60.9, 0),
      ]),
      new SphereGeometry(0.45, 24, 8, 0, Math.PI * 2, 0, Math.PI / 3).translate(
        0,
        61.95,
        0,
      ),
    ],
    salida: 'camara',
  },
  {
    id: 'adaptador-carga',
    acabado: 'acero',
    partes: () => [cilindro(0.85, 1.7, 1.1, 59.05)],
    salida: 'camara',
  },
  {
    id: 'apertura-cofia',
    acabado: 'acero',
    partes: () => [
      caja(0.12, 6, 0.12, RADIO_COFIA - 0.14, 62.4, 0),
      caja(0.12, 6, 0.12, RADIO_COFIA - 0.14, 62.4, 180),
      anillo(RADIO_COFIA - 0.16, 0.06, 59.4),
    ],
    pequena: true,
  },
  {
    id: 'motor-vacio',
    acabado: 'tobera',
    partes: () => [campana(1.45, 0.28, 4.6, 41), cilindro(0.32, 0.28, 0.8, 46)],
    salida: 'camara',
  },
  {
    id: 'tanque-oxigeno-2',
    acabado: 'oxigeno',
    partes: () => [tanque(RADIO - 0.12, 50.6, 56.3)],
    recortable: true,
    salida: 'camara',
  },
  {
    id: 'tanque-combustible-2',
    acabado: 'combustible',
    partes: () => [tanque(RADIO - 0.12, 46.9, 50.3)],
    recortable: true,
    salida: 'camara',
  },
  {
    id: 'tanques-helio',
    acabado: 'carbono',
    partes: () =>
      [90, 210, 330].map((a) =>
        situar(new SphereGeometry(0.5, 24, 16), 1.45, 57.5, a),
      ),
    pequena: true,
  },
  {
    id: 'propulsores-control',
    acabado: 'oscuro',
    partes: () => [45, 135, 225, 315].map(propulsorControl),
    pequena: true,
  },
  {
    id: 'computadora-vuelo',
    acabado: 'oscuro',
    partes: () => [caja(0.75, 0.55, 0.5, 1.5, 57.5, 30)],
    pequena: true,
  },
  {
    id: 'antenas',
    acabado: 'oscuro',
    partes: () => [
      caja(0.4, 0.55, 0.06, RADIO + 0.2, 53.5, 0),
      caja(0.4, 0.55, 0.06, RADIO + 0.2, 49, 180),
    ],
    pequena: true,
  },
  {
    id: 'baterias',
    acabado: 'titanio',
    partes: () => [caja(0.6, 0.5, 0.45, 1.5, 57.5, 150)],
    pequena: true,
  },
  {
    id: 'interetapa',
    acabado: 'carbono',
    partes: () => [cilindro(RADIO, RADIO, 6.5, 43.25, true)],
    recortable: true,
    salida: 'camara',
  },
  {
    id: 'sistema-separacion',
    acabado: 'acero',
    partes: () => [
      anillo(RADIO - 0.35, 0.09, 40.6),
      ...[45, 135, 225, 315].map((a) =>
        situar(new CylinderGeometry(0.1, 0.1, 0.9, 12), RADIO - 0.45, 41.1, a),
      ),
    ],
    salida: 'camara',
  },
  {
    id: 'aletas-rejilla',
    acabado: 'titanio',
    partes: () => [0, 90, 180, 270].map(aletaRejilla),
  },
  {
    id: 'tanque-oxigeno-1',
    acabado: 'oxigeno',
    partes: () => [tanque(RADIO - 0.12, 17.8, 38.8)],
    recortable: true,
    salida: 'camara',
  },
  {
    id: 'tanque-combustible-1',
    acabado: 'combustible',
    partes: () => [tanque(RADIO - 0.12, 6.8, 17.4)],
    recortable: true,
    salida: 'camara',
  },
  {
    id: 'conducto-oxigeno',
    acabado: 'acero',
    partes: () => [cilindro(0.28, 0.28, 13.6, 11.8)],
    salida: 'camara',
  },
  {
    id: 'patas-aterrizaje',
    acabado: 'carbono',
    partes: () =>
      [45, 135, 225, 315].flatMap((a) => [
        caja(0.28, 10.5, 0.55, RADIO + 0.16, 8.65, a),
        caja(0.5, 0.2, 0.9, RADIO + 0.3, 3.35, a),
      ]),
  },
  {
    id: 'motores-principales',
    acabado: 'tobera',
    partes: () =>
      Array.from({ length: 8 }, (_, i) => 22.5 + i * 45).flatMap((a) => [
        situar(campana(0.6, 0.29, 2.6, 0.25), 1.75, 0, a),
        situar(new CylinderGeometry(0.34, 0.29, 0.95, 24), 1.75, 3.33, a),
      ]),
    salida: 'abajo',
  },
  {
    id: 'tobera',
    acabado: 'tobera',
    partes: () => [campana(0.62, 0.3, 2.7, 0.15)],
    salida: 'abajo',
  },
  {
    id: 'camara-combustion',
    acabado: 'acero',
    partes: () => [cilindro(0.36, 0.3, 1, 3.35)],
    salida: 'camara',
  },
  {
    id: 'inyector',
    acabado: 'titanio',
    partes: () => [cilindro(0.42, 0.42, 0.22, 3.96)],
    pequena: true,
    salida: 'camara',
  },
  {
    id: 'turbobomba',
    acabado: 'oscuro',
    partes: () => [
      situar(new CylinderGeometry(0.24, 0.24, 0.8, 24), 0.78, 3.7),
      situar(new CylinderGeometry(0.08, 0.08, 1.2, 12), 0.98, 2.9),
    ],
    pequena: true,
  },
  {
    id: 'cardan',
    acabado: 'titanio',
    partes: () => [anillo(0.4, 0.07, 4.25), caja(0.3, 0.35, 0.3, 0, 4.55)],
    pequena: true,
    salida: 'camara',
  },
  {
    id: 'escudo-termico-base',
    acabado: 'escudo',
    partes: () => [cilindro(RADIO, RADIO, 0.25, 3.02)],
    salida: 'abajo',
  },
];

const CASCOS: [number, number][] = [
  [3.15, 40],
  [46.5, 58.5],
];

/** Malla de toque: cajas algo más grandes que cada parte de una pieza chica. */
function mallaToque(partes: BufferGeometry[], id: string): Mesh {
  const cajas = partes.map((p) => {
    p.computeBoundingBox();
    const b = p.boundingBox!;
    const tamano = b.getSize(new Vector3()).addScalar(0.5);
    const centro = b.getCenter(new Vector3());
    return new BoxGeometry(tamano.x, tamano.y, tamano.z).translate(
      centro.x,
      centro.y,
      centro.z,
    );
  });
  const malla = new Mesh(
    mergeGeometries(cajas),
    new MeshBasicMaterial({ visible: false }),
  );
  cajas.forEach((c) => c.dispose());
  malla.userData.id = id;
  return malla;
}

function construirPieza(d: Definicion): PiezaModelo {
  const partes = d.partes();
  const multiple = Array.isArray(d.acabado);
  const geometria = mergeGeometries(partes, multiple);
  const materiales = multiple
    ? (d.acabado as Acabado[]).map(material)
    : material(d.acabado as Acabado);
  const malla = new Mesh(geometria, materiales);
  malla.userData.id = d.id;
  partes[0].computeBoundingBox();
  const ancla = partes[0].boundingBox!.getCenter(new Vector3());
  geometria.computeBoundingSphere();
  const toque = d.pequena ? mallaToque(partes, d.id) : null;
  partes.forEach((p) => p.dispose());
  return {
    id: d.id,
    malla,
    ancla,
    radio: geometria.boundingSphere!.radius,
    recortable: d.recortable ?? false,
    salida: d.salida ?? 'radial',
    toque,
  };
}

/** Arma el cohete genérico: una malla por componente físico y los dos cascos de aluminio. */
export function crearModelo(): ModeloCohete {
  const grupo = new Group();
  const piezas = new Map<string, PiezaModelo>();
  for (const d of DEFINICIONES) {
    const p = construirPieza(d);
    piezas.set(p.id, p);
    grupo.add(p.malla);
    if (p.toque) grupo.add(p.toque);
  }
  const cascos = CASCOS.map(([y0, y1]) => {
    const casco = new Mesh(
      cilindro(RADIO, RADIO, y1 - y0, (y0 + y1) / 2, true),
      material('aluminio'),
    );
    casco.userData.casco = true;
    grupo.add(casco);
    return casco;
  });
  return { grupo, piezas, cascos };
}

/** Ids de las piezas con malla, en el orden en que se arman. */
export const IDS_MODELO = DEFINICIONES.map((d) => d.id);
