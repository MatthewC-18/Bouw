"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import FireBreath from "./FireBreath";
import { LAST_STAGE, travelAt } from "./layouts";
import { BRAND } from "./logoShapes";
import { orbitAt, sceneAt, spreadFor } from "./scenes";
import { splitUniforms } from "./planSplitMaterial";
import { dragonScreen } from "@/lib/dragonScreen";
import { planSplit } from "@/lib/planSplit";
import { debug } from "@/lib/debug";

type Props = {
  /** Etapa continua del scroll: 0 hero … 8 contacto */
  stageRef: RefObject<number>;
  reducedMotion: boolean;
  /**
   * Salidas hacia el campo de piezas: dónde está el frente de construcción en
   * mundo y cuánto lleva construido. Las piezas de la marca vuelan ahí, y ese
   * punto es el único sitio donde el encuentro cuadra en pantalla.
   */
  frontRef: RefObject<THREE.Vector3>;
  buildRef: RefObject<number>;
  /** Caudal con signo: >0 construyendo, <0 deshaciendo, 0 en reposo. */
  flowRef: RefObject<number>;
  /**
   * Avance dentro de la sección en la que está posado, 0 … 1.
   *
   * La etapa se queda entera mientras el centro de la pantalla recorre una
   * sección, así que por sí sola no sirve para atar nada al scroll *dentro*
   * de un bloque. Esto es lo que mueve el barrido de escáner en Proceso.
   */
  localRef: RefObject<number>;
  /**
   * Puntero en coordenadas de dispositivo normalizadas, y cuándo se movió por
   * última vez. De aquí sale la mirada — ver `GAZE_*`.
   */
  pointerRef: RefObject<{ x: number; y: number; movedAt: number }>;
};

/* ------------------------------------------------------------------ */
/* Pre-carga                                                           */
/* ------------------------------------------------------------------ */

const MODEL_PATH = "/dragon.glb";
useGLTF.preload(MODEL_PATH);

/* ------------------------------------------------------------------ */
/* Constantes de animación                                             */
/* ------------------------------------------------------------------ */

/**
 * El GLB no trae esqueleto ni clips: es una malla suelta de 16 k triángulos.
 * Así que el aleteo no se reproduce, se calcula — la deformación vive en el
 * vertex shader y el hombro, la punta del ala, la cola y el cuello salen de
 * la propia caja del modelo, medida al cargar. Sale gratis en CPU y no
 * depende de que alguien rigge el modelo después.
 */

/** Dónde acaba el cuerpo y arranca el ala, en fracción del semi-ancho. */
const WING_HINGE = 0.15;
/** Ancho del degradado del hombro: pasado ese punto el ala gira entera. */
const WING_BLEND = 0.22;
/** Retraso de la punta respecto al hombro, en radianes. Da el latigazo. */
const WING_LAG = 1.05;

/**
 * Aleteos por segundo batiendo y planeando.
 *
 * El arco se queda donde estaba —57°, que es lo que da la escala: el ojo saca
 * el tamaño de un animal de cuánto abre el ala mucho antes que de cuántos
 * píxeles ocupa—, pero la cadencia sube. A 0.72 Hz el ala tardaba casi un
 * segundo y medio en cerrar el ciclo completo, y a esa velocidad el arco
 * grande no se lee como potencia sino como pesadez.
 *
 * Lo que separa a un animal grande de uno lento no es el ritmo: es la
 * relación entre ritmo y amplitud. Batir hondo Y seguido es lo que hace un
 * ave grande cuando de verdad va a algún sitio; batir hondo y espaciado es lo
 * que hace cuando está a punto de posarse.
 */
const BEAT_FAST = 1.02;
const BEAT_SLOW = 0.5;
/**
 * Amplitud del aleteo, en radianes, batiendo y planeando.
 *
 * `AMP_SLOW` sube de 0.13 a 0.34. A 7° el planeo era un ala congelada: la
 * silueta no cambiaba y el bicho se leía como una lámina. A 19° el ala sigue
 * respirando dentro del planeo, que es lo que hace de verdad —el ala de algo
 * que planea corrige constantemente, solo que poco.
 */
const AMP_FAST = 1.0;
const AMP_SLOW = 0.34;
/** Apertura fija del ala al planear: la V del que no bate. */
const GLIDE_SPREAD = 0.2;

/**
 * Patas: ahora con rodilla.
 *
 * Hasta aquí la pata era UN hueso: todo lo que colgaba de la cadera giraba
 * en bloque. Y un miembro rígido que gira desde arriba tiene un problema de
 * lectura que no se arregla subiendo la amplitud — el recorrido de cada punto
 * es proporcional a su distancia al eje, así que el pie barría media pantalla
 * mientras el muslo, pegado a la cadera, se quedaba prácticamente donde
 * estaba. Se veía moverse la planta y nada más, que es exactamente lo que se
 * ve cuando cuelga una pieza de un hilo.
 *
 * Lo que hace que un miembro se lea como animal es que sus dos tramos giren
 * cada uno lo suyo: el muslo abre desde la cadera y la caña se pliega sobre
 * la rodilla, que además se ha movido de sitio. Con dos ejes el muslo tiene
 * ángulo propio y se ve girar aunque el pie recorra lo mismo que antes.
 *
 * El muslo conserva EXACTAMENTE los valores que ya estaban medidos sobre el
 * modelo: la rodilla es una capa que se suma, no un reparto del recorrido que
 * ya había. Bajar el muslo para hacerle sitio habría arreglado la lectura
 * quitando movimiento, que es al revés de lo que se pedía.
 */
const LEG_TUCK = 1.0;
const LEG_SWING = 0.34;
const LEG_KICK = 1.05;

/**
 * Rodilla.
 *
 * Lleva más recorrido que el muslo a propósito: en cualquier animal la
 * articulación distal es la que cierra el ángulo. `SHIN_TUCK` es el pliegue
 * de base — la rodilla nunca está del todo estirada, y eso solo ya distingue
 * una pata de un palo.
 */
const SHIN_TUCK = 0.55;
const SHIN_SWING = 0.26;
const SHIN_KICK = 0.62;

/**
 * Retraso de la caña respecto al muslo, en radianes de la fase del aleteo.
 *
 * La misma idea que `WING_LAG` en el ala y que el retraso de propagación en
 * la cola: lo que está más lejos del cuerpo llega más tarde. Sin esto los dos
 * tramos giran a la vez y la pata vuelve a leerse como una sola pieza, solo
 * que doblada.
 */
const KNEE_LAG = 0.55;

/**
 * Muelle del recorrido.
 *
 * La posición del bicho ya no sale de una órbita propia: sale de la etapa del
 * scroll. Pero atarla directamente convierte a la criatura en una barra de
 * progreso — se para en seco cuando tú te paras, arranca en seco cuando
 * arrancas, y eso es exactamente lo que delata a un objeto sin masa.
 *
 * Entre el scroll y el dragón va un muelle: la etapa tira de él, él tiene
 * inercia, llega un poco tarde y se pasa un poco de largo antes de asentarse.
 * Es de donde sale el peso. `DAMPING` por debajo de 1 es lo que deja el
 * rebote; a 1 clavado llegaría perfecto y volvería a parecer una barra.
 */
const SPRING = 22;
const DAMPING = 0.72;

/**
 * Arrastre de la cola y anticipación de la cabeza.
 *
 * `WHIP_GAIN` son radianes de retraso de la punta de la cola por cada
 * radián por segundo que gira el cuerpo; `LOOK_GAIN`, qué fracción del giro
 * que viene se adelanta la cabeza. Los topes existen porque en el clímax del
 * troquel el bicho vira muy rápido y sin ellos la cola se enrollaría sobre sí
 * misma.
 *
 * Suben con los circuitos: al acortar los periodos el cuerpo gira más rápido
 * en cada vuelta, así que con los topes de antes la cola llegaba al máximo y
 * se quedaba ahí durante todo el arco. Una cola clavada en su tope es
 * exactamente lo contrario de una cola que arrastra — deja de responder al
 * cuerpo justo cuando más se está moviendo.
 */
const WHIP_GAIN = 0.26;
const WHIP_MAX = 0.56;
const LOOK_GAIN = 0.6;
const LOOK_MAX = 0.42;

/**
 * Cuánto se adelanta el bicho a su propio rumbo, en segundos.
 *
 * De aquí salen tanto la bancada como hacia dónde mira la cabeza. Medio
 * segundo es lo que tarda un animal grande en comprometerse con un viraje;
 * más y se tumba hacia curvas que aún no existen, menos y reacciona tarde.
 */
const AHEAD_TIME = 0.5;

/**
 * La mirada.
 *
 * Cuando el ratón lleva un momento quieto, el bicho levanta la vista y busca
 * el cursor. Es lo más impresionante que puede hacer un animal sin moverse de
 * sitio, y es también lo más barato: no cambia dónde está ni qué ocupa en
 * pantalla, así que no puede estorbar a nadie que esté leyendo. Solo gira el
 * cuello, con el tope que ya tenía.
 *
 * Va atado a la quietud del ratón y no a su movimiento a propósito. Un bicho
 * que persigue el cursor mientras lo mueves es un juguete —y además compite
 * con lo que estés haciendo—; uno que levanta la cabeza cuando **paras** te ha
 * pillado mirando. Es la diferencia entre un efecto y una criatura.
 *
 * `GAZE_HOLD` existe porque ni un animal aguanta la mirada indefinidamente:
 * pasados unos segundos vuelve a lo suyo, y eso es lo que hace que la próxima
 * vez que te mire vuelva a significar algo.
 */
const GAZE_STILL = 0.4;
const GAZE_HOLD = 5.0;
const GAZE_FADE = 1.6;
/** Cuánto puede mandar el cursor frente al rumbo. Nunca del todo. */
const GAZE_MAX = 0.85;

/**
 * Hasta dónde llega el cuello cuando lo que hace es mirarte.
 *
 * Más que `LOOK_MAX`, que es otra cosa: `LOOK_MAX` limita la **anticipación**
 * —cuánto se adelanta la cabeza al viraje— y ahí 24° es de sobra, porque un
 * animal no se descoyunta el cuello para adivinar una curva.
 *
 * Mirar a alguien sí es descoyuntarse un poco. Con 24° la mirada casi nunca
 * llegaba a pasar: medido, el pico era 0.30 sobre 1, porque el bicho vuela un
 * circuito cerrado y su rumbo apunta a cámara solo en un tramo corto de cada
 * vuelta. A 41° la ventana se abre lo justo para que ocurra varias veces por
 * vuelta sin que el cuello se rompa.
 */
const GAZE_REACH = 0.72;

/**
 * De giro a alabeo.
 *
 * Bajada de 2.6 a 1.5 con el panel delante. A 2.6 el bicho medía entre 38° y
 * 55° de inclinación en TODAS las secciones, incluso volando su circuito
 * tranquilo — y algo permanentemente tumbado medio ángulo recto no se lee
 * como vuelo, se lee como viraje perpetuo. A 1.5 el circuito deja unos 22° y
 * el tope solo lo tocan los tránsitos, que es donde de verdad hay un giro
 * fuerte que justificarlo.
 */
const BANK_GAIN = 1.5;
const BANK_MAX = 0.95;

/** Ángulo llevado al rango [-π, π]: un giro de 359° es un giro de -1°. */
function wrapPi(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

/**
 * Umbral en el que el calco de aristas deja de dibujarse.
 *
 * `EdgesGeometry` es una segunda pasada completa por malla, todos los
 * fotogramas. Mientras el bicho es plano paga por sí sola; ya construido, lo
 * único que aporta es una cota tenue que se pierde bajo la escama. Se apaga
 * en cuanto la materia gana, y vuelve para el desarmado.
 */
const WIRE_FADE_FROM = 0.9;
const WIRE_FADE_TO = 0.99;

/** Cuánto empuja cada batida. El animal no avanza a ritmo constante. */
const BEAT_SURGE = 0.52;

/**
 * El clímax del troquel.
 *
 * La página tiene un solo hueco sin pliego delante —el recorte entre los dos
 * pliegos del dossier— y cae justo en el salto de "La cuenta" a "Nosotros".
 * Ya era el único tránsito con el arco abierto hacia cámara. Ahora es también
 * lo único que el bicho hace una sola vez en todo el recorrido: pasa por
 * encima del lector, gira sobre sí mismo y suelta fuego.
 *
 * Va aquí y no repartido por la página a propósito. Lo impresionante sale del
 * contraste: siete tránsitos contenidos y uno que no lo es se recuerdan; ocho
 * tránsitos espectaculares se convierten en el ruido de fondo del sitio y no
 * se recuerda ninguno. Por eso no se ha bajado el pulso de los demás — se ha
 * subido el de este.
 *
 * El tonel entra y sale con velocidad cero: empieza pasado un cuarto del
 * hueco y termina antes del final, para que el bicho llegue al circuito
 * siguiente ya derecho.
 */
const CLIMAX_SEGMENT = 6;
const CLIMAX_ROLL_FROM = 0.22;
const CLIMAX_ROLL_TO = 0.78;

/**
 * Tramo del recorrido en el que el bicho pasa de plano a materia.
 *
 * Arranca en la portada como dibujo y termina construido al llegar a
 * Servicios. Cae justo encima de los cuatro proyectos, que es la sección que
 * vende obra hecha: mientras se baja por ellos el animal se va volviendo
 * real. No se estira hasta el final a propósito — si la materialización
 * durase toda la página, el visitante no llegaría a ver nunca al animal
 * terminado, que es el remate.
 */
const BUILD_FROM = 0.35;
const BUILD_TO = 3.6;

/**
 * Y el tramo en que devuelve lo prestado.
 *
 * La página tiene su propio arco: la marca se desarma al principio y se vuelve
 * a armar antes de contacto. El dragón sigue ese arco en vez de ignorarlo — se
 * construye con las piezas de la B y al final se las devuelve, que es de donde
 * sale la B del cierre. Mark → dragón → marca, y el círculo cierra.
 *
 * No se deshace del todo: la cabeza se queda en materia. Es la que escupe el
 * fuego, y un hocico de alambre echando llama parece un fallo de carga, no una
 * decisión.
 */
const UNBUILD_FROM = 6.3;
const UNBUILD_TO = 7.8;
const UNBUILD_KEEP = 0.4;

/* ------------------------------------------------------------------ */
/* Deformación (GLSL)                                                  */
/* ------------------------------------------------------------------ */

const DEFORM_GLSL = /* glsl */ `
  uniform float uTime;
  uniform float uFlap;   // fase del aleteo, en radianes
  uniform float uAmp;    // amplitud del aleteo — 0 es ala rígida
  uniform float uSway;   // intensidad de cola y cuello
  uniform float uSpread; // apertura fija del ala: la V del planeo
  uniform vec3  uHalf;   // semi-tamaño: x envergadura, y alto, z largo
  uniform float uWingY;  // altura del hombro
  uniform vec2  uWingZ;  // tramo del cuerpo ocupado por el ala, normalizado
  uniform vec2  uHip;    // cadera: altura y posición a lo largo del cuerpo
  uniform vec2  uKnee;   // rodilla en reposo: altura y posición a lo largo
  uniform vec3  uLeg;    // muslo: recogida, balanceo alterno y patada
  uniform vec3  uShin;   // caña: pliegue, balanceo y patada
  uniform float uExplode; // despiece: separa las piezas del torso
  uniform vec2  uWhip;    // arrastre de la cola: giro y cabeceo recientes
  uniform vec2  uLook;    // anticipación de la cabeza hacia donde va

  // Coordenada de construcción (0 hocico, 1 punta de la cola) y posición
  // local sin deformar, que es sobre la que se dibujan las secciones
  varying float vBouwBuild;
  varying vec3 vBouwLocal;

  vec3 bouwPosition;

  void bouwDeform(inout vec3 p, inout vec3 n) {
    // 0 en la punta de la cola, 1 en el hocico
    float zn = clamp(p.z / (2.0 * uHalf.z) + 0.5, 0.0, 1.0);

    // Se guardan antes de tocar nada: la construccion se mide sobre la malla
    // de origen, no sobre la ya doblada por el aleteo
    vBouwLocal = p;
    vBouwBuild = 1.0 - zn;

    /* ---- Alas: giro alrededor del eje del cuerpo ---- */
    float ax = clamp(abs(p.x) / uHalf.x, 0.0, 1.0);
    float side = sign(p.x);

    /* ---- Patas: lo que cuelga por debajo de la cadera ---- */
    // 0 de la cadera hacia arriba, 1 en la planta del pie. El degradado es
    // corto a proposito: la pata gira como un miembro rigido desde la cadera,
    // no como un tallo que se dobla entero.
    /*
     * Y el degradado se estrecha, que es justo lo contrario de lo que hice la
     * vez pasada.
     *
     * Ensancharlo parecia dar mas pata girando, pero hace lo opuesto: la
     * mascara solo vale 1 por DEBAJO del degradado, asi que un degradado
     * ancho empuja la zona de giro pleno hacia el suelo. Con 0.34 del
     * semialto la mascara llegaba al 100 % solo en 137 vertices de 9639 — un
     * canto de 0.08 unidades. La pata no se movia porque practicamente nada
     * estaba dentro.
     *
     * Con 0.12 el miembro entero gira entero y la rampa queda donde tiene que
     * estar: en la articulacion.
     */
    float legM = 1.0 - smoothstep(uHip.x - uHalf.y * 0.12, uHip.x, p.y);
    /*
     * Segunda mascara, para el tramo de debajo de la rodilla.
     *
     * Las dos se calculan aqui, sobre la malla en reposo, y no mas abajo:
     * despues del giro del muslo la altura de un vertice ya no dice a que
     * hueso pertenece — la caña sube al plegarse y se colaria en la mascara
     * del muslo.
     */
    float shinM = 1.0 - smoothstep(uKnee.x - uHalf.y * 0.10, uKnee.x, p.y);

    // Las patas se abren mas que la bisagra del ala, asi que sin descontarlas
    // se iban con el aleteo: un dragon batiendo las piernas
    float wing = smoothstep(${WING_HINGE.toFixed(2)}, ${(WING_HINGE + WING_BLEND).toFixed(2)}, ax)
      * (1.0 - legM);
    // La membrana llega tarde al golpe: la punta arrastra al hombro
    float ph = uFlap - ax * ${WING_LAG.toFixed(2)};
    // El segundo armónico seca la bajada y deja la subida larga, como el ave.
    // Subido de 0.22 a 0.38: con el arco nuevo, casi el doble de amplio, una
    // batida simétrica se leía como un péndulo. Ahora el golpe hacia abajo es
    // corto y seco y la recogida es larga — potencia y recuperación.
    float beat = sin(ph) + 0.38 * sin(2.0 * ph);
    float tip = smoothstep(0.45, 1.0, ax);
    // La punta recorre mas arco que el hombro, y al planear el ala se queda
    // abierta en V en vez de aletear en corto
    float ang = beat * uAmp * (wing + tip * 0.6) + uSpread * (wing + tip * 0.3);

    float c = cos(ang);
    float s = sin(ang);
    vec2 rel = vec2(p.x, p.y - uWingY);
    p.x = rel.x * c - side * rel.y * s;
    p.y = uWingY + side * rel.x * s + rel.y * c;
    // La normal viaja con el mismo giro: sin esto el ala se ilumina plana
    vec2 rn = n.xy;
    n.x = rn.x * c - side * rn.y * s;
    n.y = side * rn.x * s + rn.y * c;

    // Barrido adelante-atrás: el ala no sube y baja en un plano, describe un
    // óvalo. Es lo que impide que el aleteo se lea como una bisagra.
    p.z += wing * cos(ph) * uAmp * uHalf.z * 0.15;

    /* ---- Patas: recogidas hacia atras, con paso alterno ---- */
    /*
     * Nada que vuele lleva las patas colgando: van plegadas contra el cuerpo.
     * Pero tampoco van clavadas, que es como estaban — un balanceo de 10° a
     * medio hertz sobre el 20 % mas bajo del modelo no se ve desde ninguna
     * distancia.
     *
     * Ahora llevan tres cosas: la recogida, que el CPU abre y cierra segun la
     * velocidad; el paso alterno, una pata desfasada media vuelta de la otra;
     * y una patada en el compas del aleteo — cada batida las sacude, que es
     * lo que las ata al resto del animal en vez de dejarlas colgando de su
     * propio reloj.
     */
    // El tope no es decorativo: medido sobre el modelo, pasados ~1.15 rad el
    // pie entra dentro del cuerpo. Acotando aqui se puede pedir un balanceo
    // mucho mas amplio sin que ninguna combinacion lo cruce.
    /*
     * El ritmo importa tanto como la amplitud.
     *
     * El balanceo iba a 0.9 rad/s: un periodo de SIETE segundos. Comprobado
     * forzando el uniforme a sus dos extremos, la pata recorre 80° — o sea
     * que la mascara y la palanca estan bien y el miembro se mueve mucho.
     * Pero repartido en siete segundos, en los dos que alguien mira la pantalla
     * se desplaza un pelo. Se leia como una pata quieta porque, a efectos
     * practicos, lo estaba.
     *
     * A 2.4 el ciclo dura dos segundos y medio, y la patada del aleteo sube
     * lo suficiente para que cada batida se le note en el tren.
     */
    // El segundo armonico seca la patada: baja de golpe y recoge despacio, en
    // vez de mecerse. Es la misma asimetria que lleva el ala.
    float kick = sin(uFlap - 0.7) + 0.32 * sin(2.0 * (uFlap - 0.7));

    /* Muslo: gira desde la cadera y arrastra la pata entera */
    float thighRaw = uLeg.x
      + sin(uTime * 3.1 + side * 1.5708) * uLeg.y
      + kick * uLeg.z;
    // El tope evita que el pie entre en el vientre; que sature un instante en
    // cada extremo es deseable — da posturas definidas en vez de un vaiven
    float thighA = clamp(thighRaw, -0.35, 1.18);
    float thighAng = thighA * legM;
    float tc = cos(thighAng);
    float ts = sin(thighAng);
    vec2 hipRel = vec2(p.y - uHip.x, p.z - uHip.y);
    p.y = uHip.x + hipRel.x * tc - hipRel.y * ts;
    p.z = uHip.y + hipRel.x * ts + hipRel.y * tc;
    vec2 hn = n.yz;
    n.y = hn.x * tc - hn.y * ts;
    n.z = hn.x * ts + hn.y * tc;

    /* Caña: gira sobre la rodilla, que el muslo acaba de mover de sitio */
    /*
     * Este es el punto entero del asunto. Si la caña girase sobre la rodilla
     * en reposo, el tramo de abajo se despegaria del de arriba y la pata se
     * partiria en dos. La rodilla se lleva primero por el giro del muslo y
     * el segundo giro ocurre alli — por eso los dos huesos siguen unidos y
     * el conjunto se lee como una pierna que se pliega.
     */
    float kickShin =
      sin(uFlap - 0.7 - ${KNEE_LAG.toFixed(2)})
      + 0.32 * sin(2.0 * (uFlap - 0.7 - ${KNEE_LAG.toFixed(2)}));
    /*
     * El signo menos es todo el asunto: la caña pliega en CONTRAFASE.
     *
     * Con los dos tramos girando hacia el mismo lado la pata se enrolla, y
     * medido sobre el modelo el pie acababa 96 unidades por encima de la
     * cadera — dentro del vientre— contra las 58 del sistema de un solo
     * hueso. O sea que articular la pata la empeoraba.
     *
     * En contrafase el muslo va hacia atras y la caña cae hacia delante: la
     * Z que hace cualquier pata plegada. Mismo recorrido de pie que antes
     * (15 % del alto de pantalla), 66° de rodilla propios, y el pie se queda
     * 31 unidades sobre la cadera en el peor instante — la mitad que antes.
     */
    float shinRaw = -(uShin.x
      + sin(uTime * 3.1 - ${KNEE_LAG.toFixed(2)} + side * 1.5708) * uShin.y
      + kickShin * uShin.z);
    // Un pelo de margen positivo: la rodilla llega a estirarse del todo en el
    // punto mas abierto del ciclo, pero no se dobla del reves
    float shinAng = clamp(shinRaw, -1.05, 0.10) * shinM;
    float sc = cos(shinAng);
    float ss = sin(shinAng);
    vec2 kneeRel = vec2(uKnee.x - uHip.x, uKnee.y - uHip.y);
    vec2 knee = vec2(
      uHip.x + kneeRel.x * tc - kneeRel.y * ts,
      uHip.y + kneeRel.x * ts + kneeRel.y * tc);
    vec2 shinRel = vec2(p.y - knee.x, p.z - knee.y);
    p.y = knee.x + shinRel.x * sc - shinRel.y * ss;
    p.z = knee.y + shinRel.x * ss + shinRel.y * sc;
    vec2 kn = n.yz;
    n.y = kn.x * sc - kn.y * ss;
    n.z = kn.x * ss + kn.y * sc;

    // Y abren y cierran de lado, las dos a la vez. Un par de patas que solo
    // giran en un plano se leen como dos palos pegados al vientre; con la
    // apertura se leen como algo que se recoge.
    float splay = sin(uFlap * 0.5 + 1.1) * uLeg.y * 0.8 * legM;
    float pc = cos(splay);
    float ps = sin(splay);
    vec2 pxy = vec2(p.x, p.y - uHip.x);
    p.x = pxy.x * pc - side * pxy.y * ps;
    p.y = uHip.x + side * pxy.x * ps + pxy.y * pc;
    vec2 sn = n.xy;
    n.x = sn.x * pc - side * sn.y * ps;
    n.y = side * sn.x * ps + sn.y * pc;

    /* ---- Una sola onda para todo el cuerpo ---- */
    /*
     * Esto es lo que hacia que el bicho se leyera como piezas sueltas.
     *
     * Cada parte iba a su propio reloj: la cola a media frecuencia del ala
     * mas una deriva lenta, el cuello a un seno del tiempo, la columna a otro,
     * las patas al suyo. Sumadas, ninguna sabia de las demas — se movian cerca
     * unas de otras, que no es lo mismo que moverse juntas.
     *
     * Ahora todo cuelga de la misma fase: la del aleteo, retrasada segun lo
     * lejos que este cada punto del hombro. El impulso nace donde el ala se
     * agarra al cuerpo y viaja hacia el hocico y hacia la punta de la cola,
     * llegando mas tarde cuanto mas lejos. Un cuerpo es exactamente eso: una
     * cosa por la que se propaga un unico esfuerzo.
     */
    float shoulder = uWingZ.y * 0.72;
    float away = abs(zn - shoulder);
    // Retraso de propagacion: la punta de la cola llega casi un ciclo tarde
    float wave = uFlap - away * 6.2;
    // 0 en el hombro —de donde cuelga el animal— y 1 en las dos puntas
    float reach = smoothstep(0.03, 0.5, away);

    // Batido vertical de la columna entera, del hocico a la cola
    p.y += sin(wave) * reach * uHalf.y * 0.34 * uSway;
    // Y el serpenteo lateral, que en el cuerpo es amplio y lento
    p.x += sin(wave * 0.85 + 0.6) * reach * uHalf.z * 0.075 * uSway;

    /*
     * El pecho se comprime en la batida hacia abajo.
     *
     * Es minimo —un cuatro por ciento— y es lo que separa un cuerpo de un
     * tubo rigido: el ala no puede empujar contra el aire sin que el torso
     * acuse el esfuerzo.
     */
    float chest = 1.0 - smoothstep(0.0, 0.32, away);
    p.y *= 1.0 + sin(uFlap - 0.9) * 0.042 * chest * uSway;

    /* ---- Cola: el latigo encima de la onda ---- */
    /*
     * La cola lleva ademas su propia ondulacion, mucho mas corta: sobre la
     * onda del cuerpo cabe mas de un ciclo entre el arranque y la punta. Esa
     * es la diferencia entre una cola que acompana y una que restalla.
     *
     * Ojo con el orden del smoothstep: con el primer borde mayor que el
     * segundo es comportamiento indefinido en GLSL. Se invierte a mano.
     */
    float tail = 1.0 - smoothstep(0.0, uWingZ.x, zn);
    tail *= tail;
    p.x += sin(wave - zn * 14.0) * tail * uHalf.z * 0.24 * uSway;
    p.y += sin(wave - zn * 11.0 + 0.9) * tail * uHalf.y * 0.3 * uSway;

    /* ---- Cuello: contrapeso, en la misma onda ---- */
    // Va en contrafase con la cola porque le llega la misma onda por el otro
    // lado del hombro. Es lo que mantiene el centro quieto mientras las dos
    // puntas se mueven, y sin ello el animal entero parece derrapar.
    float neck = smoothstep(uWingZ.y, 1.0, zn);
    p.x -= sin(wave + 0.4) * neck * uHalf.z * 0.07 * uSway;
    p.y += sin(wave * 0.5) * neck * uHalf.y * 0.2 * uSway;

    /* ---- Arrastre de la columna y anticipación de la cabeza ---- */
    /*
     * Las dos cosas que separan a una criatura de una flecha apuntando a su
     * tangente.
     *
     * Al virar, el cuerpo gira primero y la cola llega tarde: se queda
     * apuntando a por donde venía y barre hacia fuera de la curva. La cabeza
     * hace lo contrario — mira a donde va antes de que el cuerpo la siga.
     * Anticipación y arrastre. Sin ellas el bicho gira como una sola pieza
     * rígida, que es justo lo que se leía como poco natural.
     *
     * Los dos giros van alrededor del origen del modelo y pesados por las
     * mismas máscaras del coleo, así que el efecto crece hacia la punta de la
     * cola y hacia el hocico y no toca el torso.
     */
    float twist = uWhip.x * tail + uLook.x * neck;
    float rise  = uWhip.y * tail + uLook.y * neck;

    float ct = cos(twist);
    float st = sin(twist);
    vec2 pxz = vec2(p.x, p.z);
    p.x = pxz.x * ct + pxz.y * st;
    p.z = -pxz.x * st + pxz.y * ct;
    // La normal viaja con el giro, o la cola se ilumina como si no se hubiera
    // movido — es un arco de hasta 25°, se nota
    vec2 nxz = vec2(n.x, n.z);
    n.x = nxz.x * ct + nxz.y * st;
    n.z = -nxz.x * st + nxz.y * ct;

    float cr = cos(rise);
    float sr = sin(rise);
    vec2 pyz = vec2(p.y, p.z);
    p.y = pyz.x * cr - pyz.y * sr;
    p.z = pyz.x * sr + pyz.y * cr;
    vec2 nyz = vec2(n.y, n.z);
    n.y = nyz.x * cr - nyz.y * sr;
    n.z = nyz.x * sr + nyz.y * cr;

    /* ---- Despiece ---- */
    // Cada familia de piezas se aparta del torso por su propio eje: las alas
    // hacia fuera, la cabeza adelante, la cola atras, las patas abajo. El
    // torso no se mueve — es el que sostiene la lamina. Se reutilizan las
    // mismas mascaras del aleteo, asi que el despiece corta por donde de
    // verdad articula el bicho y no por un plano inventado.
    if (uExplode > 0.0001) {
      float e = uExplode;
      p.x += side * wing * uHalf.x * 0.34 * e;
      p.z += neck * uHalf.z * 0.42 * e;
      p.z -= tail * uHalf.z * 0.46 * e;
      p.y -= legM * uHalf.y * 0.70 * e;
      p.y += (1.0 - legM) * (1.0 - wing) * uHalf.y * 0.10 * e;
    }
  }
`;

/* ------------------------------------------------------------------ */
/* Materialización (GLSL)                                              */
/* ------------------------------------------------------------------ */

/**
 * El titular de la portada dice "Del diseño a la realidad". Esto es esa frase.
 *
 * El dragón entra como lo que entrega un ingeniero —un plano: secciones cada
 * pocos centímetros, silueta de canto y nada de materia— y se va volviendo
 * real a medida que se baja por la página, del hocico a la cola. Cuando llega
 * al formulario ya es un animal y escupe fuego.
 *
 * No es un adorno que va cambiando de color: es el argumento de la empresa
 * dicho en el único objeto de la pantalla que el visitante mira sin que se lo
 * pidan.
 */
const BUILD_GLSL = /* glsl */ `
  uniform float uBuild;
  uniform float uScan;    // dónde va la línea de escáner, 0 hocico … 1 cola
  uniform float uScanAmt; // cuánto se ve el barrido
  uniform float uSplit;   // divisor plano/realidad, 0 … 1 del ancho
  uniform float uSplitAmt;// cuánto manda el divisor
  uniform vec2  uViewport;// tamaño del búfer de dibujo, en píxeles

  varying float vBouwBuild;
  varying vec3 vBouwLocal;

  // Colores en sRGB a proposito: esto se mezcla despues de <colorspace_fragment>,
  // con la conversion ya hecha
  const vec3 PLAN_LINE = vec3(0.31, 0.84, 0.91);
  const vec3 PLAN_DARK = vec3(0.016, 0.063, 0.122);
`;

/* ------------------------------------------------------------------ */
/* Dragón                                                              */
/* ------------------------------------------------------------------ */

export default function Dragon({
  stageRef,
  reducedMotion,
  frontRef,
  buildRef,
  flowRef,
  localRef,
  pointerRef,
}: Props) {
  const group = useRef<THREE.Group>(null);

  /*
   * Recorrido.
   *
   * `eased` es la etapa vista por el dragón: la del scroll pasada por un
   * muelle, así que llega tarde y se pasa de largo. Todo lo demás —posición,
   * orientación, escala, despiece— se calcula sobre ella y no sobre la etapa
   * cruda, que es lo que hace que el bicho tenga masa en vez de ir clavado
   * al dedo del visitante.
   */
  const eased = useRef(0);
  const vel = useRef(0);
  const bank = useRef(0);
  const lastBuild = useRef(0);
  /*
   * Lo que el cuerpo hizo el fotograma anterior: cuánto subió y a qué
   * velocidad. De ahí sale el esfuerzo del aleteo, y viene del movimiento
   * real —no del scroll—, así que sigue valiendo con la página quieta.
   */
  const rise = useRef(0);
  const gaze = useRef(0);
  const speed = useRef(0);
  /* Rumbo del fotograma anterior, para medir cuánto está girando. */
  const lastYaw = useRef(NaN);
  const lastPitch = useRef(0);
  const whipYaw = useRef(0);
  const whipPitch = useRef(0);
  const sim = useRef(0);
  /** Cuánto manda el divisor, suavizado: al soltarlo se retira, no se corta. */
  const splitAmt = useRef(0);
  const flow = useRef(0);
  const flap = useRef(0);
  const heading = useRef(new THREE.Quaternion());
  const started = useRef(false);

  // Aliento
  const mouth = useRef(new THREE.Vector3());
  const aim = useRef(new THREE.Vector3(0, 0, 1));
  const fire = useRef(0);
  const firing = useRef(false);

  const gltf = useGLTF(MODEL_PATH);

  /**
   * Preparación del modelo.
   *
   * El GLB viene con la malla girada y apoyada en el suelo dentro de su nodo.
   * Aquí se hornea esa transformación en la geometría y se recentra, para que
   * el grupo gire sobre el cuerpo del bicho y no sobre un punto bajo su
   * barriga. De paso deja el modelo en ejes limpios —X envergadura, Y arriba,
   * Z hocico— que es lo que da por hecho el shader.
   */
  const model = useMemo(() => {
    const source = gltf.scene.clone(true);
    source.updateMatrixWorld(true);

    const dragon = new THREE.Group();
    const meshes: THREE.Mesh[] = [];

    source.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      // La geometría del caché se comparte: sin clonar, hornear la matriz
      // corrompería el modelo para cualquier otro montaje.
      const geometry = child.geometry.clone();
      geometry.applyMatrix4(child.matrixWorld);
      meshes.push(new THREE.Mesh(geometry, child.material));
    });

    // Caja conjunta y recentrado
    const box = new THREE.Box3();
    for (const mesh of meshes) {
      mesh.geometry.computeBoundingBox();
      box.union(mesh.geometry.boundingBox!);
    }
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const half = size.clone().multiplyScalar(0.5);

    for (const mesh of meshes) {
      mesh.geometry.translate(-center.x, -center.y, -center.z);
      mesh.geometry.computeBoundingBox();
    }

    /**
     * Medidas del bicho, sacadas de los propios vértices.
     *
     * El hombro y el tramo que ocupa el ala no se pueden adivinar: se leen
     * del modelo. Así, si mañana entra otro dragón, la animación se recoloca
     * sola en vez de quedarse aleteando en el sitio equivocado.
     */
    let wingSumY = 0;
    let wingCount = 0;
    let wingMinZ = Infinity;
    let wingMaxZ = -Infinity;
    let headX = 0;
    let headY = 0;
    let headZ = 0;
    let headCount = 0;
    const headEdge = half.z * 0.88;

    /*
     * Patas: lo más bajo del modelo.
     *
     * El corte sale del propio alto del bicho, no puesto a ojo. Por debajo de
     * ese nivel solo hay pata — el punto más bajo del ala queda justo encima,
     * medido sobre los vértices.
     */
    /*
     * Medido sobre los propios vértices, no estimado.
     *
     * Contando el reparto de la malla por franjas de altura, el miembro
     * —vértices estrechos y centrados— va del suelo hasta el 25 % del alto:
     * 474 de ellos en el 10 % más bajo y adelgazando hasta ahí. Por encima de
     * esa línea el rango en Z se dispara y ya es vientre, no pata.
     *
     * Estaba en 0.2, así que la articulación caía por dentro del miembro y
     * media pata giraba desde el sitio equivocado.
     */
    const legTop = box.min.y - center.y + size.y * 0.25;
    let legZSum = 0;
    let legCount = 0;

    /*
     * Rodilla: al 45 % de la pata contando desde la planta.
     *
     * No es una proporción inventada: en un miembro que se pliega, el tramo
     * de abajo tiene que ser algo más corto que el de arriba o el pie se sale
     * por detrás al cerrarse. Con la pata ocupando medio semialto, esto deja
     * la articulación en el sitio donde el modelo ya se estrecha.
     *
     * La posición a lo largo del cuerpo se lee de los propios vértices, en
     * una franja fina a esa altura: la pata está inclinada, así que la Z de
     * la rodilla no es la misma que la de la cadera.
     */
    const legFloor = box.min.y - center.y;
    const kneeY = legFloor + (legTop - legFloor) * 0.45;
    const kneeBand = size.y * 0.03;
    let kneeZSum = 0;
    let kneeCount = 0;

    for (const mesh of meshes) {
      const pos = mesh.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ax = Math.abs(x);
        if (ax > half.x * 0.72) {
          wingSumY += y;
          wingCount++;
        }
        if (ax > half.x * 0.55) {
          if (z < wingMinZ) wingMinZ = z;
          if (z > wingMaxZ) wingMaxZ = z;
        }
        if (z > headEdge) {
          headX += x;
          headY += y;
          headZ += z;
          headCount++;
        }
        if (y < legTop && ax < half.x * 0.3) {
          legZSum += z;
          legCount++;
          if (Math.abs(y - kneeY) < kneeBand) {
            kneeZSum += z;
            kneeCount++;
          }
        }
      }
    }

    const wingY = wingCount ? wingSumY / wingCount : 0;
    const norm = (z: number) => THREE.MathUtils.clamp(z / size.z + 0.5, 0, 1);
    const wingZ = new THREE.Vector2(
      wingCount ? norm(wingMinZ) : 0.45,
      wingCount ? norm(wingMaxZ) : 0.9,
    );
    const head = headCount
      ? new THREE.Vector3(headX / headCount, headY / headCount, headZ / headCount)
      : new THREE.Vector3(0, 0, half.z);

    // La cadera es el eje del giro: arriba donde acaban las patas, y a lo
    // largo del cuerpo en el centro de las propias patas
    const hip = new THREE.Vector2(
      legTop,
      legCount ? legZSum / legCount : half.z * 0.1,
    );

    // Y la rodilla, con la Z medida en su franja; si el modelo no da vértices
    // ahí, cae sobre el eje de la cadera y la pata sigue siendo un solo hueso
    const knee = new THREE.Vector2(
      kneeY,
      kneeCount ? kneeZSum / kneeCount : hip.y,
    );

    // Uniformes compartidos: un solo objeto por valor, referenciado desde
    // todos los materiales, para actualizar la escena entera con una escritura
    const uniforms = {
      uTime: { value: 0 },
      uFlap: { value: 0 },
      uAmp: { value: AMP_FAST },
      uSway: { value: 1 },
      uSpread: { value: 0 },
      uBuild: { value: 0 },
      uExplode: { value: 0 },
      uWhip: { value: new THREE.Vector2() },
      uLook: { value: new THREE.Vector2() },
      uScan: { value: 0 },
      uScanAmt: { value: 0 },
      /*
       * Estos tres no son suyos: son de la escena.
       *
       * El dragón sigue siendo quien los escribe cada fotograma —es el único
       * que ya lee `planSplit`— pero la marca los lee del mismo objeto, así
       * que el corte parte a los dos por la misma línea y en el mismo píxel.
       */
      ...splitUniforms,
      uHalf: { value: half },
      uWingY: { value: wingY },
      uWingZ: { value: wingZ },
      uHip: { value: hip },
      uKnee: { value: knee },
      uLeg: { value: new THREE.Vector3(LEG_TUCK, LEG_SWING, LEG_KICK) },
      uShin: { value: new THREE.Vector3(SHIN_TUCK, SHIN_SWING, SHIN_KICK) },
    };

    const materials: THREE.MeshStandardMaterial[] = [];
    const lineMats: THREE.LineBasicMaterial[] = [];
    const wires: THREE.LineSegments[] = [];
    const geometries: THREE.BufferGeometry[] = [];

    for (const mesh of meshes) {
      const old = mesh.material as THREE.MeshStandardMaterial;

      const mat = new THREE.MeshStandardMaterial({
        // Mantener texturas originales
        map: old.map ?? null,
        metalnessMap: old.metalnessMap ?? null,
        roughnessMap: old.roughnessMap ?? null,
        normalMap: old.normalMap ?? null,
        // Tinte bronce cálido
        color: new THREE.Color("#c49060"),
        metalness: 0.15,
        roughness: 0.55,
        envMapIntensity: 1.8,
        emissive: new THREE.Color(BRAND.orange),
        emissiveIntensity: 0.08,
        /*
         * Doble cara.
         *
         * Es lo que más cuesta de toda la escena: medido con el panel, los
         * fotogramas escalan con el ÁREA que ocupa el bicho —23 % del alto da
         * 48 fps, 46 % da 26— o sea que el límite es relleno de píxeles, y
         * DoubleSide sombrea cada uno dos veces.
         *
         * Se queda igualmente. Probé `FrontSide` y no pude comprobarlo con la
         * escena delante; en una malla con membranas de ala eso abre agujeros
         * en cuanto el animal gira, y cambiar la silueta a ciegas para ganar
         * fotogramas es mal negocio. Está medido y anotado para cuando se
         * pueda mirar.
         */
        side: THREE.DoubleSide,
      });

      if (mat.normalMap) {
        mat.normalScale = new THREE.Vector2(1.4, 1.4);
      }
      if (mat.map) {
        mat.map.colorSpace = THREE.SRGBColorSpace;
      }

      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        shader.uniforms.uRimColor = { value: new THREE.Color(BRAND.cyanLight) };
        shader.uniforms.uRimStrength = { value: 0.35 };
        shader.uniforms.uRimPower = { value: 2.8 };

        /*
         * La normal se resuelve antes que la posición en el vertex de three,
         * así que el aleteo se calcula en `beginnormal_vertex` —con la malla
         * todavía intacta— y `begin_vertex` solo recoge el resultado. Al revés
         * la luz iría un chunk por detrás de la geometría.
         */
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", `#include <common>\n${DEFORM_GLSL}`)
          .replace(
            "#include <beginnormal_vertex>",
            `#include <beginnormal_vertex>
             bouwPosition = position;
             bouwDeform(bouwPosition, objectNormal);`,
          )
          .replace(
            "#include <begin_vertex>",
            "vec3 transformed = bouwPosition;",
          );

        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
             uniform vec3 uRimColor;
             uniform float uRimStrength;
             uniform float uRimPower;
             ${BUILD_GLSL}`,
          )
          .replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>
             float rimDot = 1.0 - abs(dot(normalize(vViewPosition), normal));
             totalEmissiveRadiance +=
               uRimColor * pow(clamp(rimDot, 0.0, 1.0), uRimPower) * uRimStrength;`,
          )
          /*
           * Va al final del todo, despues del tono y del espacio de color: el
           * plano no es una variante de iluminacion del material, es lo que hay
           * antes de que haya material. Mezclarlo aqui deja el PBR intacto para
           * la parte ya construida.
           */
          .replace(
            "#include <dithering_fragment>",
            `#include <dithering_fragment>
             {
               // Frente de construccion, del hocico hacia la cola
               float front = uBuild * 1.2 - 0.1;
               float built = 1.0 - smoothstep(front, front + 0.12, vBouwBuild);

               /*
                * Divisor plano / realidad.
                *
                * Sustituye a la construccion, no se suma a ella. Esa era la
                * razon de que no se viera: el divisor solo sabia *quitar*
                * materia, y en la portada el bicho ya es plano al 100 %, asi
                * que mezclaba plano contra plano y no pasaba nada.
                *
                * Ahora manda el: a su derecha materia entera, a su izquierda
                * plano entero. Arrastrarlo convierte una cosa en la otra, que
                * es literalmente el titular de la pagina.
                *
                * Va en espacio de pantalla y el bicho vuela, asi que la misma
                * parte del animal cambia de estado al cruzar el corte.
                */
               float sx = gl_FragCoord.x / max(uViewport.x, 1.0);
               float seam = 0.0;
               if (uSplitAmt > 0.001) {
                 float realSide =
                   smoothstep(uSplit - 0.0025, uSplit + 0.0025, sx);
                 built = mix(built, realSide, uSplitAmt);
                 seam = 1.0 - smoothstep(0.0, 0.004, abs(sx - uSplit));
               }

               // Secciones transversales, como las cuadernas de un plano
               float sec = abs(fract(vBouwLocal.z * 1.4) - 0.5);
               float rib = 1.0 - smoothstep(0.015, 0.055, sec);
               // De canto la linea se cierra sola y da la silueta
               float fres = pow(
                 1.0 - abs(dot(normalize(vViewPosition), normal)), 2.2);

               vec3 plan = PLAN_DARK + PLAN_LINE * (rib * 0.5 + fres * 0.95);
               gl_FragColor.rgb = mix(plan, gl_FragColor.rgb, built);

               // La linea viva del frente, solo mientras se esta construyendo.
               // Invertido a mano: smoothstep con el primer borde mayor que
               // el segundo es comportamiento indefinido en GLSL.
               float glow = 1.0 - smoothstep(0.0, 0.06, abs(vBouwBuild - front));
               float working = uBuild * (1.0 - uBuild) * 4.0;
               gl_FragColor.rgb += PLAN_LINE * glow * clamp(working, 0.0, 1.0);

               /*
                * Barrido de escaner.
                *
                * En Proceso el bicho ya esta construido y lo que se mueve es
                * la lectura: una linea recorre el cuerpo del hocico a la cola
                * al ritmo del scroll, y por detras de ella el cuerpo sigue
                * siendo plano. Es el metodo de la casa dicho sobre el propio
                * objeto — se mide, se comprueba, y solo entonces es materia.
                *
                * Va aparte de uBuild a proposito: sumar no puede dar un salto,
                * y reutilizar la construccion global si lo daba al entrar y
                * salir de la seccion.
                */
               // La linea viva justo en el corte: es donde esta pasando
               gl_FragColor.rgb += PLAN_LINE * seam * uSplitAmt * 1.1;

               if (uScanAmt > 0.001) {
                 float pending = smoothstep(uScan - 0.03, uScan + 0.12, vBouwBuild);
                 gl_FragColor.rgb = mix(gl_FragColor.rgb, plan, pending * uScanAmt * 0.82);
                 float band = 1.0 - smoothstep(0.0, 0.075, abs(vBouwBuild - uScan));
                 gl_FragColor.rgb += PLAN_LINE * band * uScanAmt * 1.4;
               }
             }`,
          );
      };

      /*
       * Clave de programa propia.
       *
       * `onBeforeCompile` cambia el código del shader pero no la clave con
       * la que three cachea el programa compilado. Ahora que la marca lleva
       * también materiales PBR parcheados, dos materiales con los mismos
       * ajustes podrían compartir programa y quedarse con el parche del otro.
       * La clave lo impide.
       */
      mat.customProgramCacheKey = () => "bouw-dragon";

      mesh.material = mat;
      mesh.frustumCulled = false;
      materials.push(mat);
      geometries.push(mesh.geometry);
      dragon.add(mesh);

      /*
       * Calco de aristas.
       *
       * El plano no se dibuja: se calca. `EdgesGeometry` saca los quiebres
       * reales del modelo y las lineas se doblan con el mismo `bouwDeform`
       * que la piel — la deformacion solo depende de la posicion, asi que
       * cualquier geometria sacada de esta malla la hereda gratis.
       */
      const edges = new THREE.EdgesGeometry(mesh.geometry, 24);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(BRAND.cyanLight),
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });

      lineMat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, uniforms);
        // El shader de linea no calcula normales, asi que la deformacion se
        // hace en `begin_vertex` con una normal de descarte
        shader.vertexShader = shader.vertexShader
          .replace("#include <common>", `#include <common>
${DEFORM_GLSL}`)
          .replace(
            "#include <begin_vertex>",
            `vec3 transformed = position;
             vec3 bouwIgnored = vec3(0.0, 0.0, 1.0);
             bouwDeform(transformed, bouwIgnored);`,
          );

        /*
         * El calco obedece al divisor.
         *
         * A la izquierda del corte el bicho es plano, y un plano sin sus
         * aristas es una mancha azul: el calco es justo lo que lo hace
         * legible como dibujo. Asi que mientras el divisor esta activo las
         * lineas solo existen de ese lado — se desvanecen al cruzarlo, en el
         * mismo pixel en el que la piel se vuelve materia.
         */
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>
             uniform float uSplit;
             uniform float uSplitAmt;
             uniform vec2 uViewport;`,
          )
          .replace(
            "#include <premultiplied_alpha_fragment>",
            `if (uSplitAmt > 0.001) {
               float sx = gl_FragCoord.x / max(uViewport.x, 1.0);
               float planSide =
                 1.0 - smoothstep(uSplit - 0.0025, uSplit + 0.0025, sx);
               gl_FragColor.a *= mix(1.0, planSide, uSplitAmt);
             }
             #include <premultiplied_alpha_fragment>`,
          );
      };

      const wire = new THREE.LineSegments(edges, lineMat);
      // Un pelo mas grande que la piel: sin esto la linea se pelea con la
      // superficie por el mismo pixel de profundidad
      wire.scale.setScalar(1.002);
      wire.frustumCulled = false;
      wire.renderOrder = 1;
      lineMats.push(lineMat);
      wires.push(wire);
      geometries.push(edges);
      dragon.add(wire);
    }

    return {
      dragon,
      geometries,
      materials,
      lineMats,
      wires,
      uniforms,
      head,
      half,
      hip,
      legCount,
      /*
       * El tránsito entre dos poses.
       *
       * Se reconstruye solo cuando se cambia de tramo. Los tiradores salen de
       * los propios escenarios: el bicho abandona la pose por donde miraba y
       * entra en la siguiente ya encarado, que es como se anima esto a mano.
       */
      transit: new THREE.CubicBezierCurve3(
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ),
      segment: -1,
      tangent: new THREE.Vector3(),
      ahead: new THREE.Vector3(),
      target: new THREE.Quaternion(),
      basis: new THREE.Matrix4(),
      origin: new THREE.Vector3(),
      cursor: new THREE.Vector3(),
      orbitPos: new THREE.Vector3(),
      orbitTan: new THREE.Vector3(),
      nextPos: new THREE.Vector3(),
      nextTan: new THREE.Vector3(),
      centerBlend: new THREE.Vector3(),
      aheadTan: new THREE.Vector3(),
      aheadNextTan: new THREE.Vector3(),
      scratch: new THREE.Vector3(),
      dirNow: new THREE.Vector3(),
      prevPos: new THREE.Vector3(),
      shift: new THREE.Vector3(),
      screen: new THREE.Vector3(),
      probe: new THREE.Vector3(),
      gazePoint: new THREE.Vector3(),
      gazeDir: new THREE.Vector3(),
      toGaze: new THREE.Vector3(),
    };
  }, [gltf.scene]);

  // Las geometrías y materiales son propios de este montaje: hay que soltarlos
  useEffect(() => {
    const { geometries, materials, lineMats } = model;
    return () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const m of lineMats) m.dispose();
    };
  }, [model]);

  /* ---------------------------------------------------------------- */
  /* Frame loop                                                        */
  /* ---------------------------------------------------------------- */

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;

    /*
     * Reloj propio de la escena.
     *
     * En vez de leer el del render se acumula aquí, escalado. Con eso el modo
     * depuración puede ralentizarlo o congelarlo sin tocar nada más — y a un
     * cuarto de velocidad se ve de una vez si la cola ondula o se agita, que
     * a ritmo normal cuesta juzgar incluso mirándolo.
     */
    const d = Math.min(delta, 0.05) * debug.timeScale;
    sim.current += d;
    const t = sim.current;
    const stage = Math.min(Math.max(stageRef.current ?? 0, 0), LAST_STAGE);

    /* ---- Muelle del recorrido ---- */
    /*
     * La etapa tira, el bicho tiene inercia. Euler explícito basta: con
     * `SPRING` a 22 el paso estable llega hasta 0.42 s y el delta va acotado
     * a 0.05. Se ablandó a propósito: con el muelle duro el tránsito se
     * resolvía en tres décimas y el arco no daba tiempo a leerse — el bicho
     * aparecía al otro lado en vez de volar hasta allí.
     */
    if (!started.current) {
      eased.current = stage;
      started.current = true;
    } else {
      const damp = 2 * Math.sqrt(SPRING) * DAMPING;
      vel.current += (-SPRING * (eased.current - stage) - damp * vel.current) * d;
      eased.current = THREE.MathUtils.clamp(
        eased.current + vel.current * d,
        0,
        LAST_STAGE,
      );
    }
    const cursorStage = eased.current;

    /* ---- En qué escenario estamos ---- */
    const seg = Math.min(Math.floor(cursorStage), LAST_STAGE - 1);
    const f = THREE.MathUtils.clamp(cursorStage - seg, 0, 1);
    const from = sceneAt(seg);
    const to = sceneAt(seg + 1);
    /** 0 posado en el centro de una sección, 1 en mitad del salto. */
    const travel = travelAt(cursorStage);
    /** Y esto solo vale algo en el salto del troquel. Ver `CLIMAX_*`. */
    const climax = seg === CLIMAX_SEGMENT ? travel : 0;

    /* ---- Ritmo del aleteo ---- */
    /*
     * Dos senos desfasados: nunca cae en un patrón que se pueda contar.
     *
     * Los periodos y la ventana están medidos, no puestos a ojo. Con los
     * valores lentos de antes el bicho batía el 76 % del tiempo, pero los
     * planeos duraban catorce segundos: quien entraba a la página en mitad de
     * uno veía un dragón casi quieto y se iba pensando que no se mueve. Así
     * bate el 85 % del tiempo y el planeo dura siete segundos — se lee como
     * un respiro dentro del vuelo, no como una pausa.
     *
     * La ventana se ha vuelto a estrechar —de [0.35, 0.85] a [0.5, 0.95]—
     * porque el planeo seguía siendo lo que hacía que el vuelo se leyera
     * lento. No por su duración: por lo que pasa dentro. Un planeo del 15 %
     * del tiempo no se nota si el ala sigue viva, y sí se nota si el ala se
     * para. Ahora es más corto Y está más vivo (ver `AMP_SLOW`), y además no
     * llega nunca a cerrarse del todo — ver el tope de `settle`.
     */
    const cycle = Math.sin(t * 0.23) * 0.5 + Math.sin(t * 0.091) * 0.5;
    const glide = THREE.MathUtils.smoothstep(cycle, 0.5, 0.95);

    // Llama: solo en la última etapa
    const reach = THREE.MathUtils.clamp(
      1 - Math.max(0, LAST_STAGE - stage) / 1.1,
      0,
      1,
    );

    /* ---- Esfuerzo ---- */
    /*
     * El aleteo ya no lo decide la sección: lo decide lo que el cuerpo está
     * haciendo. Un animal bate fuerte cuando sube y cuando acelera, y planea
     * cuando baja. Atarlo a eso es lo que hace que el vuelo se lea como
     * causa y efecto en vez de como una animación puesta encima.
     *
     * `climb` sale de la componente vertical del desplazamiento real del
     * fotograma anterior, y `push` de su módulo. Ambas son del cuerpo, no del
     * scroll: siguen valiendo cuando la página está quieta.
     */
    const climb = THREE.MathUtils.clamp(rise.current * 0.55, -1, 1);
    const push = THREE.MathUtils.clamp(speed.current * 0.18, 0, 1);

    /*
     * Bajando planea más; subiendo o acelerando, menos.
     *
     * El tope ya no es 1 sino 0.85: aunque coincidan la ventana de planeo y
     * una picada, queda un 15 % de batida. Es la diferencia entre un animal
     * que descansa el ala y uno al que se le ha apagado.
     */
    const settle = THREE.MathUtils.clamp(
      glide - climb * 0.45 - push * 0.25 - climax,
      0,
      0.85,
    );

    // Escupiendo fuego se sostiene en el aire: bate fuerte y despacio
    const beatRate =
      THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(BEAT_FAST, BEAT_SLOW, settle),
        0.62,
        reach,
      ) *
      (1 + push * 0.35 + Math.max(climb, 0) * 0.3 + climax * 0.45);

    const amp =
      THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(AMP_FAST, AMP_SLOW, settle),
        0.72,
        reach,
      ) *
      (1 + Math.max(climb, 0) * 0.22 + climax * 0.14);

    flap.current = (flap.current + d * beatRate * Math.PI * 2) % (Math.PI * 2);

    const { uniforms } = model;
    if (debug.on && !debug.uniforms) debug.uniforms = uniforms;
    uniforms.uTime.value = t;
    uniforms.uFlap.value = flap.current;
    uniforms.uAmp.value = reducedMotion ? 0 : amp;
    uniforms.uSway.value = reducedMotion ? 0 : 1;
    // Al planear el ala no se queda quieta: se queda abierta
    uniforms.uSpread.value = reducedMotion ? 0 : settle * GLIDE_SPREAD;
    /*
     * Las patas se pliegan con la velocidad.
     *
     * Rapido van pegadas al vientre; al aflojar bajan y quedan colgando, que
     * es lo que hace cualquier cosa que vuela cuando deja de tener prisa. Es
     * el mismo `push` del esfuerzo, asi que las patas y el ala cuentan la
     * misma historia en vez de ir cada una por su lado.
     */
    uniforms.uLeg.value.set(
      reducedMotion
        ? LEG_TUCK * 0.5
        : LEG_TUCK * (0.42 + push * 0.45) * (1 - settle * 0.3),
      reducedMotion ? 0 : LEG_SWING,
      reducedMotion ? 0 : LEG_KICK * (0.4 + push * 0.6),
    );
    /*
     * La rodilla acompaña, pero no al mismo ritmo.
     *
     * Cuando el bicho afloja, el muslo baja casi del todo y la rodilla se
     * queda algo más doblada de lo que le tocaría: una pierna colgando
     * relajada no termina recta. Por eso el pliegue de base no cae tanto con
     * `settle` como la recogida del muslo.
     */
    uniforms.uShin.value.set(
      reducedMotion
        ? SHIN_TUCK * 0.6
        : SHIN_TUCK * (0.5 + push * 0.5) * (1 - settle * 0.18),
      reducedMotion ? 0 : SHIN_SWING,
      reducedMotion ? 0 : SHIN_KICK * (0.35 + push * 0.65),
    );
    // El candado de depuración manda: va después del cálculo, no antes
    if (debug.legLock) uniforms.uLeg.value.fromArray(debug.legLock);
    if (debug.shinLock) uniforms.uShin.value.fromArray(debug.shinLock);

    /* ---- Del plano a la materia, y de vuelta ---- */
    const build =
      THREE.MathUtils.smoothstep(stage, BUILD_FROM, BUILD_TO) -
      THREE.MathUtils.smoothstep(stage, UNBUILD_FROM, UNBUILD_TO) *
        (1 - UNBUILD_KEEP);

    /*
     * Caudal de piezas: el ritmo al que cambia la construcción, con signo.
     *
     * Positivo mientras se construye, negativo mientras se deshace, y cero en
     * cuanto se estabiliza. Así las piezas de la marca vuelan hacia el dragón
     * o salen de él según toque, y dejan de circular cuando no hay nada que
     * mover — que es lo que evita un trasiego perpetuo sin motivo.
     */
    const rate = (build - lastBuild.current) / Math.max(d, 1e-4);
    lastBuild.current = build;
    flow.current += (rate - flow.current) * (1 - Math.pow(0.02, d));
    if (flowRef) flowRef.current = flow.current;

    uniforms.uBuild.value = build;
    /*
     * El calco acompaña al plano y se retira con él.
     *
     * Queda como cota sobre el animal casi construido —que es lo que lo hace
     * leerse como objeto de ingeniería y no como bicho de videojuego— pero se
     * apaga del todo en cuanto la materia gana. A partir de ahí no aporta
     * nada y cuesta una pasada de dibujo entera por malla; con la malla
     * oculta, three ni la envía.
     */
    /*
     * El divisor manda sobre el apagado del calco: da igual lo construido que
     * esté el bicho, si hay un lado de plano ese lado necesita sus aristas.
     */
    const split = THREE.MathUtils.clamp(planSplit.amount, 0, 1);
    splitAmt.current += (split - splitAmt.current) * (1 - Math.pow(0.02, d));
    uniforms.uSplit.value = THREE.MathUtils.clamp(planSplit.x, 0, 1);
    uniforms.uSplitAmt.value = splitAmt.current;
    state.gl.getDrawingBufferSize(uniforms.uViewport.value);

    const wireOpacity = Math.max(
      THREE.MathUtils.lerp(0.6, 0.12, build) *
        (1 - THREE.MathUtils.smoothstep(build, WIRE_FADE_FROM, WIRE_FADE_TO)),
      splitAmt.current * 0.55,
    );
    const wireOn = wireOpacity > 0.004;
    for (const m of model.lineMats) m.opacity = wireOpacity;
    for (const w of model.wires) w.visible = wireOn;
    if (buildRef) buildRef.current = build;

    /* ---- Tratamiento del escenario ---- */
    /*
     * El despiece y el barrido solo existen posado. Al arrancar el tránsito
     * se van a cero: la lámina se cierra y el bicho sale volando entero, que
     * es el remate del escenario y no un corte.
     */
    const hold = 1 - travel;
    // El despiece no se apaga con `reduced motion`: es una pose estática, y
    // quitarla dejaría a esos visitantes sin el escenario de Servicios
    uniforms.uExplode.value =
      THREE.MathUtils.lerp(from.explode, to.explode, f) * hold;
    uniforms.uScanAmt.value =
      THREE.MathUtils.lerp(from.scan, to.scan, f) * hold;
    uniforms.uScan.value = THREE.MathUtils.clamp(localRef?.current ?? 0, 0, 1);

    /* ---- Circuito y tránsito ---- */
    /*
     * Dentro de una sección el bicho recorre su órbita; entre dos, el arco
     * que las une. Las dos cosas se mezclan por `travel`, que vale 0 en el
     * centro de la sección y 1 en mitad del salto — así que en los extremos
     * del tramo manda la órbita y en el medio manda el arco, sin costura y
     * sin que en ningún momento el animal se pare.
     */
    const {
      transit,
      tangent,
      ahead,
      basis,
      target,
      origin,
      cursor,
      orbitPos,
      orbitTan,
      nextPos,
      nextTan,
      centerBlend,
    } = model;

    if (model.segment !== seg) {
      model.segment = seg;
      transit.v0.copy(from.pos);
      transit.v3.copy(to.pos);
      // Sale siguiendo su propia mirada y entra alineado con la de destino
      transit.v1.copy(from.pos).addScaledVector(from.aim, from.lead);
      transit.v2.copy(to.pos).addScaledVector(to.aim, -to.lead);
      /*
       * Y el arco se abre hacia la cámara y pica antes de remontar.
       *
       * Sin la apertura el tránsito es un desplazamiento lateral, que en
       * perspectiva no se lee como vuelo sino como un objeto que resbala por
       * el fondo. Sin la picada el arco es plano y se lee como un traslado.
       * Con las dos, el bicho sale picando, cruza por delante y remonta al
       * circuito siguiente — que es lo que hace cualquier cosa con alas al
       * cambiar de altura: cambia peso por velocidad y lo devuelve.
       */
      transit.v1.z += from.bulge;
      transit.v1.y -= from.dip;
      transit.v2.z += from.bulge * 0.72;
      transit.v2.y += from.dip * 0.55;
    }

    /*
     * Cada batida empuja.
     *
     * El avance por el arco lo marca el scroll, pero un cuerpo que avanza a
     * ritmo perfectamente constante no se lee como algo que se propulsa: se
     * lee como algo arrastrado.
     */
    const surge = reducedMotion
      ? 0
      : Math.sin(flap.current) * BEAT_SURGE * 0.03 * travel;
    const fly = THREE.MathUtils.clamp(f + surge, 0, 1);

    const pos = transit.getPoint(fly, cursor);
    transit.getTangent(fly, tangent);
    // La bancada se lee de más adelante que el rumbo: un animal se tumba
    // antes de virar, no mientras vira. Es anticipación, igual que la cabeza.
    transit.getTangent(Math.min(fly + 0.11, 1), ahead);

    // Las dos órbitas del tramo, mezcladas entre sí antes de mezclarse con el
    // arco: al cruzar de sección la de origen se apaga y la de destino ya
    // está en marcha, así que el relevo no da un tirón
    const { aheadTan, aheadNextTan, scratch } = model;
    orbitAt(from, t, orbitPos, orbitTan);
    orbitAt(to, t, nextPos, nextTan);
    /*
     * El circuito se parte en dos: dónde está su centro y cuánto oscila
     * alrededor de él.
     *
     * Hace falta porque son cosas distintas. El centro solo importa posado;
     * la oscilación es el movimiento del animal, y esa no puede apagarse
     * nunca. Mezclándolo todo junto —como estaba— el tránsito borraba las
     * dos, y con la etapa fija a media pasada el bicho se quedaba a 0.37 u/s:
     * colgado en el aire.
     */
    orbitPos.sub(from.pos);
    nextPos.sub(to.pos);
    orbitPos.lerp(nextPos, f);
    centerBlend.copy(from.pos).lerp(to.pos, f);
    orbitTan.lerp(nextTan, f).normalize();

    // Y el rumbo que tendrá medio segundo más tarde: la bancada y la cabeza
    // se leen de aquí. Es una muestra de verdad adelantada en el tiempo, no
    // una mezcla entre dos rumbos del mismo instante.
    orbitAt(from, t + AHEAD_TIME, scratch, aheadTan);
    orbitAt(to, t + AHEAD_TIME, scratch, aheadNextTan);
    aheadTan.lerp(aheadNextTan, f).normalize();

    /*
     * Cuánto manda el circuito frente al arco.
     *
     * `travel` sube como un seno, así que a un cuarto del hueco el circuito
     * todavía pesa un tercio y aplanaba justo la parte del arco que da la
     * salida. Elevado a 0.55 el relevo es mucho más rápido: en cuanto la
     * página se mueve, el que manda es el arco. Se queda como variable aparte
     * porque el barrido de Proceso sí quiere la curva suave.
     */
    const settled = 1 - Math.pow(travel, 0.55);
    // La base va del arco al centro del circuito…
    pos.lerp(centerBlend, settled);
    // …y la oscilación se suma siempre, al 40 % incluso en pleno tránsito
    pos.addScaledVector(orbitPos, 0.4 + 0.6 * settled);
    /*
     * Vagabundeo permanente.
     *
     * Medido con el panel: a media pasada, con la etapa fija, la velocidad
     * del bicho caía a 0.37 u/s. O sea que si dejas de hacer scroll en mitad
     * de un tránsito el animal se queda colgado en el aire aleteando — el
     * arco lo mueve el scroll, y sin scroll no hay arco. Esa es, literalmente,
     * la maqueta colgada de un hilo.
     *
     * Este vaivén no depende de nada externo. Es mayor posado que en tránsito
     * —donde ya hay recorrido de sobra— pero nunca llega a cero.
     */
    if (!reducedMotion) {
      const wander = 0.35 + 0.65 * settled;
      pos.x += Math.sin(t * 0.63) * 0.5 * wander;
      pos.y += Math.sin(t * 0.49 + 1.7) * 0.42 * wander;
      pos.z += Math.sin(t * 0.39 + 0.6) * 0.4 * wander;
    }
    tangent.lerp(orbitTan, settled).normalize();
    ahead.lerp(aheadTan, settled).normalize();

    /*
     * Desplazamiento del cuerpo por su trayectoria.
     *
     * Se mide aquí, antes del rebote de la batida, y no después: el rebote va
     * a la frecuencia del propio aleteo, así que incluirlo metería esa
     * frecuencia en `rise`, `rise` modula el aleteo y el aleteo vuelve al
     * rebote. Un lazo cerrado sobre sí mismo. Lo que interesa es por dónde va
     * el animal, no cómo bota mientras va.
     */
    const { prevPos, shift } = model;
    if (Number.isNaN(lastYaw.current)) prevPos.copy(pos);
    shift.subVectors(pos, prevPos);
    prevPos.copy(pos);
    const smooth = 1 - Math.pow(0.05, d);
    speed.current +=
      (shift.length() / Math.max(d, 1e-4) - speed.current) * smooth;
    rise.current += (shift.y / Math.max(d, 1e-4) - rise.current) * smooth;

    // El cuerpo sube en la batida hacia abajo: es lo que hace que el aleteo
    // se lea como que sostiene al animal y no como un adorno encima de él
    if (!reducedMotion) {
      pos.y += Math.sin(flap.current - 1.1) * 0.46 * (amp / AMP_FAST);
    }

    /*
     * Encuadre según el aspecto.
     *
     * Lateral: el reparto se comprime, porque compuesto para 16:9 en una
     * ventana casi cuadrada el bicho se salía por la derecha.
     *
     * Vertical: comprimir de lado no basta. En una ventana estrecha el
     * titular ocupa el ancho entero y no queda hueco a su derecha —lo único
     * libre es la banda de arriba—, así que el circuito sube. Cada escenario
     * dice cuánto según lo que tenga delante.
     */
    const spread = spreadFor(state.size.width / Math.max(state.size.height, 1));
    pos.x *= spread;
    pos.y += THREE.MathUtils.lerp(from.lift, to.lift, f) * (1 - spread);

    g.position.copy(pos);

    /*
     * Escala.
     *
     * La base sube de 0.55 a 0.9. Medido sobre el modelo real —2.5 unidades
     * de alto por 7.5 de largo—, a 0.55 y al fondo de la sección el bicho
     * ocupaba un 12 % del alto de la ventana: a ese tamaño el coleo medía dos
     * píxeles y el pliegue de las patas menos. Un modelo bien hecho del que
     * no se aprecia ningún detalle es un modelo desperdiciado.
     */
    g.scale.setScalar(0.9 * THREE.MathUtils.lerp(from.scale, to.scale, f));

    /* ---- Rumbo, arrastre y anticipación ---- */
    basis.lookAt(tangent, origin, THREE.Object3D.DEFAULT_UP);
    target.setFromRotationMatrix(basis);
    heading.current.slerp(target, 1 - Math.pow(0.004, d));
    g.quaternion.copy(heading.current);

    /*
     * De cuánto está girando el bicho salen las dos deformaciones que lo
     * vuelven un animal: la cola que llega tarde y la cabeza que se adelanta.
     *
     * El giro se mide sobre el rumbo real —el que acaba de asentar el
     * slerp—, no sobre la tangente cruda: si se midiera sobre la tangente, la
     * cola reaccionaría a un giro que el cuerpo todavía no ha hecho.
     */
    const dirNow = model.dirNow.set(0, 0, 1).applyQuaternion(heading.current);
    const yawNow = Math.atan2(dirNow.x, dirNow.z);
    const pitchNow = Math.asin(THREE.MathUtils.clamp(dirNow.y, -1, 1));

    // `started` ya lo consumió el muelle, así que el primer fotograma del
    // rumbo se marca aparte: sin esto el giro inicial saldría de un ángulo
    // sin medir y la cola arrancaría torcida
    if (Number.isNaN(lastYaw.current)) {
      lastYaw.current = yawNow;
      lastPitch.current = pitchNow;
    }
    const yawRate = wrapPi(yawNow - lastYaw.current) / Math.max(d, 1e-4);
    const pitchRate = (pitchNow - lastPitch.current) / Math.max(d, 1e-4);
    lastYaw.current = yawNow;
    lastPitch.current = pitchNow;

    // Suavizado: la cola tiene masa, no copia el giro fotograma a fotograma
    const lag = 1 - Math.pow(0.02, d);
    whipYaw.current += (-yawRate * WHIP_GAIN - whipYaw.current) * lag;
    whipPitch.current += (pitchRate * WHIP_GAIN - whipPitch.current) * lag;

    // Y la cabeza mira a donde lleva el rumbo un poco más adelante
    const yawAhead = wrapPi(Math.atan2(ahead.x, ahead.z) - yawNow);
    const pitchAhead =
      Math.asin(THREE.MathUtils.clamp(ahead.y, -1, 1)) - pitchNow;

    /* ---- La mirada ---- */
    /*
     * Con el ratón quieto, el rumbo deja de mandar en el cuello y manda el
     * cursor.
     *
     * El punto al que mira se saca proyectando el cursor hasta la
     * profundidad a la que está volando: mirar al plano de la cámara haría
     * que la cabeza apuntara sistemáticamente por delante del bicho cuando
     * este vuela cerca, y por detrás cuando vuela al fondo.
     *
     * En tránsito no mira a nadie. Un animal que cruza a toda velocidad mira
     * a donde va — girar el cuello ahí no se lee como atención, se lee como
     * un fallo de rig.
     */
    let yawGaze = 0;
    let pitchGaze = 0;
    let gazeNeed = 0;
    const pointer = pointerRef?.current;
    if (!reducedMotion && pointer && pointer.movedAt > 0) {
      const { gazePoint, gazeDir, toGaze } = model;
      gazePoint.set(pointer.x, pointer.y, 0.5).unproject(state.camera);
      gazeDir.subVectors(gazePoint, state.camera.position).normalize();
      gazePoint
        .copy(state.camera.position)
        .addScaledVector(gazeDir, state.camera.position.distanceTo(pos));
      toGaze.subVectors(gazePoint, pos).normalize();
      yawGaze = wrapPi(Math.atan2(toGaze.x, toGaze.z) - yawNow);
      pitchGaze = Math.asin(THREE.MathUtils.clamp(toGaze.y, -1, 1)) - pitchNow;

      /*
       * Solo mira si le da el cuello.
       *
       * Sin esto el cuello se quedaba clavado en su tope, y cada vez que el
       * circuito le daba la vuelta al cuerpo saltaba de un tope al otro: 24°
       * a la derecha, 24° a la izquierda, en medio segundo. Un tirón, no una
       * mirada.
       *
       * Ahora el peso se apaga con el ángulo que le falta. Dentro de su campo
       * te mira; fuera, no lo intenta — que es además lo que hace cualquier
       * animal, y lo que convierte el momento en que sí te mira en algo que
       * ha decidido y no en algo que le pasa.
       */
      const need = Math.hypot(yawGaze, pitchGaze);
      gazeNeed = THREE.MathUtils.radToDeg(need);
      const reach =
        1 - THREE.MathUtils.smoothstep(need, GAZE_REACH, GAZE_REACH * 2.7);

      const still = (performance.now() - pointer.movedAt) / 1000;
      const want =
        still < GAZE_STILL
          ? 0
          : THREE.MathUtils.clamp(
              1 - (still - GAZE_STILL - GAZE_HOLD) / GAZE_FADE,
              0,
              1,
            ) *
            reach *
            /*
             * En tránsito mira menos, pero no deja de mirar.
             *
             * Estaba a cero: un animal que cruza a toda velocidad mira a
             * donde va. Pero medido, el tránsito es justo el momento en que
             * el arco lo trae de frente a la cámara — o sea el único rato de
             * cada vuelta en que el cursor le cae dentro del campo. Apagarlo
             * ahí era apagarlo casi siempre.
             */
            (1 - travel * 0.55);
      gaze.current += (want - gaze.current) * (1 - Math.pow(0.06, d));
    } else {
      gaze.current = 0;
    }
    const look = gaze.current * GAZE_MAX;

    const { uWhip, uLook } = uniforms;
    if (reducedMotion) {
      uWhip.value.set(0, 0);
      uLook.value.set(0, 0);
    } else {
      uWhip.value.set(
        THREE.MathUtils.clamp(whipYaw.current, -WHIP_MAX, WHIP_MAX),
        THREE.MathUtils.clamp(whipPitch.current, -WHIP_MAX, WHIP_MAX),
      );
      // El tope se abre con la mirada: el cuello llega más lejos cuando lo
      // que está haciendo es mirar que cuando solo se adelanta a una curva
      const lookMax = THREE.MathUtils.lerp(LOOK_MAX, GAZE_REACH, gaze.current);
      uLook.value.set(
        THREE.MathUtils.clamp(
          THREE.MathUtils.lerp(yawAhead * LOOK_GAIN, yawGaze, look),
          -lookMax,
          lookMax,
        ),
        THREE.MathUtils.clamp(
          THREE.MathUtils.lerp(-pitchAhead * LOOK_GAIN, -pitchGaze, look),
          -lookMax,
          lookMax,
        ),
      );
    }

    // Alabeo: se tumba hacia dentro de la curva, como cualquier cosa que
    // vuela. Sale del rumbo de más adelante, así que se inclina antes de
    // entrar en el viraje y no a la vez.
    const turn = tangent.z * ahead.x - tangent.x * ahead.z;
    const wanted = reducedMotion
      ? 0
      : THREE.MathUtils.clamp(turn * BANK_GAIN, -BANK_MAX, BANK_MAX) +
        Math.sin(t * 0.9) * 0.06;
    // Más rápido en entrar que en salir: se tumba de golpe y se endereza solo
    bank.current += (wanted - bank.current) * (1 - Math.pow(0.012, d));
    g.rotateZ(-bank.current);

    /*
     * El tonel del troquel.
     *
     * Una vuelta entera sobre el eje de avance, y solo aquí. Va sobre el
     * alabeo, no en su lugar: el alabeo sigue contando el viraje y esto es
     * otra cosa encima — lo que hace un animal que ya no está corrigiendo el
     * rumbo sino luciéndose.
     *
     * `2π` y `0` son el mismo ángulo, así que entrar y salir de la ventana no
     * da ningún salto por mucho que el visitante haga scroll a saltos.
     */
    if (!reducedMotion && seg === CLIMAX_SEGMENT) {
      const p = THREE.MathUtils.clamp(
        (f - CLIMAX_ROLL_FROM) / (CLIMAX_ROLL_TO - CLIMAX_ROLL_FROM),
        0,
        1,
      );
      g.rotateZ(Math.PI * (1 - Math.cos(p * Math.PI)));
    }

    if (!reducedMotion) {
      /*
       * El cuerpo acusa la batida.
       *
       * El cabeceo estaba en 0.07 rad —cuatro grados—, que a la distancia a
       * la que vuela el bicho es literalmente nada. Con nueve grados y un
       * balanceo pequeño desfasado, cada golpe de ala se ve en todo el
       * animal y no solo en el ala.
       */
      const beat = amp / AMP_FAST;
      g.rotateX(Math.sin(flap.current - 0.5) * 0.16 * beat);
      g.rotateZ(Math.sin(flap.current * 0.5 + 0.9) * 0.05 * beat);
    }

    /* ---- Llama ---- */
    /*
     * Dos motivos para escupir fuego, y solo dos.
     *
     * `reach` es el de siempre: en contacto se sostiene arriba quemando el
     * hueco que deja el formulario. `climax` es el nuevo — la pasada por el
     * troquel—, y va aparte del `reach` porque el `reach` también le dice al
     * ala que bata fuerte y despacio, que es lo que hace algo que se sostiene
     * en el sitio. En el troquel pasa a toda velocidad: mismo fuego, ritmo
     * contrario.
     */
    const flicker = 0.74 + 0.26 * Math.sin(t * 11.3) * Math.sin(t * 6.7);
    const blaze = Math.max(reach, climax * climax);
    fire.current = reducedMotion ? 0 : blaze * flicker;

    // Boca en mundo. Se le suma a mano el desvío que el shader le mete al
    // cuello, o la llama saldría de donde la cabeza ya no está.
    g.updateMatrixWorld();
    mouth.current.copy(model.head);
    if (!reducedMotion) {
      mouth.current.x += Math.sin(t * 0.7 + 1.3) * model.half.x * 0.035;
      mouth.current.y += Math.sin(t * 0.55) * model.half.y * 0.16;
    }
    mouth.current.applyMatrix4(g.matrixWorld);
    aim.current.set(0, -0.08, 1).transformDirection(g.matrixWorld);

    /*
     * Frente de construcción en mundo.
     *
     * En el shader la coordenada va de 0 en el hocico a 1 en la cola, y el
     * frente está en `uBuild * 1.2 - 0.1`. Aquí se deshace esa cuenta para
     * sacar el punto de la columna donde toca, que es a donde apuntan las
     * piezas de la marca.
     */
    if (frontRef?.current) {
      const front = THREE.MathUtils.clamp(build * 1.2 - 0.1, 0, 1);
      const zn = 1 - front;
      frontRef.current
        .set(0, model.hip.x * 0.35, (zn - 0.5) * 2 * model.half.z)
        .applyMatrix4(g.matrixWorld);
    }

    /* ---- Dónde ha quedado en pantalla ---- */
    /*
     * Esto sí se paga siempre. Antes solo se proyectaba con el panel abierto
     * —dos puntos por fotograma, para los números— pero ahora el velo que
     * protege la lectura se sube y se baja según por dónde ande el bicho, y
     * eso es producción. Ver `dragonScreen`.
     */
    const { screen, probe } = model;
    screen.copy(g.position).project(state.camera);
    probe.copy(g.position);
    probe.y += model.half.y * g.scale.y;
    probe.project(state.camera);

    dragonScreen.x = screen.x * 0.5 + 0.5;
    dragonScreen.y = -screen.y * 0.5 + 0.5;
    // El medio bicho en NDC es, en fracción del alto de ventana, el radio: el
    // rango de NDC son dos unidades por alto de ventana
    dragonScreen.r = Math.max(Math.abs(probe.y - screen.y) * 0.5, 0.02);
    dragonScreen.live = 1;

    /* ---- Métricas de depuración ---- */
    if (debug.on) {
      const st = debug.stats;
      st.stage = stage;
      st.eased = cursorStage;
      st.travel = travel;
      // El delta en NDC de medio bicho equivale, en fracción de pantalla, al
      // bicho entero: NDC va de -1 a 1, o sea dos unidades por alto de ventana
      st.sizePct = Math.abs(probe.y - screen.y) * 100;
      st.screenX = (screen.x * 0.5 + 0.5) * 100;
      st.screenY = (-screen.y * 0.5 + 0.5) * 100;
      st.aspect = state.size.width / Math.max(state.size.height, 1);
      st.depth = state.camera.position.distanceTo(g.position);
      st.speed = speed.current;
      st.climb = rise.current;
      st.settle = settle;
      st.beat = beatRate;
      st.amp = THREE.MathUtils.radToDeg(amp);
      st.whip = THREE.MathUtils.radToDeg(uniforms.uWhip.value.x);
      st.look = THREE.MathUtils.radToDeg(uniforms.uLook.value.x);
      st.gaze = gaze.current;
      st.gazeNeed = gazeNeed;
      st.bank = THREE.MathUtils.radToDeg(bank.current);
      st.build = build;
      st.scan = uniforms.uScanAmt.value;
      st.split = splitAmt.current;
    }

    /* ---- Aviso al DOM ---- */
    const lit = fire.current > 0.3;
    if (lit !== firing.current) {
      firing.current = lit;
      window.dispatchEvent(
        new CustomEvent("bouw:fire", { detail: { on: lit } }),
      );
    }
  });

  return (
    <>
      <group ref={group} scale={0.55}>
        <primitive object={model.dragon} />
      </group>

      <FireBreath
        originRef={mouth}
        aimRef={aim}
        powerRef={fire}
        count={180}
        reducedMotion={reducedMotion}
      />
    </>
  );
}
