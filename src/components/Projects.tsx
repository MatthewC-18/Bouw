"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { PROJECTS, pickAsset, type Project } from "@/lib/content";
import { dragonScreen } from "@/lib/dragonScreen";
import { useLang } from "@/lib/i18n";
import LiveSystem from "./LiveSystem";
import LoopVideo from "./LoopVideo";
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
  floor: "PISO",
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
  toned,
}: {
  project: Project;
  video: { src: string; poster: string };
  toned: string;
}) {
  const { t, lang } = useLang();
  const tiles = project.tiles ?? [];

  return (
    <div className="relative grid h-full grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)] gap-3">
      <div className="relative overflow-hidden rounded-lg ring-1 ring-white/10">
        <LoopVideo
          src={video.src}
          poster={video.poster}
          label={t(project.title)}
          className={`absolute inset-0 h-full w-full object-cover ${toned} group-hover:scale-[1.03]`}
        />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded bg-[rgba(4,16,31,0.78)] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8eef6]">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-orange-brand" aria-hidden />
          {lang === "es" ? "Planta" : "Floor"}
        </span>
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,16,31,0.8)] to-transparent px-3 pb-2.5 pt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8eef6]">
          01 · {lang === "es" ? "Línea" : "Line"}
        </span>
      </div>

      <div className="grid grid-rows-2 gap-3">
        {tiles.map((tile, i) => (
          <div key={tile.src} className="relative overflow-hidden rounded-lg ring-1 ring-white/10">
            <Image
              src={tile.src}
              alt={t(tile.alt)}
              fill
              sizes="(max-width: 1024px) 50vw, 30vw"
              className={`object-cover ${toned} group-hover:scale-[1.04]`}
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,16,31,0.8)] to-transparent px-3 pb-2.5 pt-8 font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8eef6]">
              {String(i + 2).padStart(2, "0")} · {t(tile.label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const panelRef = useRef<HTMLDivElement>(null);
  const live = Boolean(project.live && onOpen);
  const open = () => {
    if (live && panelRef.current) onOpen?.(panelRef.current);
  };
  const accent = ACCENT[project.accent];
  // Fotos y capturas van enmarcadas sobre paspartú y completas. La captura de
  // Anatris es 1200×630: recortada a 4:3 con `cover` perdía un tercio del
  // ancho y no se entendía qué se estaba mirando.
  const isFramed = project.mediaKind !== "drawing";
  const video = project.video
    ? {
        src: pickAsset(project.video.src, lang),
        poster: pickAsset(project.video.poster, lang),
      }
    : null;
  const photographic = Boolean(project.image || video);

  // Tailwind v4 anima `scale` como propiedad propia, no dentro de `transform`:
  // si no se nombra aquí, el zoom salta en seco en vez de acompañar al color.
  // El tratamiento en reposo era tan fuerte (gris al 65 %, brillo al 80 %) que
  // no se distinguía qué había en cada panel hasta pasar el mouse. Ahora solo
  // se unifica la temperatura; el hover sigue devolviendo el color entero.
  //
  // El tratamiento vive solo en el hover. Un `filter` permanente sobre la
  // captura obligaba a recomponerla filtrada en cada fotograma de scroll; a
  // cambio daba un matiz de temperatura que el tinte de marca de encima ya da.
  const toned =
    "transition-[scale] duration-[900ms] ease-out " +
    "group-hover:brightness-105 group-hover:saturate-110";

  return (
    <div
      className={`relative ${live ? "cursor-pointer" : ""}`}
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
      {/*
        Resplandor: un degradado radial ya es una mancha difusa; no lleva
        `blur`. Con `blur-3xl` encima, la GPU desenfocaba en cada fotograma
        un rectángulo más grande que el panel —incluso con opacidad 0, por la
        transición— y la sección bajaba a 15 fps en gráfica integrada. Sin el
        desenfoque, medido igual: 70.
      */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 opacity-0 transition-opacity duration-700 group-hover:opacity-100 lg:-inset-16"
        style={{
          background: `radial-gradient(closest-side, ${accent.glow}, transparent)`,
        }}
      />

      <div
        ref={panelRef}
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-950 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]"
      >
        {/* Barra superior: el mismo chasis para todos */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-2.5">
          <span className="flex gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-[1px] ${accent.dot}`} />
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white/20" />
            <span className="h-1.5 w-1.5 rounded-[1px] bg-white/10" />
          </span>
          <span className="truncate rounded border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 font-mono text-[10px] tracking-wide text-ink-dim">
            {project.mediaChip}
          </span>
          {live ? (
            <span className="ml-auto flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.24em] text-cyan-light">
              <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-light" aria-hidden />
              {lang === "es" ? "En vivo" : "Live"}
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.24em] text-ink-dim/60">
              {video && <span className="h-1.5 w-1.5 rounded-full bg-orange-brand/80" aria-hidden />}
              {video ? "VIDEO" : KIND_LABEL[project.mediaKind]}
            </span>
          )}
        </div>

        <div
          className={`relative aspect-4/3 overflow-hidden ${
            project.mediaKind === "floor"
              ? "bg-navy-900 p-3 sm:p-4"
              : isFramed
                ? "bg-navy-900 p-4 sm:p-6"
                : ""
          }`}
        >
          {/* Trama de fondo: cose los paneles al mismo sistema */}
          <div className="pointer-events-none absolute inset-0 blueprint-dots opacity-20" />

          {project.mediaKind === "floor" && video ? (
            <FloorSheet project={project} video={video} toned={toned} />
          ) : video ? (
            <div className="relative h-full w-full overflow-hidden rounded-lg ring-1 ring-white/10">
              <LoopVideo
                src={video.src}
                poster={video.poster}
                label={t(project.title)}
                className={`absolute inset-0 h-full w-full object-contain ${toned} group-hover:scale-[1.03]`}
              />
            </div>
          ) : project.image ? (
            <div
              className={`relative h-full w-full overflow-hidden ${
                isFramed ? "rounded-lg ring-1 ring-white/10" : ""
              }`}
            >
              <Image
                src={project.image}
                alt={project.imageAlt ? t(project.imageAlt) : t(project.title)}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className={`${isFramed ? "object-contain" : "object-cover"} ${toned} group-hover:scale-[1.03]`}
              />
            </div>
          ) : (
            <div className="absolute inset-0 transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]">
              <ProjectVisual kind={project.visual ?? "device"} />
            </div>
          )}

          {/* Tinte de marca sobre las fotos: se retira al pasar el mouse.
              Los dibujos técnicos ya nacen en la paleta, no lo necesitan. */}
          {photographic && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-45 transition-opacity duration-700 group-hover:opacity-0"
              style={{
                background:
                  "linear-gradient(165deg, rgba(var(--page-rgb),0) 0%, rgba(var(--page-rgb),0.28) 55%, rgba(var(--veil-rgb),0.42) 100%)",
              }}
            />
          )}

          {/*
            Aquí cruzaba un destello blanco en diagonal al pasar el ratón.

            Es el "brillo de tarjeta": la banda clara que barre el panel, del
            mismo repertorio que las píldoras con degradado y las tarjetas que
            se levantan un píxel. No informa de nada y compite con lo único
            que importa del panel, que es la imagen del trabajo. Las esquinas
            de encuadre, que sí dicen "esto es una toma", se quedan.
          */}

          {/* Sistema en vivo: la invitación aparece al pasar el ratón */}
          {live && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="flex items-center gap-3 rounded-full border border-cyan-light/50 bg-navy-950/85 px-5 py-2.5 text-sm font-semibold text-cyan-light shadow-[0_0_40px_-10px_rgba(79,214,232,0.7)]">
                <svg width="10" height="12" viewBox="0 0 10 12" aria-hidden>
                  <path d="M0 0l10 6-10 6z" fill="currentColor" />
                </svg>
                {lang === "es" ? "Abrir el sistema en vivo" : "Open the live system"}
              </span>
            </span>
          )}

          {/* Esquinas de encuadre */}
          {/* Las esquinas se abren con `transform`, no animando posición y
              tamaño: eso rehacía el layout en cada fotograma del hover. */}
          <span className="pointer-events-none absolute left-4 top-4 h-6 w-6 border-l border-t border-white/25 transition-[transform,border-color] duration-500 group-hover:-translate-x-1 group-hover:-translate-y-1 group-hover:border-cyan-light" />
          <span className="pointer-events-none absolute bottom-4 right-4 h-6 w-6 border-b border-r border-white/25 transition-[transform,border-color] duration-500 group-hover:translate-x-1 group-hover:translate-y-1 group-hover:border-orange-light" />
        </div>

        {/* Pie técnico */}
        <div className="flex items-center gap-4 border-t border-white/[0.07] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim">
          <span className={accent.text}>{project.slug}</span>
          <span className="h-px flex-1 bg-white/10" />
          <span className={`hidden sm:inline ${live ? "text-cyan-light" : ""}`}>
            {live
              ? lang === "es"
                ? "Toca para abrirlo"
                : "Tap to open it"
              : project.caseHref
                ? lang === "es"
                  ? "Toca para ver el caso"
                  : "Tap to see the case"
                : lang === "es"
                  ? "Pasa el mouse"
                  : "Hover"}
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
    <article ref={rowRef} className="group relative">
      {/* Numeral fantasma: se sale del contenedor a propósito */}
      <span
        aria-hidden
        data-dragon-ignore
        className={`pointer-events-none absolute -top-14 z-10 select-none font-display text-[clamp(6rem,15vw,14rem)] font-bold leading-none text-white/[0.045] transition-colors duration-700 group-hover:text-white/[0.08] ${
          mediaFirst ? "right-0" : "left-0"
        }`}
      >
        {project.index}
      </span>

      <div className="relative grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Medios */}
        <div className={mediaClass}>
          {/*
            El dragón se posa en la esquina del panel que mira al texto: por
            encima del borde, sin tapar lo que hay dentro (ahí irán videos).
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

          <p className="mt-4 text-[17px] leading-relaxed text-ink-soft">
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
                className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-ink-dim"
              >
                {tag}
              </li>
            ))}
          </ul>

          {project.caseHref && (
            <Link
              href={project.caseHref}
              className="group/case mt-8 mr-6 inline-flex items-center gap-4 border border-orange-brand/60 bg-orange-brand/[0.08] px-5 py-3 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-orange-brand hover:text-navy-950"
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
