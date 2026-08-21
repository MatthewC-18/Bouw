import * as THREE from "three";
import { LAST_STAGE } from "./layouts";

/**
 * Escenarios.
 *
 * Cada sección tiene un **circuito**, no una pose. Esta es la corrección de
 * la ronda anterior: el bicho se plantaba en un punto y se quedaba ahí
 * respirando, y eso —por muy bien colocado que estuviera— no es volar. Nada
 * que vuele se detiene en el aire; incluso lo que "espera" traza un círculo.
 * Un animal clavado con las alas moviéndose es exactamente la sensación de
 * maqueta colgada de un hilo que llevamos tres rondas persiguiendo.
 *
 * Así que en cada sección el dragón recorre una órbita cerrada, y el hueco
 * entre dos secciones es el arco que lo lleva de una a la siguiente. Nunca
 * está quieto; lo que cambia por sección es el carácter del vuelo:
 *
 *   0  Portada    círculo corto y cercano, medio construido
 *   1-4 Proyectos vueltas anchas al fondo, alternando de lado
 *   5  Diagnóstico órbita amplia y lenta, muy al fondo
 *   6  La cuenta  pasada lateral larga con el barrido recorriéndolo
 *   7  Nosotros   círculo pequeño y bajo, casi planeando
 *   8  Contacto   se sostiene arriba a la izquierda, escupiendo fuego
 *
 * La órbita es una Lissajous 1:2 —una vuelta en horizontal por cada dos en
 * vertical—, que dibuja un ocho tumbado. Una elipse simple se delata a la
 * segunda vuelta; el ocho tarda mucho más en leerse como bucle.
 *
 * El clímax sigue siendo el salto 6 → 7, que cae en el troquel —el único
 * hueco del dossier sin pliego delante— y ahí el arco se abre hacia cámara.
 */

export type Scene = {
  /** Centro del circuito, en mundo. */
  pos: THREE.Vector3;
  /** Radios del circuito: x lateral, y vertical, z en profundidad. */
  radius: THREE.Vector3;
  /**
   * Segundos por vuelta.
   *
   * Bajaron todos un tercio. La vuelta era el motivo real de que el vuelo se
   * leyera lento, y no se veía en ninguna captura: los radios están bien —el
   * bicho recorre el sitio que tiene que recorrer— pero lo recorría en trece
   * segundos, y a esa velocidad el desplazamiento por pantalla queda por
   * debajo del umbral en el que el ojo lee «va hacia algún sitio». Se leía
   * como deriva.
   *
   * Se han tocado los periodos y no los radios a propósito: el encuadre está
   * medido —cuánto ocupa, por dónde entra, dónde choca con el titular— y
   * ensanchar los circuitos habría vuelto a sacarlo por los bordes.
   */
  period: number;
  /** Desfase inicial: evita que dos secciones seguidas vayan en sincronía. */
  phase: number;
  /** Dirección que da forma al arco de tránsito, no al vuelo en sección. */
  aim: THREE.Vector3;
  /** Escala relativa: compensa la distancia y el sitio que deja la sección. */
  scale: number;
  /** Barrido de escáner atado al scroll dentro de la sección. */
  scan: number;
  /**
   * Despiece.
   *
   * Se queda a cero en todas: separaba las piezas del bicho y solo se
   * entendía acompañado de llamadas numeradas, que era pedirle al visitante
   * que leyera una lámina de montaje para entender un fondo. La maquinaria
   * sigue en el shader — subir este número a 1 la devuelve.
   */
  explode: number;
  /** Cuánto se aleja del circuito antes de encarar el siguiente. */
  lead: number;
  /**
   * Cuánto se abre el arco de salida hacia la cámara.
   *
   * Es lo que convierte el tránsito en una pasada y no en un deslizamiento
   * lateral. Todos subieron mucho respecto a la ronda anterior: el arco tiene
   * que traer al bicho al primer plano, porque el hueco entre secciones es el
   * único momento del recorrido en el que no hay nada que leer y por tanto el
   * único en el que se le puede mirar de cerca.
   */
  bulge: number;
  /**
   * Cuánto pica al salir antes de remontar hacia el siguiente circuito.
   *
   * Sin esto el arco es plano y el tránsito se lee como un traslado. Picar y
   * remontar es lo que hace cualquier cosa con alas al cambiar de altura:
   * cambia peso por velocidad y lo devuelve.
   */
  dip: number;
  /**
   * Cuánto sube el circuito en ventanas estrechas.
   *
   * Se aplica en proporción a lo estrecha que sea: cero a 16:9, entero en una
   * casi cuadrada. En la portada es lo que salva el encuadre — ahí el titular
   * ocupa el ancho completo y el único hueco libre es la banda de arriba, así
   * que comprimir de lado solo llevaba al bicho a chocar con las letras en
   * vez de con el borde.
   */
  lift: number;
};

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const dir = (x: number, y: number, z: number) =>
  new THREE.Vector3(x, y, z).normalize();

export const SCENES: Scene[] = [
  /* 0 — Portada. Vuelta corta y cerca de cámara, a la derecha del titular.
     Medio construido: la mitad delantera ya es materia. */
  {
    pos: v(2.8, 0.4, 0.9),
    radius: v(1.5, 0.85, 2.0),
    period: 6.5,
    phase: 0,
    aim: dir(-0.62, -0.04, 0.78),
    scale: 0.85,
    scan: 0,
    explode: 0,
    lead: 3.4,
    bulge: 5.6,
    dip: 1.4,
    lift: 1.15,
  },

  /* 1-4 — Proyectos. Vueltas anchas alternando de lado con la maqueta de cada
     ficha. Están más adelante que en la ronda anterior: al fondo el bicho
     ocupaba un 12 % del alto de la ventana y no se le apreciaba ni el coleo
     ni el pliegue de las patas. Es también el tramo en el que pasa de plano a
     materia. */
  {
    pos: v(-4.0, 0.6, -1.4),
    radius: v(2.6, 1.0, 2.6),
    period: 8.5,
    phase: 1.1,
    aim: dir(1, 0.02, 0.06),
    scale: 0.85,
    scan: 0,
    explode: 0,
    lead: 4.2,
    bulge: 6.2,
    dip: 1.8,
    lift: 0.5,
  },
  {
    pos: v(4.0, -0.5, -1.4),
    radius: v(2.6, 1.0, 2.6),
    period: 8.2,
    phase: 2.4,
    aim: dir(-1, -0.02, 0.06),
    scale: 0.85,
    scan: 0,
    explode: 0,
    lead: 4.2,
    bulge: 6.2,
    dip: 1.8,
    lift: 0.5,
  },
  {
    pos: v(-3.9, 0.85, -1.0),
    radius: v(2.7, 1.1, 2.6),
    period: 7.8,
    phase: 0.4,
    aim: dir(1, 0.02, 0.08),
    scale: 0.88,
    scan: 0,
    explode: 0,
    lead: 4.2,
    bulge: 6.2,
    dip: 1.8,
    lift: 0.5,
  },
  {
    pos: v(3.8, -0.7, -1.0),
    radius: v(2.7, 1.1, 2.6),
    period: 7.5,
    phase: 3.0,
    aim: dir(-1, -0.02, 0.08),
    scale: 0.88,
    scan: 0,
    explode: 0,
    lead: 4.0,
    bulge: 6.6,
    dip: 2.0,
    lift: 0.5,
  },

  /* 5 — Diagnóstico. El velo abre los márgenes de la sección, así que la órbita
     se ensancha para asomar por ellos: es la más ancha de todas. Lenta, eso
     sí — la sección es densa y un vuelo rápido detrás competiría con cuatro
     tarjetas de texto. */
  {
    pos: v(0.1, 0.1, -2.6),
    radius: v(4.2, 1.2, 2.8),
    period: 10.2,
    phase: 1.8,
    aim: dir(-0.42, 0.02, 0.91),
    scale: 0.95,
    scan: 0,
    explode: 0,
    lead: 4.6,
    bulge: 6.8,
    dip: 2.0,
    lift: 0.35,
  },

  /* 6 — La cuenta. Pasada lateral larga y aplanada: recorre el pliego de un
     margen al otro mientras una línea de escáner lo barre del hocico a la
     cola al ritmo del scroll. */
  {
    pos: v(-0.2, 0.3, -0.8),
    radius: v(4.6, 0.8, 2.0),
    period: 8.8,
    phase: 2.9,
    aim: dir(-1, 0.03, 0.12),
    scale: 0.9,
    scan: 1,
    explode: 0,
    lead: 5.2,
    /* El único clímax del recorrido. La salida de la cuenta cae en el troquel
       —el hueco sin pliego delante— así que el arco se abre hacia la cámara
       y el bicho pasa por encima del lector a tamaño real. Sube de 12 a 14
       porque ahora aquí además gira sobre sí mismo y suelta fuego, y un tonel
       que se ve pequeño y al fondo no es un tonel: ver `CLIMAX_*` en
       `Dragon.tsx`. Los demás tránsitos se quedan como estaban — el contraste
       se hace subiendo este, no bajando los otros siete. */
    bulge: 14.0,
    dip: 0.7,
    lift: 0.3,
  },

  /* 7 — Nosotros. Círculo pequeño y bajo, a la derecha. Después del troquel
     toca bajar el pulso: la sección habla de oficio y de años, no de
     potencia, y el bicho planea más de lo que bate. */
  {
    pos: v(4.0, -1.0, 0.6),
    radius: v(1.8, 0.7, 1.9),
    period: 10.8,
    phase: 0.9,
    aim: dir(-0.86, 0.06, 0.51),
    scale: 0.9,
    scan: 0,
    explode: 0,
    lead: 3.2,
    bulge: 5.8,
    dip: 1.6,
    lift: 0.6,
  },

  /* 8 — Contacto. Se sostiene arriba a la izquierda con la llama cruzando el
     hueco que deja el formulario. La órbita es mínima: aquí sí está batiendo
     en el sitio, y eso es legible porque está escupiendo fuego — un animal
     que se sostiene para quemar algo, no uno que espera. */
  {
    pos: v(-3.1, 1.5, 2.2),
    radius: v(1.1, 0.6, 1.2),
    period: 5.6,
    phase: 2.1,
    aim: dir(0.94, 0.32, -0.1),
    scale: 0.95,
    scan: 0,
    explode: 0,
    lead: 3.0,
    bulge: 4.4,
    dip: 1.2,
    lift: -0.5,
  },
];

if (SCENES.length !== LAST_STAGE + 1) {
  throw new Error(
    `scenes.ts: ${SCENES.length} escenarios para ${LAST_STAGE + 1} etapas`,
  );
}

/**
 * Compresión horizontal según el aspecto de la ventana.
 *
 * Los escenarios están compuestos contra un encuadre ancho: en la portada el
 * bicho vuela a la derecha del titular, y en Proyectos alterna de un margen al
 * otro. Nada de eso cabe en una ventana casi cuadrada — medido en una de
 * 961 × 910, el centro de la órbita de portada caía al 124 % del ancho, o sea
 * fuera de pantalla entera.
 *
 * Y no se veía venir: el bicho seguía ahí, del tamaño correcto, girando y
 * aleteando. Solo que a la derecha del borde.
 *
 * Así que el reparto lateral se encoge con el aspecto. La referencia es 16:9,
 * donde vale 1; por debajo se comprime hacia el eje de cámara. El suelo evita
 * que en una ventana muy estrecha todo se apelotone en el centro.
 */
const REFERENCE_ASPECT = 16 / 9;

export function spreadFor(aspect: number): number {
  const r = aspect / REFERENCE_ASPECT;
  return Math.min(Math.max(r * r, 0.3), 1);
}

export function sceneAt(i: number): Scene {
  return SCENES[Math.min(Math.max(i, 0), LAST_STAGE)];
}

/**
 * Punto del circuito en el instante `t`, y su tangente.
 *
 * El ocho sale de recorrer el vertical al doble de velocidad que el
 * horizontal. La tangente es la derivada exacta, no una diferencia entre dos
 * muestras: de ella sale el rumbo del bicho, y una tangente aproximada mete
 * un temblor que se ve en el cuello.
 */
export function orbitAt(
  scene: Scene,
  t: number,
  outPos: THREE.Vector3,
  outTan: THREE.Vector3,
) {
  const w = (Math.PI * 2) / scene.period;
  const a = w * t + scene.phase;
  const { pos, radius } = scene;

  outPos.set(
    pos.x + radius.x * Math.sin(a),
    pos.y + radius.y * Math.sin(2 * a + 0.7),
    pos.z + radius.z * Math.cos(a),
  );

  outTan
    .set(
      radius.x * w * Math.cos(a),
      radius.y * 2 * w * Math.cos(2 * a + 0.7),
      -radius.z * w * Math.sin(a),
    )
    .normalize();
}
