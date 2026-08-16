"use client";

import { useEffect, useRef, useState } from "react";
import { PROCESS, PROCESS_INTRO } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import Reveal from "./Reveal";

/**
 * Los cuatro pasos se van encendiendo conforme el scroll los alcanza,
 * y la línea que los une se dibuja detrás. Es la sección donde el
 * "algo se está formando" se lee sin depender del 3D.
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
    <section id="proceso" className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-light">
              {t(PROCESS_INTRO.eyebrow)}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-orange-brand/50 to-transparent" />
          </div>
          <h2 className="mt-8 max-w-2xl font-display text-[clamp(2rem,5vw,3.75rem)] font-bold leading-[1.02] text-ink">
            {t(PROCESS_INTRO.title)}
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-dim">
            {t(PROCESS_INTRO.subtitle)}
          </p>
        </Reveal>

        <ol
          ref={trackRef}
          className="relative mt-16 grid gap-10 lg:mt-24 lg:grid-cols-4 lg:gap-6"
        >
          {/* Riel: vertical en móvil, horizontal en escritorio */}
          <span
            aria-hidden
            className="absolute left-[19px] top-2 bottom-2 w-px bg-white/10 lg:left-0 lg:right-0 lg:top-[19px] lg:bottom-auto lg:h-px lg:w-auto"
          />
          <span
            aria-hidden
            className="absolute left-[19px] top-2 w-px bg-gradient-to-b from-cyan-brand to-orange-brand transition-[height] duration-300 ease-out lg:hidden"
            style={{
              height: `calc(${progress * 100}% - 1rem)`,
              maxHeight: "calc(100% - 1rem)",
            }}
          />
          <span
            aria-hidden
            className="absolute left-0 top-[19px] hidden h-px bg-gradient-to-r from-cyan-brand to-orange-brand transition-[width] duration-300 ease-out lg:block"
            style={{ width: `${progress * 100}%` }}
          />

          {PROCESS.map((step, i) => (
            <li key={step.step} className="relative pl-14 lg:pl-0">
              <span
                className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border font-mono text-xs transition-all duration-500 lg:relative lg:mb-7 ${
                  reached(i)
                    ? "border-cyan-brand bg-cyan-brand text-navy-950 shadow-[0_0_28px_-4px_rgba(34,181,207,0.8)]"
                    : "border-white/15 bg-navy-950 text-ink-dim"
                }`}
              >
                {step.step}
              </span>

              <div
                className={`transition-all duration-700 ${
                  reached(i)
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-40"
                }`}
              >
                <h3 className="font-display text-xl font-bold text-ink">
                  {t(step.title)}
                </h3>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-light">
                  {t(step.duration)}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-ink-dim">
                  {t(step.body)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
