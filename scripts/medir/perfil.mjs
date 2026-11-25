// Perfil de CPU del arranque: en qué funciones se va el hilo principal.
//
//   node scripts/medir/perfil.mjs https://www.bouwlatam.com/ [segundos]
//
// Graba desde que se abre la página (segunda visita, con caché) y suma el
// tiempo propio de cada función. Las del código de la página salen con su
// archivo y posición, para buscarlas en el bloque minificado.
import { writeFileSync } from "node:fs";
import { goto, launch, sleep, viewport } from "./cdp.mjs";

const url = process.argv[2] || "https://www.bouwlatam.com/";
const secs = Number(process.argv[3] || 14);
const c = await launch();
try {
  await viewport(c, 1536, 864, false);
  await goto(c, url);
  await sleep(6000);
  await c.send("Profiler.enable");
  await c.send("Profiler.setSamplingInterval", { interval: 500 });
  await c.send("Profiler.start");
  await goto(c, url);
  await sleep(secs * 1000);
  const { profile } = await c.send("Profiler.stop");
  writeFileSync("perfil.cpuprofile", JSON.stringify(profile));

  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i++) {
    const n = byId.get(profile.samples[i]);
    const f = n.callFrame;
    const key = `${f.functionName || "(anónima)"} ${f.url.split("/").pop()}:${f.lineNumber + 1}:${f.columnNumber + 1}`;
    self.set(key, (self.get(key) || 0) + (dt[i] || 0) / 1000);
  }
  const top = [...self].filter(([k]) => !k.startsWith("(idle)")).sort((a, b) => b[1] - a[1]).slice(0, 25);
  console.table(top.map(([k, ms]) => ({ ms: Math.round(ms), funcion: k.slice(0, 110) })));
} finally {
  c.close();
}
