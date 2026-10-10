/**
 * Nivel de calidad de la escena 3D según la gráfica de quien visita.
 *
 * Medido en un portátil con Intel UHD (la gráfica más común en los equipos de
 * oficina de nuestros clientes): la página bajaba a 21 fps al hacer scroll, y
 * sin WebGL iba a 66. Ninguna pieza de la escena era la culpable por sí sola
 * —sin dragón, 24; sin piezas, 21—: lo caro es redibujar un lienzo a pantalla
 * completa sesenta veces por segundo en una gráfica integrada. Así que en ese
 * hardware se dibuja menos: a 30 fps, con menos píxeles y sin bloom. El
 * scroll lo compone el navegador aparte, y sigue a 60.
 *
 * En gráfica dedicada (NVIDIA, Radeon, Apple M) la escena va completa.
 */
export type Tier = "high" | "low";

export type TierConfig = {
  tier: Tier;
  /** Tope de fotogramas del 3D; null = los que dé la pantalla. */
  fps: number | null;
  /** Presupuesto de píxeles del lienzo (ancho × alto × dpr²). */
  pixelBudget: number;
  bloom: boolean;
};

export const TIERS: Record<Tier, TierConfig> = {
  high: { tier: "high", fps: null, pixelBudget: 4.6e6, bloom: true },
  low: { tier: "low", fps: 30, pixelBudget: 1.1e6, bloom: false },
};

/** Gráficas integradas o de móvil, por el nombre que da el driver. */
const WEAK = /intel|uhd|iris|hd graphics|mali|adreno|powervr|apple a\d|swiftshader|llvmpipe|basic render|microsoft basic|vivante|videocore/i;

let cached: TierConfig | null = null;

export function detectTier(): TierConfig {
  if (cached) return cached;
  if (typeof window === "undefined") return TIERS.high;

  let renderer = "";
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl2") || canvas.getContext("webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || "");
      // Soltar el contexto de prueba: el navegador limita cuántos hay vivos
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    // Sin poder preguntar, se asume lo prudente
    renderer = "unknown";
  }

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  const weak = !renderer || renderer === "unknown" || WEAK.test(renderer) || cores <= 4 || memory <= 4 || coarse;
  // `?perf=high` / `?perf=low` fuerzan el nivel para medir
  const forced = new URLSearchParams(window.location.search).get("perf") ?? "";
  const tier: Tier = /\blow\b/.test(forced) ? "low" : /\bhigh\b/.test(forced) ? "high" : weak ? "low" : "high";

  cached = TIERS[tier];
  return cached;
}
