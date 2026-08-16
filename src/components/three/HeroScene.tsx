"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import BouwMark from "./BouwMark";
import { BRAND } from "./logoShapes";

/* ------------------------------------------------------------------ */
/* Campo de partículas de fondo                                        */
/* ------------------------------------------------------------------ */

function ParticleField({ count = 320 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 7 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
      positions[i * 3 + 2] = r * Math.cos(phi) * 0.5 - 4;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  useFrame((state, delta) => {
    if (!points.current) return;
    points.current.rotation.y += delta * 0.02;
    points.current.rotation.x =
      Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        size={0.055}
        color={BRAND.cyanLight}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Escena completa                                                     */
/* ------------------------------------------------------------------ */

export default function HeroScene() {
  const scrollRef = useRef(0);
  // El canvas no recibe eventos (queda detrás del contenido), así que
  // seguimos el mouse a nivel de ventana y lo normalizamos a -1..1.
  const pointerRef = useRef({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Progreso del scroll dentro del hero (0 → 1) y pausa del render al salir.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const h = window.innerHeight || 1;
        const p = Math.min(Math.max(window.scrollY / h, 0), 1.4);
        scrollRef.current = p;
        setPaused(p >= 1.25);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 11], fov: 38 }}
      frameloop={paused ? "never" : "always"}
      style={{ pointerEvents: "none" }}
    >
      <color attach="background" args={["#04101f"]} />
      <fog attach="fog" args={["#04101f", 12, 26]} />

      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 6]} intensity={2.1} color="#dff3ff" />
      <directionalLight position={[-7, -3, 4]} intensity={1.1} color={BRAND.orange} />
      <pointLight position={[4, 2, 5]} intensity={35} color={BRAND.cyanLight} distance={18} />
      <pointLight position={[-4, -3, 4]} intensity={22} color={BRAND.orangeLight} distance={18} />

      <BouwMark
        scrollRef={scrollRef}
        pointerRef={pointerRef}
        reducedMotion={reducedMotion}
      />
      <ParticleField />

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

      <EffectComposer enableNormalPass={false}>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
