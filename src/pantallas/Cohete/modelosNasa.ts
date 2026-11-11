import type { Traducido } from './catalogo';

/**
 * Un modelo 3D de NASA 3D Resources guardado en public/modelos.
 * @property bytes tamaño del archivo, para avisar antes de descargarlo
 * @property pagina ficha del modelo en NASA 3D Resources
 */
export interface ModeloNasa {
  id: string;
  archivo: string;
  bytes: number;
  nombre: Traducido;
  descripcion: Traducido;
  credito: string;
  pagina: string;
}

/** Los modelos reales que se pueden ver; ninguno se descarga hasta que se pide. */
export const MODELOS_NASA: ModeloNasa[] = [
  {
    id: 'saturno-v',
    archivo: 'saturno-v.glb',
    bytes: 927212,
    nombre: { es: 'Saturno V', en: 'Saturn V' },
    descripcion: {
      es: 'El cohete de tres etapas que llevó a los astronautas del Apolo a la Luna (1967–1973).',
      en: 'The three-stage rocket that took the Apollo astronauts to the Moon (1967–1973).',
    },
    credito: 'NASA/Michael D. Carbajal',
    pagina: 'https://science.nasa.gov/3d-resources/saturn-v/',
  },
  {
    id: 'transbordador',
    archivo: 'transbordador.glb',
    bytes: 2471932,
    nombre: { es: 'Transbordador espacial', en: 'Space Shuttle' },
    descripcion: {
      es: 'El orbitador reutilizable que voló 135 misiones entre 1981 y 2011.',
      en: 'The reusable orbiter that flew 135 missions between 1981 and 2011.',
    },
    credito: 'NASA/Johnson Space Center',
    pagina: 'https://science.nasa.gov/3d-resources/space-shuttle-d/',
  },
  {
    id: 'tanque-externo',
    archivo: 'tanque-externo.glb',
    bytes: 848352,
    nombre: {
      es: 'Tanque externo del transbordador',
      en: 'Space Shuttle external tank',
    },
    descripcion: {
      es: 'Guardaba el oxígeno y el hidrógeno líquidos de los motores del orbitador; su espuma aislante le daba el color naranja.',
      en: "It held the liquid oxygen and hydrogen for the orbiter's engines; its insulating foam gave it the orange color.",
    },
    credito: 'NASA/Johnson Space Center',
    pagina: 'https://science.nasa.gov/3d-resources/space-shuttle-parts/',
  },
  {
    id: 'propulsor-solido',
    archivo: 'propulsor-solido.glb',
    bytes: 2665460,
    nombre: {
      es: 'Propulsor de combustible sólido',
      en: 'Solid rocket booster',
    },
    descripcion: {
      es: 'Los dos propulsores laterales del transbordador daban la mayor parte del empuje al despegar y se recuperaban del mar.',
      en: "The Shuttle's two side boosters gave most of the liftoff thrust and were recovered from the sea.",
    },
    credito: 'NASA/Johnson Space Center',
    pagina: 'https://science.nasa.gov/3d-resources/space-shuttle-parts/',
  },
];

/** Tamaño de descarga legible, en megabytes con un decimal. */
export function tamanoLegible(bytes: number, idioma: 'es' | 'en'): string {
  const mb = (bytes / 1_000_000).toFixed(1);
  return `${idioma === 'es' ? mb.replace('.', ',') : mb} MB`;
}
