import * as THREE from "three";

/**
 * Texturas procedurales del dragón.
 *
 * Todo se dibuja en un canvas en el cliente: escamas, venas de la membrana,
 * queratina de cuernos y garras, iris. Nada se descarga. De cada dibujo sale
 * un mapa de altura y de ahí, por Sobel, el normal map — que es lo que hace
 * que la piel tenga relieve de verdad y no un color plano.
 */

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

/**
 * Filtrado anisotrópico máximo de la GPU. El dragón se ve casi siempre en
 * escorzo — el cuerpo se aleja de la cámara en cada curva — y ahí es donde
 * la escama se convierte en muaré si el filtro se queda corto.
 */
let maxAnisotropy = 8;

export function setMaxAnisotropy(value: number) {
  if (Number.isFinite(value) && value >= 1) maxAnisotropy = value;
}

/** PRNG determinista: la misma textura en cada carga. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a || 1));
  return t * t * (3 - 2 * t);
};

type Surface = { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };

function surface(size: number): Surface {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("canvas 2d no disponible");
  return { canvas, ctx };
}

/**
 * Ruido de valor tileable: una retícula de valores al azar interpolada con
 * smoothstep y con envoltura, de modo que el mapa sigue casando al repetir.
 */
function valueNoise(size: number, cells: number, seed: number): Float32Array {
  const n = Math.max(2, Math.round(cells));
  const rand = rng(seed);
  const lattice = new Float32Array(n * n);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand();

  const out = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    const gy = (y / size) * n;
    const iy = Math.floor(gy);
    const y0 = ((iy % n) + n) % n;
    const y1 = (y0 + 1) % n;
    const fy = smoothstep(0, 1, gy - iy);
    for (let x = 0; x < size; x++) {
      const gx = (x / size) * n;
      const ix = Math.floor(gx);
      const x0 = ((ix % n) + n) % n;
      const x1 = (x0 + 1) % n;
      const fx = smoothstep(0, 1, gx - ix);

      const a = lattice[y0 * n + x0];
      const b = lattice[y0 * n + x1];
      const c = lattice[y1 * n + x0];
      const d = lattice[y1 * n + x1];
      const top = a + (b - a) * fx;
      const bottom = c + (d - c) * fx;
      out[y * size + x] = top + (bottom - top) * fy;
    }
  }
  return out;
}

/** Varias octavas del anterior: manchas grandes con grano fino encima. */
function fbm(
  size: number,
  cells: number,
  octaves: number,
  seed: number,
): Float32Array {
  const out = new Float32Array(size * size);
  let amp = 1;
  let total = 0;
  for (let o = 0; o < octaves; o++) {
    const layer = valueNoise(size, cells * Math.pow(2, o), seed + o * 7919);
    for (let i = 0; i < out.length; i++) out[i] += layer[i] * amp;
    total += amp;
    amp *= 0.5;
  }
  for (let i = 0; i < out.length; i++) out[i] /= total;
  return out;
}

type TexOpts = {
  srgb?: boolean;
  repeat?: [number, number];
  clamp?: boolean;
};

function toTexture(canvas: HTMLCanvasElement, opts: TexOpts = {}): THREE.Texture {
  const t = new THREE.CanvasTexture(canvas);
  const wrap = opts.clamp ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.wrapS = wrap;
  t.wrapT = wrap;
  if (opts.repeat) t.repeat.set(opts.repeat[0], opts.repeat[1]);
  t.colorSpace = opts.srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  // Alta: en escorzo la escama es muy fina y sin esto aparece muaré
  t.anisotropy = maxAnisotropy;
  t.needsUpdate = true;
  return t;
}

/** Canal rojo de un canvas como campo de altura en [0,1]. */
function heightOf(canvas: HTMLCanvasElement): Float32Array {
  const ctx = canvas.getContext("2d")!;
  const size = canvas.width;
  const data = ctx.getImageData(0, 0, size, size).data;
  const out = new Float32Array(size * size);
  for (let i = 0; i < out.length; i++) out[i] = data[i * 4] / 255;
  return out;
}

/**
 * Mapa de altura → normal map tangencial (convención OpenGL, +Y arriba).
 * El gradiente se toma con envoltura, así el mapa sigue siendo tileable, y
 * con núcleo Sobel completo: la diferencia de dos muestras encalla en cuanto
 * el mapa lleva grano fino, y el relieve sale con escalones.
 *
 * La fuerza se escala con la resolución. El mismo relieve repartido entre más
 * píxeles da menos pendiente por píxel, así que sin corregirlo un mapa de 1K
 * se vería más plano que uno de 512 con los mismos números.
 */
function normalFrom(
  height: Float32Array,
  size: number,
  strength: number,
): HTMLCanvasElement {
  const { canvas, ctx } = surface(size);
  const img = ctx.createImageData(size, size);
  const gain = (strength * size) / 512;
  const at = (x: number, y: number) =>
    height[((y + size) % size) * size + ((x + size) % size)];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tl = at(x - 1, y - 1);
      const tc = at(x, y - 1);
      const tr = at(x + 1, y - 1);
      const ml = at(x - 1, y);
      const mr = at(x + 1, y);
      const bl = at(x - 1, y + 1);
      const bc = at(x, y + 1);
      const br = at(x + 1, y + 1);

      const du = ((tr + 2 * mr + br - tl - 2 * ml - bl) / 4) * gain;
      const dv = ((tl + 2 * tc + tr - bl - 2 * bc - br) / 4) * gain;
      const len = Math.hypot(du, dv, 1);
      const k = (y * size + x) * 4;
      img.data[k] = ((-du / len) * 0.5 + 0.5) * 255;
      img.data[k + 1] = ((-dv / len) * 0.5 + 0.5) * 255;
      img.data[k + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      img.data[k + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Campo de altura → canvas en gris, con una curva de remapeo. */
function grayFrom(
  height: Float32Array,
  size: number,
  remap: (h: number, i: number) => number,
): HTMLCanvasElement {
  const { canvas, ctx } = surface(size);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < height.length; i++) {
    const v = clamp01(remap(height[i], i)) * 255;
    const k = i * 4;
    img.data[k] = v;
    img.data[k + 1] = v;
    img.data[k + 2] = v;
    img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Campo de altura → canvas coloreado (para emisivos). */
function tintFrom(
  height: Float32Array,
  size: number,
  remap: (h: number) => [number, number, number],
): HTMLCanvasElement {
  const { canvas, ctx } = surface(size);
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < height.length; i++) {
    const [r, g, b] = remap(height[i]);
    const k = i * 4;
    img.data[k] = clamp01(r) * 255;
    img.data[k + 1] = clamp01(g) * 255;
    img.data[k + 2] = clamp01(b) * 255;
    img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Escamas                                                             */
/* ------------------------------------------------------------------ */

type ScalePalette = {
  core: string;
  mid: string;
  edge: string;
  line: string;
};

const HEIGHT_PALETTE: ScalePalette = {
  core: "#ffffff",
  mid: "#c4c4c4",
  edge: "#3c3c3c",
  line: "#000000",
};

const COLOR_PALETTE: ScalePalette = {
  core: "#f0d4a0",  // ámbar claro, escama recién mudada
  mid: "#c4854a",   // bronce medio
  edge: "#7a4820",  // borde cuero oscuro
  line: "#4a2810",  // surco profundo
};

/**
 * Una escama: gota redondeada arriba, punta abajo, con volumen radial y una
 * quilla por el centro.
 *
 * La quilla es lo que separa una escama de reptil de una lentejuela. Sin
 * ella cada escama devuelve un único reflejo redondo y la piel entera se lee
 * como plástico moldeado; con ella el brillo se parte en dos vertientes y
 * sigue la forma del cuerpo.
 */
function drawScale(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  hw: number,
  hh: number,
  palette: ScalePalette,
  jitter: number,
  keel: number,
) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + hh * 0.66);
  ctx.bezierCurveTo(
    cx - hw,
    cy + hh * 0.18,
    cx - hw * 1.02,
    cy - hh * 0.44,
    cx,
    cy - hh * 0.52,
  );
  ctx.bezierCurveTo(
    cx + hw * 1.02,
    cy - hh * 0.44,
    cx + hw,
    cy + hh * 0.18,
    cx,
    cy + hh * 0.66,
  );
  ctx.closePath();

  const g = ctx.createRadialGradient(
    cx,
    cy - hh * 0.16,
    hw * 0.08,
    cx,
    cy + hh * 0.24,
    hw * 1.6,
  );
  g.addColorStop(0, palette.core);
  g.addColorStop(0.5, palette.mid);
  g.addColorStop(1, palette.edge);
  ctx.fillStyle = g;
  ctx.fill();

  // Cada escama, un punto más clara o más oscura que su vecina
  ctx.fillStyle =
    jitter > 0
      ? "rgba(255,255,255," + jitter * 0.16 + ")"
      : "rgba(0,0,0," + -jitter * 0.16 + ")";
  ctx.fill();

  if (keel > 0) {
    // Quilla central y dos vaguadas a los lados, recortadas por la escama
    ctx.save();
    ctx.clip();
    const k = ctx.createLinearGradient(cx - hw, cy, cx + hw, cy);
    k.addColorStop(0, "rgba(0,0,0," + keel * 0.34 + ")");
    k.addColorStop(0.3, "rgba(0,0,0," + keel * 0.08 + ")");
    k.addColorStop(0.5, "rgba(255,255,255," + keel * 0.6 + ")");
    k.addColorStop(0.7, "rgba(0,0,0," + keel * 0.08 + ")");
    k.addColorStop(1, "rgba(0,0,0," + keel * 0.34 + ")");
    ctx.fillStyle = k;
    ctx.fillRect(cx - hw * 1.3, cy - hh * 1.3, hw * 2.6, hh * 2.6);
    ctx.restore();
  }

  ctx.lineWidth = Math.max(0.6, hw * 0.055);
  ctx.strokeStyle = palette.line;
  ctx.stroke();
}

export type SkinMaps = {
  color: THREE.Texture;
  normal: THREE.Texture;
  rough: THREE.Texture;
  emissive: THREE.Texture;
  ao: THREE.Texture;
};

/**
 * Escamas imbricadas: filas alternadas, cada una montada sobre la anterior.
 * Se dibuja una fila de más arriba y abajo para que el mosaico case al repetir.
 *
 * Encima van las tres capas que le quitan el aire de material sintético: poro
 * en el relieve, moteado de baja frecuencia en el color (ninguna piel es de un
 * solo tono) y un mapa de oclusión para que el surco entre escamas quede en
 * sombra de verdad y no solo insinuado por el normal.
 */
export function buildSkinMaps(size = 1024): SkinMaps {
  const cols = 15;
  const rows = 20;
  const cw = size / cols;
  const rh = size / rows;

  const h = surface(size);
  const c = surface(size);

  h.ctx.fillStyle = "#101010";
  h.ctx.fillRect(0, 0, size, size);
  c.ctx.fillStyle = "#4a2810";  // surco entre escamas: cuero oscuro caliente
  c.ctx.fillRect(0, 0, size, size);

  const rand = rng(0x5eed);
  for (let row = -1; row <= rows; row++) {
    for (let col = -1; col <= cols; col++) {
      const cx = (col + (Math.abs(row % 2) === 1 ? 0.5 : 0)) * cw + cw * 0.5;
      const cy = row * rh + rh * 0.5;
      const jitter = rand() * 2 - 1;
      // Se solapan de sobra: sin solape se leen como lunares, no como escamas
      const hw = cw * 0.78;
      const hh = rh * 1.28;
      drawScale(h.ctx, cx, cy, hw, hh, HEIGHT_PALETTE, jitter, 1);
      drawScale(c.ctx, cx, cy, hw, hh, COLOR_PALETTE, jitter, 0.22);
    }
  }

  const height = heightOf(h.canvas);

  // Poro y desgaste. Ruido con estructura, no ruido blanco: el blanco se
  // promedia en el primer mipmap y desaparece justo cuando hace falta.
  //
  // Las octavas se cuentan: cada una es un millón de iteraciones a 1024 y
  // todo esto corre en el hilo principal al montar el hero. El poro ya es la
  // frecuencia más alta que se ve, y al desgaste no le hace nada una tercera.
  const pore = fbm(size, Math.max(8, Math.round(size / 7)), 1, 0x9017);
  const wear = fbm(size, 6, 2, 0x31ba);
  for (let i = 0; i < height.length; i++) {
    height[i] = clamp01(
      height[i] + (pore[i] - 0.5) * 0.085 + (wear[i] - 0.5) * 0.05,
    );
  }

  // Moteado: manchas oscuras y doradas sobre bronce, como un varano de Komodo
  const blotch = fbm(size, 5, 2, 0x77ac);
  const img = c.ctx.getImageData(0, 0, size, size);
  for (let i = 0; i < size * size; i++) {
    const k = i * 4;
    // Manchas dorado-claras en las protuberancias, oscuro en los surcos
    const gold = smoothstep(0.58, 0.9, blotch[i]);
    const dark = smoothstep(0.1, 0.4, 1 - blotch[i]);
    const shade = 0.82 + wear[i] * 0.32;
    img.data[k] = clamp01((img.data[k] / 255) * shade * (1 + gold * 0.55 - dark * 0.28)) * 255;
    img.data[k + 1] =
      clamp01((img.data[k + 1] / 255) * shade * (1 + gold * 0.18 - dark * 0.18)) * 255;
    img.data[k + 2] =
      clamp01((img.data[k + 2] / 255) * shade * (1 - gold * 0.2 - dark * 0.1)) * 255;
  }
  c.ctx.putImageData(img, 0, 0);

  return {
    color: toTexture(c.canvas, { srgb: true }),
    // Normal más fuerte: las escamas han de resaltar como escudos, no como relieve plano
    normal: toTexture(normalFrom(height, size, 2.4)),
    // Corona de la escama más pulida; junta seca y desgastada
    rough: toTexture(
      grayFrom(height, size, (v, i) => 0.68 - v * 0.52 + (wear[i] - 0.5) * 0.18),
    ),
    // Oclusión más profunda en el surco: sombra propia de verdad
    ao: toTexture(
      grayFrom(height, size, (v) => 0.28 + 0.72 * Math.pow(clamp01(v), 0.45)),
    ),
    // Brasa en las juntas: más intensa — el surco entre escamas incandescente
    emissive: toTexture(
      tintFrom(height, size, (v) => {
        const e = Math.pow(Math.max(0, (0.18 - v) / 0.18), 2.2) * 1.1;
        return [e * 0.96, e * 0.42, e * 0.08];
      }),
      { srgb: true },
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Membrana del ala                                                    */
/* ------------------------------------------------------------------ */

export type MembraneMaps = {
  color: THREE.Texture;
  normal: THREE.Texture;
  rough: THREE.Texture;
  alpha: THREE.Texture;
};

/** Vena ramificada: se parte en dos y adelgaza hasta desaparecer. */
function drawVein(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  len: number,
  width: number,
  depth: number,
  rand: () => number,
) {
  if (depth <= 0 || len < 4 || width < 0.3) return;

  const x2 = x + Math.cos(angle) * len;
  const y2 = y + Math.sin(angle) * len;
  const bend = (rand() - 0.5) * len * 0.35;
  const mx = (x + x2) / 2 - Math.sin(angle) * bend;
  const my = (y + y2) / 2 + Math.cos(angle) * bend;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(mx, my, x2, y2);
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();

  const spread = 0.3 + rand() * 0.26;
  drawVein(ctx, x2, y2, angle + spread, len * 0.7, width * 0.66, depth - 1, rand);
  drawVein(ctx, x2, y2, angle - spread, len * 0.74, width * 0.68, depth - 1, rand);
}

/** Todo el sistema vascular sale de la raíz del ala y abre en abanico. */
function veinPass(
  ctx: CanvasRenderingContext2D,
  size: number,
  stroke: string,
  scale: number,
  seed: number,
  depth = 3,
) {
  ctx.strokeStyle = stroke;
  const rootX = size * 0.02;
  const rootY = size * 0.6;
  const rand = rng(seed);
  const fans = 6;
  for (let i = 0; i < fans; i++) {
    const t = i / (fans - 1);
    const angle = -0.95 + t * 1.55;
    drawVein(
      ctx,
      rootX,
      rootY,
      angle,
      size * 0.29,
      size * 0.032 * scale,
      depth,
      rand,
    );
  }
}

export function buildMembraneMaps(size = 1024): MembraneMaps {
  const c = surface(size);
  const h = surface(size);
  const a = surface(size);

  // Base: marrón rojizo oscuro — como la membrana de un murciélago a contraluz
  const base = c.ctx.createLinearGradient(0, size, size, 0);
  base.addColorStop(0, "#120602");
  base.addColorStop(0.55, "#1e0c06");
  base.addColorStop(1, "#2a1408");
  c.ctx.fillStyle = base;
  c.ctx.fillRect(0, 0, size, size);

  // Pliegues finos: la membrana nunca está tensa del todo
  const rand = rng(0xbeef);
  c.ctx.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const y0 = rand() * size;
    c.ctx.strokeStyle = "rgba(130,180,215," + (0.01 + rand() * 0.02) + ")";
    c.ctx.beginPath();
    c.ctx.moveTo(0, y0);
    c.ctx.quadraticCurveTo(
      size * 0.5,
      y0 + (rand() - 0.5) * size * 0.4,
      size,
      y0 + (rand() - 0.5) * size * 0.3,
    );
    c.ctx.stroke();
  }

  h.ctx.fillStyle = "#1a1a1a";
  h.ctx.fillRect(0, 0, size, size);
  a.ctx.fillStyle = "#e4eaee";
  a.ctx.fillRect(0, 0, size, size);

  // Arrugas del patagio en el relieve: del borde de ataque al de fuga. Son lo
  // que impide que la luz rasante resbale por una lámina lisa.
  h.ctx.lineCap = "round";
  for (let i = 0; i < 70; i++) {
    const y0 = rand() * size;
    const y1 = y0 + (rand() - 0.5) * size * 0.5;
    const bright = rand() > 0.5;
    h.ctx.strokeStyle = bright
      ? "rgba(255,255,255," + (0.05 + rand() * 0.1) + ")"
      : "rgba(0,0,0," + (0.05 + rand() * 0.1) + ")";
    h.ctx.lineWidth = 1 + rand() * (size / 340);
    h.ctx.beginPath();
    h.ctx.moveTo(0, y0);
    h.ctx.quadraticCurveTo(
      size * 0.55,
      (y0 + y1) / 2 + (rand() - 0.5) * size * 0.12,
      size,
      y1,
    );
    h.ctx.stroke();
  }

  try {
    h.ctx.filter = "blur(2px)";
  } catch {
    /* si el navegador no filtra, las venas quedan más marcadas */
  }

  // Venas: oscuras en color, altas en relieve, opacas en el alfa
  veinPass(c.ctx, size, "rgba(18,4,2,0.85)", 1, 0xc0ffee);
  veinPass(h.ctx, size, "rgba(255,255,255,0.85)", 1, 0xc0ffee);
  veinPass(a.ctx, size, "rgba(225,215,208,0.95)", 1, 0xc0ffee);
  // Capilares: una malla mucho más fina colgando de los troncos
  veinPass(c.ctx, size, "rgba(28,8,4,0.35)", 0.3, 0x51de5, 5);
  veinPass(h.ctx, size, "rgba(255,255,255,0.38)", 0.3, 0x51de5, 5);
  // Última pasada fina: el brillo naranja-cálido del borde de la vena (sangre)
  veinPass(c.ctx, size, "rgba(180,80,30,0.12)", 0.35, 0xc0ffee);
  h.ctx.filter = "none";

  const height = heightOf(h.canvas);
  const grain = fbm(size, 24, 2, 0x2c1e);
  for (let i = 0; i < height.length; i++) {
    height[i] = clamp01(height[i] + (grain[i] - 0.5) * 0.13);
  }

  return {
    color: toTexture(c.canvas, { srgb: true, clamp: true }),
    normal: toTexture(normalFrom(height, size, 1.1), { clamp: true }),
    rough: toTexture(
      grayFrom(height, size, (v, i) => 0.5 + v * 0.28 + (grain[i] - 0.5) * 0.12),
      { clamp: true },
    ),
    alpha: toTexture(a.canvas, { clamp: true }),
  };
}

/* ------------------------------------------------------------------ */
/* Queratina: cuernos, garras, dientes                                 */
/* ------------------------------------------------------------------ */

export type BoneMaps = {
  color: THREE.Texture;
  normal: THREE.Texture;
  rough: THREE.Texture;
};

export function buildBoneMaps(size = 512): BoneMaps {
  const c = surface(size);
  const h = surface(size);

  c.ctx.fillStyle = "#d9c8a8";
  c.ctx.fillRect(0, 0, size, size);
  h.ctx.fillStyle = "#8a8a8a";
  h.ctx.fillRect(0, 0, size, size);

  const rand = rng(0x0b04e);
  const px = size / 256;

  // Estrías longitudinales
  for (let i = 0; i < 180; i++) {
    const x = rand() * size;
    const w = (1 + rand() * 3.5) * px;
    const dark = rand() > 0.5;
    c.ctx.fillStyle = dark
      ? "rgba(112,90,58," + (0.06 + rand() * 0.12) + ")"
      : "rgba(255,246,226," + (0.05 + rand() * 0.12) + ")";
    c.ctx.fillRect(x, 0, w, size);
    h.ctx.fillStyle = dark
      ? "rgba(0,0,0," + (0.1 + rand() * 0.2) + ")"
      : "rgba(255,255,255," + (0.08 + rand() * 0.2) + ")";
    h.ctx.fillRect(x, 0, w, size);
  }

  // Anillos de crecimiento, a intervalos regulares para que siga siendo tileable
  const bands = 9;
  for (let i = 0; i < bands; i++) {
    const y = (i / bands) * size;
    const bh = size / bands;
    c.ctx.fillStyle = "rgba(96,74,46," + (0.08 + rand() * 0.06) + ")";
    c.ctx.fillRect(0, y, size, bh * 0.22);
    h.ctx.fillStyle = "rgba(0,0,0,0.3)";
    h.ctx.fillRect(0, y, size, bh * 0.14);
    h.ctx.fillStyle = "rgba(255,255,255,0.22)";
    h.ctx.fillRect(0, y + bh * 0.14, size, bh * 0.1);
  }

  // Mellas y arañazos: un cuerno con uso no es una pieza torneada
  for (let i = 0; i < 26; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = (2 + rand() * 5) * px;
    const ry = r * (0.4 + rand() * 0.5);
    const tilt = rand() * Math.PI;
    h.ctx.fillStyle = "rgba(0,0,0," + (0.14 + rand() * 0.2) + ")";
    h.ctx.beginPath();
    h.ctx.ellipse(x, y, r, ry, tilt, 0, Math.PI * 2);
    h.ctx.fill();
    c.ctx.fillStyle = "rgba(84,64,38," + (0.08 + rand() * 0.12) + ")";
    c.ctx.beginPath();
    c.ctx.ellipse(x, y, r, ry, tilt, 0, Math.PI * 2);
    c.ctx.fill();
  }

  const height = heightOf(h.canvas);
  const grain = fbm(size, 32, 2, 0x7bd1);
  for (let i = 0; i < height.length; i++) {
    height[i] = clamp01(height[i] + (grain[i] - 0.5) * 0.12);
  }

  return {
    color: toTexture(c.canvas, { srgb: true }),
    normal: toTexture(normalFrom(height, size, 1.2)),
    rough: toTexture(
      grayFrom(height, size, (v, i) => 0.38 + v * 0.3 + (grain[i] - 0.5) * 0.14),
    ),
  };
}

/* ------------------------------------------------------------------ */
/* Iris                                                                */
/* ------------------------------------------------------------------ */

/** Iris de reptil: fibras radiales, núcleo encendido y anillo limbal oscuro. */
export function buildIrisMap(size = 256): THREE.Texture {
  const { canvas, ctx } = surface(size);
  const r = size / 2;

  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "#fff3d2");
  g.addColorStop(0.28, "#ffb545");
  g.addColorStop(0.72, "#e0620f");
  g.addColorStop(1, "#3a1403");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const rand = rng(0x1215);
  const fibers = 220;
  ctx.lineWidth = Math.max(1, size / 190);
  for (let i = 0; i < fibers; i++) {
    const a = (i / fibers) * Math.PI * 2 + rand() * 0.04;
    const inner = r * (0.18 + rand() * 0.12);
    const outer = r * (0.72 + rand() * 0.26);
    ctx.strokeStyle =
      rand() > 0.5
        ? "rgba(255,232,178," + (0.1 + rand() * 0.25) + ")"
        : "rgba(84,28,4," + (0.12 + rand() * 0.3) + ")";
    ctx.beginPath();
    ctx.moveTo(r + Math.cos(a) * inner, r + Math.sin(a) * inner);
    ctx.lineTo(r + Math.cos(a) * outer, r + Math.sin(a) * outer);
    ctx.stroke();
  }

  // Criptas: los huecos irregulares del collarete, junto a la pupila
  for (let i = 0; i < 34; i++) {
    const a = rand() * Math.PI * 2;
    const d = r * (0.24 + rand() * 0.2);
    ctx.fillStyle = "rgba(58,18,2," + (0.14 + rand() * 0.22) + ")";
    ctx.beginPath();
    ctx.ellipse(
      r + Math.cos(a) * d,
      r + Math.sin(a) * d,
      r * (0.02 + rand() * 0.05),
      r * (0.04 + rand() * 0.09),
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Anillo limbal: el borde del iris siempre es más oscuro que su centro
  const limbal = ctx.createRadialGradient(r, r, r * 0.72, r, r, r);
  limbal.addColorStop(0, "rgba(24,8,2,0)");
  limbal.addColorStop(1, "rgba(14,4,1,0.85)");
  ctx.fillStyle = limbal;
  ctx.fillRect(0, 0, size, size);

  // Pupila vertical, con el canto difuminado contra el iris
  ctx.fillStyle = "#080300";
  ctx.beginPath();
  ctx.ellipse(r, r, r * 0.12, r * 0.66, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,3,0,0.5)";
  ctx.lineWidth = size / 64;
  ctx.stroke();

  return toTexture(canvas, { srgb: true, clamp: true });
}

/* ------------------------------------------------------------------ */
/* Llama                                                               */
/* ------------------------------------------------------------------ */

/**
 * Grano de fuego: un disco de bordes muy suaves, más denso en el centro y con
 * la silueta mordida para que al apilarse no se vean círculos sino lengua.
 */
export function buildFireSprite(size = 128): THREE.Texture {
  const { canvas, ctx } = surface(size);
  const r = size / 2;

  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.72)");
  g.addColorStop(0.55, "rgba(255,255,255,0.24)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  // Mordiscos en el borde: rompen la circunferencia perfecta
  const rand = rng(0xf1a3e);
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2;
    const d = r * (0.62 + rand() * 0.34);
    ctx.beginPath();
    ctx.arc(
      r + Math.cos(a) * d,
      r + Math.sin(a) * d,
      r * (0.1 + rand() * 0.18),
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = "rgba(0,0,0," + (0.35 + rand() * 0.45) + ")";
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  return toTexture(canvas, { clamp: true });
}

/** Copia un mapa con otra densidad de repetición, compartiendo la imagen. */
export function retile(
  tex: THREE.Texture,
  u: number,
  v: number,
): THREE.Texture {
  const t = tex.clone();
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(u, v);
  t.anisotropy = maxAnisotropy;
  t.needsUpdate = true;
  return t;
}
