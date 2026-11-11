/** Las piezas que aparecen en los diagramas de motor. */
export type TipoPieza =
  | 'tanque-f'
  | 'tanque-o'
  | 'helio'
  | 'bomba'
  | 'turbina'
  | 'quemador'
  | 'bateria'
  | 'camara'
  | 'escape'
  | 'camisa';

/** Lo que corre por un tubo. */
export type Fluido =
  'combustible' | 'oxidante' | 'caliente' | 'gas' | 'electrico' | 'eje';

/** Una pieza del diagrama, con su posición en un lienzo de 400 × 460. */
export interface Pieza {
  id: string;
  tipo: TipoPieza;
  x: number;
  y: number;
  nombre: { es: string; en: string };
}

/** Un tubo, un cable o un eje entre dos piezas, con puntos intermedios opcionales. */
export interface Tubo {
  de: string;
  a: string;
  fluido: Fluido;
  por?: [number, number][];
  fino?: boolean;
}

/** Un ciclo de motor con su diagrama y su explicación. */
export interface Ciclo {
  id: string;
  nombre: { es: string; en: string };
  resumen: { es: string; en: string };
  piezas: Pieza[];
  tubos: Tubo[];
  pasos: { pieza: string; es: string; en: string }[];
  pros: { es: string; en: string };
  contras: { es: string; en: string };
  motores: string[];
  presion: 1 | 2 | 3 | 4;
}

const n = (es: string, en: string) => ({ es, en });

const TANQUES = (fx = 100, ox = 300): Pieza[] => [
  {
    id: 'tf',
    tipo: 'tanque-f',
    x: fx,
    y: 40,
    nombre: n('Tanque de combustible', 'Fuel tank'),
  },
  {
    id: 'to',
    tipo: 'tanque-o',
    x: ox,
    y: 40,
    nombre: n('Tanque de oxígeno líquido', 'Liquid oxygen tank'),
  },
];
const BOMBAS = (fx = 100, ox = 300): Pieza[] => [
  {
    id: 'bf',
    tipo: 'bomba',
    x: fx,
    y: 140,
    nombre: n('Bomba de combustible', 'Fuel pump'),
  },
  {
    id: 'bo',
    tipo: 'bomba',
    x: ox,
    y: 140,
    nombre: n('Bomba de oxígeno', 'Oxygen pump'),
  },
];
const CAMARA: Pieza = {
  id: 'c',
  tipo: 'camara',
  x: 200,
  y: 300,
  nombre: n('Cámara de combustión y tobera', 'Combustion chamber and nozzle'),
};
const TURBINA: Pieza = {
  id: 't',
  tipo: 'turbina',
  x: 200,
  y: 140,
  nombre: n('Turbina', 'Turbine'),
};
const ALIMENTAR: Tubo[] = [
  { de: 'tf', a: 'bf', fluido: 'combustible' },
  { de: 'to', a: 'bo', fluido: 'oxidante' },
];
const EJES: Tubo[] = [
  { de: 't', a: 'bf', fluido: 'eje' },
  { de: 't', a: 'bo', fluido: 'eje' },
];

/** Los seis ciclos, del más simple al más complejo. */
export const CICLOS: Ciclo[] = [
  {
    id: 'presion',
    nombre: n('Alimentado por presión', 'Pressure-fed'),
    resumen: n(
      'Sin bombas: un gas a presión empuja los propelentes desde los tanques hasta la cámara.',
      'No pumps: a pressurized gas pushes the propellants from the tanks into the chamber.',
    ),
    piezas: [
      ...TANQUES(90, 310),
      {
        id: 'he',
        tipo: 'helio',
        x: 200,
        y: 40,
        nombre: n('Esfera de helio', 'Helium sphere'),
      },
      CAMARA,
    ],
    tubos: [
      { de: 'he', a: 'tf', fluido: 'gas' },
      { de: 'he', a: 'to', fluido: 'gas' },
      { de: 'tf', a: 'c', fluido: 'combustible', por: [[90, 300]] },
      { de: 'to', a: 'c', fluido: 'oxidante', por: [[310, 300]] },
    ],
    pasos: [
      {
        pieza: 'he',
        es: 'Helio a muy alta presión entra en los dos tanques.',
        en: 'Very high-pressure helium flows into both tanks.',
      },
      {
        pieza: 'tf',
        es: 'La presión del tanque empuja el combustible y el oxidante por los tubos.',
        en: 'Tank pressure pushes the fuel and the oxidizer down the lines.',
      },
      {
        pieza: 'c',
        es: 'Se mezclan y arden en la cámara; la tobera acelera el gas hacia atrás.',
        en: 'They mix and burn in the chamber; the nozzle speeds the gas backward.',
      },
    ],
    pros: n(
      'Muy simple y fiable, se enciende y apaga muchas veces.',
      'Very simple and reliable, it starts and stops many times.',
    ),
    contras: n(
      'Los tanques tienen que aguantar toda la presión, así que pesan mucho: solo sirve para motores chicos.',
      'The tanks must hold all the pressure, so they are heavy: only good for small engines.',
    ),
    motores: ['Draco (Dragon)', 'AJ10 (Apollo)'],
    presion: 1,
  },
  {
    id: 'electrico',
    nombre: n('Bomba eléctrica', 'Electric pump'),
    resumen: n(
      'Motores eléctricos alimentados por baterías hacen girar las bombas.',
      'Battery-powered electric motors spin the pumps.',
    ),
    piezas: [
      ...TANQUES(),
      ...BOMBAS(),
      {
        id: 'ba',
        tipo: 'bateria',
        x: 200,
        y: 215,
        nombre: n('Baterías', 'Batteries'),
      },
      CAMARA,
    ],
    tubos: [
      ...ALIMENTAR,
      { de: 'ba', a: 'bf', fluido: 'electrico', por: [[100, 215]] },
      { de: 'ba', a: 'bo', fluido: 'electrico', por: [[300, 215]] },
      { de: 'bf', a: 'c', fluido: 'combustible', por: [[100, 300]] },
      { de: 'bo', a: 'c', fluido: 'oxidante', por: [[300, 300]] },
    ],
    pasos: [
      {
        pieza: 'ba',
        es: 'Las baterías mandan corriente a dos motores eléctricos.',
        en: 'The batteries feed current to two electric motors.',
      },
      {
        pieza: 'bf',
        es: 'Cada motor hace girar una bomba que sube la presión del propelente.',
        en: 'Each motor spins a pump that raises the propellant pressure.',
      },
      {
        pieza: 'c',
        es: 'Todo el propelente va a la cámara: no se desperdicia nada.',
        en: 'All the propellant goes to the chamber: nothing is wasted.',
      },
    ],
    pros: n(
      'Sin turbinas ni gases calientes: fácil de controlar y de fabricar en impresora 3D.',
      'No turbines or hot gas: easy to control and to 3D-print.',
    ),
    contras: n(
      'Las baterías pesan y se vacían; solo vale para cohetes pequeños.',
      'Batteries are heavy and run down; only worth it for small rockets.',
    ),
    motores: ['Rutherford (Electron)'],
    presion: 2,
  },
  {
    id: 'generador',
    nombre: n('Generador de gas', 'Gas generator'),
    resumen: n(
      'Una pequeña parte del propelente se quema aparte para mover la turbina, y ese gas se tira por un escape.',
      'A small share of the propellant is burned separately to drive the turbine, and that gas is dumped overboard.',
    ),
    piezas: [
      ...TANQUES(),
      ...BOMBAS(),
      TURBINA,
      {
        id: 'g',
        tipo: 'quemador',
        x: 200,
        y: 215,
        nombre: n('Generador de gas', 'Gas generator'),
      },
      {
        id: 'e',
        tipo: 'escape',
        x: 362,
        y: 255,
        nombre: n('Escape de la turbina', 'Turbine exhaust'),
      },
      CAMARA,
    ],
    tubos: [
      ...ALIMENTAR,
      ...EJES,
      { de: 'bf', a: 'c', fluido: 'combustible', por: [[100, 300]] },
      { de: 'bo', a: 'c', fluido: 'oxidante', por: [[300, 300]] },
      {
        de: 'bf',
        a: 'g',
        fluido: 'combustible',
        por: [[100, 215]],
        fino: true,
      },
      { de: 'bo', a: 'g', fluido: 'oxidante', por: [[300, 215]], fino: true },
      { de: 'g', a: 't', fluido: 'caliente' },
      {
        de: 't',
        a: 'e',
        fluido: 'caliente',
        por: [
          [200, 96],
          [362, 96],
        ],
      },
    ],
    pasos: [
      {
        pieza: 'g',
        es: 'Un poco de combustible y oxígeno arden en el generador de gas.',
        en: 'A little fuel and oxygen burn in the gas generator.',
      },
      {
        pieza: 't',
        es: 'Ese gas caliente hace girar la turbina, unida por un eje a las dos bombas.',
        en: 'That hot gas spins the turbine, linked by a shaft to both pumps.',
      },
      {
        pieza: 'e',
        es: 'Después sale por un escape aparte: es propelente que no empuja casi nada.',
        en: 'Then it leaves through a separate exhaust: propellant that barely adds thrust.',
      },
      {
        pieza: 'c',
        es: 'El resto entra a la cámara a alta presión.',
        en: 'The rest enters the chamber at high pressure.',
      },
    ],
    pros: n(
      'Probado y relativamente simple: la turbina no recibe toda la presión.',
      'Proven and fairly simple: the turbine does not see the full pressure.',
    ),
    contras: n(
      'Tira entre un 2 y un 5 % del propelente por el escape.',
      'It dumps 2 to 5% of the propellant through the exhaust.',
    ),
    motores: ['F-1 (Saturno V)', 'Merlin (Falcon 9)', 'Vulcain 2 (Ariane)'],
    presion: 2,
  },
  {
    id: 'etapas',
    nombre: n('Combustión por etapas', 'Staged combustion'),
    resumen: n(
      'El gas que mueve la turbina no se tira: después entra a la cámara y sigue empujando. Es un ciclo cerrado. Aquí, rico en oxígeno; el RS-25 lo hace al revés, rico en combustible.',
      'The gas that drives the turbine is not dumped: it then enters the chamber and keeps pushing. It is a closed cycle. Shown here oxygen-rich; the RS-25 does it the other way round, fuel-rich.',
    ),
    piezas: [
      ...TANQUES(),
      ...BOMBAS(),
      TURBINA,
      {
        id: 'g',
        tipo: 'quemador',
        x: 200,
        y: 215,
        nombre: n('Precámara', 'Preburner'),
      },
      CAMARA,
    ],
    tubos: [
      ...ALIMENTAR,
      ...EJES,
      { de: 'bo', a: 'g', fluido: 'oxidante', por: [[300, 215]] },
      {
        de: 'bf',
        a: 'g',
        fluido: 'combustible',
        por: [[100, 215]],
        fino: true,
      },
      { de: 'bf', a: 'c', fluido: 'combustible', por: [[100, 300]] },
      { de: 'g', a: 't', fluido: 'caliente' },
      {
        de: 't',
        a: 'c',
        fluido: 'caliente',
        por: [
          [248, 168],
          [248, 262],
        ],
      },
    ],
    pasos: [
      {
        pieza: 'g',
        es: 'Todo el oxígeno pasa por una precámara con un poco de combustible: arde con exceso de oxígeno.',
        en: 'All the oxygen goes through a preburner with a little fuel: it burns oxygen-rich.',
      },
      {
        pieza: 't',
        es: 'Ese gas mueve la turbina y las bombas.',
        en: 'That gas drives the turbine and the pumps.',
      },
      {
        pieza: 'c',
        es: 'Luego entra a la cámara, donde termina de quemarse con el resto del combustible.',
        en: 'Then it enters the chamber, where it finishes burning with the rest of the fuel.',
      },
    ],
    pros: n(
      'No se desperdicia propelente y la cámara llega a presiones muy altas: más eficiencia.',
      'No propellant is wasted and the chamber reaches very high pressure: more efficiency.',
    ),
    contras: n(
      'La turbina trabaja con gas caliente muy rico en oxígeno, que corroe el metal: difícil de fabricar.',
      'The turbine runs on hot, very oxygen-rich gas that eats metal: hard to build.',
    ),
    motores: [
      'RD-180 (Atlas V)',
      'BE-4 (New Glenn, Vulcan)',
      'RS-25 (Shuttle, SLS)',
    ],
    presion: 3,
  },
  {
    id: 'completo',
    nombre: n('Flujo completo por etapas', 'Full-flow staged combustion'),
    resumen: n(
      'Dos precámaras, una rica en combustible y otra rica en oxígeno, y dos turbinas: todo el propelente pasa por una turbina antes de la cámara.',
      'Two preburners, one fuel-rich and one oxygen-rich, and two turbines: all the propellant goes through a turbine before the chamber.',
    ),
    piezas: [
      ...TANQUES(80, 320),
      ...BOMBAS(80, 320),
      {
        id: 'tf2',
        tipo: 'turbina',
        x: 152,
        y: 140,
        nombre: n('Turbina del combustible', 'Fuel turbine'),
      },
      {
        id: 'to2',
        tipo: 'turbina',
        x: 248,
        y: 140,
        nombre: n('Turbina del oxígeno', 'Oxygen turbine'),
      },
      {
        id: 'gf',
        tipo: 'quemador',
        x: 152,
        y: 215,
        nombre: n('Precámara rica en combustible', 'Fuel-rich preburner'),
      },
      {
        id: 'go',
        tipo: 'quemador',
        x: 248,
        y: 215,
        nombre: n('Precámara rica en oxígeno', 'Oxygen-rich preburner'),
      },
      CAMARA,
    ],
    tubos: [
      ...ALIMENTAR,
      { de: 'tf2', a: 'bf', fluido: 'eje' },
      { de: 'to2', a: 'bo', fluido: 'eje' },
      { de: 'bf', a: 'gf', fluido: 'combustible', por: [[80, 215]] },
      { de: 'bo', a: 'go', fluido: 'oxidante', por: [[320, 215]] },
      {
        de: 'bo',
        a: 'gf',
        fluido: 'oxidante',
        por: [
          [320, 248],
          [152, 248],
        ],
        fino: true,
      },
      {
        de: 'bf',
        a: 'go',
        fluido: 'combustible',
        por: [
          [80, 258],
          [248, 258],
        ],
        fino: true,
      },
      { de: 'gf', a: 'tf2', fluido: 'caliente' },
      { de: 'go', a: 'to2', fluido: 'caliente' },
      {
        de: 'tf2',
        a: 'c',
        fluido: 'caliente',
        por: [
          [116, 172],
          [116, 284],
          [170, 284],
        ],
      },
      {
        de: 'to2',
        a: 'c',
        fluido: 'caliente',
        por: [
          [284, 172],
          [284, 284],
          [230, 284],
        ],
      },
    ],
    pasos: [
      {
        pieza: 'gf',
        es: 'Todo el combustible y un poco de oxígeno arden en la precámara rica en combustible.',
        en: 'All the fuel and a little oxygen burn in the fuel-rich preburner.',
      },
      {
        pieza: 'go',
        es: 'Todo el oxígeno y un poco de combustible arden en la otra, rica en oxígeno.',
        en: 'All the oxygen and a little fuel burn in the other, oxygen-rich one.',
      },
      {
        pieza: 'tf2',
        es: 'Cada gas mueve su propia turbina, que hace girar su bomba.',
        en: 'Each gas drives its own turbine, which spins its pump.',
      },
      {
        pieza: 'c',
        es: 'Los dos gases ya calientes se encuentran en la cámara y terminan de arder.',
        en: 'Both already hot gases meet in the chamber and finish burning.',
      },
    ],
    pros: n(
      'La presión de cámara más alta y turbinas más frías, que duran más: ideal para reutilizar.',
      'The highest chamber pressure and cooler turbines that last longer: ideal for reuse.',
    ),
    contras: n(
      'El más complejo de todos: dos precámaras y dos turbinas que hay que sincronizar.',
      'The most complex of all: two preburners and two turbines to keep in step.',
    ),
    motores: ['Raptor (Starship)'],
    presion: 4,
  },
  {
    id: 'expansor',
    nombre: n('Expansor', 'Expander'),
    resumen: n(
      'Sin quemar nada aparte: el combustible frío se calienta enfriando la tobera, se vuelve gas y ese gas mueve la turbina.',
      'Nothing burns separately: the cold fuel heats up cooling the nozzle, turns to gas and that gas drives the turbine.',
    ),
    piezas: [
      ...TANQUES(),
      ...BOMBAS(),
      TURBINA,
      {
        id: 'j',
        tipo: 'camisa',
        x: 150,
        y: 392,
        nombre: n('Camisa de refrigeración', 'Cooling jacket'),
      },
      CAMARA,
    ],
    tubos: [
      ...ALIMENTAR,
      ...EJES,
      { de: 'bf', a: 'j', fluido: 'combustible', por: [[100, 392]] },
      {
        de: 'j',
        a: 't',
        fluido: 'caliente',
        por: [
          [150, 330],
          [130, 330],
          [130, 176],
          [170, 176],
        ],
      },
      { de: 't', a: 'c', fluido: 'caliente' },
      { de: 'bo', a: 'c', fluido: 'oxidante', por: [[300, 300]] },
    ],
    pasos: [
      {
        pieza: 'j',
        es: 'El hidrógeno líquido, a −253 °C, pasa por tubitos en la pared de la tobera y la enfría.',
        en: 'Liquid hydrogen at −253 °C runs through small tubes in the nozzle wall and cools it.',
      },
      {
        pieza: 't',
        es: 'Sale caliente y convertido en gas, con fuerza para mover la turbina.',
        en: 'It comes out hot and turned to gas, with enough push to drive the turbine.',
      },
      {
        pieza: 'c',
        es: 'Después entra a la cámara y arde con el oxígeno.',
        en: 'Then it enters the chamber and burns with the oxygen.',
      },
    ],
    pros: n(
      'Muy eficiente y suave, sin gases calientes en la turbina: fiable y fácil de reencender.',
      'Very efficient and gentle, no hot gas in the turbine: reliable and easy to restart.',
    ),
    contras: n(
      'El calor que recoge la tobera es limitado, así que el motor no puede ser grande: va en etapas superiores.',
      'The heat the nozzle can collect is limited, so the engine cannot be big: it flies on upper stages.',
    ),
    motores: ['RL10 (Centaur)', 'Vinci (Ariane 6)'],
    presion: 2,
  },
];

/** Puntos de un tubo: centro de origen, puntos intermedios y centro de destino. */
export function puntosTubo(c: Ciclo, t: Tubo): [number, number][] {
  const p = (id: string) => {
    const pieza = c.piezas.find((x) => x.id === id);
    if (!pieza) throw new Error(`MISSING_PART_${id}`);
    return [pieza.x, pieza.y] as [number, number];
  };
  return [p(t.de), ...(t.por ?? []), p(t.a)];
}
