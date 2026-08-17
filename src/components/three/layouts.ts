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
 * La marca se descompone en N piezas y esas mismas piezas se reorganizan
 * mientras bajas. Cada figura tiene que significar algo: durante proyectos
 * la escena dibuja de qué trata cada uno.
 *
 *  0  B            → hero
 *  1  Columna      → Anatris (eje vertebral)
 *  2  Contorno     → dispositivo médico (carcasa acotada)
 *  3  Barras       → programa contable (el tablero)
 *  4  Corazón      → Charms (regalo personalizado)
 *  5  Engranaje    → servicios (mecanismo en marcha)
 *  6  Cadena       → proceso (cuatro nodos en fila)
 *  7  Dos núcleos  → nosotros (Quito y Monterrey)
 *  8  B            → contacto (vuelve a armarse)
 */

export const LAST_STAGE = 8;

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
 * Columna: piezas apiladas alrededor de un eje curvo.
 * Es la figura de Anatris — cuerpo, eje, movimiento.
 */
function spineLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const levels = 26;
  const perLevel = Math.ceil(count / levels);

  for (let i = 0; i < count; i++) {
    const level = Math.floor(i / perLevel);
    const t = level / (levels - 1);
    const y = (t - 0.5) * 8.6;
    // Curvatura sagital: la columna no es recta
    const axisX = Math.sin(t * Math.PI * 1.35) * 1.5;
    const axisZ = Math.cos(t * Math.PI * 0.9) * 0.8 - 1;

    const around = (i % perLevel) / perLevel;
    const ring = 0.55 + (1 - Math.abs(t - 0.5) * 2) * 0.55;
    const a = around * Math.PI * 2 + t * 2.2;

    out[i * 3] = axisX + Math.cos(a) * ring + (rand() - 0.5) * 0.18;
    out[i * 3 + 1] = y + (rand() - 0.5) * 0.2;
    out[i * 3 + 2] = axisZ + Math.sin(a) * ring;
  }
  return out;
}

/**
 * Contorno de carcasa con sus cotas: la figura del dispositivo médico.
 * Perímetro redondeado + dos líneas de cota separadas del cuerpo.
 */
function outlineLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const w = 4.6;
  const h = 2.8;
  const r = 1.0;
  const bodyCount = Math.floor(count * 0.74);

  // Perímetro de rectángulo redondeado, recorrido por ángulo (superelipse)
  for (let i = 0; i < bodyCount; i++) {
    const a = (i / bodyCount) * Math.PI * 2;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const n = 4.5; // exponente: cuanto más alto, más recta la caja
    const k = Math.pow(
      Math.pow(Math.abs(ca), n) + Math.pow(Math.abs(sa), n),
      -1 / n,
    );
    out[i * 3] = ca * k * (w + r) + (rand() - 0.5) * 0.16;
    out[i * 3 + 1] = sa * k * (h + r) + (rand() - 0.5) * 0.16;
    out[i * 3 + 2] = -1 + (rand() - 0.5) * 0.7;
  }

  // Cotas: dos reglas paralelas al cuerpo
  for (let i = bodyCount; i < count; i++) {
    const j = i - bodyCount;
    const top = j % 2 === 0;
    const t = j / (count - bodyCount);
    if (top) {
      out[i * 3] = (t * 2 - 1) * (w + r);
      out[i * 3 + 1] = h + r + 1.5;
    } else {
      out[i * 3] = w + r + 1.6;
      out[i * 3 + 1] = (t * 2 - 1) * (h + r);
    }
    out[i * 3 + 2] = -1 + (rand() - 0.5) * 0.4;
  }
  return out;
}

/** Barras: el tablero del programa contable, en volumen. */
function barsLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const heights = [2.2, 3.6, 2.8, 5.2, 4.2, 6.4, 5.0, 3.2];
  const bars = heights.length;
  const perBar = Math.ceil(count / bars);
  const base = -3.4;

  for (let i = 0; i < count; i++) {
    const b = Math.min(Math.floor(i / perBar), bars - 1);
    const k = (i % perBar) / perBar;
    const x = (b - (bars - 1) / 2) * 1.85;

    out[i * 3] = x + (rand() - 0.5) * 0.75;
    out[i * 3 + 1] = base + k * heights[b] + (rand() - 0.5) * 0.18;
    out[i * 3 + 2] = -1 + (rand() - 0.5) * 0.75;
  }
  return out;
}

/** Corazón: la figura de Charms, regalos hechos a mano. */
function heartLayout(count: number, rand: () => number): Layout {
  const out = new Float32Array(count * 3);
  const scale = 0.34;

  for (let i = 0; i < count; i++) {
    const t = rand() * Math.PI * 2;
    // Radio con sesgo hacia el borde: el contorno se lee mejor que el relleno
    const fill = 0.55 + Math.pow(rand(), 0.4) * 0.45;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);

    out[i * 3] = x * scale * fill + (rand() - 0.5) * 0.2;
    out[i * 3 + 1] = y * scale * fill - 0.4 + (rand() - 0.5) * 0.2;
    out[i * 3 + 2] = -1 + (rand() - 0.5) * 1.4;
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
      spineLayout(count, rand),
      outlineLayout(count, rand),
      barsLayout(count, rand),
      heartLayout(count, rand),
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
