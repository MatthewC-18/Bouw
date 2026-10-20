"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import FireBreath from "./FireBreath";
import { BRAND } from "./logoShapes";
import { perch } from "./perch";
import { splitUniforms } from "./planSplitMaterial";
import { dragonScreen } from "@/lib/dragonScreen";
import { planSplit } from "@/lib/planSplit";
import { onLayoutChange } from "@/lib/scrollTicker";
import { debug } from "@/lib/debug";

/**
 * El dragón del logo, posado.
 *
 * Vive en perchas. Cada sección marca su sitio con `data-perch` (la esquina
 * del panel de cada proyecto, el titular de cada capítulo…) y la portada tiene
 * la suya en la W de la palabra 3D. El dragón está posado en la que tienes
 * delante, pequeño, respirando y mirándote; al cambiar de sección despega y
 * vuela a la siguiente. Si bajas de golpe tres secciones, hace un solo vuelo a
 * la última.
 *
 * Lleva esqueleto (3 oct 2026): el GLB trae 53 huesos y siete clips hechos en
 * Blender (`Bouw/dragon3d/rig/dragon-rig.blend` y `clips_extra.py`): `vuelo`,
 * `planeo`, `frenado`, `fuego`, `rugido`, `estirarse` y `caminar`. Aquí se
 * mezclan por peso y encima se suma lo que depende de la página: la mirada, la
 * respiración y la cola.
 *
 * Lo que hace por su cuenta (Matthew, 3 oct 2026):
 * - En cada percha busca un hueco donde no tape ningún texto.
 * - En «Contáctanos» se posa al principio de la palabra, la recorre andando y
 *   al llegar al final escupe fuego sobre ella.
 * - Si el visitante se queda quieto un rato, pasea por su percha, se estira o
 *   mira alrededor.
 * - Al tocarlo alterna fuego y rugido.
 */

type Props = {
  reducedMotion: boolean;
  /**
   * Puntero en coordenadas de dispositivo normalizadas, y cuándo se movió por
   * última vez. De aquí sale la mirada.
   */
  pointerRef: RefObject<{ x: number; y: number; movedAt: number }>;
};

/* ------------------------------------------------------------------ */
/* Pre-carga                                                           */
/* ------------------------------------------------------------------ */

const MODEL_PATH = "/dragon.glb";
useGLTF.preload(MODEL_PATH);

/* ------------------------------------------------------------------ */
/* Posado                                                              */
/* ------------------------------------------------------------------ */

/**
 * Tamaño posado.
 *
 * En la W, sobre la escala de la palabra: 0.26 deja al bicho 1.7 veces el alto
 * de las letras, que es la proporción del logo. En las demás perchas, en mundo
 * y fijo: unos 240 px de envergadura en una ventana de 864 de alto.
 */
const PERCH_SCALE = 0.26;
const DOM_SCALE = 0.2;
/**
 * Giro sobre la W: de tres cuartos mirando a la derecha, como en el logo.
 * En las demás perchas mira hacia el centro de la pantalla, también de tres
 * cuartos: hacia el texto que acompaña, y hacia quien lee.
 */
const PERCH_TURN = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-0.06, 0.75, 0, "YXZ"),
);
const DOM_YAW = 0.8;
/** Punto de apoyo preferido: a un octavo del ancho desde la esquina marcada. */
const CORNER_INSET = 0.12;
/**
 * Qué percha manda: la que está más cerca de media ventana, entre `VIEW_FROM`
 * y `VIEW_TO`. Por arriba no se acepta nada por encima de un cuarto de la
 * ventana: el bicho se para ENCIMA del apoyo y quedaría debajo de la barra.
 */
const READ_LINE = 0.5;
const VIEW_FROM = 0.26;
/**
 * Por abajo, hasta el borde y no más. Con 1.1 escogía perchas un palmo por
 * debajo de la ventana y, si el visitante paraba ahí, se posaba sin que se
 * le viera.
 */
const VIEW_TO = 0.95;
/**
 * Una percha «se ve» si el bicho entero cabe encima de ella: por debajo de la
 * barra y de su propio alto. Con el scroll en marcha despega en cuanto su
 * percha sube de aquí, antes de quedar medio tapado por la barra.
 */
const SEEN_FROM = 0.24;
const SEEN_TO = 0.98;
/**
 * Quieto, se queda en su percha mientras esta siga por debajo de la barra,
 * en vez de cambiarse a otra más cerca del centro.
 */
const STAY_FROM = 0.1;
/**
 * Con el scroll en marcha no va posado. Una percha se mueve con la página y
 * el bicho encima, en su pose de posado, se desliza como una pegatina: «no es
 * como que se queda sino que baja con la página en esa pose y se ve mal»
 * (Matthew, 14 oct 2026). Así que al empezar a bajar despega y se sostiene en
 * el aire donde estaba, batiendo alas, mientras la página pasa por debajo; y
 * cuando el visitante para, se posa en la percha que tenga a la vista.
 *
 * `LIFT_PX`: lo que hay que bajar seguido para que despegue (un toque de la
 * rueda no lo mueve). `SETTLE`: segundos sin scroll para darlo por parado.
 * `LIFT_TIME`: el salto del despegue, corto, que no es un viaje.
 */
const LIFT_PX = 60;
/** Radio base del botón invisible que viaja encima del bicho, en px. */
const HIT_BASE = 50;
const SETTLE = 0.45;
const LIFT_TIME = 0.8;
/**
 * Sin ninguna percha a la vista no se adelanta a una que aún no ha entrado:
 * vuela a tu lado, en el aire, hasta que aparece una. Es una percha más con
 * este nombre, sin elemento.
 */
const AIR_SPOT = "aire";
/** Cada cuánto busca, volando a tu lado, el hueco con menos texto debajo. */
const AIR_RECHECK = 0.7;
/** Con la portada a la vista manda la W, hasta este scroll en altos de ventana. */
const HERO_UNTIL = 0.45;
/**
 * Huecos libres. Una percha cuyo mejor hueco sigue tapando, sumadas, más de
 * esta parte de una línea de texto no se usa; y para pasear solo valen los
 * tramos que no tapan casi nada (ver `overlapRatio`).
 */
const BLOCKED_OVERLAP = 0.3;
const FREE_OVERLAP = 0.05;

/* ------------------------------------------------------------------ */
/* Vuelo                                                               */
/* ------------------------------------------------------------------ */

/**
 * Duración de un vuelo entre perchas, según distancia.
 *
 * Subida de 1.0–1.8 s a 1.6–2.6 s: «baja muy rápido y no se deja ver»
 * (Matthew, 3 oct 2026). Con el vuelo de verdad, con batidas y planeo, se
 * puede ir despacio sin que parezca que flota.
 */
const FLIGHT_MIN = 1.6;
const FLIGHT_MAX = 2.6;
/** La llegada a la W al cargar: más larga, es la entrada. */
const ARRIVAL_TIME = 3.0;
/** Desde dónde llega al cargar, relativo a la W: fondo y fuera de cuadro. */
const ARRIVAL_FROM = new THREE.Vector3(9.0, 3.4, -6.5);
/**
 * Si su percha ya se fue de la pantalla, el vuelo no arranca desde ahí sino
 * desde el borde, en coordenadas de dispositivo. Así entra en cuadro nada más
 * despegar en vez de pasarse medio vuelo fuera.
 */
const EDGE_NDC = 1.08;

/** Batidas por segundo: más rápido al despegar, ritmo de crucero después. */
const FLAP_TAKEOFF = 2.2;
const FLAP_CRUISE = 1.4;
const FLAP_HOVER = 1.15;

/**
 * En el aire, más pequeño: con las alas extendidas ocupa el doble de ancho
 * que posado. Ver «Fases del vuelo».
 */
const AIR_SHRINK = 0.38;
/**
 * Volando, la percha elegida se mantiene mientras se vea entera: el bicho se
 * compromete con ella. Antes cambiaba de destino con cada percha nueva que
 * entraba en la franja de lectura y cada cambio volvía a empezar el vuelo
 * desde cero, posado y quieto: con el scroll seguido se quedaba clavado
 * arriba de la ventana, en la misma pose, bajando con la página («baja
 * conmigo en la misma pose», Matthew, 10 oct 2026).
 */
const COMMIT_FROM = SEEN_FROM;
const COMMIT_TO = 1.0;
/** Velocidad de scroll (px/s) a la que el bicho posado ya abre del todo las alas para equilibrarse. */
const SCROLL_FULL = 2600;
/** Alabeo en mitad de un vuelo, hacia el lado al que se abre el arco. */
const BANK = 0.42;

/** Fases de un vuelo, en fracción de su duración. */
const TAKEOFF_END = 0.12;
const GLIDE_FROM = 0.5;
const GLIDE_FULL = 0.62;
const FLARE_FROM = 0.72;
const FLARE_FULL = 0.88;
const LAND_FROM = 0.88;

/* ------------------------------------------------------------------ */
/* Andar                                                               */
/* ------------------------------------------------------------------ */

/**
 * Lo que avanza el cuerpo en un ciclo del clip `caminar`, en unidades del
 * modelo: el pie trasero barre ±17° con la pata de 1.85 de largo y apoya el
 * 72 % del ciclo. El clip se avanza por distancia recorrida, no por reloj,
 * así que los pies no patinan a ninguna velocidad.
 */
const STRIDE = 1.5;
/**
 * Ciclos por segundo. A 1.7 «parecía que corre» (Matthew, 4 oct 2026): un
 * bicho de este tamaño anda despacio, menos de un paso completo por segundo.
 */
const WALK_HZ = 0.75;
const WALK_HZ_CTA = 0.85;
/** El paseo por Contáctanos no pasa de esto: el resto de la palabra lo enciende el fuego. */
const WALK_MAX_TIME = 9;
/** Giro mientras anda: casi de perfil, algo vuelto hacia quien mira. */
const WALK_YAW = 1.2;
/** Lo que tarda en girarse antes y después de andar. */
const TURN_TIME = 0.5;

/* ------------------------------------------------------------------ */
/* Inactividad                                                         */
/* ------------------------------------------------------------------ */

/** La invitación a tocarlo: segundos posado antes de salir, y dónde se recuerda que ya lo tocaron. */
const HINT_AFTER = 1.4;
const HINT_KEY = "bouw-dragon-tocado-2";

/** Segundos sin tocar nada antes de que haga algo por su cuenta. */
const IDLE_AFTER = 7;
/** Y entre una cosa y la siguiente mientras sigues quieto. */
const IDLE_EVERY_MIN = 6;
const IDLE_EVERY_MAX = 10;
/** Mirar alrededor: lo que dura el barrido de la cabeza. */
const LOOKAROUND_TIME = 4;

/* ------------------------------------------------------------------ */
/* Mirada y fuego                                                      */
/* ------------------------------------------------------------------ */

/**
 * Cuánto gira la cabeza para mirarte, como mucho, y cómo se reparte el giro
 * entre las vértebras del cuello y la cabeza. Cada hueso gira entero sobre su
 * articulación y la cabeza conserva su forma.
 */
const LOOK_YAW = 1.0;
const LOOK_UP = 0.5;
const LOOK_DOWN = 0.4;
const NECK_SHARE: [string, number, number][] = [
  // hueso, parte del giro, parte del cabeceo
  ["cuello1", 0.15, 0.1],
  ["cuello2", 0.2, 0.2],
  ["cuello3", 0.25, 0.3],
  ["cabeza", 0.4, 0.4],
];
/** Hacia dónde mira la cabeza en reposo, en el espacio del modelo. */
const HEAD_REST_PITCH = -0.24;

/**
 * Una llamarada dura lo que el clip `fuego` (1.5 s): toma aire, echa el
 * cuello adelante y abre la boca. La llama sale cuando la boca se abre y se
 * corta antes de que la cierre.
 */
const FIRE_FROM = 0.4;
const FIRE_FULL = 0.5;
const FIRE_FADE = 1.05;
const FIRE_OUT = 1.3;

type Shot = "fuego" | "rugido" | "estirarse";

/** Entrada y salida suaves, sin tramo central a toda velocidad. */
function easeSine(x: number) {
  return 0.5 - 0.5 * Math.cos(Math.PI * x);
}

const smooth = THREE.MathUtils.smoothstep;

type PerchSpot = {
  id: string;
  el: HTMLElement;
  /** Punto de apoyo elegido, en coordenadas de documento. */
  x: number;
  y: number;
  /** Dónde está ahora: cambia al pasear. */
  cur: number;
  /** Tramo del borde por el que puede andar sin tapar texto. */
  minX: number;
  maxX: number;
  /** Ningún hueco del borde deja de tapar texto: no se usa. */
  blocked: boolean;
  /** Solo cuando se la señala (`bouw:perch-focus`), no por cercanía. */
  focusOnly: boolean;
  /** Se lee en vivo: su sitio cambia con el scroll (`position: sticky`). */
  live: boolean;
  fromLeft: boolean;
  /** Al llegar la recorre andando y escupe fuego al final (`data-perch-walk`). */
  walk: boolean;
  /** Hacia dónde mira posado: ±1, o 0 para mirar al centro de la pantalla. */
  face: number;
  /**
   * Perfil de las letras de la primera línea, en documento: por cada letra,
   * su tramo en x y la altura de su tinta. El bicho pisa las letras, no la
   * caja del texto, que en un titular grande deja un palmo de aire encima.
   */
  surface: Float32Array | null;
};

/** Lienzo de medir letras, compartido. */
let measureCtx: CanvasRenderingContext2D | null = null;

/** Desplazamiento pendiente de cada bloque `.reveal`, por medición. */
let shiftCache = new Map<Element, number>();

/**
 * Cuánto le falta a un elemento por subir hasta su sitio.
 *
 * Los bloques `.reveal` entran desde 28 px más abajo, y las perchas se miden
 * al cargar, con la mayoría todavía sin revelar: el bicho se posaba 28 px por
 * debajo del titular, dentro de las letras. Aquí se lee lo que le queda de
 * traslación al bloque que lo contiene, para medir dónde va a quedar.
 */
function revealShift(el: Element | null): number {
  const host = el?.closest(".reveal");
  if (!host) return 0;
  const hit = shiftCache.get(host);
  if (hit !== undefined) return hit;
  const tr = getComputedStyle(host).transform;
  const shift = tr && tr !== "none" ? new DOMMatrixReadOnly(tr).m42 : 0;
  shiftCache.set(host, shift);
  return shift;
}

/**
 * Altura de la tinta de cada letra de la primera línea de un texto suelto.
 *
 * La caja de un `span` empieza en el ascendente de la fuente, bastante por
 * encima de las letras; aquí se baja hasta donde empieza cada letra de verdad
 * (`actualBoundingBoxAscent`), letra a letra: una «C» llega más arriba que
 * una «o», y el bicho al andar sube y baja con ellas.
 */
function readSurface(el: HTMLElement, sy: number): Float32Array | null {
  // El primer texto directo: el subrayado de un título va en otro elemento
  let node: ChildNode | null = null;
  for (const c of el.childNodes) {
    if (c.nodeType === Node.TEXT_NODE && c.nodeValue?.trim()) {
      node = c;
      break;
    }
  }
  if (!node) return null;
  const text = node.nodeValue ?? "";
  measureCtx ??= document.createElement("canvas").getContext("2d");
  const ctx = measureCtx;
  if (!ctx) return null;
  const cs = getComputedStyle(el);
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const range = document.createRange();
  const out: number[] = [];
  let firstTop = NaN;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (!ch.trim()) continue;
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const r = range.getClientRects()[0];
    if (!r) continue;
    if (Number.isNaN(firstTop)) firstTop = r.top;
    // Solo la primera línea: es la que pisa
    if (Math.abs(r.top - firstTop) > 2) break;
    const m = ctx.measureText(ch);
    const ink =
      r.top + sy - revealShift(el) +
      Math.max(m.fontBoundingBoxAscent - m.actualBoundingBoxAscent, 0);
    out.push(r.left, r.right, ink);
  }
  return out.length ? new Float32Array(out) : null;
}

/**
 * Dónde pisa en `x`: la letra más alta bajo sus patas. Sin letras debajo (un
 * espacio, o fuera de la palabra), el borde de la caja.
 */
function surfaceAt(s: PerchSpot, x: number, reach: number) {
  const f = s.surface;
  if (!f) return s.y;
  let top = Infinity;
  let near = Infinity;
  let nearTop = s.y;
  for (let i = 0; i < f.length; i += 3) {
    const gap = Math.max(f[i] - x, x - f[i + 1], 0);
    if (gap < near) {
      near = gap;
      nearTop = f[i + 2];
    }
    if (f[i + 1] < x - reach || f[i] > x + reach) continue;
    if (f[i + 2] < top) top = f[i + 2];
  }
  // Fuera de la palabra, la altura de la letra más cercana: sin escalón
  return Number.isFinite(top) ? top : nearTop;
}

/* ------------------------------------------------------------------ */
/* Piel (GLSL)                                                         */
/* ------------------------------------------------------------------ */

/**
 * Lo que se le añade al material PBR del GLB: el borde cian, las líneas del
 * grabado del logo encendidas ("Mezcla A + B", Matthew, 2 oct 2026), el
 * interior de la boca (la malla es cerrada: al abrir la mandíbula se ve su
 * revés, que se pinta de garganta y al rojo cuando escupe) y el divisor plano
 * / realidad de la portada.
 */
const SKIN_COMMON = /* glsl */ `
  uniform vec3 uRimColor;
  uniform float uRimStrength;
  uniform float uRimPower;
  uniform vec3 uLineColor;
  uniform float uLineGlow;
  uniform float uMouth;
  uniform float uSplit;
  uniform float uSplitAmt;
  uniform vec2 uViewport;
  varying vec3 vPlanLocal;
  const vec3 PLAN_LINE = vec3(0.31, 0.84, 0.91);
  const vec3 PLAN_DARK = vec3(0.016, 0.063, 0.122);
`;

const SKIN_EMISSIVE = /* glsl */ `
  float rimDot = 1.0 - abs(dot(normalize(vViewPosition), normal));
  totalEmissiveRadiance +=
    uRimColor * pow(clamp(rimDot, 0.0, 1.0), uRimPower) * uRimStrength;
  {
    vec3 bouwBase = diffuseColor.rgb;
    float bouwLum = dot(bouwBase, vec3(0.2126, 0.7152, 0.0722));
    float bouwLine = smoothstep(0.03, 0.11, bouwLum)
      * smoothstep(0.004, 0.022, bouwBase.b - bouwBase.r);
    totalEmissiveRadiance += uLineColor * bouwLine * uLineGlow;
  }
`;

const SKIN_FINAL = /* glsl */ `
  if (!gl_FrontFacing) {
    gl_FragColor.rgb = vec3(0.05, 0.012, 0.01) + vec3(1.0, 0.36, 0.08) * uMouth;
  }
  if (uSplitAmt > 0.001) {
    float sx = gl_FragCoord.x / max(uViewport.x, 1.0);
    float real = smoothstep(uSplit - 0.0025, uSplit + 0.0025, sx);
    float sec = abs(fract(vPlanLocal.z * 1.4) - 0.5);
    float rib = 1.0 - smoothstep(0.015, 0.055, sec);
    float fres = pow(1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);
    vec3 plan = PLAN_DARK + PLAN_LINE * (rib * 0.5 + fres * 0.95);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, plan, (1.0 - real) * uSplitAmt);
    float seam = 1.0 - smoothstep(0.0, 0.004, abs(sx - uSplit));
    gl_FragColor.rgb += PLAN_LINE * seam * uSplitAmt * 1.1;
  }
`;

/** Sombra de contacto: una elipse que se desvanece hacia el borde. */
const SHADOW_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHADOW_FRAG = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float d = length((vUv - 0.5) * 2.0);
    float a = pow(1.0 - smoothstep(0.0, 1.0, d), 1.7);
    gl_FragColor = vec4(0.02, 0.05, 0.09, a * uOpacity);
  }
`;

/* ------------------------------------------------------------------ */
/* Huecos libres                                                       */
/* ------------------------------------------------------------------ */

/**
 * Cajas de todo lo que el bicho no debe tapar, en coordenadas de documento:
 * cada línea de texto visible (por nodo de texto, no por elemento, para que un
 * párrafo corto no cuente como un bloque entero) y los controles.
 */
function readObstacles(): Float32Array {
  const sy = window.scrollY;
  const out: number[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.nodeValue && n.nodeValue.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const range = document.createRange();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const parent = n.parentElement;
    if (!parent || parent.closest("script,style,noscript,[data-dragon-ignore]")) continue;
    const dy = sy - revealShift(parent);
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      out.push(r.left, r.top + dy, r.right, r.bottom + dy);
    }
  }
  document
    .querySelectorAll<HTMLElement>("button:not([data-dragon-hit]), input, textarea, select")
    .forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const dy = sy - revealShift(el);
      out.push(r.left, r.top + dy, r.right, r.bottom + dy);
    });
  return new Float32Array(out);
}

/**
 * Cuánto texto tapa la caja: por cada línea que toca, la parte de esa línea
 * que queda debajo, sumadas. Tapar entera una etiqueta pequeña («01», «Último
 * paso») cuenta tanto como tapar media palabra de un titular; con el área de
 * la caja, una etiqueta así salía casi gratis.
 */
function overlapRatio(
  obs: Float32Array,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  let hit = 0;
  for (let i = 0; i < obs.length; i += 4) {
    const w = Math.min(x1, obs[i + 2]) - Math.max(x0, obs[i]);
    if (w <= 0) continue;
    const h = Math.min(y1, obs[i + 3]) - Math.max(y0, obs[i + 1]);
    if (h <= 0) continue;
    const area = Math.max((obs[i + 2] - obs[i]) * (obs[i + 3] - obs[i + 1]), 1);
    hit += (w * h) / area;
  }
  return hit;
}

/* ------------------------------------------------------------------ */
/* Dragón                                                              */
/* ------------------------------------------------------------------ */

export default function Dragon({ reducedMotion, pointerRef }: Props) {
  const group = useRef<THREE.Group>(null);
  const sim = useRef(0);
  /** Fase del aleteo, 0 … 1 del clip `vuelo`. */
  const flap = useRef(0);
  /** Cuánto manda el divisor, suavizado: al soltarlo se retira, no se corta. */
  const splitAmt = useRef(0);

  /** Perchas marcadas en la página, en coordenadas de documento. */
  const spots = useRef<PerchSpot[]>([]);
  /** Lo que ocupa el bicho posado, en píxeles: con esto se buscan los huecos. */
  const dragonPx = useRef({ l: -150, r: 90, t: -170, w: 240, h: 170 });
  const pxKey = useRef("");
  const measured = useRef({ w: 0, h: 0 });
  const remeasure = useRef<() => void>(() => {});
  /** Percha a la que va o en la que está; vacío antes de la primera. */
  const target = useRef("");
  /** Percha señalada por la página (una casilla recién marcada), si la hay. */
  const focus = useRef("");
  /**
   * Vuelo en curso: segundos recorridos y duración. `inAir`: empezó ya en el
   * aire (cambio de destino a medio vuelo), así que no despega otra vez, y
   * `swoop` es hacia dónde se abre el arco, para alabear.
   */
  const flight = useRef({ active: false, t: 0, dur: 1, inAir: false, swoop: 0 });
  const flightFrom = useRef(new THREE.Vector3());
  const flightFromQuat = useRef(new THREE.Quaternion());
  const flightFromScale = useRef(1);
  /** Velocidad con la que entra un vuelo que cambia de destino en el aire. */
  const flightFromVel = useRef(new THREE.Vector3());
  /** Escala sin el encogido del aire: de aquí sale un vuelo encadenado. */
  const baseScale = useRef(1);
  /** Velocidad del bicho en mundo, suavizada, y su posición anterior. */
  const vel = useRef(new THREE.Vector3());
  const prevPos = useRef(new THREE.Vector3());
  const hasPrev = useRef(false);
  /** Scroll: último valor y velocidad suavizada en px/s. */
  const lastScroll = useRef(0);
  const scrollVel = useRef(0);
  /** Sombra de contacto bajo las patas, en las perchas de la página. */
  const shadow = useRef<THREE.Mesh>(null);
  const shadowAmt = useRef(0);
  const shadowUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), []);
  /**
   * Volando a tu lado (`AIR_SPOT`): el hueco elegido en píxeles de ventana,
   * el punto suavizado que sigue y cuándo se eligió.
   */
  const hover = useRef({ x: 0, y: 0, cx: 0, cy: 0, side: 1, at: -100, fresh: true, hold: false });
  /**
   * El gesto de scroll en curso: cuándo se movió la página por última vez
   * (reloj de la escena), cuánto lleva recorrido y el último valor visto.
   */
  const gesture = useRef({ at: -100, run: 0, seen: -1 });
  /** Cajas del texto de la página, de la última medición (ver `readObstacles`). */
  const obstacles = useRef<Float32Array>(new Float32Array(0));

  /** Paseo por la percha: tramo, reloj y qué hacer al acabar. */
  const stroll = useRef({
    active: false,
    id: "",
    from: 0,
    to: 0,
    t: 0,
    walk: 1,
    hz: WALK_HZ,
    then: "" as "" | "fuego",
  });
  /** Fase del clip `caminar`, 0 … 1. */
  const step = useRef(0);
  /** Altura a la que pisa, suavizada, en documento. */
  const foot = useRef({ id: "", y: 0 });
  const strollQuat = useRef(new THREE.Quaternion());

  /** Acción de un solo golpe (fuego, rugido, estirarse) y cuándo empezó. */
  const shot = useRef<{ name: Shot | ""; at: number }>({ name: "", at: -100 });
  const clicks = useRef(0);
  /** Última vez que el visitante tocó algo, en reloj de pared (ms). */
  const activeAt = useRef(0);
  /** Siguiente cosa que hará solo, en reloj de la escena. */
  const idleNext = useRef(0);
  const idleLast = useRef("");
  /** Mirar alrededor: cuándo empezó. */
  const lookAround = useRef(-100);

  /** Ratón cerca: abre algo las alas y enciende el grabado. */
  const alert = useRef(0);
  /** Cabeza: giro y cabeceo hacia el cursor, suavizados. */
  const look = useRef(new THREE.Vector2());

  // Aliento
  const mouth = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3(0, 0, 1));
  const fire = useRef(0);
  const firing = useRef(false);
  /** Tamaño de la llama: sigue al del bicho (ver `scaleRef` en `FireBreath`). */
  const fireScale = useRef(1);
  /** Botón invisible encima del bicho: es lo que se pulsa para que reaccione. */
  const hit = useRef<HTMLButtonElement | null>(null);
  const hitBox = useRef({ x: 0, y: 0, r: 0 });
  /**
   * Invitación a tocarlo: «agrégale que diga púlsame o algo más cool para
   * que sepan que pueden interactuar con el dragón» (Matthew, 10 oct 2026).
   * Una píldora sobre la cabeza cuando lleva un rato posado. Se retira para
   * siempre la primera vez que alguien lo toca: ya sabe que se puede.
   */
  const hint = useRef<{
    el: HTMLDivElement;
    text: HTMLSpanElement;
    sub: HTMLSpanElement;
    ring: HTMLDivElement;
  } | null>(null);
  const hintState = useRef({
    on: false,
    x: 0,
    y: 0,
    rx: 0,
    ry: 0,
    rr: 0,
    lang: "",
    done: false,
    half: 90,
    touch: false,
  });
  /** Desde cuándo está quieto en su percha, en reloj de la escena. */
  const restSince = useRef(0);

  const gltf = useGLTF(MODEL_PATH);

  /**
   * Preparación del modelo: un clon con su propio esqueleto
   * (`SkeletonUtils.clone`), material propio y un mezclador con todos los
   * clips sonando a la vez. Ninguno avanza solo: el bucle pone el tiempo y el
   * peso de cada uno en cada fotograma.
   */
  const model = useMemo(() => {
    const root = cloneSkinned(gltf.scene);
    root.updateMatrixWorld(true);

    const skinned: THREE.SkinnedMesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned.push(o as THREE.SkinnedMesh);
    });
    const mesh = skinned[0];
    if (!mesh) throw new Error("dragon.glb sin malla con esqueleto");

    const bones: Record<string, THREE.Bone> = {};
    root.traverse((o) => {
      if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone;
    });

    /*
     * Medidas en reposo, sacadas de la malla: el alto para la caja de toque
     * y la planta de los pies, que es lo que se apoya en la percha. Los pies
     * van a lo largo del cuerpo —delanteros y traseros—, así que el apoyo es
     * su punto medio.
     */
    const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
    const box = new THREE.Box3();
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      box.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld));
    }
    const size = box.getSize(new THREE.Vector3());
    const half = size.clone().multiplyScalar(0.5);
    const floorCut = box.min.y + size.y * 0.06;
    let feetZ = 0;
    let feetN = 0;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
      if (v.y < floorCut) {
        feetZ += v.z;
        feetN++;
      }
    }
    const feet = new THREE.Vector3(0, box.min.y, feetN ? feetZ / feetN : 0);

    /* ---- Piel ---- */
    const uniforms = {
      ...splitUniforms,
      uRimColor: { value: new THREE.Color(BRAND.cyanLight) },
      uRimStrength: { value: 0.35 },
      uRimPower: { value: 2.8 },
      uLineColor: { value: new THREE.Color(BRAND.cyanLight) },
      uLineGlow: { value: 0.6 },
      uMouth: { value: 0 },
    };
    const old = mesh.material as THREE.MeshStandardMaterial;
    const material = new THREE.MeshStandardMaterial({
      map: old.map ?? null,
      metalnessMap: old.metalnessMap ?? null,
      roughnessMap: old.roughnessMap ?? null,
      normalMap: old.normalMap ?? null,
      // Con mapas, glTF multiplica el factor por la textura: a 1 manda el mapa
      color: new THREE.Color("#ffffff"),
      metalness: old.metalnessMap ? 1 : 0.15,
      roughness: old.roughnessMap ? 1 : 0.55,
      envMapIntensity: 1.8,
      emissive: new THREE.Color(BRAND.orange),
      emissiveIntensity: 0.02,
      // Doble cara por la boca: con la mandíbula abierta se ve el revés
      side: THREE.DoubleSide,
    });
    if (material.normalMap) material.normalScale = new THREE.Vector2(1.4, 1.4);
    if (material.map) material.map.colorSpace = THREE.SRGBColorSpace;
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vPlanLocal;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvPlanLocal = position;",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", `#include <common>\n${SKIN_COMMON}`)
        .replace(
          "#include <emissivemap_fragment>",
          `#include <emissivemap_fragment>\n${SKIN_EMISSIVE}`,
        )
        .replace(
          "#include <dithering_fragment>",
          `#include <dithering_fragment>\n${SKIN_FINAL}`,
        );
    };
    material.customProgramCacheKey = () => "bouw-dragon-rig";
    mesh.material = material;
    // La caja de reposo no vale con las alas abiertas
    mesh.frustumCulled = false;

    /* ---- Clips ---- */
    const mixer = new THREE.AnimationMixer(root);
    const action = (name: string) => {
      const clip = THREE.AnimationClip.findByName(gltf.animations, name);
      if (!clip) throw new Error(`dragon.glb sin el clip ${name}`);
      const a = mixer.clipAction(clip);
      a.setLoop(THREE.LoopRepeat, Infinity);
      a.play();
      a.setEffectiveWeight(0);
      return a;
    };
    const actions = {
      vuelo: action("vuelo"),
      planeo: action("planeo"),
      frenado: action("frenado"),
      caminar: action("caminar"),
      fuego: action("fuego"),
      rugido: action("rugido"),
      estirarse: action("estirarse"),
    };

    /*
     * Hacia dónde sale la llama. Los ejes locales de un hueso dependen de cómo
     * los exporte Blender, así que se mide el giro del hueso `boca` en reposo
     * y se guarda la dirección del hocico expresada en ese giro.
     */
    const boca = bones.boca ?? bones.cabeza;
    const restQuat = boca.getWorldQuaternion(new THREE.Quaternion());
    const mouthAimLocal = new THREE.Vector3(0, -0.196, 0.98)
      .normalize()
      .applyQuaternion(restQuat.invert());

    const tail: THREE.Bone[] = [];
    for (let i = 1; bones[`cola${i}`]; i++) tail.push(bones[`cola${i}`]);

    /*
     * Lo que el mezclador dejó en cada hueso antes de los retoques. El
     * mezclador solo escribe un hueso cuando su valor cambia respecto al
     * fotograma anterior: posado, con todos los clips a peso cero, no lo
     * vuelve a escribir y los giros de la mirada se acumularían. Así que cada
     * retoque se deshace al empezar el fotograma siguiente.
     */
    const base = new Map<THREE.Bone, THREE.Quaternion>();
    for (const b of Object.values(bones)) base.set(b, new THREE.Quaternion());

    return {
      root,
      mesh,
      material,
      uniforms,
      mixer,
      actions,
      bones,
      tail,
      base,
      touched: new Set<THREE.Bone>(),
      boca,
      mouthAimLocal,
      half,
      feet,
      // Vectores de trabajo del bucle: uno por uso, para no crear nada por fotograma
      tgtPos: new THREE.Vector3(),
      tgtQuat: new THREE.Quaternion(),
      anchor: new THREE.Vector3(),
      anchorQuat: new THREE.Quaternion(),
      anchorScale: new THREE.Vector3(),
      feetWorld: new THREE.Vector3(),
      ndc: new THREE.Vector3(),
      ray: new THREE.Vector3(),
      euler: new THREE.Euler(),
      path: new THREE.CubicBezierCurve3(
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ),
      tangent: new THREE.Vector3(),
      heading: new THREE.Vector3(),
      lift: new THREE.Vector3(),
      basis: new THREE.Matrix4(),
      origin: new THREE.Vector3(),
      pathQuat: new THREE.Quaternion(),
      walkQuat: new THREE.Quaternion(),
      gazePoint: new THREE.Vector3(),
      gazeDir: new THREE.Vector3(),
      headPos: new THREE.Vector3(),
      modelQuat: new THREE.Quaternion(),
      modelQuatInv: new THREE.Quaternion(),
      qa: new THREE.Quaternion(),
      qb: new THREE.Quaternion(),
      axis: new THREE.Vector3(),
      screen: new THREE.Vector3(),
      probe: new THREE.Vector3(),
      step: new THREE.Vector3(),
      fwd: new THREE.Vector3(),
      /** Rumbo del fotograma anterior y alabeo suavizado (ver «Alabeo»). */
      prevYaw: { value: 0 },
      bank: { value: 0 },
    };
  }, [gltf]);

  // Las geometrías y materiales son propios de este montaje: hay que soltarlos
  useEffect(() => {
    const { material, mixer, root } = model;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      material.dispose();
    };
  }, [model]);

  /* ---------------------------------------------------------------- */
  /* Perchas                                                           */
  /* ---------------------------------------------------------------- */

  /*
   * Se miden cuando cambia el layout, no por fotograma. Con la posición en el
   * documento, el punto en pantalla es una resta con `scrollY`.
   *
   * Y en cada una se busca el hueco: «que no solape los títulos» (Matthew,
   * 3 oct 2026). Se prueban puntos a lo largo del borde de arriba del
   * elemento, se mira cuánto texto taparía el bicho en cada uno y gana el que
   * menos tapa, cerca de la esquina preferida.
   */
  useEffect(() => {
    const measure = () => {
      const W = window.innerWidth;
      const sy = window.scrollY;
      const box = dragonPx.current;
      const bw = box.w;
      measured.current = { w: box.w, h: box.h };
      const margin = Math.min(W * 0.16, 130);
      shiftCache = new Map();
      const obs = readObstacles();
      obstacles.current = obs;
      const prev = new Map(spots.current.map((s) => [s.id, s]));
      const list: PerchSpot[] = [];

      document.querySelectorAll<HTMLElement>("[data-perch]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const id = el.dataset.perch ?? "";
        const fromLeft = el.dataset.perchCorner !== "right";
        const live = el.dataset.perchLive !== undefined;
        const top = r.top + sy - revealShift(el);
        const pref = THREE.MathUtils.clamp(
          r.left + r.width * (fromLeft ? CORNER_INSET : 1 - CORNER_INSET),
          margin,
          W - margin,
        );

        let x = pref;
        let minX = pref;
        let maxX = pref;
        let blocked = false;
        if (!live) {
          const inset = Math.min(bw * 0.3, r.width * 0.3);
          const lo = Math.max(r.left + inset, margin);
          const hi = Math.min(r.right - inset, W - margin);
          const n = hi - lo > 8 ? 13 : 1;
          const xs: number[] = [];
          const over: number[] = [];
          for (let i = 0; i < n; i++) {
            const cx = n === 1 ? THREE.MathUtils.clamp(pref, margin, W - margin) : lo + ((hi - lo) * i) / (n - 1);
            xs.push(cx);
            // La caja del bicho de verdad: mirando a la derecha, las alas y
            // la cola le salen por la izquierda, y al revés
            const right = cx < W / 2;
            over.push(
              overlapRatio(
                obs,
                cx + (right ? box.l : -box.r),
                top + box.t,
                cx + (right ? box.r : -box.l),
                top - 4,
              ),
            );
          }
          let best = 0;
          let bestScore = Infinity;
          for (let i = 0; i < n; i++) {
            const score = over[i] + (0.1 * Math.abs(xs[i] - pref)) / Math.max(hi - lo, 1);
            if (score < bestScore) {
              bestScore = score;
              best = i;
            }
          }
          x = xs[best];
          blocked = over[best] > BLOCKED_OVERLAP;
          // Tramo libre alrededor del elegido: por ahí puede pasear
          let a = best;
          let b = best;
          while (a > 0 && over[a - 1] < FREE_OVERLAP) a--;
          while (b < n - 1 && over[b + 1] < FREE_OVERLAP) b++;
          minX = xs[a];
          maxX = xs[b];
        }

        const old = prev.get(id);
        const keep =
          old && old.cur >= minX - 1 && old.cur <= maxX + 1 && Math.abs(old.y - top) < 2;
        list.push({
          id,
          el,
          x,
          y: top,
          cur: keep ? old.cur : x,
          minX,
          maxX,
          blocked,
          focusOnly: el.dataset.perchFocus !== undefined,
          live,
          fromLeft,
          walk: el.dataset.perchWalk !== undefined,
          face: keep ? old.face : 0,
          surface: live ? null : readSurface(el, sy),
        });
      });
      spots.current = list;
    };
    remeasure.current = measure;
    measure();
    return onLayoutChange(measure);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Toques y quietud                                                  */
  /* ---------------------------------------------------------------- */

  /*
   * Tocarlo. El lienzo no recibe el puntero —va por encima de la página y
   * taparía todo lo que hay debajo—, así que encima del bicho viaja un botón
   * invisible de su tamaño. Al pulsarlo alterna fuego y rugido; pulsar el
   * elemento en el que está posado (el titular de contacto) es fuego.
   */
  useEffect(() => {
    // Uno solo: un montaje doble dejaba un botón huérfano que recibía el clic
    document.querySelectorAll("[data-dragon-hit]").forEach((n) => n.remove());
    const b = document.createElement("button");
    b.dataset.dragonHit = "";
    b.type = "button";
    b.tabIndex = -1;
    b.setAttribute("aria-label", "Dragón de BOUW");
    Object.assign(b.style, {
      position: "fixed",
      left: "0",
      top: "0",
      // Tamaño fijo: el del bicho se da con `scale` (ver más abajo)
      width: `${HIT_BASE * 2}px`,
      height: `${HIT_BASE * 2}px`,
      padding: "0",
      border: "0",
      borderRadius: "50%",
      background: "transparent",
      cursor: "pointer",
      zIndex: "31",
      transformOrigin: "0 0",
      transform: "translate3d(-9999px, 0, 0)",
      // Capa propia: se mueve con el bicho en cada fotograma de scroll
      willChange: "transform",
    });
    /** `lead`: segundos del clip que se salta, para que la llama salga antes. */
    const play = (name: Shot, lead = 0) => {
      const cur = shot.current;
      const busy = cur.name !== "" && sim.current - cur.at < 2.1;
      // En el aire no: los clips de un golpe son de bicho posado
      if (busy || flight.current.active || stroll.current.active || target.current === AIR_SPOT) {
        return;
      }
      shot.current = { name, at: sim.current - lead };
    };
    const onHit = () => {
      play(clicks.current++ % 2 === 0 ? "fuego" : "rugido");
      if (!hintState.current.done) {
        hintState.current.done = true;
        try {
          localStorage.setItem(HINT_KEY, "1");
        } catch {
          // Sin almacenamiento: vale para esta visita
        }
      }
    };
    b.addEventListener("click", onHit);
    document.body.appendChild(b);
    hit.current = b;

    /*
     * La invitación. «Tócame… si te atreves» no se veía profesional ni
     * llamativa (Matthew, 11 oct 2026). Ahora son dos piezas, como un punto
     * interactivo de producto: un aro que late alrededor del bicho, que es lo
     * que se ve de lejos, y encima una etiqueta sobria que dice qué pasa al
     * tocarlo: «Haz clic · lanza fuego».
     */
    document.querySelectorAll("[data-dragon-hint]").forEach((n) => n.remove());
    try {
      hintState.current.done = localStorage.getItem(HINT_KEY) === "1";
    } catch {
      hintState.current.done = false;
    }
    const hintEl = document.createElement("div");
    hintEl.dataset.dragonHint = "";
    hintEl.className = "dragon-hint";
    hintEl.setAttribute("aria-hidden", "true");
    const bob = document.createElement("div");
    bob.className = "dragon-hint-bob";
    const pill = document.createElement("span");
    pill.className = "dragon-hint-pill";
    // Un cursor que pulsa: dice «esto se toca» sin palabras
    pill.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 9l10.5 3.6-4.6 1.7-1.7 4.6L9 9z"/><path d="M5.5 5.5 4 4M10 3.5V2M3.5 10H2M14.5 5.5 16 4"/></svg>';
    const text = document.createElement("span");
    text.className = "dragon-hint-main";
    const sub = document.createElement("span");
    sub.className = "dragon-hint-sub";
    pill.appendChild(text);
    pill.appendChild(sub);
    bob.appendChild(pill);
    hintEl.appendChild(bob);
    pill.addEventListener("click", onHit);
    document.body.appendChild(hintEl);
    // El aro, aparte: va centrado en el bicho, no encima de la cabeza
    const ring = document.createElement("div");
    ring.dataset.dragonHint = "";
    ring.className = "dragon-hint-ring";
    ring.setAttribute("aria-hidden", "true");
    ring.innerHTML = "<span></span><span></span>";
    document.body.appendChild(ring);
    hintState.current.touch = window.matchMedia("(pointer: coarse)").matches;
    hint.current = { el: hintEl, text, sub, ring };

    // Las perchas de foco son casillas: pulsarlas es marcar, no pedir fuego
    const down = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest?.("[data-perch]");
      // Los paneles que se abren en vivo piden su fuego al abrirse (`bouw:project-open`)
      if (
        el &&
        !el.hasAttribute("data-perch-focus") &&
        !el.hasAttribute("data-perch-open") &&
        el.getAttribute("data-perch") === target.current
      ) {
        play("fuego");
      }
    };
    window.addEventListener("pointerdown", down);
    const onFocus = (e: Event) => {
      focus.current = (e as CustomEvent<{ id: string }>).detail?.id ?? "";
    };
    window.addEventListener("bouw:perch-focus", onFocus);
    // Un proyecto que se abre desde su panel: si está posado en él, lo
    // enciende con fuego justo antes de que crezca la ventana
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      if (id && id === target.current) play("fuego", 0.3);
    };
    window.addEventListener("bouw:project-open", onOpen);

    // Quietud: cualquier gesto del visitante reinicia la cuenta
    const wake = () => {
      activeAt.current = performance.now();
    };
    wake();
    const opts = { passive: true } as const;
    window.addEventListener("pointermove", wake, opts);
    window.addEventListener("pointerdown", wake, opts);
    window.addEventListener("wheel", wake, opts);
    window.addEventListener("scroll", wake, opts);
    window.addEventListener("keydown", wake, opts);
    window.addEventListener("touchstart", wake, opts);

    return () => {
      b.removeEventListener("click", onHit);
      b.remove();
      hit.current = null;
      pill.removeEventListener("click", onHit);
      hintEl.remove();
      ring.remove();
      hint.current = null;
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("bouw:perch-focus", onFocus);
      window.removeEventListener("bouw:project-open", onOpen);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("wheel", wake);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("touchstart", wake);
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /* Frame loop                                                        */
  /* ---------------------------------------------------------------- */

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const { uniforms, actions, bones } = model;
    if (debug.on && !debug.uniforms) debug.uniforms = uniforms;

    // Reloj de pared: vuelos y fuego tienen que durar lo mismo en cualquier equipo
    const d = Math.min(delta, 0.05) * debug.timeScale;
    const wall = Math.min(delta, 0.25) * debug.timeScale;
    sim.current += wall;
    const t = sim.current;
    const cam = state.camera as THREE.PerspectiveCamera;
    const W = state.size.width;
    const H = state.size.height;
    const scrollY = window.scrollY;
    const lightMode = document.documentElement.dataset.theme !== "dark";

    /* ---- Tamaño en pantalla, para buscar huecos ---- */
    const ppu =
      H / (2 * Math.tan(THREE.MathUtils.degToRad((cam.fov ?? 40) / 2)) * Math.max(cam.position.z, 1));
    // En el teléfono, algo más chico: ahí el texto ocupa el ancho entero y no
    // hay margen donde quepa sin tapar una línea (Matthew, 19 oct 2026: «el
    // celular no se ve bien todavía»)
    const domScale = DOM_SCALE * THREE.MathUtils.clamp(W / 1200, 0.42, 1);
    const pxNow = `${ppu.toFixed(1)}|${domScale.toFixed(3)}`;
    if (pxNow !== pxKey.current) {
      pxKey.current = pxNow;
      // La caja del bicho posado mirando a la derecha, sacada de sus vértices
      const q = model.qa.setFromEuler(model.euler.set(-0.05, DOM_YAW, 0, "YXZ"));
      const pos = model.mesh.geometry.attributes.position as THREE.BufferAttribute;
      const v = model.probe;
      let l = Infinity;
      let r = -Infinity;
      let top = Infinity;
      for (let i = 0; i < pos.count; i += 7) {
        v.fromBufferAttribute(pos, i).sub(model.feet).multiplyScalar(domScale).applyQuaternion(q);
        l = Math.min(l, v.x * ppu);
        r = Math.max(r, v.x * ppu);
        top = Math.min(top, -v.y * ppu);
      }
      // Con holgura: la perspectiva agranda el ala de delante, y al acercar
      // el ratón abre las alas (medido sobre captura: un 15 % más ancho)
      l *= 1.22;
      r *= 1.18;
      top *= 1.1;
      Object.assign(dragonPx.current, { l, r, t: top, w: r - l, h: -top });
    }
    const m = measured.current;
    if (Math.abs(dragonPx.current.w - m.w) > m.w * 0.1 + 1) remeasure.current();

    /* ---- El gesto de scroll ---- */
    const gs = gesture.current;
    if (gs.seen >= 0 && scrollY !== gs.seen) {
      gs.at = t;
      gs.run += Math.abs(scrollY - gs.seen);
    }
    gs.seen = scrollY;
    if (t - gs.at > SETTLE) gs.run = 0;
    const scrolling = !reducedMotion && gs.run > LIFT_PX;
    if (!scrolling) hover.current.hold = false;

    /* ---- Qué percha manda ---- */
    const heroAlive = perch.ready && perch.live > 0.05;
    let want = "";
    const usable = (s: PerchSpot) => !s.blocked && !s.focusOnly;
    if (heroAlive && scrollY < H * HERO_UNTIL) {
      want = "hero";
    } else {
      let best = Infinity;
      // Lo señalado manda mientras siga en pantalla
      const focused = focus.current
        ? spots.current.find((s) => s.id === focus.current)
        : undefined;
      const focusY = focused ? focused.y - scrollY : NaN;
      if (focused && focusY > H * 0.2 && focusY < H * 1.05) {
        want = focused.id;
        best = -Infinity;
      } else {
        focus.current = "";
      }
      // Con la página en marcha, en el aire donde estaba (ver `LIFT_PX`)
      if (best !== -Infinity && scrolling) {
        want = AIR_SPOT;
        best = -Infinity;
      }
      /*
       * Se queda donde está. Antes, al parar el scroll, se cambiaba a la
       * percha que quedara más cerca del centro de la ventana aunque la suya
       * siguiera a la vista, y cada vez bajaba volando hacia ella: «que se
       * quede ahí y no baje» (Matthew, 14 oct 2026). Ahora solo se va cuando
       * su percha se mete bajo la barra o sale por abajo.
       */
      if (best !== -Infinity && target.current !== "hero" && target.current !== AIR_SPOT) {
        const cur = spots.current.find((s) => s.id === target.current);
        const curY = cur ? cur.y - scrollY : NaN;
        if (cur && usable(cur) && curY > H * STAY_FROM && curY < H * VIEW_TO) {
          want = cur.id;
          best = -Infinity;
        }
      }
      for (const s of spots.current) {
        if (!usable(s) || best === -Infinity) continue;
        const sy = s.y - scrollY;
        if (sy < H * VIEW_FROM || sy > H * VIEW_TO) continue;
        // La que ya tiene juega con ventaja: sin esto saltaría entre dos
        // perchas a la misma distancia de la línea de lectura
        const gap =
          Math.abs(sy - H * READ_LINE) - (s.id === target.current ? H * 0.12 : 0);
        if (gap < best) {
          best = gap;
          want = s.id;
        }
      }
      // Ninguna en la franja: se queda mientras la suya siga en pantalla; si
      // no, a la más cercana que no esté pegada a la barra
      if (!want) {
        const cur = spots.current.find((s) => s.id === target.current);
        const curY = cur ? cur.y - scrollY : NaN;
        if (
          (target.current === "hero" && heroAlive) ||
          (cur && !cur.focusOnly && curY > H * SEEN_FROM && curY < H * SEEN_TO)
        ) {
          want = target.current;
        } else {
          /*
           * Primero las que se ven, aunque queden fuera de la franja: con la
           * única percha visible pegada arriba y la siguiente un palmo por
           * debajo del borde, elegía la de abajo y se posaba donde no se le
           * veía. Si no hay ninguna a la vista, vuela a tu lado hasta que
           * entre una (`AIR_SPOT`).
           */
          for (const s of spots.current) {
            if (!usable(s)) continue;
            const sy = s.y - scrollY;
            if (sy < H * SEEN_FROM || sy > H * SEEN_TO) continue;
            const gap = Math.abs(sy - H * READ_LINE);
            if (gap < best) {
              best = gap;
              want = s.id;
            }
          }
          // Al cargar en la portada, espera a la W en vez de salir volando
          if (!want) want = target.current === "" && scrollY < H * HERO_UNTIL ? "" : AIR_SPOT;
        }
      }
    }
    // Volando, sigue hacia la que eligió mientras se vea (ver `COMMIT_FROM`)
    if (
      want &&
      want !== target.current &&
      flight.current.active &&
      !focus.current &&
      !scrolling &&
      target.current !== "hero"
    ) {
      const cur = spots.current.find((s) => s.id === target.current);
      const curY = cur ? cur.y - scrollY : NaN;
      if (cur && !cur.blocked && curY > H * COMMIT_FROM && curY < H * COMMIT_TO) {
        want = target.current;
      }
    }
    if (!want) {
      g.visible = false;
      if (hintState.current.on && hint.current) {
        hintState.current.on = false;
        hint.current.el.classList.remove("is-on");
        hint.current.ring.classList.remove("is-on");
      }
      return;
    }

    /* ---- Dónde está esa percha, en mundo ---- */
    const { tgtPos, tgtQuat, anchor, anchorQuat, anchorScale, feetWorld } = model;
    let tgtScale = DOM_SCALE;
    /** Del píxel de pantalla al plano z = 0, donde está medida la escala. */
    const toWorld = (sx: number, syScreen: number, out: THREE.Vector3) => {
      const { ndc, ray } = model;
      ndc.set((sx / W) * 2 - 1, -(syScreen / H) * 2 + 1, 0.5).unproject(cam);
      ray.subVectors(ndc, cam.position).normalize();
      return out.copy(cam.position).addScaledVector(ray, -cam.position.z / ray.z);
    };
    const st = stroll.current;
    /**
     * El hueco para volar a tu lado: en el margen del lado por el que llegó,
     * a la altura que menos texto tape. El lado se queda; la altura se revisa
     * cada `AIR_RECHECK`, porque la página sigue pasando por debajo.
     */
    const pickHover = () => {
      const hv = hover.current;
      // En pantallas estrechas no hay margen libre: se sostiene en el borde,
      // medio asomado, en vez de encima del párrafo
      const edge = W < 640 ? 30 : Math.max(W * 0.1, 110);
      const x = hv.side > 0 ? W - edge : edge;
      const box = dragonPx.current;
      let bestY = H * 0.45;
      let bestScore = Infinity;
      for (const fy of [0.36, 0.5, 0.64]) {
        const y = H * fy;
        const score =
          overlapRatio(obstacles.current, x + box.l, y + box.t + scrollY, x + box.r, y + scrollY) +
          Math.abs(fy - 0.45) * 0.3;
        if (score < bestScore) {
          bestScore = score;
          bestY = y;
        }
      }
      hv.x = x;
      hv.y = bestY;
      hv.at = t;
      if (hv.fresh) {
        hv.cx = hv.x;
        hv.cy = hv.y;
        hv.fresh = false;
      }
    };
    const resolve = (id: string) => {
      if (id === "hero") {
        perch.matrix.decompose(anchor, anchorQuat, anchorScale);
        tgtQuat.copy(anchorQuat).multiply(PERCH_TURN);
        tgtScale = PERCH_SCALE * perch.scale;
      } else if (id === AIR_SPOT) {
        const hv = hover.current;
        // Sosteniéndose durante el scroll no busca otro hueco: se queda
        if (!hv.hold && (hv.fresh || t - hv.at > AIR_RECHECK)) pickHover();
        hv.cx += (hv.x - hv.cx) * (1 - Math.pow(0.3, wall));
        hv.cy += (hv.y - hv.cy) * (1 - Math.pow(0.3, wall));
        // Deriva lenta: un bicho que se sostiene en el aire nunca está clavado
        toWorld(
          hv.cx + Math.sin(t * 0.45) * W * 0.015,
          hv.cy + Math.sin(t * 0.7 + 1) * H * 0.025,
          anchor,
        );
        // De perfil hacia el centro de la pantalla, que se le vean las alas
        tgtQuat.setFromEuler(model.euler.set(-0.06, (hv.side > 0 ? -1 : 1) * 1.25, 0, "YXZ"));
        tgtScale = domScale;
      } else {
        const s = spots.current.find((p) => p.id === id);
        if (!s) return false;
        if (s.live) {
          const r = s.el.getBoundingClientRect();
          s.x = s.cur = r.left + r.width * (s.fromLeft ? CORNER_INSET : 1 - CORNER_INSET);
          s.y = r.top + scrollY;
        }
        let sx = s.cur;
        if (st.active && st.id === id) {
          const k = easeSine(THREE.MathUtils.clamp((st.t - TURN_TIME) / st.walk, 0, 1));
          sx = THREE.MathUtils.lerp(st.from, st.to, k);
        }
        sx = THREE.MathUtils.clamp(sx, Math.min(W * 0.16, 130), W - Math.min(W * 0.16, 130));
        // Pisa las letras: la altura de la tinta bajo sus patas, suavizada
        // para que al andar suba y baje con ellas sin escalones
        const ground = surfaceAt(s, sx, dragonPx.current.w * 0.18);
        const ft = foot.current;
        if (ft.id !== id || flight.current.active) {
          ft.id = id;
          ft.y = ground;
        } else {
          ft.y += (ground - ft.y) * (1 - Math.pow(0.004, wall));
        }
        toWorld(sx, ft.y - scrollY, anchor);
        const facing = s.face || (sx < W / 2 ? 1 : -1);
        tgtQuat.setFromEuler(model.euler.set(-0.05, facing * DOM_YAW, 0, "YXZ"));
        tgtScale = domScale;
      }
      // Los pies sobre el apoyo, no el centro del cuerpo
      feetWorld.copy(model.feet).multiplyScalar(tgtScale).applyQuaternion(tgtQuat);
      tgtPos.copy(anchor).sub(feetWorld);
      return true;
    };

    /* ---- Cambio de percha: despega ---- */
    const fl = flight.current;
    if (want !== target.current) {
      const first = target.current === "";
      const wasHovering = target.current === AIR_SPOT;
      if (want === AIR_SPOT) {
        const hv = hover.current;
        hv.fresh = true;
        hv.side = dragonScreen.x > 0.5 || first ? 1 : -1;
        if (scrolling && !first) {
          // Donde estaba, un poco más arriba: el salto del despegue
          const m = Math.min(W * 0.1, 110);
          hv.x = hv.cx = THREE.MathUtils.clamp(dragonScreen.x * W, m, W - m);
          hv.y = hv.cy = THREE.MathUtils.clamp(
            dragonScreen.y * H + dragonPx.current.h * 0.2,
            H * 0.3,
            H * 0.78,
          );
          hv.at = t;
          hv.fresh = false;
          hv.hold = true;
        }
      }
      if (!resolve(want)) return;
      target.current = want;
      st.active = false;
      shot.current.name = "";
      if (reducedMotion) {
        fl.active = false;
      } else if (first) {
        // La entrada: llega desde el fondo y fuera de cuadro, ya en el aire
        flightFrom.current.copy(tgtPos).add(ARRIVAL_FROM);
        flightFromQuat.current.copy(tgtQuat);
        flightFromScale.current = tgtScale;
        fl.active = true;
        fl.inAir = false;
        fl.t = 0;
        fl.dur = ARRIVAL_TIME;
        flap.current = 0;
      } else {
        /*
         * Si ya iba volando, cambia de rumbo sin despegar otra vez: sale de
         * donde está, con la velocidad que lleva, y el aleteo sigue su
         * compás. Volver a empezar desde cero lo dejaba un instante posado y
         * quieto en mitad del aire.
         */
        const midAir = fl.active || wasHovering;
        fl.inAir = midAir;
        if (midAir) flightFromVel.current.copy(vel.current);
        else flightFromVel.current.set(0, 0, 0);
        const from = flightFrom.current.copy(g.position);
        // Si la percha de salida ya no se ve, sale desde el borde
        const { screen } = model;
        screen.copy(from).project(cam);
        if (Math.abs(screen.y) > EDGE_NDC) {
          screen.y = Math.sign(screen.y) * EDGE_NDC;
          screen.x = THREE.MathUtils.clamp(screen.x, -0.9, 0.9);
          const { ndc, ray } = model;
          ndc.set(screen.x, screen.y, 0.5).unproject(cam);
          ray.subVectors(ndc, cam.position).normalize();
          from.copy(cam.position).addScaledVector(ray, (from.z - cam.position.z) / ray.z);
        }
        flightFromQuat.current.copy(g.quaternion);
        flightFromScale.current = baseScale.current;
        fl.active = true;
        fl.t = 0;
        fl.dur = hover.current.hold && want === AIR_SPOT
          ? LIFT_TIME
          : THREE.MathUtils.clamp(
              FLIGHT_MIN + from.distanceTo(tgtPos) * 0.12,
              FLIGHT_MIN,
              FLIGHT_MAX,
            );
        // Arranca con las alas arriba: el primer gesto es la batida hacia abajo
        if (!midAir) flap.current = 0;
      }
    } else if (!resolve(want)) {
      return;
    }
    g.visible = true;
    /** Volando a tu lado: no se posa, se sostiene en el aire. */
    const hovering = target.current === AIR_SPOT && !reducedMotion;
    const spot = target.current === "hero" || target.current === AIR_SPOT
      ? undefined
      : spots.current.find((s) => s.id === target.current);

    /* ---- Trayectoria ---- */
    let u = 1;
    if (fl.active) {
      fl.t += wall;
      u = Math.min(fl.t / fl.dur, 1);
      // Encadenado, sale lanzado (sin arrancar de cero) y frena al llegar
      const e = fl.inAir ? 1 - Math.pow(1 - u, 2) : easeSine(u);
      const from = flightFrom.current;
      const { path, tangent, lift, basis, origin, pathQuat, heading } = model;
      /*
       * Arco: sube, se abre de lado hacia el centro de la pantalla y baja
       * sobre la percha en un descenso largo. Con la curva cruza de perfil y
       * se le ven las alas; en línea recta volaba de frente a cámara. La
       * percha se mueve con la página, así que el final se recalcula en cada
       * fotograma.
       */
      const dist = from.distanceTo(tgtPos);
      const rise = 1.0 + dist * 0.12;
      const swoop = (tgtPos.x > 0 ? -1 : 1) * (0.6 + dist * 0.18);
      fl.swoop = Math.sign(swoop);
      path.v0.copy(from);
      if (fl.inAir) {
        // Primer tramo en la dirección que ya llevaba. Con `e` = 1 − (1 − u)²
        // sale a 6 · (v1 − v0) / dur, así que v1 − v0 = vel · dur / 6.
        // Acotado, para que un tirón del scroll no lo lance fuera de cuadro
        lift.copy(flightFromVel.current).multiplyScalar(fl.dur / 6);
        if (lift.length() > dist * 0.6 + 0.5) lift.setLength(dist * 0.6 + 0.5);
        path.v1.copy(from).add(lift);
      } else {
        path.v1.copy(from).add(lift.set(swoop, rise, 0.2));
      }
      path.v2.copy(tgtPos).add(lift.set(swoop, rise * 0.5, 0.15));
      path.v3.copy(tgtPos);
      path.getPoint(e, g.position);
      path.getTangent(e, tangent);
      // Sin picados: con el cabeceo acotado se lee como un planeo en descenso
      const pitch = THREE.MathUtils.clamp(
        Math.asin(THREE.MathUtils.clamp(tangent.y, -1, 1)),
        -0.42,
        0.42,
      );
      heading.set(0, 0, 1).applyQuaternion(tgtQuat).setY(0).normalize().multiplyScalar(0.25);
      heading.x += tangent.x;
      // Lo que va hacia cámara cuenta a medias: de perfil se lee mejor
      heading.z += tangent.z * 0.5;
      heading.normalize();
      tangent.copy(heading).multiplyScalar(Math.cos(pitch)).setY(Math.sin(pitch));
      basis.lookAt(tangent, origin, THREE.Object3D.DEFAULT_UP);
      pathQuat.setFromRotationMatrix(basis);
      // Pose de la percha al despegar y al llegar; rumbo del arco en medio
      g.quaternion
        .copy(flightFromQuat.current)
        .slerp(pathQuat, smooth(u, 0, 0.22))
        .slerp(tgtQuat, smooth(u, 0.7, 1));
      g.scale.setScalar(THREE.MathUtils.lerp(flightFromScale.current, tgtScale, e));
      if (u >= 1) {
        fl.active = false;
        fl.inAir = false;
        idleNext.current = t + IDLE_EVERY_MIN;
        // Toca la W: la letra acusa el peso
        if (target.current === "hero") perch.kick = -0.9 * perch.scale;
        // En una percha de andar (Contáctanos) la recorre y escupe al final
        if (spot?.walk && !reducedMotion) {
          const pxStep = STRIDE * domScale * ppu * WALK_HZ_CTA;
          let to = spot.fromLeft ? spot.maxX : spot.minX;
          if (Math.abs(to - spot.cur) > pxStep * WALK_MAX_TIME) {
            to = spot.cur + Math.sign(to - spot.cur) * pxStep * WALK_MAX_TIME;
          }
          if (Math.abs(to - spot.cur) > 40) {
            // Al acabar se vuelve hacia la palabra que acaba de recorrer
            spot.face = to > spot.cur ? -1 : 1;
            Object.assign(st, {
              active: true,
              id: spot.id,
              from: spot.cur,
              to,
              t: 0,
              walk: Math.abs(to - spot.cur) / (STRIDE * domScale * ppu * WALK_HZ_CTA),
              hz: WALK_HZ_CTA,
              then: "fuego",
            });
          } else {
            shot.current = { name: "fuego", at: t };
          }
        }
      }
    } else {
      g.position.copy(tgtPos);
      g.scale.setScalar(tgtScale);
      g.quaternion.copy(tgtQuat);
    }

    /* ---- Paseo ---- */
    let walkW = 0;
    if (st.active && !fl.active) {
      st.t += wall;
      const T2 = TURN_TIME + st.walk;
      const dir = st.to >= st.from ? 1 : -1;
      model.walkQuat.setFromEuler(model.euler.set(-0.02, dir * WALK_YAW, 0, "YXZ"));
      // Gira, anda y vuelve a girarse hacia donde mira posado
      if (st.t < TURN_TIME) {
        const k = smooth(st.t, 0, TURN_TIME);
        strollQuat.current.copy(tgtQuat).slerp(model.walkQuat, k);
        walkW = 0.55 * k;
        step.current = (step.current + wall * 0.9) % 1;
      } else if (st.t < T2) {
        strollQuat.current.copy(model.walkQuat);
        walkW = 1;
        // El clip avanza con la distancia: un ciclo por zancada
        const pxPerSec = (Math.abs(st.to - st.from) * Math.PI) / (2 * st.walk) *
          Math.sin(Math.PI * THREE.MathUtils.clamp((st.t - TURN_TIME) / st.walk, 0, 1));
        step.current = (step.current + (wall * pxPerSec) / (STRIDE * domScale * ppu) + wall * 0.15) % 1;
      } else {
        const k = smooth(st.t - T2, 0, TURN_TIME);
        strollQuat.current.copy(model.walkQuat).slerp(tgtQuat, k);
        walkW = 0.55 * (1 - k);
        step.current = (step.current + wall * 0.9 * (1 - k)) % 1;
      }
      g.quaternion.copy(strollQuat.current);
      // Al girar sobre sí mismo, los pies siguen en el apoyo
      feetWorld.copy(model.feet).multiplyScalar(tgtScale).applyQuaternion(g.quaternion);
      g.position.copy(anchor).sub(feetWorld);
      if (st.t >= T2 + TURN_TIME) {
        st.active = false;
        if (spot) spot.cur = st.to;
        if (st.then === "fuego") shot.current = { name: "fuego", at: t };
        idleNext.current = t + IDLE_EVERY_MIN;
      }
    }

    /* ---- Velocidad, para encadenar vuelos ---- */
    if (hasPrev.current && wall > 1e-4) {
      model.step.subVectors(g.position, prevPos.current).divideScalar(wall);
      vel.current.lerp(model.step, 1 - Math.pow(0.002, wall));
    }
    prevPos.current.copy(g.position);
    hasPrev.current = true;

    /* ---- Fases del vuelo ---- */
    // Un vuelo encadenado ya va en el aire: no hay despegue que mezclar. Y
    // hacia el hueco de volar a tu lado no aterriza ni frena: sigue batiendo
    const takeoff = fl.inAir ? 1 : smooth(u, 0, TAKEOFF_END);
    const air = fl.active
      ? takeoff * (hovering ? 1 : 1 - smooth(u, LAND_FROM, 1))
      : hovering ? 1 : 0;
    const glide = fl.active
      ? smooth(u, GLIDE_FROM, GLIDE_FULL) * (hovering ? 1 - smooth(u, 0.78, 0.98) : 1)
      : 0;
    const flare = fl.active && !hovering
      ? smooth(u, FLARE_FROM, FLARE_FULL) * (1 - smooth(u, 0.95, 1))
      : 0;
    const rest = (1 - Math.max(air, flare)) * (1 - walkW);
    baseScale.current = g.scale.x;
    /*
     * En el aire, más pequeño. Con las alas extendidas el bicho ocupa el
     * doble de ancho que posado con ellas recogidas, y en vuelo «se vuelve muy
     * grande hasta posarse» (Matthew, 4 oct 2026). Se encoge lo que crece.
     */
    if (!reducedMotion) g.scale.multiplyScalar(1 - AIR_SHRINK * Math.max(air, flare * 0.7));
    dragonScreen.moving = fl.active || st.active || hovering;

    /*
     * Alabeo: al girar en el aire se inclina hacia dentro de la curva, como
     * un ave. Sale de lo que gira el rumbo en cada fotograma, no de una
     * curva fija: los giros fuertes son el despegue y la llegada, cuando pasa
     * de mirar a cámara a cruzar de perfil.
     */
    {
      const fwd = model.fwd.set(0, 0, 1).applyQuaternion(g.quaternion);
      const yaw = Math.atan2(fwd.x, fwd.z);
      let dYaw = yaw - model.prevYaw.value;
      if (dYaw > Math.PI) dYaw -= Math.PI * 2;
      if (dYaw < -Math.PI) dYaw += Math.PI * 2;
      model.prevYaw.value = yaw;
      const rate = wall > 1e-4 ? dYaw / wall : 0;
      // Sosteniéndose, un balanceo lento de ala a ala
      const rock = hovering && !fl.active ? Math.sin(t * 0.6) * 0.1 : 0;
      const want = reducedMotion
        ? 0
        : (THREE.MathUtils.clamp(-rate * 0.22, -BANK, BANK) + rock) * air;
      model.bank.value += (want - model.bank.value) * (1 - Math.pow(0.01, wall));
      if (Math.abs(model.bank.value) > 1e-4) g.rotateZ(model.bank.value);
    }

    /*
     * Scroll. Posado, la percha se mueve con la página y el bicho con ella;
     * quieto como un cromo pegado se leía como una pegatina. Así que acusa el
     * movimiento: abre algo las alas para equilibrarse y echa el pecho contra
     * el tirón.
     */
    const rawScroll = wall > 1e-4 ? (scrollY - lastScroll.current) / wall : 0;
    lastScroll.current = scrollY;
    scrollVel.current += (THREE.MathUtils.clamp(rawScroll, -8000, 8000) - scrollVel.current) *
      (1 - Math.pow(0.0005, wall));
    const sway = reducedMotion
      ? 0
      : THREE.MathUtils.clamp(scrollVel.current / SCROLL_FULL, -1, 1) * rest;

    /* ---- Por su cuenta, si el visitante se queda quieto ---- */
    const sc = shot.current;
    const shotDur = sc.name ? actions[sc.name].getClip().duration : 0;
    const shotT = t - sc.at;
    const shotLive = sc.name !== "" && shotT >= 0 && shotT < shotDur;
    if (!shotLive && sc.name) sc.name = "";
    const quiet = (performance.now() - activeAt.current) / 1000;
    if (
      !reducedMotion &&
      !hovering &&
      quiet > IDLE_AFTER &&
      t > idleNext.current &&
      !fl.active &&
      !st.active &&
      !shotLive
    ) {
      // Lo que puede hacer: pasear solo si su percha tiene tramo libre
      const room = spot && spot.maxX - spot.minX > 90 ? spot : undefined;
      const options = ["estirarse", "mirar", ...(room ? ["pasear", "pasear"] : [])].filter(
        (o) => o !== idleLast.current,
      );
      const pick = options[Math.floor(Math.random() * options.length)];
      idleLast.current = pick;
      if (pick === "pasear" && room) {
        // Al otro lado del tramo, o a un punto al azar si está en medio
        const span = room.maxX - room.minX;
        let to = room.cur - room.minX > span / 2 ? room.minX : room.maxX;
        to = THREE.MathUtils.lerp(room.cur, to, 0.5 + Math.random() * 0.5);
        room.face = 0;
        Object.assign(st, {
          active: true,
          id: room.id,
          from: room.cur,
          to,
          t: 0,
          walk: Math.max(Math.abs(to - room.cur) / (STRIDE * domScale * ppu * WALK_HZ), 0.6),
          hz: WALK_HZ,
          then: "",
        });
      } else if (pick === "estirarse") {
        shot.current = { name: "estirarse", at: t };
      } else {
        lookAround.current = t;
      }
      idleNext.current =
        t + IDLE_EVERY_MIN + Math.random() * (IDLE_EVERY_MAX - IDLE_EVERY_MIN);
    }

    /* ---- Ratón cerca ---- */
    const pointer = pointerRef?.current;
    if (pointer && pointer.movedAt > 0 && dragonScreen.live > 0) {
      const pxp = (pointer.x * 0.5 + 0.5) * W;
      const pyp = (-pointer.y * 0.5 + 0.5) * H;
      const dist = Math.hypot(pxp - dragonScreen.x * W, pyp - dragonScreen.y * H);
      const near = 1 - smooth(dist / Math.max(dragonScreen.r * H, 1), 1, 2.6);
      alert.current += (near * rest - alert.current) * (1 - Math.pow(0.05, wall));
    }

    /* ---- Fuego ---- */
    const burning = !reducedMotion && shotLive && sc.name === "fuego";
    const blaze = burning
      ? smooth(shotT, FIRE_FROM, FIRE_FULL) * (1 - smooth(shotT, FIRE_FADE, FIRE_OUT))
      : 0;
    const roar = !reducedMotion && shotLive && sc.name === "rugido"
      ? smooth(shotT, 0.3, 0.6) * (1 - smooth(shotT, 1.1, 1.45))
      : 0;
    const flicker = 0.74 + 0.26 * Math.sin(t * 11.3) * Math.sin(t * 6.7);
    fire.current = blaze * flicker;
    // Llama de unas dos veces el bicho: la de vuelo se diseñó a escala 0.77
    fireScale.current = THREE.MathUtils.clamp(g.scale.x / 0.45, 0.35, 1);

    /* ---- Clips ---- */
    // Encadenado o sosteniéndose, ritmo de crucero; sostenerse, algo más lento
    const beat = hovering && !fl.active
      ? FLAP_HOVER
      : fl.inAir
        ? FLAP_CRUISE
        : THREE.MathUtils.lerp(FLAP_CRUISE, FLAP_TAKEOFF, 1 - smooth(u, 0, 0.3));
    flap.current = (flap.current + wall * beat * (1 - glide * 0.85)) % 1;
    const motion = reducedMotion ? 0 : 1;
    const wVuelo = air * (1 - glide) * (1 - flare) * motion;
    const wPlaneo = air * glide * (1 - flare) * motion;
    const wFrenado = flare * motion;
    const set = (a: THREE.AnimationAction, w: number, time: number) => {
      a.setEffectiveWeight(w);
      a.time = time;
    };
    set(actions.vuelo, wVuelo, flap.current * actions.vuelo.getClip().duration);
    set(actions.planeo, wPlaneo, 0);
    set(actions.frenado, wFrenado, 0);
    set(actions.caminar, walkW * motion, step.current * actions.caminar.getClip().duration);
    for (const name of ["fuego", "rugido", "estirarse"] as const) {
      const on = shotLive && sc.name === name && !reducedMotion;
      set(actions[name], on ? 1 : 0, on ? Math.min(shotT, shotDur - 1e-3) : 0);
    }
    for (const bone of model.touched) bone.quaternion.copy(model.base.get(bone)!);
    model.touched.clear();
    model.mixer.update(0);

    /* ---- Encima de los clips: respiración, alas, cola ---- */
    g.updateMatrixWorld(true);
    const { modelQuat, modelQuatInv, qa, qb, axis } = model;
    model.root.getWorldQuaternion(modelQuat);
    modelQuatInv.copy(modelQuat).invert();
    /**
     * Gira un hueso alrededor de su articulación, con el eje dado en el
     * espacio del modelo (X lateral, Y arriba, Z hocico).
     */
    const turn = (bone: THREE.Bone | undefined, ax: number, ay: number, az: number, angle: number) => {
      if (!bone || Math.abs(angle) < 1e-5) return;
      if (!model.touched.has(bone)) {
        model.base.get(bone)?.copy(bone.quaternion);
        model.touched.add(bone);
      }
      (bone.parent ?? bone).getWorldQuaternion(qa);
      qb.copy(modelQuatInv).multiply(qa).invert();
      axis.set(ax, ay, az).applyQuaternion(qb).normalize();
      qb.setFromAxisAngle(axis, angle);
      bone.quaternion.premultiply(qb);
      bone.updateMatrixWorld(true);
    };

    const calm = rest * (shotLive ? 0.3 : 1);
    if (!reducedMotion) {
      // Respira: el pecho sube y baja, y las alas acompañan. Con la página en
      // marcha se agarra: alas a medio abrir y el pecho contra el tirón
      const breath = Math.sin(t * 1.7);
      turn(bones.pecho, 1, 0, 0, -breath * 0.025 * calm - sway * 0.09);
      const lift =
        (Math.sin(t * 1.7 + 0.6) * 0.025 + alert.current * 0.16) * calm +
        Math.abs(sway) * 0.3;
      // El ala izquierda del modelo es la de +X: sube girando hacia +Y
      turn(bones["ala_hombro.L"], 0, 0, 1, lift);
      turn(bones["ala_hombro.R"], 0, 0, 1, -lift);
      // Cola: posado se mece despacio; en el aire ondula con la batida
      const n = model.tail.length;
      for (let i = 0; i < n; i++) {
        const k = (i + 1) / n;
        const swing = Math.sin(t * 1.15 - i * 0.45) * 0.045 * k * calm;
        const wave = Math.sin(flap.current * Math.PI * 2 - i * 0.55) * 0.06 * k * air;
        turn(model.tail[i], 0, 1, 0, swing);
        // La cola hace de contrapeso cuando la página tira de él
        turn(model.tail[i], 1, 0, 0, wave - sway * 0.05 * k);
      }
    }

    /*
     * Te mira. El punto que mira está por delante del bicho, hacia quien mira
     * la pantalla: con el cursor encima te mira a ti. Si lleva un rato solo,
     * mira alrededor.
     */
    let yawWant = 0;
    let pitchWant = 0;
    let wantLook = 0;
    const head = bones.cabeza;
    const la = t - lookAround.current;
    if (!reducedMotion && la >= 0 && la < LOOKAROUND_TIME) {
      const env = smooth(la, 0, 0.6) * (1 - smooth(la, LOOKAROUND_TIME - 0.8, LOOKAROUND_TIME));
      yawWant = Math.sin((la / LOOKAROUND_TIME) * Math.PI * 2) * 0.85;
      pitchWant = 0.12 + Math.sin(la * 2.1) * 0.08;
      wantLook = env * rest;
    } else if (!reducedMotion && pointer && pointer.movedAt > 0 && head) {
      const { gazePoint, gazeDir, headPos } = model;
      head.getWorldPosition(headPos);
      gazePoint.set(pointer.x, pointer.y, 0.5).unproject(cam);
      gazeDir.subVectors(gazePoint, cam.position).normalize();
      gazePoint
        .copy(cam.position)
        .addScaledVector(gazeDir, cam.position.distanceTo(headPos) * 0.8);
      gazeDir.subVectors(gazePoint, headPos).normalize().applyQuaternion(modelQuatInv);
      yawWant = THREE.MathUtils.clamp(Math.atan2(gazeDir.x, gazeDir.z), -LOOK_YAW, LOOK_YAW);
      pitchWant = THREE.MathUtils.clamp(
        Math.asin(THREE.MathUtils.clamp(gazeDir.y, -1, 1)) - HEAD_REST_PITCH,
        -LOOK_DOWN,
        LOOK_UP,
      );
      // De espaldas al cursor no lo intenta: se queda mirando al frente
      wantLook = rest * (shotLive ? 0 : 1) * (gazeDir.z > -0.2 ? 1 : 0);
    }
    const ease = 1 - Math.pow(0.04, wall);
    look.current.x += (THREE.MathUtils.clamp(yawWant, -LOOK_YAW, LOOK_YAW) * wantLook - look.current.x) * ease;
    look.current.y += (pitchWant * wantLook - look.current.y) * ease;
    for (const [name, yawShare, pitchShare] of NECK_SHARE) {
      turn(bones[name], 0, 1, 0, look.current.x * yawShare);
      turn(bones[name], 1, 0, 0, -look.current.y * pitchShare);
    }

    /* ---- Piel ---- */
    // El grabado respira posado, sube con el ratón cerca y arde con el fuego
    uniforms.uLineGlow.value = reducedMotion
      ? 0.6
      : 0.45 + Math.sin(t * 1.3) * 0.12 + alert.current * 0.55 + blaze * 1.3 + roar * 1.6 + air * 0.2;
    uniforms.uMouth.value = blaze * flicker + roar * 0.35;
    // Sobre el navy, las alas oscuras se perdían en el fondo: más borde cian
    uniforms.uRimStrength.value = lightMode ? 0.32 : 0.58;

    // En el aire el cuerpo acusa la batida: sube con cada golpe de ala
    if (!reducedMotion) {
      const stroke = Math.sin((flap.current - 0.05) * Math.PI * 2);
      g.position.y += stroke * 0.25 * g.scale.x * 4 * wVuelo;
      g.rotateX(Math.sin((flap.current - 0.1) * Math.PI * 2) * 0.06 * wVuelo);
    }

    /* ---- Divisor plano / realidad (portada) ---- */
    const split = THREE.MathUtils.clamp(planSplit.amount, 0, 1);
    splitAmt.current += (split - splitAmt.current) * (1 - Math.pow(0.02, d));
    uniforms.uSplit.value = THREE.MathUtils.clamp(planSplit.x, 0, 1);
    uniforms.uSplitAmt.value = splitAmt.current;
    state.gl.getDrawingBufferSize(uniforms.uViewport.value);

    /* ---- Boca, en mundo ---- */
    g.updateMatrixWorld(true);
    model.boca.getWorldPosition(mouth.current);
    model.boca.getWorldQuaternion(qa);
    aim.current.copy(model.mouthAimLocal).applyQuaternion(qa).normalize();

    /* ---- Dónde ha quedado en pantalla ---- */
    const { screen, probe } = model;
    screen.copy(g.position).project(cam);
    probe.copy(g.position);
    probe.y += model.half.y * g.scale.y;
    probe.project(cam);
    dragonScreen.x = screen.x * 0.5 + 0.5;
    dragonScreen.y = -screen.y * 0.5 + 0.5;
    dragonScreen.r = Math.max(Math.abs(probe.y - screen.y) * 0.5, 0.02);
    dragonScreen.live = 1;
    dragonScreen.target = target.current;

    /*
     * Sombra de contacto. Posado sobre un panel o un titular, sin sombra
     * parecía recortado y pegado encima de la página; con una mancha suave
     * bajo las patas se apoya. Solo en las perchas de la página (la W ya es
     * 3D y tiene su luz) y se va al despegar.
     */
    const sh = shadow.current;
    if (sh) {
      const on = target.current !== "hero" && !hovering && !reducedMotion
        ? (1 - air) * (1 - flare * 0.8)
        : 0;
      shadowAmt.current += (on - shadowAmt.current) * (1 - Math.pow(0.002, wall));
      const mat = sh.material as THREE.ShaderMaterial;
      mat.uniforms.uOpacity.value = shadowAmt.current * (lightMode ? 0.26 : 0.5);
      sh.visible = shadowAmt.current > 0.01;
      if (sh.visible) {
        const wPx = dragonPx.current.w * 0.5 * (baseScale.current / domScale);
        const wWorld = wPx / Math.max(ppu, 1);
        sh.position.copy(anchor);
        sh.scale.set(wWorld, wWorld * 0.16, 1);
      }
    }

    /*
     * El botón invisible sigue al bicho; solo se escribe si se ha movido.
     * Su tamaño va por `scale` y no por `width`/`height`: volando, el radio
     * cambia con cada batida y cambiar el ancho de un elemento obliga a
     * recalcular la página en cada fotograma. Sosteniéndose en el aire con
     * la página bajando, la escena perdía un tercio de los fotogramas («se
     * pone lento», Matthew, 15 oct 2026).
     */
    const b = hit.current;
    if (b) {
      const hx = Math.round(dragonScreen.x * W);
      const hy = Math.round(dragonScreen.y * H);
      const hr = Math.round(Math.max(dragonScreen.r * H * 0.9, 22) / 4) * 4;
      const box = hitBox.current;
      if (hx !== box.x || hy !== box.y || hr !== box.r) {
        box.x = hx;
        box.y = hy;
        box.r = hr;
        b.style.transform = `translate3d(${hx - hr}px, ${hy - hr}px, 0) scale(${hr / HIT_BASE})`;
      }
    }

    /* ---- Invitación a tocarlo ---- */
    const busyNow = fl.active || st.active || hovering || shotLive;
    if (busyNow) restSince.current = t;
    const hn = hint.current;
    if (hn) {
      const hs = hintState.current;
      const lang = document.documentElement.lang === "en" ? "en" : "es";
      if (lang !== hs.lang) {
        hs.lang = lang;
        hn.text.textContent =
          lang === "es" ? (hs.touch ? "Tócalo" : "Haz clic") : hs.touch ? "Tap it" : "Click it";
        hn.sub.textContent = lang === "es" ? "lanza fuego" : "breathes fire";
        // Se mide solo al cambiar el texto: leer el ancho en cada fotograma
        // obligaba a recalcular el layout justo después de mover el botón
        hs.half = hn.text.parentElement
          ? hn.text.parentElement.offsetWidth * 0.5 + 8
          : 90;
      }
      // Dentro de la ventana: en el teléfono, centrada sobre la cabeza, se salía
      const hx = Math.round(THREE.MathUtils.clamp(dragonScreen.x * W, hs.half, W - hs.half));
      const hy = Math.round((dragonScreen.y - dragonScreen.r * 1.05) * H);
      // Sale cuando lleva un momento posado y no queda debajo de la barra
      const on = !hs.done && !busyNow && t - restSince.current > HINT_AFTER && hy > 110;
      if (on !== hs.on) {
        hs.on = on;
        hn.el.classList.toggle("is-on", on);
        hn.ring.classList.toggle("is-on", on);
      }
      if (on && (hx !== hs.x || hy !== hs.y)) {
        hs.x = hx;
        hs.y = hy;
        hn.el.style.transform = `translate3d(${hx}px, ${hy}px, 0)`;
      }
      // El aro: centrado en el cuerpo, del tamaño del bicho
      const rx = Math.round(dragonScreen.x * W);
      const ry = Math.round(dragonScreen.y * H);
      const rr = Math.round(Math.max(dragonScreen.r * H * 1.15, 34));
      if (on && (rx !== hs.rx || ry !== hs.ry || rr !== hs.rr)) {
        hs.rx = rx;
        hs.ry = ry;
        if (rr !== hs.rr) {
          hs.rr = rr;
          hn.ring.style.width = `${rr * 2}px`;
          hn.ring.style.height = `${rr * 2}px`;
        }
        hn.ring.style.transform = `translate3d(${rx - rr}px, ${ry - rr}px, 0)`;
      }
    }

    if (debug.on) {
      const mo = mouth.current.clone().project(cam);
      (window as unknown as { __dragon?: object }).__dragon = {
        target: target.current,
        flying: fl.active,
        u,
        walking: st.active,
        shot: sc.name,
        weights: {
          vuelo: wVuelo,
          planeo: wPlaneo,
          frenado: wFrenado,
          caminar: walkW,
        },
        screen: [dragonScreen.x, dragonScreen.y, dragonScreen.r],
        mouth: [(mo.x * 0.5 + 0.5) * W, (-mo.y * 0.5 + 0.5) * H],
        fire: fire.current,
        look: [look.current.x, look.current.y],
        hit: hitBox.current,
        spots: spots.current.map((s) => ({
          id: s.id,
          x: Math.round(s.x),
          cur: Math.round(s.cur),
          range: [Math.round(s.minX), Math.round(s.maxX)],
          blocked: s.blocked,
          y: Math.round(s.y),
          ground: Math.round(surfaceAt(s, s.cur, dragonPx.current.w * 0.18)),
          now: Math.round(s.el.getBoundingClientRect().top + window.scrollY),
        })),
        px: dragonPx.current,
        fireNow: () => {
          shot.current = { name: "fuego", at: sim.current };
        },
        play: (name: Shot) => {
          shot.current = { name, at: sim.current };
        },
        idleNow: () => {
          activeAt.current = -1e9;
          idleNext.current = 0;
        },
      };
    }

    /* ---- Aviso al DOM ---- */
    const lit = fire.current > 0.3;
    if (lit !== firing.current) {
      firing.current = lit;
      window.dispatchEvent(new CustomEvent("bouw:fire", { detail: { on: lit } }));
    }
  });

  return (
    <>
      {/* Antes que el bicho y sin profundidad: queda debajo de las patas */}
      <mesh ref={shadow} visible={false} renderOrder={-1} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          depthTest={false}
          toneMapped={false}
          uniforms={shadowUniforms}
          vertexShader={SHADOW_VERT}
          fragmentShader={SHADOW_FRAG}
        />
      </mesh>

      <group ref={group} visible={false}>
        <primitive object={model.root} />
      </group>

      <FireBreath
        originRef={mouth}
        aimRef={aim}
        powerRef={fire}
        count={140}
        reducedMotion={reducedMotion}
        scaleRef={fireScale}
      />
    </>
  );
}
