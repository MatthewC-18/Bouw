// Revisa la vitrina de proyectos: capturas, cambio de proyecto, que el alto
// no cambie, que pase sola y el alto de cada sección.
//
//   node scripts/medir/vitrina.mjs URL prefijo [ancho alto] [--oscuro] [--en]
import { writeFileSync } from "node:fs";
import { goto, launch, sleep, viewport } from "./cdp.mjs";

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith("--"));
const [url, out = "vitrina", w = "1536", h = "864"] = args.filter((a) => !a.startsWith("--"));
const W = Number(w);
const H = Number(h);
const c = await launch();
const errs = [];
c.on((m) => {
  if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200));
  if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errs.push(String(m.params.args?.[0]?.value ?? m.params.args?.[0]?.description).slice(0, 200));
});
const shot = async (name) => {
  const { data } = await c.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${out}-${name}.png`, Buffer.from(data, "base64"));
};
try {
  await viewport(c, W, H, W < 768);
  const pre = [];
  if (flags.includes("--oscuro")) pre.push(`localStorage.setItem("bouw-theme","dark");`);
  if (flags.includes("--en")) pre.push(`localStorage.setItem("bouw-lang","en");`);
  if (pre.length) await c.send("Page.addScriptToEvaluateOnNewDocument", { source: `try{${pre.join("")}}catch(e){}` });
  await goto(c, url);
  await sleep(7000);

  // Alto de cada sección, en pantallas
  console.log(
    await c.evaluate(`(() => {
      const secs = [...document.querySelectorAll("main > *, footer")].filter((e) => e.offsetHeight > 80)
        .map((e) => (e.id || e.tagName.toLowerCase()) + " " + (e.offsetHeight / innerHeight).toFixed(1));
      return "total " + (document.documentElement.scrollHeight / innerHeight).toFixed(1) + " pantallas · " + secs.join(" | ");
    })()`),
  );

  // A la vitrina
  await c.evaluate(`document.querySelector(".vitrina").scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy({ top: -90, behavior: "instant" })`);
  await sleep(2500);
  const state = () =>
    c.evaluate(`(() => {
      const a = document.querySelector(".vitrina");
      const sel = [...a.querySelectorAll('[role=tab][aria-selected=true]')].map((b) => b.textContent.trim().slice(0, 30));
      return JSON.stringify({ h: Math.round(a.getBoundingClientRect().height), sel: sel.filter((x, i, l) => l.indexOf(x) === i), body: document.documentElement.scrollHeight });
    })()`);
  console.log("al llegar", await state());
  await shot("0");

  // Pasa sola: esperar un turno entero
  await sleep(10000);
  console.log("tras 10 s", await state());

  // Tocar cada proyecto y medir el alto
  const tabs = await c.evaluate(`[...document.querySelectorAll('.vitrina [role=tab]')].filter((b) => b.offsetParent).length`);
  for (let i = 0; i < tabs; i++) {
    const p = await c.evaluate(`(() => { const b = [...document.querySelectorAll('.vitrina [role=tab]')].filter((b) => b.offsetParent)[${i}]; const r = b.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2 }; })()`);
    if (p.y < 0 || p.y > H) {
      await c.evaluate(`[...document.querySelectorAll('.vitrina [role=tab]')].filter((b) => b.offsetParent)[${i}].scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" })`);
      await sleep(600);
    }
    const q = await c.evaluate(`(() => { const b = [...document.querySelectorAll('.vitrina [role=tab]')].filter((b) => b.offsetParent)[${i}]; const r = b.getBoundingClientRect(); return { x: r.left + Math.min(r.width / 2, 60), y: r.top + r.height / 2 }; })()`);
    await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: q.x, y: q.y, button: "left", clickCount: 1 });
    await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: q.x, y: q.y, button: "left", clickCount: 1 });
    await sleep(2200);
    console.log(`proyecto ${i + 1}`, await state());
    await c.evaluate(`document.querySelector(".vitrina").scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy({ top: -90, behavior: "instant" })`);
    await sleep(700);
    await shot(String(i + 1));
  }
  // Nada del cliente sin nombre en el HTML
  console.log("filtración:", await c.evaluate(`/ideal|alambrec|armex|dramix|bekaert|cercas/i.test(document.documentElement.outerHTML)`));
  console.log("errores:", errs.length, errs.slice(0, 3).join(" | "));
} finally {
  c.close();
}
