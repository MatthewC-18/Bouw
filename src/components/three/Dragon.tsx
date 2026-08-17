"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAST_STAGE } from "./layouts";
import { BRAND } from "./logoShapes";

type Props = {
  /** Etapa continua del scroll: 0 hero … 8 contacto */
  stageRef: RefObject<number>;
  pointerRef: RefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
  /** Menos segmentos en pantallas pequeñas */
  segments: number;
};

const dummy = new THREE.Object3D();
const point = new THREE.Vector3();
const ahead = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);

/** Separación entre segmentos, en unidades de recorrido de la curva. */
const GAP = 0.0072;
/** Segmento donde nacen las alas: el hombro. */
const SHOULDER = 4;

/**
 * Ala membranosa.
 *
 * Se dibuja como perfil plano con el borde de fuga festoneado — los tres
 * arcos entre dedos son lo que hace que se lea como ala de dragón y no como
 * un triángulo. Se extruye apenas, para que atrape luz por el canto.
 */
function wingGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  // Borde de ataque: del hombro a la punta
  s.quadraticCurveTo(1.5, 1.05, 3.6, 1.15);
  // Borde de fuga festoneado, punta → cuerpo
  s.quadraticCurveTo(2.9, 0.1, 2.45, -0.5);
  s.quadraticCurveTo(2.2, 0.05, 1.85, -0.42);
  s.quadraticCurveTo(1.55, 0.0, 1.2, -0.62);
  s.quadraticCurveTo(0.9, -0.1, 0.5, -0.5);
  s.quadraticCurveTo(0.2, -0.2, 0, 0);

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 1,
    curveSegments: 10,
  });
}

/** Aleta caudal: la pala del final de la cola. */
function tailFinGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.5, 0.55, 1.25, 0.85);
  s.quadraticCurveTo(0.85, 0.05, 1.15, -0.8);
  s.quadraticCurveTo(0.5, -0.5, 0, 0);

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.03,
    bevelEnabled: false,
    curveSegments: 8,
  });
}

/**
 * El dragón.
 *
 * Un wyvern: cuerpo serpenteante, dos alas y sin patas delanteras — la
 * silueta más legible con menos geometría. El cuerpo es una cadena de
 * segmentos sobre una curva cerrada, cada uno un poco más atrás que el
 * anterior y mirando hacia donde va; de ahí sale el serpenteo, sin esqueleto
 * ni animación grabada. La cabeza, las alas y la aleta son piezas propias
 * ancladas a esa misma cadena.
 */
export default function Dragon({
  stageRef,
  pointerRef,
  reducedMotion,
  segments,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const body = useRef<THREE.InstancedMesh>(null);
  const crest = useRef<THREE.InstancedMesh>(null);
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const travelled = useRef(0);

  /** Curva cerrada: pasa cerca de cámara por delante y se hunde al fondo. */
  const path = useMemo(() => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    return new THREE.CatmullRomCurve3(
      [
        v(-14, 3.0, -8),
        v(-7, 6.0, 0),
        v(0.5, 3.6, 4.5),
        v(8.5, 5.0, -3),
        v(14, -0.5, -9),
        v(7, -5.0, -1),
        v(-1, -3.4, 3.5),
        v(-9, -5.6, -4),
        v(-15, -1.0, -6),
      ],
      true,
      "catmullrom",
      0.5,
    );
  }, []);

  const geo = useMemo(
    () => ({
      // Segmento aplanado y facetado: lee como escama, no como bolita
      body: new THREE.OctahedronGeometry(0.5, 0),
      crest: new THREE.TetrahedronGeometry(0.4, 0),
      skull: new THREE.OctahedronGeometry(0.46, 1),
      snout: new THREE.ConeGeometry(0.3, 1.0, 6),
      jaw: new THREE.ConeGeometry(0.24, 0.85, 5),
      horn: new THREE.ConeGeometry(0.09, 0.78, 5),
      eye: new THREE.SphereGeometry(0.085, 12, 12),
      wing: wingGeometry(),
      tailFin: tailFinGeometry(),
    }),
    [],
  );

  const crestCount = Math.floor(segments / 2);

  /** Perfil de grosor: cuello fino, pecho ancho, cola en punta. */
  const profile = useMemo(() => {
    const out = new Float32Array(segments);
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      // Cuello estrecho justo detrás de la cabeza
      const neck = 1 - Math.exp(-Math.pow((t - 0.04) * 26, 2)) * 0.42;
      // Pecho: el volumen donde se anclan las alas
      const chest = Math.exp(-Math.pow((t - 0.16) * 7, 2)) * 0.45;
      const taper = Math.pow(1 - t, 0.85);
      out[i] = (0.26 + chest + taper * 0.52) * neck;
    }
    return out;
  }, [segments]);

  useLayoutEffect(() => {
    const b = body.current;
    if (!b) return;
    const cold = new THREE.Color(BRAND.navyDeep);
    const warm = new THREE.Color(BRAND.navy);
    const mix = new THREE.Color();
    for (let i = 0; i < segments; i++) {
      // Degradado sutil de escama: nunca plano de un solo tono
      mix.copy(warm).lerp(cold, i / segments);
      b.setColorAt(i, mix);
    }
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
  }, [segments]);

  /** Coloca un objeto sobre la curva en la posición `u`, mirando adelante. */
  const placeOnPath = (obj: THREE.Object3D, u: number, wave: number) => {
    const uu = ((u % 1) + 1) % 1;
    path.getPointAt(uu, point);
    point.y += wave;
    path.getPointAt((uu + 0.008) % 1, ahead);
    ahead.y += wave;
    obj.position.copy(point);
    obj.up.copy(up);
    obj.lookAt(ahead);
  };

  useFrame((state, delta) => {
    const b = body.current;
    const c = crest.current;
    const g = group.current;
    if (!b || !c || !g) return;

    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    // Poco más de una vuelta en todo el recorrido, más deriva propia
    const byScroll = (stage / LAST_STAGE) * 1.35;
    const drift = reducedMotion ? 0 : t * 0.01;
    travelled.current += (byScroll + drift - travelled.current) * d * 1.5;

    if (!reducedMotion) {
      const px = pointerRef.current?.x ?? 0;
      const py = pointerRef.current?.y ?? 0;
      g.rotation.y += (px * 0.1 - g.rotation.y) * d * 2;
      g.rotation.x += (-py * 0.06 - g.rotation.x) * d * 2;
    }

    // Ondulación: crece hacia la cola, para que el cuerpo no vaya sobre raíl
    const waveAt = (i: number) =>
      reducedMotion
        ? 0
        : Math.sin(t * 1.5 - i * 0.4) * 0.4 * (i / segments) * 1.5;

    let crestIndex = 0;

    for (let i = 0; i < segments; i++) {
      const u = travelled.current - i * GAP;
      placeOnPath(dummy, u, waveAt(i));

      const w = profile[i];
      dummy.scale.set(w, w * 0.7, w * 1.55);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);

      // Cresta dorsal: más alta en el lomo, se apaga hacia la cola
      if (i % 2 === 1 && crestIndex < crestCount) {
        const spike = 0.55 + Math.exp(-Math.pow((i / segments - 0.3) * 4, 2));
        dummy.translateY(w * 0.5);
        dummy.scale.set(w * 0.3, w * spike, w * 0.3);
        dummy.updateMatrix();
        c.setMatrixAt(crestIndex, dummy.matrix);
        crestIndex++;
      }
    }

    for (let i = crestIndex; i < crestCount; i++) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      c.setMatrixAt(i, dummy.matrix);
    }

    b.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;

    // Cabeza al frente de la cadena
    if (head.current) {
      placeOnPath(head.current, travelled.current + GAP * 1.2, waveAt(0));
    }

    // Mandíbula: abre y cierra despacio, como respirando
    if (jaw.current && !reducedMotion) {
      jaw.current.rotation.x = 0.16 + Math.sin(t * 0.55) * 0.13;
    }

    // Alas ancladas al hombro
    if (shoulder.current) {
      placeOnPath(
        shoulder.current,
        travelled.current - SHOULDER * GAP,
        waveAt(SHOULDER),
      );
    }
    if (!reducedMotion) {
      // Aleteo lento de planeo: baja rápido, sube despacio
      const beat = Math.sin(t * 0.85);
      const flap = Math.sign(beat) * Math.pow(Math.abs(beat), 1.6) * 0.42;
      if (wingL.current) {
        wingL.current.rotation.z = 0.28 + flap;
        wingL.current.rotation.y = 0.12 + flap * 0.2;
      }
      if (wingR.current) {
        wingR.current.rotation.z = -0.28 - flap;
        wingR.current.rotation.y = -0.12 - flap * 0.2;
      }
    }

    // Aleta caudal al final de la cadena
    if (tail.current) {
      placeOnPath(
        tail.current,
        travelled.current - (segments - 1) * GAP,
        waveAt(segments - 1),
      );
      if (!reducedMotion) {
        tail.current.rotation.z += Math.sin(t * 1.5) * 0.12;
      }
    }
  });

  const scaleMaterial = (
    <meshStandardMaterial
      metalness={0.95}
      roughness={0.26}
      envMapIntensity={1.9}
    />
  );

  return (
    <group ref={group}>
      {/* Cuerpo */}
      <instancedMesh
        ref={body}
        args={[geo.body, undefined, segments]}
        frustumCulled={false}
      >
        {scaleMaterial}
      </instancedMesh>

      {/* Cresta dorsal */}
      <instancedMesh
        ref={crest}
        args={[geo.crest, undefined, crestCount]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color={BRAND.orange}
          metalness={0.55}
          roughness={0.3}
          emissive={BRAND.orangeLight}
          emissiveIntensity={0.75}
        />
      </instancedMesh>

      {/* Cabeza */}
      <group ref={head}>
        <mesh geometry={geo.skull} scale={[0.95, 0.8, 1.15]}>
          <meshStandardMaterial
            color={BRAND.navy}
            metalness={0.95}
            roughness={0.24}
            envMapIntensity={1.9}
          />
        </mesh>

        {/* Hocico: el cono se tumba para apuntar hacia delante */}
        <mesh
          geometry={geo.snout}
          position={[0, -0.02, 0.62]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[1, 1, 0.72]}
        >
          <meshStandardMaterial
            color={BRAND.navy}
            metalness={0.95}
            roughness={0.24}
          />
        </mesh>

        {/* Mandíbula */}
        <group ref={jaw} position={[0, -0.16, 0.3]}>
          <mesh
            geometry={geo.jaw}
            position={[0, -0.06, 0.34]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1, 1, 0.6]}
          >
            <meshStandardMaterial
              color={BRAND.navyDeep}
              metalness={0.9}
              roughness={0.3}
            />
          </mesh>
        </group>

        {/* Cuernos hacia atrás */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            geometry={geo.horn}
            position={[side * 0.24, 0.3, -0.18]}
            rotation={[-0.9, 0, side * 0.28]}
          >
            <meshStandardMaterial
              color={BRAND.orange}
              metalness={0.6}
              roughness={0.3}
              emissive={BRAND.orangeLight}
              emissiveIntensity={0.5}
            />
          </mesh>
        ))}

        {/* Ojos: emisivos puros, el bloom los convierte en brasa */}
        {[-1, 1].map((side) => (
          <mesh
            key={side}
            geometry={geo.eye}
            position={[side * 0.26, 0.1, 0.3]}
          >
            <meshBasicMaterial color={BRAND.orangeLight} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* Alas, ancladas al hombro */}
      <group ref={shoulder}>
        <group ref={wingL} position={[0.18, 0.12, 0]}>
          <mesh geometry={geo.wing} rotation={[0, Math.PI / 2, 0]}>
            <meshStandardMaterial
              color="#123a63"
              metalness={0.35}
              roughness={0.55}
              side={THREE.DoubleSide}
              transparent
              opacity={0.88}
              emissive={BRAND.cyan}
              emissiveIntensity={0.16}
            />
          </mesh>
        </group>

        <group ref={wingR} position={[-0.18, 0.12, 0]} scale={[-1, 1, 1]}>
          <mesh geometry={geo.wing} rotation={[0, Math.PI / 2, 0]}>
            <meshStandardMaterial
              color="#123a63"
              metalness={0.35}
              roughness={0.55}
              side={THREE.DoubleSide}
              transparent
              opacity={0.88}
              emissive={BRAND.cyan}
              emissiveIntensity={0.16}
            />
          </mesh>
        </group>
      </group>

      {/* Aleta caudal */}
      <group ref={tail}>
        <mesh geometry={geo.tailFin} rotation={[0, Math.PI / 2, 0]}>
          <meshStandardMaterial
            color={BRAND.orange}
            metalness={0.5}
            roughness={0.35}
            side={THREE.DoubleSide}
            emissive={BRAND.orangeLight}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}
