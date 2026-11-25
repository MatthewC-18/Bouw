// El arranque de la escena 3D y el coste de marcar «bajando».
//
//   node scripts/medir/raf-arranque.mjs https://www.bouwlatam.com/
//
// 1) Con la página quieta, qué fotogramas pasan de 150 ms desde que carga y
//    cuándo, contando desde que aparece el lienzo 3D.
// 2) Cuánto cuesta poner y quitar `data-scrolling` en <html> (la regla
//    `html[data-scrolling] body { pointer-events: none }`) frente a cambiar
//    una capa fija sola.
import { goto, launch, sleep, viewport } from "./cdp.mjs";

const url = process.argv[2] || "https://www.bouwlatam.com/";
const c = await launch();
try {
  await viewport(c, 1536, 864, false);
  await c.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__big = [];
      new MutationObserver(() => { if (!window.__canvasAt && document.querySelector("canvas")) window.__canvasAt = Math.round(performance.now()); }).observe(document, { childList: true, subtree: true });
      const orig = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = function (cb) {
        const st = (new Error().stack || "").split("\\n").slice(2, 4).map((l) => l.trim().replace(/^at /, "").replace(/https?:\\/\\/[^/]+\\/_next\\/static\\/immutable\\/chunks\\//, "")).join(" < ");
        return orig(function (t) {
          const a = performance.now();
          try { return cb(t); } finally {
            const d = performance.now() - a;
            if (d > 150) __big.push({ t: Math.round(a), ms: Math.round(d), quien: st.slice(0, 70) });
          }
        });
      };
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (e.duration > 300) __big.push({ t: Math.round(e.startTime), ms: Math.round(e.duration), quien: "tarea larga" }); })).observe({ type: "longtask", buffered: true });
    `,
  });
  // `--frio`: una sola visita con el perfil vacío, como alguien que entra por
  // primera vez (sin shaders en la caché del navegador)
  if (!process.argv.includes("--frio")) {
    await goto(c, url);
    await sleep(6000);
  }
  await goto(c, url);
  await sleep(16000);
  console.log("lienzo creado a", await c.evaluate("window.__canvasAt"), "ms");
  console.table(JSON.parse(await c.evaluate("JSON.stringify(__big.sort((a, b) => a.t - b.t))")));
  console.log(
    await c.evaluate(`(() => {
      const n = document.getElementsByTagName("*").length;
      const r = document.documentElement;
      const res = [];
      for (let i = 0; i < 4; i++) {
        let a = performance.now();
        r.setAttribute("data-scrolling", ""); document.body.getBoundingClientRect();
        const on = performance.now() - a;
        a = performance.now();
        r.removeAttribute("data-scrolling"); document.body.getBoundingClientRect();
        res.push([+on.toFixed(1), +(performance.now() - a).toFixed(1)]);
      }
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;z-index:2147483647;pointer-events:none";
      document.body.appendChild(ov); document.body.getBoundingClientRect();
      const res2 = [];
      for (let i = 0; i < 4; i++) {
        let a = performance.now();
        ov.style.pointerEvents = "auto"; document.body.getBoundingClientRect();
        const on = performance.now() - a;
        a = performance.now();
        ov.style.pointerEvents = "none"; document.body.getBoundingClientRect();
        res2.push([+on.toFixed(1), +(performance.now() - a).toFixed(1)]);
      }
      return "elementos " + n + " · atributo en html, ms poner/quitar " + JSON.stringify(res) + " · capa fija " + JSON.stringify(res2);
    })()`),
  );
} finally {
  c.close();
}
