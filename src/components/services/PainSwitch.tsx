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
 * A la izquierda, los cuatro problemas como los diría la planta; a la
 * derecha, el elegido con su solución y cómo se ve en el piso. Mientras está
 * en pantalla y nadie ha tocado nada, pasa solo de uno a otro (la raya bajo
 * el problema activo dice cuánto falta). En cuanto alguien elige uno, se
 * queda quieto en ese.
 *
 * En el teléfono no hay dos columnas: la solución se abre debajo del
 * problema elegido. Es el mismo panel; solo cambia su `order` en la rejilla.
 * Por eso ahí no pasa solo: el panel saltaría de sitio mientras se lee.
 */
export default function PainSwitch({ pains }: { pains: Pain[] }) {
  const { t, lang } = useLang();
  const [on, setOn] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  /** Sin paso automático: menos movimiento pedido, o pantalla de una columna. */
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();
  const panelId = `${uid}-panel`;

  useEffect(() => {
    setStill(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        !window.matchMedia("(min-width: 1024px)").matches,
    );
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

  const p = pains[on];
  const Icon = ICONS[p.icon];

  return (
    <div ref={root}>
      <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.24em]">
        <span className="text-orange-light">{lang === "es" ? "El problema hoy" : "The problem today"}</span>
        <span aria-hidden className="h-px w-8 bg-(--p-line)" />
        <span className="text-(--p-accent)">{lang === "es" ? "La solución Bouw" : "The Bouw fix"}</span>
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-8">
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
              style={{ order: i * 2 }}
              className={`relative flex w-full items-center gap-4 overflow-hidden rounded-[16px] border px-4 py-4 text-left transition-colors duration-300 lg:col-start-1 ${
                active
                  ? "border-(--p-accent) bg-(--p-accent-soft)"
                  : "border-(--p-line) hover:bg-(--p-accent-soft)"
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ring-1 transition-colors duration-300 ${
                  active ? "bg-(--p-accent) text-(--p-on-accent) ring-(--p-accent)" : "text-orange-light ring-(--p-line)"
                }`}
              >
                <Glyph aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">
                  {lang === "es" ? "Problema" : "Problem"} 0{i + 1}
                </span>
                <span className="mt-1 block text-[15px] font-semibold leading-snug text-ink">
                  {t(x.problem)}
                </span>
              </span>
              <span
                aria-hidden
                className={`text-(--p-accent) transition-[opacity,translate] duration-300 ${
                  active ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
                }`}
              >
                →
              </span>
              {active && running && (
                <span
                  key={on}
                  aria-hidden
                  className="pain-progress absolute inset-x-4 bottom-0 h-[2px] bg-(--p-accent)"
                  style={{ animationDuration: `${DWELL}s` }}
                />
              )}
            </button>
          );
        })}

        {/* La solución del problema elegido */}
        <div
          id={panelId}
          role="region"
          aria-labelledby={`${uid}-tab-${on}`}
          aria-live={auto ? "off" : "polite"}
          style={{ order: on * 2 + 1 }}
          className="relative overflow-hidden rounded-[22px] border border-(--p-line) bg-(--p-window) p-6 sm:p-8 lg:col-start-2 lg:row-span-4 lg:row-start-1 lg:flex lg:flex-col lg:justify-center lg:p-12"
        >
          {/* El icono, grande y apagado, de fondo */}
          <Icon
            aria-hidden
            className="pointer-events-none absolute -right-6 -bottom-8 h-48 w-48 text-(--p-accent) opacity-[0.07] lg:h-72 lg:w-72"
            strokeWidth={1.2}
          />

          <div key={on} className="pain-in relative">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-ink-dim">
              <span className="rounded-full bg-orange-brand/15 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-orange-light">
                {lang === "es" ? "Hoy" : "Today"}
              </span>
              <span className="pain-strike">{t(p.problem)}</span>
            </p>

            <p className="mt-7 inline-flex items-center gap-2 rounded-full bg-(--p-accent-soft) px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-(--p-accent) ring-1 ring-(--p-line)">
              <Icon aria-hidden className="h-3.5 w-3.5" strokeWidth={2} />
              {lang === "es" ? "Con Bouw" : "With Bouw"}
            </p>
            <h4 className="mt-4 max-w-[24ch] font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-bold leading-[1.08] text-ink">
              {t(p.solution)}
            </h4>
            <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-ink-soft">{t(p.how)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
