"use client";

import { ABOUT, COMPANY } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";

const OFFICES = [
  {
    city: "Quito",
    country: { es: "Ecuador", en: "Ecuador" },
    tz: "GMT-5",
    coords: "0.1807° S · 78.4678° W",
    since: "2019",
  },
  {
    city: "Monterrey",
    country: { es: "México", en: "Mexico" },
    tz: "GMT-6",
    coords: "25.6866° N · 100.3161° W",
    since: "2023",
  },
] as const;

/**
 * Nosotros — segundo pliego del dossier.
 *
 * Misma retícula que Proceso. Las sedes son una tabla con filetes, no
 * tarjetas redondeadas: es una ficha de empresa, no un panel de app.
 */
export default function About() {
  const { t, lang } = useLang();

  return (
    <section id="nosotros" className="sheet relative">
      <div className="sheet-rule h-px w-full" />
      <div className="mx-auto flex max-w-[1560px] items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#0d2947]/50 lg:px-16">
        <span>BOUW · Dossier</span>
        <span className="hidden sm:inline">
          {lang === "es" ? "Pliego 05 — Equipo" : "Sheet 05 — Team"}
        </span>
        <span>EC · MX</span>
      </div>
      <div className="sheet-rule h-px w-full" />

      <div className="relative mx-auto max-w-[1560px] px-6 py-20 lg:px-16 lg:py-28">
        <LogoMark className="pointer-events-none absolute -top-6 right-4 h-64 w-auto opacity-[0.05] lg:right-16 lg:h-80" />

        <div className="relative grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-2">
            <span className="font-display text-[clamp(3rem,7vw,6rem)] font-bold leading-none text-[#0d2947]/15">
              05
            </span>
          </div>

          <div className="lg:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-brand">
              {t(ABOUT.eyebrow)}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[0.98]">
              {t(ABOUT.title)}
            </h2>
            <p className="sheet-dim mt-8 max-w-xl text-lg leading-relaxed">
              {t(ABOUT.body)}
            </p>
          </div>

          <div className="lg:col-span-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#0d2947]/45">
              {lang === "es" ? "Cómo trabajamos" : "How we work"}
            </p>
            <ul className="mt-6 space-y-6">
              {ABOUT.values.map((v, i) => (
                <li
                  key={i}
                  className="border-t border-[#0d2947]/16 pt-4 first:border-t-0 first:pt-0"
                >
                  <h3 className="flex gap-3 font-display text-base font-bold">
                    <span className="font-mono text-[11px] text-orange-brand">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {t(v.title)}
                  </h3>
                  <p className="sheet-dim mt-1.5 text-sm leading-relaxed">
                    {t(v.body)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sedes como tabla de ficha */}
        <div className="mt-20 lg:mt-28">
          <div className="flex items-baseline justify-between border-b border-[#0d2947]/25 pb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[#0d2947]/50">
            <span>{lang === "es" ? "Sedes" : "Offices"}</span>
            <span>{lang === "es" ? "Coordenadas" : "Coordinates"}</span>
          </div>

          {OFFICES.map((o) => (
            <div
              key={o.city}
              className="grid items-baseline gap-3 border-b border-[#0d2947]/16 py-7 sm:grid-cols-12"
            >
              <h3 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-none sm:col-span-4">
                {o.city}
              </h3>
              <p className="sheet-dim text-sm sm:col-span-2">{t(o.country)}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#0d2947]/55 sm:col-span-2">
                {o.tz} · {lang === "es" ? "desde" : "since"} {o.since}
              </p>
              <p className="font-mono text-[11px] tracking-wider text-[#0d2947]/55 sm:col-span-4 sm:text-right">
                {o.coords}
              </p>
            </div>
          ))}

          <div className="flex items-baseline gap-4 py-8">
            <span className="font-display text-[clamp(3rem,8vw,6rem)] font-bold leading-none text-orange-brand">
              {COMPANY.yearsExperience}+
            </span>
            <span className="sheet-dim max-w-xs text-sm leading-relaxed">
              {lang === "es"
                ? "años de experiencia combinada del equipo entre Ecuador y México."
                : "years of combined team experience across Ecuador and Mexico."}
            </span>
          </div>
        </div>
      </div>

      <span
        className="crop-mark bottom-5 left-5 border-b border-l"
        aria-hidden
      />
      <span
        className="crop-mark bottom-5 right-5 border-b border-r"
        aria-hidden
      />
    </section>
  );
}
