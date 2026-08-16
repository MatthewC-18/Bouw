"use client";

import { useEffect, useState } from "react";
import { NAV } from "@/lib/content";
import { useLang } from "@/lib/i18n";

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
  const [progress, setProgress] = useState(0);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0);

      const mid = window.scrollY + window.innerHeight * 0.4;
      let current = 0;
      SECTIONS.forEach((s, i) => {
        const el = document.getElementById(s.id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (mid >= top) current = i;
      });
      setIndex(current);
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
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
            className="absolute inset-x-0 top-0 origin-top bg-gradient-to-b from-cyan-brand to-orange-brand transition-[height] duration-150 ease-out"
            style={{ height: `${progress * 100}%` }}
          />
          <span
            className="absolute -left-[3px] h-[7px] w-[7px] rounded-full bg-cyan-light shadow-[0_0_12px_rgba(79,214,232,0.9)] transition-[top] duration-150 ease-out"
            style={{ top: `calc(${progress * 100}% - 3.5px)` }}
          />
        </span>

        <span className="font-mono text-[10px] tracking-[0.2em] text-ink-dim/50">
          {String(SECTIONS.length).padStart(2, "0")}
        </span>

        <span
          className="mt-4 whitespace-nowrap font-mono text-[10px] tracking-[0.28em] text-ink-dim/60"
          style={{ writingMode: "vertical-rl" }}
        >
          {Math.round(progress * 100)}%
        </span>
      </div>
    </>
  );
}
