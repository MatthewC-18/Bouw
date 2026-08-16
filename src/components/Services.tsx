"use client";

import { SERVICES, SERVICES_INTRO } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import Reveal from "./Reveal";

const ICONS: Record<string, React.ReactNode> = {
  procesos: (
    <>
      <path d="M4 18h6l3-12h7" />
      <path d="M17 3l3 3-3 3" />
      <circle cx="4" cy="18" r="1.6" />
    </>
  ),
  calidad: (
    <>
      <path d="M12 3l7.5 3.4v5.2c0 4.4-3.1 8.4-7.5 9.4C7.6 20 4.5 16 4.5 11.6V6.4z" />
      <path d="M9 12l2.2 2.2L15.5 10" />
    </>
  ),
  automatizacion: (
    <>
      <rect x="4" y="8" width="16" height="11" rx="3" />
      <path d="M12 4v4M8.5 13h.01M15.5 13h.01M9.5 16.5h5" />
    </>
  ),
  producto: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" />
    </>
  ),
};

export default function Services() {
  const { t } = useLang();

  return (
    <section
      id="servicios"
      className="relative border-y border-white/[0.06] bg-navy-900/55 py-28 lg:py-40"
    >
      <div className="pointer-events-none absolute inset-0 grid-lines opacity-25" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <Reveal className="lg:sticky lg:top-32 lg:self-start">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-light">
              {t(SERVICES_INTRO.eyebrow)}
            </p>
            <h2 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.25rem)] font-bold leading-[1.06] text-ink">
              {t(SERVICES_INTRO.title)}
            </h2>
            <p className="mt-6 max-w-md leading-relaxed text-ink-dim">
              {t(SERVICES_INTRO.subtitle)}
            </p>

            <a
              href="#contacto"
              data-cursor="link"
              className="mt-9 inline-flex items-center gap-3 rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-orange-brand hover:text-orange-light"
            >
              {t({ es: "Cotizar un proyecto", en: "Request a quote" })}
              <span aria-hidden>→</span>
            </a>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2">
            {SERVICES.map((s, i) => (
              <Reveal key={s.id} delay={i * 80}>
                <div className="group h-full rounded-2xl border border-white/10 bg-navy-950/85 p-7 transition-all duration-500 hover:-translate-y-1 hover:border-cyan-brand/40 hover:bg-navy-950">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-brand/30 bg-cyan-brand/10 text-cyan-light transition-colors duration-500 group-hover:border-orange-brand/50 group-hover:bg-orange-brand/10 group-hover:text-orange-light">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {ICONS[s.id]}
                    </svg>
                  </span>

                  <h3 className="mt-6 font-display text-xl font-bold text-ink">
                    {t(s.title)}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-ink-dim">
                    {t(s.description)}
                  </p>

                  <ul className="mt-5 space-y-2 border-t border-white/[0.07] pt-5">
                    {s.bullets.map((b, bi) => (
                      <li
                        key={bi}
                        className="flex gap-2.5 text-sm text-ink-dim"
                      >
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-cyan-brand" />
                        {t(b)}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
