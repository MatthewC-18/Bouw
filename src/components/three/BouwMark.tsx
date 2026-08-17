"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAST_STAGE } from "./layouts";
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
  /** Etapa continua del scroll: 0 hero … 8 contacto */
  stageRef: RefObject<number>;
  /** Posición del mouse normalizada a -1..1 */
  pointerRef: RefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
};

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/** Salida suave: entra rápido y frena, como una pieza que encaja. */
function easeOutQuint(x: number) {
  return 1 - Math.pow(1 - x, 5);
}

/**
 * Cada pieza de la marca entra desde su propia dirección.
 * El desfase hace que se monten una tras otra, no todas de golpe.
 */
const PIECE_ENTRY: { offset: [number, number, number]; delay: number }[] = [
  { offset: [-4.5, 1.2, -2], delay: 0 }, // asta superior
  { offset: [-4.5, -1.2, -2], delay: 0.08 }, // asta inferior
  { offset: [3.5, 3.2, 2.5], delay: 0.18 }, // panza superior
  { offset: [3.5, -3.2, 2.5], delay: 0.26 }, // panza inferior
];

const PULSE_COUNT = 3;

/**
 * La "B" de BOUW sólida.
 *
 * Se monta pieza por pieza al entrar, respira con el mouse, y por sus trazos
 * corren pulsos de luz. Solo aparece en los extremos del recorrido: entera en
 * el hero y otra vez al llegar a contacto. En medio cede el turno a las piezas
 * sueltas (`AssemblyField`).
 */
export default function BouwMark({
  stageRef,
  pointerRef,
  reducedMotion,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const pieces = useRef<(THREE.Group | null)[]>([]);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const tealMat = useRef<THREE.MeshStandardMaterial>(null);
  const orangeMat = useRef<THREE.MeshStandardMaterial>(null);
  const traceMat = useRef<THREE.MeshStandardMaterial>(null);

  const curves = useMemo(() => circuitCurves(), []);

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
      traces: curves.map(
        (c) => new THREE.TubeGeometry(c, 48, TRACE_RADIUS, 12, false),
      ),
      sphere: new THREE.SphereGeometry(SPHERE_RADIUS, 48, 48),
      pulse: new THREE.SphereGeometry(TRACE_RADIUS * 2.1, 16, 16),
    };
  }, [curves]);

  const spheres = useMemo(() => spherePositions(), []);
  const targetRot = useRef(new THREE.Vector2());
  const intro = useRef(0);
  const pulsePoint = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    // Presencia de la marca sólida: entera al inicio, y de vuelta al final.
    const entering = 1 - smoothstep(0.08, 0.55, stage);
    const returning = smoothstep(LAST_STAGE - 0.55, LAST_STAGE - 0.08, stage);
    const presence = Math.max(entering, returning);

    const g = group.current;
    if (!g) return;

    if (presence < 0.002) {
      g.visible = false;
      return;
    }
    g.visible = true;

    // Montaje inicial: avanza una sola vez, la primera vez que se ve.
    if (intro.current < 1) {
      intro.current = Math.min(intro.current + d / 1.5, 1);
    }
    const assembled = reducedMotion ? 1 : intro.current;

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

    // Cada pieza llega desde su dirección y encaja
    PIECE_ENTRY.forEach((entry, i) => {
      const piece = pieces.current[i];
      if (!piece) return;
      const local = Math.min(
        Math.max((assembled - entry.delay) / (1 - entry.delay), 0),
        1,
      );
      const e = easeOutQuint(local);
      const away = 1 - e;

      // Las astas además laten con el ciclo de las flechas una vez montadas
      const cycle =
        reducedMotion || i > 1
          ? 0
          : Math.pow((Math.sin(t * 0.9 + i * Math.PI) + 1) / 2, 2) * 0.26;
      const dir = i === 1 ? -1 : 1;

      piece.position.set(
        entry.offset[0] * away + cycle * dir,
        entry.offset[1] * away,
        entry.offset[2] * away,
      );
      piece.rotation.z = away * (i % 2 === 0 ? 0.5 : -0.5);
      piece.scale.setScalar(0.85 + e * 0.15);
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
      targetRot.current.y * (1 - settle * 0.6) +
      idle * (1 - settle) +
      (1 - assembled) * 0.6;
    g.position.y = reducedMotion ? 0 : Math.sin(t * 0.7) * 0.12;
    g.scale.setScalar(0.86 + presence * 0.14);

    // Pulsos recorriendo los trazos del circuito
    if (!reducedMotion) {
      for (let i = 0; i < pulses.current.length; i++) {
        const mesh = pulses.current[i];
        if (!mesh) continue;
        const curve = curves[i % curves.length];
        const lap = Math.floor(i / curves.length);
        const u = (t * 0.28 + lap * 0.45 + i * 0.11) % 1;
        curve.getPointAt(u, pulsePoint.current);
        mesh.position.copy(pulsePoint.current);
        // Se apaga en los extremos del trazo: parece entrar y salir
        const fade = Math.sin(u * Math.PI);
        mesh.scale.setScalar((0.5 + fade) * assembled);
      }

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
        {/* Asta superior */}
        <group
          ref={(el) => {
            pieces.current[0] = el;
          }}
        >
          <mesh geometry={geo.topStem}>
            <meshStandardMaterial
              color={BRAND.navy}
              metalness={0.94}
              roughness={0.22}
              envMapIntensity={1.6}
            />
          </mesh>
        </group>

        {/* Asta inferior */}
        <group
          ref={(el) => {
            pieces.current[1] = el;
          }}
        >
          <mesh geometry={geo.bottomStem}>
            <meshStandardMaterial
              color={BRAND.navyDeep}
              metalness={0.94}
              roughness={0.22}
              envMapIntensity={1.6}
            />
          </mesh>
        </group>

        {/* Panza superior: laca sobre color, como pieza inyectada */}
        <group
          ref={(el) => {
            pieces.current[2] = el;
          }}
        >
          <mesh geometry={geo.topBowl}>
            <meshPhysicalMaterial
              color={BRAND.cyan}
              metalness={0.45}
              roughness={0.24}
              clearcoat={1}
              clearcoatRoughness={0.12}
              emissive={BRAND.cyan}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>

        {/* Panza inferior */}
        <group
          ref={(el) => {
            pieces.current[3] = el;
          }}
        >
          <mesh geometry={geo.bottomBowl}>
            <meshPhysicalMaterial
              color={BRAND.orange}
              metalness={0.45}
              roughness={0.24}
              clearcoat={1}
              clearcoatRoughness={0.12}
              emissive={BRAND.orange}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>

        {/* Circuito: anillos, trazos y pulsos */}
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

          {/* Señal viajando por el circuito */}
          {Array.from({ length: PULSE_COUNT * curves.length }, (_, i) => (
            <mesh
              key={`pulse-${i}`}
              geometry={geo.pulse}
              ref={(el) => {
                pulses.current[i] = el;
              }}
            >
              <meshBasicMaterial
                color={i % 2 === 0 ? BRAND.cyanLight : BRAND.orangeLight}
                toneMapped={false}
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
