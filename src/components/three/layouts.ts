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
 * Regla de composición: en las secciones con contenido, las piezas se apartan
 * a los flancos para que no queden tapadas por las tarjetas. El morph ocurre
 * en las bandas intermedias, donde la pantalla está libre.
 *
 * Layout 0  B           → hero
 * Layout 1  Columnas    → proyectos (dos bancos ordenados a los lados)
 * Layout 2  Engranaje   → servicios (aro grande que enmarca el contenido)
 * Layout 3  Cadena      → proceso (cuatro nodos en fila, arriba)
 * Layout 4  Dos núcleos → nosotros (Quito y Monterrey, unidos por un arco)
 * Layout 5  B           → contacto (vuelve a armarse)
 */

/** Última etapa del recorrido; la marca sólida vuelve a aparecer aquí. */
export const LAST_STAGE = 5;

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
 * Columnas: dos bancos ordenados a izquierda y derecha.
 * El centro queda libre porque ahí van las tarjetas de proyecto.
 */
function columnsLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const perSide = Math.ceil(count / 2);
  const rows = Math.ceil(perSide / 3);

  for (let i = 0; i < count; i++) {
    const right = i % 2 === 0;
    const n = Math.floor(i / 2);
    const col = n % 3;
    const row = Math.floor(n / 3);

    const baseX = right ? 6.0 : -6.0;
    const dir = right ? 1 : -1;

    out[i * 3] = baseX + dir * col * 1.25 + (rand() - 0.5) * 0.3;
    out[i * 3 + 1] = (row / Math.max(rows - 1, 1) - 0.5) * 11 + (rand() - 0.5) * 0.35;
    out[i * 3 + 2] = -1 - rand() * 3;
  }
  return out;
}

/** Engranaje: aro grande con dientes que enmarca el contenido. */
function gearLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const teeth = 16;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const tooth = Math.sign(Math.sin(a * teeth)) * 0.7;
    const r = 7.4 + tooth + (rand() - 0.5) * 0.2;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = Math.sin(a) * r * 0.72;
    out[i * 3 + 2] = -1 + (rand() - 0.5) * 1.2;
  }
  return out;
}

/** Cadena de cuatro nodos: los cuatro pasos del proceso, en fila. */
function chainLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const nodes = 4;
  const nodeX = [-7.2, -2.4, 2.4, 7.2];
  const linkShare = 0.3;
  const linkCount = Math.floor(count * linkShare);
  const perNode = Math.ceil((count - linkCount) / nodes);

  for (let i = 0; i < count; i++) {
    if (i < linkCount) {
      // Tramos rectos que unen los nodos
      const seg = i % (nodes - 1);
      const t = (i / linkCount) * (nodes - 1) - seg;
      out[i * 3] = nodeX[seg] + (nodeX[seg + 1] - nodeX[seg]) * t;
      out[i * 3 + 1] = 3.4 + (rand() - 0.5) * 0.3;
      out[i * 3 + 2] = -1 + (rand() - 0.5) * 0.6;
      continue;
    }

    const n = Math.min(Math.floor((i - linkCount) / perNode), nodes - 1);
    const r = 0.9 + rand() * 0.85;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    out[i * 3] = nodeX[n] + r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = 3.4 + r * Math.sin(phi) * Math.sin(theta);
    out[i * 3 + 2] = -1 + r * Math.cos(phi);
  }
  return out;
}

/** Dos núcleos conectados: Quito y Monterrey. */
function dualLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const bridge = Math.floor(count * 0.24);

  for (let i = 0; i < count; i++) {
    if (i < bridge) {
      // Arco que une los dos núcleos, por encima del contenido
      const t = i / Math.max(bridge - 1, 1);
      const x = -6.4 + t * 12.8;
      out[i * 3] = x + (rand() - 0.5) * 0.3;
      out[i * 3 + 1] = 2.4 + Math.sin(t * Math.PI) * 2.6 + (rand() - 0.5) * 0.3;
      out[i * 3 + 2] = -1.5 + (rand() - 0.5) * 0.9;
      continue;
    }

    const left = (i - bridge) % 2 === 0;
    const cxx = left ? -6.4 : 6.4;
    const r = 1.7 + rand() * 1.1;
    const theta = rand() * Math.PI * 2;
    const phi = Math.acos(2 * rand() - 1);
    out[i * 3] = cxx + r * Math.sin(phi) * Math.cos(theta);
    out[i * 3 + 1] = -0.2 + r * Math.sin(phi) * Math.sin(theta);
    out[i * 3 + 2] = -1.5 + r * Math.cos(phi);
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
      columnsLayout(count, rand),
      gearLayout(count, rand),
      chainLayout(count, rand),
      dualLayout(count, rand),
      mark.positions,
    ],
    colorIds: mark.colorIds,
    scales,
    axes,
    phases,
  };
}
