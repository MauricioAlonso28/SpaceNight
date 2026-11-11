import type { Hito } from '../../servicios/cohete/vuelo';

/** Nombre y explicación de cada hito del vuelo, en los dos idiomas. */
export const HITOS: Record<
  Hito['id'],
  { es: string; en: string; queEs: { es: string; en: string } }
> = {
  despegue: {
    es: 'Despegue',
    en: 'Liftoff',
    queEs: {
      es: 'Los nueve motores empujan más que el peso del cohete y empieza a subir en vertical.',
      en: 'The nine engines push harder than the rocket weighs and it starts climbing straight up.',
    },
  },
  maxq: {
    es: 'Máxima presión aerodinámica (Max-Q)',
    en: 'Maximum aerodynamic pressure (Max-Q)',
    queEs: {
      es: 'El aire empuja con más fuerza contra el cohete: va rápido y el aire aún es denso. Los motores bajan la potencia para no castigar la estructura.',
      en: 'The air pushes hardest on the rocket: it is fast and the air is still thick. The engines throttle down to spare the structure.',
    },
  },
  meco: {
    es: 'Apagado de la 1.ª etapa (MECO)',
    en: 'Main engine cutoff (MECO)',
    queEs: {
      es: 'Se apagan los motores de la primera etapa. Si va a volver, se guarda el propelente justo para hacerlo.',
      en: 'The first-stage engines shut down. If it is coming back, it keeps just enough propellant to do so.',
    },
  },
  separacion: {
    es: 'Separación de etapas',
    en: 'Stage separation',
    queEs: {
      es: 'Unos pistones empujan las dos etapas para separarlas. Desde aquí cada una sigue su camino.',
      en: 'Pushers shove the two stages apart. From here on each one goes its own way.',
    },
  },
  ses: {
    es: 'Enciende la 2.ª etapa',
    en: 'Second stage ignition',
    queEs: {
      es: 'El motor de vacío de la segunda etapa, con una tobera enorme, toma el relevo para ganar velocidad horizontal.',
      en: 'The second stage vacuum engine, with a huge nozzle, takes over to build horizontal speed.',
    },
  },
  cofia: {
    es: 'Se suelta la cofia',
    en: 'Fairing separation',
    queEs: {
      es: 'Por encima de unos 110 km casi no hay aire, así que el escudo que protegía la carga se abre en dos y se suelta.',
      en: 'Above about 110 km there is hardly any air, so the shield protecting the payload splits in two and falls away.',
    },
  },
  seco: {
    es: 'Apagado de la 2.ª etapa (SECO)',
    en: 'Second engine cutoff (SECO)',
    queEs: {
      es: 'Ya va lo bastante rápido para no volver a caer: unos 27 000 km/h de lado.',
      en: 'It is now fast enough not to fall back: about 27,000 km/h sideways.',
    },
  },
  orbita: {
    es: 'En órbita',
    en: 'In orbit',
    queEs: {
      es: 'La carga cae alrededor de la Tierra sin llegar nunca al suelo: eso es estar en órbita.',
      en: 'The payload falls around the Earth without ever reaching the ground: that is being in orbit.',
    },
  },
  'sin-combustible': {
    es: 'Se acaba el combustible',
    en: 'Out of propellant',
    queEs: {
      es: 'La segunda etapa se quedó sin propelente antes de llegar a la velocidad orbital: la carga volverá a caer.',
      en: 'The second stage ran dry before reaching orbital speed: the payload will fall back.',
    },
  },
  regreso: {
    es: 'Encendido de regreso',
    en: 'Boostback burn',
    queEs: {
      es: 'La primera etapa se da vuelta y enciende tres motores para frenar su avance y volver hacia la costa.',
      en: 'The first stage flips and lights three engines to cancel its forward speed and head back to the coast.',
    },
  },
  'fin-regreso': {
    es: 'Fin del regreso',
    en: 'Boostback ends',
    queEs: {
      es: 'Ya apunta a la zona de aterrizaje. Sube por inercia y empieza a caer.',
      en: 'It is now aimed at the landing zone. It coasts up and starts falling.',
    },
  },
  reentrada: {
    es: 'Encendido de reentrada',
    en: 'Entry burn',
    queEs: {
      es: 'Tres motores frenan la caída antes de entrar en el aire denso, para que el calor y el golpe no la rompan.',
      en: 'Three engines slow the fall before hitting thick air, so heat and buffeting do not break it.',
    },
  },
  'fin-reentrada': {
    es: 'Fin de la reentrada',
    en: 'Entry burn ends',
    queEs: {
      es: 'Ahora el aire la frena y las aletas de rejilla la guían hacia el objetivo.',
      en: 'Now the air slows it down and the grid fins steer it to the target.',
    },
  },
  'aterrizaje-encendido': {
    es: 'Encendido de aterrizaje',
    en: 'Landing burn',
    queEs: {
      es: 'Un solo motor se enciende en el último momento: ni siquiera al mínimo puede flotar, así que tiene que llegar a velocidad cero justo al tocar el suelo.',
      en: 'A single engine lights at the last moment: even at minimum it cannot hover, so it must reach zero speed exactly at touchdown.',
    },
  },
  toque: {
    es: 'Aterriza',
    en: 'Touchdown',
    queEs: {
      es: 'Se despliegan las patas y la etapa se posa. Se revisa y puede volver a volar.',
      en: 'The legs deploy and the stage settles. It gets inspected and can fly again.',
    },
  },
};
