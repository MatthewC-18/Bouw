import * as THREE from "three";

/**
 * Geometría procedural de la marca BOUW.
 *
 * La "B" del logo se reconstruye con THREE.Shape en lugar de importar un SVG,
 * para poder extruirla, biselarla y animarla pieza por pieza.
 *
 * Sistema de coordenadas: origen en el centro óptico de la letra,
 * alto total ≈ 6 unidades, ancho total ≈ 4 unidades.
 */

const ARC_CENTER_X = 0.2;
const ARC_OUTER = 1.5;
const ARC_INNER = 0.95;
const TOP_ARC_CY = 1.15;
const BOTTOM_ARC_CY = -1.15;
const HALF_PI = Math.PI / 2;

/** Bloque superior azul + flecha que sale hacia la derecha. */
export function topStemShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-1.8, 2.5);
  s.lineTo(0.5, 2.5);
  s.lineTo(0.5, 2.86);
  s.lineTo(1.22, 2.125);
  s.lineTo(0.5, 1.39);
  s.lineTo(0.5, 1.75);
  s.lineTo(-0.9, 1.75);
  s.lineTo(-0.9, 0.25);
  s.lineTo(-1.8, 0.25);
  s.closePath();
  return s;
}

/** Bloque inferior azul en forma de L. */
export function bottomStemShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-1.8, -0.25);
  s.lineTo(-0.9, -0.25);
  s.lineTo(-0.9, -1.75);
  s.lineTo(0.2, -1.75);
  s.lineTo(0.2, -2.5);
  s.lineTo(-1.8, -2.5);
  s.closePath();
  return s;
}

/** Panza superior (cian): media luna derecha. */
export function topBowlShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(ARC_CENTER_X, TOP_ARC_CY, ARC_OUTER, HALF_PI, -HALF_PI, true);
  s.absarc(ARC_CENTER_X, TOP_ARC_CY, ARC_INNER, -HALF_PI, HALF_PI, false);
  s.closePath();
  return s;
}

/** Panza inferior (naranja): media luna derecha que termina en flecha hacia la izquierda. */
export function bottomBowlShape(): THREE.Shape {
  const s = new THREE.Shape();
  const outerBottomY = BOTTOM_ARC_CY - ARC_OUTER; // -2.65
  const innerBottomY = BOTTOM_ARC_CY - ARC_INNER; // -2.10
  const midY = (outerBottomY + innerBottomY) / 2; // -2.375

  s.absarc(ARC_CENTER_X, BOTTOM_ARC_CY, ARC_OUTER, HALF_PI, -HALF_PI, true);
  // Tramo recto hacia la izquierda + punta de flecha
  s.lineTo(-0.5, outerBottomY);
  s.lineTo(-0.5, outerBottomY - 0.32);
  s.lineTo(-1.28, midY);
  s.lineTo(-0.5, innerBottomY + 0.32);
  s.lineTo(-0.5, innerBottomY);
  s.lineTo(ARC_CENTER_X, innerBottomY);
  s.absarc(ARC_CENTER_X, BOTTOM_ARC_CY, ARC_INNER, -HALF_PI, HALF_PI, false);
  s.closePath();
  return s;
}

/** Anillos del circuito (posición en el plano XY). */
export const CIRCUIT_RINGS: { position: [number, number, number] }[] = [
  { position: [-0.35, 0.95, 0] },
  { position: [0.1, -0.85, 0] },
];

export const RING_RADIUS = 0.24;
export const TRACE_RADIUS = 0.085;

/** Trazos del circuito, como curvas suaves para TubeGeometry. */
export function circuitCurves(): THREE.CatmullRomCurve3[] {
  const v = (x: number, y: number) => new THREE.Vector3(x, y, 0);

  // Conector desde el asta hasta el anillo superior
  const stubTop = new THREE.CatmullRomCurve3([
    v(-0.9, 0.95),
    v(-0.75, 0.95),
    v(-0.59, 0.95),
  ]);

  // "S" que une los dos anillos
  const link = new THREE.CatmullRomCurve3([
    v(-0.11, 0.95),
    v(0.16, 0.78),
    v(0.2, 0.3),
    v(0.06, -0.2),
    v(0.1, -0.61),
  ]);

  // Conector desde el anillo inferior hacia el asta
  const stubBottom = new THREE.CatmullRomCurve3([
    v(-0.14, -0.85),
    v(-0.5, -0.85),
    v(-0.9, -0.85),
  ]);

  return [stubTop, link, stubBottom];
}

/** Esferas del logo: teal arriba, naranja abajo. */
export function spherePositions(): {
  key: "teal" | "orange";
  position: [number, number, number];
}[] {
  const rMid = (ARC_OUTER + ARC_INNER) / 2;
  const angle = THREE.MathUtils.degToRad(25);
  const dx = Math.cos(angle) * rMid;
  const dy = Math.sin(angle) * rMid;
  return [
    { key: "teal", position: [ARC_CENTER_X + dx, TOP_ARC_CY + dy, 0.16] },
    { key: "orange", position: [ARC_CENTER_X + dx, BOTTOM_ARC_CY + dy, 0.16] },
  ];
}

export const SPHERE_RADIUS = 0.44;

/** Ajustes de extrusión compartidos por todas las piezas planas. */
export const EXTRUDE_SETTINGS: THREE.ExtrudeGeometryOptions = {
  depth: 0.42,
  bevelEnabled: true,
  bevelThickness: 0.05,
  bevelSize: 0.05,
  bevelOffset: 0,
  bevelSegments: 4,
  curveSegments: 48,
};

export const BRAND = {
  navy: "#123a63",
  navyDeep: "#0d2947",
  cyan: "#22b5cf",
  cyanLight: "#4fd6e8",
  orange: "#e87722",
  orangeLight: "#f79b4a",
  teal: "#12a6b4",
} as const;
