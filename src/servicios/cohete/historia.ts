/** Un hito de la historia de los cohetes, con la vista de la app que lo amplía. */
export interface Hito {
  id: string;
  anio: number;
  fecha: { es: string; en: string } | null;
  titulo: { es: string; en: string };
  texto: { es: string; en: string };
  peru: boolean;
  ruta?: string;
}

/** Los hitos en orden; los de Perú van marcados. */
export const HITOS: Hito[] = [
  {
    id: 'kaifeng',
    anio: 1232,
    fecha: null,
    titulo: { es: 'Flechas de fuego en China', en: 'Fire arrows in China' },
    texto: {
      es: 'En el sitio de Kaifeng se usaron flechas empujadas por pólvora: los primeros cohetes de los que hay registro.',
      en: 'At the siege of Kaifeng, arrows pushed by gunpowder were used: the first rockets on record.',
    },
    peru: false,
  },
  {
    id: 'paulet',
    anio: 1895,
    fecha: {
      es: '1895–1897, según su relato',
      en: '1895–1897, by his own account',
    },
    titulo: {
      es: 'Pedro Paulet enciende un motor de combustible líquido',
      en: 'Pedro Paulet fires a liquid-fuel engine',
    },
    texto: {
      es: 'El arequipeño contó que en París probó un motor que quemaba combustible líquido en pulsos. Sería el primero de la historia, tres décadas antes que Goddard.',
      en: 'The engineer from Arequipa said he tested in Paris an engine burning liquid fuel in pulses. It would be the first in history, three decades before Goddard.',
    },
    peru: true,
    ruta: 'cohete/motores',
  },
  {
    id: 'tsiolkovsky',
    anio: 1903,
    fecha: null,
    titulo: { es: 'La ecuación del cohete', en: 'The rocket equation' },
    texto: {
      es: 'Konstantín Tsiolkovsky publica cómo calcular la velocidad que gana un cohete al quemar su propelente, y propone cohetes de varias etapas.',
      en: 'Konstantin Tsiolkovsky publishes how to work out the speed a rocket gains by burning its propellant, and proposes multi-stage rockets.',
    },
    peru: false,
    ruta: 'cohete/arma',
  },
  {
    id: 'goddard',
    anio: 1926,
    fecha: { es: '16 de marzo', en: 'March 16' },
    titulo: {
      es: 'Goddard lanza el primer cohete de combustible líquido',
      en: 'Goddard launches the first liquid-fuel rocket',
    },
    texto: {
      es: 'En una granja de Massachusetts, el cohete de Robert Goddard, con gasolina y oxígeno líquido, vuela dos segundos y medio y sube 12 metros.',
      en: 'On a Massachusetts farm, Robert Goddard’s rocket, burning gasoline and liquid oxygen, flies for two and a half seconds and climbs 12 metres.',
    },
    peru: false,
    ruta: 'cohete/motores',
  },
  {
    id: 'carta',
    anio: 1927,
    fecha: null,
    titulo: { es: 'La carta de Paulet', en: 'Paulet’s letter' },
    texto: {
      es: 'Paulet describe sus experimentos en una carta publicada en el diario El Comercio de Lima. La noticia llega a Europa y los pioneros del cohete lo citan.',
      en: 'Paulet describes his experiments in a letter published in the Lima newspaper El Comercio. The news reaches Europe and rocket pioneers cite him.',
    },
    peru: true,
  },
  {
    id: 'v2',
    anio: 1944,
    fecha: null,
    titulo: { es: 'La V-2 cruza los 100 km', en: 'The V-2 crosses 100 km' },
    texto: {
      es: 'Un cohete alemán V-2, diseñado como arma, se convierte en el primer objeto humano que llega al espacio.',
      en: 'A German V-2, designed as a weapon, becomes the first human-made object to reach space.',
    },
    peru: false,
    ruta: 'cohete/escala',
  },
  {
    id: 'sputnik',
    anio: 1957,
    fecha: { es: '4 de octubre', en: 'October 4' },
    titulo: {
      es: 'Sputnik 1, el primer satélite',
      en: 'Sputnik 1, the first satellite',
    },
    texto: {
      es: 'Un cohete R-7 soviético pone en órbita una esfera de 58 cm que emite pitidos de radio. Empieza la era espacial.',
      en: 'A Soviet R-7 rocket puts into orbit a 58 cm sphere that beeps on the radio. The space age begins.',
    },
    peru: false,
  },
  {
    id: 'gagarin',
    anio: 1961,
    fecha: { es: '12 de abril', en: 'April 12' },
    titulo: {
      es: 'Yuri Gagarin da una vuelta a la Tierra',
      en: 'Yuri Gagarin circles the Earth',
    },
    texto: {
      es: 'A bordo de la Vostok 1, el primer ser humano en el espacio completa una órbita en 108 minutos.',
      en: 'Aboard Vostok 1, the first human in space completes an orbit in 108 minutes.',
    },
    peru: false,
  },
  {
    id: 'apolo11',
    anio: 1969,
    fecha: { es: '20 de julio', en: 'July 20' },
    titulo: {
      es: 'El Apolo 11 llega a la Luna',
      en: 'Apollo 11 reaches the Moon',
    },
    texto: {
      es: 'Un Saturno V lanza a Armstrong, Aldrin y Collins. Armstrong y Aldrin caminan sobre la Luna.',
      en: 'A Saturn V launches Armstrong, Aldrin and Collins. Armstrong and Aldrin walk on the Moon.',
    },
    peru: false,
    ruta: 'cohete/escala',
  },
  {
    id: 'shuttle',
    anio: 1981,
    fecha: { es: '12 de abril', en: 'April 12' },
    titulo: {
      es: 'Primer vuelo del transbordador',
      en: 'The Space Shuttle’s first flight',
    },
    texto: {
      es: 'El Columbia despega como un cohete y vuelve aterrizando como un avión: la primera nave espacial reutilizable.',
      en: 'Columbia lifts off like a rocket and comes back landing like a plane: the first reusable spacecraft.',
    },
    peru: false,
    ruta: 'cohete/escala',
  },
  {
    id: 'puntalobos',
    anio: 1983,
    fecha: null,
    titulo: {
      es: 'Cohetes de la NASA desde Punta Lobos',
      en: 'NASA rockets from Punta Lobos',
    },
    texto: {
      es: 'Desde la base de Punta Lobos, en Pucusana, al sur de Lima, la NASA y Perú lanzan cohetes sonda para estudiar la alta atmósfera sobre el ecuador magnético.',
      en: 'From the Punta Lobos base in Pucusana, south of Lima, NASA and Peru launch sounding rockets to study the upper atmosphere over the magnetic equator.',
    },
    peru: true,
  },
  {
    id: 'pauletI',
    anio: 2006,
    fecha: { es: '26 de diciembre', en: 'December 26' },
    titulo: { es: 'El cohete Paulet I', en: 'The Paulet I rocket' },
    texto: {
      es: 'La agencia espacial peruana, CONIDA, lanza desde la costa al sur de Lima su primer cohete sonda, que lleva el nombre del pionero arequipeño.',
      en: 'Peru’s space agency, CONIDA, launches its first sounding rocket from the coast south of Lima, named after the Arequipa pioneer.',
    },
    peru: true,
  },
  {
    id: 'aterrizaje',
    anio: 2015,
    fecha: { es: '21 de diciembre', en: 'December 21' },
    titulo: {
      es: 'Una primera etapa vuelve y aterriza',
      en: 'A first stage comes back and lands',
    },
    texto: {
      es: 'Tras poner satélites en órbita, la primera etapa de un Falcon 9 regresa a cabo Cañaveral y se posa de pie.',
      en: 'After putting satellites in orbit, a Falcon 9 first stage returns to Cape Canaveral and lands upright.',
    },
    peru: false,
    ruta: 'cohete/vuelo',
  },
  {
    id: 'artemis',
    anio: 2022,
    fecha: { es: '16 de noviembre', en: 'November 16' },
    titulo: {
      es: 'Artemis I rodea la Luna',
      en: 'Artemis I loops around the Moon',
    },
    texto: {
      es: 'El primer SLS lanza la nave Orión sin tripulación en un viaje de 25 días alrededor de la Luna y de vuelta.',
      en: 'The first SLS launches the uncrewed Orion capsule on a 25-day trip around the Moon and back.',
    },
    peru: false,
    ruta: 'cohete/escala',
  },
  {
    id: 'captura',
    anio: 2024,
    fecha: { es: '13 de octubre', en: 'October 13' },
    titulo: {
      es: 'La torre atrapa un cohete en el aire',
      en: 'The tower catches a rocket in mid-air',
    },
    texto: {
      es: 'El propulsor Super Heavy de Starship vuelve a la plataforma y los brazos de la torre lo atrapan.',
      en: 'Starship’s Super Heavy booster flies back to the pad and the tower’s arms catch it.',
    },
    peru: false,
    ruta: 'cohete/escala',
  },
];
