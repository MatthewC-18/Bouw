"use client";

import Image from "next/image";
import { useRef } from "react";
import { PROJECTS, type Project } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import ProjectVisual from "./ProjectVisual";
import Reveal from "./Reveal";

const ACCENT: Record<
  Project["accent"],
  { border: string; glow: string; text: string; rule: string }
> = {
  cyan: {
    border: "group-hover:border-cyan-brand/60",
    glow: "rgba(34,181,207,0.20)",
    text: "text-cyan-light",
    rule: "from-cyan-brand",
  },
  orange: {
    border: "group-hover:border-orange-brand/60",
    glow: "rgba(232,119,34,0.20)",
    text: "text-orange-light",
    rule: "from-orange-brand",
  },
  navy: {
    border: "group-hover:border-navy-600",
    glow: "rgba(31,84,136,0.30)",
    text: "text-ink",
    rule: "from-navy-600",
  },
  mixed: {
    border: "group-hover:border-orange-brand/50",
    glow: "rgba(79,214,232,0.18)",
    text: "text-cyan-light",
    rule: "from-cyan-brand",
  },
};

function ProjectCard({ project }: { project: Project }) {
  const { t, lang } = useLang();
  const cardRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const pending = useRef({ x: 0, y: 0, w: 1, h: 1 });
  const accent = ACCENT[project.accent];

  /**
   * Inclinación y halo siguiendo el mouse.
   *
   * Todo se resuelve con `transform` y se agrupa en un rAF: mover el mouse no
   * debe repintar la tarjeta entera, que es lo que hacía que se sintiera lenta.
   */
  const onMove = (e: React.MouseEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pending.current = {
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      w: r.width,
      h: r.height,
    };

    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      const { x, y, w, h } = pending.current;
      const px = x / w - 0.5;
      const py = y / h - 0.5;
      el.style.transform = `perspective(1600px) rotateX(${(-py * 2.4).toFixed(2)}deg) rotateY(${(px * 3.2).toFixed(2)}deg)`;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${x - 240}px, ${y - 240}px, 0)`;
      }
    });
  };

  const onLeave = () => {
    if (frame.current) {
      window.cancelAnimationFrame(frame.current);
      frame.current = 0;
    }
    const el = cardRef.current;
    if (el) el.style.transform = "perspective(1600px)";
  };

  return (
    <article
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`
        group relative isolate overflow-hidden rounded-3xl border border-white/10
        bg-navy-900/90
        transition-[border-color,box-shadow] duration-500 ${accent.border}
        hover:shadow-[0_50px_140px_-50px_rgba(34,181,207,0.5)]
      `}
    >
      {/* Halo: se mueve con transform, nunca se repinta */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-0 top-0 -z-10 h-[480px] w-[480px] rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle closest-side, ${accent.glow}, transparent)`,
        }}
      />

      {/* Cabecera técnica */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/[0.07] px-7 py-4 sm:px-10">
        <span className="font-mono text-xs tracking-[0.3em] text-ink-dim">
          {project.index}
        </span>
        <span className={`h-px w-10 bg-gradient-to-r ${accent.rule} to-transparent`} />
        <span className={`font-mono text-[11px] uppercase tracking-[0.22em] ${accent.text}`}>
          {t(project.category)}
        </span>
        <span className="ml-auto flex items-center gap-3">
          {project.has3D && (
            <span className="rounded-full border border-cyan-brand/40 bg-cyan-brand/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-cyan-light">
              3D
            </span>
          )}
          <span className="font-mono text-[11px] text-ink-dim">{project.year}</span>
        </span>
      </div>

      <div className="grid gap-8 p-7 sm:p-10 lg:grid-cols-[1fr_0.92fr] lg:items-start lg:gap-12">
        {/* Texto */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
            {t(project.client)}
          </p>

          <h3 className="mt-3 font-display text-3xl font-bold leading-[1.05] text-ink sm:text-[2.6rem]">
            {t(project.title)}
          </h3>

          <p className="mt-4 text-lg leading-snug text-ink">
            {t(project.summary)}
          </p>

          <p className="mt-4 max-w-lg leading-relaxed text-ink-dim">
            {t(project.description)}
          </p>

          {/* Resultado */}
          <div className="mt-6 flex gap-3 rounded-xl border-l-2 border-cyan-brand/60 bg-cyan-brand/[0.05] px-4 py-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-light">
              {lang === "es" ? "Resultado" : "Outcome"}
            </span>
            <p className="text-sm leading-relaxed text-ink">
              {t(project.outcome)}
            </p>
          </div>

          {/* Cifras */}
          <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-white/[0.07] pt-6">
            {project.metrics.map((m) => (
              <div key={m.value + t(m.label)}>
                <dt className="font-display text-2xl font-bold text-ink">
                  {m.value}
                </dt>
                <dd className="mt-1 text-[11px] leading-snug text-ink-dim">
                  {t(m.label)}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-6 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-ink-dim"
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
              className="mt-7 inline-flex items-center gap-2 rounded-full border border-cyan-brand/50 px-5 py-2.5 text-sm font-semibold text-cyan-light transition-colors hover:bg-cyan-brand/10"
            >
              {project.href.replace("https://", "")}
              <span aria-hidden>↗</span>
            </a>
          )}
        </div>

        {/* Visual */}
        <div
          data-cursor={project.image ? "view" : undefined}
          data-cursor-label={project.image ? (lang === "es" ? "Ver" : "View") : undefined}
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950/85"
        >
          <div className="relative aspect-16/10">
            {project.image ? (
              <Image
                src={project.image}
                alt={project.imageAlt ? t(project.imageAlt) : t(project.title)}
                fill
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
            ) : (
              <>
                <div className="absolute inset-0 grid-lines opacity-30" />
                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.04]">
                  <ProjectVisual kind={project.visual ?? "device"} />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim">
            <span>{project.slug}</span>
            <span>{project.image ? "IMG" : "DWG"}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Projects() {
  const { t, lang } = useLang();

  return (
    <section id="proyectos" className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
              {lang === "es" ? "Proyectos" : "Selected work"}
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-cyan-brand/50 to-transparent" />
            <span className="font-mono text-[11px] text-ink-dim">
              {String(PROJECTS.length).padStart(2, "0")}
            </span>
          </div>

          <h2 className="mt-8 max-w-3xl font-display text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1] text-ink">
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
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-dim">
            {t({
              es: "Cuatro proyectos, cuatro industrias. El hilo común: un proceso que antes costaba horas y ahora no.",
              en: "Four projects, four industries. The common thread: a process that used to cost hours and no longer does.",
            })}
          </p>
        </Reveal>

        {/* Mazo de tarjetas: se apilan al hacer scroll */}
        <div className="mt-16 space-y-6 lg:mt-24 lg:space-y-10">
          {PROJECTS.map((p, i) => (
            <div
              key={p.slug}
              className="lg:sticky"
              style={{ top: `calc(6.5rem + ${i * 1.1}rem)`, zIndex: 10 + i }}
            >
              <Reveal delay={i * 60}>
                <ProjectCard project={p} />
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
