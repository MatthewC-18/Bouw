"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { readPalette, rr, type Palette } from "./draw";
import { Line, NONE, P, X, steady, type Levers, type Steady } from "./engine";

/**
 * La simulación de flujos, en la ficha de Lean, para tocarla.
 *
 * Matthew, 14 oct 2026. Sobre la primera versión (`LinePeek`): «va muy
 * rápido y no se ve profesional», y la foto del producto «no se entiende».
 * Sobre la segunda (los dos escenarios con índices al lado): «que sea más
 * novedoso y que se entienda a la vista». Sobre la tercera (18 oct): «así se
 * ve muy principiante, debe ser algo más profesional».
 *
 * Así que ahora se presenta como lo que es, un modelo de la línea con su
 * tablero, como lo enseñaría un programa de simulación de planta:
 *
 * - Arriba, las dos palancas como interruptores, con lo que cambia cada una
 *   (los resultados del caso: −15 % de preparación, −20 % de reproceso).
 * - A la izquierda, la línea de hoy y la misma con las mejoras encendidas.
 *   Cada estación lleva su luz de estado (trabajando, esperando, en cambio
 *   de formato) y debajo su ocupación de la última media hora: la que va al
 *   límite, en naranja, es el cuello de botella. La banda corre y se para
 *   cuando la línea cambia de formato; las colas llevan su número.
 * - A la derecha, los indicadores de una corrida larga del modelo
 *   (`steady`), hoy contra mejoras con su diferencia, y el WIP de las dos
 *   líneas minuto a minuto.
 *
 * A ritmo de planta: un minuto de línea por segundo.
 */

/** Minutos de línea por segundo de reloj. */
const PACE = 1;
/** Minutos que guarda la gráfica de WIP. */
const SPAN = 120;
/** Constante de tiempo de la ocupación de cada estación, en minutos. */
const TAU = 30;
/** Minutos de la corrida de la que salen los indicadores (ver `steady`). */
const RUN_HOURS = 40;

type Fix = { setup: boolean; rework: boolean };
const keyOf = (f: Fix) => `${+f.setup}${+f.rework}`;
const leversOf = (f: Fix): Levers => ({ ...NONE, setup: f.setup, rework: f.rework });
const ALL_KEYS: Fix[] = [
  { setup: false, rework: false },
  { setup: true, rework: true },
  { setup: true, rework: false },
  { setup: false, rework: true },
];

const COPY = {
  es: {
    scenario: "Escenario",
    now: "Hoy",
    next: "Con mejoras",
    same: "Sin mejoras",
    fixes: { setup: "Estándar y 5S", rework: "Acciones correctivas" },
    effect: { setup: "−15 % preparación", rework: "−20 % reproceso" },
    wip: "WIP",
    lead: "Entrega",
    kpis: `Corrida de ${RUN_HOURS} h`,
    rows: {
      lead: ["Tiempo de entrega", "min"],
      wip: ["Piezas en proceso", "pzs"],
      rate: ["Producción", "pzs/h"],
      wait: ["Tiempo en cola", "%"],
    },
    today: "hoy",
    live: "WIP minuto a minuto",
    setup: "Cambio de formato",
    inspect: "INSP",
    legend: ["pieza", "reproceso", "terminada"],
    pace: "1 s = 1 min",
  },
  en: {
    scenario: "Scenario",
    now: "Today",
    next: "With fixes",
    same: "No fixes",
    fixes: { setup: "Standard & 5S", rework: "Corrective actions" },
    effect: { setup: "−15% setup", rework: "−20% rework" },
    wip: "WIP",
    lead: "Lead",
    kpis: `${RUN_HOURS}-hour run`,
    rows: {
      lead: ["Lead time", "min"],
      wip: ["Work in process", "pcs"],
      rate: ["Output", "pcs/h"],
      wait: ["Time in queue", "%"],
    },
    today: "today",
    live: "WIP minute by minute",
    setup: "Changeover",
    inspect: "INSP",
    legend: ["part", "rework", "done"],
    pace: "1 s = 1 min",
  },
} as const;

/** El régimen de cada combinación, calculado una vez por página. */
const steadyCache = new Map<string, Steady>();

type Look = { pal: Palette; mono: string; inspect: string };
type Spot = { x: number; y: number };

/** Una línea con su historia: ocupación de cada estación y WIP de cada minuto. */
type Run = { line: Line; util: number[]; wip: number[]; acc: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

function advance(run: Run, dt: number) {
  const l = run.line;
  l.step(dt);
  const k = dt / TAU;
  l.stations.forEach((s, i) => {
    const busy = l.setupLeft <= 0 && s.part && !s.blocked ? 1 : 0;
    run.util[i] += (busy - run.util[i]) * k;
  });
  run.acc += dt;
  if (run.acc >= 1) {
    run.acc -= 1;
    run.wip.push(l.wip());
    if (run.wip.length > SPAN) run.wip.shift();
  }
}

/** Cinco horas en marcha antes de verla, con su historia ya escrita. */
function start(levers: Levers): Run {
  const run: Run = { line: new Line(levers), util: [0.6, 0.6, 0.6, 0.6], wip: [], acc: 0 };
  for (let t = 0; t < 300; t += 0.05) advance(run, 0.05);
  return run;
}

/**
 * Una línea en su franja: banda, estaciones, colas, reproceso y palé.
 *
 * `memo` guarda dónde se pintó cada pieza y `ease` cuánto se acerca en este
 * cuadro a donde le toca: así ninguna salta de sitio, se desliza.
 */
function drawLane(
  ctx: CanvasRenderingContext2D,
  run: Run,
  y0: number,
  w: number,
  h: number,
  k: Look,
  memo: WeakMap<object, Spot>,
  ease: number,
) {
  const { pal } = k;
  const line = run.line;
  const L = 14;
  const Wl = w - 28;
  const fx = (f: number) => L + f * Wl;
  const beltY = y0 + h * 0.58;
  const ps = clamp(Wl * 0.016, 4.5, 8);
  const band = ps + 6;
  const bw = clamp(Wl * 0.095, 22, 62);
  const bh = clamp(h * 0.34, 24, 50);
  const boxTop = beltY - bh * 0.62;
  const step = ps + 2;
  const setup = line.setupLeft > 0;
  const small = Wl < 340;

  const square = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    rr(ctx, x - ps / 2, y - ps / 2, ps, ps, 1.5);
    ctx.fill();
  };
  const part = (p: object, x: number, y: number, color: string) => {
    const prev = memo.get(p);
    const s = prev ? { x: prev.x + (x - prev.x) * ease, y: prev.y + (y - prev.y) * ease } : { x, y };
    memo.set(p, s);
    square(s.x, s.y, color);
  };
  const left = (i: number) => fx(X.stations[i]) - bw / 2;
  /** La cola se apila delante de su estación: dos columnas, de abajo arriba. */
  const pile = (i: number, j: number) => ({
    x: left(i) - 5 - ps / 2 - (j % 2) * step,
    y: beltY - Math.floor(j / 2) * step,
  });

  // La banda: carril, rodillos que corren con ella y se paran con la línea
  const x0 = fx(X.source);
  const x1 = fx(X.pallet) - step * 2;
  ctx.fillStyle = pal.ink;
  ctx.globalAlpha = 0.05;
  ctx.fillRect(x0, beltY - band / 2, x1 - x0, band);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = pal.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, beltY - band / 2);
  ctx.lineTo(x1, beltY - band / 2);
  ctx.moveTo(x0, beltY + band / 2);
  ctx.lineTo(x1, beltY + band / 2);
  const pitch = 8;
  const off = (line.belt * Wl) % pitch;
  for (let x = x0 + off; x < x1; x += pitch) {
    ctx.moveTo(x, beltY - band / 2 + 2);
    ctx.lineTo(x, beltY + band / 2 - 2);
  }
  ctx.stroke();

  // El camino del reproceso: de inspección, por arriba, a la cola de la 2
  const p0 = { x: fx(X.stations[3]), y: boxTop };
  const p2 = { x: left(1) - 5 - ps, y: beltY - 3 * step };
  const apex = Math.max(y0 + 30, boxTop - h * 0.18);
  const c = { x: (p0.x + p2.x) / 2, y: 2 * apex - (p0.y + p2.y) / 2 };
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = pal.orange;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(c.x, c.y, p2.x, p2.y);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  // Piezas en cola (en la banda hasta llegar, luego en la pila) y al palé
  line.queues.forEach((q, i) =>
    q.forEach((p, j) => {
      const at = p.x >= line.slot(i, j) - 0.004 ? pile(i, j) : { x: fx(p.x), y: beltY };
      part(p, at.x, at.y, p.reworked ? pal.orange : pal.dim);
    }),
  );
  for (const p of line.travel) part(p, fx(p.x), beltY, pal.dim);

  // El número de cada cola, en su pastilla: naranja la que ya frena
  ctx.font = `600 ${small ? 8 : 9}px ${k.mono}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  line.queues.forEach((q, i) => {
    if (q.length < 2) return;
    const rows = Math.ceil(q.length / 2);
    const cx = left(i) - 5 - ps / 2 - step / 2;
    const top = beltY - (rows - 1) * step - ps / 2 - 5;
    const label = String(q.length);
    const tw = ctx.measureText(label).width + 10;
    const hot = q.length >= 4;
    ctx.fillStyle = hot ? pal.orange : pal.dim;
    ctx.globalAlpha = hot ? 0.18 : 0.12;
    rr(ctx, cx - tw / 2, top - 13, tw, 13, 6.5);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillText(label, cx, top - 3.5);
  });

  // Estaciones: cuerpo, luz de estado, avance del ciclo y ocupación debajo
  line.stations.forEach((s, i) => {
    const cx = fx(X.stations[i]);
    const x = left(i);
    const searching = Boolean(s.part) && s.search > 0;
    const busy = !setup && Boolean(s.part) && !s.blocked;
    const status = setup || searching || s.blocked ? pal.orange : busy ? pal.green : pal.dim;

    ctx.fillStyle = pal.box;
    rr(ctx, x, boxTop, bw, bh, 6);
    ctx.fill();
    ctx.fillStyle = pal.ink;
    ctx.globalAlpha = 0.04;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = setup ? pal.orange : pal.line;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Franja de estado arriba y la luz
    ctx.fillStyle = status;
    ctx.globalAlpha = busy ? 0.85 : 0.6;
    rr(ctx, x + 4, boxTop + 3, bw - 8, 2, 1);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x + bw - 7, boxTop + 12, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = pal.dim;
    ctx.textAlign = "left";
    ctx.fillText(i === 3 && bw >= 34 ? k.inspect : `E${i + 1}`, x + 5, boxTop + 15);

    // Avance del ciclo, al pie de la caja
    const ty = boxTop + bh - 5;
    ctx.strokeStyle = pal.line;
    ctx.beginPath();
    ctx.moveTo(x + 5, ty);
    ctx.lineTo(x + bw - 5, ty);
    ctx.stroke();
    if (s.part) {
      if (!setup && !searching) {
        const f = clamp(1 - s.left / P.cycle[i], 0, 1);
        ctx.strokeStyle = pal.green;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 5, ty);
        ctx.lineTo(x + 5 + f * (bw - 10), ty);
        ctx.stroke();
        ctx.lineWidth = 1;
      }
      part(s.part, cx, beltY, s.part.reworked ? pal.orange : pal.ink);
    }

    // Ocupación de la última media hora: la que va al límite es el cuello
    const u = clamp(run.util[i], 0, 1);
    const uy = boxTop + bh + 7;
    ctx.fillStyle = pal.line;
    ctx.fillRect(x, uy, bw, 2);
    ctx.fillStyle = u > 0.85 ? pal.orange : pal.ink;
    ctx.globalAlpha = u > 0.85 ? 1 : 0.55;
    ctx.fillRect(x, uy, bw * u, 2);
    ctx.globalAlpha = 1;
    if (!small) {
      ctx.fillStyle = u > 0.85 ? pal.orange : pal.dim;
      ctx.fillText(`${Math.round(u * 100)} %`, x, uy + 12);
    }
  });

  // Piezas de vuelta por el reproceso
  for (const p of line.arcs) {
    const t = clamp(p.arc, 0, 1);
    const u = 1 - t;
    part(p, u * u * p0.x + 2 * u * t * c.x + t * t * p2.x, u * u * p0.y + 2 * u * t * c.y + t * t * p2.y, pal.orange);
  }

  // Palé: las buenas se apilan de tres en tres
  const px = fx(X.pallet);
  const n = line.stats.good % 12;
  for (let j = 0; j < n; j++) {
    square(px - step + (j % 3) * step, beltY - Math.floor(j / 3) * step, pal.green);
  }
}

/** El WIP de las dos líneas, minuto a minuto. */
function drawSpark(ctx: CanvasRenderingContext2D, w: number, h: number, runs: Run[], colors: string[], pal: Palette) {
  ctx.clearRect(0, 0, w, h);
  const top = Math.max(20, ...runs.flatMap((r) => r.wip)) * 1.1;
  const X0 = 0;
  const Y0 = h - 1;
  ctx.strokeStyle = pal.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X0, Y0);
  ctx.lineTo(w, Y0);
  ctx.moveTo(X0, Y0 - (h - 2) / 2);
  ctx.setLineDash([2, 3]);
  ctx.lineTo(w, Y0 - (h - 2) / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  runs.forEach((r, j) => {
    const pts = r.wip;
    if (pts.length < 2) return;
    const dx = w / (SPAN - 1);
    const xs = (i: number) => w - (pts.length - 1 - i) * dx;
    const ys = (v: number) => Y0 - (v / top) * (h - 2);
    // Relleno suave debajo de la línea
    ctx.beginPath();
    ctx.moveTo(xs(0), Y0);
    pts.forEach((v, i) => ctx.lineTo(xs(i), ys(v)));
    ctx.lineTo(xs(pts.length - 1), Y0);
    ctx.closePath();
    ctx.fillStyle = colors[j];
    ctx.globalAlpha = 0.1;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    pts.forEach((v, i) => (i ? ctx.lineTo(xs(i), ys(v)) : ctx.moveTo(xs(i), ys(v))));
    ctx.strokeStyle = colors[j];
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

export default function FlowTwin() {
  const { lang } = useLang();
  const tx = COPY[lang];
  const canvas = useRef<HTMLCanvasElement>(null);
  const spark = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const monoRef = useRef<HTMLSpanElement>(null);
  const wipRefs = useRef<(HTMLElement | null)[]>([null, null]);
  const setupRefs = useRef<(HTMLElement | null)[]>([null, null]);
  const [fix, setFix] = useState<Fix>({ setup: true, rework: true });
  const fixRef = useRef(fix);
  const [stats, setStats] = useState<Record<string, Steady>>({});

  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);

  useEffect(() => {
    const cv = canvas.current;
    const sp = spark.current;
    const wrap = root.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    const sctx = sp?.getContext("2d") ?? null;
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mono = monoRef.current ? getComputedStyle(monoRef.current).fontFamily : "monospace";
    let look: Look = { pal: readPalette(wrap), mono, inspect: tx.inspect };
    // Las líneas ya llevan horas en marcha cuando se las encuentra uno
    const today = start(NONE);
    const fixed = new Map<string, Run>();
    const lower = () => {
      const k = keyOf(fixRef.current);
      let r = fixed.get(k);
      if (!r) {
        r = start(leversOf(fixRef.current));
        fixed.set(k, r);
      }
      return r;
    };
    lower();
    const memo = new WeakMap<object, Spot>();
    let W = 0;
    let H = 0;
    let SW = 0;
    let SH = 0;
    let raf = 0;
    let last = performance.now();
    let visible = false;
    let readAt = 0;

    const paint = (ease = 1) => {
      ctx.clearRect(0, 0, W, H);
      drawLane(ctx, today, 0, W, H / 2, look, memo, ease);
      drawLane(ctx, lower(), H / 2, W, H / 2, look, memo, ease);
    };

    /** Las piezas dentro de cada línea y la gráfica, unas veces por segundo. */
    const readout = (now: number) => {
      if (now - readAt < 300) return;
      readAt = now;
      const runs = [today, lower()];
      wipRefs.current.forEach((el, i) => {
        const v = String(runs[i].line.wip());
        if (el && el.textContent !== v) el.textContent = v;
      });
      // Cambio de formato: la línea entera parada, con los minutos que faltan
      setupRefs.current.forEach((el, i) => {
        if (!el) return;
        const left = runs[i].line.setupLeft;
        el.hidden = left <= 0;
        const v = `${tx.setup} · ${Math.ceil(left)} min`;
        if (left > 0 && el.textContent !== v) el.textContent = v;
      });
      if (sctx && SW > 0) {
        const anyFix = fixRef.current.setup || fixRef.current.rework;
        drawSpark(sctx, SW, SH, runs, [look.pal.orange, anyFix ? look.pal.green : look.pal.dim], look.pal);
      }
    };

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (sp && sctx) {
        const q = sp.getBoundingClientRect();
        SW = q.width;
        SH = q.height;
        sp.width = Math.round(SW * dpr);
        sp.height = Math.round(SH * dpr);
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      paint();
      readout(Infinity);
    };

    const loop = (now: number) => {
      cancelAnimationFrame(raf);
      if (!visible || document.hidden) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      let sim = dt * PACE;
      const l2 = lower();
      while (sim > 0) {
        const d = Math.min(0.05, sim);
        advance(today, d);
        advance(l2, d);
        sim -= d;
      }
      paint(1 - Math.exp(-dt * 9));
      readout(now);
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(size);
    ro.observe(cv);
    if (sp) ro.observe(sp);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !still) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(cv);
    const onTheme = () => {
      look = { ...look, pal: readPalette(wrap) };
      paint();
      readout(Infinity);
    };
    const onVis = () => {
      if (!document.hidden && visible && !still) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    // Al cambiar de combinación con la animación parada, repinta igual
    const onFix = () => {
      paint();
      readout(Infinity);
    };
    window.addEventListener("bouw:theme", onTheme);
    document.addEventListener("visibilitychange", onVis);
    wrap.addEventListener("twin:fix", onFix);

    // Los regímenes, uno por tanda para no trabar el primer pintado
    const timers: number[] = [];
    ALL_KEYS.forEach((f, i) => {
      timers.push(
        window.setTimeout(() => {
          const k = keyOf(f);
          if (!steadyCache.has(k)) steadyCache.set(k, steady(leversOf(f)));
          setStats(Object.fromEntries(steadyCache));
        }, 120 + i * 90),
      );
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("bouw:theme", onTheme);
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("twin:fix", onFix);
    };
  }, [tx]);

  const toggle = (which: keyof Fix) => {
    const next = { ...fix, [which]: !fix[which] };
    fixRef.current = next;
    setFix(next);
    root.current?.dispatchEvent(new Event("twin:fix"));
  };

  const base = stats["00"];
  const cur = stats[keyOf(fix)];
  const any = fix.setup || fix.rework;
  const nf = new Intl.NumberFormat(lang === "es" ? "es-EC" : "en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
  const ni = new Intl.NumberFormat(lang === "es" ? "es-EC" : "en-US", { maximumFractionDigits: 0 });
  const lanes = [
    { name: tx.now, dot: "bg-orange-brand", top: "top-2", st: base, good: false },
    { name: any ? tx.next : tx.same, dot: any ? "bg-(--p-good)" : "bg-orange-brand", top: "top-[calc(50%+0.5rem)]", st: cur, good: any },
  ];

  /** Los indicadores: valor de hoy, valor con mejoras y cuánto cambia. */
  const rows = (
    [
      ["lead", (s: Steady) => s.lead, nf, false],
      ["wip", (s: Steady) => s.wip, nf, false],
      ["rate", (s: Steady) => s.rate * 60, nf, true],
      ["wait", (s: Steady) => (100 * s.wait) / s.lead, ni, false],
    ] as const
  ).map(([id, get, fmt, up]) => {
    const a = base ? get(base) : null;
    const b = cur ? get(cur) : null;
    const d = a && b ? (b / a - 1) * 100 : 0;
    const better = up ? d > 0.5 : d < -0.5;
    return { id, label: tx.rows[id][0], unit: tx.rows[id][1], a, b, d, better, fmt };
  });

  return (
    <div ref={root} className="@container absolute inset-0 flex flex-col bg-(--p-window)">
      {/* Las palancas: cada mejora se enciende o se apaga */}
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-(--p-line) px-2 @md:gap-2 @md:px-3">
        <span className="hidden pr-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-dim @xl:inline">
          {tx.scenario}
        </span>
        {(["setup", "rework"] as const).map((k) => {
          const on = fix[k];
          return (
            <button
              key={k}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => toggle(k)}
              className="inline-flex min-w-0 items-center gap-2 rounded-md px-1.5 py-1 transition-colors duration-300 hover:bg-(--p-accent-soft) @md:px-2"
            >
              <span
                aria-hidden
                className={`relative h-4 w-7 shrink-0 rounded-full transition-colors duration-300 ${
                  on ? "bg-(--p-good)" : "bg-(--p-line)"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3 w-3 rounded-full bg-(--p-window) shadow-[0_1px_2px_rgba(0,0,0,0.3)] transition-[left] duration-300 ${
                    on ? "left-3.5" : "left-0.5"
                  }`}
                />
              </span>
              <span className={`truncate text-[10.5px] font-semibold @md:text-[11.5px] ${on ? "text-ink" : "text-ink-dim"}`}>
                {tx.fixes[k]}
              </span>
              <span
                className={`hidden shrink-0 font-mono text-[9.5px] tabular-nums @2xl:inline ${on ? "text-(--p-good)" : "text-ink-dim"}`}
              >
                {tx.effect[k]}
              </span>
            </button>
          );
        })}
        <span className="ml-auto hidden shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim @lg:flex">
          <span className="live-dot h-1.5 w-1.5 rounded-full bg-(--p-good)" aria-hidden />
          {tx.pace}
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] @min-[30rem]:grid-cols-[minmax(0,1fr)_minmax(0,0.5fr)]">
        {/* Las dos líneas, sobre trama de plano */}
        <div
          className="relative min-h-0"
          style={{
            backgroundImage: "radial-gradient(var(--p-line) 1px, transparent 1.2px)",
            backgroundSize: "16px 16px",
          }}
        >
          <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
          <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-(--p-line)" />
          {/* Al cambiar de combinación, la línea de abajo se refresca */}
          <span
            key={keyOf(fix)}
            aria-hidden
            className="twin-flash pointer-events-none absolute inset-x-0 bottom-0 top-1/2 bg-(--p-window)"
          />
          {lanes.map((l, i) => (
            <div
              key={i}
              data-dragon-ignore
              className={`absolute left-3 right-3 ${l.top} flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.16em] text-ink-dim`}
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${l.dot}`} aria-hidden />
              <span className="truncate font-semibold text-ink">{l.name}</span>
              <span
                ref={(el) => {
                  setupRefs.current[i] = el;
                }}
                hidden
                className="shrink-0 truncate rounded-full bg-orange-brand/15 px-1.5 py-px font-semibold tracking-[0.12em] text-orange-brand"
              />
              <span className="ml-auto flex shrink-0 items-baseline gap-3">
                <span className="hidden @md:inline">
                  {tx.wip}{" "}
                  <b
                    ref={(el) => {
                      wipRefs.current[i] = el;
                    }}
                    className="font-semibold text-ink tabular-nums"
                  />
                </span>
                <span>
                  {tx.lead}{" "}
                  <b
                    className={`font-display text-[14px] font-bold normal-case tracking-normal tabular-nums @md:text-[15px] ${
                      l.good ? "text-(--p-good)" : "text-ink"
                    }`}
                  >
                    {l.st ? `${Math.round(l.st.lead)} min` : "…"}
                  </b>
                </span>
              </span>
            </div>
          ))}
          {/* Qué es cada cuadrito */}
          <div
            aria-hidden
            className="absolute bottom-1.5 left-3 hidden items-center gap-3 font-mono text-[8px] uppercase tracking-[0.14em] text-ink-dim @2xl:flex"
          >
            {["bg-ink-dim", "bg-orange-brand", "bg-(--p-good)"].map((c, j) => (
              <span key={c} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-[2px] ${c}`} />
                {tx.legend[j]}
              </span>
            ))}
          </div>
          {/* Para leer la tipografía mono del sitio y usarla en el lienzo */}
          <span ref={monoRef} aria-hidden className="pointer-events-none absolute font-mono opacity-0">
            0
          </span>
        </div>

        {/* El tablero: la corrida larga, hoy contra mejoras, y el WIP en vivo */}
        <div className="hidden min-h-0 flex-col overflow-hidden border-l border-(--p-line) px-3 pb-2.5 pt-2.5 @min-[30rem]:flex">
          <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink-dim">{tx.kpis}</p>
          <dl className="mt-1.5">
            {rows.map((r) => (
              <div key={r.id} className="border-t border-(--p-line) py-1.5 first:border-t-0">
                <dt className="flex items-center justify-between gap-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-ink-dim">
                  <span className="truncate">{r.label}</span>
                  {any && r.better && (
                    <span className="shrink-0 rounded-full bg-(--p-good)/12 px-1.5 py-px font-semibold tracking-normal text-(--p-good) tabular-nums">
                      {r.d > 0 ? "+" : "−"}
                      {Math.abs(Math.round(r.d))} %
                    </span>
                  )}
                </dt>
                <dd className="mt-0.5 flex items-baseline gap-1">
                  <span
                    className={`font-display text-[17px] font-bold leading-none tabular-nums ${
                      any && r.better ? "text-(--p-good)" : "text-ink"
                    }`}
                  >
                    {r.b !== null ? r.fmt.format(r.b) : "…"}
                  </span>
                  <span className="text-[9.5px] text-ink-dim">{r.unit}</span>
                  {any && r.a !== null && (
                    <span className="ml-auto text-[9.5px] text-ink-dim tabular-nums">
                      {tx.today} {r.fmt.format(r.a)}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
          {/* La gráfica, solo donde cabe debajo de los cuatro indicadores */}
          <div className="mt-auto hidden pt-1.5 @min-[36rem]:block">
            <p className="flex items-center gap-2 font-mono text-[8.5px] uppercase tracking-[0.12em] text-ink-dim">
              <span className="truncate">{tx.live}</span>
              <span className="ml-auto h-[2px] w-2.5 shrink-0 rounded-full bg-orange-brand" aria-hidden />
              <span className={`h-[2px] w-2.5 shrink-0 rounded-full ${any ? "bg-(--p-good)" : "bg-ink-dim"}`} aria-hidden />
            </p>
            <canvas ref={spark} aria-hidden className="mt-1 h-10 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
