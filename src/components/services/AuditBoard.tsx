"use client";

import { useEffect, useRef, useState } from "react";
import type { COMPLIANCE } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import PhaseSwitch, { usePhase } from "./PhaseSwitch";

type Audit = (typeof COMPLIANCE)["audit"];
type Severity = Audit["items"][number]["severity"];

/** Un número que llega a su valor en vez de saltar. */
function useTween(target: number, ms = 700) {
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

/*
 * El árbol de trazabilidad de un lote de ejemplo: el producto terminado, sus
 * dos lotes intermedios y sus cuatro materias primas. Hoy se corta en una
 * (`broken`): esa materia prima no tiene registro. Coordenadas en % del
 * recuadro; las ramas van de borde a borde de las pastillas.
 */
const TREE = {
  root: { y: 50, label: "PT 2410", out: 25 },
  mid: [
    { y: 25, label: { es: "Mezcla 118", en: "Blend 118" } },
    { y: 75, label: { es: "Envase 77", en: "Pack 77" } },
  ],
  midIn: 36,
  midOut: 64,
  leaf: [
    { y: 9, label: "MP-03", from: 0 },
    { y: 36, label: "MP-07", from: 0 },
    { y: 64, label: "MP-12", from: 1 },
    { y: 91, label: "MP-21", from: 1 },
  ],
  leafIn: 79,
  broken: 2,
};

/**
 * El tablero de cumplimiento, en la ficha del servicio.
 *
 * Matthew, 18 oct 2026, sobre el simulacro en el que se marcaban casillas:
 * «lo de marcar en la autoevaluación no me gusta». Pidió una mezcla de tres
 * cosas: un informe de auditoría terminado, un tablero de calidad y la
 * trazabilidad de un lote. Así que el panel enseña la misma planta de
 * ejemplo hoy y con Bouw, sin que el visitante tenga que hacer nada:
 *
 * - El informe: preparación en un indicador por segmentos, cuántos
 *   hallazgos hay de cada gravedad y la lista de hallazgos del inspector
 *   (crítico, mayor o menor, o «Cumple»).
 * - El tablero de calidad: CAPA abiertas y cerradas, lotes retenidos.
 * - La trazabilidad de un lote: del producto terminado a sus materias
 *   primas. Hoy el rastro se corta en una sin registro; con Bouw llega
 *   entero.
 *
 * Un selector pasa de hoy a con Bouw (solo, mientras se ve). La planta y sus
 * cifras son de ejemplo y la cabecera lo dice.
 */
export default function AuditBoard({ audit }: { audit: Audit }) {
  const { t, lang } = useLang();
  const root = useRef<HTMLDivElement>(null);
  const { phase, pick, running } = usePhase(root);
  const bouw = phase === "bouw";
  const k = bouw ? 1 : 0;

  const meets = (id: string) => bouw || audit.start.includes(id);
  const total = audit.items.reduce((s, x) => s + x.weight, 0);
  const pct = Math.round((audit.items.filter((x) => meets(x.id)).reduce((s, x) => s + x.weight, 0) / total) * 100);
  const shown = useTween(pct);
  const lit = Math.round((shown / 100) * SEGS);
  const missing = audit.items.filter((x) => !meets(x.id));
  const count = (s: Severity) => missing.filter((x) => x.severity === s).length;
  const level = pct === 100 ? "high" : pct >= 60 ? "mid" : "low";
  const tone =
    level === "high"
      ? { bg: "bg-(--p-good)", stroke: "var(--p-good)" }
      : level === "mid"
        ? { bg: "bg-orange-brand", stroke: "var(--color-orange-brand)" }
        : { bg: "bg-(--p-bad)", stroke: "var(--p-bad)" };

  const S = audit.sample;
  const board = [
    { label: lang === "es" ? "CAPA abiertas" : "Open CAPAs", v: S.capaOpen[k], bad: S.capaOpen[k] > 0, wide: false },
    { label: lang === "es" ? "CAPA cerradas" : "Closed CAPAs", v: S.capaClosed[k], bad: false, wide: true },
    { label: lang === "es" ? "Lotes retenidos" : "Lots on hold", v: S.held[k], bad: S.held[k] > 0, wide: false },
  ];

  const label = (x: string) => <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-ink-dim @2xl:text-[8.5px]">{x}</span>;

  return (
    <div ref={root} className="@container absolute inset-0 flex flex-col bg-(--p-window)">
      {/* Cabecera del informe */}
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-(--p-line) px-2.5 @md:px-3.5">
        <PhaseSwitch phase={phase} pick={pick} running={running} />
        <span className="hidden min-w-0 truncate font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim @xl:inline">
          {t(audit.intro)}
        </span>
        <span
          className={`ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#fff] transition-colors duration-500 @md:text-[10.5px] ${tone.bg}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#fff]" aria-hidden />
          {t(audit.levels[level])}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] @min-[26rem]:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] @min-[26rem]:grid-rows-1 @min-[38rem]:grid-cols-[minmax(0,0.8fr)_minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* El informe: preparación y hallazgos por gravedad, y el tablero de calidad */}
        <div className="flex min-h-0 items-center gap-3 border-b border-(--p-line) px-3 py-2 @min-[26rem]:flex-col @min-[26rem]:items-stretch @min-[26rem]:justify-between @min-[26rem]:gap-0 @min-[26rem]:border-b-0 @min-[26rem]:border-r @min-[26rem]:py-2.5">
          <div className="relative w-20 shrink-0 @min-[26rem]:mx-auto @min-[26rem]:w-full @min-[26rem]:max-w-[140px] @min-[38rem]:max-w-[170px]">
            <svg viewBox="0 6 120 62" className="block w-full" aria-hidden>
              {Array.from({ length: SEGS }, (_, i) => (
                <path
                  key={i}
                  d={seg(i)}
                  fill="none"
                  strokeWidth={10}
                  style={{ stroke: i < lit ? tone.stroke : "var(--p-line)", transition: "stroke 300ms" }}
                />
              ))}
            </svg>
            <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
              <span className="font-display text-[1.05rem] font-bold leading-none text-ink tabular-nums @min-[26rem]:text-[1.7rem]">
                {Math.round(shown)}
                <span className="text-[0.5em]"> %</span>
              </span>
            </div>
          </div>
          <p className="hidden text-center @min-[26rem]:mt-0.5 @min-[26rem]:block">{label(t(audit.score))}</p>

          <div className="grid flex-1 grid-cols-3 gap-1 @min-[26rem]:mt-2 @min-[26rem]:flex-none">
            {(["critical", "major", "minor"] as const).map((s) => (
              <div key={s} className="rounded-md px-1 py-1 text-center ring-1 ring-(--p-line)">
                <span
                  className={`block font-display text-[14px] font-bold leading-none tabular-nums transition-colors duration-500 ${count(s) ? SEV[s].text : "text-ink-dim"}`}
                >
                  {count(s)}
                </span>
                <span className="mt-0.5 block truncate font-mono text-[7px] uppercase tracking-[0.1em] text-ink-dim">
                  {SEV[s][lang]}
                </span>
              </div>
            ))}
          </div>

          <dl className="hidden @min-[26rem]:mt-2 @min-[26rem]:block">
            {board.map((b) => (
              // Donde el tablero va en dos columnas, sin las CAPA cerradas: no caben
              <div
                key={b.label}
                className={`items-baseline justify-between border-t border-(--p-line) py-1 ${b.wide ? "hidden @min-[38rem]:flex" : "flex"}`}
              >
                <dt>{label(b.label)}</dt>
                <dd
                  className={`font-display text-[13px] font-bold tabular-nums transition-colors duration-500 ${b.bad ? "text-(--p-bad)" : bouw ? "text-(--p-good)" : "text-ink"}`}
                >
                  {b.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Los hallazgos del inspector */}
        <div className="flex min-h-0 flex-col">
          <div className="hidden h-6 shrink-0 items-center border-b border-(--p-line) px-3 @min-[26rem]:flex">
            {label(lang === "es" ? "Hallazgos del inspector" : "Inspector's findings")}
            <span className="ml-auto">{label(lang === "es" ? "Gravedad" : "Severity")}</span>
          </div>
          <ul className="grid min-h-0 flex-1 grid-cols-2 content-center gap-x-2 gap-y-1 px-2.5 py-2 @min-[26rem]:grid-cols-1 @min-[26rem]:content-stretch @min-[26rem]:gap-0 @min-[26rem]:p-0">
            {audit.items.map((x, i) => {
              const ok = meets(x.id);
              return (
                <li
                  key={x.id}
                  className="flex min-w-0 items-center gap-2 @min-[26rem]:border-b @min-[26rem]:border-(--p-line) @min-[26rem]:px-3 @min-[26rem]:last:border-b-0"
                >
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500 ${ok ? "bg-(--p-good)" : SEV[x.severity].bg}`}
                    style={{ transitionDelay: `${i * 70}ms` }}
                  />
                  <span className={`min-w-0 flex-1 truncate text-[10.5px] font-semibold @2xl:text-[11.5px] ${ok ? "text-ink-soft" : "text-ink"}`}>
                    {t(x.short)}
                  </span>
                  <span
                    className={`hidden shrink-0 font-mono text-[8px] font-semibold uppercase tracking-[0.12em] transition-colors duration-500 @min-[26rem]:inline ${ok ? "text-(--p-good)" : SEV[x.severity].text}`}
                    style={{ transitionDelay: `${i * 70}ms` }}
                  >
                    {ok ? (lang === "es" ? "Cumple" : "Meets") : SEV[x.severity][lang]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* La trazabilidad de un lote, del producto terminado a la materia prima */}
        <div className="hidden min-h-0 flex-col border-l border-(--p-line) px-3 py-2 @min-[38rem]:flex">
          <p className="flex items-center gap-2">
            {label(lang === "es" ? "Trazabilidad · lote 2410" : "Traceability · lot 2410")}
          </p>
          {/* Al cambiar de hoy a con Bouw, el árbol entra entero (ver `.pain-in`) */}
          <div key={phase} className="pain-in relative mt-1.5 min-h-0 flex-1">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
              {TREE.mid.map((m, i) => (
                <path
                  key={`m${i}`}
                  d={`M ${TREE.root.out} ${TREE.root.y} C 31 ${TREE.root.y}, 30 ${m.y}, ${TREE.midIn} ${m.y}`}
                  fill="none"
                  strokeWidth={1.4}
                  vectorEffect="non-scaling-stroke"
                  style={{ stroke: "var(--p-good)" }}
                />
              ))}
              {TREE.leaf.map((l, i) => {
                const m = TREE.mid[l.from];
                const cut = !bouw && i === TREE.broken;
                return (
                  <path
                    key={`l${i}`}
                    d={`M ${TREE.midOut} ${m.y} C 72 ${m.y}, 71 ${l.y}, ${TREE.leafIn} ${l.y}`}
                    fill="none"
                    strokeWidth={1.4}
                    vectorEffect="non-scaling-stroke"
                    style={{
                      stroke: cut ? "var(--p-bad)" : "var(--p-good)",
                      strokeDasharray: cut ? "3 3" : undefined,
                    }}
                  />
                );
              })}
            </svg>
            {/* Los nudos */}
            <span
              className="absolute left-0 -translate-y-1/2 rounded-md bg-(--p-accent) px-1.5 py-0.5 font-mono text-[8.5px] font-semibold text-(--p-on-accent)"
              style={{ top: `${TREE.root.y}%` }}
            >
              {TREE.root.label}
            </span>
            {TREE.mid.map((m) => (
              <span
                key={m.label.es}
                className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[8px] text-ink ring-1 ring-(--p-line) bg-(--p-window)"
                style={{ top: `${m.y}%` }}
              >
                {m.label[lang]}
              </span>
            ))}
            {TREE.leaf.map((l, i) => {
              const cut = !bouw && i === TREE.broken;
              return (
                <span
                  key={l.label}
                  className={`absolute right-0 inline-flex -translate-y-1/2 items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[8px] ring-1 bg-(--p-window) ${
                    cut ? "text-(--p-bad) ring-(--p-bad)" : "text-ink ring-(--p-line)"
                  }`}
                  style={{ top: `${l.y}%` }}
                >
                  {cut && <span aria-hidden>✕</span>}
                  {l.label}
                </span>
              );
            })}
          </div>
          <p
            className={`mt-1 truncate text-[10px] font-semibold transition-colors duration-500 ${bouw ? "text-(--p-good)" : "text-(--p-bad)"}`}
          >
            {bouw
              ? lang === "es"
                ? "Rastreado completo en minutos"
                : "Fully traced in minutes"
              : lang === "es"
                ? "MP-12 sin registro: el rastro se corta"
                : "MP-12 has no record: the trail breaks"}
          </p>
        </div>
      </div>
      <span className="sr-only">{lang === "es" ? `Preparación ${pct} %` : `Readiness ${pct}%`}</span>
    </div>
  );
}

