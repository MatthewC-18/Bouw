// Portada en modo oscuro: capturas a varios segundos y errores de consola.
//   node scripts/medir/oscuro.mjs URL prefijo
import { writeFileSync } from "node:fs";
import { goto, launch, sleep, viewport } from "./cdp.mjs";
const [url, out = "oscuro"] = process.argv.slice(2);
const c = await launch();
const log = [];
c.on((m) => {
  if (m.method === "Runtime.exceptionThrown") log.push("EXC " + m.params.exceptionDetails?.exception?.description?.slice(0, 300));
  if (m.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(m.params.type)) log.push(m.params.type + " " + JSON.stringify(m.params.args?.map((a) => a.value ?? a.description)).slice(0, 300));
});
try {
  await viewport(c, 1364, 745, false);
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }] });
  // Modo oscuro elegido con el botón: se guarda en localStorage
  await c.send("Page.addScriptToEvaluateOnNewDocument", { source: `try { localStorage.setItem("bouw-theme", "dark"); } catch (e) {}` });
  await goto(c, url);
  for (const s of [2, 6, 14]) {
    await sleep(s === 2 ? 2000 : s === 6 ? 4000 : 8000);
    const { data } = await c.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}-${s}s.png`, Buffer.from(data, "base64"));
  }
  console.log(await c.evaluate(`(() => {
    const h = document.querySelector("h1");
    const cs = h && getComputedStyle(h);
    const rv = [...document.querySelectorAll(".reveal")];
    return JSON.stringify({ theme: document.documentElement.dataset.theme, h1: h?.textContent.slice(0, 40), h1op: cs?.opacity, h1color: cs?.color, h1vis: cs?.visibility, reveals: rv.length, visibles: rv.filter((e) => e.classList.contains("is-visible")).length, scroll: scrollY });
  })()`));
  console.log(log.slice(0, 8).join("\n") || "sin errores");
} finally {
  c.close();
}
