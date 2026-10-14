"use client";

import { CircleCheck, CircleDashed, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { COMPLIANCE } from "@/lib/content";
import { useLang } from "@/lib/i18n";

type Board = (typeof COMPLIANCE)["board"];

/** Un número que llega a su valor en vez de saltar. */
function useTween(target: number, ms = 650) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const a = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const x = a + (target - a) * (1 - Math.pow(1 - k, 3));
      from.current = x;
      setV(x);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

/**
 * El tablero de auditoría, de muestra.
 *
 * Arranca como está una planta antes del diagnóstico (en preparación, 46 %)
 * y al entrar en pantalla se van cerrando los puntos uno a uno hasta el 98 %:
 * listo para inspección. El 2 % que falta es el simulacro, que queda
 * programado. Tocar el panel lo vuelve a contar (`key` nuevo desde fuera).
 *
 * Es una muestra y lo dice en la cabecera: los números no son de un cliente.
 */
export default function AuditBoard({ board }: { board: Board }) {
  const { t } = useLang();
  const [done, setDone] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(board.items.length);
      return;
    }
    const timers: number[] = [];
    let played = false;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || played) return;
        played = true;
        board.items.forEach((_, k) =>
          timers.push(window.setTimeout(() => setDone(k + 1), 900 + k * 750)),
        );
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [board]);

  const target = board.start + board.items.slice(0, done).reduce((s, x) => s + x.gain, 0);
  const shown = useTween(target);
  const ready = done === board.items.length;

  // El anillo: 2πr con r = 52
  const C = 2 * Math.PI * 52;

  return (
    <div
      ref={root}
      className="@container absolute inset-0 flex flex-col bg-(--p-window) p-3 @md:p-5 @xl:p-7"
    >
      {/* Cabecera del tablero */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-[13px] font-bold leading-tight text-ink @md:text-[16px] @xl:text-[19px]">
            {t(board.title)}
          </p>
          <p className="mt-0.5 truncate font-mono text-[8.5px] uppercase tracking-[0.18em] text-ink-dim @md:mt-1 @md:text-[10px]">
            {t(board.scope)}
          </p>
        </div>
        <span
          data-dragon-ignore
          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[9.5px] font-semibold text-[#fff] transition-colors duration-500 @md:px-2.5 @md:py-1 @md:text-[11px] ${
            ready ? "bg-[#17784f]" : "bg-orange-brand"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full bg-[#fff] ${ready ? "" : "live-dot"}`} aria-hidden />
          {ready ? t(board.after) : t(board.before)}
        </span>
      </div>

      <div className="mt-3 grid min-h-0 flex-1 grid-cols-[31%_minmax(0,1fr)] items-center gap-3 @md:grid-cols-[36%_minmax(0,1fr)] @md:mt-4 @md:gap-6">
        {/* El anillo con el porcentaje */}
        <div className="relative aspect-square w-full">
          <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
            <circle cx="60" cy="60" r="52" fill="none" stroke="var(--p-line)" strokeWidth="9" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - shown / 100)}
              className="transition-[stroke] duration-500"
              style={{ stroke: ready ? "var(--p-good)" : "var(--color-orange-brand)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[8.5cqw] font-bold leading-none text-ink tabular-nums">
              {Math.round(shown)}
              <span className="text-[0.5em]"> %</span>
            </span>
            <span className="mt-[0.6cqw] font-mono text-[2.1cqw] uppercase tracking-[0.16em] text-ink-dim">
              {t({ es: "preparación", en: "readiness" })}
            </span>
          </div>
        </div>

        {/* Lo que se revisa */}
        <ul className="flex flex-col gap-1 @md:gap-2">
          {board.items.map((it, k) => {
            const ok = k < done;
            return (
              <li
                key={t(it.label)}
                className={`flex items-center gap-2 rounded-md px-2 py-1 transition-colors duration-500 @md:gap-2.5 @md:px-3 @md:py-2 ${
                  ok ? "bg-(--p-accent-soft)" : "bg-orange-brand/[0.08]"
                }`}
              >
                {ok ? (
                  <CircleCheck aria-hidden className="h-3.5 w-3.5 shrink-0 text-(--p-good) @md:h-4 @md:w-4" strokeWidth={2.2} />
                ) : (
                  <CircleDashed aria-hidden className="h-3.5 w-3.5 shrink-0 text-orange-brand @md:h-4 @md:w-4" strokeWidth={2.2} />
                )}
                <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink @md:text-[12.5px] @xl:text-[13.5px]">
                  {t(it.label)}
                </span>
                <span
                  className={`shrink-0 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] @md:text-[10px] ${
                    ok ? "text-(--p-good)" : "text-orange-light"
                  }`}
                >
                  {ok ? "OK" : t(it.before)}
                </span>
              </li>
            );
          })}
          <li className="flex items-center gap-2 px-2 py-1 @md:gap-2.5 @md:px-3 @md:py-2">
            <Clock aria-hidden className="h-3.5 w-3.5 shrink-0 text-ink-dim @md:h-4 @md:w-4" strokeWidth={2} />
            <span className="min-w-0 flex-1 truncate text-[10.5px] text-ink-dim @md:text-[12.5px] @xl:text-[13.5px]">
              {t(board.pending.label)}
            </span>
            {/* En un tablero estrecho no cabe: el reloj ya dice que está pendiente */}
            <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-dim @md:inline">
              {t(board.pending.status)}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
