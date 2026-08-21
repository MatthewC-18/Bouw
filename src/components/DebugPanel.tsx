"use client";

import { useEffect, useRef, useState } from "react";
import { debug } from "@/lib/debug";
import { LAST_STAGE } from "@/components/three/layouts";
import { tickNow } from "@/lib/scrollTicker";

/**
 * Panel de depuración.
 *
 * Lo que hace útil una captura de pantalla no es la imagen: son los números
 * que había detrás cuando se tomó. Este panel los pone encima, así que una
 * sola imagen dice a qué tamaño real se ve el bicho, cuánto corre, cuánto
 * arrastra la cola y en qué punto exacto del recorrido está.
 *
 * Los tres controles de abajo son los que hacen falta para pedir un momento
 * concreto: congelar la etapa, ralentizar el tiempo y parar el fotograma.
 *
 * No entra en producción — `page.tsx` lo monta solo en desarrollo — y ni
 * siquiera en desarrollo aparece sin `?debug` en la URL.
 */

const SECTIONS = [
  "Portada",
  "Proyecto 1",
  "Proyecto 2",
  "Proyecto 3",
  "Proyecto 4",
  "Servicios",
  "Proceso",
  "Nosotros",
  "Contacto",
];

/** Cuántas veces por segundo se refrescan los números. */
const REFRESH = 10;

/**
 * Una fila.
 *
 * `k` es la clave que busca el bucle para escribir el valor: el texto lo pone
 * el `requestAnimationFrame` directamente sobre este nodo, no React.
 */
function Row({ k, label, warn }: { k: string; label: string; warn?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-white/40">{label}</span>
      <span
        data-k={k}
        className={warn ? "text-orange-300" : "text-cyan-200"}
      >
        —
      </span>
    </div>
  );
}

export default function DebugPanel() {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [locked, setLocked] = useState(debug.stageLock);
  const [scale, setScale] = useState(debug.timeScale);
  const [ready, setReady] = useState(false);
  /*
   * Plegado.
   *
   * El panel vive en una esquina y el dragón pasa por las dos: medido, en la
   * portada cae al 72-78 % del ancho y en Contacto al 24-33 %. O sea que el
   * propio instrumento tapa justo lo que se está midiendo. Plegado deja una
   * pastilla con los fotogramas y nada más.
   */
  const [open, setOpen] = useState(true);

  useEffect(() => setReady(debug.on), []);

  /*
   * Los números se escriben en el DOM a mano y a diez por segundo. Por estado
   * de React serían sesenta renders por segundo compitiendo con la escena, y
   * el panel acabaría midiendo su propio coste.
   */
  useEffect(() => {
    if (!ready || !open) return;

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let frames = 0;
    let fps = 0;
    let fpsAcc = 0;

    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      const dt = (now - last) / 1000;
      last = now;

      frames++;
      fpsAcc += dt;
      if (fpsAcc >= 0.5) {
        fps = frames / fpsAcc;
        frames = 0;
        fpsAcc = 0;
      }

      acc += dt;
      if (acc < 1 / REFRESH) return;
      acc = 0;

      const el = bodyRef.current;
      if (!el) return;
      const s = debug.stats;
      const i = Math.round(s.stage);
      const set = (key: string, text: string) => {
        // El contador de fotogramas vive en la cabecera, fuera del cuerpo
        const scope = key === "fps" ? el.ownerDocument : el;
        const node = scope.querySelector<HTMLElement>(
          `[data-k="${key}"]`,
        );
        if (node) node.textContent = text;
      };

      set("fps", `${fps.toFixed(0)} fps`);
      set("seccion", `${SECTIONS[i] ?? "?"} (${s.stage.toFixed(2)})`);
      set("suave", s.eased.toFixed(2));
      set("travel", s.travel.toFixed(2));
      set("tam", `${s.sizePct.toFixed(1)} %`);
      const fuera = s.screenX < 4 || s.screenX > 96;
      set("pos", `${s.screenX.toFixed(0)} , ${s.screenY.toFixed(0)}${fuera ? "  FUERA" : ""}`);
      set("aspecto", s.aspect.toFixed(2));
      set("prof", `${s.depth.toFixed(1)} u`);
      set("vel", `${s.speed.toFixed(2)} u/s`);
      set("subida", `${s.climb.toFixed(2)} u/s`);
      set("planeo", s.settle.toFixed(2));
      set("aleteo", `${s.beat.toFixed(2)} Hz · ${s.amp.toFixed(0)}°`);
      set("cola", `${s.whip.toFixed(1)}°`);
      set("cabeza", `${s.look.toFixed(1)}°`);
      set("mirada", `${(s.gaze * 100).toFixed(0)} %`);
      set("alabeo", `${s.bank.toFixed(1)}°`);
      set("mat", `${(s.build * 100).toFixed(0)} %`);
      set("respuesta", s.handoff.toFixed(2));
      set("barrido", s.scan.toFixed(2));
      set("divisor", s.split.toFixed(2));
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [ready, open]);

  if (!ready) return null;

  const lock = (value: number | null) => {
    debug.stageLock = value;
    setLocked(value);
    // La etapa se recalcula en el pase de scroll, y mover este control no es
    // hacer scroll: sin empujar un pase, arrastrar el deslizador no movería
    // nada hasta que el visitante tocase la rueda
    tickNow();
  };

  const speed = (value: number) => {
    debug.timeScale = value;
    setScale(value);
  };

  return (
    <div
      className="pointer-events-auto fixed bottom-4 right-4 z-[100] rounded-lg border border-cyan-brand/30 bg-[#04101f]/95 p-3 font-mono text-[11px] leading-[1.7] text-white/70 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-sm"
      style={{ width: open ? 268 : 148 }}
    >
      <div
        className={`flex items-center justify-between ${
          open ? "mb-2 border-b border-white/10 pb-2" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="tracking-[0.2em] text-cyan-300 transition-colors hover:text-cyan-100"
          title="Plegar / desplegar"
        >
          {open ? "BOUW · DEBUG" : "BOUW ▸"}
        </button>
        <span data-k="fps" className="text-white/50">
          —
        </span>
      </div>

      {open && (
      <>

      <div ref={bodyRef} className="space-y-0.5">
        <Row k="seccion" label="sección" />
        <Row k="suave" label="suavizada" />
        <Row k="travel" label="travel" />
        <div className="my-1.5 h-px bg-white/10" />
        <Row k="tam" label="tamaño" warn />
        <Row k="pos" label="posición x,y" warn />
        <Row k="aspecto" label="aspecto" />
        <Row k="prof" label="profundidad" />
        <div className="my-1.5 h-px bg-white/10" />
        <Row k="vel" label="velocidad" />
        <Row k="subida" label="subida" />
        <Row k="planeo" label="planeo" />
        <Row k="aleteo" label="aleteo" />
        <div className="my-1.5 h-px bg-white/10" />
        <Row k="cola" label="cola" />
        <Row k="cabeza" label="cabeza" />
        <Row k="mirada" label="mirada" />
        <Row k="alabeo" label="alabeo" />
        <div className="my-1.5 h-px bg-white/10" />
        <Row k="mat" label="materia" />
        <Row k="respuesta" label="respuesta" />
        <Row k="barrido" label="barrido" />
        <Row k="divisor" label="divisor" />
      </div>

      <div className="mt-3 border-t border-white/10 pt-2.5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-white/40">etapa</span>
          <button
            type="button"
            onClick={() => lock(locked === null ? 0 : null)}
            className={`rounded border px-1.5 py-0.5 text-[10px] transition-colors ${
              locked === null
                ? "border-white/15 text-white/45 hover:border-white/35"
                : "border-orange-400/60 text-orange-300"
            }`}
          >
            {locked === null ? "seguir scroll" : `fija ${locked.toFixed(1)}`}
          </button>
        </div>
        <input
          type="range"
          min={0}
          max={LAST_STAGE}
          step={0.1}
          value={locked ?? 0}
          disabled={locked === null}
          onChange={(e) => lock(Number(e.target.value))}
          className="w-full accent-cyan-400 disabled:opacity-30"
        />

        <div className="mt-2.5 flex items-center gap-1.5">
          <span className="mr-auto text-white/40">tiempo</span>
          {[0, 0.25, 0.5, 1].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => speed(v)}
              className={`rounded border px-1.5 py-0.5 text-[10px] transition-colors ${
                scale === v
                  ? "border-cyan-400 text-cyan-300"
                  : "border-white/15 text-white/45 hover:border-white/35"
              }`}
            >
              {v === 0 ? "pausa" : `${v}×`}
            </button>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}
