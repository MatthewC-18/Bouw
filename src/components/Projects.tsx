"use client";

import { useRef } from "react";
import { PROJECTS, type Project } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import ProjectVisual from "./ProjectVisual";
import Reveal from "./Reveal";

const ACCENT: Record<Project["accent"], { ring: string; glow: string; text: string }> = {
  cyan: {
    ring: "group-hover:border-cyan-brand/60",
    glow: "rgba(34,181,207,0.22)",
    text: "text-cyan-light",
  },
  orange: {
    ring: "group-hover:border-orange-brand/60",
    glow: "rgba(232,119,34,0.22)",
    text: "text-orange-light",
  },
  navy: {
    ring: "group-hover:border-navy-600/80",
    glow: "rgba(31,84,136,0.32)",
    text: "text-ink",
  },
  mixed: {
    ring: "group-hover:border-orange-brand/50",
    glow: "rgba(79,214,232,0.2)",
    text: "text-cyan-light",
  },
};

function ProjectCard({ project, i }: { project: Project; i: number }) {
  const { t, lang } = useLang();
  const cardRef = useRef<HTMLElement>(null);
  const accent = ACCENT[project.accent];

  // Inclinación 3D siguiendo el mouse (solo transform, sin re-render).
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1400px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const onLeave = () => {
    const el = cardRef.current;
    if (el) el.style.transform = "perspective(1400px)";
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-cursor="view"
      data-cursor-label={lang === "es" ? "Ver" : "View"}
      className={`
        group relative isolate overflow-hidden rounded-3xl border border-white/10
        bg-navy-900/70 backdrop-blur-xl
        transition-[border-color,box-shadow] duration-500 ${accent.ring}
        hover:shadow-[0_40px_120px_-40px_rgba(34,181,207,0.45)]
      `}
      style={{ transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {/* Halo que sigue al cursor */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(440px circle at var(--mx, 50%) var(--my, 50%), ${accent.glow}, transparent 70%)`,
        }}
      />

      <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
        {/* Texto */}
        <div>
          <div className="flex items-center gap-4">
            <span className="font-mono text-xs tracking-[0.3em] text-ink-dim">
              {project.index}
            </span>
            <span className="h-px flex-1 max-w-16 bg-white/15" />
            <span className={`font-mono text-[11px] uppercase tracking-[0.22em] ${accent.text}`}>
              {t(project.category)}
            </span>
            {project.has3D && (
              <span className="rounded-full border border-cyan-brand/40 bg-cyan-brand/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan-light">
                3D
              </span>
            )}
          </div>

          <h3 className="mt-6 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {t(project.title)}
          </h3>

          <p className="mt-3 text-lg text-ink">{t(project.summary)}</p>

          <p className="mt-4 max-w-lg leading-relaxed text-ink-dim">
            {t(project.description)}
          </p>

          <ul className="mt-7 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-ink-dim"
              >
                {tag}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim">
            <span>{project.year}</span>
            {project.href && (
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer noopener"
                data-cursor="link"
                className="inline-flex items-center gap-1.5 text-cyan-light transition-colors hover:text-ink"
              >
                {lang === "es" ? "Visitar" : "Visit"}
                <span aria-hidden>↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Visual */}
        <div
          className="relative aspect-4/3 overflow-hidden rounded-2xl border border-white/10 bg-navy-950/80"
          style={{ transform: "translateZ(40px)" }}
        >
          <div className="absolute inset-0 grid-lines opacity-30" />
          <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
            <ProjectVisual slug={project.slug} />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-navy-950 to-transparent" />
          <span className="absolute bottom-4 left-5 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
            {String(i + 1).padStart(2, "0")} / {String(PROJECTS.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  const { t, lang } = useLang();

  return (
    <section id="proyectos" className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
            {lang === "es" ? "Proyectos" : "Selected work"}
          </p>
          <h2 className="mt-5 max-w-2xl font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] text-ink">
            {lang === "es" ? (
              <>
                Lo que hemos <span className="text-gradient-brand">construido</span>
              </>
            ) : (
              <>
                What we have <span className="text-gradient-brand">built</span>
              </>
            )}
          </h2>
          <p className="mt-5 max-w-xl text-ink-dim">
            {t({
              es: "Cuatro proyectos, cuatro industrias. El hilo común: un proceso que antes costaba horas y ahora no.",
              en: "Four projects, four industries. The common thread: a process that used to cost hours and no longer does.",
            })}
          </p>
        </Reveal>

        {/* Mazo de tarjetas: se apilan al hacer scroll */}
        <div className="mt-16 space-y-6 lg:mt-24 lg:space-y-8">
          {PROJECTS.map((p, i) => (
            <div
              key={p.slug}
              className="lg:sticky"
              style={{ top: `calc(7rem + ${i * 1.25}rem)`, zIndex: 10 + i }}
            >
              <Reveal delay={i * 60}>
                <ProjectCard project={p} i={i} />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
