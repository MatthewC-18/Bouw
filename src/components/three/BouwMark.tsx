"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BRAND,
  CIRCUIT_RINGS,
  EXTRUDE_SETTINGS,
  RING_RADIUS,
  SPHERE_RADIUS,
  TRACE_RADIUS,
  bottomBowlShape,
  bottomStemShape,
  circuitCurves,
  spherePositions,
  topBowlShape,
  topStemShape,
} from "./logoShapes";

type Props = {
  /** Etapa continua del scroll: 0 hero … 4 contacto */
  stageRef: RefObject<number>;
  /** Posición del mouse normalizada a -1..1 */
  pointerRef: RefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
};

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * La "B" de BOUW sólida, construida pieza por pieza.
 *
 * Solo es visible en los extremos del recorrido: entera en el hero, y otra vez
 * al llegar a contacto. En medio cede el turno a las piezas sueltas
 * (`AssemblyField`), de modo que la marca parece desarmarse y rearmarse.
 */
export default function BouwMark({
  stageRef,
  pointerRef,
  reducedMotion,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const topArrow = useRef<THREE.Group>(null);
  const bottomArrow = useRef<THREE.Group>(null);
  const tealMat = useRef<THREE.MeshStandardMaterial>(null);
  const orangeMat = useRef<THREE.MeshStandardMaterial>(null);
  const traceMat = useRef<THREE.MeshStandardMaterial>(null);

  const geo = useMemo(() => {
    // No centramos cada pieza: las coordenadas del logo ya son absolutas
    // y el grupo interior aplica el offset de centrado una sola vez.
    const build = (shape: THREE.Shape) =>
      new THREE.ExtrudeGeometry(shape, EXTRUDE_SETTINGS);

    return {
      topStem: build(topStemShape()),
      bottomStem: build(bottomStemShape()),
      topBowl: build(topBowlShape()),
      bottomBowl: build(bottomBowlShape()),
      ring: new THREE.TorusGeometry(RING_RADIUS, TRACE_RADIUS, 16, 48),
      traces: circuitCurves().map(
        (c) => new THREE.TubeGeometry(c, 48, TRACE_RADIUS, 12, false),
      ),
      sphere: new THREE.SphereGeometry(SPHERE_RADIUS, 48, 48),
    };
  }, []);

  const spheres = useMemo(() => spherePositions(), []);
  const targetRot = useRef(new THREE.Vector2());

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), 4);

    // Presencia de la marca sólida: entera al inicio, y de vuelta al final.
    const entering = 1 - smoothstep(0.06, 0.5, stage);
    const returning = smoothstep(3.45, 3.9, stage);
    const presence = Math.max(entering, returning);

    const g = group.current;
    if (!g) return;

    if (presence < 0.002) {
      g.visible = false;
      return;
    }
    g.visible = true;

    // Opacidad y escala acompañan a la presencia: se disgrega, no se encoge.
    g.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat && "opacity" in mat) {
        mat.transparent = true;
        mat.opacity = presence;
        mat.depthWrite = presence > 0.9;
      }
    });

    const px = reducedMotion ? 0 : (pointerRef.current?.x ?? 0);
    const py = reducedMotion ? 0 : (pointerRef.current?.y ?? 0);
    targetRot.current.x += (-py * 0.32 - targetRot.current.x) * d * 4;
    targetRot.current.y += (px * 0.55 - targetRot.current.y) * d * 4;

    const idle = reducedMotion ? 0 : Math.sin(t * 0.45) * 0.09;
    // Al volver, la marca llega de frente y quieta: cierre limpio.
    const settle = returning;

    g.rotation.x = targetRot.current.x * (1 - settle * 0.6);
    g.rotation.y =
      targetRot.current.y * (1 - settle * 0.6) + idle * (1 - settle);
    g.position.y = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.12;
    g.scale.setScalar(0.86 + presence * 0.14);

    if (!reducedMotion) {
      // Ciclo de las flechas: entra y sale, desfasadas medio periodo.
      const cycle = (phase: number) => {
        const raw = (Math.sin(t * 0.9 + phase) + 1) / 2;
        return Math.pow(raw, 2) * 0.26;
      };
      if (topArrow.current) topArrow.current.position.x = cycle(0);
      if (bottomArrow.current) bottomArrow.current.position.x = -cycle(Math.PI);

      if (tealMat.current)
        tealMat.current.emissiveIntensity = 1.1 + Math.sin(t * 1.6) * 0.55;
      if (orangeMat.current)
        orangeMat.current.emissiveIntensity =
          1.1 + Math.sin(t * 1.6 + Math.PI) * 0.55;
      if (traceMat.current)
        traceMat.current.emissiveIntensity = 0.7 + Math.sin(t * 2.2) * 0.4;
    }

    if (inner.current) {
      inner.current.rotation.z = reducedMotion ? 0 : Math.sin(t * 0.3) * 0.02;
    }
  });

  return (
    <group ref={group} dispose={null}>
      <group ref={inner} position={[-0.1, 0, -0.21]}>
        <group ref={topArrow}>
          <mesh geometry={geo.topStem}>
            <meshStandardMaterial
              color={BRAND.navy}
              metalness={0.92}
              roughness={0.24}
            />
          </mesh>
        </group>

        <group ref={bottomArrow}>
          <mesh geometry={geo.bottomStem}>
            <meshStandardMaterial
              color={BRAND.navyDeep}
              metalness={0.92}
              roughness={0.24}
            />
          </mesh>
        </group>

        <mesh geometry={geo.topBowl}>
          <meshStandardMaterial
            color={BRAND.cyan}
            metalness={0.55}
            roughness={0.22}
            emissive={BRAND.cyan}
            emissiveIntensity={0.18}
          />
        </mesh>

        <mesh geometry={geo.bottomBowl}>
          <meshStandardMaterial
            color={BRAND.orange}
            metalness={0.55}
            roughness={0.22}
            emissive={BRAND.orange}
            emissiveIntensity={0.18}
          />
        </mesh>

        <group position={[0, 0, 0.21]}>
          {CIRCUIT_RINGS.map((r, i) => (
            <mesh key={`ring-${i}`} geometry={geo.ring} position={r.position}>
              <meshStandardMaterial
                color={BRAND.teal}
                metalness={0.8}
                roughness={0.2}
                emissive={BRAND.cyanLight}
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}

          {geo.traces.map((g, i) => (
            <mesh key={`trace-${i}`} geometry={g}>
              <meshStandardMaterial
                ref={i === 0 ? traceMat : undefined}
                color={BRAND.teal}
                metalness={0.8}
                roughness={0.2}
                emissive={BRAND.cyanLight}
                emissiveIntensity={0.6}
              />
            </mesh>
          ))}
        </group>

        {spheres.map((s) => (
          <mesh key={s.key} geometry={geo.sphere} position={s.position}>
            <meshStandardMaterial
              ref={s.key === "teal" ? tealMat : orangeMat}
              color={s.key === "teal" ? BRAND.teal : BRAND.orange}
              metalness={0.35}
              roughness={0.1}
              emissive={s.key === "teal" ? BRAND.cyanLight : BRAND.orangeLight}
              emissiveIntensity={1.1}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
