"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import AssemblyField from "./AssemblyField";
import BouwMark from "./BouwMark";
import { LAST_STAGE } from "./layouts";
import { BRAND } from "./logoShapes";

/** Secciones que marcan cada etapa del ensamblaje, en orden. */
const STAGE_SECTIONS = [
  "top",
  "proyectos",
  "servicios",
  "proceso",
  "nosotros",
  "contacto",
] as const;

/**
 * Fracción de cada sección que se considera "reposo".
 * El morph ocurre fuera de esa zona, que es justo donde están las bandas
 * libres: así el ensamblaje se ve completo y no detrás de una tarjeta.
 */
const REST_MARGIN = 0.3;

/* ------------------------------------------------------------------ */
/* Cámara                                                              */
/* ------------------------------------------------------------------ */

function StageCamera({ stageRef }: { stageRef: RefObject<number> }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(-2.4, 0, 10.5));

  useFrame((_, delta) => {
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    // Cerca en los extremos (la B manda), un poco atrás en el medio para que
    // quepan los layouts anchos. Nunca tan atrás que las piezas se vuelvan polvo.
    const edge = Math.min(stage, LAST_STAGE - stage);
    const z = 10.5 + Math.min(edge, 1) * 3.2;

    // En el hero la cámara se corre a la izquierda para que la B quede a la
    // derecha del titular; en contacto vuelve al centro.
    const heroOffset = 1 - Math.min(stage, 1);
    const x = -2.4 * heroOffset;

    target.current.set(x, 0, z);
    camera.position.lerp(
      target.current,
      1 - Math.pow(0.015, Math.min(delta, 0.05)),
    );
    camera.lookAt(x * 0.55, 0, 0);
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
      const r = 10 + Math.random() * 13;
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
        opacity={0.4}
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
   * Etapa continua del recorrido.
   *
   * Cada sección tiene una zona de reposo (su parte central): mientras el
   * centro de la pantalla está ahí, el layout se mantiene quieto. La
   * transición se reparte por el hueco entre secciones, que es donde viven
   * las bandas libres — así el morph siempre se ve entero.
   */
  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      const vh = window.innerHeight || 1;
      const rests: { start: number; end: number }[] = [];
      for (const id of STAGE_SECTIONS) {
        const el = document.getElementById(id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        // El margen se acota en píxeles: sin esto, una sección muy alta
        // (proyectos) se comería la transición entera y el morph pasaría
        // detrás de las tarjetas en vez de en la banda libre.
        const margin = Math.min(r.height * REST_MARGIN, vh * 0.45);
        rests.push({ start: top + margin, end: top + r.height - margin });
      }

      const y = window.scrollY + window.innerHeight / 2;

      if (y <= rests[0].end) {
        stageRef.current = 0;
        return;
      }
      const last = rests.length - 1;
      if (y >= rests[last].start) {
        stageRef.current = last;
        return;
      }

      for (let i = 0; i < last; i++) {
        if (y >= rests[i].start && y <= rests[i].end) {
          stageRef.current = i;
          return;
        }
        if (y > rests[i].end && y < rests[i + 1].start) {
          const span = rests[i + 1].start - rests[i].end;
          stageRef.current = i + (y - rests[i].end) / Math.max(span, 1);
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

  const pieceCount = small ? 120 : 260;

  return (
    <Canvas
      dpr={[1, small ? 1.25 : 1.6]}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      }}
      camera={{ position: [-2.4, 0, 10.5], fov: 38 }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[6, 8, 6]} intensity={2.2} color="#dff3ff" />
      <directionalLight
        position={[-7, -3, 4]}
        intensity={1.2}
        color={BRAND.orange}
      />
      <pointLight
        position={[4, 2, 5]}
        intensity={40}
        color={BRAND.cyanLight}
        distance={26}
      />
      <pointLight
        position={[-4, -3, 4]}
        intensity={26}
        color={BRAND.orangeLight}
        distance={26}
      />

      <StageCamera stageRef={stageRef} />
      <BouwMark
        stageRef={stageRef}
        pointerRef={pointerRef}
        reducedMotion={reducedMotion}
      />
      <AssemblyField
        stageRef={stageRef}
        pointerRef={pointerRef}
        count={pieceCount}
        reducedMotion={reducedMotion}
      />
      <ParticleField count={small ? 120 : 260} />

      {/* Estudio de luz propio: sin descargar HDRIs externos */}
      <Environment resolution={128} frames={1}>
        <Lightformer
          intensity={2.6}
          position={[0, 4, -6]}
          scale={[12, 4, 1]}
          color="#bfe7ff"
        />
        <Lightformer
          intensity={1.8}
          position={[-6, 0, 2]}
          scale={[3, 8, 1]}
          color={BRAND.cyanLight}
        />
        <Lightformer
          intensity={1.5}
          position={[6, -2, 2]}
          scale={[3, 8, 1]}
          color={BRAND.orangeLight}
        />
        <Lightformer
          intensity={0.9}
          position={[0, -5, 3]}
          scale={[10, 3, 1]}
          color="#5d7ea8"
        />
      </Environment>

      {!small && (
        <EffectComposer enableNormalPass={false} multisampling={0}>
          <Bloom
            intensity={1.15}
            luminanceThreshold={0.45}
            luminanceSmoothing={0.25}
            mipmapBlur
          />
        </EffectComposer>
      )}
    </Canvas>
  );
}
