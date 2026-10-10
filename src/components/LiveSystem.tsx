"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/lib/content";
import { useLang } from "@/lib/i18n";

/**
 * El sistema en vivo de un proyecto, a pantalla completa.
 *
 * Matthew (3 oct 2026): «que se abra con el sistema en vivo». El panel del
 * proyecto se abre desde donde está —la ventana crece desde su rectángulo
 * hasta ocupar la pantalla— y dentro corre el sistema de verdad, no una
 * captura: se puede usar.
 *
 * Mientras el sistema carga se ve la captura del panel, para que la ventana
 * no se abra en negro. Se cierra con la ×, con Escape o tocando fuera de la
 * barra; el foco vuelve al panel.
 */
type Props = {
  project: Project;
  /** Rectángulo del panel al abrir, en píxeles de ventana: de ahí crece. */
  from: DOMRect | null;
  onClose: () => void;
};

const OPEN_MS = 650;

export default function LiveSystem({ project, from, onClose }: Props) {
  const { t, lang } = useLang();
  const live = project.live;
  const [shown, setShown] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  // Recorte inicial: el rectángulo del panel. Al montar pasa a pantalla entera
  const inset = from
    ? `inset(${from.top}px ${window.innerWidth - from.right}px ${window.innerHeight - from.bottom}px ${from.left}px round 16px)`
    : "inset(0px 0px 0px 0px round 0px)";

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setShown(false);
    setTimeout(onClose, OPEN_MS * 0.8);
  }, [onClose]);

  useEffect(() => {
    // Dos fotogramas: el primero pinta el recorte del panel, el segundo anima
    let b = 0;
    const a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => setShown(true));
    });
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    const focus = setTimeout(() => closeRef.current?.focus(), OPEN_MS);
    return () => {
      cancelAnimationFrame(a);
      cancelAnimationFrame(b);
      clearTimeout(focus);
      root.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [close]);

  if (!live) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t({ es: `${t(project.title)} en vivo`, en: `${t(project.title)} live` })}
      className="fixed inset-0 z-[70] flex flex-col bg-navy-950"
      style={{
        clipPath: shown ? "inset(0px 0px 0px 0px round 0px)" : inset,
        transition: `clip-path ${OPEN_MS}ms var(--ease-out-expo)`,
      }}
    >
      {/* Barra: el mismo chasis del panel, ahora de ventana */}
      <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3 sm:px-6">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2 w-2 rounded-[2px] bg-cyan-brand" />
          <span className="h-2 w-2 rounded-[2px] bg-white/20" />
          <span className="h-2 w-2 rounded-[2px] bg-white/10" />
        </span>
        <span className="truncate rounded border border-white/[0.08] bg-white/[0.03] px-3 py-1 font-mono text-[11px] tracking-wide text-ink-soft">
          {live.label}
        </span>
        <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-light sm:flex">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-cyan-light" aria-hidden />
          {lang === "es" ? "En vivo" : "Live"}
        </span>

        <a
          href={live.url}
          target="_blank"
          rel="noreferrer noopener"
          className="ml-auto hidden rounded-full border border-white/12 px-4 py-1.5 text-[13px] text-ink-soft transition-colors hover:border-cyan-light hover:text-cyan-light sm:inline-block"
        >
          {lang === "es" ? "Abrir en otra pestaña" : "Open in a new tab"} ↗
        </a>
        <button
          ref={closeRef}
          type="button"
          onClick={close}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-ink transition-colors hover:border-cyan-light hover:text-cyan-light sm:ml-0"
          aria-label={lang === "es" ? "Cerrar" : "Close"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Mientras carga, la captura del panel: la ventana nunca se abre en negro */}
        {project.image && (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
              loaded ? "opacity-0" : "opacity-100"
            }`}
          >
            <Image
              src={project.image}
              alt=""
              fill
              sizes="100vw"
              className="object-contain p-10 opacity-40"
            />
            <div className="absolute inset-x-0 bottom-10 flex flex-col items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-soft">
                {lang === "es" ? "Conectando con el sistema" : "Connecting to the system"}
              </span>
              <span className="h-px w-48 overflow-hidden bg-white/10">
                <span className="live-load block h-px w-1/3 bg-cyan-light" />
              </span>
            </div>
          </div>
        )}

        {shown || loaded ? (
          <iframe
            src={live.url}
            title={t(project.title)}
            className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-700 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
            allow="fullscreen; xr-spatial-tracking; accelerometer; gyroscope"
            onLoad={() => setTimeout(() => setLoaded(true), 250)}
          />
        ) : null}
      </div>

      {live.hint && (
        <p className="border-t border-white/[0.08] px-6 py-3 text-center text-[13px] text-ink-dim">
          {t(live.hint)}
        </p>
      )}
    </div>,
    document.body,
  );
}
