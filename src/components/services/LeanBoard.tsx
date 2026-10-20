"use client";

import Image from "next/image";
import { useRef } from "react";
import { P } from "@/components/linea/engine";
import { useLang } from "@/lib/i18n";
import PhaseSwitch, { usePhase, type Phase } from "./PhaseSwitch";

/**
 * El tablero de Lean, en la ficha del servicio.
 *
 * Matthew, 18 oct 2026, sobre la simulación con piezas en movimiento: «esas
 * cajas que se mueven, esas animaciones, no me gustan». Pidió una mezcla de
 * tres cosas: un tablero de resultados, el mapa de flujo de valor y la
 * ilustración de la planta. Así que el panel es eso, sin piezas corriendo:
 *
 * - La planta en isométrico, hoy o con Bouw (las mismas ilustraciones del
 *   video), con un acercamiento lento.
 * - Tres resultados en barras, antes y después: preparación y reprocesos
 *   (los del caso, en índice con el antes en 100) y el tiempo de entrega
 *   (el del modelo de la línea).
 * - El mapa de flujo de valor de la línea de cuatro estaciones: tiempo de
 *   ciclo de cada una, el inventario que espera delante (triángulo, como se
 *   dibuja en un VSM) y la línea de tiempo con la entrega contra el tiempo
 *   que agrega valor.
 *
 * Un selector pasa de hoy a con Bouw (solo, mientras se ve). Las cifras del
 * mapa salen de una corrida larga del modelo (`engine`), la misma que usa
 * la simulación del caso.
 */

type Profile = { lead: number; queues: number[] };

/*
 * Entrega media y piezas que esperan delante de cada estación, en una corrida
 * de 40 h del modelo (`engine.ts`, semilla 11, tras 4 h de arranque).
 *
 * Iban calculadas en el navegador al cargar la página: dos corridas de 52 800
 * pasos, 0,67 s en un ordenador y casi 3 s de pantalla congelada en un
 * teléfono, aunque el tablero estuviera tres pantallas más abajo («arregla la
 * velocidad», Matthew, 19 oct 2026). Con semilla fija dan siempre lo mismo,
 * así que van ya hechas. Si cambia `engine.ts`, se recalculan con la misma
 * corrida y se copian aquí.
 */
const PROFILE: Record<Phase, Profile> = {
  hoy: { lead: 29.03, queues: [6.35, 6.82, 0.65, 0.49] },
  bouw: { lead: 8.1, queues: [0.31, 1.05, 0.35, 0.34] },
};

const COPY = {
  es: {
    map: "Mapa de flujo de valor",
    plant: { hoy: "Planta · hoy", bouw: "Planta · con Bouw" },
    alt: {
      hoy: "Planta en isométrico: recorridos cruzados, piezas apiladas y una estación que frena a las demás",
      bouw: "La misma planta ordenada: un solo flujo, cada cosa en su sitio",
    },
    kpis: [
      { label: "Tiempo de preparación", src: "caso", unit: "", note: "índice" },
      { label: "Reprocesos", src: "caso", unit: "", note: "índice" },
      { label: "Tiempo de entrega", src: "modelo", unit: "min", note: "" },
    ],
    before: "Hoy",
    after: "Bouw",
    ct: "C/T",
    lead: "Entrega",
    va: "Valor agregado",
    stations: ["E1", "E2", "E3", "Insp."],
  },
  en: {
    map: "Value stream map",
    plant: { hoy: "Plant · today", bouw: "Plant · with Bouw" },
    alt: {
      hoy: "Isometric plant: crossing paths, piled-up parts and one station holding the rest back",
      bouw: "The same plant organized: one flow, everything in its place",
    },
    kpis: [
      { label: "Setup time", src: "case", unit: "", note: "index" },
      { label: "Rework", src: "case", unit: "", note: "index" },
      { label: "Lead time", src: "model", unit: "min", note: "" },
    ],
    before: "Today",
    after: "Bouw",
    ct: "C/T",
    lead: "Lead",
    va: "Value added",
    stations: ["S1", "S2", "S3", "Insp."],
  },
} as const;

export default function LeanBoard() {
  const { lang } = useLang();
  const tx = COPY[lang];
  const root = useRef<HTMLDivElement>(null);
  const { phase, pick, running } = usePhase(root);
  const prof = PROFILE;

  const nf = new Intl.NumberFormat(lang === "es" ? "es-EC" : "en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const ni = new Intl.NumberFormat(lang === "es" ? "es-EC" : "en-US", { maximumFractionDigits: 0 });
  const bouw = phase === "bouw";
  const cur = prof[phase];
  const va = P.cycle.reduce((s, c) => s + c, 0);

  // Los tres resultados: antes y después, en la misma escala
  const kpis = [
    { ...tx.kpis[0], a: 100, b: 100 * (1 - P.setupCut), fmt: ni },
    { ...tx.kpis[1], a: 100, b: 100 * (1 - P.defectCut), fmt: ni },
    { ...tx.kpis[2], a: prof.hoy?.lead ?? 0, b: prof.bouw?.lead ?? 0, fmt: ni },
  ];

  return (
    <div ref={root} className="@container absolute inset-0 flex flex-col bg-(--p-window)">
      {/* Barra: hoy o con Bouw */}
      <div className="flex h-10 shrink-0 items-center gap-3 border-b border-(--p-line) px-2.5 @md:px-3.5">
        <PhaseSwitch phase={phase} pick={pick} running={running} />
        <span className="ml-auto hidden truncate font-mono text-[9px] uppercase tracking-[0.18em] text-ink-dim @md:inline">
          {tx.map} · {lang === "es" ? "línea de 4 estaciones" : "4-station line"}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-2 p-2 @md:gap-2.5 @md:p-2.5">
        <div className="grid min-h-0 grid-cols-[minmax(0,1fr)] gap-2 @min-[30rem]:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] @md:gap-2.5">
          {/* La planta */}
          <div className="relative min-h-0 overflow-hidden rounded-lg bg-[#0b1626] ring-1 ring-(--p-line)">
            {(["hoy", "bouw"] as const).map((p) => (
              <Image
                key={p}
                src={`/servicios/lean-${p === "hoy" ? "antes" : "despues"}.webp`}
                alt={tx.alt[p]}
                fill
                sizes="(max-width: 1024px) 60vw, 25vw"
                className={`lean-zoom object-cover transition-opacity duration-700 ${phase === p ? "opacity-100" : "opacity-0"}`}
              />
            ))}
            <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1.5 rounded-full bg-[rgba(7,17,31,0.82)] px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#eef3f9]">
              <span className={`h-1.5 w-1.5 rounded-full ${bouw ? "bg-[#3ecf8e]" : "bg-orange-brand"}`} aria-hidden />
              {tx.plant[phase]}
            </span>
          </div>

          {/* Los resultados, antes y después */}
          <div className="hidden min-h-0 flex-col justify-between gap-1.5 overflow-hidden @min-[30rem]:flex">
            {kpis.map((k) => {
              const d = k.a ? Math.round((k.b / k.a - 1) * 100) : 0;
              const max = Math.max(k.a, k.b, 1);
              return (
                <div key={k.label} className="rounded-lg px-2.5 py-1 ring-1 ring-(--p-line) @2xl:py-2">
                  <p className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.12em] text-ink-dim @2xl:text-[8.5px]">
                    <span className="truncate">{k.label}</span>
                    <span className="ml-auto shrink-0 rounded-sm bg-(--p-accent-soft) px-1 text-(--p-accent)">{k.src}</span>
                  </p>
                  <div className="mt-0.5 flex items-end gap-2 @2xl:mt-1">
                    <div className="min-w-0 flex-1 space-y-[2px] @2xl:space-y-[3px]">
                      {[
                        { v: k.a, on: !bouw, color: "bg-orange-brand", label: tx.before },
                        { v: k.b, on: bouw, color: "bg-(--p-good)", label: tx.after },
                      ].map((bar) => (
                        <div key={bar.label} className="flex items-center gap-1.5">
                          <span className="w-7 shrink-0 font-mono text-[7.5px] leading-[9px] uppercase tracking-[0.1em] text-ink-dim">{bar.label}</span>
                          <span className="relative h-[6px] min-w-0 flex-1 rounded-sm bg-(--p-line)/60 @2xl:h-[7px]">
                            <span
                              className={`absolute inset-y-0 left-0 rounded-sm transition-[width,opacity] duration-700 ${bar.color} ${bar.on ? "opacity-100" : "opacity-35"}`}
                              style={{ width: `${(bar.v / max) * 100}%` }}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                    <span className="shrink-0 text-right leading-none">
                      <span
                        className={`block font-display text-[17px] font-bold tabular-nums transition-colors duration-500 @2xl:text-[20px] ${bouw ? "text-(--p-good)" : "text-ink"}`}
                      >
                        {bouw ? `${d > 0 ? "+" : "−"}${Math.abs(d)} %` : `${k.fmt.format(k.a)}${k.unit ? ` ${k.unit}` : ""}`}
                      </span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* En el teléfono, los tres resultados en una fila */}
        <div className="grid grid-cols-3 gap-1.5 @min-[30rem]:hidden">
          {kpis.map((k) => {
            const d = k.a ? Math.round((k.b / k.a - 1) * 100) : 0;
            return (
              <div key={k.label} className="min-w-0 rounded-md px-1.5 py-1 ring-1 ring-(--p-line)">
                <p className="truncate font-mono text-[7.5px] uppercase tracking-[0.1em] text-ink-dim">{k.label}</p>
                <p className={`font-display text-[13px] font-bold tabular-nums ${bouw ? "text-(--p-good)" : "text-ink"}`}>
                  {bouw ? `${d > 0 ? "+" : "−"}${Math.abs(d)} %` : `${k.fmt.format(k.a)}${k.unit ? ` ${k.unit}` : ""}`}
                </p>
              </div>
            );
          })}
        </div>

        {/* El mapa de flujo de valor */}
        <div className="hidden rounded-lg px-2.5 pb-2 pt-1.5 ring-1 ring-(--p-line) @min-[30rem]:block">
          <div className="flex items-end">
            {P.cycle.map((c, i) => (
              <div key={i} className="flex min-w-0 flex-1 items-end">
                {/* Inventario que espera delante: el triángulo del VSM */}
                <div className="flex w-[30%] shrink-0 flex-col items-center pb-1">
                  <svg viewBox="0 0 20 18" className="h-3.5 w-4 @2xl:h-4 @2xl:w-5" aria-hidden>
                    <path
                      d="M10 1 L19 17 H1 Z"
                      fill="none"
                      strokeWidth={1.6}
                      className={`transition-colors duration-500 ${!bouw && (cur?.queues[i] ?? 0) >= 3 ? "stroke-orange-brand" : "stroke-ink-dim"}`}
                    />
                    <text x="10" y="15" textAnchor="middle" fontSize="7" fontWeight="700" className="fill-ink-dim">
                      I
                    </text>
                  </svg>
                  <span
                    className={`mt-0.5 font-mono text-[9px] font-semibold tabular-nums transition-colors duration-500 ${
                      !bouw && (cur?.queues[i] ?? 0) >= 3 ? "text-orange-brand" : "text-ink"
                    }`}
                  >
                    {cur ? nf.format(cur.queues[i]) : "…"}
                  </span>
                </div>
                {/* La estación con su tiempo de ciclo */}
                <div className="min-w-0 flex-1 overflow-hidden rounded-md ring-1 ring-(--p-line)">
                  <p className="truncate bg-(--p-accent-soft) px-1.5 py-0.5 text-center text-[9px] font-semibold text-ink @2xl:text-[10px]">
                    {tx.stations[i]}
                  </p>
                  <p className="truncate px-1.5 py-0.5 text-center font-mono text-[8.5px] text-ink-dim tabular-nums">
                    {tx.ct} {ni.format(c * 60)} s
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* La línea de tiempo: arriba la espera, abajo el tiempo que agrega valor */}
          <div className="mt-1.5 flex items-center gap-3">
            <svg viewBox="0 0 400 14" preserveAspectRatio="none" className="h-3 min-w-0 flex-1" aria-hidden>
              <path
                d={P.cycle
                  .map((_, i) => {
                    const x = i * 100;
                    return `M ${x} 2 H ${x + 30} V 12 H ${x + 100} V 2`;
                  })
                  .join(" ")}
                fill="none"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
                className={`transition-colors duration-500 ${bouw ? "stroke-(--p-good)" : "stroke-orange-brand"}`}
              />
            </svg>
            <p className="shrink-0 text-right font-mono text-[8.5px] uppercase tracking-[0.1em] text-ink-dim">
              {tx.lead}{" "}
              <b className={`font-display text-[13px] normal-case tracking-normal tabular-nums ${bouw ? "text-(--p-good)" : "text-ink"}`}>
                {cur ? `${ni.format(cur.lead)} min` : "…"}
              </b>
              <span className="mx-1.5 text-(--p-line)">|</span>
              {tx.va}{" "}
              <b className="font-display text-[13px] normal-case tracking-normal text-ink tabular-nums">
                {nf.format(va)} min
              </b>
              {cur && (
                <span className="ml-1 normal-case tracking-normal">({ni.format((va / cur.lead) * 100)} %)</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
