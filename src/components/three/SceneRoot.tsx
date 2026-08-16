"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import AssemblyField from "./AssemblyField";
import BouwMark from "./BouwMark";
import { BRAND } from "./logoShapes";

/** Secciones que marcan cada etapa del ensamblaje, en orden. */
const STAGE_SECTIONS = [
  "top",
  "proyectos",
  "servicios",
  "nosotros",
  "contacto",
] as const;

/* ------------------------------------------------------------------ */
/* Cámara: se aleja cuando la marca se desarma                         */
/* ------------------------------------------------------------------ */

function StageCamera({ stageRef }: { stageRef: React.RefObject<number> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 11));

  useFrame((_, delta) => {
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), 4);
    // Hero y contacto: cerca. En medio: atrás, para dejar respirar al texto.
    const middle = Math.min(stage, 4 - stage);
    const z = 11 + Math.min(middle, 1) * 5.5;
    const x = stage > 0.5 && stage < 3.5 ? 1.6 : 0;

    target.current.set(x, 0, z);
    camera.position.lerp(target.current, 1 - Math.pow(0.02, Math.min(delta, 0.05)));
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/* Partículas de fondo                                                 */
/* ------------------------------------------------------------------ */

function ParticleField({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 9 + Math.random() * 12;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.5 - 6;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.018;
    points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.08) * 0.05;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.05}
        color={BRAND.cyanLight}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Raíz de la escena                                                   */
/* ------------------------------------------------------------------ */

export default function SceneRoot() {
  const stageRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [small, setSmall] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      setReducedMotion(motion.matches);
      setSmall(width.matches);
    };
    apply();
    motion.addEventListener("change", apply);
    width.addEventListener("change", apply);
    return () => {
      motion.removeEventListener("change", apply);
      width.removeEventListener("change", apply);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  /**
   * Etapa continua: se mide contra el centro de cada sección, no contra el
   * alto total, para que el ensamblaje quede sincronizado con el contenido
   * aunque una sección crezca.
   */
  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      const marks: number[] = [];
      for (const id of STAGE_SECTIONS) {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        marks.push(r.top + window.scrollY + r.height / 2);
      }

      const y = window.scrollY + window.innerHeight / 2;
      if (y <= marks[0]) {
        stageRef.current = 0;
        return;
      }
      if (y >= marks[marks.length - 1]) {
        stageRef.current = marks.length - 1;
        return;
      }
      for (let i = 0; i < marks.length - 1; i++) {
        if (y >= marks[i] && y < marks[i + 1]) {
          stageRef.current = i + (y - marks[i]) / (marks[i + 1] - marks[i]);
          return;
        }
      }
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  const pieceCount = small ? 130 : 320;

  return (
    <Canvas
      dpr={[1, small ? 1.5 : 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 11], fov: 38 }}
      style={{ pointerEvents: "none" }}
    >
      <fog attach="fog" args={["#04101f", 16, 38]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 6]} intensity={2.1} color="#dff3ff" />
      <directionalLight
        position={[-7, -3, 4]}
        intensity={1.1}
        color={BRAND.orange}
      />
      <pointLight
        position={[4, 2, 5]}
        intensity={35}
        color={BRAND.cyanLight}
        distance={22}
      />
      <pointLight
        position={[-4, -3, 4]}
        intensity={22}
        color={BRAND.orangeLight}
        distance={22}
      />

      <StageCamera stageRef={stageRef} />
      <BouwMark
        stageRef={stageRef}
        pointerRef={pointerRef}
        reducedMotion={reducedMotion}
      />
      <AssemblyField
        stageRef={stageRef}
        count={pieceCount}
        reducedMotion={reducedMotion}
      />
      <ParticleField count={small ? 140 : 340} />

      {/* Estudio de luz propio: sin descargar HDRIs externos */}
      <Environment resolution={256}>
        <Lightformer
          intensity={2.4}
          position={[0, 4, -6]}
          scale={[12, 4, 1]}
          color="#bfe7ff"
        />
        <Lightformer
          intensity={1.6}
          position={[-6, 0, 2]}
          scale={[3, 8, 1]}
          color={BRAND.cyanLight}
        />
        <Lightformer
          intensity={1.4}
          position={[6, -2, 2]}
          scale={[3, 8, 1]}
          color={BRAND.orangeLight}
        />
        <Lightformer
          intensity={0.8}
          position={[0, -5, 3]}
          scale={[10, 3, 1]}
          color="#5d7ea8"
        />
      </Environment>

      {!small && (
        <EffectComposer enableNormalPass={false}>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.3}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
