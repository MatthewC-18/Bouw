"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/i18n";
import { ALL, Line, NONE, P, X, steady, type Levers, type Part, type Steady } from "./engine";

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

type Palette = {
  ink: string;
  dim: string;
  line: string;
  accent: string;
  orange: string;
  green: string;
  box: string;
  page: string;
  font: string;
};

const GREEN = { light: "#17784f", dark: "#3ecf8e" };

function readPalette(el: HTMLElement): Palette {
  const cs = getComputedStyle(el);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  const dark = document.documentElement.dataset.theme === "dark";
  return {
    ink: v("--color-ink", "#0c1f33"),
    dim: v("--color-ink-dim", "#5d6c7d"),
    line: v("--p-line", "rgba(120,120,120,0.3)"),
    accent: v("--p-accent", "#b7791f"),
    orange: v("--color-orange-brand", "#d9661a"),
    green: dark ? GREEN.dark : GREEN.light,
    box: v("--p-window", "#fff"),
    page: `rgb(${v("--page-rgb", "243, 240, 234")})`,
    // Se lee una vez: leerla en cada fotograma pide estilos al documento
    font: getComputedStyle(document.body).fontFamily,
  };
}

/** Una línea que ya lleva cinco horas en marcha: así se la encuentra uno. */
function warm(levers: Levers) {
  const l = new Line(levers);
  for (let t = 0; t < 300; t += 0.05) l.step(0.05);
  return l;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

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
      const L = line.current;
      const c = pal.current;
      if (!c) return;
      const lv = levRef.current;
      const lab = T[lang].labels;
      const k = Math.max(0.72, Math.min(1.15, W / 1000));
      const padX = 22 * k;
      const px = (x: number) => padX + x * (W - 2 * padX);
      const beltY = H * 0.6;
      const boxW = Math.min(118 * k, (W - 2 * padX) * 0.13);
      const boxH = H * 0.2;
      const boxTop = beltY - boxH - 12 * k;
      const partW = 13 * k;
      const partH = 8 * k;
      const font = c.font;
      const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";
      const stopped = L.setupLeft > 0;

      ctx.clearRect(0, 0, W, H);

      // Banda: franja con marcas que avanzan
      rr(ctx, px(0), beltY - 3 * k, px(X.pallet) - px(0), 10 * k, 5 * k);
      ctx.fillStyle = c.line;
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.rect(px(0), beltY - 3 * k, px(X.pallet) - px(0), 10 * k);
      ctx.clip();
      ctx.strokeStyle = c.dim;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.2 * k;
      const step = 18 * k;
      const off = (L.belt * (W - 2 * padX)) % step;
      for (let x = px(0) - step + off; x < px(X.pallet); x += step) {
        ctx.beginPath();
        ctx.moveTo(x, beltY - 2 * k);
        ctx.lineTo(x + 5 * k, beltY + 2 * k);
        ctx.lineTo(x, beltY + 6 * k);
        ctx.stroke();
      }
      ctx.restore();

      // Arco de reproceso: de inspección a la estación 2, por arriba
      const ax0 = px(X.stations[3]);
      const ax1 = px(X.stations[1]);
      const ay = boxTop - 6 * k;
      const ayTop = boxTop - H * 0.2;
      const bez = (t: number) => {
        const u = 1 - t;
        return {
          x: u * u * u * ax0 + 3 * u * u * t * ax0 + 3 * u * t * t * ax1 + t * t * t * ax1,
          y: u * u * u * ay + 3 * u * u * t * ayTop + 3 * u * t * t * ayTop + t * t * t * ay,
        };
      };
      ctx.save();
      ctx.setLineDash([6 * k, 5 * k]);
      ctx.lineWidth = 1.6 * k;
      ctx.strokeStyle = c.orange;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.moveTo(ax0, ay);
      ctx.bezierCurveTo(ax0, ayTop, ax1, ayTop, ax1, ay);
      ctx.stroke();
      ctx.restore();
      // Punta de flecha a la llegada
      ctx.fillStyle = c.orange;
      ctx.beginPath();
      ctx.moveTo(ax1 - 5 * k, ay - 8 * k);
      ctx.lineTo(ax1 + 5 * k, ay - 8 * k);
      ctx.lineTo(ax1, ay);
      ctx.fill();
      ctx.font = `600 ${11 * k}px ${font}`;
      ctx.textAlign = "center";
      ctx.fillStyle = c.orange;
      const arcMid = bez(0.5);
      ctx.fillText(`${lab.rework} · ${L.stats.reworked}`, arcMid.x, arcMid.y + 15 * k);

      // Estaciones
      L.stations.forEach((s, i) => {
        const cx = px(X.stations[i]);
        const x0 = cx - boxW / 2;
        rr(ctx, x0, boxTop, boxW, boxH, 8 * k);
        ctx.fillStyle = c.box;
        ctx.fill();
        ctx.lineWidth = 1.2 * k;
        ctx.strokeStyle = stopped ? c.orange : i === 1 && !(lv.setup && lv.rework) && L.queues[1].length >= P.queueCap - 1 ? c.orange : c.line;
        ctx.stroke();
        if (stopped) {
          ctx.fillStyle = c.orange;
          ctx.globalAlpha = 0.12;
          rr(ctx, x0, boxTop, boxW, boxH, 8 * k);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.textAlign = "left";
        ctx.font = `600 ${11 * k}px ${mono}`;
        ctx.fillStyle = c.ink;
        ctx.fillText(`E${i + 1}`, x0 + 9 * k, boxTop + 17 * k);
        if (i === 3) {
          ctx.font = `${10 * k}px ${font}`;
          ctx.fillStyle = c.dim;
          ctx.fillText(lab.insp, x0 + 9 * k, boxTop + 31 * k);
        }
        // Avance del ciclo
        if (s.part) {
          const total = P.cycle[i];
          const done = Math.max(0, Math.min(1, 1 - s.left / total));
          rr(ctx, x0 + 9 * k, boxTop + boxH - 13 * k, boxW - 18 * k, 4 * k, 2 * k);
          ctx.fillStyle = c.line;
          ctx.fill();
          rr(ctx, x0 + 9 * k, boxTop + boxH - 13 * k, (boxW - 18 * k) * done, 4 * k, 2 * k);
          ctx.fillStyle = s.search > 0 ? c.orange : c.accent;
          ctx.fill();
        }
        // Operador, debajo de la banda
        const oy = beltY + 30 * k;
        ctx.fillStyle = c.dim;
        ctx.beginPath();
        ctx.arc(cx, oy, 5.5 * k, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.roundRect(cx - 8 * k, oy + 7 * k, 16 * k, 11 * k, [7 * k, 7 * k, 2 * k, 2 * k]);
        ctx.fill();
        if (lv.control) {
          ctx.fillStyle = c.green;
          ctx.beginPath();
          ctx.arc(cx + 9 * k, oy - 4 * k, 5 * k, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 1.5 * k;
          ctx.beginPath();
          ctx.moveTo(cx + 6.8 * k, oy - 4 * k);
          ctx.lineTo(cx + 8.6 * k, oy - 2.2 * k);
          ctx.lineTo(cx + 11.4 * k, oy - 6 * k);
          ctx.stroke();
        }
        // Buscando una herramienta: el desperdicio de movimiento
        if (s.search > 0) {
          ctx.fillStyle = c.orange;
          ctx.font = `700 ${13 * k}px ${font}`;
          ctx.textAlign = "center";
          ctx.fillText("?", cx - 13 * k, oy - 4 * k);
          ctx.font = `${9.5 * k}px ${font}`;
          ctx.fillText(lab.search, cx, oy + 32 * k);
        }
      });

      // Piezas
      const part = (p: Part, x: number, y: number, color: string) => {
        rr(ctx, x - partW / 2, y - partH / 2, partW, partH, 2.5 * k);
        ctx.fillStyle = color;
        ctx.fill();
      };
      const partY = beltY + 2 * k - partH / 2 - 1;
      L.queues.forEach((q) => q.forEach((p) => part(p, px(p.x), partY, p.reworked ? c.orange : c.dim)));
      L.stations.forEach((s, i) => {
        if (s.part) part(s.part, px(X.stations[i]), partY, s.part.reworked ? c.orange : c.accent);
      });
      L.travel.forEach((p) => part(p, px(p.x), partY, c.green));
      L.arcs.forEach((p) => {
        const b = bez(p.arc);
        part(p, b.x, b.y, c.orange);
      });

      // Palé: capas de piezas buenas
      const palX = px(X.pallet) - 4 * k;
      const palW = 40 * k;
      ctx.fillStyle = c.dim;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(palX - palW / 2, beltY + 9 * k, palW, 4 * k);
      ctx.globalAlpha = 1;
      const layers = L.stats.good % 24;
      for (let n = 0; n < layers; n++) {
        const col = n % 3;
        const row = Math.floor(n / 3);
        part(
          { id: n, x: 0, arc: -1, born: 0, inQueue: 0, bad: false, reworked: false },
          palX - partW - 1 + col * (partW + 1),
          beltY + 3 * k - row * (partH + 1),
          c.green,
        );
      }
      ctx.textAlign = "center";
      ctx.font = `${10 * k}px ${font}`;
      ctx.fillStyle = c.dim;
      ctx.fillText(lab.pallet, palX, beltY + 27 * k);
      ctx.textAlign = "left";
      ctx.fillText(lab.in, px(0), beltY + 27 * k);

      // VSM: inventario en triángulos, desperdicios marcados, escalera de tiempo
      if (lv.vsm) {
        L.queues.forEach((q, i) => {
          if (!q.length) return;
          // Desde la segunda plaza: la primera queda bajo el borde de la estación
          const tx0 = px(L.slot(i, Math.max(1, Math.min(q.length - 1, 3))));
          const ty = beltY - 30 * k;
          ctx.fillStyle = c.orange;
          ctx.beginPath();
          ctx.moveTo(tx0, ty - 15 * k);
          ctx.lineTo(tx0 + 9 * k, ty);
          ctx.lineTo(tx0 - 9 * k, ty);
          ctx.closePath();
          ctx.globalAlpha = 0.9;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#fff";
          ctx.font = `700 ${8.5 * k}px ${mono}`;
          ctx.textAlign = "center";
          ctx.fillText("I", tx0, ty - 3 * k);
          ctx.fillStyle = c.orange;
          ctx.font = `700 ${10 * k}px ${mono}`;
          ctx.fillText(String(q.length), tx0, ty - 19 * k);
        });

        const tag = (text: string, x: number, y: number, fixed: string | null) => {
          ctx.font = `600 ${10 * k}px ${font}`;
          const label = fixed ?? text;
          const w = ctx.measureText(label).width + 14 * k;
          rr(ctx, x, y - 13 * k, w, 18 * k, 9 * k);
          ctx.fillStyle = fixed ? c.green : c.orange;
          ctx.globalAlpha = 0.14;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = fixed ? c.green : c.orange;
          ctx.lineWidth = 1 * k;
          ctx.stroke();
          ctx.fillStyle = fixed ? c.green : c.orange;
          ctx.textAlign = "left";
          ctx.fillText(label, x + 7 * k, y);
        };
        tag(lab.waitTag, px(0), H * 0.08, lv.setup ? `${lab.waitTag.split("·")[0].trim()} · −15 %` : null);
        tag(lab.defectTag, arcMid.x + 70 * k, ayTop + 8 * k, lv.rework ? `${lab.defectTag.split("·")[0].trim()} · −20 %` : null);
        tag(lab.motionTag, px(0), beltY + 64 * k, lv.setup ? `${lab.motionTag.split("·")[0].trim()} · 5S` : null);

        // Escalera de tiempo: cuánto de la estancia es espera
        const lead = L.avgLead();
        if (lead.total > 0) {
          const bx = px(0.45);
          const bw = px(X.pallet) - bx;
          const by = H - 22 * k;
          const va = Math.max(0.02, 1 - lead.wait / lead.total);
          rr(ctx, bx, by, bw, 8 * k, 4 * k);
          ctx.fillStyle = c.orange;
          ctx.globalAlpha = 0.75;
          ctx.fill();
          ctx.globalAlpha = 1;
          rr(ctx, bx, by, bw * va, 8 * k, 4 * k);
          ctx.fillStyle = c.green;
          ctx.fill();
          ctx.font = `${10 * k}px ${font}`;
          ctx.textAlign = "left";
          ctx.fillStyle = c.dim;
          ctx.fillText(
            `${lab.leadBar}: ${lab.va} ${Math.round(va * 100)} % · ${lab.wait} ${Math.round((1 - va) * 100)} %`,
            bx,
            by - 6 * k,
          );
        }
      }

      // Adelantando: aviso arriba a la derecha
      if (ff.current > 0) {
        ctx.font = `600 ${11 * k}px ${font}`;
        const text = `⏩ ${lab.ff}`;
        const w = ctx.measureText(text).width + 24 * k;
        rr(ctx, W - w - 14 * k, H * 0.04, w, 26 * k, 13 * k);
        ctx.fillStyle = c.accent;
        ctx.fill();
        ctx.fillStyle = c.box;
        ctx.textAlign = "left";
        ctx.fillText(text, W - w - 2 * k, H * 0.04 + 17 * k);
      }

      // Cambio de formato: aviso y cuenta atrás
      if (stopped) {
        const w = Math.min(360 * k, W * 0.5);
        const x0 = W / 2 - w / 2;
        const y0 = H * 0.04;
        rr(ctx, x0, y0, w, 30 * k, 15 * k);
        ctx.fillStyle = c.orange;
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = `600 ${11.5 * k}px ${font}`;
        ctx.textAlign = "center";
        ctx.fillText(`${lab.setup} · ${L.setupLeft.toFixed(1)} min`, W / 2, y0 + 19.5 * k);
        const prog = 1 - L.setupLeft / Math.max(L.setupTotal, 0.01);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillRect(x0 + 15 * k, y0 + 25 * k, (w - 30 * k) * prog, 2 * k);
      }
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
