"use client";

import { useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAST_STAGE } from "./layouts";
import { BRAND } from "./logoShapes";

type Props = {
  /** Etapa continua del scroll: 0 hero … 8 contacto */
  stageRef: RefObject<number>;
  pointerRef: RefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
  /** Secciones a lo largo del cuerpo; menos en pantallas pequeñas */
  rings: number;
  /** Vértices por sección */
  radials: number;
};

/** Cuánto de la curva ocupa el cuerpo entero. */
const BODY_SPAN = 0.115;
/** Dónde nacen las alas y las patas, en fracción del cuerpo. */
const SHOULDER_AT = 0.1;
const HIP_AT = 0.32;

const up = new THREE.Vector3(0, 1, 0);

/**
 * Varillas del ala: los dedos que tensan la membrana.
 * Cada entrada es la punta del dedo en el plano del perfil.
 */
const WING_BONES: [number, number][] = [
  [3.6, 1.15],
  [2.45, -0.5],
  [1.85, -0.42],
  [1.2, -0.62],
];

/** Membrana del ala, con el borde de fuga festoneado entre dedos. */
function wingGeometry(): THREE.ExtrudeGeometry {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(1.5, 1.05, 3.6, 1.15);
  s.quadraticCurveTo(2.9, 0.1, 2.45, -0.5);
  s.quadraticCurveTo(2.2, 0.05, 1.85, -0.42);
  s.quadraticCurveTo(1.55, 0.0, 1.2, -0.62);
  s.quadraticCurveTo(0.9, -0.1, 0.5, -0.5);
  s.quadraticCurveTo(0.2, -0.2, 0, 0);

  return new THREE.ExtrudeGeometry(s, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 1,
    curveSegments: 14,
  });
}

/** Hocico: perfil de revolución, para que sea liso y no un cono facetado. */
function snoutGeometry(): THREE.LatheGeometry {
  const profile = [
    new THREE.Vector2(0.001, 0),
    new THREE.Vector2(0.1, 0.1),
    new THREE.Vector2(0.19, 0.3),
    new THREE.Vector2(0.25, 0.58),
    new THREE.Vector2(0.28, 0.9),
    new THREE.Vector2(0.29, 1.15),
  ];
  return new THREE.LatheGeometry(profile, 20);
}

/**
 * Piel del dragón.
 *
 * Una sola malla tubular: un anillo de vértices por sección, cosidos en
 * cuadriláteros. Cada frame las secciones se recolocan sobre la curva y se
 * recalculan las normales, así que el cuerpo es continuo y suave — antes eran
 * octaedros sueltos y por eso se veía a cuadros.
 */
function buildSkin(rings: number, radials: number) {
  const positions = new Float32Array(rings * radials * 3);
  const indices: number[] = [];

  for (let r = 0; r < rings - 1; r++) {
    for (let a = 0; a < radials; a++) {
      const next = (a + 1) % radials;
      const i0 = r * radials + a;
      const i1 = r * radials + next;
      const i2 = (r + 1) * radials + a;
      const i3 = (r + 1) * radials + next;
      indices.push(i0, i2, i1, i1, i2, i3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

/** Cresta dorsal: una cinta continua a lo largo del lomo, no púas sueltas. */
function buildCrest(rings: number) {
  const positions = new Float32Array(rings * 2 * 3);
  const indices: number[] = [];

  for (let r = 0; r < rings - 1; r++) {
    const i0 = r * 2;
    const i1 = r * 2 + 1;
    const i2 = (r + 1) * 2;
    const i3 = (r + 1) * 2 + 1;
    indices.push(i0, i2, i1, i1, i2, i3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  return geometry;
}

function useDragonGeo() {
  return useMemo(
    () => ({
      wing: wingGeometry(),
      bone: new THREE.CylinderGeometry(0.026, 0.012, 1, 8),
      skull: new THREE.SphereGeometry(0.5, 24, 18),
      snout: snoutGeometry(),
      jaw: new THREE.SphereGeometry(0.3, 20, 14),
      horn: new THREE.ConeGeometry(0.075, 0.85, 14),
      eye: new THREE.SphereGeometry(0.075, 14, 12),
      thigh: new THREE.CapsuleGeometry(0.13, 0.4, 6, 12),
      shin: new THREE.CapsuleGeometry(0.075, 0.42, 6, 10),
      claw: new THREE.ConeGeometry(0.045, 0.24, 10),
    }),
    [],
  );
}

type DragonGeo = ReturnType<typeof useDragonGeo>;

/** Membrana del ala con sus varillas, en el plano del perfil. */
function Wing({ geo }: { geo: DragonGeo }) {
  return (
    <group rotation={[0, Math.PI / 2, 0]}>
      <mesh geometry={geo.wing}>
        <meshStandardMaterial
          color="#14395f"
          metalness={0.25}
          roughness={0.62}
          side={THREE.DoubleSide}
          transparent
          opacity={0.8}
          emissive={BRAND.cyan}
          emissiveIntensity={0.12}
        />
      </mesh>

      {WING_BONES.map(([x, y], i) => {
        const length = Math.hypot(x, y);
        // El cilindro nace en Y: se gira para que apunte a la punta del dedo
        const angle = Math.atan2(y, x) - Math.PI / 2;
        return (
          <mesh
            key={i}
            geometry={geo.bone}
            position={[x / 2, y / 2, 0.035]}
            rotation={[0, 0, angle]}
            scale={[1, length, 1]}
          >
            <meshStandardMaterial
              color={BRAND.navyDeep}
              metalness={0.8}
              roughness={0.4}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** Pata trasera: muslo, caña y garra, en cápsulas para que no tenga aristas. */
function Leg({ geo }: { geo: DragonGeo }) {
  return (
    <group>
      <mesh
        geometry={geo.thigh}
        position={[0, -0.26, 0]}
        rotation={[0.4, 0, 0.18]}
      >
        <meshStandardMaterial
          color={BRAND.navy}
          metalness={0.85}
          roughness={0.36}
        />
      </mesh>
      <mesh
        geometry={geo.shin}
        position={[0.08, -0.66, -0.12]}
        rotation={[-0.55, 0, 0.08]}
      >
        <meshStandardMaterial
          color={BRAND.navyDeep}
          metalness={0.85}
          roughness={0.36}
        />
      </mesh>
      <mesh
        geometry={geo.claw}
        position={[0.11, -0.92, 0.05]}
        rotation={[1.15, 0, 0]}
      >
        <meshStandardMaterial
          color={BRAND.orange}
          metalness={0.55}
          roughness={0.32}
          emissive={BRAND.orangeLight}
          emissiveIntensity={0.45}
        />
      </mesh>
    </group>
  );
}

/**
 * El dragón.
 *
 * Un wyvern de piel continua. El cuerpo es una malla tubular cuyas secciones
 * se recolocan cada frame sobre una curva cerrada: de ahí sale el serpenteo,
 * sin esqueleto ni animación grabada. Cabeza, alas, patas y cresta cuelgan de
 * esa misma curva.
 */
export default function Dragon({
  stageRef,
  pointerRef,
  reducedMotion,
  rings,
  radials,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const skin = useRef<THREE.Mesh>(null);
  const crest = useRef<THREE.Mesh>(null);
  const head = useRef<THREE.Group>(null);
  const jaw = useRef<THREE.Group>(null);
  const shoulder = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const hip = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const travelled = useRef(0);

  const geo = useDragonGeo();
  const skinGeometry = useMemo(
    () => buildSkin(rings, radials),
    [rings, radials],
  );
  const crestGeometry = useMemo(() => buildCrest(rings), [rings]);

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

  /** Grosor por sección: cuello fino, pecho ancho, cola en punta. */
  const profile = useMemo(() => {
    const out = new Float32Array(rings);
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1);
      const neck = 1 - Math.exp(-Math.pow((t - 0.03) * 24, 2)) * 0.4;
      const chest = Math.exp(-Math.pow((t - 0.17) * 6.5, 2)) * 0.42;
      const taper = Math.pow(1 - t, 1.15);
      out[i] = (0.1 + chest + taper * 0.46) * neck;
    }
    return out;
  }, [rings]);

  /** Alto de la cresta por sección: crece en el lomo y muere en la cola. */
  const crestProfile = useMemo(() => {
    const out = new Float32Array(rings);
    for (let i = 0; i < rings; i++) {
      const t = i / (rings - 1);
      const back = Math.exp(-Math.pow((t - 0.28) * 3.2, 2));
      const fade = Math.pow(1 - t, 0.7);
      out[i] = (0.12 + back * 0.34) * fade;
    }
    return out;
  }, [rings]);

  // Vectores reutilizados: nada de asignar dentro del bucle de render
  const scratch = useMemo(
    () => ({
      center: new THREE.Vector3(),
      next: new THREE.Vector3(),
      tangent: new THREE.Vector3(),
      side: new THREE.Vector3(),
      vert: new THREE.Vector3(),
      tmp: new THREE.Vector3(),
    }),
    [],
  );

  useFrame((state, delta) => {
    const s = skin.current;
    const c = crest.current;
    const g = group.current;
    if (!s || !c || !g) return;

    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    const byScroll = (stage / LAST_STAGE) * 1.35;
    const drift = reducedMotion ? 0 : t * 0.01;
    travelled.current += (byScroll + drift - travelled.current) * d * 1.5;

    if (!reducedMotion) {
      const px = pointerRef.current?.x ?? 0;
      const py = pointerRef.current?.y ?? 0;
      g.rotation.y += (px * 0.1 - g.rotation.y) * d * 2;
      g.rotation.x += (-py * 0.06 - g.rotation.x) * d * 2;
    }

    /** Ondulación lateral: crece hacia la cola. */
    const waveAt = (f: number) =>
      reducedMotion ? 0 : Math.sin(t * 1.5 - f * 22) * 0.55 * f;

    /** Coloca el sistema de referencia de una sección sobre la curva. */
    const frameAt = (u: number, wave: number) => {
      const uu = ((u % 1) + 1) % 1;
      path.getPointAt(uu, scratch.center);
      path.getPointAt((uu + 0.006) % 1, scratch.next);
      scratch.center.y += wave;
      scratch.next.y += wave;
      scratch.tangent.subVectors(scratch.next, scratch.center).normalize();
      scratch.side.crossVectors(scratch.tangent, up).normalize();
      scratch.vert.crossVectors(scratch.side, scratch.tangent).normalize();
    };

    const skinPos = s.geometry.attributes.position as THREE.BufferAttribute;
    const crestPos = c.geometry.attributes.position as THREE.BufferAttribute;
    const skinArray = skinPos.array as Float32Array;
    const crestArray = crestPos.array as Float32Array;

    for (let r = 0; r < rings; r++) {
      const f = r / (rings - 1);
      frameAt(travelled.current - f * BODY_SPAN, waveAt(f));

      const rw = profile[r];
      const rh = rw * 0.72; // sección aplanada: cuerpo, no manguera

      for (let a = 0; a < radials; a++) {
        const ang = (a / radials) * Math.PI * 2;
        const cos = Math.cos(ang) * rw;
        const sin = Math.sin(ang) * rh;

        scratch.tmp
          .copy(scratch.center)
          .addScaledVector(scratch.side, cos)
          .addScaledVector(scratch.vert, sin);

        const k = (r * radials + a) * 3;
        skinArray[k] = scratch.tmp.x;
        skinArray[k + 1] = scratch.tmp.y;
        skinArray[k + 2] = scratch.tmp.z;
      }

      // Cinta de la cresta: del lomo hacia arriba
      const base = r * 6;
      scratch.tmp.copy(scratch.center).addScaledVector(scratch.vert, rh * 0.9);
      crestArray[base] = scratch.tmp.x;
      crestArray[base + 1] = scratch.tmp.y;
      crestArray[base + 2] = scratch.tmp.z;

      scratch.tmp.addScaledVector(scratch.vert, crestProfile[r]);
      crestArray[base + 3] = scratch.tmp.x;
      crestArray[base + 4] = scratch.tmp.y;
      crestArray[base + 5] = scratch.tmp.z;
    }

    skinPos.needsUpdate = true;
    crestPos.needsUpdate = true;
    s.geometry.computeVertexNormals();
    c.geometry.computeVertexNormals();

    const bank = reducedMotion ? 0 : Math.sin(t * 1.5) * 0.34;

    // Cabeza: por delante de la primera sección
    if (head.current) {
      frameAt(travelled.current + 0.004, waveAt(0));
      head.current.position.copy(scratch.center);
      head.current.up.copy(up);
      head.current.lookAt(scratch.next);
      head.current.rotateZ(bank * 0.6);
      head.current.rotateX(reducedMotion ? 0 : Math.sin(t * 0.7) * 0.07);
    }

    if (jaw.current && !reducedMotion) {
      jaw.current.rotation.x = 0.14 + Math.sin(t * 0.55) * 0.12;
    }

    // Alas
    if (shoulder.current) {
      frameAt(travelled.current - SHOULDER_AT * BODY_SPAN, waveAt(SHOULDER_AT));
      shoulder.current.position.copy(scratch.center);
      shoulder.current.up.copy(up);
      shoulder.current.lookAt(scratch.next);
      shoulder.current.rotateZ(bank);
    }
    if (!reducedMotion) {
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

    // Patas
    if (hip.current) {
      frameAt(travelled.current - HIP_AT * BODY_SPAN, waveAt(HIP_AT));
      hip.current.position.copy(scratch.center);
      hip.current.up.copy(up);
      hip.current.lookAt(scratch.next);
      hip.current.rotateZ(bank * 0.8);
    }
    if (!reducedMotion) {
      const tuck = Math.sin(t * 0.75) * 0.14;
      if (legL.current) legL.current.rotation.x = 0.55 + tuck;
      if (legR.current) legR.current.rotation.x = 0.55 - tuck;
    }
  });

  return (
    <group ref={group}>
      {/* Piel */}
      <mesh ref={skin} geometry={skinGeometry} frustumCulled={false}>
        <meshStandardMaterial
          color={BRAND.navy}
          metalness={0.72}
          roughness={0.34}
          envMapIntensity={1.7}
        />
      </mesh>

      {/* Cresta dorsal continua */}
      <mesh ref={crest} geometry={crestGeometry} frustumCulled={false}>
        <meshStandardMaterial
          color={BRAND.orange}
          metalness={0.45}
          roughness={0.38}
          side={THREE.DoubleSide}
          emissive={BRAND.orangeLight}
          emissiveIntensity={0.55}
        />
      </mesh>

      {/* Cabeza */}
      <group ref={head}>
        <group scale={1.35}>
          <mesh geometry={geo.skull} scale={[0.8, 0.72, 1.05]}>
            <meshStandardMaterial
              color={BRAND.navy}
              metalness={0.72}
              roughness={0.32}
              envMapIntensity={1.7}
            />
          </mesh>

          {/* Hocico: revolución tumbada hacia delante */}
          <mesh
            geometry={geo.snout}
            position={[0, -0.03, 0.42]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[1, 1, 0.78]}
          >
            <meshStandardMaterial
              color={BRAND.navy}
              metalness={0.72}
              roughness={0.32}
            />
          </mesh>

          <group ref={jaw} position={[0, -0.17, 0.24]}>
            <mesh
              geometry={geo.jaw}
              position={[0, -0.02, 0.28]}
              scale={[0.72, 0.42, 1.5]}
            >
              <meshStandardMaterial
                color={BRAND.navyDeep}
                metalness={0.7}
                roughness={0.38}
              />
            </mesh>
          </group>

          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={geo.horn}
              position={[side * 0.24, 0.28, -0.16]}
              rotation={[-0.95, 0, side * 0.3]}
            >
              <meshStandardMaterial
                color={BRAND.orange}
                metalness={0.5}
                roughness={0.34}
                emissive={BRAND.orangeLight}
                emissiveIntensity={0.45}
              />
            </mesh>
          ))}

          {[-1, 1].map((side) => (
            <mesh
              key={side}
              geometry={geo.eye}
              position={[side * 0.24, 0.09, 0.3]}
            >
              <meshBasicMaterial color={BRAND.orangeLight} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Alas */}
      <group ref={shoulder}>
        <group ref={wingL} position={[0.18, 0.12, 0]}>
          <Wing geo={geo} />
        </group>
        <group ref={wingR} position={[-0.18, 0.12, 0]} scale={[-1, 1, 1]}>
          <Wing geo={geo} />
        </group>
      </group>

      {/* Patas traseras */}
      <group ref={hip}>
        <group ref={legL} position={[0.2, -0.1, 0]}>
          <Leg geo={geo} />
        </group>
        <group ref={legR} position={[-0.2, -0.1, 0]} scale={[-1, 1, 1]}>
          <Leg geo={geo} />
        </group>
      </group>
    </group>
  );
}
