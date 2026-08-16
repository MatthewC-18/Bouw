"use client";

import { useEffect, useRef } from "react";

/**
 * Cursor personalizado de BOUW.
 *
 * - Punto sólido que sigue al mouse al instante.
 * - Anillo que persigue con inercia (lerp) y se deforma con la velocidad.
 * - Los elementos con `data-cursor="link" | "view" | "text"` cambian el estado,
 *   y `data-cursor-label` imprime texto dentro del anillo.
 *
 * Se desactiva por completo en pantallas táctiles y con `prefers-reduced-motion`.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!finePointer.matches) return;

    const root = document.documentElement;
    root.classList.add("bouw-cursor");

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return;

    // Posiciones: target = mouse real, current = anillo con inercia.
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let scale = 1;
    let targetScale = 1;
    let visible = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) {
        visible = true;
        ringX = targetX;
        ringY = targetY;
        dot.style.opacity = "1";
        ring.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = "0";
      ring.style.opacity = "0";
    };

    const onDown = () => {
      ring.dataset.pressed = "true";
    };
    const onUp = () => {
      delete ring.dataset.pressed;
    };

    // Detecta el elemento bajo el cursor y ajusta el estado del anillo.
    const onOver = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.(
        "[data-cursor], a, button, input, textarea, select",
      ) as HTMLElement | null;

      if (!el) {
        ring.dataset.state = "default";
        label.textContent = "";
        targetScale = 1;
        return;
      }

      const explicit = el.dataset.cursor;
      const state =
        explicit ??
        (el.matches("input, textarea, select") ? "text" : "link");

      ring.dataset.state = state;
      label.textContent = el.dataset.cursorLabel ?? "";
      targetScale = state === "view" ? 2.6 : state === "text" ? 0.55 : 1.75;
    };

    // Cuando nada se mueve no tocamos el DOM: el rAF se queda en vacio.
    let lastX = NaN;
    let lastY = NaN;

    const tick = () => {
      raf = window.requestAnimationFrame(tick);

      const dx = targetX - ringX;
      const dy = targetY - ringY;
      const ds = targetScale - scale;
      const still =
        Math.abs(dx) < 0.05 &&
        Math.abs(dy) < 0.05 &&
        Math.abs(ds) < 0.002 &&
        targetX === lastX &&
        targetY === lastY;

      if (still) return;

      lastX = targetX;
      lastY = targetY;

      // Inercia del anillo
      ringX += dx * 0.16;
      ringY += dy * 0.16;
      scale += ds * 0.16;

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    };

    raf = window.requestAnimationFrame(tick);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
      root.classList.remove("bouw-cursor");
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999]">
      <div
        ref={dotRef}
        className="fixed left-0 top-0 h-[7px] w-[7px] rounded-full bg-cyan-light opacity-0 transition-opacity duration-300 will-change-transform"
      />
      <div
        ref={ringRef}
        data-state="default"
        className="
          group fixed left-0 top-0 flex h-9 w-9 items-center justify-center
          rounded-full border opacity-0 will-change-transform
          border-cyan-brand/70 bg-cyan-brand/[0.06]
          transition-[background-color,border-color,box-shadow] duration-300
          data-[state=link]:border-cyan-light data-[state=link]:bg-cyan-light/10
          data-[state=view]:border-orange-brand data-[state=view]:bg-orange-brand/15
          data-[state=text]:border-ink data-[state=text]:bg-ink/20
          data-[pressed=true]:bg-orange-brand/30
        "
        style={{ boxShadow: "0 0 24px -6px rgba(34,181,207,0.6)" }}
      >
        <span
          ref={labelRef}
          className="select-none text-[4.5px] font-semibold uppercase tracking-[0.14em] text-ink"
        />
      </div>
    </div>
  );
}
