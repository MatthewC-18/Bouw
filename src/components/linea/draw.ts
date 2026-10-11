import { Line, P, X, type Levers, type Part } from "./engine";

/*
 * El dibujo de la línea, compartido por la simulación completa (`LineSim`) y
 * el adelanto de la ficha (`LinePeek`). Solo pinta: el estado lo lleva `Line`.
 */

export type Labels = {
  in: string;
  insp: string;
  pallet: string;
  rework: string;
  setup: string;
  search: string;
  wait: string;
  va: string;
  waitTag: string;
  defectTag: string;
  motionTag: string;
  invTag: string;
  leadBar: string;
  ff: string;
};

export type Palette = {
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

export function readPalette(el: HTMLElement): Palette {
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
export function warm(levers: Levers) {
  const l = new Line(levers);
  for (let t = 0; t < 300; t += 0.05) l.step(0.05);
  return l;
}

export function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export type DrawState = {
  line: Line;
  pal: Palette;
  levers: Levers;
  lab: Labels;
  /** Minutos que quedan por adelantar deprisa (aviso arriba a la derecha). */
  ff: number;
  /** El adelanto de la ficha: sin rótulos de VSM ni textos pequeños. */
  mini?: boolean;
};

export function drawLine(ctx: CanvasRenderingContext2D, W: number, H: number, s: DrawState) {
  const { line: L, pal: c, levers: lv, lab, mini } = s;
  // En la ficha el lienzo es pequeño: se escala contra un ancho menor
  const k = mini ? Math.max(0.7, Math.min(1.05, W / 520)) : Math.max(0.72, Math.min(1.15, W / 1000));
  const padX = 22 * k;
  const px = (x: number) => padX + x * (W - 2 * padX);
  // En la ficha no hay rótulos debajo: la línea baja y crece
  const beltY = H * (mini ? 0.7 : 0.6);
  const boxW = Math.min(118 * k, (W - 2 * padX) * 0.13);
  const boxH = H * (mini ? 0.25 : 0.2);
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
  const ayTop = boxTop - H * (mini ? 0.16 : 0.2);
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
      if (!mini) ctx.fillText(lab.search, cx, oy + 32 * k);
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
  if (!mini) {
    ctx.fillText(lab.pallet, palX, beltY + 27 * k);
    ctx.textAlign = "left";
    ctx.fillText(lab.in, px(0), beltY + 27 * k);
  }

  // VSM: inventario en triángulos, desperdicios marcados, escalera de tiempo
  if (lv.vsm && !mini) {
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
  if (s.ff > 0 && !mini) {
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
  // En la ficha arriba a la izquierda va la etiqueta de la fase: el aviso se
  // pega a la derecha, más pequeño, y en un lienzo estrecho no va (las
  // estaciones ya se ponen naranjas)
  if (stopped && (!mini || W >= 520)) {
    const text = `${lab.setup} · ${L.setupLeft.toFixed(1)} min`;
    ctx.font = `600 ${(mini ? 10.5 : 11.5) * k}px ${font}`;
    const w = mini ? ctx.measureText(text).width + 26 * k : Math.min(360 * k, W * 0.5);
    const h = (mini ? 24 : 30) * k;
    const x0 = mini ? W - w - 10 * k : W / 2 - w / 2;
    const y0 = mini ? 10 * k : H * 0.04;
    rr(ctx, x0, y0, w, h, h / 2);
    ctx.fillStyle = c.orange;
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(text, x0 + w / 2, y0 + h * 0.62);
    const prog = 1 - L.setupLeft / Math.max(L.setupTotal, 0.01);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillRect(x0 + 12 * k, y0 + h - 5 * k, (w - 24 * k) * prog, 2 * k);
  }
}
