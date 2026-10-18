"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { COMPLIANCE, Localized } from "@/lib/content";
import { useLang } from "@/lib/i18n";

type Audit = (typeof COMPLIANCE)["audit"];
type Severity = Audit["items"][number]["severity"];

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

const SEV = {
  critical: { es: "Crítico", en: "Critical", text: "text-(--p-bad)", bg: "bg-(--p-bad)" },
  major: { es: "Mayor", en: "Major", text: "text-orange-brand", bg: "bg-orange-brand" },
  minor: { es: "Menor", en: "Minor", text: "text-ink-soft", bg: "bg-ink-dim" },
} satisfies Record<Severity, { es: string; en: string; text: string; bg: string }>;

/** Segmentos del indicador, de izquierda a derecha por arriba. */
const SEGS = 24;

/** Un tramo de arco del indicador, en un círculo de radio `r` centrado en (60, 60). */
function seg(i: number, r = 48) {
  const gap = 1.6;
  const a0 = Math.PI + (i / SEGS) * Math.PI + (gap / 2) * (Math.PI / 180);
  const a1 = Math.PI + ((i + 1) / SEGS) * Math.PI - (gap / 2) * (Math.PI / 180);
  const p = (a: number) => `${(60 + r * Math.cos(a)).toFixed(2)} ${(60 + r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
}

/**
 * El simulacro de auditoría, en la ficha de cumplimiento.
 *
 * Matthew, 14 oct 2026: «mejoremos la parte de cumplimiento igual» que la de
 * Lean, donde el visitante enciende las mejoras y ve el resultado. Aquí marca
 * lo que su planta ya cumple y el tablero le dice, al momento, cuán preparada
 * está y qué es lo primero que vería un inspector si llegara hoy.
 *
 * 18 oct 2026: «así no me gusta, se ve muy básico». Ahora tiene la forma de
 * un informe de inspección: cada requisito es una fila con la gravedad del
 * hallazgo si falta (crítico, mayor o menor, como se clasifican en BPM) o
 * «Cumple» si está; a la derecha, la preparación en un indicador por
 * segmentos, cuántos hallazgos quedan de cada gravedad y el primero que
 * anotaría el inspector.
 *
 * Los pesos y la gravedad de cada punto son nuestros, para ordenar lo que
 * más pesa en una inspección; no salen de una norma, y la cabecera dice que
 * es un simulacro. El resultado viaja con la llamada al formulario
 * (`onResult`).
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
  const score = (ids: string[]) =>
    Math.round((audit.items.filter((x) => ids.includes(x.id)).reduce((s, x) => s + x.weight, 0) / total) * 100);
  const pct = score(on);
  const shown = useTween(pct);
  const missing = audit.items.filter((x) => !on.includes(x.id));
  const first = missing[0];
  const count = (s: Severity) => missing.filter((x) => x.severity === s).length;
  // Lista solo sin nada pendiente: con algo por cumplir, el inspector lo vería
  const level = pct === 100 ? "high" : pct >= 60 ? "mid" : "low";
  const tone =
    level === "high"
      ? { text: "text-(--p-good)", bg: "bg-(--p-good)", stroke: "var(--p-good)" }
      : level === "mid"
        ? { text: "text-orange-brand", bg: "bg-orange-brand", stroke: "var(--color-orange-brand)" }
        : { text: "text-(--p-bad)", bg: "bg-(--p-bad)", stroke: "var(--p-bad)" };
  const lit = Math.round((shown / 100) * SEGS);

  const toggle = (id: string) => {
    const next = on.includes(id) ? on.filter((x) => x !== id) : [...on, id];
    setOn(next);
    if (!onResult) return;
    const p = score(next);
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

  return (
    <div className="@container absolute inset-0 flex flex-col bg-(--p-window)">
      {/* Cabecera del informe */}
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-(--p-line) px-3 @md:px-4">
        <span className="min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim @md:text-[9.5px]">
          {t(audit.intro)}
        </span>
        <span
          className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#fff] transition-colors duration-300 @md:text-[10.5px] ${tone.bg}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#fff]" aria-hidden />
          {t(audit.levels[level])}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] @md:grid-cols-[minmax(0,1fr)_minmax(0,0.62fr)] @md:grid-rows-1">
        {/* El resultado */}
        <div className="flex items-center gap-3 border-b border-(--p-line) px-3 py-2 @md:order-2 @md:flex-col @md:items-stretch @md:gap-0 @md:border-b-0 @md:border-l @md:px-4 @md:py-3">
          {/* Indicador por segmentos */}
          <div className="relative w-20 shrink-0 @md:mx-auto @md:w-full @md:max-w-[190px]">
            <svg viewBox="0 6 120 62" className="block w-full" aria-hidden>
              {Array.from({ length: SEGS }, (_, i) => (
                <path
                  key={i}
                  d={seg(i)}
                  fill="none"
                  strokeWidth={10}
                  style={{
                    stroke: i < lit ? tone.stroke : "var(--p-line)",
                    transition: "stroke 300ms",
                  }}
                />
              ))}
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="font-display text-[1.05rem] font-bold leading-none text-ink tabular-nums @md:text-[1.9rem]">
                {Math.round(shown)}
                <span className="text-[0.5em]"> %</span>
              </span>
            </div>
          </div>
          <p className="hidden text-center font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-dim @md:mt-1 @md:block">
            {t(audit.score)}
          </p>

          {/* Hallazgos que quedan, por gravedad */}
          <div className="hidden grid-cols-3 gap-1.5 @md:mt-3 @md:grid">
            {(["critical", "major", "minor"] as const).map((s) => (
              <div key={s} className="rounded-md px-1.5 py-1 text-center ring-1 ring-(--p-line)">
                <span className={`block font-display text-[15px] font-bold leading-none tabular-nums ${count(s) ? SEV[s].text : "text-ink-dim"}`}>
                  {count(s)}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[7.5px] uppercase tracking-[0.12em] text-ink-dim">
                  {SEV[s][lang]}
                </span>
              </div>
            ))}
          </div>

          {/* Lo primero que anotaría el inspector */}
          <div className="min-w-0 @md:mt-3 @md:border-t @md:border-(--p-line) @md:pt-2.5">
            <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink-dim @md:text-[8.5px]">
              {first ? t(audit.finding) : ""}
            </p>
            <p
              key={first?.id ?? "nada"}
              aria-live="polite"
              className={`pain-in mt-0.5 line-clamp-2 text-[11px] leading-snug @md:mt-1 @md:text-[12px] ${first ? "text-ink" : "text-(--p-good)"}`}
            >
              {first && (
                <span className={`mr-1.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] ${SEV[first.severity].text}`}>
                  {SEV[first.severity][lang]}
                </span>
              )}
              {first ? t(first.finding) : t(audit.clean)}
            </p>
          </div>
        </div>

        {/* Los requisitos, como filas del informe */}
        <div className="flex min-h-0 flex-col @md:order-1">
          <div className="hidden h-7 shrink-0 items-center border-b border-(--p-line) px-4 font-mono text-[8px] uppercase tracking-[0.16em] text-ink-dim @md:flex">
            <span>{lang === "es" ? "Requisito" : "Requirement"}</span>
            <span className="ml-auto">{lang === "es" ? "Si falta" : "If missing"}</span>
          </div>
          <ul className="grid min-h-0 flex-1 grid-cols-2 content-center gap-1 p-2 @md:grid-cols-1 @md:content-stretch @md:gap-0 @md:p-0">
            {audit.items.map((x, i) => {
              const active = on.includes(x.id);
              return (
                <li key={x.id} className="min-w-0 @md:border-b @md:border-(--p-line) @md:last:border-b-0">
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(x.id)}
                    className={`flex h-full w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-300 @md:gap-2.5 @md:rounded-none @md:px-4 @md:py-0 ${
                      active ? "bg-(--p-good)/[0.07]" : "hover:bg-(--p-accent-soft)"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-[4px] transition-colors duration-300 ${
                        active ? "bg-(--p-good) text-(--p-window)" : "ring-1 ring-(--p-line)"
                      }`}
                    >
                      {active && <Check className="h-3 w-3" strokeWidth={3.5} />}
                    </span>
                    <span className="hidden w-4 shrink-0 font-mono text-[9px] text-ink-dim tabular-nums @md:inline">
                      0{i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[10.5px] font-semibold @md:text-[12px] ${active ? "text-ink" : "text-ink-soft"}`}>
                        {t(x.short)}
                      </span>
                      <span className="hidden truncate text-[10.5px] leading-snug text-ink-dim @md:block">{t(x.long)}</span>
                    </span>
                    <span
                      className={`hidden w-[4.6rem] shrink-0 items-center justify-end gap-1.5 font-mono text-[8.5px] font-semibold uppercase tracking-[0.12em] @md:flex ${
                        active ? "text-(--p-good)" : SEV[x.severity].text
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-(--p-good)" : SEV[x.severity].bg}`} aria-hidden />
                      {active ? (lang === "es" ? "Cumple" : "Meets") : SEV[x.severity][lang]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {/* Para lectores de pantalla: el resultado en una frase */}
      <span className="sr-only">{lang === "es" ? `Preparación ${pct} %` : `Readiness ${pct}%`}</span>
    </div>
  );
}
