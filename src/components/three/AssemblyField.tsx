"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAST_STAGE, buildAssembly } from "./layouts";
import { BRAND } from "./logoShapes";

const PIECE_COLORS = [
  new THREE.Color(BRAND.navy),
  new THREE.Color(BRAND.navyDeep),
  new THREE.Color(BRAND.cyan),
  new THREE.Color(BRAND.orange),
];

type Props = {
  /** Etapa continua del scroll: 0 hero … 5 contacto */
  stageRef: RefObject<number>;
  pointerRef: RefObject<{ x: number; y: number }>;
  count: number;
  reducedMotion: boolean;
};

const dummy = new THREE.Object3D();
const quat = new THREE.Quaternion();
const axisVec = new THREE.Vector3();

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Las piezas de la marca. Se interpolan entre layouts según el scroll:
 * en el hero forman la B, luego se desarman, pasan por columnas, engranaje,
 * cadena y dos núcleos, y al final vuelven a armar la B.
 */
export default function AssemblyField({
  stageRef,
  pointerRef,
  count,
  reducedMotion,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => buildAssembly(count), [count]);

  // Posición actual de cada pieza: se persigue al objetivo, no se salta.
  const current = useMemo(() => new Float32Array(data.layouts[0]), [data]);

  const geometry = useMemo(() => {
    // Cubo con las aristas apenas marcadas: atrapa mejor la luz que uno plano.
    const g = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
    return g;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < count; i++) {
      m.setColorAt(i, PIECE_COLORS[data.colorIds[i]]);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count, data]);

  useFrame((state, delta) => {
    const m = mesh.current;
    const g = group.current;
    if (!m || !g) return;

    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    // Las piezas solo se ven cuando la B sólida no está: son complementarias.
    // En el tramo medio bajan de tamaño: ahí son fondo, y la única silueta
    // con lectura tiene que ser el dragón.
    const visible =
      smoothstep(0.08, 0.55, stage) *
      (1 - smoothstep(LAST_STAGE - 0.55, LAST_STAGE - 0.08, stage));
    const atEdge = Math.min(Math.min(stage, LAST_STAGE - stage), 1);
    const shown = visible * (1 - atEdge * 0.45);

    if (shown < 0.002) {
      m.visible = false;
      return;
    }
    m.visible = true;

    // Parallax del conjunto: barato, y hace que responda al mouse sin
    // recalcular una sola matriz de más.
    if (!reducedMotion) {
      const px = pointerRef.current?.x ?? 0;
      const py = pointerRef.current?.y ?? 0;
      g.rotation.y += (px * 0.16 - g.rotation.y) * d * 2.5;
      g.rotation.x += (-py * 0.1 - g.rotation.x) * d * 2.5;
    }

    // Layout objetivo interpolado
    const i0 = Math.min(Math.floor(stage), data.layouts.length - 1);
    const i1 = Math.min(i0 + 1, data.layouts.length - 1);
    const f = smoothstep(0, 1, stage - i0);
    const from = data.layouts[i0];
    const to = data.layouts[i1];

    // Qué tan "en vuelo" están: máximo a mitad de cada transición.
    const inFlight = Math.sin(Math.min(Math.max(stage - i0, 0), 1) * Math.PI);
    const settled = 1 - inFlight;
    const chase = 1 - Math.pow(0.0015, d); // suavizado independiente de fps

    for (let i = 0; i < count; i++) {
      const k = i * 3;
      const tx = from[k] + (to[k] - from[k]) * f;
      const ty = from[k + 1] + (to[k + 1] - from[k + 1]) * f;
      const tz = from[k + 2] + (to[k + 2] - from[k + 2]) * f;

      // Al cruzar entre layouts las piezas se abren hacia fuera: se nota que
      // se desarman en lugar de deslizarse en línea recta.
      const bulge = inFlight * 1.9;
      const ph = data.phases[i];
      const drift = reducedMotion ? 0 : 0.22 + inFlight * 0.5;

      const px = tx + Math.sin(t * 0.6 + ph) * drift + Math.cos(ph) * bulge;
      const py =
        ty + Math.cos(t * 0.5 + ph * 1.7) * drift + Math.sin(ph * 1.3) * bulge;
      const pz =
        tz + Math.sin(t * 0.42 + ph * 0.6) * drift + Math.sin(ph) * bulge * 0.6;

      current[k] += (px - current[k]) * chase;
      current[k + 1] += (py - current[k + 1]) * chase;
      current[k + 2] += (pz - current[k + 2]) * chase;

      axisVec.set(data.axes[k], data.axes[k + 1], data.axes[k + 2]);
      const spin = reducedMotion ? ph : ph + t * (0.25 + inFlight * 1.1);
      quat.setFromAxisAngle(axisVec, spin);

      dummy.position.set(current[k], current[k + 1], current[k + 2]);
      dummy.quaternion.copy(quat);
      // Al asentarse las piezas crecen un poco: el layout "cuaja".
      dummy.scale.setScalar(data.scales[i] * shown * (0.82 + settled * 0.28));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }

    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[geometry, undefined, count]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          metalness={0.9}
          roughness={0.18}
          envMapIntensity={2.2}
          emissive={BRAND.cyan}
          emissiveIntensity={0.14}
        />
      </instancedMesh>
    </group>
  );
}
