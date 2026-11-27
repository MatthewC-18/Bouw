"use client";

import { useState } from "react";
import { COMPLIANCE, LEAN } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import ProjectShowcase from "./ProjectShowcase";
import Reveal from "./Reveal";
import ServiceRow from "./services/ServiceRow";

/*
 * Proyectos: la vitrina y, debajo, los dos servicios con su tablero.
 *
 * Hasta el 25 nov 2026 cada proyecto era una fila de casi una pantalla y se
 * alternaba con los servicios; con dos proyectos más la sección iba a pasar
 * de seis pantallas. Los proyectos están ahora en una sola vitrina
 * (`ProjectShowcase`); el panel de cada uno vive en `ProjectMedia`. Los
 * servicios siguen igual, con su chasis (`Stage`) y sus colores (`.project`
 * en `globals.css`).
 *
 * Los servicios, uno a la vez (26 nov 2026, Matthew: «pon el selector en
 * servicios»): Lean y cumplimiento BPM medían 2,7 pantallas uno debajo del
 * otro. Con el selector se ve uno y el otro está a un toque.
 *
 * Ojo con el dragón: cada `article` de la sección es una etapa de la escena
 * (`stageAnchors` en `SceneRoot`, cuatro justas, y el encabezado ocupa la que
 * falte). Con un servicio a la vista solo quedaban tres; el selector cuenta
 * como fila (`data-stage-row`): encabezado, vitrina, selector y servicio.
 * Con una menos, la etapa se queda en 0 en toda la página y el dragón no sale
 * de la portada, sin ningún error.
 */

const SERVICES = [LEAN, COMPLIANCE];

export default function Projects() {
  const { t, lang } = useLang();
  const [svc, setSvc] = useState(0);
  const service = SERVICES[svc];

  return (
    /*
      Con velo: separa la sección del fondo. `relative` en el contenedor no es
      decorativo: el velo es un `::before` posicionado y un hijo sin
      posicionar quedaría debajo de él.
    */
    <section id="proyectos" className="veil relative py-24 lg:py-28">
      <div className="relative mx-auto max-w-[1560px] px-6 lg:px-16">
        <Reveal>
          {/* Ancla de etapa: ver `stageAnchors` en `SceneRoot` */}
          <div
            data-stage-anchor
            className="flex items-end justify-between gap-8 border-b border-white/[0.08] pb-8"
          >
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
                {lang === "es" ? "Proyectos" : "Selected work"}
              </span>
              <h2 className="mt-6 max-w-3xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.94] text-ink">
                {lang === "es" ? (
                  <>
                    Lo que hemos{" "}
                    <span className="text-accent">construido</span>
                  </>
                ) : (
                  <>
                    What we have{" "}
                    <span className="text-accent">built</span>
                  </>
                )}
              </h2>
            </div>

            <p className="hidden max-w-xs pb-3 text-sm leading-relaxed text-ink-dim lg:block">
              {t({
                es: "Lo que tienen en común: procesos que antes costaban horas.",
                en: "What they have in common: processes that used to cost hours.",
              })}
            </p>
          </div>
        </Reveal>

        <div className="mt-12 lg:mt-16">
          <ProjectShowcase />
        </div>

        {/* Los servicios con su tablero, uno a la vez */}
        <div className="mt-24 lg:mt-32">
          <div
            data-stage-row
            className="flex flex-col gap-4 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
              {lang === "es" ? "Servicios funcionando" : "Services at work"}
            </span>
            <div
              role="tablist"
              aria-label={lang === "es" ? "Servicios" : "Services"}
              className="inline-flex w-full rounded-full border border-ink-dim/25 p-1 sm:w-auto"
            >
              {SERVICES.map((s, i) => {
                const on = i === svc;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    id={`servicio-tab-${s.id}`}
                    aria-selected={on}
                    aria-controls="servicio-panel"
                    onClick={() => setSvc(i)}
                    data-cursor="link"
                    className={`flex-1 rounded-full px-4 py-2.5 text-[13px] font-semibold leading-tight transition-colors duration-300 sm:flex-none sm:px-5 ${
                      on ? "bg-cyan-brand text-navy-950" : "text-ink-soft hover:text-ink"
                    }`}
                  >
                    {t(s.badge)}
                  </button>
                );
              })}
            </div>
          </div>

          <div id="servicio-panel" role="tabpanel" aria-labelledby={`servicio-tab-${service.id}`} className="mt-12 lg:mt-16">
            {/* El mismo lado para los dos: cambiar no hace saltar la fila */}
            <ServiceRow key={service.id} service={service} i={1} />
          </div>
        </div>
      </div>
    </section>
  );
}
