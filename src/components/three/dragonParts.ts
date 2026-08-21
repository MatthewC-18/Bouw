import * as THREE from "three";

/**
 * Geometría del dragón.
 *
 * Nada de primitivas sueltas pegadas entre sí: cada pieza es una superficie
 * barrida sobre una curva o un perfil, así que las uniones son continuas y la
 * silueta se lee como un animal y no como un montón de conos.
 */

/* ------------------------------------------------------------------ */
/* Tubo cónico sobre una curva                                         */
/* ------------------------------------------------------------------ */

export type TubeOpts = {
  /** 1 = sección circular, <1 = ovalada (huesos, dedos). */
  flatten?: number;
  /** Estrías anulares, como los anillos de un cuerno. */
  ridges?: { count: number; depth: number };
  /** Repeticiones de UV a lo largo del tubo. */
  uvRepeat?: number;
};

/**
 * Barre una sección circular sobre una CatmullRom con radio variable.
 * Es la pieza básica de cuernos, dedos, patas, garras y espolones.
 */
export function taperedTube(
  points: THREE.Vector3[],
  radiusAt: (t: number) => number,
  segments = 22,
  radials = 10,
  opts: TubeOpts = {},
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.5);
  const frames = curve.computeFrenetFrames(segments, false);
  const flatten = opts.flatten ?? 1;
  const uvRepeat = opts.uvRepeat ?? 1;
  const cols = radials + 1;
  const count = (segments + 1) * cols;

  const position = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const point = new THREE.Vector3();
  const vertex = new THREE.Vector3();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    const normal = frames.normals[i];
    const binormal = frames.binormals[i];

    let r = radiusAt(t);
    if (opts.ridges) {
      const ripple = Math.max(0, Math.sin(t * Math.PI * opts.ridges.count));
      r *= 1 + ripple * opts.ridges.depth;
    }

    for (let a = 0; a <= radials; a++) {
      const ang = (a / radials) * Math.PI * 2;
      vertex
        .copy(point)
        .addScaledVector(normal, Math.cos(ang) * r)
        .addScaledVector(binormal, Math.sin(ang) * r * flatten);

      const k = i * cols + a;
      position[k * 3] = vertex.x;
      position[k * 3 + 1] = vertex.y;
      position[k * 3 + 2] = vertex.z;
      uv[k * 2] = a / radials;
      uv[k * 2 + 1] = t * uvRepeat;
    }
  }

  const index: number[] = [];
  for (let i = 0; i < segments; i++) {
    for (let a = 0; a < radials; a++) {
      const i0 = i * cols + a;
      const i1 = i0 + 1;
      const i2 = i0 + cols;
      const i3 = i2 + 1;
      index.push(i0, i2, i1, i1, i2, i3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/* ------------------------------------------------------------------ */
/* Barrido por secciones (cráneo, mandíbula)                           */
/* ------------------------------------------------------------------ */

export type Section = {
  /** Avance sobre el eje +Z. */
  z: number;
  /** Semiancho. */
  w: number;
  /** Semialto. */
  h: number;
  /** Desplazamiento vertical del centro. */
  y: number;
  /** Exponente de superelipse: 2 = elipse, >2 = sección más cuadrada. */
  n: number;
};

/**
 * Interpola las secciones con splines y las cose en una superficie.
 * El modificador opcional deforma el radio por ángulo: de ahí salen el
 * arco superciliar, los pómulos y el bulto de los ollares.
 */
export function sweepSections(
  sections: Section[],
  steps: number,
  radials: number,
  modifier?: (t: number, ang: number) => number,
): THREE.BufferGeometry {
  const pick = (get: (s: Section) => number) =>
    new THREE.SplineCurve(
      sections.map((s) => new THREE.Vector2(s.z, get(s))),
    );

  const wCurve = pick((s) => s.w);
  const hCurve = pick((s) => s.h);
  const yCurve = pick((s) => s.y);
  const nCurve = pick((s) => s.n);

  const cols = radials + 1;
  const count = (steps + 1) * cols;
  const position = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);

  const tmp = new THREE.Vector2();
  // La UV avanza con el eje, no con el índice: donde las secciones se juntan
  // (nuca, punta del hocico) las escamas se comprimirían en anillos.
  const zStart = sections[0].z;
  const zSpan = sections[sections.length - 1].z - zStart || 1;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const w = wCurve.getPoint(t, tmp).y;
    const z = tmp.x;
    const h = hCurve.getPoint(t, tmp).y;
    const cy = yCurve.getPoint(t, tmp).y;
    const n = Math.max(2, nCurve.getPoint(t, tmp).y);
    const p = 2 / n;

    for (let a = 0; a <= radials; a++) {
      const ang = (a / radials) * Math.PI * 2;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      const k = modifier ? modifier(t, ang) : 1;

      const x = Math.sign(c) * Math.pow(Math.abs(c), p) * w * k;
      const y = Math.sign(s) * Math.pow(Math.abs(s), p) * h * k + cy;

      const idx = i * cols + a;
      position[idx * 3] = x;
      position[idx * 3 + 1] = y;
      position[idx * 3 + 2] = z;
      uv[idx * 2] = a / radials;
      uv[idx * 2 + 1] = (z - zStart) / zSpan;
    }
  }

  const index: number[] = [];
  for (let i = 0; i < steps; i++) {
    for (let a = 0; a < radials; a++) {
      const i0 = i * cols + a;
      const i1 = i0 + 1;
      const i2 = i0 + cols;
      const i3 = i2 + 1;
      index.push(i0, i2, i1, i1, i2, i3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Cráneo                                                              */
/* ------------------------------------------------------------------ */

/** Secciones del cráneo: occipucio, caja craneal, órbitas, hocico. */
const SKULL: Section[] = [
  // Ningún extremo cierra en punta: donde el barrido converge, las columnas de
  // la UV se juntan y aparece una espiral de escamas con su propio brillo. La
  // nuca queda abierta (la tapa el cuello) y el morro también (lo tapa la
  // almohadilla nasal).
  { z: -0.5, w: 0.3, h: 0.26, y: 0.02, n: 2.5 },
  { z: -0.42, w: 0.45, h: 0.37, y: 0.01, n: 2.6 },
  { z: -0.18, w: 0.54, h: 0.47, y: 0.0, n: 2.7 },
  { z: 0.06, w: 0.56, h: 0.48, y: -0.01, n: 2.7 },
  { z: 0.3, w: 0.5, h: 0.42, y: -0.03, n: 2.6 },
  { z: 0.54, w: 0.4, h: 0.34, y: -0.05, n: 2.5 },
  { z: 0.78, w: 0.32, h: 0.28, y: -0.07, n: 2.4 },
  { z: 1.0, w: 0.28, h: 0.26, y: -0.08, n: 2.4 },
  { z: 1.2, w: 0.26, h: 0.25, y: -0.08, n: 2.5 },
  { z: 1.34, w: 0.24, h: 0.23, y: -0.07, n: 2.6 },
  { z: 1.46, w: 0.15, h: 0.15, y: -0.06, n: 2.5 },
];

/** Los dos extremos abiertos del cráneo, que tapan sus almohadillas. */
export const SNOUT_END = { z: 1.46, y: -0.06, r: 0.15 };
export const NAPE_END = { z: -0.5, y: 0.02, r: 0.3 };

const bump = (center: number, width: number, x: number) =>
  Math.exp(-Math.pow((x - center) / width, 2));

/** Los bultos que convierten un tubo en una cabeza. */
function skullModifier(t: number, ang: number) {
  const s = Math.sin(ang); // +1 arriba
  const c = Math.abs(Math.cos(ang)); // 1 a los lados
  const upper = Math.max(0, s);

  const brain = bump(0.16, 0.11, t) * Math.pow(upper, 1.4);
  const brow = bump(0.38, 0.08, t) * Math.pow(upper, 0.7) * Math.pow(c, 0.6);
  const cheek = bump(0.28, 0.1, t) * Math.pow(c, 1.6) * (0.55 + 0.45 * Math.max(0, -s));
  const nostril = bump(0.9, 0.045, t) * Math.pow(upper, 1.1);
  const lip = bump(0.72, 0.2, t) * Math.pow(Math.max(0, -s), 1.5) * 0.6;

  return 1 + brain * 0.09 + brow * 0.17 + cheek * 0.12 + nostril * 0.15 + lip * 0.1;
}

export function buildSkull(radials = 22) {
  return sweepSections(SKULL, 46, radials, skullModifier);
}

/** Mandíbula: su origen es la charnela, para poder abrirla girando en X. */
const MANDIBLE: Section[] = [
  // Igual que el cráneo: extremos romos, sin polo. La charnela queda dentro
  // de la cabeza y la barbilla la remata su propia almohadilla.
  { z: -0.3, w: 0.13, h: 0.1, y: 0.0, n: 2.4 },
  { z: -0.1, w: 0.31, h: 0.17, y: -0.02, n: 2.6 },
  { z: 0.18, w: 0.41, h: 0.21, y: -0.05, n: 2.8 },
  { z: 0.5, w: 0.39, h: 0.2, y: -0.09, n: 2.8 },
  { z: 0.85, w: 0.33, h: 0.18, y: -0.11, n: 2.7 },
  { z: 1.16, w: 0.28, h: 0.16, y: -0.11, n: 2.6 },
  { z: 1.42, w: 0.23, h: 0.14, y: -0.09, n: 2.5 },
  { z: 1.54, w: 0.12, h: 0.09, y: -0.08, n: 2.4 },
];

/** Punta de la mandíbula, para plantar ahí la almohadilla del mentón. */
export const CHIN_END = { z: 1.54, y: -0.08, r: 0.11 };

export function buildMandible(radials = 18) {
  return sweepSections(MANDIBLE, 34, radials, (t, ang) => {
    const s = Math.sin(ang);
    // Barbilla marcada y borde inferior con quilla
    const chin = bump(0.82, 0.12, t) * Math.pow(Math.max(0, -s), 1.6);
    return 1 + chin * 0.16;
  });
}

/* ------------------------------------------------------------------ */
/* Cuernos, espolones y garras                                         */
/* ------------------------------------------------------------------ */

/** Cuerno principal: nace tras la órbita, barre hacia atrás y curva arriba. */
export function buildHorn() {
  return taperedTube(
    [
      v3(0, 0, 0),
      v3(0.06, 0.34, -0.3),
      v3(0.14, 0.66, -0.72),
      v3(0.24, 0.82, -1.2),
      v3(0.36, 0.78, -1.62),
      v3(0.46, 0.62, -1.84),
    ],
    (t) => 0.115 * Math.pow(1 - t, 0.72) + 0.004,
    30,
    12,
    { ridges: { count: 13, depth: 0.12 }, uvRepeat: 3 },
  );
}

/** Cuerno secundario, más corto y recto, por detrás del principal. */
export function buildHornSmall() {
  return taperedTube(
    [v3(0, 0, 0), v3(0.05, 0.2, -0.22), v3(0.12, 0.36, -0.5), v3(0.2, 0.4, -0.72)],
    (t) => 0.055 * Math.pow(1 - t, 0.8) + 0.003,
    18,
    10,
    { ridges: { count: 8, depth: 0.1 }, uvRepeat: 2 },
  );
}

/** Espolón de mejilla / mandíbula: recto y corto. */
export function buildSpur() {
  return taperedTube(
    [v3(0, 0, 0), v3(0.02, 0.1, -0.16), v3(0.05, 0.16, -0.34)],
    (t) => 0.038 * Math.pow(1 - t, 0.85) + 0.002,
    12,
    8,
  );
}

/** Garra curva: base gruesa, punta afilada. */
export function buildClaw() {
  return taperedTube(
    [v3(0, 0, 0), v3(0, -0.1, 0.12), v3(0.01, -0.24, 0.2), v3(0.02, -0.38, 0.18)],
    (t) => 0.055 * Math.pow(1 - t, 0.9) + 0.002,
    16,
    9,
  );
}

/** Diente: cono ligeramente curvado hacia dentro. */
export function buildTooth() {
  return taperedTube(
    [v3(0, 0, 0), v3(0, 0.1, 0.008), v3(0.004, 0.2, 0.02)],
    (t) => 0.035 * Math.pow(1 - t, 0.85) + 0.0015,
    10,
    7,
  );
}

/* ------------------------------------------------------------------ */
/* Espinas dorsales                                                    */
/* ------------------------------------------------------------------ */

/** Púa del lomo: hoja barrida hacia la cola, con bisel. */
export function buildSpine() {
  const s = new THREE.Shape();
  s.moveTo(0.1, 0);
  s.quadraticCurveTo(0.06, 0.5, -0.34, 1);
  s.quadraticCurveTo(-0.12, 0.46, -0.16, 0.02);
  s.closePath();

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.055,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.02,
    bevelSegments: 2,
    curveSegments: 14,
  }).translate(0, 0, -0.0275);
}

/* ------------------------------------------------------------------ */
/* Ala                                                                 */
/* ------------------------------------------------------------------ */

/**
 * Esqueleto del ala en el plano del perfil (x hacia fuera, y arriba).
 * Hombro → codo → muñeca, y de la muñeca salen cuatro dedos.
 */
export const WING = {
  shoulder: [0, 0] as [number, number],
  elbow: [1.28, 0.58] as [number, number],
  wrist: [2.4, 1.04] as [number, number],
  hip: [0.16, -0.72] as [number, number],
  fingers: [
    // punta, nudillo intermedio
    { tip: [4.24, 1.36], knuckle: [3.36, 1.32] },
    { tip: [3.62, -0.26], knuckle: [3.02, 0.42] },
    { tip: [3.0, -0.98], knuckle: [2.72, -0.24] },
    { tip: [2.18, -1.38], knuckle: [2.28, -0.72] },
  ] as { tip: [number, number]; knuckle: [number, number] }[],
};

const flat = (p: [number, number], z = 0) => v3(p[0], p[1], z);

/** Húmero: del hombro al codo. */
export function buildHumerus() {
  return taperedTube(
    [flat(WING.shoulder, 0.02), v3(0.6, 0.28, 0.05), flat(WING.elbow, 0.05)],
    (t) => 0.115 - t * 0.035,
    14,
    10,
    { uvRepeat: 2 },
  );
}

/** Antebrazo: dos huesos paralelos, como en cualquier ala real. */
export function buildForearm(offset: number) {
  return taperedTube(
    [
      flat(WING.elbow, 0.05 + offset),
      v3(1.86, 0.86, 0.05 + offset),
      flat(WING.wrist, 0.05 + offset),
    ],
    (t) => 0.052 - t * 0.014,
    14,
    9,
    { uvRepeat: 2 },
  );
}

/** Dedo: de la muñeca al nudillo y de ahí a la punta, adelgazando. */
export function buildFinger(i: number) {
  const f = WING.fingers[i];
  return taperedTube(
    [
      flat(WING.wrist, 0.05),
      v3(
        (WING.wrist[0] + f.knuckle[0]) / 2,
        (WING.wrist[1] + f.knuckle[1]) / 2,
        0.05,
      ),
      flat(f.knuckle, 0.045),
      v3((f.knuckle[0] + f.tip[0]) / 2, (f.knuckle[1] + f.tip[1]) / 2, 0.04),
      flat(f.tip, 0.03),
    ],
    (t) => 0.05 * Math.pow(1 - t, 0.62) + 0.006,
    26,
    9,
    { uvRepeat: 3 },
  );
}

/**
 * Membrana: borde de ataque tenso del hombro a la punta del primer dedo y
 * borde de fuga festoneado, hundido entre dedo y dedo por el propio peso.
 */
export function buildMembrane(): THREE.BufferGeometry {
  const [sx, sy] = WING.shoulder;
  const [wx, wy] = WING.wrist;
  const f = WING.fingers;

  const s = new THREE.Shape();
  s.moveTo(sx, sy);
  // Propatagio: la piel entre el hombro y la muñeca
  s.quadraticCurveTo(1.0, 0.98, wx, wy);
  s.quadraticCurveTo(3.3, 1.4, f[0].tip[0], f[0].tip[1]);
  // Festones: cada tramo cede hacia la muñeca
  s.quadraticCurveTo(3.42, 0.48, f[1].tip[0], f[1].tip[1]);
  s.quadraticCurveTo(2.94, -0.28, f[2].tip[0], f[2].tip[1]);
  s.quadraticCurveTo(2.3, -0.88, f[3].tip[0], f[3].tip[1]);
  s.quadraticCurveTo(1.1, -0.82, WING.hip[0], WING.hip[1]);
  s.quadraticCurveTo(0.02, -0.4, sx, sy);

  const geometry = new THREE.ExtrudeGeometry(s, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 1,
    curveSegments: 30,
  });

  // UV propias (las de ExtrudeGeometry vienen en unidades del plano) y comba:
  // una vela no es una cartulina, tiene panza.
  const position = geometry.attributes.position as THREE.BufferAttribute;
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const spanX = bb.max.x - bb.min.x || 1;
  const spanY = bb.max.y - bb.min.y || 1;
  const uv = new Float32Array(position.count * 2);

  for (let i = 0; i < position.count; i++) {
    const u = (position.getX(i) - bb.min.x) / spanX;
    const v = (position.getY(i) - bb.min.y) / spanY;
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
    const camber = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 0.26;
    position.setZ(i, position.getZ(i) - camber);
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/** Aleta / abanico: se usa en las mejillas y en la punta de la cola. */
export function buildFin(width: number, height: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(width * 0.5, height * 0.9, width, height * 0.62);
  s.quadraticCurveTo(width * 0.72, height * 0.2, width * 0.82, -height * 0.28);
  s.quadraticCurveTo(width * 0.45, height * 0.06, 0, 0);

  const geometry = new THREE.ExtrudeGeometry(s, {
    depth: 0.028,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 20,
  });

  const position = geometry.attributes.position as THREE.BufferAttribute;
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox!;
  const spanX = bb.max.x - bb.min.x || 1;
  const spanY = bb.max.y - bb.min.y || 1;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) - bb.min.x) / spanX;
    uv[i * 2 + 1] = (position.getY(i) - bb.min.y) / spanY;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/* ------------------------------------------------------------------ */
/* Pata trasera                                                        */
/* ------------------------------------------------------------------ */

export function buildThigh() {
  return taperedTube(
    [v3(0, 0.06, 0), v3(0.02, -0.16, -0.06), v3(0.06, -0.36, -0.14)],
    (t) => 0.19 - t * 0.07,
    16,
    12,
    { uvRepeat: 2 },
  );
}

export function buildShin() {
  return taperedTube(
    [v3(0, 0, 0), v3(0.03, -0.22, 0.06), v3(0.08, -0.44, 0.16)],
    (t) => 0.105 - t * 0.045,
    16,
    10,
    { uvRepeat: 2 },
  );
}

export function buildMetatarsus() {
  return taperedTube(
    [v3(0, 0, 0), v3(0, -0.1, 0.1), v3(0.01, -0.16, 0.22)],
    (t) => 0.075 - t * 0.02,
    12,
    10,
  );
}

/** Dedo del pie: dos falanges, ligeramente arqueadas. */
export function buildToe(length: number) {
  return taperedTube(
    [
      v3(0, 0, 0),
      v3(0, -0.02, length * 0.42),
      v3(0, -0.05, length * 0.78),
      v3(0, -0.09, length),
    ],
    (t) => 0.05 * (1 - t * 0.55),
    16,
    9,
  );
}

/* ------------------------------------------------------------------ */
/* Piel del cuerpo                                                     */
/* ------------------------------------------------------------------ */

export type BodySkin = {
  geometry: THREE.BufferGeometry;
  cols: number;
};

/**
 * Malla tubular del cuerpo, vacía: las posiciones se reescriben cada frame.
 * Lleva una columna de más (costura duplicada) para que la UV cierre sin
 * salto, y colores por vértice para pasar de lomo oscuro a panza clara.
 */
export function buildBodySkin(rings: number, radials: number): BodySkin {
  const cols = radials + 1;
  const count = rings * cols;
  const position = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const color = new Float32Array(count * 3);

  const back = new THREE.Color("#2c4f74");
  const flank = new THREE.Color("#4f7da2");
  const belly = new THREE.Color("#8a9a9c");
  const tail = new THREE.Color("#22405f");
  const mixed = new THREE.Color();

  for (let r = 0; r < rings; r++) {
    const f = r / (rings - 1);
    for (let a = 0; a <= radials; a++) {
      const ang = (a / radials) * Math.PI * 2;
      const up = Math.sin(ang); // +1 lomo, -1 panza
      const k = r * cols + a;

      if (up >= 0) {
        mixed.copy(flank).lerp(back, Math.pow(up, 0.7));
      } else {
        mixed.copy(flank).lerp(belly, Math.pow(-up, 1.5));
      }
      // La cola se apaga: menos luz, más lejos de la cámara
      mixed.lerp(tail, Math.pow(f, 1.6) * 0.55);

      color[k * 3] = mixed.r;
      color[k * 3 + 1] = mixed.g;
      color[k * 3 + 2] = mixed.b;

      uv[k * 2] = a / radials;
      uv[k * 2 + 1] = f;
    }
  }

  const index: number[] = [];
  for (let r = 0; r < rings - 1; r++) {
    for (let a = 0; a < radials; a++) {
      const i0 = r * cols + a;
      const i1 = i0 + 1;
      const i2 = i0 + cols;
      const i3 = i2 + 1;
      index.push(i0, i2, i1, i1, i2, i3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute("color", new THREE.BufferAttribute(color, 3));
  geometry.setIndex(index);
  return { geometry, cols };
}

/** Vela dorsal: cinta de tres filas (base, medio, borde) a lo largo del lomo. */
export function buildSail(rings: number) {
  const rows = 3;
  const count = rings * rows;
  const position = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);

  for (let r = 0; r < rings; r++) {
    for (let j = 0; j < rows; j++) {
      const k = r * rows + j;
      uv[k * 2] = j / (rows - 1);
      uv[k * 2 + 1] = (r / (rings - 1)) * 6;
    }
  }

  const index: number[] = [];
  for (let r = 0; r < rings - 1; r++) {
    for (let j = 0; j < rows - 1; j++) {
      const i0 = r * rows + j;
      const i1 = i0 + 1;
      const i2 = (r + 1) * rows + j;
      const i3 = i2 + 1;
      index.push(i0, i2, i1, i1, i2, i3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);
  return { geometry, rows };
}
