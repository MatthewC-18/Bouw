"use client";

/**
 * Modo depuración.
 *
 * Existe por una razón concreta: la animación de esta escena se ha estado
 * ajustando a ciegas. Sin poder ver la página, la única forma de saber si un
 * número está bien es calcularlo — y el cálculo acierta la dirección pero
 * nunca la dosis. Llevamos varias rondas de "va en el sentido correcto pero
 * se queda corto".
 *
 * Esto convierte una captura de pantalla en una medición. Con el panel
 * abierto, una sola imagen dice a qué tamaño real se ve el bicho, a qué
 * velocidad va, cuánto arrastra la cola y en qué punto del recorrido está.
 *
 * Se activa por URL y nunca se monta en producción:
 *
 *   ?debug         panel de números
 *   ?stage=6.5     congela el recorrido en esa etapa
 *   ?slow=0.25     ralentiza el tiempo de la escena
 *
 * Congelar la etapa es lo que hace que una captura sea reproducible: se puede
 * pedir "mándame el clímax del troquel" y que sea siempre el mismo fotograma
 * en vez de aproximadamente por ahí.
 */

export type DebugStats = {
  /** Etapa cruda del scroll y la que ve el dragón tras el muelle. */
  stage: number;
  eased: number;
  /** 0 en el centro de una sección, 1 en mitad del salto. */
  travel: number;
  /** Alto del dragón en pantalla, en porcentaje del alto de ventana. */
  sizePct: number;
  /**
   * Centro del dragón en pantalla, en porcentaje. 0 es el borde izquierdo,
   * 100 el derecho. Fuera de [0, 100] significa fuera de encuadre — que es
   * exactamente lo que estaba pasando y no se veía venir de ninguna otra
   * forma.
   */
  screenX: number;
  screenY: number;
  /** Relación de aspecto de la ventana. */
  aspect: number;
  /** Distancia a cámara, en unidades de mundo. */
  depth: number;
  /** Módulo y componente vertical de la velocidad, en unidades/s. */
  speed: number;
  climb: number;
  /** Cuánto planea (1) frente a cuánto bate (0). */
  settle: number;
  /** Aleteo: batidas por segundo y amplitud en grados. */
  beat: number;
  amp: number;
  /** Arrastre de la cola y anticipación de la cabeza, en grados. */
  whip: number;
  look: number;
  /** Cuánto manda el cursor en el cuello, 0 … 1. */
  gaze: number;
  /** Ángulo que le falta al cuello para llegar al cursor, en grados. */
  gazeNeed: number;
  /** Alabeo, en grados. */
  bank: number;
  /** Lo que el visitante acaba de marcar, viajando hacia el dragón. */
  handoff: number;
  /** Estado del material. */
  build: number;
  scan: number;
  split: number;
};

export const debug = {
  /** Panel visible. */
  on: false,
  /**
   * Uniformes vivos del dragón, colgados aquí con el panel abierto.
   *
   * Sirve para lo que ninguna captura resuelve: aislar una sola parte de la
   * deformación. Fijar `uLeg` a mano y comparar dos fotogramas dice si la
   * pata se mueve de verdad, sin que el resto del animal cambie de sitio y
   * enturbie la comparación.
   */
  uniforms: null as Record<string, { value: unknown }> | null,
  /**
   * Candado de las patas: [recogida, balanceo, patada] en radianes.
   *
   * Escribir el uniforme desde la consola no sirve de nada, porque el bucle
   * lo recalcula en el fotograma siguiente. Esto lo fija después del cálculo,
   * que es lo único que permite comparar dos posturas de pata con el resto
   * del animal inmóvil — la prueba que decide si la pata se mueve o no.
   */
  legLock: null as [number, number, number] | null,
  /** Lo mismo para la caña: [pliegue, balanceo, patada]. */
  shinLock: null as [number, number, number] | null,
  /** Etapa congelada, o null para seguir el scroll. */
  stageLock: null as number | null,
  /** Multiplicador del tiempo de la escena. 0 congela el fotograma. */
  timeScale: 1,
  stats: {
    stage: 0,
    eased: 0,
    travel: 0,
    sizePct: 0,
    screenX: 50,
    screenY: 50,
    aspect: 1.78,
    depth: 0,
    speed: 0,
    climb: 0,
    settle: 0,
    beat: 0,
    amp: 0,
    whip: 0,
    look: 0,
    gaze: 0,
    gazeNeed: 0,
    bank: 0,
    handoff: 0,
    build: 0,
    scan: 0,
    split: 0,
  } as DebugStats,
};

/*
 * Se lee al importar, no en un efecto: el lienzo empieza a dibujar antes de
 * que corran los efectos del panel, y si la etapa congelada llegase tarde el
 * dragón daría un salto en el primer fotograma.
 */
if (typeof window !== "undefined") {
  const q = new URLSearchParams(window.location.search);
  const stage = q.get("stage");
  const slow = q.get("slow");

  debug.on = q.has("debug") || stage !== null || slow !== null;
  if (stage !== null && stage !== "" && Number.isFinite(Number(stage))) {
    debug.stageLock = Number(stage);
  }
  if (slow !== null && Number.isFinite(Number(slow))) {
    debug.timeScale = Math.max(Number(slow), 0);
  }

  /*
   * Con el panel abierto, el objeto queda colgado de `window`.
   *
   * Es lo que permite barrer el recorrido entero desde la consola —fijar la
   * etapa, leer dónde cae el bicho, pasar a la siguiente— en vez de recargar
   * la página una vez por sección. Solo existe en desarrollo y solo con
   * `?debug`.
   */
  if (debug.on) {
    (window as unknown as { __bouw?: typeof debug }).__bouw = debug;
  }
}
