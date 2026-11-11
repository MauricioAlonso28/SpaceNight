/**
 * Filtra el catálogo HYG v4.1 a las estrellas visibles a simple vista y escribe public/data/estrellas.json.
 * Uso: node scripts/preparar-estrellas.mjs <ruta a hygdata_v41.csv>
 * Fuente: https://github.com/astronexus/HYG-Database (CC BY-SA 4.0).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const MAGNITUD_LIMITE = 5.5;
const SALIDA = new URL('../public/data/estrellas.json', import.meta.url);

const GRIEGAS = {
  Alp: 'α',
  Bet: 'β',
  Gam: 'γ',
  Del: 'δ',
  Eps: 'ε',
  Zet: 'ζ',
  Eta: 'η',
  The: 'θ',
  Iot: 'ι',
  Kap: 'κ',
  Lam: 'λ',
  Mu: 'μ',
  Nu: 'ν',
  Xi: 'ξ',
  Omi: 'ο',
  Pi: 'π',
  Rho: 'ρ',
  Sig: 'σ',
  Tau: 'τ',
  Ups: 'υ',
  Phi: 'φ',
  Chi: 'χ',
  Psi: 'ψ',
  Ome: 'ω',
};

/** Parte una línea CSV respetando los campos entre comillas. */
function campos(linea) {
  const lista = [];
  let actual = '';
  let comillas = false;
  for (const c of linea) {
    if (c === '"') comillas = !comillas;
    else if (c === ',' && !comillas) {
      lista.push(actual);
      actual = '';
    } else actual += c;
  }
  lista.push(actual);
  return lista;
}

/** Designación de Bayer con letra griega, como «α Ori»; si no hay, la de Flamsteed. */
function designacion(bayer, flam, con) {
  if (!con) return '';
  const m = /^([A-Z][a-z]+)(-?\d*)$/.exec(bayer);
  if (m && GRIEGAS[m[1]]) {
    const indice = m[2] ? m[2].replace('-', '') : '';
    return `${GRIEGAS[m[1]]}${indice ? indice : ''} ${con}`;
  }
  return flam ? `${flam} ${con}` : '';
}

/** Lee el CSV y devuelve [ar°, dec°, mag, B−V, nombre, designación, constelación] por estrella. */
function estrellas(csv) {
  const [cabecera, ...filas] = csv.split(/\r?\n/).filter(Boolean);
  const col = Object.fromEntries(campos(cabecera).map((n, i) => [n, i]));
  return filas
    .map(campos)
    .filter((f) => f[col.proper] !== 'Sol')
    .filter((f) => Number(f[col.mag]) <= MAGNITUD_LIMITE)
    .map((f) => [
      Math.round(Number(f[col.ra]) * 15 * 1000) / 1000,
      Math.round(Number(f[col.dec]) * 1000) / 1000,
      Math.round(Number(f[col.mag]) * 100) / 100,
      f[col.ci] === '' ? null : Math.round(Number(f[col.ci]) * 100) / 100,
      f[col.proper],
      designacion(f[col.bayer], f[col.flam], f[col.con]),
      f[col.con],
    ])
    .sort((a, b) => a[2] - b[2]);
}

const ruta = process.argv[2];
if (!ruta) {
  console.error('Uso: node scripts/preparar-estrellas.mjs <hygdata_v41.csv>');
  process.exit(1);
}
const lista = estrellas(readFileSync(ruta, 'utf8'));
const datos = {
  fuente: 'HYG Database v4.1, astronexus (github.com/astronexus/HYG-Database)',
  licencia:
    'CC BY-SA 4.0 (creativecommons.org/licenses/by-sa/4.0). Este archivo es una obra derivada filtrada a magnitud 5,5 y se comparte con la misma licencia.',
  campos: ['ar', 'dec', 'mag', 'bv', 'nombre', 'designacion', 'constelacion'],
  estrellas: lista,
};
writeFileSync(SALIDA, JSON.stringify(datos));
console.log(`${lista.length} estrellas hasta magnitud ${MAGNITUD_LIMITE}`);
