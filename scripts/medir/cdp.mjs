// Cliente mínimo del protocolo de Chrome (CDP), sin instalar nada.
//
// Abre el Chrome del sistema con un perfil temporal y habla con la pestaña por
// el WebSocket de Node. Sustituye al puppeteer que se perdía con cada limpieza
// de la carpeta temporal.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch({ port = 9300 + Math.floor(Math.random() * 500), headless = true } = {}) {
  const dir = mkdtempSync(join(tmpdir(), "bouw-cdp-"));
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    // La GPU de verdad: sin esto Chrome sin ventana pinta con SwiftShader y
    // las cifras de fotogramas no dicen nada.
    "--use-angle=d3d11",
    "--enable-gpu-rasterization",
    "--ignore-gpu-blocklist",
    "--window-size=1536,900",
    "about:blank",
  ];
  if (headless) args.unshift("--headless=new");
  const proc = spawn(CHROME, args, { stdio: "ignore" });

  let ws;
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((t) => t.type === "page");
      if (page) {
        ws = new WebSocket(page.webSocketDebuggerUrl);
        break;
      }
    } catch {}
    await sleep(250);
  }
  if (!ws) throw new Error("Chrome no respondió");
  await new Promise((r, j) => {
    ws.onopen = r;
    ws.onerror = j;
  });

  let id = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) {
      const { res, rej } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result);
    } else for (const l of listeners) l(m);
  };

  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const n = ++id;
      pending.set(n, { res, rej });
      ws.send(JSON.stringify({ id: n, method, params }));
    });

  const evaluate = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };

  await send("Page.enable");
  await send("Runtime.enable");

  return {
    send,
    evaluate,
    on: (fn) => listeners.add(fn),
    close: () => {
      try {
        ws.close();
      } catch {}
      proc.kill();
      setTimeout(() => {
        try {
          rmSync(dir, { recursive: true, force: true });
        } catch {}
      }, 1500);
    },
  };
}

export async function viewport(c, width, height, mobile = false) {
  await c.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: mobile ? 3 : 1,
    mobile,
  });
  if (mobile) await c.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
}

export async function goto(c, url) {
  let done;
  const loaded = new Promise((r) => (done = r));
  const off = (m) => m.method === "Page.loadEventFired" && done();
  c.on(off);
  await c.send("Page.navigate", { url });
  await Promise.race([loaded, sleep(30000)]);
}
