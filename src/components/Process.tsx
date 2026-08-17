"use client";

import { useEffect, useRef, useState } from "react";
import { PROCESS, PROCESS_INTRO } from "@/lib/content";
import { useLang } from "@/lib/i18n";

/**
 * Proceso — primer pliego del dossier.
 *
 * Monocromo: tinta navy en tres intensidades sobre papel frío, sin naranja.
 * La retícula son columnas verticales tenues de papel de contabilidad, no
 * filetes debajo de cada fila; el paso alcanzado se marca subiendo la tinta
 * y no metiendo otro color.
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
      <span className="crop-mark left-5 top-5 border-l border-t" aria-hidden />
      <span className="crop-mark right-5 top-5 border-r border-t" aria-hidden />

      {/* Cabecera de pliego */}
      <div className="sheet-rule h-px w-full" />
      <div className="relative z-10 mx-auto flex max-w-[1560px] items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#0d2947]/50 lg:px-16">
        <span className="ink-chip px-2.5 py-1">BOUW</span>
        <span className="hidden sm:inline">
          {lang === "es" ? "Pliego 04 — Método" : "Sheet 04 — Method"}
        </span>
        <span>04 / 05</span>
      </div>
      <div className="sheet-rule h-px w-full" />

      <div className="ledger-columns relative z-10">
        <div className="mx-auto max-w-[1560px] px-6 py-20 lg:px-16 lg:py-28">
          {/* Titular con numeral colgado */}
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <span className="font-display text-[clamp(3rem,7vw,6rem)] font-bold leading-none text-[#0d2947]/12">
                04
              </span>
            </div>

            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#0d2947]/55">
                {t(PROCESS_INTRO.eyebrow)}
              </p>
              <h2 className="mt-5 font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[0.98]">
                {t(PROCESS_INTRO.title)}
              </h2>
            </div>

            <div className="lg:col-span-3 lg:pt-2">
              <p className="sheet-dim text-sm leading-relaxed">
                {t(PROCESS_INTRO.subtitle)}
              </p>
            </div>
          </div>

          {/* Los pasos: numerales grandes y aire, sin filetes por fila */}
          <ol
            ref={trackRef}
            className="mt-20 grid gap-14 sm:grid-cols-2 lg:mt-28 lg:grid-cols-4 lg:gap-10"
          >
            {PROCESS.map((step, i) => (
              <li key={step.step} className="relative">
                <span
                  className={`block font-display text-[clamp(3.5rem,6vw,5rem)] font-bold leading-[0.8] transition-colors duration-700 ${
                    reached(i) ? "text-[#0d2947]" : "text-[#0d2947]/18"
                  }`}
                >
                  {step.step}
                </span>

                <span
                  aria-hidden
                  className={`mt-6 block h-px origin-left bg-[#0d2947]/70 transition-transform duration-700 ease-out ${
                    reached(i) ? "scale-x-100" : "scale-x-0"
                  }`}
                />

                <h3
                  className={`mt-6 font-display text-xl font-bold leading-tight transition-opacity duration-700 ${
                    reached(i) ? "opacity-100" : "opacity-35"
                  }`}
                >
                  {t(step.title)}
                </h3>

                <p
                  className={`sheet-dim mt-3 text-sm leading-relaxed transition-opacity duration-700 ${
                    reached(i) ? "opacity-100" : "opacity-35"
                  }`}
                >
                  {t(step.body)}
                </p>

                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-[#0d2947]/45">
                  {t(step.duration)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
