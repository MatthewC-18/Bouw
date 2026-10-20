"use client";

import { ABOUT, COMMITMENTS, COMPANY, OFFICES } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import Tone from "./Tone";

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
    <section id="nosotros" data-tone={265} className="sheet relative">
      <Tone hue={265} />
      <div className="sheet-rule h-px w-full" />
      <div className="relative z-10 mx-auto flex max-w-[1560px] items-center justify-between px-6 py-4 font-mono text-[10px] uppercase tracking-[0.3em] text-plan-ink/50 lg:px-16">
        <span className="ink-chip px-2.5 py-1">BOUW</span>
        <span className="hidden sm:inline">
          {lang === "es" ? "Pliego 05 · Equipo" : "Sheet 05 · Team"}
        </span>
        <span>05 / 05</span>
      </div>
      <div className="sheet-rule h-px w-full" />

      <div className="ledger-columns relative z-10">
        {/*
          Compacta (Matthew, 15 oct 2026: «sigue bajando mucho»): texto y
          sedes a la izquierda, condiciones a la derecha. Antes las sedes iban
          debajo de todo, con un número enorme, y la sección ocupaba pantalla
          y media.
        */}
        <div className="relative mx-auto max-w-[1560px] px-6 py-14 lg:px-16 lg:py-20">
          <div className="relative grid gap-12 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-plan-ink/55">
                05 · {t(ABOUT.eyebrow)}
              </p>
              <h2 className="mt-4 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1]">
                <span data-perch="nosotros" data-perch-corner="right">
                  {t(ABOUT.title)}
                </span>
              </h2>
              <p className="sheet-dim mt-6 max-w-xl text-lg leading-relaxed">
                {t(ABOUT.body)}
              </p>

              {/* Sedes: aire y tamaño, sin filetes por fila */}
              <p className="mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-plan-ink/45">
                {lang === "es" ? "Sedes" : "Offices"}
              </p>
              <p className="sheet-dim mt-2 text-sm leading-relaxed">{t(ABOUT.overlap)}</p>

              <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-3">
                {OFFICES.map((o) => (
                  <div key={o.city}>
                    <h3 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[0.95]">
                      {o.city}
                    </h3>
                    <p className="sheet-dim mt-2 text-base">{t(o.country)}</p>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.2em] text-plan-ink/50">
                      {o.tz} · {lang === "es" ? "desde" : "since"} {o.since}
                    </p>
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-1">
                  <span className="font-display text-[clamp(1.75rem,3vw,2.5rem)] font-bold leading-[0.95] text-plan-ink">
                    {COMPANY.yearsExperience}+
                  </span>
                  <p className="sheet-dim mt-2 text-sm leading-snug">
                    {lang === "es"
                      ? "años de experiencia combinada del equipo entre Ecuador y México."
                      : "years of combined team experience across Ecuador and Mexico."}
                  </p>
                </div>
              </div>
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
            <div className="lg:col-span-5 lg:border-l lg:border-plan-line/25 lg:pl-12">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-plan-ink/45">
                {t(COMMITMENTS.title)}
              </p>
              <dl className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {COMMITMENTS.items.map((c) => (
                  <div key={c.term.es}>
                    <dt className="font-display text-base font-bold">
                      {t(c.term)}
                      <span className="mt-0.5 block font-mono text-[11px] font-normal tracking-wider text-plan-line/80">
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
