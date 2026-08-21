"use client";

import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { onLayoutChange, onScrollFrame, tickNow } from "@/lib/scrollTicker";

const SECTIONS = [
  { id: "top", label: { es: "Inicio", en: "Home" } },
  ...NAV.map((n) => ({ id: n.id, label: n.label })),
];

/**
 * Rieles laterales fijos.
 *
 * Ocupan los márgenes que el contenido central deja vacíos y dan referencia
 * permanente de dónde estás: a la izquierda la sección en vertical, a la
 * derecha el avance del scroll. Se ocultan por debajo de 1280px, donde no
 * hay márgenes que llenar.
 */
export default function SideRails() {
  const { t, lang } = useLang();
  const [index, setIndex] = useState(0);
  const barRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  /*
   * El avance se escribe a mano; el índice sí es estado, pero solo cambia
   * cuando cambia de verdad.
   *
   * Iba todo por estado en cada fotograma: un render por fotograma para mover
   * una barra, y encima una vuelta al DOM midiendo las seis secciones. Los
   * topes se miden una vez y se recalculan cuando cambia el layout.
   */
  useEffect(() => {
    let tops: number[] = [];
    let last = -1;

    // `scrollHeight` tambien se cachea: leerlo obliga al navegador a rehacer
    // el layout, y aqui se leia una vez por fotograma de scroll
    let maxScroll = 0;

    const measure = () => {
      tops = SECTIONS.map((s) => {
        const el = document.getElementById(s.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
      });
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    };

    const compute = () => {
      const progress =
        maxScroll > 0
          ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
          : 0;

      const pct = progress * 100;
      if (barRef.current) barRef.current.style.height = `${pct}%`;
      if (dotRef.current) dotRef.current.style.top = `calc(${pct}% - 3.5px)`;
      if (pctRef.current) pctRef.current.textContent = `${Math.round(pct)}%`;

      const mid = window.scrollY + window.innerHeight * 0.4;
      let current = 0;
      for (let i = 0; i < tops.length; i++) if (mid >= tops[i]) current = i;
      if (current !== last) {
        last = current;
        setIndex(current);
      }
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

  const active = SECTIONS[index];

  return (
    <>
      {/* Riel izquierdo: sección actual en vertical */}
      <div className="pointer-events-none fixed left-0 top-0 z-40 hidden h-full w-16 flex-col items-center justify-between py-8 xl:flex">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim/50">
          B
        </span>

        <div className="flex flex-col items-center gap-5">
          <span className="h-16 w-px bg-gradient-to-b from-transparent to-white/20" />
          <span
            className="whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-light/80"
            style={{ writingMode: "vertical-rl" }}
          >
            {t(active.label)}
          </span>
          <span className="h-16 w-px bg-gradient-to-t from-transparent to-white/20" />
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim/50">
          {lang === "es" ? "EC" : "EC"}
        </span>
      </div>

      {/* Riel derecho: avance del scroll */}
      <div className="pointer-events-none fixed right-0 top-0 z-40 hidden h-full w-16 flex-col items-center justify-center gap-5 xl:flex">
        <span className="font-mono text-[10px] tracking-[0.2em] text-ink-dim">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="relative h-40 w-px bg-white/12">
          <span
            ref={barRef}
            className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-cyan-brand to-orange-brand transition-[height] duration-150 ease-out"
            style={{ height: "0%" }}
          />
          <span
            ref={dotRef}
            className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-cyan-light shadow-[0_0_12px_rgba(79,214,232,0.9)] transition-[top] duration-150 ease-out"
            style={{ top: "calc(0% - 3.5px)" }}
          />
        </span>

        <span className="font-mono text-[10px] tracking-[0.2em] text-ink-dim/50">
          {String(SECTIONS.length).padStart(2, "0")}
        </span>

        <span
          ref={pctRef}
          className="mt-4 whitespace-nowrap font-mono text-[10px] tracking-[0.28em] text-ink-dim/60"
          style={{ writingMode: "vertical-rl" }}
        >
          0%
        </span>
      </div>
    </>
  );
}
