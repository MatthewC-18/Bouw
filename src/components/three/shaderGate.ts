import type * as THREE from "three";

/**
 * Espera a que los shaders de un objeto estén compilados antes de dibujarlo.
 *
 * 25 nov 2026, medido en Windows con gráfica Intel y la caché del navegador
 * vacía (la primera visita de cualquiera): el primer fotograma de la escena
 * congelaba la página de 3,8 a 4,9 s, y la aparición del dragón otro segundo.
 * Al dibujar algo por primera vez, el navegador compila su material y espera a
 * que termine. La palabra BOUW se llevaba unos 2 s y el dragón 1 s.
 *
 * Aquí se pide la compilación aparte (`compile`, que en Chrome va en paralelo
 * con `KHR_parallel_shader_compile`) y el objeto espera invisible hasta que
 * `isReady` dice que sí: la página sigue respondiendo mientras tanto. Sin esa
 * extensión, `isReady` contesta que sí al momento y todo queda como antes.
 * Tope de `maxWait` segundos por si un driver no contesta nunca.
 */
export type ShaderGate = {
  ready: boolean;
  pending: Set<THREE.Material> | null;
  since: number;
};

export const newShaderGate = (): ShaderGate => ({ ready: false, pending: null, since: 0 });

export function shadersReady(
  gate: ShaderGate,
  gl: THREE.WebGLRenderer,
  object: THREE.Object3D,
  camera: THREE.Camera,
  scene: THREE.Scene,
  now: number,
  maxWait = 4,
): boolean {
  if (gate.ready) return true;
  if (!gate.pending) {
    try {
      gate.pending = gl.compile(object, camera, scene);
    } catch {
      gate.pending = new Set();
    }
    gate.since = now;
  }
  for (const m of gate.pending) {
    const program = (gl.properties.get(m) as { currentProgram?: { isReady(): boolean } })
      .currentProgram;
    if (!program || program.isReady()) gate.pending.delete(m);
  }
  if (gate.pending.size > 0 && now - gate.since < maxWait) return false;
  gate.ready = true;
  return true;
}
