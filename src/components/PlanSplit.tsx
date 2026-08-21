"use client";

import { useEffect, useRef, useState } from "react";
import { planSplit } from "@/lib/planSplit";
import { onLayoutChange, onScrollFrame, tickNow } from "@/lib/scrollTicker";
import { useLang } from "@/lib/i18n";

/**
 * Divisor plano / realidad.
 *
 * El titular de la portada dice "Del diseño a la realidad". Esto es esa frase
 * puesta en la mano del visitante: a la izquierda del corte el dragón es el
 * plano que entrega un ingeniero, a la derecha es la pieza terminada, y el
 * corte lo mueve él.
 *
 * El corte va en espacio de pantalla y el bicho vuela, así que la misma parte
 * del animal cambia de estado al cruzarlo. No es un interruptor con dos
 * posiciones: es una frontera fija por la que pasa algo que se mueve.
 *
 * ---------------------------------------------------------------------------
 *
 * Y hasta aquí eso era todo, que es justo lo que fallaba: nadie lo tocaba.
 *
 * El control funcionaba, pero era una línea de un píxel en un sitio donde no
 * hay nada que sugiera que se pueda coger. Un control que hay que descubrir
 * no lo descubre nadie: quien entra a una portada mira el titular, decide en
 * dos segundos si sigue, y hace scroll. Nadie pasa el ratón por una línea de
 * un píxel a ver qué hace.
 *
 * Así que el corte deja de esperar y sale a buscar. Tres capas, en este
 * orden:
 *
 *  1. **Pasada de presentación.** Al segundo de estar la portada en pantalla
 *     el corte cruza el dragón y vuelve. Nadie ha hecho nada todavía; lo que
 *     ve es que media criatura se vuelve dibujo y vuelve a ser materia. La
 *     única forma fiable de enseñar qué hace un control es hacerlo delante.
 *
 *  2. **Seguimiento.** Después, y hasta que lo agarren, el corte sigue al
 *     ratón con retardo por toda la portada. Esto es lo que garantiza el
 *     encuentro: mover el ratón no hay que enseñárselo a nadie. Al primer
 *     movimiento el dragón ya se está partiendo bajo su cursor.
 *
 *  3. **Fijado.** En cuanto pulsan —en el tirador o en cualquier hueco de la
 *     portada— el corte deja de seguir para siempre y pasa a ser lo que era:
 *     algo que se arrastra. El gesto tiene consecuencia, lo dejas donde tú
 *     quieres, y por eso merece la pena hacerlo.
 *
 * El premio de todo esto no está en el dragón sino en el titular: ver
 * `.split-title` en `globals.css`. A la izquierda del corte las letras de
 * "Del diseño a la realidad" están dibujadas a línea, y a la derecha
 * impresas. La frase se demuestra a sí misma mientras la lees.
 */

/** Márgenes: el corte no llega a los bordes, donde no hay nada que partir. */
const MIN_X = 0.16;
const MAX_X = 0.94;

/** Por debajo de este ancho la portada no deja sitio para arrastrar nada. */
const MIN_WIDTH = 900;

/** Reposo: encima del dragón, que es donde el corte se explica solo. */
const HOME_X = 0.74;

/**
 * Pasada de presentación.
 *
 * Va hasta el 0.28 —o sea, cruzando el titular entero— porque el efecto
 * sobre las letras es la mitad del argumento y quedándose sobre el dragón no
 * se vería. Y tarda casi tres segundos a propósito: una pasada rápida se lee
 * como un destello de carga; una lenta, como una mano moviendo algo.
 */
const SWEEP_X = 0.28;
const SWEEP_DELAY = 1.0;
const SWEEP_TIME = 2.9;

/**
 * Constantes de tiempo del seguimiento y del realce, en segundos.
 *
 * El retardo del corte es alto a propósito. Pegado al cursor se lee como un
 * puntero —algo del navegador, no de la página— y encima convierte cualquier
 * movimiento de ratón en un parpadeo del titular. Con cuatro décimas persigue
 * desde más lejos: se lee como algo con masa que te viene siguiendo.
 */
const FOLLOW_TAU = 0.4;
const ENGAGE_TAU = 0.3;

/** Ya fijado, a qué distancia del corte vuelve a encenderse el titular. */
const NEAR_X = 0.17;

/**
 * Lo que nunca inicia un arrastre.
 *
 * Pulsar en la portada coloca el corte, pero la portada también tiene un
 * botón, dos enlaces y el estado de las sedes. Un divisor que se traga el
 * único botón de la pantalla no es un divisor, es un fallo.
 */
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]';

export default function PlanSplit() {
  const { t } = useLang();
  const hostRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLSpanElement>(null);
  const hintRef = useRef<HTMLSpanElement>(null);
  const [wide, setWide] = useState(false);
  const [grabbed, setGrabbed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(
      `(min-width: ${MIN_WIDTH}px) and (pointer: fine)`,
    );
    const apply = () => setWide(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  /*
   * El divisor solo existe mientras la portada está en pantalla. Se apaga al
   * salir —y con él el corte en el shader— porque más abajo el dragón tiene
   * otras cosas que contar y una frontera colgada en mitad de la página sin
   * nada que la explique sería ruido.
   */
  useEffect(() => {
    if (!wide) {
      planSplit.amount = 0;
      return;
    }

    let top = 0;
    let height = 0;

    const measure = () => {
      const el = hostRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      top = r.top + window.scrollY;
      height = r.height;
    };

    const compute = () => {
      const el = hostRef.current;
      if (!el) return;
      const vh = window.innerHeight || 1;
      const seen = top - window.scrollY + height;
      // 1 con la portada centrada, 0 en cuanto sale por arriba
      const amount = Math.min(Math.max(seen / (vh * 0.75) - 0.25, 0), 1);
      planSplit.amount = amount;
      el.style.opacity = String(amount);
      /*
       * Se apaga con `visibility`, no con `pointer-events`.
       *
       * Esto era un fallo de verdad: la capa del divisor ocupa la portada
       * entera por encima del contenido, y encenderle `pointer-events` la
       * convertía en una lámina que se tragaba todo lo que hubiera debajo —
       * el botón de "Ver proyectos" incluido. La capa se queda inerte para
       * siempre; lo único que llega a coger el ratón es el tirador.
       */
      el.style.visibility = amount > 0.05 ? "visible" : "hidden";
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
      planSplit.amount = 0;
    };
  }, [wide]);

  /* ---------------------------------------------------------------- */
  /* Presentación, seguimiento y arrastre                              */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!wide) return;

    const host = hostRef.current;
    const rail = railRef.current;
    const knob = knobRef.current;
    if (!host || !rail || !knob) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /*
     * Las variables del corte se escriben en el titular, no en `:root`.
     *
     * Medido, y es la diferencia entre que esto funcione o no: escribir una
     * propiedad personalizada en el elemento raíz una vez por fotograma tira
     * la página de 41 a 16 fps. Da igual cuál sea la propiedad y da igual que
     * nadie la lea — al colgar de la raíz, el navegador tiene que recalcular
     * el estilo de todo lo que hay debajo, que es el documento entero.
     *
     * En el propio h1 cuesta 35. Es la misma variable escrita el mismo número
     * de veces; lo único que cambia es cuánta página queda por debajo.
     *
     * `--split-origin` ya vive aquí, escrito por `Hero`: las dos mitades de
     * la cuenta acaban en el mismo sitio.
     */
    const vars = (document.querySelector(".split-title") as HTMLElement | null)
      ?.style;

    /**
     * Escribe la posición del corte, en fracción del ancho de ventana.
     *
     * Los tres destinos van juntos porque tienen que ir en el mismo
     * fotograma: el objeto que lee el shader, el tirador que se ve, y la
     * variable CSS de la que cuelga el titular. Escribir uno solo deja el
     * corte del dragón en un sitio y el de las letras en otro.
     *
     * El atributo ARIA se escribe a mano: nada de esto pasa por React, así
     * que sin esto un lector de pantalla anunciaría siempre el valor inicial.
     */
    let drawnX = Number.NaN;

    const place = (x: number) => {
      const c = Math.min(Math.max(x, MIN_X), MAX_X);
      planSplit.x = c;

      /*
       * El shader se entera siempre; el DOM, solo si se le nota.
       *
       * Mientras el corte persigue al ratón esto se llama sesenta veces por
       * segundo, y cada llamada mueve el tirador y repinta el titular —que es
       * texto grande con filo dibujado, de lo más caro que hay que repintar—.
       * Por debajo de un tercio de píxel no hay nada que ver, así que la cola
       * del seguimiento, que son décimas de píxel durante casi un segundo, no
       * paga ni un repintado.
       */
      const px = c * (window.innerWidth || 1);
      if (Math.abs(px - drawnX) < 0.35) return;
      drawnX = px;

      /*
       * El tirador se mueve por transformación, no por `left`.
       *
       * `left` es geometría: cambiarlo obliga a rehacer el layout de la capa
       * y a repintarla. La transformación la resuelve el compositor sin tocar
       * nada de eso, que es justo lo que hace falta sesenta veces por segundo.
       */
      rail.style.transform = `translate3d(${px.toFixed(1)}px, 0, 0) translateX(-50%)`;
      knob.setAttribute("aria-valuenow", String(Math.round(c * 100)));
      vars?.setProperty("--split-x", `${px.toFixed(1)}px`);
    };

    place(planSplit.x);

    /* ---- Estado del gesto ---- */
    /*
     * Todo en variables del closure, ninguna en React. Un `useState` aquí
     * sería un render por fotograma de seguimiento, con la escena 3D
     * compartiendo hilo.
     */
    let dragging = false;
    /** Ya lo tocaron: se acabaron la pasada y el seguimiento. */
    let pinned = reduce;
    /** Progreso de la pasada en segundos; negativo si no está en marcha. */
    let sweep = -1;
    let swept = reduce;
    /** Segundos acumulados con la portada delante. */
    let seen = 0;
    /** Última X del puntero mientras esté dentro de la portada, o null. */
    let pointerX: number | null = null;
    let engage = 0;

    const retireHint = () => {
      const hint = hintRef.current;
      if (hint) hint.style.opacity = "0";
    };

    /*
     * La caja de la portada, medida aparte.
     *
     * Esto costó los primeros fotogramas de la ronda: `overHost` pedía un
     * `getBoundingClientRect` en cada `pointermove`, y eso obliga al navegador
     * a rehacer el layout de forma síncrona. Con la escena 3D en el mismo
     * hilo, mover el ratón por la portada bajaba de 40 a 14 fps — o sea que
     * el gesto que se acaba de inventar para que la gente juegue con el corte
     * destrozaba justo lo que se estaba intentando arreglar.
     *
     * La portada ocupa el ancho entero, así que basta con su banda vertical, y
     * eso solo cambia cuando cambia el layout.
     */
    let hostTop = 0;
    let hostHeight = 0;

    const measureHost = () => {
      const r = host.getBoundingClientRect();
      hostTop = r.top + window.scrollY;
      hostHeight = r.height;
    };

    const overHost = (y: number) => {
      const top = hostTop - window.scrollY;
      return y >= top && y <= top + hostHeight;
    };

    measureHost();

    /* ---- Puntero ---- */

    /*
     * Todo se escucha en la ventana, y el manejador no hace nada más que
     * apuntar dónde está el ratón. El trabajo —decidir si cuenta, mover el
     * corte, repintar— pasa una vez por fotograma en el bucle de abajo.
     *
     * Un ratón manda muchos más eventos que fotogramas hay, así que hacer el
     * trabajo por evento es hacerlo varias veces para pintar una.
     */
    let clientX = 0;
    let clientY = 0;
    let seenPointer = false;

    const move = (e: PointerEvent) => {
      clientX = e.clientX;
      clientY = e.clientY;
      seenPointer = true;
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || planSplit.amount < 0.4) return;
      if (!overHost(e.clientY)) return;
      const el = e.target as Element | null;
      if (el?.closest?.(INTERACTIVE)) return;

      dragging = true;
      // El primer contacto cancela la presentación y el seguimiento: a partir
      // de aquí el corte es suyo y no vuelve a moverse solo
      pinned = true;
      sweep = -1;
      swept = true;
      setGrabbed(true);
      retireHint();
      clientX = e.clientX;
      clientY = e.clientY;
      seenPointer = true;
      place(e.clientX / (window.innerWidth || 1));
      // Sin esto el arrastre va seleccionando el titular por el camino
      e.preventDefault();
    };

    const up = () => {
      if (!dragging) return;
      dragging = false;
      setGrabbed(false);
    };

    // Teclado: es un control, y un control que solo obedece al ratón deja
    // fuera a quien navega con tabulador
    const key = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 0.08 : 0.02;
      if (e.key === "ArrowLeft") place(planSplit.x - step);
      else if (e.key === "ArrowRight") place(planSplit.x + step);
      else return;
      pinned = true;
      sweep = -1;
      swept = true;
      retireHint();
      engage = 1;
      e.preventDefault();
    };

    // Al cambiar el ancho, el mismo tanto por ciento cae en otro píxel
    const relayout = () => {
      measureHost();
      drawnX = Number.NaN;
      place(planSplit.x);
    };

    /* ---- Bucle ---- */

    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const d = Math.min((now - last) / 1000, 0.05);
      last = now;

      /*
       * Fuera de la portada no se toca la posición —el corte se queda donde
       * lo dejaron— pero el realce del titular se apaga. Si no, el titular se
       * quedaría medio dibujado mientras se va por arriba.
       */
      if (planSplit.amount < 0.05) {
        seen = 0;
        if (engage > 0.001) {
          engage += (0 - engage) * (1 - Math.pow(0.05, d / ENGAGE_TAU));
          planSplit.engage = engage;
          vars?.setProperty("--split-amt", engage.toFixed(3));
        }
        return;
      }

      seen += d;

      /*
       * Dónde está el ratón, una vez por fotograma. Mientras se arrastra da
       * igual si se ha salido de la portada por abajo: la mano ya está en el
       * gesto y soltarlo por cruzar un borde sería peor que seguirlo.
       */
      if (dragging) {
        place(clientX / (window.innerWidth || 1));
        pointerX = clientX / (window.innerWidth || 1);
      } else {
        pointerX =
          seenPointer && overHost(clientY)
            ? clientX / (window.innerWidth || 1)
            : null;
      }

      /* Presentación: una sola vez, al segundo de estar delante */
      if (!swept && sweep < 0 && seen > SWEEP_DELAY) sweep = 0;

      let engageTarget = 0;

      if (sweep >= 0) {
        sweep += d;
        const p = Math.min(sweep / SWEEP_TIME, 1);
        /*
         * Ida y vuelta con las dos puntas planas. Es `sin²`, no un seno: con
         * un seno la pasada arranca ya en movimiento y se lee como un tirón,
         * y lo que tiene que parecer es una mano que empuja y devuelve.
         */
        const s = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
        place(HOME_X + (SWEEP_X - HOME_X) * s);
        engageTarget = 1;
        if (p >= 1) {
          sweep = -1;
          swept = true;
        }
      } else if (!pinned) {
        // Seguimiento: al puntero si está sobre la portada, y a casa si no
        const target = pointerX ?? HOME_X;
        place(
          planSplit.x +
            (target - planSplit.x) * (1 - Math.pow(0.05, d / FOLLOW_TAU)),
        );
        engageTarget = pointerX === null ? 0 : 1;
      } else {
        /*
         * Fijado: el corte no se mueve solo nunca más, y el realce del
         * titular solo vuelve si el ratón se acerca al corte.
         *
         * La cercanía importa. Sin ella, quien fijó el corte y baja el ratón
         * hasta el botón se encuentra el titular entero dibujado a línea por
         * el camino, sin haber pedido nada. Con ella el efecto está donde
         * está su atención — que mientras seguía al puntero era, por
         * definición, siempre.
         */
        engageTarget =
          dragging ||
          (pointerX !== null && Math.abs(pointerX - planSplit.x) < NEAR_X)
            ? 1
            : 0;
      }

      if (Math.abs(engageTarget - engage) > 0.0005) {
        engage += (engageTarget - engage) * (1 - Math.pow(0.05, d / ENGAGE_TAU));
        planSplit.engage = engage;
        vars?.setProperty("--split-amt", engage.toFixed(3));
      }
    };

    raf = requestAnimationFrame(frame);

    knob.addEventListener("keydown", key);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });
    window.addEventListener("resize", relayout, { passive: true });
    const offLayout = onLayoutChange(measureHost);

    return () => {
      cancelAnimationFrame(raf);
      knob.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("resize", relayout);
      offLayout();
      planSplit.engage = 0;
      vars?.setProperty("--split-amt", "0");
    };
  }, [wide]);

  if (!wide) return null;

  return (
    <div
      ref={hostRef}
      className="pointer-events-none absolute inset-0 z-20"
      style={{ opacity: 0 }}
    >
      <div
        ref={railRef}
        className="pointer-events-none absolute inset-y-0 left-0 w-14 will-change-transform"
        style={{
          transform: `translate3d(${HOME_X * 100}vw, 0, 0) translateX(-50%)`,
        }}
      >
        {/* El filo. Va a media opacidad y sube al agarrarlo. */}
        <span
          aria-hidden
          className={`absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-light to-transparent transition-opacity duration-300 ${
            grabbed ? "opacity-100" : "opacity-45"
          }`}
        />

        {/*
          El tirador es lo único de toda la capa que coge el ratón.

          La capa entera lo cogía antes, y por eso se tragaba el botón de la
          portada. Ahora el arrastre se puede empezar en cualquier hueco —lo
          decide el `pointerdown` de la ventana, que respeta enlaces y
          botones— y esto queda como lo que se ve y lo que recibe el foco.
        */}
        <span
          ref={knobRef}
          role="slider"
          tabIndex={0}
          aria-label={t({
            es: "Del plano a la realidad: arrastra para partir el dragón",
            en: "From plan to reality: drag to split the dragon",
          })}
          aria-valuemin={Math.round(MIN_X * 100)}
          aria-valuemax={Math.round(MAX_X * 100)}
          aria-valuenow={Math.round(planSplit.x * 100)}
          data-cursor="view"
          data-cursor-label={t({ es: "fijar", en: "pin" })}
          className={`pointer-events-auto absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border bg-navy-950/80 backdrop-blur-[2px] outline-none transition-colors duration-300 ${
            grabbed
              ? "border-cyan-light text-cyan-light"
              : "border-cyan-brand/40 text-cyan-light/70 hover:border-cyan-light focus-visible:border-cyan-light"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 7l-4 5 4 5M15 7l4 5-4 5" />
          </svg>
        </span>

        {/*
          La instrucción, y solo hasta que sirva de algo.

          Se retira en el primer contacto escribiendo la opacidad a mano: una
          instrucción que sigue ahí después de haberla seguido es lo que hace
          que una página parezca un tutorial.
        */}
        <span
          ref={hintRef}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 mt-12 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-light/45 transition-opacity duration-700"
        >
          {t({
            es: "te sigue · clic para fijarlo",
            en: "it follows you · click to pin",
          })}
        </span>

        {/* Rótulos: uno a cada lado, para que el gesto se explique solo */}
        <span
          aria-hidden
          className="absolute right-full top-1/2 mr-4 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-light/55"
        >
          {t({ es: "Plano", en: "Plan" })}
        </span>
        <span
          aria-hidden
          className="absolute left-full top-1/2 ml-4 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim"
        >
          {t({ es: "Realidad", en: "Reality" })}
        </span>
      </div>
    </div>
  );
}
