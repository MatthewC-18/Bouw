"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  CASES,
  pickAsset,
  type CasePhoto,
  type CaseStudy as Case,
} from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LoopVideo from "./LoopVideo";
import ProjectVisual from "./ProjectVisual";
import Reveal from "./Reveal";

/**
 * Página de caso.
 *
 * La ficha de la lista vende el proyecto en diez segundos; esto es para quien
 * se quedó con ganas de comprobarlo. El orden es el del trabajo: el piso
 * grabado, lo que cambió en números, el caso en un párrafo, dónde estaba el
 * desperdicio, las cinco fases de DMAIC con la foto que prueba cada una, la
 * galería entera y, al final, el mismo método aplicado a una oficina.
 *
 * Sin escena 3D detrás: aquí lo que se mira son las fotos y los videos, y un
 * dragón volando por encima de una foto de planta compite con ella.
 */

/* ------------------------------------------------------------------ */
/* Piezas pequeñas                                                     */
/* ------------------------------------------------------------------ */

function Eyebrow({ children, dot = "bg-cyan-brand" }: { children: ReactNode; dot?: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {children}
    </p>
  );
}

/** Resalta lo que va entre `**`: es marcador de imprenta, no negrita. */
function Marked({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <strong
            key={i}
            className="font-medium text-ink [box-decoration-break:clone] [background:linear-gradient(transparent_62%,rgba(232,119,34,0.26)_62%,rgba(232,119,34,0.26)_92%,transparent_92%)]"
          >
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/**
 * Se dispara una vez, la primera vez que el elemento entra en pantalla.
 * Con movimiento reducido, ya llega disparado.
 */
function useSeen<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, seen] as const;
}

/** Cuenta hasta la cifra al entrar en pantalla. La cifra final va en el HTML. */
function CountUp({ to }: { to: number }) {
  const [ref, seen] = useSeen<HTMLSpanElement>();
  const [value, setValue] = useState(to);

  useEffect(() => {
    if (!seen) return;
    // Con movimiento reducido la cifra ya está escrita: no se cuenta
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const start = performance.now();
    const run = (now: number) => {
      const k = Math.min((now - start) / 1400, 1);
      setValue(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(run);
    };
    setValue(0);
    raf = requestAnimationFrame(run);
    return () => cancelAnimationFrame(raf);
  }, [seen, to]);

  return <span ref={ref}>{value}</span>;
}

/**
 * Barras de índice, antes = 100.
 *
 * El proyecto da porcentajes, no minutos. Dibujar minutos sería inventarlos;
 * un índice dice exactamente lo que se sabe y nada más, y lo dice en el pie.
 */
function IndexBars({ cut }: { cut: number }) {
  const { lang } = useLang();
  const [ref, seen] = useSeen<HTMLDivElement>();
  const after = 100 - cut;

  const rows = [
    { label: lang === "es" ? "Antes" : "Before", value: 100, cls: "bg-white/25" },
    { label: lang === "es" ? "Después" : "After", value: after, cls: "bg-cyan-brand" },
  ];

  return (
    <div ref={ref} className="mt-8 space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-3">
          <span className="w-16 shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
            {r.label}
          </span>
          <span className="relative h-2 flex-1 overflow-hidden bg-white/[0.06]">
            <span
              className={`absolute inset-y-0 left-0 ${r.cls} transition-[width] duration-[1400ms] ease-out motion-reduce:transition-none`}
              style={{
                width: seen ? `${r.value}%` : "0%",
                transitionDelay: `${i * 180}ms`,
              }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink-soft">
            {r.value}
          </span>
        </div>
      ))}
      <p className="pt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-dim/70">
        {lang === "es" ? "Índice · antes = 100" : "Index · before = 100"}
      </p>
    </div>
  );
}

/** El mismo chasis que los paneles de la lista de proyectos. */
function Chassis({
  chip,
  kind,
  children,
  footer,
}: {
  chip: string;
  kind: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.95)]">
      <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-1.5 w-1.5 rounded-[1px] bg-orange-brand" />
          <span className="h-1.5 w-1.5 rounded-[1px] bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-[1px] bg-white/10" />
        </span>
        <span className="truncate rounded border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-dim">
          {chip}
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.24em] text-ink-dim/70">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-brand" />
          {kind}
        </span>
      </div>
      {children}
      {footer && (
        <div className="flex items-center gap-4 border-t border-white/[0.07] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
          {footer}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Secciones                                                           */
/* ------------------------------------------------------------------ */

function Hero({ c }: { c: Case }) {
  const { t, lang } = useLang();
  const setup = c.results[0];
  const rework = c.results[1];

  return (
    <section className="relative overflow-hidden pb-20 pt-32 lg:pb-28 lg:pt-40">
      <div className="mx-auto grid max-w-[1400px] items-center gap-16 px-6 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-7">
          <Reveal>
            <a
              href="/#proyectos"
              data-cursor="link"
              className="group/back inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim transition-colors hover:text-cyan-light"
            >
              <span aria-hidden className="transition-transform duration-500 group-hover/back:-translate-x-1">
                ←
              </span>
              {lang === "es" ? "Todos los proyectos" : "All projects"}
            </a>
          </Reveal>

          <Reveal delay={80} className="mt-10">
            <Eyebrow dot="bg-orange-brand">{t(c.eyebrow)}</Eyebrow>
          </Reveal>

          <Reveal delay={140}>
            <h1 className="mt-6 font-display text-[clamp(2.4rem,4.9vw,4.4rem)] font-bold leading-[0.98] text-ink">
              {t(c.title.lead)}{" "}
              <span className="text-accent">{t(c.title.accent)}</span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
              {t(c.lede)}
            </p>
          </Reveal>

          <Reveal delay={260}>
            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] sm:grid-cols-4">
              {c.facts.map((f) => (
                <div key={t(f.label)} className="bg-navy-950/90 px-5 py-4">
                  <dt className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim">
                    {t(f.label)}
                  </dt>
                  <dd className="mt-2 font-display text-[1.05rem] font-bold leading-tight text-ink">
                    {t(f.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={200} className="lg:col-span-5">
          <div className="relative mx-auto w-full max-w-[380px]">
            {/* Marcas de encuadre: la toma, no una tarjeta */}
            <span className="pointer-events-none absolute -left-5 -top-5 h-10 w-10 border-l border-t border-cyan-light/50" />
            <span className="pointer-events-none absolute -bottom-5 -right-5 h-10 w-10 border-b border-r border-orange-light/60" />

            <Chassis
              chip={c.film.chip}
              kind="REC"
              footer={
                <>
                  <span className="text-orange-light">{lang === "es" ? "Planta" : "Plant"}</span>
                  <span className="h-px flex-1 bg-white/10" />
                  <span>{lang === "es" ? "Sin audio" : "Muted"}</span>
                </>
              }
            >
              <div className="relative aspect-[9/16] bg-navy-900">
                <LoopVideo
                  src={c.film.src}
                  poster={c.film.poster}
                  label={t(c.film.caption)}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,16,31,0.9)] via-[rgba(4,16,31,0.35)] to-transparent px-4 pb-4 pt-16">
                  <p className="text-[13px] leading-snug text-[#e8eef6]">{t(c.film.caption)}</p>
                </div>
              </div>
            </Chassis>

            {/*
              Las dos cifras que importan, encima de la toma. En pantalla ancha
              se salen del marco hacia el titular, que es donde las va a cruzar
              la vista al pasar del texto al video.
            */}
            {[setup, rework].map((r, i) => (
              <div
                key={t(r.label)}
                className={`absolute hidden border border-white/10 bg-navy-950/90 px-4 py-3 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md lg:block ${
                  i === 0 ? "-left-24 top-[22%]" : "-left-14 top-[48%]"
                }`}
              >
                <p className="font-display text-3xl font-bold leading-none text-ink">
                  <span className="text-orange-brand">{r.sign}</span>
                  {r.value}
                  {r.unit}
                </p>
                <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.22em] text-ink-dim">
                  {t(r.label)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Results({ c }: { c: Case }) {
  const { t, lang } = useLang();

  return (
    <section className="relative border-y border-white/[0.06] bg-navy-950/80 py-20 lg:py-28">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>{lang === "es" ? "Resultados" : "Results"}</Eyebrow>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1] text-ink">
                {lang === "es" ? "Medido antes y después" : "Measured before and after"}
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-dim">
              {lang === "es"
                ? "Mismos indicadores, mismo criterio, en los dos turnos. Si no se midió igual antes y después, no se cuenta como mejora."
                : "Same indicators, same criteria, on both shifts. If it wasn't measured the same way before and after, it doesn't count as improvement."}
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden border border-white/[0.07] bg-white/[0.07] lg:grid-cols-3">
          {c.results.map((r, i) => (
            <Reveal key={t(r.label)} delay={i * 90} className="bg-navy-950 p-8 lg:p-10">
              <p className="font-display text-[clamp(3.6rem,7vw,6rem)] font-bold leading-none tracking-tight text-ink">
                <span className="text-orange-brand">{r.sign}</span>
                <CountUp to={r.value} />
                <span className="text-[0.55em] text-ink-soft">{r.unit}</span>
              </p>
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.24em] text-cyan-light">
                {t(r.label)}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{t(r.detail)}</p>
              {r.index ? (
                <IndexBars cut={r.value} />
              ) : (
                <ul className="mt-8 grid grid-cols-4 gap-2" aria-hidden>
                  {Array.from({ length: r.value }, (_, k) => (
                    <li
                      key={k}
                      className="border border-cyan-brand/35 bg-cyan-brand/[0.06] px-2 py-3 text-center font-mono text-[10px] tracking-[0.18em] text-cyan-light"
                    >
                      OP·{String(k + 1).padStart(2, "0")}
                    </li>
                  ))}
                </ul>
              )}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Summary({ c }: { c: Case }) {
  const { t } = useLang();

  return (
    <section className="relative py-24 lg:py-36">
      <div className="mx-auto grid max-w-[1400px] gap-10 px-6 lg:grid-cols-12 lg:px-16">
        <Reveal className="lg:col-span-4">
          <Eyebrow>{t(c.summary.title)}</Eyebrow>
          <p aria-hidden className="mt-6 hidden font-display text-[9rem] font-bold leading-[0.7] text-white/[0.06] lg:block">
            “
          </p>
        </Reveal>
        <Reveal delay={80} className="lg:col-span-8">
          <p className="text-[clamp(1.3rem,2.3vw,1.9rem)] leading-[1.5] text-ink-soft">
            <Marked text={t(c.summary.body)} />
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Wastes({ c }: { c: Case }) {
  const { t, lang } = useLang();

  return (
    <section className="relative pb-24 lg:pb-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
        <Reveal>
          <Eyebrow dot="bg-orange-brand">Lean · muda</Eyebrow>
          <h2 className="mt-5 max-w-3xl font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1] text-ink">
            {lang === "es" ? "Dónde estaba el desperdicio" : "Where the waste was"}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {c.wastes.map((w, i) => (
            <Reveal
              key={t(w.name)}
              delay={i * 90}
              className="group relative border border-white/[0.08] bg-navy-950/70 p-8 transition-colors duration-500 hover:border-orange-brand/50"
            >
              <span className="font-mono text-[11px] tracking-[0.3em] text-ink-dim">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 font-display text-[1.9rem] font-bold leading-none text-ink">
                {t(w.name)}
              </h3>
              <p className="mt-4 text-[15px] leading-relaxed text-ink-soft">{t(w.body)}</p>
              <span className="mt-7 inline-block border border-orange-brand/50 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-orange-light">
                {t(w.tag)}
              </span>
              <span className="pointer-events-none absolute right-0 top-0 h-8 w-8 border-r border-t border-white/20 transition-colors duration-500 group-hover:border-orange-light" />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Dmaic({ c }: { c: Case }) {
  const { t, lang } = useLang();

  return (
    <section className="relative border-t border-white/[0.06] bg-navy-950/60 py-24 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>Six Sigma · DMAIC</Eyebrow>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1] text-ink">
                {lang === "es" ? "Cómo se trabajó" : "How it was done"}
              </h2>
            </div>
            <p className="self-end text-[15px] leading-relaxed text-ink-dim lg:col-span-5">
              {lang === "es"
                ? "Definir, medir, analizar, mejorar y controlar: el ciclo de Six Sigma, con las herramientas de Lean dentro de cada fase. Cada una con lo que se hizo y, cuando la hay, la foto que lo prueba."
                : "Define, measure, analyze, improve and control: the Six Sigma cycle, with Lean tools inside each phase. Each one with what was done and, where there is one, the photo that proves it."}
            </p>
          </div>
        </Reveal>

        {/* La barra de fases: se lee de un vistazo antes de entrar al detalle */}
        <Reveal delay={60}>
          <ol className="mt-14 grid grid-cols-5 border border-white/[0.08]">
            {c.dmaic.map((d, i) => (
              <li
                key={d.key}
                className={`flex flex-col items-center gap-1 py-4 ${i > 0 ? "border-l border-white/[0.08]" : ""}`}
              >
                <span className="font-display text-2xl font-bold text-ink sm:text-3xl">{d.key}</span>
                <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim sm:block">
                  {t(d.name)}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="relative mt-16 space-y-16 lg:space-y-24">
          {/* Hilo que cose las cinco fases */}
          <span
            aria-hidden
            className="absolute bottom-6 left-[1.6rem] top-6 w-px bg-gradient-to-b from-cyan-brand/60 via-white/10 to-orange-brand/60 lg:left-[3.2rem]"
          />

          {c.dmaic.map((d, i) => (
            <Reveal key={d.key} delay={40}>
              <article className="relative grid gap-8 lg:grid-cols-12 lg:gap-12">
                <div className="flex items-start gap-6 lg:col-span-7">
                  <span
                    className="relative z-10 flex h-[3.3rem] w-[3.3rem] shrink-0 items-center justify-center border border-cyan-light/50 bg-navy-950 font-display text-2xl font-bold text-cyan-light lg:h-[6.4rem] lg:w-[6.4rem] lg:text-6xl"
                    aria-hidden
                  >
                    {d.key}
                  </span>
                  <div className="pt-1 lg:pt-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
                      {lang === "es" ? "Fase" : "Phase"} {String(i + 1).padStart(2, "0")}
                    </p>
                    <h3 className="mt-2 font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-none text-ink">
                      {t(d.name)}
                    </h3>
                    <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft">
                      {t(d.body)}
                    </p>
                    <ul className="mt-6 flex flex-wrap gap-2">
                      {d.tools.map((tool) => (
                        <li
                          key={tool.es}
                          className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-ink-dim"
                        >
                          {t(tool)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {d.card && (
                  <div className="self-center border border-white/[0.08] bg-navy-950/80 p-6 lg:col-span-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-light">
                      {t(d.card.title)}
                    </p>
                    <dl className="mt-5 divide-y divide-white/[0.07]">
                      {d.card.rows.map(([name, unit]) => (
                        <div key={name.es} className="flex items-baseline justify-between gap-4 py-3">
                          <dt className="font-display text-lg font-bold text-ink">{t(name)}</dt>
                          <dd className="font-mono text-[11px] tracking-wider text-ink-dim">
                            {t(unit)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-brand" />
                      {t(d.card.foot)}
                    </p>
                  </div>
                )}

                {d.drawing && (
                  <figure className="lg:col-span-5">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-navy-950">
                      <div className="pointer-events-none absolute inset-0 blueprint-dots opacity-20" />
                      <ProjectVisual kind={d.drawing} />
                      <span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim">
                        {d.key} · {lang === "es" ? "Mapa VSM, actual y futuro" : "VSM map, current and future"}
                      </span>
                    </div>
                  </figure>
                )}

                {d.photo && (
                  <figure className="lg:col-span-5">
                    <div className="group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-white/10">
                      <Image
                        src={d.photo}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 36vw"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                      />
                      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[rgba(4,16,31,0.7)] to-transparent" />
                      <span className="absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[#e8eef6]">
                        {d.key} · {t(d.name)}
                      </span>
                    </div>
                  </figure>
                )}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Lightbox({
  photos,
  index,
  onClose,
  onMove,
}: {
  photos: CasePhoto[];
  index: number;
  onClose: () => void;
  onMove: (step: number) => void;
}) {
  const { t, lang } = useLang();
  const photo = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onMove(1);
      if (e.key === "ArrowLeft") onMove(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onMove]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t(photo.caption)}
      className="fixed inset-0 z-[60] flex flex-col bg-navy-950/95 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-6 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-ink-dim">
        <span>
          {String(index + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          data-cursor="link"
          className="border border-white/15 px-3 py-1.5 text-ink transition-colors hover:border-cyan-brand hover:text-cyan-light"
        >
          {lang === "es" ? "Cerrar" : "Close"} ✕
        </button>
      </div>

      <div className="relative min-h-0 flex-1 px-4 sm:px-20" onClick={(e) => e.stopPropagation()}>
        <Image
          key={photo.src}
          src={photo.src}
          alt={t(photo.alt)}
          fill
          sizes="100vw"
          className="object-contain"
        />
        {[-1, 1].map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => onMove(step)}
            data-cursor="link"
            aria-label={step < 0 ? (lang === "es" ? "Anterior" : "Previous") : lang === "es" ? "Siguiente" : "Next"}
            className={`absolute top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-white/15 bg-navy-950/70 text-ink transition-colors hover:border-cyan-brand hover:text-cyan-light sm:flex ${
              step < 0 ? "left-4" : "right-4"
            }`}
          >
            {step < 0 ? "←" : "→"}
          </button>
        ))}
      </div>

      <p className="px-6 py-5 text-center text-[15px] text-ink-soft">{t(photo.caption)}</p>
    </div>
  );
}

/** Dónde cae cada foto de la galería: la primera alta, la última ancha. */
const BENTO = [
  "sm:row-span-2 lg:row-span-2 min-h-[28rem]",
  "",
  "",
  "sm:col-span-2 lg:col-span-2",
];

function Gallery({ c }: { c: Case }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState<number | null>(null);
  const photos = c.gallery;

  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (step: number) =>
      setOpen((i) => (i === null ? i : (i + step + photos.length) % photos.length)),
    [photos.length],
  );

  return (
    <section className="relative py-24 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow>{lang === "es" ? "En planta" : "On the floor"}</Eyebrow>
              <h2 className="mt-5 font-display text-[clamp(2rem,4.2vw,3.4rem)] font-bold leading-[1] text-ink">
                {lang === "es" ? "Lo que se midió, en foto" : "What got measured, on camera"}
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-ink-dim">
              {lang === "es"
                ? "Fotos tomadas en planta. Toca cualquiera para verla entera."
                : "Photos taken on the floor. Tap any of them to see it whole."}
            </p>
          </div>
        </Reveal>

        {/*
          Rejilla fija y no columnas sueltas: con cinco fotos de alturas
          distintas, una columna acababa mucho antes que las otras y la
          sección se leía a medio llenar. La línea va en grande a la
          izquierda, que es la toma que pone al visitante en la planta.
        */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:h-[46rem] lg:grid-cols-3 lg:grid-rows-2">
          {photos.map((p, i) => (
            <Reveal key={p.src} delay={(i % 3) * 80} className={`${BENTO[i] ?? ""} min-h-[18rem]`}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                aria-label={t(p.caption)}
                className="group relative block h-full min-h-[18rem] w-full overflow-hidden rounded-xl ring-1 ring-white/10"
              >
                <Image
                  src={p.src}
                  alt={t(p.alt)}
                  fill
                  sizes={i === photos.length - 1 ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
                  style={p.position ? { objectPosition: p.position } : undefined}
                  className="object-cover transition-[scale] duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <span className="pointer-events-none absolute left-3 top-3 rounded bg-[rgba(4,16,31,0.6)] px-1.5 py-0.5 font-mono text-[10px] tracking-[0.24em] text-[#e8eef6]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,16,31,0.85)] to-transparent px-4 pb-3.5 pt-12 text-left text-[13px] leading-snug text-[#e8eef6]">
                  {t(p.caption)}
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </div>

      {open !== null && (
        <Lightbox photos={photos} index={open} onClose={close} onMove={move} />
      )}
    </section>
  );
}

function Office({ c }: { c: Case }) {
  const { t, lang } = useLang();
  const o = c.office;

  return (
    <section
      id="oficina"
      className="relative scroll-mt-24 border-t border-white/[0.06] bg-navy-950/70 py-24 lg:py-36"
    >
      <div className="mx-auto grid max-w-[1400px] items-center gap-14 px-6 lg:grid-cols-12 lg:px-16">
        <Reveal className="lg:col-span-5">
          <Eyebrow dot="bg-orange-brand">{t(o.eyebrow)}</Eyebrow>
          <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.2rem)] font-bold leading-[1] text-ink">
            {t(o.title)}
          </h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink-soft">{t(o.body)}</p>

          <ul className="mt-8 space-y-3">
            {o.points.map((p) => (
              <li key={p.es} className="flex items-start gap-3 text-[15px] leading-snug text-ink">
                <span aria-hidden className="mt-0.5 font-mono text-[12px] text-cyan-light">
                  ✓
                </span>
                {t(p)}
              </li>
            ))}
          </ul>

          <p className="mt-8 border-l-2 border-white/15 pl-4 text-[13px] leading-relaxed text-ink-dim">
            {t(o.note)}
          </p>

          <a
            href="/#proyectos"
            data-cursor="link"
            className="group/link mt-8 inline-flex items-center gap-3 text-sm font-semibold text-cyan-light"
          >
            <span className="relative">
              {t(o.cta)}
              <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right bg-cyan-light transition-transform duration-500 group-hover/link:origin-left group-hover/link:scale-x-0" />
            </span>
            <span aria-hidden className="transition-transform duration-500 group-hover/link:translate-x-1">
              →
            </span>
          </a>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-7">
          <Chassis
            chip="Programa_contable.xlsm"
            kind="VIDEO"
            footer={
              <>
                <span className="text-cyan-light">Excel · VBA</span>
                <span className="h-px flex-1 bg-white/10" />
                <span>{lang === "es" ? "34 s · bucle" : "34 s · loop"}</span>
              </>
            }
          >
            <div className="relative aspect-[4/3] bg-navy-900">
              <LoopVideo
                src={pickAsset(o.video.src, lang)}
                poster={pickAsset(o.video.poster, lang)}
                label={t(o.title)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </Chassis>
        </Reveal>
      </div>
    </section>
  );
}

function Close({ c }: { c: Case }) {
  const { t } = useLang();

  return (
    <section className="relative py-24 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-16">
        <Reveal>
          <div className="relative overflow-hidden border border-white/[0.08] bg-navy-950/85 px-8 py-16 sm:px-14 lg:px-20 lg:py-24">
            <div className="pointer-events-none absolute inset-0 blueprint-dots opacity-40" />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(232,119,34,0.18), transparent 72%)",
              }}
            />
            <div className="relative max-w-3xl">
              <h2 className="font-display text-[clamp(2rem,4.6vw,3.8rem)] font-bold leading-[1] text-ink">
                {t(c.close.title)}
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">{t(c.close.body)}</p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <a
                  href="/#contacto"
                  data-cursor="link"
                  className="bg-cyan-brand px-7 py-3.5 text-sm font-semibold text-navy-950 transition-colors duration-300 hover:bg-cyan-light"
                >
                  {t(c.close.primary)}
                </a>
                <a
                  href="/#servicios"
                  data-cursor="link"
                  className="border border-white/20 px-7 py-3.5 text-sm font-semibold text-ink transition-colors duration-300 hover:border-cyan-brand hover:text-cyan-light"
                >
                  {t(c.close.secondary)}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function CaseStudy({ slug }: { slug: string }) {
  const c = CASES.find((x) => x.slug === slug);
  if (!c) return null;

  return (
    <main id="top" className="relative flex-1">
      <Hero c={c} />
      <Results c={c} />
      <Summary c={c} />
      <Wastes c={c} />
      <Dmaic c={c} />
      <Gallery c={c} />
      <Office c={c} />
      <Close c={c} />
    </main>
  );
}
