"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { COMPLIANCE, Localized } from "@/lib/content";
import { useLang } from "@/lib/i18n";

type Audit = (typeof COMPLIANCE)["audit"];

/** Un número que llega a su valor en vez de saltar. */
function useTween(target: number, ms = 600) {
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
 * El simulacro de auditoría, en la ficha de cumplimiento.
 *
 * Matthew, 14 oct 2026: «mejoremos la parte de cumplimiento igual» que la de
 * Lean, donde el visitante enciende las mejoras y ve el resultado. Aquí marca
 * lo que su planta ya cumple y el tablero le dice, al momento, cuán preparada
 * está y qué es lo primero que vería un inspector si llegara hoy.
 *
 * Sustituye al tablero de muestra que se cerraba solo de 46 a 98 %: aquel
 * contaba una historia ajena; este da un dato sobre la planta de quien lo
 * toca, que es el criterio de la página (ver `Diagnosis`). Y el resultado
 * viaja con la llamada al formulario (`onResult`).
 *
 * Los pesos son nuestros, para ordenar lo que más pesa en una inspección; no
 * salen de una norma, y la cabecera dice que es un simulacro.
 */
export default function AuditCheck({
  audit,
  onResult,
}: {
  audit: Audit;
  /** La frase para el formulario, cuando el visitante ya marcó algo. */
  onResult?: (line: Localized) => void;
}) {
  const { t, lang } = useLang();
  const [on, setOn] = useState<string[]>(audit.start);

  const total = audit.items.reduce((s, x) => s + x.weight, 0);
  const pct = Math.round(
    (audit.items.filter((x) => on.includes(x.id)).reduce((s, x) => s + x.weight, 0) / total) * 100,
  );
  const shown = useTween(pct);
  const missing = audit.items.filter((x) => !on.includes(x.id));
  const first = missing[0];
  // Lista solo sin nada pendiente: con algo por cumplir, el inspector lo vería
  const level = pct === 100 ? "high" : pct >= 60 ? "mid" : "low";
  const color = level === "high" ? "var(--p-good)" : "var(--color-orange-brand)";

  const toggle = (id: string) => {
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    setOn(next);
    if (!onResult) return;
    const p = Math.round(
      (audit.items.filter((x) => next.includes(x.id)).reduce((s, x) => s + x.weight, 0) / total) * 100,
    );
    const left = audit.items.filter((x) => !next.includes(x.id));
    onResult({
      es: `Quiero agendar el diagnóstico de calidad gratis (cumplimiento normativo y BPM). En el simulacro de auditoría salí con ${p} %${
        left.length ? `; me falta: ${left.map((x) => x.short.es.toLowerCase()).join(", ")}` : ""
      }.`,
      en: `I'd like to book the free quality diagnosis (regulatory compliance and GMP). I scored ${p}% on the mock audit${
        left.length ? `; still missing: ${left.map((x) => x.short.en.toLowerCase()).join(", ")}` : ""
      }.`,
    });
  };

  // El anillo: 2πr con r = 52
  const C = 2 * Math.PI * 52;

  const box = (active: boolean) => (
    <span
      aria-hidden
      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[5px] transition-colors duration-300 ${
        active ? "bg-(--p-good) text-(--p-window)" : "ring-1 ring-(--p-line)"
      }`}
    >
      {active && <Check className="h-3 w-3" strokeWidth={3.5} />}
    </span>
  );

  return (
    <div className="@container absolute inset-0 flex flex-col bg-(--p-window)">
      <div className="flex h-9 shrink-0 items-center border-b border-(--p-line) px-3 @md:h-10 @md:px-4">
        <span className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim @md:text-[9.5px]">
          {t(audit.intro)}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 p-2.5 @md:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)] @md:grid-rows-1 @md:gap-4 @md:p-4">
        {/* El resultado: preparación, nivel y lo primero que vería un inspector */}
        <div className="flex items-center gap-3 @md:order-2 @md:flex-col @md:items-stretch @md:justify-center @md:gap-4 @md:border-l @md:border-(--p-line) @md:pl-4">
          <div className="relative aspect-square w-16 shrink-0 @md:mx-auto @md:w-[62%]">
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
                style={{ stroke: color, transition: "stroke 400ms" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-[1.05rem] font-bold leading-none text-ink tabular-nums @md:text-[2.1rem]">
                {Math.round(shown)}
                <span className="text-[0.5em]"> %</span>
              </span>
              <span className="mt-1 hidden font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-dim @md:block">
                {t(audit.score)}
              </span>
            </div>
          </div>
          <div className="min-w-0 @md:text-center">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#fff] transition-colors duration-300 @md:text-[11px] ${
                level === "high" ? "bg-[#17784f]" : "bg-orange-brand"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#fff]" aria-hidden />
              {t(audit.levels[level])}
            </span>
            <p className="mt-1.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-dim @md:mt-3">
              {first ? t(audit.finding) : ""}
            </p>
            <p
              key={first?.id ?? "nada"}
              aria-live="polite"
              className={`pain-in mt-0.5 line-clamp-2 text-[11px] leading-snug @md:mt-1 @md:text-[13px] ${
                first ? "text-ink" : "text-(--p-good)"
              }`}
            >
              {first ? t(first.finding) : t(audit.clean)}
            </p>
          </div>
        </div>

        {/* Lo que se marca */}
        <ul className="grid min-h-0 grid-cols-2 content-center gap-1.5 @md:order-1 @md:grid-cols-1 @md:gap-2">
          {audit.items.map((x) => {
            const active = on.includes(x.id);
            return (
              <li key={x.id} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(x.id)}
                  className={`flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left ring-1 transition-colors duration-300 @md:gap-2.5 @md:px-3 @md:py-2 ${
                    active ? "bg-(--p-good)/10 ring-(--p-good)/35" : "ring-(--p-line) hover:bg-(--p-accent-soft)"
                  }`}
                >
                  {box(active)}
                  <span className={`min-w-0 truncate text-[10.5px] @md:hidden ${active ? "text-ink" : "text-ink-dim"}`}>
                    {t(x.short)}
                  </span>
                  <span
                    className={`hidden min-w-0 text-[12.5px] leading-snug @md:block ${active ? "text-ink" : "text-ink-soft"}`}
                  >
                    {t(x.long)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Para lectores de pantalla: el resultado en una frase */}
      <span className="sr-only">{lang === "es" ? `Preparación ${pct} %` : `Readiness ${pct}%`}</span>
    </div>
  );
}
