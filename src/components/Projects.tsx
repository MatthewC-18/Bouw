"use client";

import Image from "next/image";
import { useRef } from "react";
import { PROJECTS, type Project } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import ProjectVisual from "./ProjectVisual";
import Reveal from "./Reveal";

const ACCENT: Record<
  Project["accent"],
  { text: string; rule: string; glow: string; dot: string }
> = {
  cyan: {
    text: "text-cyan-light",
    rule: "from-cyan-brand",
    glow: "rgba(34,181,207,0.35)",
    dot: "bg-cyan-brand",
  },
  orange: {
    text: "text-orange-light",
    rule: "from-orange-brand",
    glow: "rgba(232,119,34,0.35)",
    dot: "bg-orange-brand",
  },
  navy: {
    text: "text-ink",
    rule: "from-navy-600",
    glow: "rgba(31,84,136,0.45)",
    dot: "bg-navy-600",
  },
  mixed: {
    text: "text-cyan-light",
    rule: "from-cyan-brand",
    glow: "rgba(79,214,232,0.3)",
    dot: "bg-orange-brand",
  },
};

/* ------------------------------------------------------------------ */
/* Panel de medios                                                     */
/* ------------------------------------------------------------------ */

const KIND_LABEL: Record<Project["mediaKind"], string> = {
  screen: "UI",
  photo: "FOTO",
  drawing: "DWG",
};

/**
 * Panel de medios.
 *
 * Las piezas vienen de mundos distintos: una captura de interfaz oscura, una
 * foto de producto sobre fondo claro y dos dibujos técnicos. Para que convivan
 * se les impone el mismo tratamiento:
 *
 * 1. Mismo chasis (barra superior con chip, encuadre, pie técnico).
 * 2. La imagen entra desaturada y bajada de brillo, y recupera su color real
 *    al pasar el mouse. Así una foto blanca no rompe la paleta, y el hover
 *    tiene una recompensa.
 * 3. Las fotos van sobre paspartú oscuro con `contain`; las capturas van a
 *    sangre con `cover`.
 */
function Media({ project }: { project: Project }) {
  const { t, lang } = useLang();
  const accent = ACCENT[project.accent];
  const isPhoto = project.mediaKind === "photo";

  // Tailwind v4 anima `scale` como propiedad propia, no dentro de `transform`:
  // si no se nombra aquí, el zoom salta en seco en vez de acompañar al color.
  const toned =
    "transition-[filter,scale] duration-[900ms] ease-out " +
    "grayscale-[0.65] brightness-[0.8] contrast-[1.1] saturate-[0.85] " +
    "group-hover:grayscale-0 group-hover:brightness-100 group-hover:saturate-100";

  return (
    <div
      data-cursor="view"
      data-cursor-label={lang === "es" ? "Caso" : "Case"}
      className="relative"
    >
      {/* Resplandor: solo cambia de opacidad, no se repinta */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100 lg:-inset-10"
        style={{
          background: `radial-gradient(60% 60% at 50% 50%, ${accent.glow}, transparent 70%)`,
        }}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        {/* Barra superior: el mismo chasis para los cuatro */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-[1px] ${accent.dot}`} />
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white/10" />
          </span>
          <span className="truncate rounded border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-dim">
            {project.mediaChip}
          </span>
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.24em] text-ink-dim/60">
            {KIND_LABEL[project.mediaKind]}
          </span>
        </div>

        <div
          className={`relative aspect-4/3 overflow-hidden ${
            isPhoto ? "bg-navy-900 p-5 sm:p-8" : ""
          }`}
        >
          {/* Trama de fondo: cose los cuatro paneles al mismo sistema */}
          <div className="pointer-events-none absolute inset-0 blueprint-dots opacity-30" />

          {project.image ? (
            <div
              className={`relative h-full w-full overflow-hidden ${
                isPhoto ? "rounded-lg ring-1 ring-white/10" : ""
              }`}
            >
              <Image
                src={project.image}
                alt={project.imageAlt ? t(project.imageAlt) : t(project.title)}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className={`${isPhoto ? "object-contain" : "object-cover"} ${toned} group-hover:scale-[1.04]`}
              />
            </div>
          ) : (
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]">
              <ProjectVisual kind={project.visual ?? "device"} />
            </div>
          )}

          {/* Tinte de marca sobre las fotos: se retira al pasar el mouse.
              Los dibujos técnicos ya nacen en la paleta, no lo necesitan. */}
          {project.image && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-70 transition-opacity duration-700 group-hover:opacity-0"
              style={{
                background:
                  "linear-gradient(160deg, rgba(4,16,31,0.15) 0%, rgba(4,16,31,0.55) 60%, rgba(11,58,82,0.6) 100%)",
              }}
            />
          )}

          {/* Destello que cruza el panel */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-y-8 -left-1/3 w-1/3 -translate-x-full rotate-12 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-[1100ms] ease-out group-hover:translate-x-[420%]"
          />

          {/* Esquinas de encuadre */}
          <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l border-t border-white/25 transition-all duration-500 group-hover:left-3 group-hover:top-3 group-hover:h-9 group-hover:w-9 group-hover:border-cyan-light" />
          <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b border-r border-white/25 transition-all duration-500 group-hover:bottom-3 group-hover:right-3 group-hover:h-9 group-hover:w-9 group-hover:border-orange-light" />
        </div>

        {/* Pie técnico */}
        <div className="flex items-center gap-4 border-t border-white/[0.07] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim">
          <span className={accent.text}>{project.slug}</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className="hidden sm:inline">
            {lang === "es" ? "Pasa el mouse" : "Hover"}
          </span>
          <span>{project.year}</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Fila de proyecto                                                    */
/* ------------------------------------------------------------------ */

function ProjectRow({ project, i }: { project: Project; i: number }) {
  const { t, lang } = useLang();
  const rowRef = useRef<HTMLElement>(null);
  const accent = ACCENT[project.accent];
  const mediaFirst = i % 2 === 1;

  // Se alterna el lado del panel. Las clases van completas, sin concatenar
  // fragmentos, porque Tailwind necesita verlas literales para generarlas.
  const mediaClass = mediaFirst
    ? "lg:col-start-1 lg:col-span-7 lg:row-start-1"
    : "lg:col-start-6 lg:col-span-7 lg:row-start-1";
  const textClass = mediaFirst
    ? "lg:col-start-8 lg:col-span-5 lg:row-start-1"
    : "lg:col-start-1 lg:col-span-5 lg:row-start-1";

  return (
    <article ref={rowRef} className="group relative">
      {/* Numeral fantasma: se sale del contenedor a propósito */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-14 z-10 select-none font-display text-[clamp(6rem,15vw,14rem)] font-bold leading-none text-white/[0.045] transition-colors duration-700 group-hover:text-white/[0.08] ${
          mediaFirst ? "right-0" : "left-0"
        }`}
      >
        {project.index}
      </span>

      <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Medios */}
        <div className={mediaClass}>
          <Media project={project} />
        </div>

        {/* Texto */}
        <div className={textClass}>
          <div className="flex items-center gap-3">
            <span className={`h-1.5 w-1.5 rounded-full ${accent.dot}`} />
            <span
              className={`font-mono text-[11px] uppercase tracking-[0.24em] ${accent.text}`}
            >
              {t(project.category)}
            </span>
            {project.has3D && (
              <span className="rounded-full border border-cyan-brand/40 bg-cyan-brand/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cyan-light">
                3D
              </span>
            )}
          </div>

          <h3 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-[0.98] text-ink">
            <span className="relative inline-block">
              {t(project.title)}
              <span
                className={`absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gradient-to-r ${accent.rule} to-transparent transition-transform duration-700 group-hover:scale-x-100`}
              />
            </span>
          </h3>

          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
            {t(project.client)}
          </p>

          <p className="mt-6 text-lg leading-snug text-ink">
            {t(project.summary)}
          </p>

          <p className="mt-4 leading-relaxed text-ink-dim">
            {t(project.description)}
          </p>

          <div className="mt-6 flex gap-3 border-l-2 border-cyan-brand/60 pl-4">
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-light">
              {lang === "es" ? "Resultado" : "Outcome"}
            </span>
            <p className="text-sm leading-relaxed text-ink">
              {t(project.outcome)}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-6">
            {project.metrics.map((m) => (
              <div key={m.value + t(m.label)}>
                <dt className="font-display text-[1.75rem] font-bold leading-none text-ink transition-colors duration-500 group-hover:text-cyan-light">
                  {m.value}
                </dt>
                <dd className="mt-2 text-[11px] leading-snug text-ink-dim">
                  {t(m.label)}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-ink-dim"
              >
                {tag}
              </li>
            ))}
          </ul>

          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="link"
              className="group/link mt-8 inline-flex items-center gap-3 text-sm font-semibold text-cyan-light"
            >
              <span className="relative">
                {project.href.replace("https://", "")}
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-100 bg-cyan-light transition-transform duration-500 group-hover/link:origin-left group-hover/link:scale-x-0" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/link:translate-x-1"
              >
                ↗
              </span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Sección                                                             */
/* ------------------------------------------------------------------ */

export default function Projects() {
  const { t, lang } = useLang();

  return (
    <section id="proyectos" className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-[1560px] px-6 lg:px-16">
        <Reveal>
          <div className="flex items-end justify-between gap-8 border-b border-white/[0.08] pb-8">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
                {lang === "es" ? "Proyectos" : "Selected work"}
              </span>
              <h2 className="mt-6 max-w-3xl font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[0.94] text-ink">
                {lang === "es" ? (
                  <>
                    Lo que hemos{" "}
                    <span className="text-gradient-brand">construido</span>
                  </>
                ) : (
                  <>
                    What we have{" "}
                    <span className="text-gradient-brand">built</span>
                  </>
                )}
              </h2>
            </div>

            <p className="hidden max-w-xs pb-3 text-sm leading-relaxed text-ink-dim lg:block">
              {t({
                es: "Cuatro proyectos, cuatro industrias. El hilo común: un proceso que antes costaba horas y ahora no.",
                en: "Four projects, four industries. The common thread: a process that used to cost hours and no longer does.",
              })}
            </p>
          </div>
        </Reveal>

        <div className="mt-24 space-y-32 lg:mt-32 lg:space-y-48">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.slug} delay={40}>
              <ProjectRow project={p} i={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
