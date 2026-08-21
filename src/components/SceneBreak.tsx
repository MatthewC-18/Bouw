"use client";

import { useEffect, useRef } from "react";
import type { Localized } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { onLayoutChange, onScrollFrame, tickNow } from "@/lib/scrollTicker";

type Props = {
  /** Índice técnico que aparece junto a la frase */
  mark: string;
  quote: Localized;
  /** A qué lado se ancla el texto; el otro lado queda libre para la escena */
  align?: "left" | "right";
};

/**
 * Banda sin contenido opaco entre secciones.
 *
 * Aquí es donde el ensamblaje de la marca ocurre a la vista: nada la tapa.
 * El texto es corto y se pega a un costado para no competir con la escena.
 */
export default function SceneBreak({ mark, quote, align = "left" }: Props) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);

  /*
   * Se anima escribiendo estilos, no con estado.
   *
   * Hay tres bandas en la página y cada una hacía `setState` en cada
   * fotograma de scroll: tres renders de React por fotograma para mover una
   * opacidad y un ancho. Escribirlos directamente cuesta lo mismo que la
   * asignación y no despierta al reconciliador.
   */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    /*
     * La banda se mide aparte del scroll.
     *
     * `getBoundingClientRect` obliga al navegador a rehacer el layout de
     * forma sincrona. Hay tres bandas en la pagina y cada una escribia
     * estilos justo antes de que la siguiente pidiera su rectangulo: leer,
     * escribir, leer, escribir, sesenta veces por segundo y con el lienzo 3D
     * peleando por el mismo hilo. Eso es exactamente lo que se siente como
     * que la pagina va pesada al bajar.
     *
     * Ahora la posicion se mide cuando cambia el layout y durante el scroll
     * solo se lee `scrollY`, que no cuesta nada.
     */
    let top = 0;
    let height = 0;

    const measure = () => {
      const r = el.getBoundingClientRect();
      top = r.top + window.scrollY;
      height = r.height;
    };

    const compute = () => {
      const vh = window.innerHeight || 1;
      // 0 al entrar por abajo, 1 al salir por arriba
      const p = Math.min(
        Math.max(1 - (top - window.scrollY + height / 2) / vh, 0),
        1,
      );
      // Se revela cerca del centro de la pantalla y se retira al salir
      const near = Math.sin(p * Math.PI);

      const fig = figureRef.current;
      if (fig) {
        fig.style.opacity = String(0.25 + near * 0.75);
        fig.style.transform = `translateY(${(1 - near) * 20}px)`;
      }
      const rule = ruleRef.current;
      if (rule) rule.style.width = `${24 + near * 56}px`;
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

  return (
    <div
      ref={ref}
      aria-hidden={false}
      className="relative flex min-h-[85svh] items-center overflow-hidden"
    >
      <div className="mx-auto flex w-full max-w-6xl px-6 lg:px-10">
        <figure
          ref={figureRef}
          className={`max-w-sm ${align === "right" ? "ml-auto text-right" : ""}`}
          style={{ opacity: 0.25, transition: "opacity 120ms linear" }}
        >
          <div
            className={`flex items-center gap-3 ${align === "right" ? "justify-end" : ""}`}
          >
            <span className="font-mono text-[11px] tracking-[0.3em] text-ink-dim">
              {mark}
            </span>
            <span
              ref={ruleRef}
              className="h-px bg-gradient-to-r from-cyan-brand to-transparent transition-[width] duration-500"
              style={{ width: "24px" }}
            />
          </div>

          <blockquote className="mt-6 font-display text-[clamp(1.5rem,3.2vw,2.5rem)] font-bold leading-[1.12] text-ink">
            {t(quote)}
          </blockquote>
        </figure>
      </div>
    </div>
  );
}
