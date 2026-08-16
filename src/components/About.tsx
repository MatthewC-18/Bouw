"use client";

import { ABOUT, COMPANY } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";
import Reveal from "./Reveal";

const OFFICES = [
  {
    city: "Quito",
    country: { es: "Ecuador", en: "Ecuador" },
    tz: "GMT-5",
    coords: "0.18° S · 78.47° W",
  },
  {
    city: "Monterrey",
    country: { es: "México", en: "Mexico" },
    tz: "GMT-6",
    coords: "25.68° N · 100.32° W",
  },
] as const;

export default function About() {
  const { t, lang } = useLang();

  return (
    <section id="nosotros" className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
                {t(ABOUT.eyebrow)}
              </p>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.06] text-ink">
                {t(ABOUT.title)}
              </h2>
              <p className="mt-6 max-w-lg leading-relaxed text-ink-dim">
                {t(ABOUT.body)}
              </p>
            </Reveal>

            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {OFFICES.map((o, i) => (
                <Reveal key={o.city} delay={i * 90}>
                  <div className="rounded-2xl border border-white/10 bg-navy-900/85 p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-lg font-bold text-ink">
                        {o.city}
                      </h3>
                      <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-ink-dim">
                        {o.tz}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-dim">
                      {t(o.country)}
                    </p>
                    <p className="mt-4 font-mono text-[11px] tracking-wider text-cyan-light/70">
                      {o.coords}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Valores */}
          <div className="lg:pt-14">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-900/85 p-8 sm:p-10">
                <LogoMark className="pointer-events-none absolute -right-10 -top-10 h-56 w-auto opacity-[0.07]" />

                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-light">
                  {lang === "es" ? "Cómo trabajamos" : "How we work"}
                </p>

                <ul className="mt-8 space-y-8">
                  {ABOUT.values.map((v, i) => (
                    <li key={i} className="relative pl-12">
                      <span className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-brand/30 bg-cyan-brand/10 font-mono text-xs text-cyan-light">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-lg font-bold text-ink">
                        {t(v.title)}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">
                        {t(v.body)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="mt-10 flex items-baseline gap-3 border-t border-white/[0.07] pt-6">
                  <span className="font-display text-4xl font-bold text-gradient-brand">
                    {COMPANY.yearsExperience}+
                  </span>
                  <span className="text-sm text-ink-dim">
                    {lang === "es"
                      ? "años de experiencia combinada del equipo"
                      : "years of combined team experience"}
                  </span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
