"use client";

/**
 * Un solo latido de scroll para toda la página.
 *
 * Había cinco: el hero, el nav, los rieles, el proceso, cada banda y la
 * escena 3D, cada uno con su `addEventListener` y su propio
 * `requestAnimationFrame`. El navegador no los agrupa: son cinco callbacks
 * compitiendo con el hilo que dibuja el dragón, y varios de ellos midiendo
 * el DOM en el mismo fotograma.
 *
 * Aquí se suscriben todos al mismo pase. Se ejecutan en orden de
 * suscripción, una vez por fotograma, y solo si hubo scroll.
 */

type Cb = () => void;

const scrollCbs = new Set<Cb>();
const layoutCbs = new Set<Cb>();

let raf = 0;
let bound = false;
let observer: ResizeObserver | null = null;
let lastHeight = 0;

function flush() {
  raf = 0;
  for (const cb of scrollCbs) cb();
}

/*
 * Sin hover mientras se baja.
 *
 * Con la rueda, el ratón se queda quieto y es la página la que pasa por
 * debajo: cada ficha de proyecto que cruzaba el puntero arrancaba su hover
 * —la imagen escalando, el resplandor, las esquinas animando `left`, `top`,
 * `width` y `height`— y se lo quitaba medio segundo después. Medido sin la
 * escena 3D, eso solo tiraba la sección de Proyectos de 80 a 15 fps.
 *
 * Mientras dura el gesto, `<html data-scrolling>` y el CSS deja el cuerpo sin
 * eventos de puntero: no hay hover que arrancar. Son dos escrituras por gesto
 * —al empezar y al parar—, no una por fotograma.
 */
let scrollIdle = 0;
function markScrolling() {
  const root = document.documentElement;
  if (!root.hasAttribute("data-scrolling")) root.setAttribute("data-scrolling", "");
  window.clearTimeout(scrollIdle);
  scrollIdle = window.setTimeout(() => root.removeAttribute("data-scrolling"), 160);
}

function onScroll() {
  markScrolling();
  request();
}

function request() {
  if (!raf) raf = window.requestAnimationFrame(flush);
}

function relayout() {
  for (const cb of layoutCbs) cb();
  request();
}

/**
 * El observador del cuerpo se dispara con cada bloque que se revela, y casi
 * ninguno de esos avisos mueve nada: la anchura no cambió y las anclas siguen
 * donde estaban. Solo interesa cuando cambia el alto del documento — fuentes
 * que cargan, imágenes de los proyectos, un acordeón que se abre.
 */
function onBodyResize() {
  const h = document.documentElement.scrollHeight;
  if (h === lastHeight) return;
  lastHeight = h;
  relayout();
}

function bind() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  lastHeight = document.documentElement.scrollHeight;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", relayout, { passive: true });
  observer = new ResizeObserver(onBodyResize);
  observer.observe(document.body);
}

function unbind() {
  if (!bound || scrollCbs.size || layoutCbs.size) return;
  bound = false;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", relayout);
  observer?.disconnect();
  observer = null;
  if (raf) {
    window.cancelAnimationFrame(raf);
    raf = 0;
  }
}

/** Se llama una vez por fotograma mientras haya scroll. */
export function onScrollFrame(cb: Cb) {
  bind();
  scrollCbs.add(cb);
  return () => {
    scrollCbs.delete(cb);
    unbind();
  };
}

/** Se llama cuando cambia el tamaño de ventana o el alto del documento. */
export function onLayoutChange(cb: Cb) {
  bind();
  layoutCbs.add(cb);
  return () => {
    layoutCbs.delete(cb);
    unbind();
  };
}

/** Fuerza un pase — para el primer cálculo, justo tras suscribirse. */
export function tickNow() {
  if (typeof window !== "undefined") request();
}
