// Revisa el selector de servicios: alto de la página, cambio de pestaña,
// que el dragón siga recorriendo la página y errores.
//
//   node scripts/medir/servicios.mjs URL prefijo [ancho alto]
import { writeFileSync } from "node:fs";
import { goto, launch, sleep, viewport } from "./cdp.mjs";

const [url, out = "serv", w = "1536", h = "864"] = process.argv.slice(2);
const W = Number(w);
const c = await launch();
const errs = [];
c.on((m) => {
  if (m.method === "Runtime.exceptionThrown") errs.push(m.params.exceptionDetails?.exception?.description?.slice(0, 200));
});
const shot = async (name) => {
  const { data } = await c.send("Page.captureScreenshot", { format: "png" });
  writeFileSync(`${out}-${name}.png`, Buffer.from(data, "base64"));
};
try {
  await viewport(c, W, Number(h), W < 768);
  // `?debug` expone la etapa del dragón en `window.__bouw`
  await goto(c, url + (url.includes("?") ? "&" : "?") + "debug");
  await sleep(7000);
  console.log(
    await c.evaluate(`(() => {
      const secs = [...document.querySelectorAll("main > *, footer")].filter((e) => e.offsetHeight > 80)
        .map((e) => (e.id || e.tagName.toLowerCase()) + " " + (e.offsetHeight / innerHeight).toFixed(1));
      return "total " + (document.documentElement.scrollHeight / innerHeight).toFixed(1) + " pantallas · " + secs.join(" | ");
    })()`),
  );
  const go = (sel) => c.evaluate(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({ block: "start", behavior: "instant" }); window.scrollBy({ top: -90, behavior: "instant" })`);
  const stage = () => c.evaluate(`window.__bouw ? window.__bouw.stats.stage.toFixed(2) : "sin debug"`);

  await go(".vitrina");
  await sleep(2500);
  console.log("etapa en la vitrina:", await stage());
  await go("[data-stage-row]");
  await sleep(2500);
  console.log("etapa en el selector:", await stage());
  await shot("lean");

  const p = await c.evaluate(`(() => { const b = document.querySelectorAll('[data-stage-row] [role=tab]')[1]; const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: p.x, y: p.y, button: "left", clickCount: 1 });
  await sleep(2500);
  console.log("pestaña:", await c.evaluate(`document.querySelector('[data-stage-row] [aria-selected=true]').textContent`), "· panel:", await c.evaluate(`document.querySelector('#servicio-panel h3')?.textContent.slice(0, 50)`));
  await shot("bpm");

  for (const id of ["servicios", "contacto"]) {
    await go("#" + id);
    await sleep(2500);
    console.log(`etapa en ${id}:`, await stage());
  }
  console.log("errores:", errs.length, errs.slice(0, 3).join(" | "));
} finally {
  c.close();
}
