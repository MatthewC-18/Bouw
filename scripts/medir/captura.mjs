// Captura de la portada y de un punto de la página, en frío.
//
//   node scripts/medir/captura.mjs URL salida-prefijo [segundos] [ancho alto]
import { writeFileSync } from "node:fs";
import { goto, launch, sleep, viewport } from "./cdp.mjs";

const [url, out = "captura", secs = "12", w = "1536", h = "864"] = process.argv.slice(2);
const c = await launch();
try {
  const W = Number(w);
  await viewport(c, W, Number(h), W < 768);
  await goto(c, url);
  await sleep(Number(secs) * 1000);
  const shot = async (name) => {
    const { data } = await c.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${out}-${name}.png`, Buffer.from(data, "base64"));
  };
  await shot("portada");
  // Bajar con la rueda hasta Proyectos y parar: el dragón debe posarse
  for (let i = 0; i < 4; i++) {
    await c.send("Input.synthesizeScrollGesture", { x: W / 2, y: 500, yDistance: -500, speed: 1500, gestureSourceType: "mouse" });
    await sleep(300);
  }
  await sleep(4000);
  await shot("bajando");
  // Al parar, la capa que tapa el puntero tiene que haberse quitado
  const capa = await c.evaluate(`(() => { const s = document.querySelector("[data-scroll-shield]"); return s ? getComputedStyle(s).pointerEvents : "sin capa"; })()`);
  console.log("capa al parar:", capa);
} finally {
  c.close();
}
