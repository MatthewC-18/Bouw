// Fluidez por sección: fotogramas al bajar, tareas largas y respuesta al tocar.
//
//   node scripts/medir/fluidez.mjs https://www.bouwlatam.com/ [telefono|escritorio]
//
// Baja la página con gestos de desplazamiento de verdad (los del dedo o la
// rueda, no `scrollTo`), mide el tiempo entre fotogramas con rAF y lo reparte
// por la sección que ocupa el centro de la pantalla. En el teléfono la CPU va
// 4 veces más lenta, como un Android de gama media.
import { goto, launch, sleep, viewport } from "./cdp.mjs";

const url = process.argv[2] || "https://www.bouwlatam.com/";
const modo = process.argv[3] || "escritorio";
const tel = modo === "telefono";

const c = await launch();
const errores = [];
c.on((m) => {
  if (m.method === "Runtime.exceptionThrown") errores.push(m.params.exceptionDetails?.exception?.description?.slice(0, 160));
});

try {
  if (tel) {
    await viewport(c, 390, 844, true);
    await c.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  } else await viewport(c, 1536, 864, false);

  // Observadores antes de que cargue nada
  await c.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__m = { long: [], cls: 0, lcp: 0, ev: [] };
      new PerformanceObserver((l) => l.getEntries().forEach((e) => __m.long.push([e.startTime, e.duration]))).observe({ type: "longtask", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) __m.cls += e.value; })).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (__m.lcp = e.startTime))).observe({ type: "largest-contentful-paint", buffered: true });
      window.__m.loaf = [];
      new PerformanceObserver((l) => l.getEntries().forEach((e) => {
        const sc = e.scripts || [];
        const js = sc.reduce((a, x) => a + x.duration, 0);
        const lay = e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0;
        const ren = e.renderStart && e.styleAndLayoutStart ? e.styleAndLayoutStart - e.renderStart : 0;
        __m.loaf.push({ t: e.startTime, d: e.duration, js, lay, ren, sc: sc.map((x) => [x.invoker + " " + (x.sourceFunctionName || "") + " " + (x.sourceURL || "").split("/").pop() + "@" + x.sourceCharPosition, x.duration, x.forcedStyleAndLayoutDuration || 0]) });
      })).observe({ type: "long-animation-frame", buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => __m.ev.push([e.name, Math.round(e.duration), Math.round(e.processingEnd - e.processingStart), e.target?.textContent?.trim().slice(0, 40) || ""]))).observe({ type: "event", buffered: true, durationThreshold: 16 });
    `,
  });

  // `--sinwebgl`: la página sin escena 3D, para saber cuánto cuesta la escena
  if (process.argv.includes("--sinwebgl"))
    await c.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (k, ...a) { return /webgl/.test(k) ? null : g.call(this, k, ...a); };`,
    });
  if (process.argv.includes("--calentar")) {
    await goto(c, url);
    await sleep(6000);
  }
  const t0 = Date.now();
  await goto(c, url);
  const carga = Date.now() - t0;
  await sleep(tel ? 9000 : 5000);

  const gpu = await c.evaluate(`(() => {
    const g = document.createElement("canvas").getContext("webgl");
    const x = g && g.getExtension("WEBGL_debug_renderer_info");
    return x ? g.getParameter(x.UNMASKED_RENDERER_WEBGL) : "sin WebGL";
  })()`);

  const inicio = await c.evaluate(`JSON.stringify({ lcp: Math.round(__m.lcp), cls: +__m.cls.toFixed(3), long: __m.long.length, longMs: Math.round(__m.long.reduce((a, b) => a + b[1], 0)) })`);

  // Las secciones: los hijos de <main> y el pie
  await c.evaluate(`(() => {
    const els = [...document.querySelectorAll("main > *"), ...document.querySelectorAll("footer")];
    window.__secs = els.filter((e) => e.offsetHeight > 80).map((e, i) => {
      const h = e.querySelector("h1, h2");
      const name = e.id || (h ? h.textContent.trim().slice(0, 28) : e.tagName.toLowerCase() + i);
      return { el: e, name };
    });
    window.__f = [];
    window.__long0 = __m.long.length;
    let last = performance.now();
    const tick = (t) => {
      const mid = innerHeight / 2;
      const s = __secs.find((s) => { const r = s.el.getBoundingClientRect(); return r.top <= mid && r.bottom > mid; });
      __f.push([t - last, s ? s.name : "?", t]);
      last = t;
      if (!window.__stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })()`);

  // Bajar con gestos reales, de a una pantalla
  const H = tel ? 844 : 864;
  const total = await c.evaluate("document.documentElement.scrollHeight");
  const pasos = Math.ceil(total / (H * 0.7));
  for (let i = 0; i < pasos; i++) {
    await c.send("Input.synthesizeScrollGesture", {
      x: tel ? 195 : 768,
      y: Math.round(H * 0.6),
      yDistance: -Math.round(H * 0.7),
      speed: tel ? 1400 : 1800,
      gestureSourceType: tel ? "touch" : "mouse",
      repeatCount: 1,
    });
    await sleep(350);
  }
  await sleep(800);

  const porSeccion = JSON.parse(
    await c.evaluate(`(() => {
      window.__stop = true;
      const longs = __m.long.slice(__long0);
      const by = new Map();
      for (const [d, n, t] of __f.slice(1)) {
        if (!by.has(n)) by.set(n, { n, d: [], t0: t, t1: t });
        const b = by.get(n); b.d.push(d); b.t1 = t;
      }
      return JSON.stringify([...by.values()].map((b) => {
        const s = [...b.d].sort((x, y) => x - y);
        const avg = s.reduce((a, x) => a + x, 0) / s.length;
        const lt = longs.filter(([st]) => st >= b.t0 - 50 && st <= b.t1 + 50);
        return {
          seccion: b.n,
          fotogramas: s.length,
          fps: Math.round(1000 / avg),
          p95ms: Math.round(s[Math.floor(s.length * 0.95)] || 0),
          tirones: s.filter((x) => x > 34).length,
          largas: lt.length,
          largasMs: Math.round(lt.reduce((a, x) => a + x[1], 0)),
          ...(() => {
            const lf = __m.loaf.filter((x) => x.t >= b.t0 - 50 && x.t <= b.t1 + 50);
            return {
              loaf: lf.length,
              jsMs: Math.round(lf.reduce((a, x) => a + x.js, 0)),
              estiloMs: Math.round(lf.reduce((a, x) => a + x.lay, 0)),
              rafMs: Math.round(lf.reduce((a, x) => a + x.ren, 0)),
            };
          })(),
        };
      }));
    })()`),
  );

  const culpables = await c.evaluate(`(() => {
    const m = new Map();
    for (const f of __m.loaf) for (const [k, d, fl] of f.sc) { const o = m.get(k) || [0, 0]; o[0] += d; o[1] += fl; m.set(k, o); }
    return JSON.stringify([...m].sort((a, b) => b[1][0] - a[1][0]).slice(0, 12).map(([k, [d, fl]]) => [k.slice(0, 100), Math.round(d), "forzado " + Math.round(fl)]));
  })()`);

  // Tocar: las tarjetas de «¿Cuál te suena?» y el botón de idioma
  await c.evaluate(`document.getElementById("servicios")?.scrollIntoView({ block: "start" })`);
  await sleep(1200);
  const toques = [];
  for (let i = 0; i < 3; i++) {
    const p = await c.evaluate(`(() => {
      const b = document.querySelectorAll("#servicios button[aria-pressed]")[${i}];
      if (!b) return null;
      b.scrollIntoView({ block: "center" });
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 24) };
    })()`);
    if (!p) break;
    await sleep(600);
    const q = await c.evaluate(`(() => {
      const b = document.querySelectorAll("#servicios button[aria-pressed]")[${i}];
      const r = b.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 24) };
    })()`);
    if (tel) {
      await c.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: q.x, y: q.y }] });
      await c.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } else {
      await c.send("Input.dispatchMouseEvent", { type: "mousePressed", x: q.x, y: q.y, button: "left", clickCount: 1 });
      await c.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: q.x, y: q.y, button: "left", clickCount: 1 });
    }
    await sleep(900);
    toques.push(await c.evaluate(`document.querySelectorAll("#servicios button[aria-pressed=true]").length`));
  }
  await sleep(1000);
  const eventos = await c.evaluate(`JSON.stringify(__m.ev.filter((e) => ["pointerup", "click", "pointerdown", "touchend", "keydown"].includes(e[0])))`);

  console.log(`\n== ${modo} · ${url}`);
  console.log(`GPU: ${gpu}`);
  console.log(`carga ${carga} ms · al abrir ${inicio}`);
  console.table(porSeccion);
  console.log(`scripts que más pesan en fotogramas largos [quién, ms]: ${culpables}`);
  console.log(`tarjetas encendidas tras cada toque: ${toques.join(", ")}`);
  console.log(`eventos de más de 16 ms [nombre, total, proceso, objetivo]: ${eventos}`);
  console.log(`errores: ${errores.length} ${errores.slice(0, 2).join(" | ")}`);
} finally {
  c.close();
}
