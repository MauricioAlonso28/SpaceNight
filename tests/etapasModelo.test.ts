/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  acercar,
  alturasSeparadas,
  crearEtapas,
} from '../src/3d/cohete/etapasModelo';
import { ETAPAS_SATURNO } from '../src/pantallas/Cohete/etapasSaturno';
import { MODELOS_NASA } from '../src/pantallas/Cohete/modelosNasa';

/** Una torre de cajas de 1 de alto, una por etapa, que comparten material como en el glb. */
function torre(ids: string[]) {
  const material = new MeshStandardMaterial();
  const raiz = new Group();
  ids.forEach((id, i) => {
    const nodo = new Group();
    nodo.name = id;
    const caja = new Mesh(new BoxGeometry(1, 1, 1), material);
    caja.position.y = i + 0.5;
    nodo.add(caja);
    raiz.add(nodo);
  });
  return raiz;
}

/** Nombres de los nodos de un archivo glb, leídos de su bloque JSON. */
function nodosGlb(archivo: string): string[] {
  const glb = readFileSync(
    new URL(`../public/modelos/${archivo}`, import.meta.url),
  );
  const largo = glb.readUInt32LE(12);
  const json = JSON.parse(glb.subarray(20, 20 + largo).toString('utf8'));
  return json.nodes.map((n: { name: string }) => n.name);
}

describe('etapas de un modelo', () => {
  it('acercar avanza a velocidad constante sin pasarse de la meta', () => {
    expect(acercar(0, 1, 0.3, 0.6)).toBeCloseTo(0.5);
    expect(acercar(0.9, 1, 0.3, 0.6)).toBe(1);
    expect(acercar(1, 0, 0.3, 0.6)).toBeCloseTo(0.5);
    expect(acercar(0, 1, 0, 0)).toBe(1);
  });

  it('cada etapa separada sube un hueco más que la de debajo', () => {
    expect(alturasSeparadas(4, 2)).toEqual([0, 2, 4, 6]);
  });

  it('devuelve null si al modelo le falta una etapa', () => {
    expect(crearEtapas(torre(['a', 'b']), ['a', 'c'], 2, false)).toBeNull();
    expect(crearEtapas(torre(['a']), [], 2, false)).toBeNull();
  });

  it('separar abre huecos y volver a unir las deja en su sitio', () => {
    const modelo = torre(['a', 'b', 'c']);
    const etapas = crearEtapas(modelo, ['a', 'b', 'c'], 10, false)!;
    const y = () =>
      ['a', 'b', 'c'].map((id) => modelo.getObjectByName(id)!.position.y);

    etapas.separar(true);
    expect(etapas.avanzar(0)).toBe(false);
    expect(y()).toEqual([0, 0.6, 1.2].map((v) => expect.closeTo(v, 6)));

    etapas.separar(false);
    etapas.avanzar(0);
    expect(y()).toEqual([0, 0, 0]);
  });

  it('abrir saca la pieza hacia el lado, apaga las demás y centra la cámara en ella', () => {
    const modelo = torre(['a', 'b', 'c']);
    const etapas = crearEtapas(modelo, ['a', 'b', 'c'], 10, false)!;
    etapas.abrir('b', new Vector3(1, 0, 0));
    etapas.avanzar(0);

    const b = modelo.getObjectByName('b')!;
    expect(b.position.x).toBeCloseTo(2);
    const opacidad = (id: string) =>
      (
        (modelo.getObjectByName(id)!.children[0] as Mesh)
          .material as MeshStandardMaterial
      ).opacity;
    expect(opacidad('b')).toBe(1);
    expect(opacidad('a')).toBeCloseTo(0.2);
    expect(opacidad('c')).toBeCloseTo(0.2);

    const foco = etapas.enfoque();
    expect(foco.mezcla).toBe(1);
    expect(foco.centro.y).toBeCloseTo(1.5);
    expect(foco.centro.x).toBeCloseTo(2);
  });

  it('cerrar devuelve la pieza y las demás vuelven a verse enteras', () => {
    const modelo = torre(['a', 'b']);
    const etapas = crearEtapas(modelo, ['a', 'b'], 10, false)!;
    etapas.abrir('a', new Vector3(0, 0, 1));
    etapas.avanzar(0);
    etapas.cerrar();
    etapas.avanzar(0);
    expect(modelo.getObjectByName('a')!.position.z).toBe(0);
    const material = (modelo.getObjectByName('b')!.children[0] as Mesh)
      .material as MeshStandardMaterial;
    expect(material.opacity).toBe(1);
    expect(material.transparent).toBe(false);
    expect(etapas.enfoque().mezcla).toBe(0);
  });

  it('con movimiento, la animación sigue hasta llegar y luego para', () => {
    const modelo = torre(['a', 'b']);
    const etapas = crearEtapas(modelo, ['a', 'b'], 10, true)!;
    etapas.separar(true);
    expect(etapas.avanzar(0.3)).toBe(true);
    expect(etapas.avanzar(0.3)).toBe(false);
  });

  it('piezaDe encuentra la etapa de una malla tocada', () => {
    const modelo = torre(['a', 'b']);
    const etapas = crearEtapas(modelo, ['a', 'b'], 10, false)!;
    const malla = modelo.getObjectByName('b')!.children[0];
    expect(etapas.piezaDe(malla)).toBe('b');
    expect(etapas.piezaDe(modelo)).toBeNull();
  });
});

describe('etapas del Saturno V', () => {
  it('el glb tiene un nodo por cada etapa con ficha', () => {
    const saturno = MODELOS_NASA.find((m) => m.id === 'saturno-v')!;
    const nodos = nodosGlb(saturno.archivo);
    for (const e of ETAPAS_SATURNO) expect(nodos).toContain(e.id);
  });

  it('cada ficha está completa en los dos idiomas', () => {
    expect(ETAPAS_SATURNO).toHaveLength(8);
    for (const e of ETAPAS_SATURNO) {
      for (const campo of [e.nombre, e.papel, e.resumen]) {
        expect(campo.es.length).toBeGreaterThan(0);
        expect(campo.en.length).toBeGreaterThan(0);
      }
      expect(e.datos.length).toBeGreaterThan(0);
      for (const d of e.datos) {
        expect(
          d.etiqueta.en && d.valor.en && d.etiqueta.es && d.valor.es,
        ).toBeTruthy();
      }
    }
  });

  it('las fuentes son páginas de la NASA', () => {
    const saturno = MODELOS_NASA.find((m) => m.id === 'saturno-v')!;
    expect(saturno.fuentes?.length).toBeGreaterThan(0);
    for (const f of saturno.fuentes!) {
      expect(f.url).toMatch(/^https:\/\/www\.nasa\.gov\//);
    }
  });
});
