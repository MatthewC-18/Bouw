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
  /** 0 = arriba del todo, 1 = hero fuera de pantalla */
  scrollRef: RefObject<number>;
  /** Posición del mouse normalizada a -1..1 */
  pointerRef: RefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
};

/**
 * La "B" de BOUW en 3D, construida pieza por pieza.
 *
 * - Las dos flechas (azul arriba, naranja abajo) se desplazan en bucle:
 *   es el ciclo de mejora continua que representa la marca.
 * - El circuito y las esferas pulsan con emisión desfasada.
 * - Todo el grupo sigue al mouse con inercia y se inclina al hacer scroll.
 */
export default function BouwMark({
  scrollRef,
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

  /* --------------------------- geometrías --------------------------- */

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

  /* ---------------------------- animación --------------------------- */

  const targetRot = useRef(new THREE.Vector2());

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const scroll = scrollRef.current ?? 0;

    if (group.current) {
      // Seguimiento del mouse con inercia
      const px = reducedMotion ? 0 : (pointerRef.current?.x ?? 0);
      const py = reducedMotion ? 0 : (pointerRef.current?.y ?? 0);
      targetRot.current.x += (-py * 0.34 - targetRot.current.x) * d * 4;
      targetRot.current.y += (px * 0.6 - targetRot.current.y) * d * 4;

      const idle = reducedMotion ? 0 : Math.sin(t * 0.45) * 0.09;

      group.current.rotation.x = targetRot.current.x + scroll * 0.5;
      group.current.rotation.y = targetRot.current.y + idle + scroll * 1.1;
      group.current.position.y =
        (reducedMotion ? 0 : Math.sin(t * 0.7) * 0.12) - scroll * 2.2;

      const s = 1 - scroll * 0.35;
      group.current.scale.setScalar(Math.max(s, 0.5));
    }

    if (!reducedMotion) {
      // Ciclo de las flechas: entra y sale, desfasadas medio periodo.
      const cycle = (phase: number) => {
        const raw = (Math.sin(t * 0.9 + phase) + 1) / 2; // 0..1
        return Math.pow(raw, 2) * 0.26;
      };
      if (topArrow.current) topArrow.current.position.x = cycle(0);
      if (bottomArrow.current) bottomArrow.current.position.x = -cycle(Math.PI);

      // Pulso de emisión
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

  /* ------------------------------ render ---------------------------- */

  return (
    <group ref={group} dispose={null}>
      <group ref={inner} position={[-0.1, 0, -0.21]}>
        {/* Astas azules con sus flechas */}
        <group ref={topArrow}>
          <mesh geometry={geo.topStem} castShadow receiveShadow>
            <meshStandardMaterial
              color={BRAND.navy}
              metalness={0.92}
              roughness={0.24}
            />
          </mesh>
        </group>

        <group ref={bottomArrow}>
          <mesh geometry={geo.bottomStem} castShadow receiveShadow>
            <meshStandardMaterial
              color={BRAND.navyDeep}
              metalness={0.92}
              roughness={0.24}
            />
          </mesh>
        </group>

        {/* Panzas de la B */}
        <mesh geometry={geo.topBowl} castShadow receiveShadow>
          <meshStandardMaterial
            color={BRAND.cyan}
            metalness={0.55}
            roughness={0.22}
            emissive={BRAND.cyan}
            emissiveIntensity={0.18}
          />
        </mesh>

        <mesh geometry={geo.bottomBowl} castShadow receiveShadow>
          <meshStandardMaterial
            color={BRAND.orange}
            metalness={0.55}
            roughness={0.22}
            emissive={BRAND.orange}
            emissiveIntensity={0.18}
          />
        </mesh>

        {/* Circuito: anillos + trazos */}
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

        {/* Esferas */}
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
