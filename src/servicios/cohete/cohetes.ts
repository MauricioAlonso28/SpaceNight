/** Un tramo del cuerpo de un cohete, de abajo hacia arriba: alto y anchos en metros, color y si termina en punta. */
export interface Tramo {
  alto: number;
  abajo: number;
  arriba: number;
  color: string;
}

/** Propulsores laterales: cuántos se ven, alto, diámetro, a qué altura empiezan y su color. */
export interface Laterales {
  cuantos: 2 | 4;
  alto: number;
  ancho: number;
  desde: number;
  color: string;
  punta: number;
}

/** Un cohete real con sus cifras públicas aproximadas; null donde no hay un dato fiable. */
export interface CoheteReal {
  id: string;
  nombre: string;
  pais: { es: string; en: string };
  anio: number;
  estado: 'activo' | 'retirado' | 'pruebas';
  alto: number;
  diametro: number;
  leo: number | null;
  empuje: number | null;
  masa: number | null;
  dato: { es: string; en: string };
  tramos: Tramo[];
  laterales?: Laterales;
}

const BLANCO = '#e9ecf3';
const NEGRO = '#2b2f3a';
const ACERO = '#c3c9d4';
const NARANJA = '#d9772e';

/** Los cohetes del comparador, con forma simplificada y cifras de fuentes públicas. */
export const COHETES: CoheteReal[] = [
  {
    id: 'v2',
    nombre: 'V-2',
    pais: { es: 'Alemania', en: 'Germany' },
    anio: 1942,
    estado: 'retirado',
    alto: 14,
    diametro: 1.65,
    leo: null,
    empuje: 270,
    masa: 12.5,
    dato: {
      es: 'El primer objeto humano en cruzar los 100 km, en 1944. Era un arma; tras la guerra sus ingenieros y piezas fundaron los programas espaciales de EE. UU. y la URSS.',
      en: 'The first human-made object to cross 100 km, in 1944. It was a weapon; after the war its engineers and parts seeded the US and Soviet space programs.',
    },
    tramos: [
      { alto: 2.2, abajo: 3.4, arriba: 1.65, color: NEGRO },
      { alto: 9, abajo: 1.65, arriba: 1.65, color: BLANCO },
      { alto: 2.8, abajo: 1.65, arriba: 0, color: NEGRO },
    ],
  },
  {
    id: 'electron',
    nombre: 'Electron',
    pais: { es: 'Nueva Zelanda / EE. UU.', en: 'New Zealand / US' },
    anio: 2017,
    estado: 'activo',
    alto: 18,
    diametro: 1.2,
    leo: 0.3,
    empuje: 162,
    masa: 13,
    dato: {
      es: 'Cohete pequeño de fibra de carbono con motores que usan bombas eléctricas a batería. Lleva satélites chicos de a uno.',
      en: 'A small carbon-fibre rocket whose engines use battery-powered electric pumps. It carries small satellites one launch at a time.',
    },
    tramos: [
      { alto: 12.1, abajo: 1.2, arriba: 1.2, color: NEGRO },
      { alto: 2.4, abajo: 1.2, arriba: 1.2, color: NEGRO },
      { alto: 3.5, abajo: 1.2, arriba: 0, color: NEGRO },
    ],
  },
  {
    id: 'soyuz',
    nombre: 'Soyuz-2',
    pais: { es: 'Rusia', en: 'Russia' },
    anio: 2004,
    estado: 'activo',
    alto: 46.3,
    diametro: 2.95,
    leo: 8.2,
    empuje: 4_150,
    masa: 312,
    dato: {
      es: 'Desciende del R-7 que lanzó el Sputnik en 1957: la familia de cohetes que más veces ha volado.',
      en: 'It descends from the R-7 that launched Sputnik in 1957: the most-flown rocket family ever.',
    },
    tramos: [
      { alto: 27.8, abajo: 2.95, arriba: 2.95, color: '#cfd5cf' },
      { alto: 6.7, abajo: 2.66, arriba: 2.66, color: '#cfd5cf' },
      { alto: 11.8, abajo: 4.1, arriba: 0, color: BLANCO },
    ],
    laterales: {
      cuantos: 2,
      alto: 19.6,
      ancho: 2.68,
      desde: 0,
      color: '#cfd5cf',
      punta: 0.35,
    },
  },
  {
    id: 'shuttle',
    nombre: 'Space Shuttle',
    pais: { es: 'EE. UU.', en: 'US' },
    anio: 1981,
    estado: 'retirado',
    alto: 56.1,
    diametro: 8.4,
    leo: 24.4,
    empuje: 30_160,
    masa: 2_030,
    dato: {
      es: 'Un avión espacial reutilizable pegado a un tanque externo y dos propulsores sólidos. Voló 135 misiones y construyó la Estación Espacial.',
      en: 'A reusable spaceplane strapped to an external tank and two solid boosters. It flew 135 missions and built the Space Station.',
    },
    tramos: [
      { alto: 9.2, abajo: 0, arriba: 0, color: 'transparent' },
      { alto: 40, abajo: 8.4, arriba: 8.4, color: NARANJA },
      { alto: 6.9, abajo: 8.4, arriba: 0, color: NARANJA },
    ],
    laterales: {
      cuantos: 2,
      alto: 45.5,
      ancho: 3.7,
      desde: 0,
      color: BLANCO,
      punta: 0.12,
    },
  },
  {
    id: 'cz5',
    nombre: 'Larga Marcha 5',
    pais: { es: 'China', en: 'China' },
    anio: 2016,
    estado: 'activo',
    alto: 57,
    diametro: 5,
    leo: 25,
    empuje: 10_565,
    masa: 869,
    dato: {
      es: 'El cohete pesado de China: lanzó los módulos de su estación Tiangong y las misiones a la Luna y a Marte.',
      en: 'China’s heavy rocket: it launched the Tiangong station modules and the Moon and Mars missions.',
    },
    tramos: [
      { alto: 33, abajo: 5, arriba: 5, color: BLANCO },
      { alto: 11.5, abajo: 5, arriba: 5, color: BLANCO },
      { alto: 12.5, abajo: 5.2, arriba: 0, color: BLANCO },
    ],
    laterales: {
      cuantos: 2,
      alto: 27.6,
      ancho: 3.35,
      desde: 0,
      color: BLANCO,
      punta: 0.25,
    },
  },
  {
    id: 'ariane6',
    nombre: 'Ariane 6',
    pais: { es: 'Europa', en: 'Europe' },
    anio: 2024,
    estado: 'activo',
    alto: 63,
    diametro: 5.4,
    leo: 21.6,
    empuje: null,
    masa: 860,
    dato: {
      es: 'El cohete de la Agencia Espacial Europea, lanzado desde la Guayana Francesa. La versión de cuatro propulsores es la más potente.',
      en: 'The European Space Agency’s rocket, launched from French Guiana. The four-booster version is the most powerful.',
    },
    tramos: [
      { alto: 30, abajo: 5.4, arriba: 5.4, color: BLANCO },
      { alto: 12, abajo: 5.4, arriba: 5.4, color: NEGRO },
      { alto: 21, abajo: 5.4, arriba: 0, color: BLANCO },
    ],
    laterales: {
      cuantos: 2,
      alto: 13.5,
      ancho: 3.4,
      desde: 0,
      color: BLANCO,
      punta: 0.2,
    },
  },
  {
    id: 'falcon9',
    nombre: 'Falcon 9',
    pais: { es: 'EE. UU.', en: 'US' },
    anio: 2010,
    estado: 'activo',
    alto: 70,
    diametro: 3.7,
    leo: 22.8,
    empuje: 7_607,
    masa: 549,
    dato: {
      es: 'Su primera etapa vuelve y aterriza: algunas ya volaron más de 25 veces. Es el cohete que más lanza hoy.',
      en: 'Its first stage comes back and lands: some have flown more than 25 times. It is the rocket that launches most often today.',
    },
    tramos: [
      { alto: 41.2, abajo: 3.7, arriba: 3.7, color: BLANCO },
      { alto: 6.7, abajo: 3.7, arriba: 3.7, color: NEGRO },
      { alto: 9, abajo: 3.7, arriba: 3.7, color: BLANCO },
      { alto: 13.1, abajo: 5.2, arriba: 0, color: BLANCO },
    ],
  },
  {
    id: 'falconheavy',
    nombre: 'Falcon Heavy',
    pais: { es: 'EE. UU.', en: 'US' },
    anio: 2018,
    estado: 'activo',
    alto: 70,
    diametro: 3.7,
    leo: 63.8,
    empuje: 22_819,
    masa: 1_420,
    dato: {
      es: 'Tres primeras etapas de Falcon 9 juntas. En su primer vuelo mandó un auto rojo hacia Marte y los dos laterales aterrizaron a la vez.',
      en: 'Three Falcon 9 first stages side by side. Its first flight sent a red car toward Mars and both side boosters landed together.',
    },
    tramos: [
      { alto: 41.2, abajo: 3.7, arriba: 3.7, color: BLANCO },
      { alto: 6.7, abajo: 3.7, arriba: 3.7, color: NEGRO },
      { alto: 9, abajo: 3.7, arriba: 3.7, color: BLANCO },
      { alto: 13.1, abajo: 5.2, arriba: 0, color: BLANCO },
    ],
    laterales: {
      cuantos: 2,
      alto: 47.9,
      ancho: 3.7,
      desde: 0,
      color: BLANCO,
      punta: 0.08,
    },
  },
  {
    id: 'newglenn',
    nombre: 'New Glenn',
    pais: { es: 'EE. UU.', en: 'US' },
    anio: 2025,
    estado: 'activo',
    alto: 98,
    diametro: 7,
    leo: 45,
    empuje: 17_100,
    masa: null,
    dato: {
      es: 'De Blue Origin. Su primera etapa, con siete motores de metano, está pensada para aterrizar en un barco y volar 25 veces.',
      en: 'From Blue Origin. Its first stage, with seven methane engines, is designed to land on a ship and fly 25 times.',
    },
    tramos: [
      { alto: 57.5, abajo: 7, arriba: 7, color: BLANCO },
      { alto: 19.5, abajo: 7, arriba: 7, color: BLANCO },
      { alto: 21, abajo: 7, arriba: 0, color: BLANCO },
    ],
  },
  {
    id: 'sls',
    nombre: 'SLS',
    pais: { es: 'EE. UU.', en: 'US' },
    anio: 2022,
    estado: 'activo',
    alto: 98,
    diametro: 8.4,
    leo: 95,
    empuje: 39_100,
    masa: 2_610,
    dato: {
      es: 'El cohete del programa Artemis para volver a la Luna. Su etapa central naranja usa los motores RS-25 del transbordador.',
      en: 'The Artemis program rocket for returning to the Moon. Its orange core stage uses the Shuttle’s RS-25 engines.',
    },
    tramos: [
      { alto: 65, abajo: 8.4, arriba: 8.4, color: NARANJA },
      { alto: 8, abajo: 8.4, arriba: 5, color: BLANCO },
      { alto: 9, abajo: 5, arriba: 5, color: BLANCO },
      { alto: 16, abajo: 5, arriba: 0, color: BLANCO },
    ],
    laterales: {
      cuantos: 2,
      alto: 54,
      ancho: 3.7,
      desde: 0,
      color: BLANCO,
      punta: 0.1,
    },
  },
  {
    id: 'n1',
    nombre: 'N1',
    pais: { es: 'URSS', en: 'USSR' },
    anio: 1969,
    estado: 'retirado',
    alto: 105,
    diametro: 17,
    leo: 95,
    empuje: 45_400,
    masa: 2_750,
    dato: {
      es: 'El cohete soviético para llegar a la Luna, con 30 motores en la base. Sus cuatro lanzamientos fallaron y el programa se canceló.',
      en: 'The Soviet rocket meant for the Moon, with 30 engines at its base. All four launches failed and the program was cancelled.',
    },
    tramos: [
      { alto: 30, abajo: 17, arriba: 10.3, color: BLANCO },
      { alto: 20, abajo: 10.3, arriba: 7.6, color: BLANCO },
      { alto: 12, abajo: 7.6, arriba: 6, color: BLANCO },
      { alto: 26, abajo: 6, arriba: 4, color: BLANCO },
      { alto: 17, abajo: 4, arriba: 0, color: BLANCO },
    ],
  },
  {
    id: 'saturnv',
    nombre: 'Saturno V',
    pais: { es: 'EE. UU.', en: 'US' },
    anio: 1967,
    estado: 'retirado',
    alto: 110.6,
    diametro: 10.1,
    leo: 140,
    empuje: 35_100,
    masa: 2_970,
    dato: {
      es: 'Llevó a 24 astronautas hacia la Luna y lanzó la estación Skylab. Ninguno de sus 13 vuelos perdió su carga.',
      en: 'It carried 24 astronauts toward the Moon and launched the Skylab station. None of its 13 flights lost its payload.',
    },
    tramos: [
      { alto: 42, abajo: 10.1, arriba: 10.1, color: BLANCO },
      { alto: 24.9, abajo: 10.1, arriba: 10.1, color: BLANCO },
      { alto: 5, abajo: 10.1, arriba: 6.6, color: BLANCO },
      { alto: 13, abajo: 6.6, arriba: 6.6, color: BLANCO },
      { alto: 9, abajo: 6.6, arriba: 3.9, color: BLANCO },
      { alto: 6.7, abajo: 3.9, arriba: 0.6, color: BLANCO },
      { alto: 10, abajo: 0.6, arriba: 0, color: NEGRO },
    ],
  },
  {
    id: 'starship',
    nombre: 'Starship',
    pais: { es: 'EE. UU.', en: 'US' },
    anio: 2023,
    estado: 'pruebas',
    alto: 123,
    diametro: 9,
    leo: 100,
    empuje: 74_400,
    masa: 5_000,
    dato: {
      es: 'El cohete más grande y potente jamás construido, de acero inoxidable y pensado para ser totalmente reutilizable. La torre atrapa la primera etapa en el aire.',
      en: 'The largest and most powerful rocket ever built, made of stainless steel and designed to be fully reusable. The tower catches the first stage in mid-air.',
    },
    tramos: [
      { alto: 71, abajo: 9, arriba: 9, color: ACERO },
      { alto: 40, abajo: 9, arriba: 9, color: ACERO },
      { alto: 12, abajo: 9, arriba: 0, color: ACERO },
    ],
  },
];

/** Alto en metros de la Estatua de la Libertad con su pedestal, la referencia del comparador. */
export const ESTATUA = 93;

/** Cómo ordenar el comparador. */
export type Orden = 'alto' | 'anio' | 'leo';

/** Los cohetes ordenados por altura, por año del primer vuelo o por carga a órbita baja (los sin dato al final). */
export function ordenarCohetes(
  lista: CoheteReal[],
  orden: Orden,
): CoheteReal[] {
  const clave = (c: CoheteReal) =>
    orden === 'alto' ? c.alto : orden === 'anio' ? c.anio : (c.leo ?? -1);
  return [...lista].sort((a, b) => clave(a) - clave(b));
}

/** Suma de los tramos de un cohete, que debe coincidir con su altura publicada. */
export const altoDibujado = (c: CoheteReal) =>
  c.tramos.reduce((s, t) => s + t.alto, 0);
