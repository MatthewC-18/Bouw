"use client";

import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { debug } from "@/lib/debug";
import { HANDOFF_TIME, handoff } from "@/lib/handoff";
import { LAST_STAGE, buildAssembly } from "./layouts";
import { BRAND } from "./logoShapes";

const PIECE_COLORS = [
  new THREE.Color(BRAND.navy),
  new THREE.Color(BRAND.navyDeep),
  new THREE.Color(BRAND.cyan),
  new THREE.Color(BRAND.orange),
];

type Props = {
  /** Etapa continua del scroll: 0 hero … 5 contacto */
  stageRef: RefObject<number>;
  pointerRef: RefObject<{ x: number; y: number }>;
  count: number;
  reducedMotion: boolean;
  /** Frente de construcción del dragón, en mundo. */
  frontRef: RefObject<THREE.Vector3>;
  /** Caudal con signo: >0 el dragón se construye, <0 se deshace, 0 reposo. */
  flowRef: RefObject<number>;
};

/**
 * Piezas que alimentan al dragón.
 *
 * Una de cada tres deja el layout mientras el dragón se construye, vuela
 * hasta su frente de construcción y se disuelve dentro. El color del bicho no
 * aparece de la nada: se lo dan las piezas de la propia marca, que es lo que
 * ata las dos cosas de la escena en un solo argumento.
 *
 * No se pierde ninguna: el desvío es un ciclo, y en cuanto la construcción
 * termina todas vuelven a su sitio para armar la B del final.
 */
const CARRIER_EVERY = 3;
/** Viajes por segundo de cada pieza portadora. */
const CARRIER_RATE = 0.42;

const dummy = new THREE.Object3D();
const quat = new THREE.Quaternion();
const axisVec = new THREE.Vector3();
const localFront = new THREE.Vector3();

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * Las piezas de la marca. Se interpolan entre layouts según el scroll:
 * en el hero forman la B, luego se desarman, pasan por columnas, engranaje,
 * cadena y dos núcleos, y al final vuelven a armar la B.
 */
export default function AssemblyField({
  stageRef,
  pointerRef,
  count,
  reducedMotion,
  frontRef,
  flowRef,
}: Props) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => buildAssembly(count), [count]);

  // Posición actual de cada pieza: se persigue al objetivo, no se salta.
  const current = useMemo(() => new Float32Array(data.layouts[0]), [data]);

  const geometry = useMemo(() => {
    // Cubo con las aristas apenas marcadas: atrapa mejor la luz que uno plano.
    const g = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1);
    return g;
  }, []);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < count; i++) {
      m.setColorAt(i, PIECE_COLORS[data.colorIds[i]]);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [count, data]);

  useFrame((state, delta) => {
    const m = mesh.current;
    const g = group.current;
    if (!m || !g) return;

    const t = state.clock.elapsedTime;
    const d = Math.min(delta, 0.05);
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    // Las piezas solo se ven cuando la B sólida no está: son complementarias.
    // En el tramo medio bajan de tamaño: ahí son fondo, y la única silueta
    // con lectura tiene que ser el dragón.
    const visible =
      smoothstep(0.08, 0.55, stage) *
      (1 - smoothstep(LAST_STAGE - 0.55, LAST_STAGE - 0.08, stage));
    const atEdge = Math.min(Math.min(stage, LAST_STAGE - stage), 1);
    const shown = visible * (1 - atEdge * 0.45);

    if (shown < 0.002) {
      m.visible = false;
      return;
    }
    m.visible = true;

    // Parallax del conjunto: barato, y hace que responda al mouse sin
    // recalcular una sola matriz de más.
    if (!reducedMotion) {
      const px = pointerRef.current?.x ?? 0;
      const py = pointerRef.current?.y ?? 0;
      g.rotation.y += (px * 0.16 - g.rotation.y) * d * 2.5;
      g.rotation.x += (-py * 0.1 - g.rotation.x) * d * 2.5;
    }

    /*
     * El punto de encuentro, en coordenadas del grupo.
     *
     * El grupo gira con el puntero, así que el frente que llega en mundo no
     * sirve tal cual: hay que meterlo en el espacio local o las piezas
     * apuntarían a un sitio desplazado justo cuando se mueve el ratón.
     */
    /*
     * Las piezas circulan solo mientras hay algo que mover.
     *
     * Antes esto miraba cuánto llevaba construido, lo que dejaba el trasiego
     * encendido para siempre en cuanto el dragón quedaba a medias. Ahora mira
     * el caudal: si la construcción no avanza ni retrocede, no hay viaje.
     */
    const flow = flowRef?.current ?? 0;

    /*
     * Y la segunda razón para arrancar: lo que el visitante acaba de marcar.
     *
     * El caudal lo pone el scroll —el dragón se construye mientras se baja
     * por Proyectos— y para cuando se llega al diagnóstico ya está entero, o
     * sea que el caudal es cero y el trasiego estaría apagado justo en la
     * única sección donde el visitante dice algo.
     *
     * Cada casilla que marca abre el paso durante un par de segundos. Es el
     * mismo viaje, disparado por una persona en vez de por el scroll.
     */
    let pulse = handoff.pulse;
    if (pulse !== 0) {
      const step = d / HANDOFF_TIME;
      pulse =
        pulse > 0 ? Math.max(0, pulse - step) : Math.min(0, pulse + step);
      handoff.pulse = pulse;
    }
    if (debug.on) debug.stats.handoff = pulse;

    // Manda el caudal si lo hay; si no, la respuesta del visitante
    const drive =
      Math.abs(flow) > 0.02 ? flow : (pulse / HANDOFF_TIME) * 0.55;
    const feeding =
      reducedMotion || !frontRef?.current
        ? 0
        : smoothstep(0.02, 0.12, Math.abs(drive));
    // Construyendo van hacia el dragón; deshaciendo, salen de él
    const outward = drive < 0;

    if (feeding > 0.001) {
      g.updateMatrixWorld();
      localFront.copy(frontRef.current);
      g.worldToLocal(localFront);
    }

    // Layout objetivo interpolado
    const i0 = Math.min(Math.floor(stage), data.layouts.length - 1);
    const i1 = Math.min(i0 + 1, data.layouts.length - 1);
    const f = smoothstep(0, 1, stage - i0);
    const from = data.layouts[i0];
    const to = data.layouts[i1];

    // Qué tan "en vuelo" están: máximo a mitad de cada transición.
    const inFlight = Math.sin(Math.min(Math.max(stage - i0, 0), 1) * Math.PI);
    const settled = 1 - inFlight;
    const chase = 1 - Math.pow(0.0015, d); // suavizado independiente de fps

    for (let i = 0; i < count; i++) {
      const k = i * 3;
      const tx = from[k] + (to[k] - from[k]) * f;
      const ty = from[k + 1] + (to[k + 1] - from[k + 1]) * f;
      const tz = from[k + 2] + (to[k + 2] - from[k + 2]) * f;

      // Al cruzar entre layouts las piezas se abren hacia fuera: se nota que
      // se desarman en lugar de deslizarse en línea recta.
      const bulge = inFlight * 1.9;
      const ph = data.phases[i];
      const drift = reducedMotion ? 0 : 0.22 + inFlight * 0.5;

      const px = tx + Math.sin(t * 0.6 + ph) * drift + Math.cos(ph) * bulge;
      const py =
        ty + Math.cos(t * 0.5 + ph * 1.7) * drift + Math.sin(ph * 1.3) * bulge;
      const pz =
        tz + Math.sin(t * 0.42 + ph * 0.6) * drift + Math.sin(ph) * bulge * 0.6;

      current[k] += (px - current[k]) * chase;
      current[k + 1] += (py - current[k + 1]) * chase;
      current[k + 2] += (pz - current[k + 2]) * chase;

      // Desvío hacia el dragón
      let cx = current[k];
      let cy = current[k + 1];
      let cz = current[k + 2];
      let shrink = 1;

      if (feeding > 0.001 && i % CARRIER_EVERY === 0) {
        // Cada portadora lleva su propio viaje, desfasado por su fase
        const j = (t * CARRIER_RATE + ph * 0.159) % 1;
        // Arranca lenta y llega rápida: se lee como que el dragón tira de ella
        const e = j * j;
        // Y no va en línea recta, describe un arco
        const arc = Math.sin(j * Math.PI) * 1.6;

        // Al deshacerse el viaje es el mismo, del revés: sale del dragón y
        // vuelve al layout, que es de donde se rearma la B del cierre
        const ax0 = outward ? localFront.x : cx;
        const ay0 = outward ? localFront.y : cy;
        const az0 = outward ? localFront.z : cz;
        const bx = outward ? cx : localFront.x;
        const by = outward ? cy : localFront.y;
        const bz = outward ? cz : localFront.z;

        const fx = ax0 + (bx - ax0) * e + Math.cos(ph * 2.1) * arc;
        const fy = ay0 + (by - ay0) * e + Math.sin(ph * 1.7) * arc;
        const fz = az0 + (bz - az0) * e;

        cx += (fx - cx) * feeding;
        cy += (fy - cy) * feeding;
        cz += (fz - cz) * feeding;

        /*
         * Se apaga al entrar y se enciende al salir.
         *
         * Solo con el apagado del final la pieza reaparecía de golpe en su
         * sitio al reiniciar el viaje. Cerrando el ciclo por los dos lados
         * entra desde nada y sale hacia nada, y con `feeding` a cero el
         * tamaño vuelve a ser exactamente el de siempre.
         */
        const cycle =
          smoothstep(0, 0.1, j) * (1 - smoothstep(0.82, 1, j));
        shrink = 1 - (1 - cycle) * feeding;
      }

      axisVec.set(data.axes[k], data.axes[k + 1], data.axes[k + 2]);
      const spin = reducedMotion ? ph : ph + t * (0.25 + inFlight * 1.1);
      quat.setFromAxisAngle(axisVec, spin);

      dummy.position.set(cx, cy, cz);
      dummy.quaternion.copy(quat);
      // Al asentarse las piezas crecen un poco: el layout "cuaja".
      dummy.scale.setScalar(
        data.scales[i] * shown * (0.82 + settled * 0.28) * shrink,
      );
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }

    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <instancedMesh
        ref={mesh}
        args={[geometry, undefined, count]}
        frustumCulled={false}
      >
        {/* Menos brillo que antes: el campo es soporte, no protagonista, y
            con envMap alto competía con el dragón y se mezclaban */}
        <meshStandardMaterial
          metalness={0.85}
          roughness={0.3}
          envMapIntensity={1.4}
          emissive={BRAND.cyan}
          emissiveIntensity={0.07}
        />
      </instancedMesh>
    </group>
  );
}
