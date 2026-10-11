"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { ALL, Line, NONE, steady, type Levers, type Steady } from "./engine";
import { drawLine, readPalette, warm, type Palette } from "./draw";

/**
 * La línea, en marcha.
 *
 * Matthew (10 oct 2026): «hacer animaciones de una línea para explicar cómo
 * funciona, que el cliente vea cómo se puede optimizar y cómo lo hacemos».
 *
 * Es la línea del caso de mejora continua simulada en un lienzo: piezas que
 * entran, cuatro estaciones, la inspección que manda piezas a reproceso por
 * arriba y el palé al final. Abajo, las palancas que se usaron en el proyecto,
 * en el orden en que se usaron: mapear, ordenar y estandarizar, corregir y
 * sostener. Al activarlas la línea cambia delante de quien mira, sin
 * reiniciar: la cola de la estación 2 se vacía sola.
 *
 * Las dos cifras del proyecto (−15 % de preparación, −20 % de reprocesos)
 * están dentro del modelo; el resto es de la simulación, y se dice.
 */

const T = {
  es: {
    title: "La línea, en marcha",
    sub: "Activa las mejoras en el orden en que las hicimos y mira qué le pasa a la línea.",
    levers: {
      vsm: ["Mapear el flujo", "VSM: dónde se pierde el tiempo"],
      setup: ["Estándar y 5S", "−15 % por cambio, nada que buscar"],
      rework: ["Acciones correctivas", "−20 % de piezas a reproceso"],
      control: ["KPI y capacitación", "4 operadores sostienen el estándar"],
    },
    before: "Antes",
    after: "Después",
    play: "Seguir",
    pause: "Pausa",
    restart: "Reiniciar",
    kpi: {
      rate: "Ritmo de salida",
      wip: "Inventario en la línea",
      lead: "Tiempo de una pieza en la línea",
      good: "Piezas buenas",
      rework: "reprocesadas",
      index: "índice, antes = 100",
      now: "ahora",
    },
    measured: "Medido en el proyecto",
    setupCut: "−15 % tiempo de preparación",
    reworkCut: "−20 % reprocesos",
    note: "Simulación ilustrativa. Las dos cifras del proyecto están dentro del modelo; los tiempos de ciclo, el lote y los índices son de la simulación.",
    canvas: "Simulación de una línea de cuatro estaciones con inspección, reproceso y palé de salida.",
    labels: {
      in: "Entrada",
      insp: "Inspección",
      pallet: "Palé",
      rework: "Reproceso",
      setup: "Cambio de formato · línea parada",
      search: "buscando",
      wait: "Espera",
      va: "Valor agregado",
      waitTag: "Espera · cambio de formato",
      defectTag: "Defectos · reproceso",
      motionTag: "Movimiento · buscar herramienta",
      invTag: "Inventario",
      leadBar: "Tiempo en la línea",
      ff: "Adelantando 3 horas de línea",
    },
    story: {
      base: "Estado actual: la estación 2 trabaja al límite. Recibe las piezas nuevas y también las que vuelven de reproceso, así que su cola crece y la línea se llena de inventario esperando.",
      vsm: "El mapa del flujo marca el desperdicio: inventario esperando (los triángulos), la línea parada en cada cambio de formato y piezas que se hacen dos veces.",
      setup: "Con un procedimiento igual en los dos turnos y cada herramienta en su lugar, el cambio de formato dura 15 % menos y nadie para a buscar. La estación 2 sale del límite y su cola empieza a vaciarse.",
      rework: "Las acciones correctivas atacan la causa de los defectos: 20 % menos piezas vuelven a reproceso, o sea, menos piezas hechas dos veces.",
      both: "Con las dos mejoras la estación 2 queda con holgura y su cola se vacía: menos inventario y cada pieza pasa mucho menos tiempo en la línea. Quitar un poco de carga al cuello de botella cambia toda la línea.",
      control: "Los KPI por turno y los cuatro operadores capacitados hacen que el estándar se mantenga cuando ya no estamos.",
    },
  },
  en: {
    title: "The line, running",
    sub: "Switch on the improvements in the order we made them and watch what happens to the line.",
    levers: {
      vsm: ["Map the flow", "VSM: where time is lost"],
      setup: ["Standard work and 5S", "−15% per changeover, nothing to search for"],
      rework: ["Corrective actions", "−20% of parts to rework"],
      control: ["KPIs and training", "4 operators keep the standard"],
    },
    before: "Before",
    after: "After",
    play: "Play",
    pause: "Pause",
    restart: "Restart",
    kpi: {
      rate: "Output rate",
      wip: "Inventory on the line",
      lead: "Time a part spends on the line",
      good: "Good parts",
      rework: "reworked",
      index: "index, before = 100",
      now: "now",
    },
    measured: "Measured in the project",
    setupCut: "−15% setup time",
    reworkCut: "−20% rework",
    note: "Illustrative simulation. The project's two results are built into the model; cycle times, batch size and the indices come from the simulation.",
    canvas: "Simulation of a four-station line with inspection, rework and an output pallet.",
    labels: {
      in: "In",
      insp: "Inspection",
      pallet: "Pallet",
      rework: "Rework",
      setup: "Changeover · line stopped",
      search: "searching",
      wait: "Waiting",
      va: "Value added",
      waitTag: "Waiting · changeover",
      defectTag: "Defects · rework",
      motionTag: "Motion · searching for tools",
      invTag: "Inventory",
      leadBar: "Time on the line",
      ff: "Fast-forwarding 3 hours of line time",
    },
    story: {
      base: "Current state: station 2 runs at its limit. It takes the new parts and the ones coming back from rework, so its queue keeps growing and the line fills up with inventory waiting.",
      vsm: "The flow map marks the waste: inventory waiting (the triangles), the line stopped at every changeover and parts made twice.",
      setup: "With the same procedure on both shifts and every tool in its place, a changeover takes 15% less and nobody stops to search. Station 2 is no longer at its limit and its queue starts to empty.",
      rework: "Corrective actions go after the cause of defects: 20% fewer parts come back for rework, which means fewer parts made twice.",
      both: "With both improvements station 2 has room to spare and its queue empties: less inventory, and each part spends far less time on the line. Taking a little load off the bottleneck changes the whole line.",
      control: "Per-shift KPIs and four trained operators keep the standard in place after we leave.",
    },
  },
} as const;

export default function LineSim({ compact = false }: { compact?: boolean }) {
  const { lang } = useLang();
  const tx = T[lang];
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [levers, setLevers] = useState<Levers>(NONE);
  const [speed, setSpeed] = useState(1);
  const [running, setRunning] = useState(true);
  const [live, setLive] = useState({ wip: 0, good: 0, reworked: 0 });
  const [steadyMap, setSteadyMap] = useState<Record<string, Steady> | null>(null);
  // Perezosa: `useRef(warm(NONE))` correría cinco horas de línea en cada render
  const line = useRef<Line>(null as unknown as Line);
  if (!line.current) line.current = warm(NONE);
  /** Minutos de línea por adelantar deprisa tras un cambio (ver `toggle`). */
  const ff = useRef(0);
  const levRef = useRef(levers);
  const runRef = useRef(running);
  const speedRef = useRef(speed);
  const pal = useRef<Palette | null>(null);

  useEffect(() => {
    levRef.current = levers;
    line.current.levers = { ...levers };
  }, [levers]);
  useEffect(() => {
    runRef.current = running;
  }, [running]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Quien pide menos movimiento la encuentra en pausa
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setRunning(false);
  }, []);

  // Los índices: corridas largas sin dibujar, fuera del primer pintado
  useEffect(() => {
    const id = window.setTimeout(() => {
      const map: Record<string, Steady> = {};
      for (const s of [false, true]) {
        for (const r of [false, true]) {
          map[`${s}${r}`] = steady({ ...NONE, setup: s, rework: r });
        }
      }
      setSteadyMap(map);
    }, 300);
    return () => window.clearTimeout(id);
  }, []);

  // Colores del modo actual, y otra vez si el visitante cambia de modo
  useEffect(() => {
    const read = () => {
      if (wrap.current) pal.current = readPalette(wrap.current);
    };
    read();
    window.addEventListener("bouw:theme", read);
    return () => window.removeEventListener("bouw:theme", read);
  }, []);

  /* ---------------------------------------------------------------- */
  /* Dibujo                                                            */
  /* ---------------------------------------------------------------- */

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, W: number, H: number) => {
      if (!pal.current) return;
      drawLine(ctx, W, H, {
        line: line.current,
        pal: pal.current,
        levers: levRef.current,
        lab: T[lang].labels,
        ff: ff.current,
      });
    },
    [lang],
  );

  // Bucle: solo mientras se ve, y a la velocidad elegida
  useEffect(() => {
    const cv = canvas.current;
    const box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let last = performance.now();
    let visible = true;
    let W = 0;
    let H = 0;
    let lastUi = 0;

    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(ctx, W, H);
    };
    const ro = new ResizeObserver(size);
    ro.observe(cv);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) {
        last = performance.now();
        loop(last);
      }
    });
    io.observe(cv);

    const loop = (now: number) => {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      const dtReal = Math.min((now - last) / 1000, 0.1);
      last = now;
      // Tras activar una mejora, tres horas de línea en cuatro segundos: la cola
      // tarda ese tiempo en vaciarse y a velocidad normal no se vería
      const fast = ff.current > 0;
      if (runRef.current || fast) {
        // 1 s real = 1.5 min de línea a velocidad normal
        let sim = fast ? Math.min(ff.current, dtReal * 50) : dtReal * 1.5 * speedRef.current;
        if (fast) ff.current -= sim;
        while (sim > 0) {
          const d = Math.min(0.05, sim);
          line.current.step(d);
          sim -= d;
        }
      }
      draw(ctx, W, H);
      if (now - lastUi > 250) {
        lastUi = now;
        const L = line.current;
        setLive({ wip: L.wip(), good: L.stats.good, reworked: L.stats.reworked });
      }
      raf = requestAnimationFrame(loop);
    };
    const onVis = () => {
      if (!document.hidden) {
        last = performance.now();
        loop(last);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [draw]);

  /* ---------------------------------------------------------------- */
  /* Textos e índices                                                  */
  /* ---------------------------------------------------------------- */

  const base = steadyMap?.["falsefalse"];
  const cur = steadyMap?.[`${levers.setup}${levers.rework}`];
  const idx = (a?: number, b?: number) => (a && b ? Math.round((a / b) * 100) : null);
  const rateIdx = idx(cur?.rate, base?.rate);
  const wipIdx = idx(cur?.wip, base?.wip);
  const leadIdx = idx(cur?.lead, base?.lead);

  const story = useMemo(() => {
    const s = tx.story;
    let main: string = s.base;
    if (levers.setup && levers.rework) main = s.both;
    else if (levers.rework) main = s.rework;
    else if (levers.setup) main = s.setup;
    else if (levers.vsm) main = s.vsm;
    return levers.control ? `${main} ${s.control}` : main;
  }, [levers, tx]);

  const toggle = (key: keyof Levers) => {
    if (key === "setup" || key === "rework") ff.current = 200;
    setLevers((l) => ({ ...l, [key]: !l[key] }));
  };
  const order: (keyof Levers)[] = ["vsm", "setup", "rework", "control"];
  const isAll = order.every((k) => levers[k]);
  const isNone = order.every((k) => !levers[k]);

  return (
    <div
      ref={wrap}
      className={`project relative ${compact ? "" : "rounded-[28px] border border-(--p-line) bg-(--p-accent-soft) p-4 sm:p-6"}`}
      style={{ "--p-h": 62 } as CSSProperties}
    >
      {!compact && (
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <h3 className="font-display text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-none text-ink">{tx.title}</h3>
            <p className="mt-2 max-w-xl text-[15px] leading-snug text-ink-soft">{tx.sub}</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 font-mono text-[11px]">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                aria-pressed={speed === s}
                className={`h-8 min-w-9 rounded-full border px-2 transition-colors ${
                  speed === s ? "border-(--p-accent) bg-(--p-accent) text-(--p-on-accent)" : "border-(--p-line) text-ink-dim hover:text-ink"
                }`}
              >
                {s}×
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRunning((r) => !r)}
              className="ml-1 h-8 rounded-full border border-(--p-line) px-3 text-ink hover:border-(--p-accent)"
            >
              {running ? `❚❚ ${tx.pause}` : `▶ ${tx.play}`}
            </button>
            <button
              type="button"
              onClick={() => {
                line.current = warm(levRef.current);
                ff.current = 0;
              }}
              className="h-8 rounded-full border border-(--p-line) px-3 text-ink-dim hover:text-ink"
            >
              ↺ {tx.restart}
            </button>
          </div>
        </div>
      )}

      {/* Palancas, en el orden del proyecto */}
      <div className="mt-5 flex flex-wrap items-stretch gap-2">
        <div className="flex overflow-hidden rounded-full border border-(--p-line) font-mono text-[11px] uppercase tracking-[0.16em]">
          <button
            type="button"
            onClick={() => {
              // El antes, como se encuentra la línea: ya cargada
              line.current = warm(NONE);
              ff.current = 0;
              setLevers(NONE);
            }}
            aria-pressed={isNone}
            className={`px-4 py-2 transition-colors ${isNone ? "bg-(--p-accent) text-(--p-on-accent)" : "text-ink-dim hover:text-ink"}`}
          >
            {tx.before}
          </button>
          <button
            type="button"
            onClick={() => {
              ff.current = 200;
              setLevers(ALL);
            }}
            aria-pressed={isAll}
            className={`px-4 py-2 transition-colors ${isAll ? "bg-(--p-accent) text-(--p-on-accent)" : "text-ink-dim hover:text-ink"}`}
          >
            {tx.after}
          </button>
        </div>
        {order.map((key, i) => {
          const [name, hint] = tx.levers[key];
          const on = levers[key];
          return (
            <button
              key={key}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => toggle(key)}
              className={`group flex min-w-[11rem] flex-1 items-center gap-3 rounded-2xl border px-3.5 py-2 text-left transition-colors ${
                on ? "border-(--p-accent) bg-(--p-window)" : "border-(--p-line) hover:border-(--p-accent)"
              }`}
            >
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${on ? "bg-(--p-accent)" : "bg-(--p-line)"}`}
                aria-hidden
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-(--p-window) shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-ink">
                  <span className="mr-1.5 font-mono text-[10px] text-(--p-accent)">{i + 1}</span>
                  {name}
                </span>
                <span className="block text-[11.5px] leading-snug text-ink-dim">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* La línea */}
      <canvas
        ref={canvas}
        role="img"
        aria-label={tx.canvas}
        className="mt-4 block w-full rounded-2xl bg-(--p-window)"
        style={{ height: compact ? "clamp(220px, 34vw, 380px)" : "clamp(260px, 36vw, 460px)" }}
      />

      <p aria-live="polite" className="mt-4 min-h-[3em] max-w-4xl text-[15px] leading-relaxed text-ink">
        {story}
      </p>

      {/* Indicadores */}
      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={tx.kpi.rate} value={rateIdx} sub={tx.kpi.index} better="up" />
        <Kpi label={tx.kpi.wip} value={wipIdx} sub={`${tx.kpi.index} · ${live.wip} ${tx.kpi.now}`} better="down" />
        <Kpi label={tx.kpi.lead} value={leadIdx} sub={tx.kpi.index} better="down" />
        <div className="rounded-2xl border border-(--p-line) bg-(--p-window) px-4 py-3">
          <dt className="text-[12px] text-ink-dim">{tx.kpi.good}</dt>
          <dd className="mt-1 font-display text-[1.9rem] font-bold leading-none text-ink tabular-nums">{live.good}</dd>
          <dd className="mt-1 text-[11.5px] text-ink-dim tabular-nums">
            {live.reworked} {tx.kpi.rework}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[12px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-dim">{tx.measured}</span>
        <span
          className={`rounded-full border px-3 py-1 font-semibold transition-colors ${
            levers.setup ? "border-(--p-accent) bg-(--p-accent) text-(--p-on-accent)" : "border-(--p-line) text-ink-dim"
          }`}
        >
          {tx.setupCut}
        </span>
        <span
          className={`rounded-full border px-3 py-1 font-semibold transition-colors ${
            levers.rework ? "border-(--p-accent) bg-(--p-accent) text-(--p-on-accent)" : "border-(--p-line) text-ink-dim"
          }`}
        >
          {tx.reworkCut}
        </span>
      </div>
      <p className="mt-3 max-w-3xl text-[12px] leading-relaxed text-ink-dim">{tx.note}</p>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  better,
}: {
  label: string;
  value: number | null;
  sub: string;
  better: "up" | "down";
}) {
  const delta = value === null ? 0 : value - 100;
  const good = better === "up" ? delta > 0 : delta < 0;
  return (
    <div className="rounded-2xl border border-(--p-line) bg-(--p-window) px-4 py-3">
      <dt className="text-[12px] text-ink-dim">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[1.9rem] font-bold leading-none text-ink tabular-nums">{value ?? "…"}</span>
        {value !== null && delta !== 0 && (
          <span className={`font-mono text-[12px] font-semibold ${good ? "text-(--p-good)" : "text-orange-light"}`}>
            {delta > 0 ? "+" : "−"}
            {Math.abs(delta)}
          </span>
        )}
      </dd>
      <dd className="mt-1 text-[11.5px] text-ink-dim">{sub}</dd>
    </div>
  );
}
