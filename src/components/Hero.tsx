"use client";

import { useEffect, useState } from "react";
import { COMPANY, HERO, STATS } from "@/lib/content";
import { useLang } from "@/lib/i18n";

export default function Hero() {
  const { t } = useLang();
  const [fade, setFade] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const h = window.innerHeight || 1;
        setFade(Math.min(Math.max(window.scrollY / h, 0), 1));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-24 lg:px-10">
        <div className="max-w-3xl">
          <p className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.28em] text-cyan-light backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-light opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-light" />
            </span>
            {t(HERO.eyebrow)}
          </p>

          <h1 className="font-display text-[clamp(2.75rem,8vw,6.5rem)] font-bold leading-[0.94] tracking-tight">
            <span className="block text-ink">{t(HERO.titleTop)}</span>
            <span className="block text-gradient-brand">
              {t(HERO.titleAccent)}
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-dim">
            {t(HERO.subtitle)}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#proyectos"
              data-cursor="link"
              className="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-brand to-cyan-light px-8 py-4 text-sm font-semibold text-navy-950 transition-transform duration-300 hover:scale-[1.03]"
            >
              <span className="relative z-10">{t(HERO.ctaPrimary)}</span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-orange-brand to-orange-light transition-transform duration-500 group-hover:translate-x-0" />
            </a>

            <a
              href="#contacto"
              data-cursor="link"
              className="rounded-full border border-white/15 px-8 py-4 text-sm font-semibold text-ink transition-colors duration-300 hover:border-cyan-brand hover:text-cyan-light"
            >
              {t(HERO.ctaSecondary)}
            </a>
          </div>

          {/* Métricas */}
          <dl className="mt-16 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.value} className="border-l border-white/10 pl-4">
                <dt className="font-display text-3xl font-bold text-gradient-brand">
                  {s.value}
                </dt>
                <dd className="mt-1 text-xs leading-snug text-ink-dim">
                  {t(s.label)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Coordenadas de las sedes: detalle de plano, no adorno */}
      <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-6 xl:flex">
        {[
          { city: "QUITO", coords: "0.1807° S · 78.4678° W" },
          { city: "MONTERREY", coords: "25.6866° N · 100.3161° W" },
        ].map((o) => (
          <div key={o.city} className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-ink-dim">
              {o.city}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-cyan-light/60">
              {o.coords}
            </p>
          </div>
        ))}
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-ink-dim/60">
          {COMPANY.yearsExperience}+ {"//"} EST.
        </p>
      </div>

      {/* Indicador de scroll */}
      <div
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
        style={{ opacity: 1 - fade * 2 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
          {t(HERO.scrollHint)}
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-4 animate-scroll-dot bg-cyan-light" />
        </span>
      </div>
    </section>
  );
}
