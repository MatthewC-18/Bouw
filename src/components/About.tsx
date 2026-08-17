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
    coords: "0.1807° S · 78.4678° W",
  },
  {
    city: "Monterrey",
    country: { es: "México", en: "Mexico" },
    tz: "GMT-6",
    coords: "25.6866° N · 100.3161° W",
  },
] as const;

/**
 * Nosotros, sobre hoja clara.
 * Segundo pliego del sitio: cierra el bloque impreso que abre Proceso.
 */
export default function About() {
  const { t, lang } = useLang();

  return (
    <section id="nosotros" className="relative py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal>
          <div className="sheet relative overflow-hidden rounded-[2rem] px-7 py-14 shadow-[0_60px_120px_-60px_rgba(0,0,0,0.85)] sm:px-12 lg:px-16 lg:py-20">
            <LogoMark className="pointer-events-none absolute -right-16 -top-16 h-72 w-auto opacity-[0.06]" />

            <span
              aria-hidden
              className="absolute right-8 top-8 hidden font-mono text-[10px] uppercase tracking-[0.28em] text-[#0d2947]/35 lg:block"
            >
              BOUW · P—05
            </span>

            <div className="relative grid gap-14 lg:grid-cols-2 lg:gap-16">
              <div>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-brand">
                    {t(ABOUT.eyebrow)}
                  </span>
                  <span className="sheet-rule h-px flex-1" />
                </div>

                <h2 className="mt-8 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.04]">
                  {t(ABOUT.title)}
                </h2>
                <p className="sheet-dim mt-6 max-w-lg leading-relaxed">
                  {t(ABOUT.body)}
                </p>

                <div className="mt-12 grid gap-4 sm:grid-cols-2">
                  {OFFICES.map((o) => (
                    <div
                      key={o.city}
                      className="rounded-2xl border border-[#0d2947]/15 bg-[#0d2947]/[0.035] p-6"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg font-bold">
                          {o.city}
                        </h3>
                        <span className="rounded-full border border-[#0d2947]/15 px-2.5 py-0.5 font-mono text-[10px] text-[#0d2947]/60">
                          {o.tz}
                        </span>
                      </div>
                      <p className="sheet-dim mt-1 text-sm">{t(o.country)}</p>
                      <p className="mt-4 font-mono text-[11px] tracking-wider text-[#0d2947]/55">
                        {o.coords}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valores */}
              <div className="lg:pt-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#0d2947]/45">
                  {lang === "es" ? "Cómo trabajamos" : "How we work"}
                </p>

                <ul className="mt-8 space-y-8">
                  {ABOUT.values.map((v, i) => (
                    <li key={i} className="relative pl-14">
                      <span className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-lg border border-[#0d2947]/15 font-mono text-xs text-[#0d2947]/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-lg font-bold">
                        {t(v.title)}
                      </h3>
                      <p className="sheet-dim mt-1.5 text-sm leading-relaxed">
                        {t(v.body)}
                      </p>
                    </li>
                  ))}
                </ul>

                <div className="sheet-rule mt-10 h-px" />
                <div className="mt-6 flex items-baseline gap-3">
                  <span className="font-display text-5xl font-bold text-orange-brand">
                    {COMPANY.yearsExperience}+
                  </span>
                  <span className="sheet-dim text-sm">
                    {lang === "es"
                      ? "años de experiencia combinada del equipo"
                      : "years of combined team experience"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
