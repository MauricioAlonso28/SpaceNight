import {
  gauss,
  inclinacion,
  reducirMovimiento,
  seguirInclinacion,
  sigueMoviendose,
} from './movimiento';
import { ceder } from './soporte';

const MARGEN = 32;
const AREA_MOVIL = 390 * 844;
const FACTOR_MAXIMO = 2.5;

/** Una capa de estrellas a una profundidad: cuántas, de qué tamaño y cuánto se desplaza al inclinar. */
interface Capa {
  cantidad: number;
  radio: [number, number];
  alfa: number;
  banda: boolean;
  halo: boolean;
  desplazamiento: number;
}

const CAPAS: readonly Capa[] = [
  {
    cantidad: 1400,
    radio: [0.35, 0.75],
    alfa: 0.4,
    banda: true,
    halo: false,
    desplazamiento: 5,
  },
  {
    cantidad: 800,
    radio: [0.35, 0.85],
    alfa: 0.75,
    banda: false,
    halo: false,
    desplazamiento: 11,
  },
  {
    cantidad: 220,
    radio: [0.7, 1.2],
    alfa: 0.95,
    banda: false,
    halo: false,
    desplazamiento: 18,
  },
  {
    cantidad: 35,
    radio: [0.9, 1.5],
    alfa: 1,
    banda: false,
    halo: true,
    desplazamiento: 26,
  },
];

const TONOS_FRIOS = 6;
const TONOS_CALIDOS = 2;

/** Paleta pequeña de colores de estrella (azulados y algunos anaranjados), para dibujar por lotes. */
function paleta(banda: boolean, alfa: number): string[] {
  const saturacion = banda ? 25 : 50;
  const luz = banda ? 70 : 88;
  const frios = Array.from(
    { length: TONOS_FRIOS },
    (_, k) => `hsla(${209 + k * 4}, ${saturacion}%, ${luz - k}%, ${alfa})`,
  );
  const calidos = Array.from(
    { length: TONOS_CALIDOS },
    (_, k) => `hsla(${32 + k * 8}, ${saturacion + 10}%, ${luz - 4}%, ${alfa})`,
  );
  return [...frios, ...frios, ...frios, ...calidos];
}

/** Halo difuminado de una estrella brillante, dibujado una vez y copiado con drawImage. */
function halo(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(235,240,255,0.95)');
  gr.addColorStop(0.25, 'rgba(210,222,255,0.45)');
  gr.addColorStop(1, 'rgba(210,222,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 32, 32);
  return c;
}

/** Posición de una estrella: repartida por igual o apiñada en una franja inclinada, como la Vía Láctea. */
function posicion(
  ancho: number,
  alto: number,
  banda: boolean,
): [number, number] {
  if (!banda) return [Math.random() * ancho, Math.random() * alto];
  const t = Math.random();
  const desvio = gauss() * Math.hypot(ancho, alto) * 0.06;
  const [x0, y0, x1, y1] = [
    -0.1 * ancho,
    0.85 * alto,
    1.1 * ancho,
    0.15 * alto,
  ];
  const largo = Math.hypot(x1 - x0, y1 - y0);
  const [nx, ny] = [-(y1 - y0) / largo, (x1 - x0) / largo];
  return [x0 + (x1 - x0) * t + nx * desvio, y0 + (y1 - y0) * t + ny * desvio];
}

function dibujarCapa(
  lienzo: HTMLCanvasElement,
  capa: Capa,
  ancho: number,
  alto: number,
) {
  const densidad =
    capa.desplazamiento < 12 ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
  lienzo.width = Math.round(ancho * densidad);
  lienzo.height = Math.round(alto * densidad);
  const g = lienzo.getContext('2d')!;
  g.scale(densidad, densidad);
  const factor = Math.min(FACTOR_MAXIMO, (ancho * alto) / AREA_MOVIL);
  const n = Math.round(capa.cantidad * factor);
  const colores = paleta(capa.banda, capa.alfa);
  const lotes = colores.map(() => new Path2D());
  const brillo = capa.halo ? halo() : null;
  for (let i = 0; i < n; i++) {
    const [x, y] = posicion(ancho, alto, capa.banda);
    const r = capa.radio[0] + Math.random() * (capa.radio[1] - capa.radio[0]);
    if (brillo) g.drawImage(brillo, x - r * 4, y - r * 4, r * 8, r * 8);
    const lote = lotes[Math.floor(Math.random() * lotes.length)];
    lote.moveTo(x + r, y);
    lote.arc(x, y, r, 0, Math.PI * 2);
  }
  lotes.forEach((lote, k) => {
    g.fillStyle = colores[k];
    g.fill(lote);
  });
}

/**
 * Cielo de fondo en capas de canvas 2D que se desplazan a distinta velocidad al inclinar el móvil o mover el ratón.
 * Se dibuja una vez por tamaño de ventana; el movimiento es solo un transform de CSS.
 * @returns la función que lo quita
 */
export function crearFondoEstrellas(contenedor: HTMLElement): () => void {
  const lienzos = CAPAS.map(() => {
    const c = document.createElement('canvas');
    contenedor.appendChild(c);
    return c;
  });
  let vigente = true;
  const dibujar = async () => {
    const ancho = window.innerWidth + MARGEN * 2;
    const alto = window.innerHeight + MARGEN * 2;
    for (const [i, capa] of CAPAS.entries()) {
      if (!vigente) return;
      dibujarCapa(lienzos[i], capa, ancho, alto);
      await ceder();
    }
  };
  void dibujar();

  const quieto = reducirMovimiento();
  let cx = inclinacion.x;
  let cy = inclinacion.y;
  let cuadro = 0;
  const mover = () => {
    cuadro = 0;
    cx += (inclinacion.x - cx) * (quieto ? 1 : 0.08);
    cy += (inclinacion.y - cy) * (quieto ? 1 : 0.08);
    CAPAS.forEach((capa, i) => {
      const d = quieto ? 0 : capa.desplazamiento;
      lienzos[i].style.transform =
        `translate3d(${(-cx * d).toFixed(2)}px, ${(-cy * d).toFixed(2)}px, 0)`;
    });
    if (
      sigueMoviendose(cx, inclinacion.x) ||
      sigueMoviendose(cy, inclinacion.y)
    ) {
      cuadro = requestAnimationFrame(mover);
    }
  };
  const pedirMovimiento = () => {
    if (!cuadro) cuadro = requestAnimationFrame(mover);
  };
  let espera = 0;
  const alCambiarTamano = () => {
    window.clearTimeout(espera);
    espera = window.setTimeout(() => void dibujar(), 200);
  };
  window.addEventListener('resize', alCambiarTamano);
  const dejarDeSeguir = seguirInclinacion(pedirMovimiento);
  pedirMovimiento();

  return () => {
    vigente = false;
    cancelAnimationFrame(cuadro);
    window.clearTimeout(espera);
    window.removeEventListener('resize', alCambiarTamano);
    dejarDeSeguir();
    lienzos.forEach((c) => c.remove());
  };
}
