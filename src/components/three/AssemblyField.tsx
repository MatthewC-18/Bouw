"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildAssembly } from "./layouts";
import { BRAND } from "./logoShapes";

const PIECE_COLORS = [
  new THREE.Color(BRAND.navy),
  new THREE.Color(BRAND.navyDeep),
  new THREE.Color(BRAND.cyan),
  new THREE.Color(BRAND.orange),
];

type Props = {
  /** Etapa continua del scroll: 0 hero … 4 contacto */
  stageRef: RefObject<number>;
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
 * en el hero forman la B, luego se desarman y vuelven a armarse al final.
 */
export default function AssemblyField({
  stageRef,
  count,
  reducedMotion,
}: Props) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => buildAssembly(count), [count]);

  // Posición actual de cada pieza: se persigue al objetivo, no se salta.
  const current = useMemo(() => new Float32Array(data.layouts[0]), [data]);

  const geometry = useMemo(
    () => new THREE.BoxGeometry(1, 1, 1).toNonIndexed(),
    [],
  );

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
    if (!m) return;

    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), 4);

    // Layout objetivo interpolado
    const i0 = Math.min(Math.floor(stage), data.layouts.length - 1);
    const i1 = Math.min(i0 + 1, data.layouts.length - 1);
    const f = smoothstep(0, 1, stage - i0);
    const from = data.layouts[i0];
    const to = data.layouts[i1];

    // Las piezas solo se ven cuando la B sólida no está: son complementarias.
    const shown =
      Math.max(
        smoothstep(0.06, 0.5, stage),
        0,
      ) * (1 - smoothstep(3.45, 3.9, stage));

    if (shown < 0.001) {
      m.visible = false;
      return;
    }
    m.visible = true;

    // Qué tan "desarmado" está: 0 en la B, 1 en pleno vuelo
    const exploded = Math.min(stage < 2 ? stage : 4 - stage, 1);
    const chase = 1 - Math.pow(0.0015, d); // suavizado independiente de fps

    for (let i = 0; i < count; i++) {
      const k = i * 3;
      const tx = from[k] + (to[k] - from[k]) * f;
      const ty = from[k + 1] + (to[k + 1] - from[k + 1]) * f;
      const tz = from[k + 2] + (to[k + 2] - from[k + 2]) * f;

      // Deriva orgánica para que nunca se vea congelado
      const drift = reducedMotion ? 0 : 0.28 * exploded;
      const px = tx + Math.sin(t * 0.6 + data.phases[i]) * drift;
      const py = ty + Math.cos(t * 0.5 + data.phases[i] * 1.7) * drift;
      const pz = tz + Math.sin(t * 0.42 + data.phases[i] * 0.6) * drift;

      current[k] += (px - current[k]) * chase;
      current[k + 1] += (py - current[k + 1]) * chase;
      current[k + 2] += (pz - current[k + 2]) * chase;

      axisVec.set(data.axes[k], data.axes[k + 1], data.axes[k + 2]);
      const spin = reducedMotion
        ? data.phases[i]
        : data.phases[i] + t * 0.35 * exploded;
      quat.setFromAxisAngle(axisVec, spin * exploded);

      dummy.position.set(current[k], current[k + 1], current[k + 2]);
      dummy.quaternion.copy(quat);
      dummy.scale.setScalar(data.scales[i] * shown);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }

    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, undefined, count]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        metalness={0.85}
        roughness={0.22}
        envMapIntensity={1.4}
      />
    </instancedMesh>
  );
}
