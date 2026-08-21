"use client";

import { useEffect } from "react";
import { dragonScreen, markScreen, type ScreenBlob } from "@/lib/dragonScreen";
import { onLayoutChange, tickNow } from "@/lib/scrollTicker";

/**
 * El velo, solo cuando hace falta.
 *
 * Cada sección lleva un velo —una capa oscura entre la escena y el texto— que
 * es lo que permite leer un párrafo con un dragón volando por detrás. Estaba
 * fijo, y ese es el problema: un velo fijo se calibra para el peor caso, o sea
 * para el instante en que el bicho pasa justo por detrás de la línea que estás
 * leyendo. Pero ese instante es una fracción del tiempo. El resto de la vuelta
 * el velo estaba apagando una escena que no le molestaba a nadie.
 *
 * Esto lo convierte en algo que reacciona: sube al máximo cuando el bicho está
 * encima del texto y baja a la mitad cuando no. El resultado no es un velo más
 * suave — es que **el dragón puede verse mucho mejor sin que la lectura pierda
 * nada**, porque las dos cosas ya no compiten por el mismo número.
 *
 * Nunca baja a cero: por debajo del suelo el texto se apoyaría en la suerte de
 * que el bicho ande lejos, y detrás del texto hay además retícula, halos y
 * grano.
 *
 * ---------------------------------------------------------------------------
 *
 * Dos decisiones de coste, las dos medidas en el panel:
 *
 * - **La variable se escribe en la sección, no en `:root` ni en `<main>`.**
 *   Escribir una propiedad personalizada obliga a recalcular el estilo de todo
 *   lo que cuelga del elemento. Medido a 60 fps: en `:root` la página cae a
 *   14 fps, en `<main>` (723 nodos) a 20, y en la sección visible (53 nodos) a
 *   44. Solo hay una sección delante en cada momento, así que la de la sección
 *   es la única versión que sale a cuenta.
 *
 * - **Y aun así se escribe a saltos.** El valor se redondea a veinteavos, así
 *   que un cambio suave escribe diez o quince veces por segundo en vez de
 *   sesenta. La diferencia no se ve —es opacidad de un velo— y el recálculo
 *   se paga cuatro veces menos.
 */

/** Cuánto queda del velo con el bicho lejos del texto. */
const FLOOR = 0.5;

/**
 * A cuántos radios del bicho empieza a contar.
 *
 * Medido: a 2.3 el alcance salía de 750 px en una ventana de 910 de alto, o
 * sea que el bicho "estaba encima del texto" prácticamente siempre y el velo
 * no llegaba a bajar nunca. A 1.25 el alcance es poco más que su propio
 * tamaño, que es lo que de verdad estorba a una línea de texto.
 */
const REACH = 1.25;

/** Paso de redondeo: ver la nota de coste de arriba. */
const STEP = 0.05;

/**
 * Las secciones que llevan velo.
 *
 * Están las tres clases y no una: `hero-veil` es el degradado de la portada,
 * `veil` el de las secciones oscuras y `sheet` el pliego impreso del dossier.
 * Los tres son la misma idea —algo entre la escena y el texto— y los tres
 * tienen el mismo motivo para subir y bajar.
 */
const SECTIONS = ".hero-veil, .veil, .sheet";

/** Lo que cuenta como texto para medir el bloque de lectura. */
const READABLE = "p, h1, h2, h3, h4, li, label, dt, dd, blockquote";

/**
 * Cuántas cajas de texto se guardan por sección.
 *
 * Se guardan una a una y no fundidas en un rectángulo. La caja única parecía
 * suficiente y no lo era: en el diagnóstico el texto vive en dos columnas
 * —una del 12 al 49 % del ancho y otra del 56 al 84 %— y su rectángulo
 * envolvente va del 12 al 84 %, o sea que incluye el pasillo de en medio, los
 * huecos de arriba y los de abajo. Con la caja fundida el bicho estaba
 * "encima del texto" el 100 % del tiempo y el velo no bajaba nunca.
 *
 * El tope existe porque el bucle recorre la lista cada fotograma y una
 * sección con cien párrafos no aporta más precisión que una con cuarenta.
 */
const MAX_BOXES = 48;

type Band = {
  el: HTMLElement;
  /** Rango vertical de la sección, en coordenadas de documento. */
  top: number;
  bottom: number;
  /** Cajas de texto, en coordenadas de documento: [l, r, t, b] seguidos. */
  boxes: Float64Array;
};

export default function VeilHeat() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let bands: Band[] = [];
    let held: HTMLElement | null = null;
    let written = -1;

    /*
     * La caja del texto se mide, no se supone.
     *
     * La sección ocupa el ancho entero pero el texto no: en la portada llega
     * al 60 % y en las fichas de proyecto ni eso. Suponer que el texto es la
     * sección dejaría el velo alto siempre, que es exactamente lo que se
     * quiere quitar. Y esto cuesta un `getBoundingClientRect` por párrafo, así
     * que se hace cuando cambia el layout y no por fotograma.
     */
    const measure = () => {
      const sections = document.querySelectorAll<HTMLElement>(SECTIONS);
      const next: Band[] = [];
      const scroll = window.scrollY;

      sections.forEach((el) => {
        const box = el.getBoundingClientRect();
        const found: number[] = [];

        el.querySelectorAll<HTMLElement>(READABLE).forEach((node) => {
          if (found.length >= MAX_BOXES * 4) return;
          const r = node.getBoundingClientRect();
          // Lo que no llega a ocho píxeles no es texto: es un separador, un
          // rótulo oculto o un párrafo vacío
          if (r.width < 8 || r.height < 8) return;
          found.push(r.left, r.right, r.top + scroll, r.bottom + scroll);
        });

        // Sin texto medible, la sección entera cuenta como zona de lectura:
        // es el lado seguro del error
        if (found.length === 0) {
          found.push(box.left, box.right, box.top + scroll, box.bottom + scroll);
        }

        next.push({
          el,
          top: box.top + scroll,
          bottom: box.bottom + scroll,
          boxes: Float64Array.from(found),
        });
      });

      // Si cambian las secciones, la que quedó escrita puede ya no valer
      if (held && !next.some((b) => b.el === held)) {
        held.style.removeProperty("--veil-heat");
        held = null;
        written = -1;
      }
      bands = next;
    };

    const write = (el: HTMLElement | null, value: number) => {
      if (el !== held) {
        // La que se deja atrás vuelve a su valor fijo: si no, se queda
        // congelada a media opacidad al salir de pantalla
        held?.style.removeProperty("--veil-heat");
        held = el;
        written = -1;
      }
      if (!el) return;
      const q = Math.round(value / STEP) * STEP;
      if (q === written) return;
      written = q;
      el.style.setProperty("--veil-heat", q.toFixed(2));
    };

    let raf = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if ((!dragonScreen.live && !markScreen.live) || bands.length === 0)
        return;

      const vw = window.innerWidth || 1;
      const vh = window.innerHeight || 1;
      const middle = window.scrollY + vh * 0.5;

      const band = bands.find((b) => middle >= b.top && middle < b.bottom);
      if (!band) {
        write(null, 1);
        return;
      }

      /*
       * Distancia al bloque de texto más cercano; cero si está encima de
       * alguno. Manda el más cercano y no el promedio: lo que decide si se
       * puede leer una línea es si el objeto está detrás de **esa** línea, no
       * lo lejos que esté del resto de la página.
       */
      const { boxes } = band;
      const scroll = window.scrollY;

      const weigh = (blob: ScreenBlob) => {
        if (blob.live < 0.02) return 0;
        // Fuera de encuadre no hay nada que velar
        if (blob.x < -0.25 || blob.x > 1.25) return 0;

        const x = blob.x * vw;
        const y = blob.y * vh + scroll;
        const radius = Math.max(blob.r * vh, 24) * REACH;

        let gap = Infinity;
        for (let i = 0; i < boxes.length; i += 4) {
          const dx = Math.max(boxes[i] - x, 0, x - boxes[i + 1]);
          const dy = Math.max(boxes[i + 2] - y, 0, y - boxes[i + 3]);
          const g = dx * dx + dy * dy;
          if (g < gap) gap = g;
          if (gap === 0) break;
        }

        const near = Math.max(1 - Math.sqrt(gap) / radius, 0);
        return near * near * blob.live;
      };

      // Manda el que más tape: dos objetos lejos del texto no suman peligro,
      // pero uno encima ya lo justifica entero
      const near = Math.max(weigh(dragonScreen), weigh(markScreen));
      write(band.el, FLOOR + (1 - FLOOR) * near);
    };

    measure();
    raf = requestAnimationFrame(frame);
    const offLayout = onLayoutChange(measure);
    tickNow();

    return () => {
      cancelAnimationFrame(raf);
      offLayout();
      held?.style.removeProperty("--veil-heat");
    };
  }, []);

  return null;
}
