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
 * La marca se descompone en N piezas. Cada "layout" es una disposición
 * distinta de esas mismas piezas; el scroll interpola entre layouts, así que
 * la figura literalmente se desarma y se vuelve a armar mientras bajas.
 *
 * Layout 0  B          → hero
 * Layout 1  Retícula   → proyectos (estructura, orden)
 * Layout 2  Engranaje  → servicios (mecanismo en marcha)
 * Layout 3  Dos nubes  → nosotros (Quito y Monterrey)
 * Layout 4  B          → contacto (vuelve a armarse)
 */

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

    tris.push({
      a: va.clone(),
      b: vb.clone(),
      c: vc.clone(),
      area,
      colorId,
    });
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
    positions[i * 3 + 2] = (rand() - 0.5) * 0.46;
    colorIds[i] = tri.colorId;
  }

  return { positions, colorIds };
}

/** Retícula ordenada: la marca convertida en estructura. */
function gridLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const cols = 10;
  const rows = Math.ceil(count / cols);
  const spanX = 13;
  const spanY = 7.4;

  for (let i = 0; i < count; i++) {
    const cx = i % cols;
    const cy = Math.floor(i / cols);
    out[i * 3] = (cx / (cols - 1) - 0.5) * spanX + (rand() - 0.5) * 0.35;
    out[i * 3 + 1] = (cy / Math.max(rows - 1, 1) - 0.5) * spanY + (rand() - 0.5) * 0.3;
    out[i * 3 + 2] = -2.5 - rand() * 5;
  }
  return out;
}

/** Engranaje: anillo con dientes, girando de canto. */
function gearLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const teeth = 14;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const tooth = Math.sign(Math.sin(a * teeth)) * 0.55;
    const r = 4.6 + tooth + (rand() - 0.5) * 0.18;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = Math.sin(a) * r * 0.62;
    out[i * 3 + 2] = -1.5 + (rand() - 0.5) * 1.1;
  }
  return out;
}

/** Dos nubes conectadas: Quito y Monterrey. */
function dualLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const bridge = Math.floor(count * 0.22);

  for (let i = 0; i < count; i++) {
    if (i < bridge) {
      // Arco que une los dos núcleos
      const t = i / Math.max(bridge - 1, 1);
      const x = -4.6 + t * 9.2;
      out[i * 3] = x + (rand() - 0.5) * 0.25;
      out[i * 3 + 1] = Math.sin(t * Math.PI) * 2.1 - 0.4 + (rand() - 0.5) * 0.25;
      out[i * 3 + 2] = -2 + (rand() - 0.5) * 0.8;
      continue;
    }

    const left = (i - bridge) % 2 === 0;
    const cxx = left ? -4.6 : 4.6;
    const r = 1.5 + rand() * 0.9;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    out[i * 3] = cxx + r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = -0.4 + r * Math.sin(phi) * Math.sin(theta);
    out[i * 3 + 2] = -2 + r * Math.cos(phi);
  }
  return out;
}

export type AssemblyData = {
  count: number;
  /** Layouts en orden de scroll */
  layouts: Layout[];
  colorIds: ColorIds;
  /** Escala base de cada pieza */
  scales: Float32Array;
  /** Eje de giro por pieza (x,y,z normalizado) */
  axes: Float32Array;
  /** Fase de giro por pieza */
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
    scales[i] = 0.17 + rand() * 0.13;
    axis
      .set(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1)
      .normalize();
    axes[i * 3] = axis.x;
    axes[i * 3 + 1] = axis.y;
    axes[i * 3 + 2] = axis.z;
    phases[i] = rand() * Math.PI * 2;
  }

  return {
    count,
    layouts: [
      mark.positions,
      gridLayout(count, rand),
      gearLayout(count, rand),
      dualLayout(count, rand),
      mark.positions,
    ],
    colorIds: mark.colorIds,
    scales,
    axes,
    phases,
  };
}
