import * as THREE from "three";
import {
  bottomBowlShape,
  bottomStemShape,
  topBowlShape,
  topStemShape,
} from "./logoShapes";

/**
 * Sistema de ensamblaje.
 *
 * La marca se descompone en N piezas al salir del hero y vuelve a armarse al
 * llegar a contacto. En medio las piezas NO dibujan figuras reconocibles: se
 * reparten por los bordes del encuadre como campo de fondo.
 *
 * Antes cada sección tenía su figura (columna, engranaje, corazón…), pero
 * competían con el dragón — dos cosas con forma moviéndose a la vez y ninguna
 * se leía. Ahora hay una sola criatura y todo lo demás es soporte.
 *
 *  0        B          → hero
 *  1 … n-1  Campo      → resto del recorrido, siempre en los márgenes
 *  n        B          → contacto
 */

export const LAST_STAGE = 8;

/**
 * Cuánto está viajando la escena en esta etapa.
 *
 * La etapa es entera mientras el centro de la pantalla está dentro de una
 * sección, y fraccionaria solo en el hueco entre dos. Así que la parte
 * decimal es, literalmente, "estoy entre secciones": 0 leyendo, 1 en mitad
 * del salto.
 *
 * De aquí sale el ritmo de toda la escena. Quieto para leer, en marcha en
 * las bandas.
 */
export function travelAt(stage: number): number {
  const gap = stage - Math.floor(stage);
  return Math.sin(THREE.MathUtils.clamp(gap, 0, 1) * Math.PI);
}

export type Layout = Float32Array; // [x,y,z] * count

/** Índice de color por pieza: 0 navy, 1 navy oscuro, 2 cian, 3 naranja */
export type ColorIds = Uint8Array;

type Tri = {
  a: THREE.Vector3;
  b: THREE.Vector3;
  c: THREE.Vector3;
  area: number;
  colorId: number;
};

function trianglesOf(shape: THREE.Shape, colorId: number): Tri[] {
  const geo = new THREE.ShapeGeometry(shape, 22);
  const pos = geo.attributes.position;
  const index = geo.getIndex();
  const tris: Tri[] = [];
  const count = index ? index.count : pos.count;

  const va = new THREE.Vector3();
  const vb = new THREE.Vector3();
  const vc = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();

  for (let i = 0; i < count; i += 3) {
    const i0 = index ? index.getX(i) : i;
    const i1 = index ? index.getX(i + 1) : i + 1;
    const i2 = index ? index.getX(i + 2) : i + 2;

    va.fromBufferAttribute(pos, i0);
    vb.fromBufferAttribute(pos, i1);
    vc.fromBufferAttribute(pos, i2);

    ab.subVectors(vb, va);
    ac.subVectors(vc, va);
    const area = ab.cross(ac).length() / 2;
    if (area <= 0) continue;

    tris.push({ a: va.clone(), b: vb.clone(), c: vc.clone(), area, colorId });
  }

  geo.dispose();
  return tris;
}

/** Generador pseudoaleatorio determinista: el mismo montaje en cada carga. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Nube de puntos que rellena la "B", con el color de la pieza de origen. */
function sampleMark(count: number, rand: () => number) {
  const tris = [
    ...trianglesOf(topStemShape(), 0),
    ...trianglesOf(bottomStemShape(), 1),
    ...trianglesOf(topBowlShape(), 2),
    ...trianglesOf(bottomBowlShape(), 3),
  ];

  const cumulative: number[] = [];
  let total = 0;
  for (const t of tris) {
    total += t.area;
    cumulative.push(total);
  }

  const positions = new Float32Array(count * 3);
  const colorIds = new Uint8Array(count);

  for (let i = 0; i < count; i++) {
    const target = rand() * total;
    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const tri = tris[lo];

    let u = rand();
    let v = rand();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    const w = 1 - u - v;

    positions[i * 3] = tri.a.x * w + tri.b.x * u + tri.c.x * v;
    positions[i * 3 + 1] = tri.a.y * w + tri.b.y * u + tri.c.y * v;
    positions[i * 3 + 2] = (rand() - 0.5) * 0.5;
    colorIds[i] = tri.colorId;
  }

  return { positions, colorIds };
}

/**
 * Campo de borde.
 *
 * Piezas repartidas por el perímetro del encuadre, dejando libre el centro.
 * No forma nada reconocible a propósito: su trabajo es dar profundidad y
 * dejar que la única silueta con lectura sea el dragón.
 *
 * `variant` desplaza el patrón para que cada tramo del scroll tenga una
 * disposición algo distinta y el campo nunca parezca congelado.
 */
function edgeFieldLayout(
  count: number,
  rand: () => number,
  variant: number,
): Layout {
  const out = new Float32Array(count * 3);
  const phase = variant * 1.7;

  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2 + phase;
    // Radio grande: el centro queda despejado para la criatura y el texto
    const r = 7.4 + rand() * 4.2;
    // Achatado en vertical, para acompañar el formato apaisado
    out[i * 3] = Math.cos(a) * r + (rand() - 0.5) * 1.6;
    out[i * 3 + 1] = Math.sin(a) * r * 0.62 + (rand() - 0.5) * 1.4;
    out[i * 3 + 2] = -4 - rand() * 6;
  }
  return out;
}

export type AssemblyData = {
  count: number;
  layouts: Layout[];
  colorIds: ColorIds;
  scales: Float32Array;
  axes: Float32Array;
  phases: Float32Array;
};

export function buildAssembly(count: number, seed = 7): AssemblyData {
  const rand = mulberry32(seed);
  const mark = sampleMark(count, rand);

  const scales = new Float32Array(count);
  const axes = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const axis = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    scales[i] = 0.24 + rand() * 0.2;
    axis.set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize();
    axes[i * 3] = axis.x;
    axes[i * 3 + 1] = axis.y;
    axes[i * 3 + 2] = axis.z;
    phases[i] = rand() * Math.PI * 2;
  }

  return {
    count,
    layouts: [
      mark.positions,
      ...Array.from({ length: LAST_STAGE - 1 }, (_, i) =>
        edgeFieldLayout(count, rand, i),
      ),
      mark.positions,
    ],
    colorIds: mark.colorIds,
    scales,
    axes,
    phases,
  };
}
