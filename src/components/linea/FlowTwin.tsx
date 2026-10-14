"use client";

import { Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { readPalette, rr, warm, type Palette } from "./draw";
import { NONE, P, X, steady, type Levers, type Line, type Steady } from "./engine";

/**
 * La simulación de flujos, en la ficha de Lean, para tocarla.
 *
 * Matthew, 14 oct 2026. Sobre la primera versión (`LinePeek`): «va muy
 * rápido y no se ve profesional», y la foto del producto «no se entiende».
 * Sobre la segunda (los dos escenarios con índices al lado): «que sea más
 * novedoso y que se entienda a la vista».
 *
 * Así que la ficha hace lo que dice su título, probar un cambio antes de
 * moverlo en la planta, y lo hace el visitante:
 *
 * - Arriba, la línea de hoy. Abajo, la misma línea con las mejoras que estén
 *   encendidas en los dos interruptores de la barra: «Estándar y 5S» y
 *   «Acciones correctivas». Al tocarlos, la línea de abajo pasa a esa
 *   combinación y su tiempo de entrega cambia al momento.
 * - Cada franja dice en grande lo que cualquiera entiende: cuánto tarda en
 *   entregarse una pieza, en minutos, y cuántas hay dentro de la línea.
 *   La entrega es la de una corrida larga del modelo (`steady`), así que no
 *   baila; las piezas dentro son las del instante.
 * - A ritmo de planta: un minuto de línea por segundo. Trazo fino, piezas
 *   como cuadritos, la cola apilada con su número; lo único en color es lo
 *   que frena: la cola, el reproceso y el cambio de formato.
 *
 * Cada combinación tiene su línea ya en marcha (`warm`), y al cambiar se
 * muestra esa: drenar una cola a ritmo real tardaría un minuto largo y la
 * versión anterior lo resolvía acelerando, que era justo lo que se veía mal.
 */

/** Minutos de línea por segundo de reloj. */
const PACE = 1;

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
    now: "Hoy",
    next: "Con mejoras",
    same: "Sin mejoras",
    try: "Prueba cada mejora",
    fixes: { setup: "Estándar y 5S", rework: "Acciones correctivas" },
    wip: "Dentro",
    lead: "Entrega",
    pcs: "pzs",
    queue: "Cola",
    setup: "Cambio de formato",
    inspect: "Insp.",
    legend: ["pieza", "reproceso", "terminada"],
  },
  en: {
    now: "Today",
    next: "With fixes",
    same: "No fixes",
    try: "Try each fix",
    fixes: { setup: "Standard & 5S", rework: "Corrective actions" },
    wip: "Inside",
    lead: "Lead time",
    pcs: "pcs",
    queue: "Queue",
    setup: "Changeover",
    inspect: "Insp.",
    legend: ["part", "rework", "done"],
  },
} as const;

/** El régimen de cada combinación, calculado una vez por página. */
const steadyCache = new Map<string, Steady>();

type Look = { pal: Palette; mono: string; queue: string; setup: string; inspect: string };
type Spot = { x: number; y: number };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/**
 * Una línea en su franja: banda, estaciones, colas, reproceso y palé.
 *
 * `memo` guarda dónde se pintó cada pieza y `ease` cuánto se acerca en este
 * cuadro a donde le toca: así ninguna salta de sitio (de la cola a la
 * estación, de la banda a la pila), se desliza.
 */
function drawLane(
  ctx: CanvasRenderingContext2D,
  line: Line,
  y0: number,
  w: number,
  h: number,
  k: Look,
  memo: WeakMap<object, Spot>,
  ease: number,
) {
  const { pal } = k;
  const L = 16;
  const Wl = w - 32;
  const fx = (f: number) => L + f * Wl;
  const beltY = y0 + h * 0.64;
  const ps = clamp(Wl * 0.017, 5, 9);
  // En el teléfono la caja se estrecha: si no, tapa la pila de la cola
  const bw = clamp(Wl * 0.085, 20, 60);
  const bh = clamp(h * 0.38, 24, 54);
  const boxTop = beltY - bh * 0.62;
  const onBelt = beltY - ps / 2 - 1;
  const step = ps + 2;
  const setup = line.setupLeft > 0;

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
    y: onBelt - Math.floor(j / 2) * step,
  });

  // La banda: una raya. Lo que se mueve son las piezas
  ctx.lineWidth = 1;
  ctx.strokeStyle = pal.line;
  ctx.beginPath();
  ctx.moveTo(fx(X.source), beltY);
  ctx.lineTo(fx(X.pallet), beltY);
  ctx.stroke();

  // El camino del reproceso: de inspección, por arriba, a la pila de la 2
  const p0 = { x: fx(X.stations[3]), y: boxTop };
  const p2 = { x: left(1) - 5 - ps, y: onBelt - 3 * step };
  const apex = Math.max(y0 + 26, boxTop - h * 0.2);
  const c = { x: (p0.x + p2.x) / 2, y: 2 * apex - (p0.y + p2.y) / 2 };
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = pal.line;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.quadraticCurveTo(c.x, c.y, p2.x, p2.y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Las colas que ya frenan la línea, marcadas con su número
  ctx.font = `600 ${Wl < 340 ? 8 : 9}px ${k.mono}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  line.queues.forEach((q, i) => {
    if (q.length < 3) return;
    const rows = Math.ceil(q.length / 2);
    const xr = left(i) - 2;
    const xl = left(i) - 5 - ps - step - 3;
    const yt = onBelt - (rows - 1) * step - ps / 2 - 3;
    ctx.fillStyle = pal.orange;
    ctx.globalAlpha = 0.13;
    rr(ctx, xl, yt, xr - xl, beltY + 2 - yt, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    const mid = i > 0 ? (left(i - 1) + bw + left(i)) / 2 : (xl + xr) / 2;
    ctx.fillText(`${k.queue} ${q.length}`.toUpperCase(), mid, beltY + 15);
  });

  // Piezas en cola (en la banda hasta llegar, luego en la pila) y al palé
  line.queues.forEach((q, i) =>
    q.forEach((p, j) => {
      const at = p.x >= line.slot(i, j) - 0.004 ? pile(i, j) : { x: fx(p.x), y: onBelt };
      part(p, at.x, at.y, p.reworked ? pal.orange : pal.dim);
    }),
  );
  for (const p of line.travel) part(p, fx(p.x), onBelt, pal.dim);

  // Estaciones
  line.stations.forEach((s, i) => {
    const cx = fx(X.stations[i]);
    const x = left(i);
    ctx.fillStyle = pal.box;
    rr(ctx, x, boxTop, bw, bh, 6);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = setup ? pal.orange : pal.dim;
    ctx.globalAlpha = setup ? 0.9 : 0.45;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.dim;
    ctx.textAlign = "left";
    ctx.fillText(i === 3 && bw >= 44 ? k.inspect.toUpperCase() : `E${i + 1}`, x + 6, boxTop + 12);
    // Buscando una herramienta: sin 5S pasa a menudo
    if (s.search > 0) {
      ctx.fillStyle = pal.orange;
      ctx.beginPath();
      ctx.arc(x + bw - 7, boxTop + 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Avance del ciclo, como una raya al pie de la caja
    const ty = boxTop + bh - 5;
    ctx.strokeStyle = pal.line;
    ctx.beginPath();
    ctx.moveTo(x + 6, ty);
    ctx.lineTo(x + bw - 6, ty);
    ctx.stroke();
    if (s.part) {
      if (!setup) {
        const f = clamp(1 - s.left / P.cycle[i], 0, 1);
        ctx.strokeStyle = pal.ink;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 6, ty);
        ctx.lineTo(x + 6 + f * (bw - 12), ty);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
      }
      part(s.part, cx, onBelt, s.part.reworked ? pal.orange : pal.ink);
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
    square(px - step + (j % 3) * step, onBelt - Math.floor(j / 3) * step, pal.green);
  }

  // Cambio de formato: la línea entera parada, con lo que falta
  if (setup) {
    const right = left(3) + bw;
    const yb = boxTop + bh + 14;
    ctx.fillStyle = pal.orange;
    ctx.textAlign = "right";
    ctx.fillText(k.setup.toUpperCase(), right, yb);
    const bwid = 72;
    ctx.globalAlpha = 0.25;
    ctx.fillRect(right - bwid, yb + 5, bwid, 2);
    ctx.globalAlpha = 1;
    ctx.fillRect(right - bwid, yb + 5, bwid * (1 - line.setupLeft / line.setupTotal), 2);
  }
}

export default function FlowTwin() {
  const { lang } = useLang();
  const tx = COPY[lang];
  const canvas = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const monoRef = useRef<HTMLSpanElement>(null);
  const wipRefs = useRef<(HTMLElement | null)[]>([null, null]);
  const [fix, setFix] = useState<Fix>({ setup: true, rework: true });
  const fixRef = useRef(fix);
  const [stats, setStats] = useState<Record<string, Steady>>({});

  useEffect(() => {
    fixRef.current = fix;
  }, [fix]);

  useEffect(() => {
    const cv = canvas.current;
    const wrap = root.current;
    if (!cv || !wrap) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mono = monoRef.current ? getComputedStyle(monoRef.current).fontFamily : "monospace";
    let look: Look = {
      pal: readPalette(wrap),
      mono,
      queue: tx.queue,
      setup: tx.setup,
      inspect: tx.inspect,
    };
    // Las líneas ya llevan horas en marcha cuando se las encuentra uno
    const today = warm(NONE);
    const fixed = new Map<string, Line>();
    const lower = () => {
      const k = keyOf(fixRef.current);
      let l = fixed.get(k);
      if (!l) {
        l = warm(leversOf(fixRef.current));
        fixed.set(k, l);
      }
      return l;
    };
    lower();
    const memo = new WeakMap<object, Spot>();
    let W = 0;
    let H = 0;
    let raf = 0;
    let last = performance.now();
    let visible = false;
    let readAt = 0;

    const paint = (ease = 1) => {
      ctx.clearRect(0, 0, W, H);
      drawLane(ctx, today, 0, W, H / 2, look, memo, ease);
      drawLane(ctx, lower(), H / 2, W, H / 2, look, memo, ease);
    };

    /** Las piezas dentro de cada línea, en el texto de su franja. */
    const readout = (now: number) => {
      if (now - readAt < 300) return;
      readAt = now;
      const lines = [today, lower()];
      wipRefs.current.forEach((el, i) => {
        const v = String(lines[i].wip());
        if (el && el.textContent !== v) el.textContent = v;
      });
    };

    const size = () => {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
        today.step(d);
        l2.step(d);
        sim -= d;
      }
      paint(1 - Math.exp(-dt * 9));
      readout(now);
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
      look = { ...look, pal: readPalette(wrap) };
      paint();
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
  const cut = base && cur && any ? Math.round((1 - cur.lead / base.lead) * 100) : 0;
  const lanes = [
    { name: tx.now, dot: "bg-orange-brand", top: "top-2", st: base, good: false },
    { name: any ? tx.next : tx.same, dot: any ? "bg-(--p-good)" : "bg-orange-brand", top: "top-[calc(50%+0.5rem)]", st: cur, good: any },
  ];

  return (
    <div ref={root} className="@container absolute inset-0 flex flex-col bg-(--p-window)">
      {/* Los interruptores: cada mejora se enciende o se apaga */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-(--p-line) px-3 @md:px-4">
        <span className="hidden font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-dim @lg:inline">
          {tx.try}
        </span>
        <div className="flex min-w-0 gap-1.5 @lg:ml-auto">
          {(["setup", "rework"] as const).map((k) => {
            const on = fix[k];
            return (
              <button
                key={k}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(k)}
                className={`inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ring-1 transition-colors duration-300 @md:text-[11.5px] ${
                  on
                    ? "bg-(--p-good)/12 text-(--p-good) ring-(--p-good)/45"
                    : "text-ink-dim ring-(--p-line) hover:text-ink"
                }`}
              >
                <span
                  aria-hidden
                  className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                    on ? "bg-(--p-good) text-(--p-window)" : "ring-1 ring-(--p-line)"
                  }`}
                >
                  {on && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                </span>
                <span className="truncate">{tx.fixes[k]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Las dos líneas */}
      <div className="relative min-h-0 flex-1">
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />
        <span aria-hidden className="absolute inset-x-4 top-1/2 h-px bg-(--p-line)" />
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
            className={`absolute left-4 right-4 ${l.top} flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-dim`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${l.dot}`} aria-hidden />
            <span className="truncate font-semibold text-ink">{l.name}</span>
            <span className="ml-auto flex shrink-0 items-baseline gap-3">
              <span className="hidden @md:inline">
                {tx.wip}{" "}
                <b
                  ref={(el) => {
                    wipRefs.current[i] = el;
                  }}
                  className="font-semibold text-ink tabular-nums"
                />{" "}
                {tx.pcs}
              </span>
              <span>
                {tx.lead}{" "}
                <b
                  className={`font-display text-[15px] font-bold normal-case tracking-normal tabular-nums @md:text-[17px] ${
                    l.good ? "text-(--p-good)" : "text-ink"
                  }`}
                >
                  {l.st ? `${Math.round(l.st.lead)} min` : "…"}
                </b>
              </span>
              {i === 1 && cut > 0 && (
                <span className="rounded-full bg-(--p-good)/12 px-1.5 py-0.5 font-semibold tracking-normal text-(--p-good)">
                  −{cut} %
                </span>
              )}
            </span>
          </div>
        ))}
        {/* Qué es cada cuadrito */}
        <div
          aria-hidden
          className="absolute bottom-2 left-4 hidden items-center gap-3 font-mono text-[8.5px] uppercase tracking-[0.14em] text-ink-dim @lg:flex"
        >
          {[
            "bg-ink-dim",
            "bg-orange-brand",
            "bg-(--p-good)",
          ].map((c, j) => (
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
    </div>
  );
}
