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

/**
 * El dragón.
 *
 * No es un modelo importado: es una cadena de segmentos que recorre una curva
 * cerrada que envuelve la escena. Cada segmento va un poco más atrás que el
 * anterior sobre la misma curva y mira hacia donde va — de ahí sale el
 * serpenteo, sin esqueleto ni animación grabada.
 *
 * El avance lo manda el scroll: la criatura cruza la pantalla mientras bajas,
 * y sigue derivando despacio aunque te quedes quieto. La cresta la forman los
 * segmentos impares, escalados en alto.
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
  const travelled = useRef(0);

  /** Curva cerrada: entra por la izquierda, cruza al fondo y vuelve. */
  const path = useMemo(() => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    return new THREE.CatmullRomCurve3(
      [
        v(-13, 3.5, -7),
        v(-6, 6.2, 1),
        v(2, 3.4, -4),
        v(9.5, 5.2, -9),
        v(13.5, -1.5, -3),
        v(6, -5.4, 2),
        v(-2, -3.2, -5),
        v(-9.5, -5.8, -8),
        v(-14, -0.5, -2),
      ],
      true,
      "catmullrom",
      0.5,
    );
  }, []);

  const geometry = useMemo(
    () => new THREE.OctahedronGeometry(0.5, 0),
    [],
  );
  const crestGeometry = useMemo(
    () => new THREE.TetrahedronGeometry(0.42, 0),
    [],
  );

  const crestCount = Math.floor(segments / 2);

  /** Perfil de grosor: cabeza ancha, cuello fino, cola en punta. */
  const profile = useMemo(() => {
    const out = new Float32Array(segments);
    for (let i = 0; i < segments; i++) {
      const t = i / (segments - 1);
      const head = Math.exp(-Math.pow(t * 9, 2)) * 0.55;
      const taper = Math.pow(1 - t, 0.75);
      out[i] = 0.34 + head + taper * 0.5;
    }
    return out;
  }, [segments]);

  useLayoutEffect(() => {
    const b = body.current;
    if (!b) return;
    const cold = new THREE.Color(BRAND.navy);
    const warm = new THREE.Color(BRAND.orange);
    const mix = new THREE.Color();
    for (let i = 0; i < segments; i++) {
      // El calor se concentra en la cabeza y se apaga hacia la cola
      mix.copy(cold).lerp(warm, Math.exp(-i / 6));
      b.setColorAt(i, mix);
    }
    if (b.instanceColor) b.instanceColor.needsUpdate = true;
  }, [segments]);

  useFrame((state, delta) => {
    const b = body.current;
    const c = crest.current;
    const g = group.current;
    if (!b || !c || !g) return;

    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    // Dos vueltas completas a lo largo del recorrido, más deriva propia
    const byScroll = (stage / LAST_STAGE) * 2;
    const drift = reducedMotion ? 0 : t * 0.012;
    travelled.current += (byScroll + drift - travelled.current) * d * 1.6;

    // El conjunto se inclina con el mouse: acompaña sin robar protagonismo
    if (!reducedMotion) {
      const px = pointerRef.current?.x ?? 0;
      const py = pointerRef.current?.y ?? 0;
      g.rotation.y += (px * 0.1 - g.rotation.y) * d * 2;
      g.rotation.x += (-py * 0.06 - g.rotation.x) * d * 2;
    }

    const gap = 0.0075; // separación entre segmentos, en unidades de curva
    let crestIndex = 0;

    for (let i = 0; i < segments; i++) {
      const u = (((travelled.current - i * gap) % 1) + 1) % 1;
      path.getPointAt(u, point);

      // Ondulación transversal: el cuerpo no se limita a seguir el riel
      const wave = reducedMotion ? 0 : Math.sin(t * 1.6 - i * 0.42) * 0.42;
      point.y += wave * (i / segments) * 1.4;

      const uAhead = (u + 0.008) % 1;
      path.getPointAt(uAhead, ahead);
      ahead.y += wave * (i / segments) * 1.4;

      dummy.position.copy(point);
      dummy.up.copy(up);
      dummy.lookAt(ahead);

      const w = profile[i];
      // Sección aplanada: se lee como cuerpo, no como collar de bolas
      dummy.scale.set(w, w * 0.72, w * 1.5);
      dummy.updateMatrix();
      b.setMatrixAt(i, dummy.matrix);

      // Cresta sobre los segmentos impares
      if (i % 2 === 1 && crestIndex < crestCount) {
        dummy.translateY(w * 0.55);
        dummy.scale.set(w * 0.36, w * 0.95, w * 0.36);
        dummy.updateMatrix();
        c.setMatrixAt(crestIndex, dummy.matrix);
        crestIndex++;
      }
    }

    // Los índices sobrantes de la cresta se esconden en escala cero
    for (let i = crestIndex; i < crestCount; i++) {
      dummy.scale.setScalar(0);
      dummy.updateMatrix();
      c.setMatrixAt(i, dummy.matrix);
    }

    b.instanceMatrix.needsUpdate = true;
    c.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <instancedMesh
        ref={body}
        args={[geometry, undefined, segments]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          metalness={0.95}
          roughness={0.28}
          envMapIntensity={1.8}
        />
      </instancedMesh>

      <instancedMesh
        ref={crest}
        args={[crestGeometry, undefined, crestCount]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          color={BRAND.orange}
          metalness={0.6}
          roughness={0.25}
          emissive={BRAND.orangeLight}
          emissiveIntensity={0.9}
        />
      </instancedMesh>
    </group>
  );
}
