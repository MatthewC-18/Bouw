"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { COMPLIANCE, LEAN, PROJECTS, SHOWCASE, pickAsset, type Project } from "@/lib/content";
import { dragonScreen } from "@/lib/dragonScreen";
import { CuedVideo, Laptop, Phone, Slides } from "./Devices";
import { useLang } from "@/lib/i18n";
import LiveSystem from "./LiveSystem";
import LinePeek from "./linea/LinePeek";
import LoopVideo from "./LoopVideo";
import ProjectVisual from "./ProjectVisual";
import Reveal from "./Reveal";
import ServiceRow from "./services/ServiceRow";
import Stage from "./Stage";

/*
 * Cada ficha lleva su color (`project.hue`) y todas el mismo chasis. Los
 * colores salen de `.project` en `globals.css`: misma luz y misma intensidad
 * para todos, cambia solo el tono. Aquí solo se leen las variables.
 */

/* ------------------------------------------------------------------ */
/* Panel de medios                                                     */
/* ------------------------------------------------------------------ */

const KIND_LABEL: Record<Project["mediaKind"], { es: string; en: string }> = {
  screen: { es: "Interfaz", en: "Interface" },
  photo: { es: "Foto", en: "Photo" },
  drawing: { es: "Plano", en: "Drawing" },
  floor: { es: "Planta", en: "Floor" },
};

/**
 * El proyecto dentro de su aparato (`Devices`): el portátil con las
 * pantallas en bucle o el video con sus rótulos y, si hay, el teléfono al
 * lado, adelantado y a la derecha.
 */
function DeviceScene({ project }: { project: Project }) {
  const { t } = useLang();
  const d = project.device;
  if (!d) return null;
  const screen = d.video ? (
    <CuedVideo
      src={d.video.src}
      poster={d.video.poster}
      label={t(project.title)}
      cues={d.video.cues.map((c) => ({ at: c.at, step: t(c.step), text: t(c.text) }))}
    />
  ) : (
    <Slides
      slides={(d.slides ?? []).map((x) => ({ src: x.src, alt: t(x.alt), label: x.label ? t(x.label) : undefined }))}
      sizes="(max-width: 1024px) 90vw, 45vw"
    />
  );
  if (!d.phone) return <Laptop ratio={d.ratio} fit={94}>{screen}</Laptop>;
  /*
   * Con teléfono, el teléfono manda: casi todo el alto del escenario, a la
   * derecha y delante. El portátil queda detrás, a la izquierda, más chico
   * («mejora la vista de celular de Charms», Matthew, 19 oct 2026).
   */
  return (
    <div className="relative h-full w-full">
      <Laptop ratio={d.ratio} fit={74} className="absolute left-0 top-1/2 -translate-y-1/2">
        {screen}
      </Laptop>
      <Phone className="absolute right-[3%] top-1/2 h-[96%] -translate-y-1/2">
        <Slides
          slides={d.phone.map((x) => ({ src: x.src, alt: t(x.alt), label: x.label ? t(x.label) : undefined }))}
          sizes="(max-width: 1024px) 40vw, 16vw"
          fit="top"
          every={3}
          dots={false}
        />
      </Phone>
    </div>
  );
}

/** Panel de medios de un proyecto, sobre el chasis común (`Stage`). */
function Media({
  project,
  perchId,
  perchCorner,
  onOpen,
}: {
  project: Project;
  /** Percha del dragón: la esquina superior del panel que mira al texto. */
  perchId: string;
  perchCorner: "left" | "right";
  /** Si el proyecto tiene sistema en vivo, abrirlo desde este panel. */
  onOpen?: (panel: HTMLElement) => void;
}) {
  const { t, lang } = useLang();
  const windowRef = useRef<HTMLDivElement>(null);
  const live = Boolean(project.live && onOpen);
  const open = () => {
    if (live && windowRef.current) onOpen?.(windowRef.current);
  };
  const video = project.video
    ? {
        src: pickAsset(project.video.src, lang),
        poster: pickAsset(project.video.poster, lang),
      }
    : null;
  const feature = project.metrics[project.feature] ?? project.metrics[0];

  // Tailwind v4 anima `scale` como propiedad propia, no dentro de `transform`:
  // si no se nombra aquí, el zoom salta en seco. Nada de `filter` permanente:
  // obligaba a recomponer la captura filtrada en cada fotograma de scroll.
  const zoom = "transition-[scale] duration-[900ms] ease-out group-hover:scale-[1.03]";

  const sim = project.live?.kind === "simulador";
  const status = live
    ? sim
      ? lang === "es"
        ? "Simulador"
        : "Simulator"
      : lang === "es"
        ? "En vivo"
        : "Live"
    : project.mediaKind === "floor"
      ? lang === "es"
        ? "Caso"
        : "Case study"
      : video
        ? "Video"
        : t(KIND_LABEL[project.mediaKind]);

  const action = live
    ? sim
      ? lang === "es"
        ? "Ver la línea en marcha"
        : "See the line running"
      : lang === "es"
        ? "Abrir en vivo"
        : "Open it live"
    : project.caseHref
      ? lang === "es"
        ? "Ver el caso"
        : "See the case"
      : lang === "es"
        ? "Pasa el mouse"
        : "Hover";

  return (
    <Stage
      index={project.index}
      category={t(project.category)}
      status={status}
      pulse={live}
      chip={project.mediaChip}
      frame={project.frame}
      windowRef={windowRef}
      feature={feature ? { value: feature.value, label: t(feature.label) } : undefined}
      action={action}
      arrow={live ? "↗" : "→"}
      perchId={perchId}
      ledgeId={`pie-${project.slug}`}
      perchCorner={perchCorner}
      bare={Boolean(project.device)}
      press={
        live
          ? {
              label:
                lang === "es"
                  ? `Abrir ${t(project.title)} en vivo`
                  : `Open ${t(project.title)} live`,
              onPress: open,
            }
          : undefined
      }
    >
      {project.device ? (
        <DeviceScene project={project} />
      ) : project.mediaKind === "floor" && video ? (
        /*
          El caso en la ficha (ver `LinePeek`): la línea pasa de antes a
          después en bucle, con la planta, el producto y los resultados.
          Las fotos solas «no me dicen nada de lo que pasa» (Matthew,
          11 oct 2026).
        */
        <LinePeek
          video={video}
          photo={
            project.tiles?.[1]
              ? {
                  src: project.tiles[1].src,
                  alt: t(project.tiles[1].alt),
                  label: t(project.tiles[1].label),
                }
              : undefined
          }
        />
      ) : video ? (
        <LoopVideo
          src={video.src}
          poster={video.poster}
          label={t(project.title)}
          className={`absolute inset-0 h-full w-full object-cover ${zoom}`}
        />
      ) : project.image ? (
        <Image
          src={project.image}
          alt={project.imageAlt ? t(project.imageAlt) : t(project.title)}
          fill
          sizes="(max-width: 1024px) 100vw, 55vw"
          className={`object-cover object-top ${zoom}`}
        />
      ) : (
        <div className={`absolute inset-0 ${zoom}`}>
          <ProjectVisual kind={project.visual ?? "device"} />
        </div>
      )}

      {/* Sistema en vivo: la invitación aparece al pasar el ratón */}
      {live && (
        <span
          data-dragon-ignore
          // Con aparato no se oscurece nada: el velo era un rectángulo que no
          // casaba con el portátil y el teléfono. Queda la píldora sola
          className={`pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
            project.device ? "" : "bg-[rgba(4,16,31,0.28)]"
          }`}
        >
          <span className="flex items-center gap-3 rounded-full bg-(--p-accent) px-5 py-2.5 text-sm font-semibold text-(--p-on-accent) shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]">
            <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
              <path d="M0 0l10 6-10 6z" fill="currentColor" />
            </svg>
            {sim
              ? lang === "es"
                ? "Ver la línea en marcha"
                : "See the line running"
              : lang === "es"
                ? "Abrir el sistema en vivo"
                : "Open the live system"}
          </span>
        </span>
      )}
    </Stage>
  );
}

/* ------------------------------------------------------------------ */
/* Fila de proyecto                                                    */
/* ------------------------------------------------------------------ */

function ProjectRow({ project, i }: { project: Project; i: number }) {
  const { t, lang } = useLang();
  const mediaFirst = i % 2 === 1;
  const perchId = `proyecto-${project.slug}`;

  /*
   * Sistema en vivo. Si el dragón está posado en el panel, primero lo
   * enciende con su fuego y la ventana crece un instante después; si no,
   * se abre al momento.
   */
  const [liveFrom, setLiveFrom] = useState<DOMRect | null>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const panelEl = useRef<HTMLElement | null>(null);
  const openLive = useCallback(
    (panel: HTMLElement) => {
      panelEl.current = panel;
      window.dispatchEvent(new CustomEvent("bouw:project-open", { detail: { id: perchId } }));
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const wait = !still && dragonScreen.target === perchId ? 450 : 0;
      setTimeout(() => {
        setLiveFrom(panel.getBoundingClientRect());
        setLiveOpen(true);
      }, wait);
    },
    [perchId],
  );
  const closeLive = useCallback(() => {
    setLiveOpen(false);
    panelEl.current?.closest<HTMLElement>("[data-perch-open]")?.focus();
  }, []);

  // Se alterna el lado del panel. Las clases van completas, sin concatenar
  // fragmentos, porque Tailwind necesita verlas literales para generarlas.
  const mediaClass = mediaFirst
    ? "lg:col-start-1 lg:col-span-7 lg:row-start-1"
    : "lg:col-start-6 lg:col-span-7 lg:row-start-1";
  const textClass = mediaFirst
    ? "lg:col-start-8 lg:col-span-5 lg:row-start-1"
    : "lg:col-start-1 lg:col-span-5 lg:row-start-1";

  return (
    <article
      className="project group relative isolate"
      style={
        {
          "--p-h": project.hue,
          "--p-glow-x": mediaFirst ? "28%" : "72%",
        } as CSSProperties
      }
    >
      <div aria-hidden className="project-glow" />

      <div className="relative grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Medios */}
        <div className={`min-w-0 ${mediaClass}`}>
          {/*
            El dragón se posa en la esquina del panel que mira al texto: por
            encima del borde, sin tapar lo que hay dentro.
          */}
          {/* Con caso completo y sin sistema en vivo, el panel lleva al caso */}
          {project.caseHref && !project.live ? (
            <Link
              href={project.caseHref}
              aria-label={`${t(project.title)}: ${lang === "es" ? "ver el caso completo" : "see the full case"}`}
              className="block"
            >
              <Media
                project={project}
                perchId={perchId}
                perchCorner={mediaFirst ? "right" : "left"}
              />
            </Link>
          ) : (
            <Media
              project={project}
              perchId={perchId}
              perchCorner={mediaFirst ? "right" : "left"}
              onOpen={project.live ? openLive : undefined}
            />
          )}
          {liveOpen && (
            <LiveSystem project={project} from={liveFrom} onClose={closeLive} />
          )}
        </div>

        {/*
          Texto. La entrada animada va solo aquí: antes envolvía la ficha
          entera, y animar la opacidad de un grupo con el panel de imagen
          dentro obligaba a la GPU a componerlo fuera de pantalla en cada
          fotograma. En gráfica integrada, la primera bajada por Proyectos iba
          a 12 fps; sin eso, a 90.
        */}
        <Reveal delay={40} className={textClass}>
          <div className="flex items-center gap-3">
            <span className="h-1.5 w-1.5 rounded-full bg-(--p-accent)" />
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-(--p-accent)">
              {t(project.category)}
            </span>
            {project.has3D && (
              <span className="rounded-full border border-(--p-line) bg-(--p-accent-soft) px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-(--p-accent)">
                3D
              </span>
            )}
          </div>

          <h3 className="mt-4 font-display text-[clamp(2rem,3.8vw,3rem)] font-bold leading-[0.98] text-ink">
            {/*
              Segunda percha del proyecto: cuando el borde del panel ya se fue
              por arriba, el dragón salta al nombre y sigue acompañando.
            */}
            <span
              className="relative inline-block"
              data-perch={`titulo-${project.slug}`}
              data-perch-corner="right"
            >
              {t(project.title)}
              <span className="absolute -bottom-1 left-0 h-[2px] w-full origin-left scale-x-0 bg-(--p-accent) transition-transform duration-700 group-hover:scale-x-100" />
            </span>
          </h3>

          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
            {t(project.client)}
          </p>

          <p className="mt-5 text-lg leading-snug text-ink">
            {t(project.summary)}
          </p>

          <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
            {t(project.description)}
          </p>

          <div className="mt-5 flex gap-3 border-l-2 border-(--p-accent) pl-4">
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-(--p-accent)">
              {lang === "es" ? "Resultado" : "Outcome"}
            </span>
            <p className="text-sm leading-relaxed text-ink">
              {t(project.outcome)}
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-5">
            {project.metrics.map((m) => (
              <div key={m.value + t(m.label)}>
                <dt className="font-display text-[1.75rem] font-bold leading-none text-ink transition-colors duration-500 group-hover:text-(--p-accent)">
                  {m.value}
                </dt>
                <dd className="mt-2 text-[12px] leading-snug text-ink-dim">
                  {t(m.label)}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-(--p-line) px-3 py-1 font-mono text-[11px] text-ink-dim"
              >
                {tag}
              </li>
            ))}
          </ul>

          {project.caseHref && (
            <Link
              href={project.caseHref}
              className="group/case mt-6 mr-6 inline-flex items-center gap-4 rounded-full border border-(--p-accent) bg-(--p-accent-soft) px-5 py-3 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-(--p-accent) hover:text-(--p-on-accent)"
            >
              {project.caseLabel
                ? t(project.caseLabel)
                : lang === "es"
                  ? "Ver el caso completo"
                  : "See the full case"}
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/case:translate-x-1"
              >
                →
              </span>
            </Link>
          )}

          {project.href && (
            <a
              href={project.href}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="link"
              className="group/link mt-6 inline-flex items-center gap-3 text-sm font-semibold text-(--p-accent)"
            >
              <span className="relative">
                {project.href.replace("https://", "")}
                <span className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-100 bg-(--p-accent) transition-transform duration-500 group-hover/link:origin-left group-hover/link:scale-x-0" />
              </span>
              <span
                aria-hidden
                className="transition-transform duration-500 group-hover/link:translate-x-1"
              >
                ↗
              </span>
            </a>
          )}
        </Reveal>
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

        {/*
          Proyectos y servicios en una sola lista, alternando el lado. Entre
          fila y fila, aire, pero no media pantalla vacía: cada ficha ya se
          separa por su color (Matthew, 18 oct 2026: «compactemos la parte de
          proyectos»).
        */}
        <div className="mt-16 space-y-24 lg:mt-20 lg:space-y-32">
          {SHOWCASE.map((row, i) => {
            if ("service" in row)
              return (
                <ServiceRow
                  key={row.service}
                  service={row.service === "lean" ? LEAN : COMPLIANCE}
                  i={i}
                />
              );
            const p = PROJECTS.find((x) => x.slug === row.project);
            return p ? <ProjectRow key={p.slug} project={p} i={i} /> : null;
          })}
        </div>
      </div>
    </section>
  );
}
