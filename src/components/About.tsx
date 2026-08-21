"use client";

import { ABOUT, COMMITMENTS, COMPANY, OFFICES } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";

/**
 * Nosotros — segundo pliego del dossier.
 *
 * Misma retícula y mismo monocromo que Proceso: tinta clara en tres
 * intensidades sobre plano navy. Las sedes se separan por aire y por tamaño
 * de letra, no por filetes: es una ficha de empresa, no un panel de app.
 */
export default function About() {
  const { t, lang } = useLang();

  return (
    <section id="nosotros" className="sheet relative">
      <div className="sheet-rule h-px w-full" />
      <div className="relative z-10 mx-auto flex max-w-[1560px] items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-plan-ink/50 lg:px-16">
        <span className="ink-chip px-2.5 py-1">BOUW</span>
        <span className="hidden sm:inline">
          {lang === "es" ? "Pliego 05 — Equipo" : "Sheet 05 — Team"}
        </span>
        <span>05 / 05</span>
      </div>
      <div className="sheet-rule h-px w-full" />

      <div className="ledger-columns relative z-10">
        <div className="relative mx-auto max-w-[1560px] px-6 py-20 lg:px-16 lg:py-28">
          {/* Marca de agua del pliego: sobre fondo oscuro tiene que aclarar, no
              oscurecer, o el logo se traga a sí mismo */}
          <LogoMark className="pointer-events-none absolute -top-6 right-4 h-64 w-auto opacity-[0.10] mix-blend-screen lg:right-16 lg:h-80" />

          <div className="relative grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-2">
              <span className="font-display text-[clamp(3rem,7vw,6rem)] font-bold leading-none text-plan-ink/14">
                05
              </span>
            </div>

            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-plan-ink/55">
                {t(ABOUT.eyebrow)}
              </p>
              <h2 className="mt-5 font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[0.98]">
                {t(ABOUT.title)}
              </h2>
              <p className="sheet-dim mt-8 max-w-xl text-lg leading-relaxed">
                {t(ABOUT.body)}
              </p>
            </div>

            {/*
              Aquí estaban las tres virtudes —"medimos antes de opinar",
              "entregamos funcionando", "tu tiempo es el KPI"—. Ninguna
              empresa afirma lo contrario, así que ninguna distinguía.

              En su sitio van las condiciones de trabajo con sus plazos, que
              es lo único que se puede reclamar después. Vienen de los cuatro
              pasos que ocupaban el pliego anterior: la información se queda,
              el recorrido ilustrado se va.
            */}
            <div className="lg:col-span-3 lg:pt-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-plan-ink/45">
                {t(COMMITMENTS.title)}
              </p>
              <dl className="mt-7 space-y-7">
                {COMMITMENTS.items.map((c) => (
                  <div key={c.term.es}>
                    <dt className="flex items-baseline justify-between gap-3 font-display text-base font-bold">
                      {t(c.term)}
                      <span className="shrink-0 font-mono text-[11px] font-normal tracking-wider text-plan-line/80">
                        {t(c.spec)}
                      </span>
                    </dt>
                    <dd className="sheet-dim mt-1.5 text-sm leading-relaxed">
                      {t(c.body)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Sedes: aire y tamaño, sin filetes por fila */}
          <div className="mt-24 lg:mt-32">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-plan-ink/45">
              {lang === "es" ? "Sedes" : "Offices"}
            </p>

            <div className="mt-8 grid gap-14 sm:grid-cols-2">
              {OFFICES.map((o) => (
                <div key={o.city}>
                  <h3 className="font-display text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[0.9]">
                    {o.city}
                  </h3>
                  <p className="sheet-dim mt-3 text-base">{t(o.country)}</p>
                  <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.2em] text-plan-ink/50">
                    {o.tz} · {lang === "es" ? "desde" : "since"} {o.since}
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] tracking-wider text-plan-ink/50">
                    {o.coords}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-20 flex items-baseline gap-5">
              <span className="font-display text-[clamp(3.5rem,9vw,7rem)] font-bold leading-[0.8] text-plan-ink">
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
