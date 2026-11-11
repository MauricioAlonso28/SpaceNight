import type { DatoFicha, FuenteFicha, Traducido } from './catalogo';

/**
 * Una pieza de un modelo de la NASA que se puede separar y abrir.
 * @property id nombre del nodo en el archivo glb
 * @property papel qué hacía en el vuelo, en pocas palabras
 */
export interface PiezaModelo {
  id: string;
  nombre: Traducido;
  papel: Traducido;
  resumen: Traducido;
  datos: DatoFicha[];
}

const t = (es: string, en: string): Traducido => ({ es, en });
const dato = (etiqueta: Traducido, valor: Traducido): DatoFicha => ({
  etiqueta,
  valor,
});

const MOTORES = t('Motores', 'Engines');
const DIAMETRO = t('Diámetro', 'Diameter');
const ALTO = t('Alto', 'Height');
const FABRICANTE = t('Fabricante', 'Builder');

/** Las etapas del Saturno V de abajo arriba, con los nombres de nodo que deja scripts/despiezar-saturno.mjs. */
export const ETAPAS_SATURNO: PiezaModelo[] = [
  {
    id: 's-ic',
    nombre: t('S-IC', 'S-IC'),
    papel: t('Primera etapa', 'First stage'),
    resumen: t(
      'Levantaba el cohete entero desde la plataforma durante unos dos minutos y medio. Sus cinco motores F-1 quemaban queroseno RP-1 con oxígeno líquido; al vaciarse, la etapa se soltaba y caía.',
      'It lifted the whole rocket off the pad for about two and a half minutes. Its five F-1 engines burned RP-1 kerosene with liquid oxygen; once empty, the stage dropped away.',
    ),
    datos: [
      dato(MOTORES, t('5 F-1', '5 F-1')),
      dato(
        t('Empuje al despegar', 'Liftoff thrust'),
        t('33,4 MN (7,5 millones de libras)', '33.4 MN (7.5 million pounds)'),
      ),
      dato(t('Encendida', 'Burn time'), t('unos 150 s', 'about 150 s')),
      dato(DIAMETRO, t('10 m', '10 m')),
      dato(FABRICANTE, t('Boeing', 'Boeing')),
    ],
  },
  {
    id: 's-ii',
    nombre: t('S-II', 'S-II'),
    papel: t('Segunda etapa', 'Second stage'),
    resumen: t(
      'Tomaba el relevo al soltarse la primera etapa. Sus cinco motores J-2 quemaban hidrógeno líquido con oxígeno líquido, que da menos empuje que el queroseno pero rinde más por kilo. Aquí incluye la falda cónica de arriba, que en el vuelo se quedaba con ella al separarse.',
      'It took over when the first stage dropped away. Its five J-2 engines burned liquid hydrogen with liquid oxygen, which gives less thrust than kerosene but more per kilogram. Here it includes the conical skirt on top, which stayed with it at separation.',
    ),
    datos: [
      dato(MOTORES, t('5 J-2', '5 J-2')),
      dato(
        t('Combustible', 'Propellants'),
        t('hidrógeno y oxígeno líquidos', 'liquid hydrogen and oxygen'),
      ),
      dato(t('Largo', 'Length'), t('24,8 m', '24.8 m')),
      dato(DIAMETRO, t('10 m', '10 m')),
      dato(FABRICANTE, t('North American', 'North American')),
    ],
  },
  {
    id: 's-ivb',
    nombre: t('S-IVB', 'S-IVB'),
    papel: t('Tercera etapa', 'Third stage'),
    resumen: t(
      'Tenía un solo motor J-2 que podía apagarse y volver a encenderse. El primer encendido terminaba de poner la nave en órbita alrededor de la Tierra y el segundo la lanzaba hacia la Luna.',
      'It had a single J-2 engine that could shut down and start again. The first burn finished putting the spacecraft into Earth orbit and the second sent it toward the Moon.',
    ),
    datos: [
      dato(MOTORES, t('1 J-2', '1 J-2')),
      dato(t('Encendidos', 'Burns'), t('2', '2')),
      dato(FABRICANTE, t('Douglas', 'Douglas')),
    ],
  },
  {
    id: 'unidad-instrumentos',
    nombre: t('Unidad de instrumentos', 'Instrument unit'),
    papel: t('El cerebro del cohete', "The rocket's brain"),
    resumen: t(
      'Un anillo de menos de un metro de alto con los equipos de navegación, guiado, control y secuencia: decidía hacia dónde apuntar los motores y cuándo separar cada etapa. La diseñó el centro Marshall de la NASA y la construyó IBM.',
      "A ring less than a meter tall holding the navigation, guidance, control and sequencing equipment: it decided where to point the engines and when to drop each stage. NASA's Marshall center designed it and IBM built it.",
    ),
    datos: [
      dato(ALTO, t('0,9 m (3 pies)', '0.9 m (3 ft)')),
      dato(DIAMETRO, t('6,4 m (21 pies)', '6.4 m (21 ft)')),
      dato(
        t('Masa', 'Mass'),
        t('unos 1800 kg (4000 libras)', 'about 1,800 kg (4,000 lb)'),
      ),
      dato(FABRICANTE, t('IBM', 'IBM')),
    ],
  },
  {
    id: 'adaptador',
    nombre: t('Adaptador del módulo lunar', 'Spacecraft-LM adapter'),
    papel: t('Carenado', 'Fairing'),
    resumen: t(
      'Un cono que unía la nave al cohete y cubría el módulo lunar durante el lanzamiento para que el aire pasara liso. En el espacio sus paneles se abrían para dejarlo salir.',
      'A cone that joined the spacecraft to the rocket and covered the Lunar Module during launch so the air flowed smoothly. In space its panels opened to let it out.',
    ),
    datos: [
      dato(
        t('Dentro', 'Inside'),
        t(
          'el módulo lunar (no viene en este modelo)',
          'the Lunar Module (not in this model)',
        ),
      ),
    ],
  },
  {
    id: 'modulo-servicio',
    nombre: t('Módulo de servicio', 'Service module'),
    papel: t(
      'Motor y provisiones de la nave',
      "The spacecraft's engine and supplies",
    ),
    resumen: t(
      'Llevaba el motor principal de la nave, su combustible, el oxígeno y lo necesario para producir electricidad durante el viaje. Se soltaba justo antes de volver a entrar en la atmósfera.',
      "It carried the spacecraft's main engine, its propellant, the oxygen and what was needed to make electricity for the trip. It was dropped just before reentering the atmosphere.",
    ),
    datos: [
      dato(ALTO, t('6,9 m sin el carenado', '6.9 m without the fairing')),
      dato(DIAMETRO, t('3,9 m', '3.9 m')),
    ],
  },
  {
    id: 'modulo-mando',
    nombre: t('Módulo de mando', 'Command module'),
    papel: t('La cabina', 'The cabin'),
    resumen: t(
      'La cabina de los tres astronautas y la única parte que volvía a la Tierra: un escudo térmico la protegía al entrar en la atmósfera y bajaba en paracaídas hasta el mar.',
      'The cabin for the three astronauts and the only part that came back to Earth: a heat shield protected it through reentry and it came down by parachute into the sea.',
    ),
    datos: [
      dato(ALTO, t('3,2 m', '3.2 m')),
      dato(DIAMETRO, t('3,9 m', '3.9 m')),
      dato(t('Espacio habitable', 'Living space'), t('5,9 m³', '5.9 m³')),
      dato(t('Tripulación', 'Crew'), t('3', '3')),
    ],
  },
  {
    id: 'torre-escape',
    nombre: t('Torre de escape', 'Launch escape system'),
    papel: t('Salvavidas', 'Lifeboat'),
    resumen: t(
      'Un pequeño cohete encima de todo. Si algo fallaba en el despegue, arrancaba el módulo de mando con los astronautas dentro y lo alejaba del cohete. Si todo iba bien, se soltaba al poco de empezar el vuelo.',
      'A small rocket on top of everything. If something went wrong at liftoff, it pulled the command module away from the rocket with the astronauts inside. If all went well, it was dropped early in the flight.',
    ),
    datos: [
      dato(
        t('Se soltaba', 'Dropped'),
        t('al poco de empezar el vuelo', 'early in the flight'),
      ),
    ],
  },
];

/** Fuentes de las fichas de las etapas del Saturno V. */
export const FUENTES_SATURNO: FuenteFicha[] = [
  {
    titulo: 'NASA SP-4206, Stages to Saturn, cap. 7',
    url: 'https://www.nasa.gov/wp-content/uploads/static/history/SP-4206/ch7.htm',
  },
  {
    titulo: 'NASA SP-4206, Stages to Saturn, cap. 12',
    url: 'https://www.nasa.gov/wp-content/uploads/static/history/SP-4206/ch12.htm',
  },
  {
    titulo: 'NASA Marshall: Manufacturing the Saturn V Instrument Unit',
    url: 'https://www.nasa.gov/centers/marshall/history/saturn_v_instrument_unit_01.html',
  },
  {
    titulo: 'NASA: Apollo 204, The Apollo Spacecraft',
    url: 'https://www.nasa.gov/wp-content/uploads/static/history/Apollo204/spacecraft.html',
  },
];
