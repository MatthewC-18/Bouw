// Qué callback de requestAnimationFrame se come el fotograma.
//
//   node scripts/medir/raf.mjs https://www.bouwlatam.com/ [--sinwebgl]
//
// Envuelve requestAnimationFrame antes de que cargue la página: cada callback
// se cronometra y se apunta a la línea del código que lo pidió (la pila al
// registrarlo). Así sale quién fuerza el diseño en cada fotograma, que el
// navegador solo atribuye a «FrameRequestCallback».
import { goto, launch, sleep, viewport } from "./cdp.mjs";

const url = process.argv[2] || "https://www.bouwlatam.com/";
const c = await launch();
try {
  await viewport(c, 1536, 864, false);
  if (process.argv.includes("--sinwebgl"))
    await c.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { return /webgl/.test(k) ? null : g.call(this, k, ...a); };`,
    });
  await c.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__raf = new Map();
      new MutationObserver(() => { if (!window.__canvasAt && document.querySelector("canvas")) window.__canvasAt = Math.round(performance.now()); }).observe(document, { childList: true, subtree: true });
      window.__rafOn = false;
      const orig = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = function (cb) {
        const st = (new Error().stack || "").split("\\n").slice(2, 4).map((l) => l.trim().replace(/^at /, "").replace(/https?:\\/\\/[^/]+\\/_next\\/static\\/immutable\\/chunks\\//, "")).join(" < ");
        return orig(function (t) {
          if (!window.__rafOn) return cb(t);
          const a = performance.now();
          try { return cb(t); } finally {
            const d = performance.now() - a;
            const o = __raf.get(st) || [0, 0, 0];
            o[0] += d; o[1] += 1; o[2] = Math.max(o[2], d);
            __raf.set(st, o);
            if (d > 150) (window.__big ||= []).push({ t: Math.round(a), ms: Math.round(d), y: Math.round(scrollY), quien: st.slice(0, 60) });
          }
        });
      };
    `,
  });
  await goto(c, url);
  await sleep(6000);
  await goto(c, url);
  await sleep(6000);
  await c.evaluate("window.__rafOn = true; window.__on0 = Math.round(performance.now())");
  const total = await c.evaluate("document.documentElement.scrollHeight");
  for (let i = 0; i < Math.ceil(total / 600); i++) {
    await c.send("Input.synthesizeScrollGesture", { x: 768, y: 520, yDistance: -600, speed: 1800, gestureSourceType: "mouse" });
    await sleep(300);
  }
  const out = await c.evaluate(`JSON.stringify([...__raf].sort((a, b) => b[1][0] - a[1][0]).slice(0, 12).map(([k, [ms, n, max]]) => ({ ms: Math.round(ms), veces: n, maxMs: Math.round(max), quien: k.slice(0, 160) })))`);
  console.table(JSON.parse(out));
  console.log("lienzo creado a", await c.evaluate("window.__canvasAt"), "ms; empezó a medir a", await c.evaluate("window.__on0"), "ms");
  console.table(JSON.parse(await c.evaluate("JSON.stringify(window.__big || [])")));
} finally {
  c.close();
}
