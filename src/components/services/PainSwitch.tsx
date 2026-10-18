"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { Pain } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { ICONS } from "./icons";

/** Segundos que se queda cada problema antes de pasar al siguiente. */
const DWELL = 6;

/**
 * El problema de hoy y lo que cambia con Bouw.
 *
 * Arriba, los cuatro problemas como los diría la planta, en dos columnas
 * (en una donde la columna es estrecha);
 * debajo, el elegido con su solución. Mientras está en pantalla y nadie ha
 * tocado nada, pasa solo de uno a otro (la raya bajo el problema activo dice
 * cuánto falta). En cuanto alguien elige uno, se queda quieto en ese.
 *
 * Compacto (Matthew, 18 oct 2026: «compactemos la parte de proyectos»): va
 * al lado del video de la planta, no en una banda propia debajo. Las cuatro
 * soluciones ocupan la misma celda de la rejilla y solo se ve la elegida:
 * la caja mide lo que la más larga y no salta al cambiar, así que puede
 * pasar sola también en el teléfono.
 */
export default function PainSwitch({
  pains,
  perch,
}: {
  pains: Pain[];
  /** Percha del dragón en la esquina de la caja de la solución. */
  perch?: string;
}) {
  const { t, lang } = useLang();
  const [on, setOn] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  /** Sin paso automático si se pidió menos movimiento. */
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();
  const panelId = `${uid}-panel`;

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = auto && visible && !still;
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setOn((i) => (i + 1) % pains.length), DWELL * 1000);
    return () => window.clearTimeout(id);
  }, [running, on, pains.length]);

  const pick = (i: number) => {
    setAuto(false);
    setOn(i);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + pains.length) % pains.length;
    pick(next);
    tabs.current[next]?.focus();
  };

  const Icon = ICONS[pains[on].icon];

  return (
    <div ref={root}>
      <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.24em]">
        <span className="text-orange-light">{lang === "es" ? "El problema hoy" : "The problem today"}</span>
        <span aria-hidden className="h-px w-8 bg-(--p-line)" />
        <span className="text-(--p-accent)">{lang === "es" ? "La solución Bouw" : "The Bouw fix"}</span>
      </div>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-2.5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {pains.map((x, i) => {
          const Glyph = ICONS[x.icon];
          const active = i === on;
          return (
            <button
              key={t(x.problem)}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              onClick={() => pick(i)}
              onKeyDown={(e) => onKey(e, i)}
              aria-expanded={active}
              aria-controls={active ? panelId : undefined}
              id={`${uid}-tab-${i}`}
              className={`relative flex w-full items-center gap-3 overflow-hidden rounded-[14px] border px-3.5 py-3 text-left transition-colors duration-300 ${
                active
                  ? "border-(--p-accent) bg-(--p-accent-soft)"
                  : "border-(--p-line) hover:bg-(--p-accent-soft)"
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 transition-colors duration-300 ${
                  active ? "bg-(--p-accent) text-(--p-on-accent) ring-(--p-accent)" : "text-orange-light ring-(--p-line)"
                }`}
              >
                <Glyph aria-hidden className="h-4 w-4" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[9.5px] uppercase tracking-[0.2em] text-ink-dim">
                  {lang === "es" ? "Problema" : "Problem"} 0{i + 1}
                </span>
                <span className="mt-0.5 block text-[14px] font-semibold leading-snug text-ink">
                  {t(x.problem)}
                </span>
              </span>
              {active && running && (
                <span
                  key={on}
                  aria-hidden
                  className="pain-progress absolute inset-x-3.5 bottom-0 h-[2px] bg-(--p-accent)"
                  style={{ animationDuration: `${DWELL}s` }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* La solución del problema elegido: las cuatro en la misma celda */}
      <div
        id={panelId}
        data-perch={perch}
        data-perch-corner="right"
        role="region"
        aria-labelledby={`${uid}-tab-${on}`}
        aria-live={auto ? "off" : "polite"}
        className="relative mt-3 grid overflow-hidden rounded-[20px] border border-(--p-line) bg-(--p-window) p-6 sm:p-7"
      >
        {/* El icono, grande y apagado, de fondo */}
        <Icon
          aria-hidden
          className="pointer-events-none absolute -right-5 -bottom-7 h-40 w-40 text-(--p-accent) opacity-[0.07]"
          strokeWidth={1.2}
        />

        {pains.map((p, i) => {
          const active = i === on;
          return (
            <div
              key={t(p.problem)}
              aria-hidden={!active}
              className={`relative col-start-1 row-start-1 transition-[opacity,visibility] duration-300 ${
                active ? "pain-in visible opacity-100" : "invisible opacity-0"
              }`}
            >
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-ink-dim">
                <span className="rounded-full bg-orange-brand/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-light">
                  {lang === "es" ? "Hoy" : "Today"}
                </span>
                <span className={active ? "pain-strike" : "line-through"}>{t(p.problem)}</span>
              </p>
              <h4 className="mt-4 font-display text-[clamp(1.3rem,1.9vw,1.65rem)] font-bold leading-[1.1] text-ink">
                {t(p.solution)}
              </h4>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">{t(p.how)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
