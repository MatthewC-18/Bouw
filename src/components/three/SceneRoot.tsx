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
import Dragon from "./Dragon";
import WordMark from "./WordMark";
import { LAST_STAGE } from "./layouts";
import { spreadFor } from "./scenes";
import { BRAND } from "./logoShapes";
import { onLayoutChange, onScrollFrame, tickNow } from "@/lib/scrollTicker";
import { dragonScreen } from "@/lib/dragonScreen";
import { debug } from "@/lib/debug";
import { perf } from "@/lib/perfFlags";
import { detectTier, TIERS, type TierConfig } from "@/lib/gpuTier";

/**
 * Anclas de cada etapa, en orden.
 *
 * Los proyectos no cuentan como una sola: cada tarjeta es su propia etapa,
 * y por eso la escena dibuja una figura distinta para cada proyecto mientras
 * pasa por delante. Se resuelven contra el DOM porque los proyectos salen de
 * `content.ts` y no tienen id propio.
 */
/** Etapas que reserva `scenes.ts` para Proyectos (la 1 a la 4). */
const PROJECT_STAGES = 4;

function stageAnchors(): HTMLElement[] {
  const byId = (id: string) => document.getElementById(id);
  const rows = Array.from(
    document.querySelectorAll<HTMLElement>("#proyectos article"),
  );
  /*
   * Con menos fichas que etapas, el encabezado de la sección ocupa la que
   * falta.
   *
   * Al quitar un proyecto la lista se quedaba en ocho anclas para nueve
   * etapas, `measure` la daba por incompleta y la etapa se quedaba en 0 en
   * toda la página: el dragón no salía nunca de la portada, ni se construía,
   * ni escupía fuego en contacto. Y no daba ningún error — simplemente no
   * pasaba nada.
   *
   * El encabezado es la etapa natural: es lo primero que se lee de la
   * sección, y con él delante cada ficha cae en el escenario del lado de su
   * maqueta.
   */
  const header = document.querySelector<HTMLElement>("#proyectos [data-stage-anchor]");
  const projects =
    rows.length >= PROJECT_STAGES || !header
      ? rows.slice(0, PROJECT_STAGES)
      : [header, ...rows];

  const list = [
    byId("top"),
    ...projects,
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

    // Cerca en los extremos (la palabra manda), un poco atrás en el medio para que
    // quepan los layouts anchos. Nunca tan atrás que las piezas se vuelvan polvo.
    /*
     * Distancia fija. Se alejaba en mitad del recorrido para que cupieran los
     * circuitos de vuelo; con el dragón posado en las perchas, alejarse solo
     * lo encogería de una sección a otra.
     */
    const z = 10.5;

    // En el hero la cámara se corre a la izquierda para que la palabra quede a
    // la derecha del titular; en contacto vuelve al centro. El desplazamiento se
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
function maxDpr(budget: number) {
  const area = window.innerWidth * window.innerHeight;
  if (!area) return 1;
  // En gráfica integrada el presupuesto queda por debajo de un píxel de
  // lienzo por píxel CSS: el dragón se mueve siempre, y a esa velocidad la
  // diferencia de nitidez no se ve; la de fluidez sí.
  return THREE.MathUtils.clamp(Math.sqrt(budget / area), 0.6, 2);
}

/**
 * Bajada automática de calidad.
 *
 * El nombre de la gráfica no lo dice todo: un portátil con dedicada en modo
 * ahorro rinde como una integrada. Si en dos ventanas seguidas de dos segundos
 * la página no pasa de 40 fps, la escena pasa al nivel bajo y se queda ahí.
 */
function useFpsGuard(active: boolean, onSlow: () => void) {
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let frames = 0;
    let start = 0;
    let strikes = 0;
    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (!start) start = t;
      frames++;
      if (t - start >= 2000) {
        const fps = (frames * 1000) / (t - start);
        // Pestaña en segundo plano: el navegador frena el rAF, no cuenta
        if (document.visibilityState === "visible" && fps > 3) {
          strikes = fps < 40 ? strikes + 1 : 0;
          if (strikes >= 2) {
            onSlow();
            cancelAnimationFrame(raf);
            return;
          }
        }
        frames = 0;
        start = t;
      }
    };
    // Se empieza a vigilar después del arranque, que siempre da tirones
    const delay = window.setTimeout(() => (raf = requestAnimationFrame(tick)), 4000);
    return () => {
      window.clearTimeout(delay);
      cancelAnimationFrame(raf);
    };
  }, [active, onSlow]);
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

/**
 * Calentamiento de la GPU al cargar.
 *
 * Sin esto, cada material se compilaba la primera vez que aparecía en
 * pantalla —el dragón en malla al llegar a Proyectos, el fuego al final— y la
 * textura del dragón (1,2 MB) subía a la GPU en ese mismo fotograma. Eran los
 * tirones de la primera bajada, justo la que ve el visitante. Aquí se hace todo
 * al arrancar, en paralelo si el driver lo permite (`compileAsync`). `compile`
 * recorre también los objetos ocultos, así que entran los de etapas tardías.
 */
function GpuWarmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    const id = window.setTimeout(async () => {
      /*
       * `compileAsync` a mano. El de three.js pregunta en un temporizador por
       * el programa de cada material, y si entretanto se rehízo (cambio de
       * idioma, escena que se monta otra vez) el programa ya no existe y
       * lanza «reading 'isReady'» fuera de cualquier `try`. Aquí un material
       * sin programa se da por listo: lo compilará al dibujarse, como antes.
       */
      try {
        const pending = gl.compile(scene, camera);
        await new Promise<void>((done) => {
          const check = () => {
            if (!alive) return done();
            for (const m of pending) {
              const program = (gl.properties.get(m) as { currentProgram?: { isReady(): boolean } })
                .currentProgram;
              if (!program || program.isReady()) pending.delete(m);
            }
            if (pending.size === 0) done();
            else window.setTimeout(check, 10);
          };
          check();
        });
      } catch {
        // Un material que no compile aquí lo hará al dibujarse, como antes
      }
      if (!alive) return;
      const seen = new Set<THREE.Texture>();
      scene.traverse((o) => {
        const mats = (o as THREE.Mesh).material;
        for (const m of Array.isArray(mats) ? mats : mats ? [mats] : []) {
          for (const v of Object.values(m)) {
            if (v instanceof THREE.Texture && !seen.has(v)) {
              seen.add(v);
              gl.initTexture(v);
            }
          }
        }
      });
    }, 200);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [gl, scene, camera]);
  return null;
}

/**
 * Cada cuánto se dibuja la escena.
 *
 * Con `frameloop="demand"` R3F solo dibuja cuando se le pide; esto se lo pide.
 * El scroll de la página no depende de esto —lo compone el navegador— así que
 * el texto sigue bajando a 60 aunque el dragón se dibuje a 30.
 *
 * `fps` es el tope; 0 es sin tope, un fotograma por cada uno de la pantalla.
 */
function FrameCap({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const step = fps > 0 ? 1000 / fps : 0;
    const root = document.documentElement;

    /*
     * A ritmo entero mientras la página se mueve o el dragón vuela o anda.
     *
     * Posado, el dragón va pegado a su percha y la página la mueve el
     * compositor a 60: con la escena a 30 el bicho iba a saltos al lado del
     * texto, que se desliza («cuando sale del borde se traba», Matthew,
     * 4 oct 2026). Antes solo se pagaba en la portada; fuera de ella la escena
     * es solo el dragón, pequeño, y el ritmo entero sale casi gratis (medido:
     * los mismos tirones con dragón que sin él).
     */
    const pinnedToPage = () =>
      root.hasAttribute("data-scrolling") || dragonScreen.moving;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      // Medio fotograma de holgura: a 60 Hz con tope 30, dibuja uno sí y uno no
      if (step === 0 || t - last >= step - 4 || pinnedToPage()) {
        last = t;
        invalidate();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);
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
  /** Dónde vale la pena el bloom: portada y remate. */
  const heatRef = useRef(1);
  const bloomRef = useRef<BloomEffect | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [small, setSmall] = useState(false);
  const [quality, setQuality] = useState<TierConfig>(() => detectTier());
  const [dpr, setDpr] = useState(() => maxDpr(quality.pixelBudget));
  const [degraded, setDegraded] = useState(false);
  const [bloomOn, setBloomOn] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const width = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      setReducedMotion(motion.matches);
      setSmall(width.matches);
      setDpr(maxDpr(quality.pixelBudget));
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
  }, [quality.pixelBudget]);

  const toLow = useCallback(() => setQuality(TIERS.low), []);
  useFpsGuard(quality.tier === "high" && !perf.fps, toLow);

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

  const fpsCap = perf.fps ?? quality.fps;
  const dprMax = small ? Math.min(dpr, 1.5) : dpr;

  return (
    <Canvas
      // Todas las muestras por píxel que quepan en el presupuesto: la escama
      // del dragón es detalle de alta frecuencia y agradece cada una, pero no
      // a costa de quedarse sin contexto
      dpr={perf.dpr ? [perf.dpr, perf.dpr] : [Math.min(1, dprMax), dprMax]}
      gl={{
        // El compositor hace su propio MSAA en escritorio; esto cubre el móvil,
        // que no lo lleva, y el blit final del compositor
        antialias: !perf.aa0,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        // Exposición más alta: los brillos de escama y el rim cían deben cantar
        toneMappingExposure: 1.18,
      }}
      camera={{ position: [-2.4, 0, 10.5], fov: 38 }}
      style={{ pointerEvents: "none" }}
      frameloop="demand"
    >
      <FrameCap fps={fpsCap ?? 0} />
      {/*
        Ambiente muy bajo: la luz plana come el volumen. El relleno lo dan
        las luces posicionadas y el Environment.
      */}
      <ambientLight intensity={0.22} />

      {/*
        Luz principal: blanco cálido desde arriba-derecha.

        Era ámbar (#ffd080), y con el fill y el punto naranjas de abajo la
        escena entera salía color bronce. Tenía sentido con el dragón de antes,
        de piel casi negra y teñida a mano; el de Rodin trae su propia piel
        —grafito azulado y hueso— y el ámbar le volvía naranjas las membranas.
        La marca es azul y cian: el naranja queda para el fuego.
      */}
      <directionalLight position={[8, 10, 5]} intensity={2.8} color="#fff1e0" />

      {/* Contraluz cían: recorta la silueta del dragón como fuego frío.
          Es el efecto más visible de la imagen de referencia. */}
      <directionalLight
        position={[-6, -2, -8]}
        intensity={2.8}
        color={BRAND.cyanLight}
      />

      {/* Relleno azul acero para el vientre y las alas desde abajo */}
      {!perf.lights2 && <directionalLight
        position={[-4, -6, 4]}
        intensity={1.1}
        color="#6f8fb8"
      />}

      {/* Punto de cerca: un brillo tibio en el ojo y las juntas, ya sin brasa */}
      {!perf.lights2 && <pointLight
        position={[3, 1, 6]}
        intensity={22}
        color="#ffc49a"
        distance={28}
      />}

      {/* Relleno frío de arriba: para que la cabeza no quede completamente oscura */}
      {!perf.lights2 && <pointLight
        position={[0, 6, 4]}
        intensity={20}
        color="#c0e8ff"
        distance={20}
      />}

      <StageCamera stageRef={stageRef} pointerRef={pointerRef} />
      {/*
        La palabra va antes que el dragón a propósito: R3F ejecuta los
        `useFrame` en orden de montaje, y la palabra escribe dónde está la W
        antes de que el dragón la lea para posarse.

        Ya no hay campo de piezas ni polvo: con la escena por delante de la
        página flotarían encima del texto, y su trabajo —acompañar al dragón
        en vuelo— dejó de existir con el dragón posado.
      */}
      {!perf.nomark && <WordMark
        stageRef={stageRef}
        pointerRef={pointerRef}
        reducedMotion={reducedMotion}
      />}
      {!perf.nodragon && <Dragon
        reducedMotion={reducedMotion}
        pointerRef={pointerRef}
      />}

      {/* Estudio de luz propio: sin descargar HDRIs externos */}
      {!perf.noenv && <Environment resolution={256} frames={1}>
        {/* Domo superior: blanco de estudio, apenas tibio */}
        <Lightformer
          intensity={2.0}
          position={[0, 5, -4]}
          scale={[14, 5, 1]}
          color="#f4f1ea"
        />
        {/* Lateral cián: el rim de las alas y el lomo */}
        <Lightformer
          intensity={3.5}
          position={[-7, 0, 0]}
          scale={[3, 10, 1]}
          color={BRAND.cyanLight}
        />
        {/* Lateral tibio, más bajo que antes: el borde de las membranas */}
        <Lightformer
          intensity={1.1}
          position={[7, -2, 2]}
          scale={[3, 8, 1]}
          color="#ffc49a"
        />
        {/* Suelo: reflejo azul de noche desde abajo */}
        <Lightformer
          intensity={0.8}
          position={[0, -6, 3]}
          scale={[12, 3, 1]}
          color="#1d3550"
        />
      </Environment>}

      <ContextGuard onLost={onContextLost} />
      <GpuWarmup />

      {!small && !degraded && quality.bloom && !perf.nobloom && (
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
