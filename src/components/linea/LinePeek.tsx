"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import LoopVideo from "../LoopVideo";
import { drawLine, readPalette, warm, type Labels, type Palette } from "./draw";
import { ALL, NONE, type Line } from "./engine";

/**
 * El caso, en la ficha.
 *
 * Matthew (11 oct 2026): en la ficha de calidad «en lugar de que salgan las
 * fotos así, ya se vea un poco el caso y las fotos también», porque las fotos
 * solas «no me dicen nada de lo que pasa» y nadie entra al caso si no le
 * llama la atención.
 *
 * Arriba, la línea del caso en bucle: antes (la cola de la estación 2
 * crece), las mejoras aplicadas y después (la cola se vacía). Abajo, la planta
 * de verdad, el producto y los dos resultados medidos, que se mueven con la
 * línea: en el antes valen 100 y en el después bajan a 85 y 80.
 */

type Phase = "antes" | "mejorando" | "despues";

const COPY = {
  es: {
    antes: "Antes: la cola crece",
    mejorando: "Aplicando estándar, 5S y correctivas",
    despues: "Después: la cola se vacía",
    setup: "Preparación",
    rework: "Reprocesos",
    plant: "Planta",
    index: "índice",
  },
  en: {
    antes: "Before: the queue grows",
    mejorando: "Applying standard work, 5S and fixes",
    despues: "After: the queue empties",
    setup: "Setup time",
    rework: "Rework",
    plant: "Floor",
    index: "index",
  },
} as const;

const LABELS: Labels = {
  in: "",
  insp: "",
  pallet: "",
  rework: "Reproceso",
  setup: "Cambio de formato",
  search: "",
  wait: "",
  va: "",
  waitTag: "",
  defectTag: "",
  motionTag: "",
  invTag: "",
  leadBar: "",
  ff: "",
};
const LABELS_EN: Labels = { ...LABELS, rework: "Rework", setup: "Changeover" };

/** Segundos de cada fase, y minutos de línea por segundo en cada una. */
const PHASE_S: Record<Phase, number> = { antes: 6.5, mejorando: 3.2, despues: 7 };
const SIM_PER_S: Record<Phase, number> = { antes: 5, mejorando: 60, despues: 5 };

export default function LinePeek({
  video,
  photo,
}: {
  video: { src: string; poster: string };
  photo?: { src: string; alt: string; label: string };
}) {
  const { lang } = useLang();
  const tx = COPY[lang];
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("antes");
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const cv = canvas.current;
    const wrap = box.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lab = lang === "es" ? LABELS : LABELS_EN;
    let pal: Palette = readPalette(wrap);
    let line: Line = warm(NONE);
    let ph: Phase = "antes";
    let phT = 0;
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = performance.now();
    let visible = false;

    const paint = () =>
      drawLine(ctx, W, H, { line, pal, levers: line.levers, lab, ff: 0, mini: true });

    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint();
    };

    // Quien pide menos movimiento ve el después quieto, con sus resultados
    if (still) {
      line = warm(ALL);
      setPhase("despues");
    }

    const go = (next: Phase) => {
      ph = next;
      phT = 0;
      setPhase(next);
      if (next === "mejorando") line.levers = { ...ALL };
      if (next === "antes") {
        // Vuelta al principio: un instante en blanco y la línea cargada otra vez
        setFade(true);
        window.setTimeout(() => {
          line = warm(NONE);
          setFade(false);
        }, 260);
      }
    };

    const loop = (now: number) => {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      phT += dt;
      let sim = dt * SIM_PER_S[ph];
      while (sim > 0) {
        const d = Math.min(0.05, sim);
        line.step(d);
        sim -= d;
      }
      if (phT > PHASE_S[ph]) go(ph === "antes" ? "mejorando" : ph === "mejorando" ? "despues" : "antes");
      paint();
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !still) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(cv);
    const onTheme = () => {
      pal = readPalette(wrap);
      paint();
    };
    const onVis = () => {
      if (!document.hidden && visible && !still) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("bouw:theme", onTheme);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("bouw:theme", onTheme);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [lang]);

  const after = phase === "despues";
  const label = "absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(4,16,31,0.8)] to-transparent px-2.5 pb-1.5 pt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-[#e8eef6]";

  return (
    <div ref={box} className="absolute inset-0 grid grid-rows-[1.35fr_1fr] gap-1.5 p-1.5">
      {/* La línea del caso, en bucle */}
      <div className="relative overflow-hidden rounded-[9px] bg-(--p-window) ring-1 ring-(--p-line)">
        <canvas
          ref={canvas}
          aria-hidden
          className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${fade ? "opacity-0" : "opacity-100"}`}
        />
        <span
          data-dragon-ignore
          className={`absolute left-2.5 top-2.5 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#fff] transition-colors duration-500 ${
            phase === "antes" ? "bg-orange-brand" : phase === "mejorando" ? "bg-(--p-accent)" : "bg-[#17784f]"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full bg-[#fff] ${phase === "mejorando" ? "live-dot" : ""}`} aria-hidden />
          {tx[phase]}
        </span>
      </div>

      {/* Planta, producto y los dos resultados */}
      <div className="grid grid-cols-[0.8fr_0.8fr_1.25fr] gap-1.5">
        <div className="relative overflow-hidden rounded-[9px]">
          <LoopVideo src={video.src} poster={video.poster} label={tx.plant} className="absolute inset-0 h-full w-full object-cover" />
          <span className={label} data-dragon-ignore>
            {tx.plant}
          </span>
        </div>
        {photo && (
          <div className="relative overflow-hidden rounded-[9px]">
            <Image src={photo.src} alt={photo.alt} fill sizes="200px" className="object-cover" />
            <span className={label} data-dragon-ignore>
              {photo.label}
            </span>
          </div>
        )}
        <div className="flex flex-col justify-center gap-2.5 rounded-[9px] bg-(--p-window) px-3 ring-1 ring-(--p-line)">
          {[
            { name: tx.setup, cut: 15 },
            { name: tx.rework, cut: 20 },
          ].map((m) => (
            <div key={m.name}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[11px] text-ink-dim">{m.name}</span>
                <span
                  className={`font-display text-[1.05rem] font-bold leading-none tabular-nums transition-colors duration-500 ${
                    after ? "text-(--p-good)" : "text-ink-dim"
                  }`}
                >
                  {after ? `−${m.cut} %` : "100"}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-(--p-line)">
                <div
                  className={`h-full rounded-full transition-[width,background-color] duration-700 ease-out ${after ? "bg-(--p-good)" : "bg-orange-brand"}`}
                  style={{ width: after ? `${100 - m.cut}%` : "100%" }}
                />
              </div>
            </div>
          ))}
          <span className="text-[9.5px] uppercase tracking-[0.18em] text-ink-dim">{tx.index} · {lang === "es" ? "antes" : "before"} = 100</span>
        </div>
      </div>
    </div>
  );
}
