/**
 * Interruptores de rendimiento por URL: `?perf=nobloom,aa0,dpr:0.8,nodragon`.
 *
 * Existen para medir, no para el visitante. La escena tiene media docena de
 * piezas que cuestan GPU —dragón, campo de piezas, marca, polvo, bloom,
 * antialias, luces— y la única forma honesta de saber cuál pesa es apagarlas
 * de una en una con el mismo recorrido de scroll y comparar. Sin parámetro no
 * cambia nada.
 */
type Flags = {
  nodragon: boolean;
  nopieces: boolean;
  nomark: boolean;
  nodust: boolean;
  nobloom: boolean;
  noenv: boolean;
  aa0: boolean;
  lights2: boolean;
  dpr: number | null;
  fps: number | null;
};

const parse = (): Flags => {
  const f: Flags = {
    nodragon: false,
    nopieces: false,
    nomark: false,
    nodust: false,
    nobloom: false,
    noenv: false,
    aa0: false,
    lights2: false,
    dpr: null,
    fps: null,
  };
  if (typeof window === "undefined") return f;
  const raw = new URLSearchParams(window.location.search).get("perf");
  if (!raw) return f;
  for (const part of raw.split(",")) {
    const [k, v] = part.split(":");
    if (k === "dpr" || k === "fps") f[k] = Number(v) || null;
    else if (k in f) (f as Record<string, unknown>)[k] = true;
  }
  return f;
};

export const perf = parse();
