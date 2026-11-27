"use client";

import Image from "next/image";
import { useRef } from "react";
import { pickAsset, type Project } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { CuedVideo, Laptop, Phone, Slides } from "./Devices";
import LinePeek from "./linea/LinePeek";
import LoopVideo from "./LoopVideo";
import ProjectVisual from "./ProjectVisual";
import { BookVisual, QuoteVisual } from "./ShowcaseVisuals";
import Stage from "./Stage";

/*
 * El panel de medios de un proyecto, sobre el chasis común (`Stage`).
 *
 * Vivía dentro de `Projects`; salió aquí el 25 nov 2026, cuando las fichas
 * en fila pasaron a una sola vitrina (`ProjectShowcase`) que lo reutiliza.
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
export function Media({
  project,
  index,
  perchId,
  ledgeId,
  perchCorner,
  onOpen,
  fixedAspect,
}: {
  project: Project;
  /** Número que se ve en el escaparate; por defecto, el del proyecto. */
  index?: string;
  /** Percha del pie; fija en la vitrina para que no cambie con el proyecto. */
  ledgeId?: string;
  /** Proporción fija del escaparate (ver `Stage`). */
  fixedAspect?: string;
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
  const status = project.status
    ? t(project.status)
    : live
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
      : project.reserved
        ? lang === "es"
          ? "Datos de ejemplo"
          : "Sample data"
        : lang === "es"
          ? "Pasa el mouse"
          : "Hover";

  return (
    <Stage
      index={index ?? project.index}
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
      ledgeId={ledgeId ?? `pie-${project.slug}`}
      fixedAspect={fixedAspect}
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
          {project.visual === "libro" ? (
            <BookVisual />
          ) : project.visual === "cotizador" ? (
            <QuoteVisual />
          ) : (
            <ProjectVisual kind={project.visual ?? "device"} />
          )}
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
