"use client";

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
 * Ojo con el dragón: cada `article` de la sección es una etapa de la escena
 * (`stageAnchors` en `SceneRoot`, cuatro como máximo, y el encabezado ocupa
 * la que falte). Ahora son tres: la vitrina, Lean y cumplimiento.
 */

export default function Projects() {
  const { t, lang } = useLang();

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

        {/*
          Los servicios con su tablero, después de la vitrina. Conservan el
          lado alterno que tenían (`i` impar: el video a la izquierda).
        */}
        <div className="mt-24 space-y-24 lg:mt-32 lg:space-y-32">
          <ServiceRow service={LEAN} i={1} />
          <ServiceRow service={COMPLIANCE} i={2} />
        </div>
      </div>
    </section>
  );
}
