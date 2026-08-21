"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import * as THREE from "three";
import AssemblyField from "./AssemblyField";
import BouwMark from "./BouwMark";
import Dragon from "./Dragon";
import { LAST_STAGE } from "./layouts";
import { spreadFor } from "./scenes";
import { BRAND } from "./logoShapes";
import { onLayoutChange, onScrollFrame, tickNow } from "@/lib/scrollTicker";
import { debug } from "@/lib/debug";

/**
 * Anclas de cada etapa, en orden.
 *
 * Los proyectos no cuentan como una sola: cada tarjeta es su propia etapa,
 * y por eso la escena dibuja una figura distinta para cada proyecto mientras
 * pasa por delante. Se resuelven contra el DOM porque los proyectos salen de
 * `content.ts` y no tienen id propio.
 */
function stageAnchors(): HTMLElement[] {
  const byId = (id: string) => document.getElementById(id);
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>("#proyectos article"),
  );

  const list = [
    byId("top"),
    ...rows,
    byId("servicios"),
    byId("proceso"),
    byId("nosotros"),
    byId("contacto"),
  ];

  return list.filter((el): el is HTMLElement => Boolean(el));
}

/**
 * Fracción de cada sección que se considera "reposo".
 * El morph ocurre fuera de esa zona, que es justo donde están las bandas
 * libres: así el ensamblaje se ve completo y no detrás de una tarjeta.
 */
const REST_MARGIN = 0.3;

/* ------------------------------------------------------------------ */
/* Cámara                                                              */
/* ------------------------------------------------------------------ */

function StageCamera({
  stageRef,
  pointerRef,
}: {
  stageRef: RefObject<number>;
  pointerRef: RefObject<{ x: number; y: number; movedAt: number }>;
}) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(-2.4, 0, 10.5));

  useFrame((_, delta) => {
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    // Cerca en los extremos (la B manda), un poco atrás en el medio para que
    // quepan los layouts anchos. Nunca tan atrás que las piezas se vuelvan polvo.
    const edge = Math.min(stage, LAST_STAGE - stage);
    const z = 10.5 + Math.min(edge, 1) * 3.2;

    // En el hero la cámara se corre a la izquierda para que la B quede a la
    // derecha del titular; en contacto vuelve al centro. El desplazamiento se
    // encoge con el aspecto, igual que el de la escena: en una ventana
    // estrecha correr la cámara a la izquierda es justo lo que echaba al
    // dragón fuera del encuadre por el otro lado.
    const heroOffset = 1 - Math.min(stage, 1);
    const spread = spreadFor(size.width / Math.max(size.height, 1));
    const x = -2.4 * heroOffset * spread;

    // Parallax suave del puntero: la cámara sigue al ratón levemente, dando
    // profundidad sin rotar el grupo del dragón (lo que causaba deformación).
    const px = pointerRef.current?.x ?? 0;
    const py = pointerRef.current?.y ?? 0;
    const pxShift = px * 0.9;
    const pyShift = py * 0.4;

    target.current.set(x + pxShift, pyShift, z);
    camera.position.lerp(
      target.current,
      1 - Math.pow(0.015, Math.min(delta, 0.05)),
    );
    camera.lookAt(x * 0.55 + pxShift * 0.45, pyShift * 0.3, 0);
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
        size={0.045}
        color={BRAND.cyanLight}
        transparent
        opacity={0.18}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Contexto WebGL                                                      */
/* ------------------------------------------------------------------ */

/**
 * Presupuesto de píxeles del lienzo.
 *
 * El compositor no guarda un búfer, guarda varios, y en coma flotante media:
 * el multimuestreado, el par de lectura/escritura y la cadena de mips del
 * bloom. A dpr 2 y 4x en una pantalla de 1080p eso son ~400 MB de destinos de
 * render — en una gráfica integrada el navegador tira el contexto y la escena
 * entera desaparece.
 *
 * Con un techo de píxeles el dpr se ajusta a la ventana: una ventana pequeña
 * se sigue viendo nítida y una grande cede resolución antes que morirse.
 */
const PIXEL_BUDGET = 4.6e6;

function maxDpr() {
  const area = window.innerWidth * window.innerHeight;
  if (!area) return 1.5;
  return THREE.MathUtils.clamp(Math.sqrt(PIXEL_BUDGET / area), 1, 2);
}

/**
 * Bloom con termostato.
 *
 * El compositor se queda montado —desmontarlo tira los búferes y el
 * remontaje da un tirón— pero solo trabaja donde hay clímax: la portada y el
 * remate con fuego. En medio la intensidad baja a cero y, ya apagado del
 * todo, se desactiva el paso entero y three vuelve a dibujar directo al
 * lienzo. El antialias del contexto cubre el borde mientras tanto, así que
 * el corte no se ve.
 */
const BLOOM_MAX = 1.1;

function BloomHeat({
  heatRef,
  bloomRef,
  onToggle,
}: {
  heatRef: RefObject<number>;
  bloomRef: RefObject<BloomEffect | null>;
  onToggle: (on: boolean) => void;
}) {
  const value = useRef(1);
  const on = useRef(true);

  useFrame((_, delta) => {
    const heat = THREE.MathUtils.clamp(heatRef.current ?? 0, 0, 1);
    value.current +=
      (heat - value.current) * (1 - Math.pow(0.02, Math.min(delta, 0.05)));

    const bloom = bloomRef.current;
    if (bloom) bloom.intensity = BLOOM_MAX * value.current;

    // El interruptor solo se toca al cruzar el umbral: un `setState` por
    // fotograma sería peor que el propio bloom
    const next = value.current > 0.02;
    if (next !== on.current) {
      on.current = next;
      onToggle(next);
    }
  });

  return null;
}

/**
 * Red de seguridad.
 *
 * Si el contexto se pierde igual, `preventDefault` es lo que deja al navegador
 * intentar devolverlo — sin eso la pérdida es definitiva. Y al recuperarlo se
 * entra en modo degradado: sin compositor, que es justo lo que se comía la
 * memoria. Mejor una escena sin bloom que un hueco negro.
 */
function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onLost();
      /*
       * Y se avisa fuera del lienzo para que lo remonten entero.
       *
       * `preventDefault` deja al navegador intentar devolver el contexto,
       * pero R3F no sobrevive al hueco: sigue leyendo el contexto ya nulo y
       * revienta con un `Cannot read properties of null (reading 'alpha')`
       * desde su propio bucle. Al ser un error dentro de un
       * `requestAnimationFrame`, ninguna frontera de error de React lo
       * atrapa — se lleva la escena entera por delante y la página se queda
       * sin fondo, sin dragón y sin aviso.
       *
       * Un montaje nuevo arranca con un contexto nuevo y se acabó.
       */
      window.dispatchEvent(new CustomEvent("bouw:context-lost"));
    };
    const restored = () => invalidate();
    canvas.addEventListener("webglcontextlost", lost);
    canvas.addEventListener("webglcontextrestored", restored);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
    };
  }, [gl, invalidate, onLost]);

  return null;
}

/* ------------------------------------------------------------------ */
/* Raíz de la escena                                                   */
/* ------------------------------------------------------------------ */

export default function SceneRoot() {
  const stageRef = useRef(0);
  /*
   * Puntero en coordenadas normalizadas, y el instante del último movimiento.
   *
   * La marca de tiempo es lo que le da al dragón la señal de que el visitante
   * ha parado: pasado un momento quieto levanta la vista y busca el cursor.
   * Ver `GAZE_*` en `Dragon.tsx`.
   */
  const pointerRef = useRef({ x: 0, y: 0, movedAt: 0 });
  // Puente entre el dragón y el campo de piezas: el dragón publica dónde está
  // su frente de construcción y el campo manda piezas ahí
  const frontRef = useRef(new THREE.Vector3());
  const buildRef = useRef(0);
  const flowRef = useRef(0);
  /** Dónde vale la pena el bloom: portada y remate. */
  const heatRef = useRef(1);
  /** Avance dentro de la sección en la que está posado el dragón, 0 … 1. */
  const localRef = useRef(0);
  const bloomRef = useRef<BloomEffect | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [small, setSmall] = useState(false);
  const [dpr, setDpr] = useState(1.5);
  const [degraded, setDegraded] = useState(false);
  const [bloomOn, setBloomOn] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      setReducedMotion(motion.matches);
      setSmall(width.matches);
      setDpr(maxDpr());
    };
    apply();
    motion.addEventListener("change", apply);
    width.addEventListener("change", apply);
    window.addEventListener("resize", apply, { passive: true });
    return () => {
      motion.removeEventListener("change", apply);
      width.removeEventListener("change", apply);
      window.removeEventListener("resize", apply);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointerRef.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      pointerRef.current.movedAt = performance.now();
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
    /*
     * Las zonas de reposo se miden aparte del scroll.
     *
     * Antes esto vivía dentro del bucle de scroll: cada fotograma buscaba las
     * anclas en el DOM y pedía nueve `getBoundingClientRect`. Eso obliga al
     * navegador a rehacer el layout de forma síncrona sesenta veces por
     * segundo, con la escena 3D compitiendo por el mismo hilo — era la mitad
     * del tirón al bajar.
     *
     * Ahora se mide cuando cambia algo que puede moverlas —tamaño de ventana
     * o alto del documento— y durante el scroll solo se lee `scrollY`, que no
     * cuesta layout.
     */
    let rests: { start: number; end: number }[] = [];

    const measure = () => {
      const vh = window.innerHeight || 1;
      const anchors = stageAnchors();
      // Si el DOM todavía no tiene todas las anclas, no movemos nada.
      if (anchors.length !== LAST_STAGE + 1) {
        rests = [];
        return;
      }

      const next: { start: number; end: number }[] = [];
      for (const el of anchors) {
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        // El margen se acota en píxeles: sin esto, una sección muy alta
        // se comería la transición entera y el morph pasaría detrás del
        // contenido en vez de en el hueco libre.
        const margin = Math.min(r.height * REST_MARGIN, vh * 0.45);
        next.push({ start: top + margin, end: top + r.height - margin });
      }
      rests = next;
    };

    /** Etapa continua a partir del centro de la pantalla. */
    const stageAt = (y: number) => {
      const last = rests.length - 1;
      if (y <= rests[0].end) return 0;
      if (y >= rests[last].start) return last;

      for (let i = 0; i < last; i++) {
        if (y >= rests[i].start && y <= rests[i].end) return i;
        if (y > rests[i].end && y < rests[i + 1].start) {
          const span = rests[i + 1].start - rests[i].end;
          return i + (y - rests[i].end) / Math.max(span, 1);
        }
      }
      return last;
    };

    const compute = () => {
      if (rests.length !== LAST_STAGE + 1) return;

      // La etapa congelada gana al scroll: es lo que hace que una captura de
      // un momento concreto sea reproducible en vez de aproximada
      const stage =
        debug.stageLock ?? stageAt(window.scrollY + window.innerHeight / 2);
      stageRef.current = stage;

      /*
       * Dónde vale la pena el compositor: la portada, donde el bicho entra
       * como plano encendido, y el remate, donde escupe fuego. En medio vuela
       * al fondo y detrás del velo, y ahí el florecido no aporta nada que
       * justifique una cadena de mips por fotograma.
       */
      heatRef.current = Math.max(
        1 - THREE.MathUtils.smoothstep(stage, 0.35, 1.5),
        THREE.MathUtils.smoothstep(stage, LAST_STAGE - 1.9, LAST_STAGE - 0.7),
      );

      /*
       * Avance dentro de la zona de reposo actual.
       *
       * La etapa se congela en un entero mientras el centro de la pantalla
       * recorre una sección — que es justo lo que queremos para el dragón,
       * pero deja sin señal a todo lo que sí tiene que seguir al scroll
       * dentro del bloque, como el barrido de Proceso.
       */
      const i = Math.round(stage);
      const band = rests[Math.min(Math.max(i, 0), rests.length - 1)];
      const span = Math.max(band.end - band.start, 1);
      localRef.current = THREE.MathUtils.clamp(
        (window.scrollY + window.innerHeight / 2 - band.start) / span,
        0,
        1,
      );
    };

    const remeasure = () => {
      measure();
      compute();
    };

    remeasure();
    const offScroll = onScrollFrame(compute);
    const offLayout = onLayoutChange(remeasure);
    tickNow();

    return () => {
      offScroll();
      offLayout();
    };
  }, []);

  // `useCallback` porque el guardián lo lleva en las dependencias del efecto:
  // sin estabilizarlo volvería a suscribirse en cada render
  const onContextLost = useCallback(() => setDegraded(true), []);

  /*
   * Tres motores de movimiento compitiendo —dragón, piezas y polvo— no dan
   * tres veces más vida: dan ruido sin jerarquía, y ninguno se lee. Ahora
   * manda la criatura y el resto es acompañamiento, así que hay bastante
   * menos de las dos cosas que la acompañan.
   */
  /*
   * Menos piezas.
   *
   * Ciento cuarenta cubos de colores flotando por delante del texto no se
   * leen como ingeniería: se leen como confeti. Es el elemento que más
   * abarataba la página — el que la hacía parecerse a cualquier plantilla con
   * partículas. Con la mitad, las piezas vuelven a leerse como lo que son:
   * despiece de la marca, no relleno.
   */
  const pieceCount = small ? 48 : 72;
  const dustCount = small ? 18 : 28;

  return (
    <Canvas
      // Todas las muestras por píxel que quepan en el presupuesto: la escama
      // del dragón es detalle de alta frecuencia y agradece cada una, pero no
      // a costa de quedarse sin contexto
      dpr={[1, small ? Math.min(dpr, 1.5) : dpr]}
      gl={{
        // El compositor hace su propio MSAA en escritorio; esto cubre el móvil,
        // que no lo lleva, y el blit final del compositor
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        // Exposición más alta: los brillos de escama y el rim cían deben cantar
        toneMappingExposure: 1.18,
      }}
      camera={{ position: [-2.4, 0, 10.5], fov: 38 }}
      style={{ pointerEvents: "none" }}
    >
      {/*
        Ambiente muy bajo: la luz plana come el volumen. El relleno lo dan
        las luces posicionadas y el Environment.
      */}
      <ambientLight intensity={0.22} />

      {/* Luz principal: ámbar cálido desde arriba-derecha (sol de tarde) */}
      <directionalLight position={[8, 10, 5]} intensity={3.2} color="#ffd080" />

      {/* Contraluz cían: recorta la silueta del dragón como fuego frío.
          Es el efecto más visible de la imagen de referencia. */}
      <directionalLight
        position={[-6, -2, -8]}
        intensity={2.8}
        color={BRAND.cyanLight}
      />

      {/* Fill naranja para el vientre y las alas desde abajo */}
      <directionalLight
        position={[-4, -6, 4]}
        intensity={1.4}
        color={BRAND.orange}
      />

      {/* Point de cerca: la brasa del ojo y las juntas de escama */}
      <pointLight
        position={[3, 1, 6]}
        intensity={55}
        color="#ff8040"
        distance={28}
      />

      {/* Relleno frío de arriba: para que la cabeza no quede completamente oscura */}
      <pointLight
        position={[0, 6, 4]}
        intensity={20}
        color="#c0e8ff"
        distance={20}
      />

      <StageCamera stageRef={stageRef} pointerRef={pointerRef} />
      <BouwMark
        stageRef={stageRef}
        pointerRef={pointerRef}
        reducedMotion={reducedMotion}
      />
      {/*
        El dragón va antes que el campo a propósito: R3F ejecuta los `useFrame`
        en orden de montaje, así que el frente de construcción está ya escrito
        cuando las piezas lo leen para saber a dónde volar.
      */}
      <Dragon
        stageRef={stageRef}
        reducedMotion={reducedMotion}
        frontRef={frontRef}
        buildRef={buildRef}
        flowRef={flowRef}
        localRef={localRef}
        pointerRef={pointerRef}
      />
      <AssemblyField
        stageRef={stageRef}
        pointerRef={pointerRef}
        count={pieceCount}
        reducedMotion={reducedMotion}
        frontRef={frontRef}
        flowRef={flowRef}
      />
      <ParticleField count={dustCount} />

      {/* Estudio de luz propio: sin descargar HDRIs externos */}
      <Environment resolution={256} frames={1}>
        {/* Domo superior: azul de cielo cálido */}
        <Lightformer
          intensity={2.2}
          position={[0, 5, -4]}
          scale={[14, 5, 1]}
          color="#ffe8b0"
        />
        {/* Lateral cián: el rim de las alas y el lomo */}
        <Lightformer
          intensity={3.5}
          position={[-7, 0, 0]}
          scale={[3, 10, 1]}
          color={BRAND.cyanLight}
        />
        {/* Lateral naranja: el vientre y el borde de las membranas */}
        <Lightformer
          intensity={2.0}
          position={[7, -2, 2]}
          scale={[3, 8, 1]}
          color="#ff8040"
        />
        {/* Suelo: reflejo cálido desde abajo */}
        <Lightformer
          intensity={0.8}
          position={[0, -6, 3]}
          scale={[12, 3, 1]}
          color="#7a4020"
        />
      </Environment>

      <ContextGuard onLost={onContextLost} />

      {!small && !degraded && (
        /*
         * El compositor, sin multimuestreado.
         *
         * Llevaba MSAA 2x sobre el búfer HDR por los dientes, las garras y el
         * borde del ala, que en escorzo miden un píxel. Medido en el panel,
         * eso costaba **12 fps de los 60**: la portada iba a 36 y el resto de
         * la página a 60 clavados. O sea que las dos pantallas donde la página
         * quiere impresionar eran las dos únicas que iban a tirones.
         *
         * Y no era el florecido: bajar la cadena de mips a cuatro niveles no
         * cambió nada, y quitar el multimuestreado subió de 36 a 48. Lo caro
         * es resolver un búfer de coma flotante a dos muestras por píxel, no
         * desenfocarlo.
         *
         * Comparadas las dos capturas del mismo fotograma, la diferencia en el
         * borde no se distingue — a un bicho que ocupa un tercio de la ventana
         * y no para quieto, doce fotogramas por segundo le hacen mucho más que
         * media muestra de borde. El `antialias` del contexto sigue cubriendo
         * el resto de la página, que es donde el compositor está apagado y se
         * dibuja directo al lienzo.
         */
        <>
          <BloomHeat
            heatRef={heatRef}
            bloomRef={bloomRef}
            onToggle={setBloomOn}
          />
          <EffectComposer
            enabled={bloomOn}
            enableNormalPass={false}
            multisampling={0}
          >
            <Bloom
              ref={bloomRef}
              // Umbral más bajo: la brasa de las juntas, el iris, las espinas
              // y el rim cián deben florecer — no solo la llama
              intensity={BLOOM_MAX}
              luminanceThreshold={0.52}
              luminanceSmoothing={0.22}
              mipmapBlur
            />
          </EffectComposer>
        </>
      )}
    </Canvas>
  );
}
