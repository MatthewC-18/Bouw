"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildFireSprite } from "./dragonTextures";

type Props = {
  /** Boca del dragón, en mundo. */
  originRef: RefObject<THREE.Vector3>;
  /** Hacia dónde escupe, en mundo (unitario). */
  aimRef: RefObject<THREE.Vector3>;
  /** 0 apagado … 1 a plena llama. */
  powerRef: RefObject<number>;
  count: number;
  reducedMotion: boolean;
};

/** Cuánto vive un grano de fuego, en segundos. */
const LIFESPAN = 0.78;

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aLife;
  varying float vLife;

  void main() {
    vLife = aLife;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (320.0 / max(-mv.z, 0.1));
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  varying float vLife;

  void main() {
    float mask = texture2D(uMap, gl_PointCoord).a;
    if (mask < 0.01) discard;

    // Del blanco del núcleo al ámbar y de ahí a la brasa que se apaga
    vec3 core = vec3(1.00, 0.94, 0.74);
    vec3 mid  = vec3(1.00, 0.44, 0.07);
    vec3 ash  = vec3(0.34, 0.05, 0.01);
    vec3 col = mix(core, mid, smoothstep(0.0, 0.2, vLife));
    col = mix(col, ash, smoothstep(0.28, 0.95, vLife));

    float fade = 1.0 - smoothstep(0.5, 1.0, vLife);
    gl_FragColor = vec4(col, mask * fade * uOpacity);
  }
`;

/**
 * Aliento de fuego.
 *
 * Granos sueltos en espacio de mundo — no cuelgan de la cabeza — para que la
 * llama se quede atrás cuando el dragón sigue avanzando, que es lo que la hace
 * parecer fuego y no una bufanda. Cada grano nace en la boca con la dirección
 * del hocico más algo de dispersión, sube por flotación y frena por
 * rozamiento; el color va de blanco a ámbar y muere en brasa.
 */
export default function FireBreath({
  originRef,
  aimRef,
  powerRef,
  count,
  reducedMotion,
}: Props) {
  const points = useRef<THREE.Points>(null);
  const light = useRef<THREE.PointLight>(null);

  const { geometry, material, velocities, ages, spans, bases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const lives = new Float32Array(count);
    const velocities = new Float32Array(count * 3);
    const ages = new Float32Array(count);
    const spans = new Float32Array(count);
    const bases = new Float32Array(count);

    // Todos empiezan muertos y escalonados: la llama arranca poco a poco
    for (let i = 0; i < count; i++) {
      ages[i] = 1 + Math.random();
      spans[i] = LIFESPAN * (0.7 + Math.random() * 0.6);
      bases[i] = 0.7 + Math.random() * 0.6;
      lives[i] = 1;
      sizes[i] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aLife", new THREE.BufferAttribute(lives, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: buildFireSprite(128) },
        uOpacity: { value: 0 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });

    return { geometry, material, velocities, ages, spans, bases };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      (material.uniforms.uMap.value as THREE.Texture).dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const scratch = useMemo(
    () => ({
      side: new THREE.Vector3(),
      lift: new THREE.Vector3(),
      spread: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((_, delta) => {
    const mesh = points.current;
    if (!mesh) return;

    const d = Math.min(delta, 0.05);
    const power = reducedMotion ? 0 : (powerRef.current ?? 0);
    material.uniforms.uOpacity.value = Math.min(1, power * 1.35);

    const origin = originRef.current;
    const aim = aimRef.current;
    if (!origin || !aim) return;

    // Base ortonormal alrededor del chorro, para dispersar sin sesgo
    scratch.side.set(aim.z, 0, -aim.x);
    if (scratch.side.lengthSq() < 1e-6) scratch.side.set(1, 0, 0);
    scratch.side.normalize();
    scratch.lift.crossVectors(aim, scratch.side).normalize();

    const position = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const size = mesh.geometry.attributes.aSize as THREE.BufferAttribute;
    const life = mesh.geometry.attributes.aLife as THREE.BufferAttribute;
    const pos = position.array as Float32Array;
    const siz = size.array as Float32Array;
    const lif = life.array as Float32Array;

    // Cuántos granos puede encender este frame: a media llama, media boca
    let budget = power > 0.02 ? Math.ceil(count * power * d * 7) : 0;

    for (let i = 0; i < count; i++) {
      ages[i] += d;
      const k = i * 3;

      if (ages[i] >= spans[i]) {
        if (budget <= 0) {
          lif[i] = 1;
          siz[i] = 0;
          continue;
        }
        budget--;

        spans[i] = LIFESPAN * (0.7 + Math.random() * 0.6);
        bases[i] = 0.7 + Math.random() * 0.6;
        ages[i] = 0;

        const jitter = 0.06;
        pos[k] = origin.x + (Math.random() - 0.5) * jitter;
        pos[k + 1] = origin.y + (Math.random() - 0.5) * jitter;
        pos[k + 2] = origin.z + (Math.random() - 0.5) * jitter;

        const speed = 5 + Math.random() * 4;
        const cone = 0.7 + Math.random() * 0.9;
        const angle = Math.random() * Math.PI * 2;
        scratch.spread
          .copy(scratch.side)
          .multiplyScalar(Math.cos(angle) * cone)
          .addScaledVector(scratch.lift, Math.sin(angle) * cone);

        velocities[k] = aim.x * speed + scratch.spread.x;
        velocities[k + 1] = aim.y * speed + scratch.spread.y;
        velocities[k + 2] = aim.z * speed + scratch.spread.z;
      }

      const t = Math.min(1, ages[i] / spans[i]);

      // Flotación hacia arriba y rozamiento: el chorro se abre y se frena
      velocities[k + 1] += 2.4 * d;
      const drag = 1 - Math.min(0.9, 1.7 * d);
      velocities[k] *= drag;
      velocities[k + 1] *= drag;
      velocities[k + 2] *= drag;

      pos[k] += velocities[k] * d;
      pos[k + 1] += velocities[k + 1] * d;
      pos[k + 2] += velocities[k + 2] * d;

      lif[i] = t;
      // El grano crece según se enfría: la llama se abre al alejarse
      siz[i] = (0.32 + t * 2.3) * bases[i];
    }

    position.needsUpdate = true;
    size.needsUpdate = true;
    life.needsUpdate = true;

    // La llama ilumina lo que tiene delante
    if (light.current) {
      light.current.position.copy(origin).addScaledVector(aim, 1.6);
      light.current.intensity = power * 90;
    }
  });

  return (
    <group>
      <points
        ref={points}
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
      <pointLight ref={light} color="#ff8a2b" distance={16} intensity={0} />
    </group>
  );
}
