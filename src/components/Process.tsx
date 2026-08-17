"use client";

import { useEffect, useRef, useState } from "react";
import { PROCESS, PROCESS_INTRO } from "@/lib/content";
import { useLang } from "@/lib/i18n";

/**
 * Proceso — primer pliego del dossier impreso.
 *
 * Papel a sangre, no tarjeta: corta la página de lado a lado, sin radio ni
 * sombra. La jerarquía la llevan los filetes de un píxel, los numerales
 * colgados en el margen y el tamaño de la letra. Los cuatro pasos son una
 * tabla, no cuatro cajas.
 */
export default function Process() {
  const { t, lang } = useLang();
  const trackRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.72 - r.top) / Math.max(r.height * 0.8, 1);
      setProgress(Math.min(Math.max(p, 0), 1));
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

  const reached = (i: number) => progress >= (i + 0.3) / PROCESS.length;

  return (
    <section id="proceso" className="sheet relative">
      {/* Marcas de corte de la plancha */}
      <span className="crop-mark left-5 top-5 border-l border-t" aria-hidden />
      <span className="crop-mark right-5 top-5 border-r border-t" aria-hidden />

      {/* Cabecera de pliego */}
      <div className="sheet-rule h-px w-full" />
      <div className="mx-auto flex max-w-[1560px] items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#0d2947]/50 lg:px-16">
        <span>BOUW · Dossier</span>
        <span className="hidden sm:inline">
          {lang === "es" ? "Pliego 04 — Método" : "Sheet 04 — Method"}
        </span>
        <span>ES · EN</span>
      </div>
      <div className="sheet-rule h-px w-full" />

      <div className="mx-auto max-w-[1560px] px-6 py-20 lg:px-16 lg:py-28">
        {/* Titular con numeral colgado en el margen */}
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-2">
            <span className="font-display text-[clamp(3rem,7vw,6rem)] font-bold leading-none text-[#0d2947]/15">
              04
            </span>
          </div>

          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-brand">
              {t(PROCESS_INTRO.eyebrow)}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[0.98]">
              {t(PROCESS_INTRO.title)}
            </h2>
          </div>

          <div className="lg:col-span-3">
            <p className="sheet-dim border-l border-[#0d2947]/20 pl-5 text-sm leading-relaxed">
              {t(PROCESS_INTRO.subtitle)}
            </p>
          </div>
        </div>

        {/* Los pasos como tabla: filetes, no cajas */}
        <ol ref={trackRef} className="mt-20 lg:mt-28">
          <div className="sheet-rule h-px w-full" />

          {PROCESS.map((step, i) => (
            <li
              key={step.step}
              className="group/step relative grid gap-4 border-b border-[#0d2947]/16 py-8 lg:grid-cols-12 lg:gap-8 lg:py-10"
            >
              {/* Barra de avance que recorre la fila alcanzada */}
              <span
                aria-hidden
                className={`absolute left-0 top-0 h-px origin-left bg-orange-brand transition-transform duration-700 ease-out ${
                  reached(i) ? "scale-x-100" : "scale-x-0"
                }`}
                style={{ width: "100%" }}
              />

              <div className="flex items-baseline gap-4 lg:col-span-2">
                <span
                  className={`font-mono text-xs transition-colors duration-500 ${
                    reached(i) ? "text-orange-brand" : "text-[#0d2947]/35"
                  }`}
                >
                  {step.step}
                </span>
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                    reached(i) ? "bg-orange-brand" : "bg-[#0d2947]/20"
                  }`}
                />
              </div>

              <h3
                className={`font-display text-2xl font-bold leading-tight transition-opacity duration-700 lg:col-span-3 lg:text-[1.75rem] ${
                  reached(i) ? "opacity-100" : "opacity-40"
                }`}
              >
                {t(step.title)}
              </h3>

              <p
                className={`sheet-dim text-sm leading-relaxed transition-opacity duration-700 lg:col-span-5 ${
                  reached(i) ? "opacity-100" : "opacity-40"
                }`}
              >
                {t(step.body)}
              </p>

              <p
                className={`font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-500 lg:col-span-2 lg:text-right ${
                  reached(i) ? "text-orange-brand" : "text-[#0d2947]/35"
                }`}
              >
                {t(step.duration)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
