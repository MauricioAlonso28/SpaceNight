/**
 * Parte el Saturno V de NASA 3D Resources en sus etapas para que el visor pueda separarlas.
 * Uso: node scripts/despiezar-saturno.mjs <saturn_v.glb>
 * Fuente: https://science.nasa.gov/3d-resources/saturn-v/ (NASA/Michael D. Carbajal).
 * El modelo original trae el cuerpo entero en una sola malla; cada triángulo va a la etapa en la que cae su centro.
 * También quita las animaciones de un solo fotograma que dejó la exportación, que el visor no usa.
 */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { fileURLToPath } from 'node:url';

const SALIDA = fileURLToPath(
  new URL('../public/modelos/saturno-v.glb', import.meta.url),
);

/** Etapas de abajo arriba y la altura (en unidades del modelo) donde termina cada una. */
export const ETAPAS = [
  { id: 's-ic', hasta: 4.86 },
  { id: 's-ii', hasta: 8.46 },
  { id: 's-ivb', hasta: 10.08 },
  { id: 'unidad-instrumentos', hasta: 10.21 },
  { id: 'adaptador', hasta: 11.01 },
  { id: 'modulo-servicio', hasta: 11.48 },
  { id: 'modulo-mando', hasta: 11.71 },
  { id: 'torre-escape', hasta: Infinity },
];

/** Índice de la etapa a la que pertenece una altura. */
function etapaDe(y) {
  return ETAPAS.findIndex((e) => y < e.hasta);
}

/** Índices de los triángulos de una primitiva, generando la lista si no la tiene. */
function triangulos(prim) {
  const indices = prim.getIndices();
  const n = indices
    ? indices.getCount()
    : prim.getAttribute('POSITION').getCount();
  return Array.from({ length: n }, (_, i) =>
    indices ? indices.getScalar(i) : i,
  );
}

/** Copia una primitiva quedándose solo con los triángulos dados y los vértices que usan. */
function recortar(doc, prim, lista) {
  const mapa = new Map();
  const nuevos = lista.map((v) => {
    if (!mapa.has(v)) mapa.set(v, mapa.size);
    return mapa.get(v);
  });
  const buffer = doc.getRoot().listBuffers()[0];
  const copia = doc.createPrimitive().setMaterial(prim.getMaterial());
  for (const semantica of prim.listSemantics()) {
    const origen = prim.getAttribute(semantica);
    const tam = origen.getElementSize();
    const Tipo = origen.getArray().constructor;
    const datos = new Tipo(mapa.size * tam);
    const el = [];
    for (const [viejo, nuevo] of mapa) {
      datos.set(origen.getElement(viejo, el), nuevo * tam);
    }
    copia.setAttribute(
      semantica,
      doc
        .createAccessor()
        .setType(origen.getType())
        .setArray(datos)
        .setNormalized(origen.getNormalized())
        .setBuffer(buffer),
    );
  }
  const Indices = mapa.size > 65535 ? Uint32Array : Uint16Array;
  copia.setIndices(
    doc
      .createAccessor()
      .setType('SCALAR')
      .setArray(new Indices(nuevos))
      .setBuffer(buffer),
  );
  return copia;
}

/** Reparte los triángulos de una primitiva entre las etapas según la altura de su centro. */
function repartir(prim, matriz) {
  const pos = prim.getAttribute('POSITION');
  const tri = triangulos(prim);
  const porEtapa = ETAPAS.map(() => []);
  const el = [];
  for (let i = 0; i < tri.length; i += 3) {
    let y = 0;
    for (let k = 0; k < 3; k++) {
      const [px, py, pz] = pos.getElement(tri[i + k], el);
      y += matriz[1] * px + matriz[5] * py + matriz[9] * pz + matriz[13];
    }
    porEtapa[etapaDe(y / 3)].push(tri[i], tri[i + 1], tri[i + 2]);
  }
  return porEtapa;
}

const entrada = process.argv[2];
if (!entrada) {
  console.error('Uso: node scripts/despiezar-saturno.mjs <saturn_v.glb>');
  process.exit(1);
}

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(entrada);
const escena = doc.getRoot().getDefaultScene();
const raiz = escena.listChildren()[0];
const mallas = ETAPAS.map((e) => doc.createMesh(e.id));
const viejos = new Set();

for (const nodo of raiz.listChildren()) {
  const malla = nodo.getMesh();
  if (!malla) continue;
  const matriz = nodo.getWorldMatrix();
  for (const prim of malla.listPrimitives()) {
    repartir(prim, matriz).forEach((lista, i) => {
      if (lista.length) mallas[i].addPrimitive(recortar(doc, prim, lista));
    });
    prim.listSemantics().forEach((s) => viejos.add(prim.getAttribute(s)));
    viejos.add(prim.getIndices());
    prim.dispose();
  }
  malla.dispose();
  nodo.dispose();
}
for (const anim of doc.getRoot().listAnimations()) {
  anim
    .listSamplers()
    .forEach((m) => viejos.add(m.getInput()).add(m.getOutput()));
  anim.dispose();
}
viejos.forEach((a) => a?.dispose());

raiz.setName('saturno-v');
ETAPAS.forEach((e, i) =>
  raiz.addChild(doc.createNode(e.id).setMesh(mallas[i])),
);

await io.write(SALIDA, doc);
for (const [i, e] of ETAPAS.entries()) {
  const n = mallas[i]
    .listPrimitives()
    .reduce((s, p) => s + p.getIndices().getCount() / 3, 0);
  console.log(`${e.id}: ${n} triángulos`);
}
