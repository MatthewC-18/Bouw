"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { PROJECTS, pickAsset, type Project } from "@/lib/content";
import { dragonScreen } from "@/lib/dragonScreen";
import { useLang } from "@/lib/i18n";
import LiveSystem from "./LiveSystem";
import LoopVideo from "./LoopVideo";
import ProjectVisual from "./ProjectVisual";
import Reveal from "./Reveal";

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
 * Material de planta.
 *
 * El video se grabó en vertical, con el teléfono, recorriendo la línea. En el
 * 4:3 del panel había que recortarle dos tercios o ampliarlo hasta que se
 * deshacía (la toma tiene 480 px de ancho). Así que va a su tamaño y el hueco
 * de al lado lo llenan dos fotos del mismo trabajo.
 */
function FloorSheet({
  project,
  video,
  zoom,
}: {
  project: Project;
  video: { src: string; poster: string };
  zoom: string;
}) {
  const { t, lang } = useLang();
  const tiles = project.tiles ?? [];
  const label =
    "absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,16,31,0.8)] to-transparent px-3 pb-2 pt-7 font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8eef6]";

  return (
    <div className="absolute inset-0 grid grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] gap-1.5 p-1.5">
      <div className="relative overflow-hidden rounded-[9px]">
        <LoopVideo
          src={video.src}
          poster={video.poster}
          label={t(project.title)}
          className={`absolute inset-0 h-full w-full object-cover ${zoom}`}
        />
        {/* Rótulos dentro de la ventana: el dragón puede taparlos (`data-dragon-ignore`) */}
        <span className={label} data-dragon-ignore>
          01 · {lang === "es" ? "Línea" : "Line"}
        </span>
      </div>

      <div className="grid grid-rows-2 gap-1.5">
        {tiles.map((tile, i) => (
          <div key={tile.src} className="relative overflow-hidden rounded-[9px]">
            <Image
              src={tile.src}
              alt={t(tile.alt)}
              fill
              sizes="(max-width: 1024px) 50vw, 30vw"
              className={`object-cover ${zoom}`}
            />
            <span className={label} data-dragon-ignore>
              {String(i + 2).padStart(2, "0")} · {t(tile.label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Panel de medios: el escenario.
 *
 * Las piezas vienen de mundos distintos: una interfaz oscura, una web de
 * colores pastel, una hoja de cálculo, fotos de planta y un plano. Antes cada
 * una iba como venía y la fila parecía de cinco portafolios distintos. Ahora
 * todas pasan por el mismo molde, de arriba abajo:
 *
 * 1. Cabecera: número, tipo de material y estado.
 * 2. La ventana, con su barra y la dirección o el nombre del archivo. La
 *    captura entra entera, a su proporción (`project.frame`): ni se recorta
 *    ni se le pone un paspartú distinto a cada una.
 * 3. Pie: la cifra que resume el proyecto y lo que pasa al tocarlo.
 *
 * Todo sobre un escenario del color del proyecto.
 */
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

  const status = live
    ? lang === "es"
      ? "En vivo"
      : "Live"
    : video
      ? "Video"
      : t(KIND_LABEL[project.mediaKind]);

  const action = live
    ? lang === "es"
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
    <div
      className={`p-stage aspect-[10/11] sm:aspect-[6/5] lg:aspect-[5/4] ${live ? "cursor-pointer" : ""}`}
      data-perch={perchId}
      data-perch-corner={perchCorner}
      {...(live
        ? {
            "data-perch-open": "",
            role: "button",
            tabIndex: 0,
            "aria-label":
              lang === "es"
                ? `Abrir ${t(project.title)} en vivo`
                : `Open ${t(project.title)} live`,
            onClick: open,
            onKeyDown: (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            },
          }
        : {})}
    >
      {/* Cabecera */}
      <div className="relative flex items-center gap-3 px-5 pb-3 pt-4 font-mono text-[10px] uppercase tracking-[0.24em] sm:px-7 sm:pt-6">
        <span className="font-semibold text-(--p-accent)">{project.index}</span>
        <span className="h-px w-6 bg-(--p-line)" aria-hidden />
        {/* `min-w-0` o el rótulo no se corta: ensancha el panel y la fila
            entera se sale de la pantalla en el teléfono */}
        <span className="min-w-0 truncate text-ink-dim">{t(project.category)}</span>
        <span className="ml-auto flex shrink-0 items-center gap-2 text-(--p-accent)">
          <span
            className={`h-1.5 w-1.5 rounded-full bg-(--p-accent) ${live ? "live-dot" : ""}`}
            aria-hidden
          />
          {status}
        </span>
      </div>

      {/* La ventana */}
      <div className="p-area relative flex-1 px-5 sm:px-7">
        <div
          ref={windowRef}
          className="p-window"
          style={{ "--p-frame": project.frame } as CSSProperties}
        >
          <div className="p-window-bar flex items-center gap-3 px-3.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2 w-2 rounded-full bg-(--p-line)" />
              <span className="h-2 w-2 rounded-full bg-(--p-line)" />
              <span className="h-2 w-2 rounded-full bg-(--p-line)" />
            </span>
            <span className="mx-auto max-w-[70%] truncate rounded-md bg-(--p-window) px-3 py-0.5 font-mono text-[10px] tracking-wide text-ink-dim">
              {project.mediaChip}
            </span>
            <span className="w-[42px]" aria-hidden />
          </div>

          <div className="p-media">
            {project.mediaKind === "floor" && video ? (
              <FloorSheet project={project} video={video} zoom={zoom} />
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
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[rgba(4,16,31,0.28)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              >
                <span className="flex items-center gap-3 rounded-full bg-(--p-accent) px-5 py-2.5 text-sm font-semibold text-(--p-on-accent) shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)]">
                  <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
                    <path d="M0 0l10 6-10 6z" fill="currentColor" />
                  </svg>
                  {lang === "es" ? "Abrir el sistema en vivo" : "Open the live system"}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/*
        Pie: la cifra y lo que pasa al tocar, y entre las dos, sitio para el
        dragón. Con la ficha centrada en pantalla el borde de arriba del
        escenario queda pegado a la barra y el bicho no cabe encima; aquí
        abajo sí (ver la repisa al final).
      */}
      <div className="relative flex min-h-[4.5rem] items-end gap-4 px-5 pb-4 pt-3 sm:min-h-[5.5rem] sm:px-7 sm:pb-6 lg:min-h-[8.75rem]">
        {feature && (
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[1.6rem] font-bold leading-none text-(--p-accent) sm:text-[2rem] lg:text-[2.5rem]">
              {feature.value}
            </span>
            <span className="max-w-[11rem] text-[12px] leading-snug text-ink-soft">
              {t(feature.label)}
            </span>
          </div>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-2 pb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-dim transition-colors duration-500 group-hover:text-(--p-accent)">
          {action}
          <span
            aria-hidden
            className="transition-transform duration-500 group-hover:translate-x-1"
          >
            {live ? "↗" : "→"}
          </span>
        </span>
      </div>

      {/*
        Repisa: segunda percha del panel, en el pie. El dragón busca a lo
        largo de ella el tramo sin texto, que es el hueco entre la cifra y la
        acción, y se queda de pie delante de la ventana.
      */}
      <span
        aria-hidden
        data-perch={`pie-${project.slug}`}
        data-perch-corner={perchCorner}
        className="pointer-events-none absolute inset-x-0 bottom-4 h-px sm:bottom-5"
      />
    </div>
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

          <h3 className="mt-5 font-display text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-[0.98] text-ink">
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

          <p className="mt-6 text-lg leading-snug text-ink">
            {t(project.summary)}
          </p>

          <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
            {t(project.description)}
          </p>

          <div className="mt-6 flex gap-3 border-l-2 border-(--p-accent) pl-4">
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-(--p-accent)">
              {lang === "es" ? "Resultado" : "Outcome"}
            </span>
            <p className="text-sm leading-relaxed text-ink">
              {t(project.outcome)}
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-6">
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

          <ul className="mt-6 flex flex-wrap gap-2">
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
              className="group/case mt-8 mr-6 inline-flex items-center gap-4 rounded-full border border-(--p-accent) bg-(--p-accent-soft) px-5 py-3 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-(--p-accent) hover:text-(--p-on-accent)"
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
              className="group/link mt-8 inline-flex items-center gap-3 text-sm font-semibold text-(--p-accent)"
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
    <section id="proyectos" className="veil relative py-28 lg:py-40">
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

        <div className="mt-24 space-y-32 lg:mt-32 lg:space-y-48">
          {PROJECTS.map((p, i) => (
            <ProjectRow key={p.slug} project={p} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
