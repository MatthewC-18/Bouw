// Cambiar a oscuro con el botón de la barra y capturar.
//   node scripts/medir/tema.mjs URL prefijo
import { writeFileSync } from "node:fs";
import { goto, launch, sleep, viewport } from "./cdp.mjs";
const [url, out = "tema"] = process.argv.slice(2);
const c = await launch();
const log = [];
c.on((m) => {
  if (m.method === "Runtime.exceptionThrown") log.push("EXC " + m.params.exceptionDetails?.exception?.description?.slice(0, 300));
});
try {
  await viewport(c, 1364, 745, false);
  await goto(c, url);
  await sleep(9000);
  const p = await c.evaluate(`(() => { const b = [...document.querySelectorAll("button")].find((x) => /oscur|dark|tema|theme|modo|claro|light/i.test((x.getAttribute("aria-label") || "") + x.title)); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, l: b.getAttribute("aria-label") }; })()`);
  console.log("botón", JSON.stringify(p));
  await c.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: p.x, y: p.y });
  await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
  for (const s of [1, 4]) {
    await sleep(s === 1 ? 1000 : 3000);
    const { data } = await c.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}-${s}s.png`, Buffer.from(data, "base64"));
  }
  console.log(await c.evaluate(`JSON.stringify({ theme: document.documentElement.dataset.theme, bg: getComputedStyle(document.body).backgroundColor, main: getComputedStyle(document.querySelector("main")).opacity, vt: !!document.activeViewTransition })`));
  console.log(log.join("\n") || "sin errores");
} finally {
  c.close();
}
