import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Euler,
  Group,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  Texture,
  Vector3,
  WebGLRenderer,
} from 'three';
import {
  densidadPixeles,
  gauss,
  inclinacion,
  reducirMovimiento,
  seguirInclinacion,
  texturaPunto,
} from './comun';

/**
 * Nube de estrellas repartidas en una esfera o en una banda como la Vía Láctea.
 * @param tam tamaño del punto en píxeles
 * @param banda si se concentran en una franja inclinada
 */
function nubeEstrellas(
  n: number,
  tam: number,
  radioMin: number,
  radioMax: number,
  mapa: Texture,
  banda: boolean,
): Points {
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const v = new Vector3();
  const c = new Color();
  const giro = new Euler(1.05, 0, 0.5);
  for (let i = 0; i < n; i++) {
    if (banda) {
      const fi = Math.random() * Math.PI * 2;
      const b = gauss() * 0.11;
      v.set(
        Math.cos(b) * Math.cos(fi),
        Math.sin(b),
        Math.cos(b) * Math.sin(fi),
      );
      v.applyEuler(giro);
    } else {
      v.set(gauss(), gauss(), gauss()).normalize();
    }
    v.multiplyScalar(radioMin + Math.random() * (radioMax - radioMin));
    v.toArray(pos, i * 3);
    const calida = Math.random() < 0.18;
    c.setHSL(
      calida ? 0.08 + Math.random() * 0.04 : 0.58 + Math.random() * 0.06,
      banda ? 0.25 : 0.35 + Math.random() * 0.3,
      banda ? 0.6 + Math.random() * 0.2 : 0.78 + Math.random() * 0.2,
    );
    c.toArray(col, i * 3);
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('color', new BufferAttribute(col, 3));
  const mat = new PointsMaterial({
    size: tam,
    map: mapa,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    sizeAttenuation: false,
    opacity: banda ? 0.45 : 1,
  });
  return new Points(geo, mat);
}

/** Dibuja el campo de estrellas que gira despacio; devuelve cómo destruirlo. */
export function crearFondoEstrellas(canvas: HTMLCanvasElement): () => void {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(densidadPixeles());
  const escena = new Scene();
  const camara = new PerspectiveCamera(62, 1, 0.1, 3000);
  const eje = new Group();
  eje.rotation.set(-0.45, 0, 0.2);
  escena.add(eje);
  const cielo = new Group();
  eje.add(cielo);
  const punto = texturaPunto();
  const nubes = [
    nubeEstrellas(2600, 2.2, 60, 900, punto, false),
    nubeEstrellas(700, 3.4, 80, 900, punto, false),
    nubeEstrellas(90, 6.2, 120, 700, punto, false),
    nubeEstrellas(3200, 1.8, 500, 900, punto, true),
  ];
  nubes.forEach((n) => cielo.add(n));

  const ajustarTamano = () => {
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camara.aspect = window.innerWidth / window.innerHeight;
    camara.updateProjectionMatrix();
  };
  ajustarTamano();
  window.addEventListener('resize', ajustarTamano);
  const dejarDeSeguir = seguirInclinacion();
  const quieto = reducirMovimiento();

  let cx = 0;
  let cy = 0;
  let cuadro = 0;
  const animar = () => {
    cx += (inclinacion.x - cx) * 0.05;
    cy += (inclinacion.y - cy) * 0.05;
    if (!quieto) cielo.rotation.y += 0.00018;
    camara.position.set(cx * 7, -cy * 5, 0);
    camara.rotation.set(-cy * 0.06, -cx * 0.09, 0);
    renderer.render(escena, camara);
    cuadro = requestAnimationFrame(animar);
  };
  cuadro = requestAnimationFrame(animar);

  return () => {
    cancelAnimationFrame(cuadro);
    window.removeEventListener('resize', ajustarTamano);
    dejarDeSeguir();
    nubes.forEach((n) => {
      n.geometry.dispose();
      (n.material as PointsMaterial).dispose();
    });
    punto.dispose();
    renderer.dispose();
  };
}
