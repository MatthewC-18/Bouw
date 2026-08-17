"use client";

import { useEffect, useRef, useState } from "react";
import { PROCESS, PROCESS_INTRO } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import Reveal from "./Reveal";

/**
 * Proceso, sobre hoja clara.
 *
 * Es la sección que rompe el todo-oscuro: un pliego color hueso flotando
 * sobre la escena, como una hoja técnica puesta encima de la mesa. Los cuatro
 * pasos se encienden conforme el scroll los alcanza y la línea que los une se
 * dibuja detrás.
 */
export default function Process() {
  const { t } = useLang();
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
      // 0 cuando la lista entra por abajo, 1 cuando su final cruza el centro.
      const p = (vh * 0.75 - r.top) / Math.max(r.height * 0.85, 1);
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

  const reached = (i: number) => progress >= (i + 0.35) / PROCESS.length;

  return (
    <section id="proceso" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal>
          <div className="sheet relative overflow-hidden rounded-[2rem] px-7 py-14 shadow-[0_60px_120px_-60px_rgba(0,0,0,0.85)] sm:px-12 lg:px-16 lg:py-20">
            {/* Margen de pliego: dos filos como los de una hoja perforada */}
            <span
              aria-hidden
              className="sheet-rule absolute inset-y-0 left-8 hidden w-px lg:block"
            />
            <span
              aria-hidden
              className="absolute right-8 top-8 hidden font-mono text-[10px] uppercase tracking-[0.28em] text-[#0d2947]/35 lg:block"
            >
              BOUW · P—04
            </span>

            <div className="relative">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-brand">
                  {t(PROCESS_INTRO.eyebrow)}
                </span>
                <span className="sheet-rule h-px flex-1" />
              </div>

              <h2 className="mt-8 max-w-2xl font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.02]">
                {t(PROCESS_INTRO.title)}
              </h2>
              <p className="sheet-dim mt-6 max-w-xl text-lg leading-relaxed">
                {t(PROCESS_INTRO.subtitle)}
              </p>

              <ol
                ref={trackRef}
                className="relative mt-14 grid gap-10 lg:mt-20 lg:grid-cols-4 lg:gap-8"
              >
                {/* Riel: vertical en móvil, horizontal en escritorio */}
                <span
                  aria-hidden
                  className="sheet-rule absolute left-[19px] bottom-2 top-2 w-px lg:left-0 lg:right-0 lg:bottom-auto lg:top-[19px] lg:h-px lg:w-auto"
                />
                <span
                  aria-hidden
                  className="absolute left-[19px] top-2 w-px bg-orange-brand transition-[height] duration-300 ease-out lg:hidden"
                  style={{
                    height: `calc(${progress * 100}% - 1rem)`,
                    maxHeight: "calc(100% - 1rem)",
                  }}
                />
                <span
                  aria-hidden
                  className="absolute left-0 top-[19px] hidden h-px bg-orange-brand transition-[width] duration-300 ease-out lg:block"
                  style={{ width: `${progress * 100}%` }}
                />

                {PROCESS.map((step, i) => (
                  <li key={step.step} className="relative pl-14 lg:pl-0">
                    <span
                      className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border font-mono text-xs transition-all duration-500 lg:relative lg:mb-8 ${
                        reached(i)
                          ? "border-orange-brand bg-orange-brand text-[#fdf8f1]"
                          : "border-[#0d2947]/20 bg-transparent text-[#0d2947]/50"
                      }`}
                    >
                      {step.step}
                    </span>

                    <div
                      className={`transition-all duration-700 ${
                        reached(i)
                          ? "translate-y-0 opacity-100"
                          : "translate-y-3 opacity-45"
                      }`}
                    >
                      <h3 className="font-display text-xl font-bold">
                        {t(step.title)}
                      </h3>
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-brand">
                        {t(step.duration)}
                      </p>
                      <p className="sheet-dim mt-4 text-sm leading-relaxed">
                        {t(step.body)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
