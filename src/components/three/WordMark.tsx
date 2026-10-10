"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LAST_STAGE, markPresence } from "./layouts";
import { applyPlanFade, applyPlanSplit } from "./planSplitMaterial";
import { BRAND } from "./logoShapes";
import { perch } from "./perch";
import { spreadFor } from "./scenes";
import {
  PERCH_LOCAL,
  W_INDEX,
  letterGeometry,
  letterShapes,
  wordPlacement,
} from "./wordShapes";

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
 * Cada letra entra desde su propia dirección, una detrás de otra.
 *
 * La W llega la última a propósito: es la que recibe al dragón, y que el
 * bicho baje justo cuando la letra acaba de encajar es lo que ata las dos
 * cosas en un solo gesto.
 */
const LETTER_ENTRY: { offset: [number, number, number]; spin: number; delay: number }[] = [
  { offset: [-3.4, 1.4, -2.6], spin: 0.6, delay: 0 }, // B
  { offset: [-1.2, -2.6, -2.0], spin: -0.5, delay: 0.1 }, // O
  { offset: [1.4, 2.8, -2.2], spin: 0.5, delay: 0.2 }, // U
  { offset: [3.6, -1.6, -2.8], spin: -0.6, delay: 0.3 }, // W
];
/** Segundos del montaje entero. */
const INTRO_TIME = 1.5;

/**
 * Muelle de la W al recibir el peso.
 *
 * El dragón deja un impulso al tocar (`perch.kick`) y la letra cede y
 * vuelve, amortiguada por debajo del crítico: un bote, no un temblor. Medio
 * píxel de más y se lee como gelatina; con esto baja unos ocho píxeles y
 * vuelve en un tercio de segundo.
 */
const W_SPRING = 180;
const W_DAMP = 14;

/**
 * Calco de aristas de una letra.
 *
 * Del lado del plano la letra se pinta en tinta plana oscura, y una silueta
 * oscura sobre fondo oscuro no es un dibujo: es un agujero. Lo que la
 * convierte en plano son las líneas — el contorno del bisel, el canto de la
 * extrusión, el hueco de la B. La opacidad la escribe el bucle; el lado en el
 * que existe lo decide el divisor desde el shader.
 */
function LetterEdges({ geometry }: { geometry: THREE.BufferGeometry }) {
  return (
    <lineSegments geometry={geometry} scale={1.003} renderOrder={2}>
      <lineBasicMaterial
        color={BRAND.cyanLight}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </lineSegments>
  );
}

/**
 * BOUW en tres dimensiones, con la W lista para recibir al dragón.
 *
 * Se monta letra a letra al entrar, respira con el ratón y obedece al
 * divisor plano / realidad. Solo aparece en los extremos del recorrido:
 * entera en la portada y otra vez al llegar a contacto.
 */
export default function WordMark({ stageRef, pointerRef, reducedMotion }: Props) {
  const group = useRef<THREE.Group>(null);
  const letters = useRef<(THREE.Group | null)[]>([]);
  const anchor = useRef<THREE.Object3D>(null);

  const placement = useMemo(() => ({ position: new THREE.Vector3(), scale: 1 }), []);
  const targetRot = useRef(new THREE.Vector2());
  const intro = useRef(0);
  const wDip = useRef(0);
  const wVel = useRef(0);

  const geo = useMemo(
    () =>
      letterShapes().map(({ char, shapes }) => {
        const solid = letterGeometry(shapes);
        // 25° deja fuera los escalones del bisel y de las curvas y se queda
        // solo con los quiebres reales de la letra
        return { char, solid, edges: new THREE.EdgesGeometry(solid, 25) };
      }),
    [],
  );

  /*
   * Dos materiales por letra, que es como reparte los grupos la extrusión:
   * el 0 son las caras y el 1 los cantos.
   *
   * La cara va en el cian claro del logo en negativo —la palabra se tiene que
   * leer como la del logo, no como un bloque de metal oscuro sobre fondo
   * oscuro— y el canto en acero azul pulido, que es lo que da el grosor.
   */
  const mats = useMemo(() => {
    // Poco metal y algo de emisión propia: la luz principal de la escena es
    // ámbar, y sobre un cian metálico la mezcla daba verde salvia
    const face = new THREE.MeshPhysicalMaterial({
      color: BRAND.cyan,
      metalness: 0.15,
      roughness: 0.34,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      emissive: new THREE.Color(BRAND.cyan),
      emissiveIntensity: 0.28,
      envMapIntensity: 1.0,
    });
    const side = new THREE.MeshStandardMaterial({
      color: BRAND.navy,
      metalness: 0.92,
      roughness: 0.24,
      envMapIntensity: 1.6,
    });
    // Secciones horizontales y algo más juntas que en la B: la letra mide un
    // tercio de lo que medía la B y con el paso de antes no caía ni una
    applyPlanSplit(face, { ribAxis: "y", ribScale: 4 });
    applyPlanSplit(side, { ribAxis: "y", ribScale: 4 });
    return { face, side, list: [face, side] as THREE.Material[] };
  }, []);

  // Las líneas se parchean después del montaje: los materiales los crea R3F
  // al pintar el JSX
  useEffect(() => {
    const g = group.current;
    if (!g) return;
    g.traverse((obj) => {
      const mat = (obj as THREE.LineSegments).material as THREE.Material | undefined;
      if (mat && (mat as THREE.LineBasicMaterial).isLineBasicMaterial) {
        applyPlanFade(mat, "plan");
      }
    });
  }, []);

  useEffect(
    () => () => {
      for (const l of geo) {
        l.solid.dispose();
        l.edges.dispose();
      }
      mats.face.dispose();
      mats.side.dispose();
    },
    [geo, mats],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);
    const { entering, returning, presence } = markPresence(stage);

    const g = group.current;
    if (!g) return;

    if (presence < 0.002) {
      g.visible = false;
      perch.live = 0;
      return;
    }
    g.visible = true;

    // Montaje inicial: avanza una sola vez, la primera vez que se ve. Con
    // reloj de pared, como la llegada del dragón (ver `landClock`)
    if (intro.current < 1) {
      intro.current = Math.min(
        intro.current + Math.min(delta, 0.25) / INTRO_TIME,
        1,
      );
    }
    const assembled = reducedMotion ? 1 : intro.current;

    // Opacidad y escala acompañan a la presencia: se disgrega, no se encoge
    mats.face.transparent = mats.side.transparent = presence < 0.999;
    mats.face.opacity = mats.side.opacity = presence;
    mats.face.depthWrite = mats.side.depthWrite = presence > 0.9;
    g.traverse((obj) => {
      const line = obj as THREE.LineSegments;
      const mat = line.material as THREE.LineBasicMaterial | undefined;
      if (mat && mat.isLineBasicMaterial) mat.opacity = presence * 0.75;
    });

    /* ---- La W recibe el peso ---- */
    if (perch.kick !== 0) {
      wVel.current += perch.kick;
      perch.kick = 0;
    }
    wVel.current += (-W_SPRING * wDip.current - W_DAMP * wVel.current) * d;
    wDip.current += wVel.current * d;

    // Cada letra llega desde su dirección y encaja
    LETTER_ENTRY.forEach((entry, i) => {
      const letter = letters.current[i];
      if (!letter) return;
      const local = Math.min(
        Math.max((assembled - entry.delay) / (1 - entry.delay), 0),
        1,
      );
      const e = easeOutQuint(local);
      const away = 1 - e;
      letter.position.set(
        entry.offset[0] * away,
        entry.offset[1] * away + (i === W_INDEX ? wDip.current : 0),
        entry.offset[2] * away,
      );
      letter.rotation.set(away * entry.spin * 0.5, away * entry.spin, away * entry.spin * 0.3);
      letter.scale.setScalar(0.8 + e * 0.2);
    });

    /* ---- Encuadre ---- */
    const aspect = state.size.width / Math.max(state.size.height, 1);
    // El mismo corte que el diseño de la página: por debajo de `md` la
    // portada apila y la palabra va arriba
    wordPlacement(aspect, spreadFor(aspect), placement, {
      mobile: state.size.width < 768,
      closing: stage > LAST_STAGE / 2 ? 1 : 0,
    });

    // El ratón inclina la palabra, pero poco: lleva un animal encima y un
    // giro grande lo descolocaría de la letra a la vista de todos
    const px = reducedMotion ? 0 : (pointerRef.current?.x ?? 0);
    const py = reducedMotion ? 0 : (pointerRef.current?.y ?? 0);
    targetRot.current.x += (-py * 0.1 - targetRot.current.x) * d * 3;
    targetRot.current.y += (px * 0.2 - targetRot.current.y) * d * 3;

    const idle = reducedMotion ? 0 : Math.sin(t * 0.4) * 0.035;
    // Al volver en contacto la palabra llega de frente y quieta
    const settle = returning;
    /*
     * La palabra sube con la portada.
     *
     * Se pasan los píxeles de scroll a mundo a la profundidad de la palabra,
     * así que acompaña al titular en vez de quedarse pegada a la pantalla. En
     * contacto no: ahí vuelve al lienzo fijo, centrada en su hueco.
     */
    const cam = state.camera as THREE.PerspectiveCamera;
    const depth = Math.max(cam.position.z - placement.position.z, 1);
    const perPx =
      (2 * depth * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) /
      Math.max(state.size.height, 1);
    const lift = stage < LAST_STAGE / 2 ? window.scrollY * perPx : 0;
    perch.lift = lift;

    g.position.copy(placement.position);
    g.position.y += lift;
    g.position.y += reducedMotion ? 0 : Math.sin(t * 0.6) * 0.05 * (1 - settle);
    g.rotation.set(
      targetRot.current.x * (1 - settle * 0.6),
      -0.14 + targetRot.current.y * (1 - settle * 0.6) + idle * (1 - settle) +
        (1 - assembled) * 0.5,
      0,
    );
    g.scale.setScalar(placement.scale * (0.9 + presence * 0.1));

    /* ---- El apoyo, para el dragón ---- */
    const a = anchor.current;
    if (a) {
      a.updateWorldMatrix(true, false);
      perch.matrix.copy(a.matrixWorld);
      perch.scale = g.scale.x;
      // Se posa solo en la portada: en contacto el bicho está quemando el
      // hueco del formulario y la palabra vuelve sin él
      const wLocal = Math.min(
        Math.max((assembled - LETTER_ENTRY[W_INDEX].delay) / (1 - LETTER_ENTRY[W_INDEX].delay), 0),
        1,
      );
      perch.live = entering * wLocal;
      perch.ready = true;
    }
  });

  return (
    <group ref={group} dispose={null}>
      {geo.map((l, i) => (
        <group
          key={l.char}
          ref={(el) => {
            letters.current[i] = el;
          }}
        >
          <mesh geometry={l.solid} material={mats.list} />
          <LetterEdges geometry={l.edges} />
          {i === W_INDEX && <object3D ref={anchor} position={PERCH_LOCAL} />}
        </group>
      ))}
    </group>
  );
}
