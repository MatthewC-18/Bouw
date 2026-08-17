"use client";

import { useEffect, useRef, useState } from "react";
import { FIGURES, sceneStage } from "@/lib/sceneStage";
import { useLang } from "@/lib/i18n";

/**
 * Lectura de la escena.
 *
 * Nombra la figura que las piezas están formando en este momento. Sirve para
 * que el 3D no se lea como adorno de fondo: hay un sistema detrás, con figuras
 * con nombre, y se nota. Se actualiza contra `sceneStage`, no por estado de
 * React, para no re-renderizar en cada píxel de scroll.
 */
export default function SceneHud() {
  const { t } = useLang();
  const [figure, setFigure] = useState(0);
  const [morphing, setMorphing] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    let lastFigure = -1;
    let lastMorph: boolean | null = null;

    const tick = () => {
      raf = window.requestAnimationFrame(tick);

      const stage = sceneStage.current;
      const nearest = Math.round(stage);
      const drift = Math.abs(stage - nearest);

      if (nearest !== lastFigure) {
        lastFigure = nearest;
        setFigure(nearest);
      }

      const isMorphing = drift > 0.06;
      if (isMorphing !== lastMorph) {
        lastMorph = isMorphing;
        setMorphing(isMorphing);
      }

      if (barRef.current) {
        const p = stage / (FIGURES.length - 1);
        barRef.current.style.transform = `scaleX(${p.toFixed(4)})`;
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const name = FIGURES[Math.min(figure, FIGURES.length - 1)];

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed bottom-6 left-6 z-40 hidden select-none md:block xl:left-20"
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
            morphing ? "bg-orange-brand" : "bg-cyan-light"
          }`}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink-dim">
          {String(figure + 1).padStart(2, "0")}/
          {String(FIGURES.length).padStart(2, "0")}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-ink">
          {t(name)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-orange-light/80">
          {morphing ? (t({ es: "montando", en: "assembling" }) as string) : ""}
        </span>
      </div>

      <span className="mt-2 block h-px w-44 overflow-hidden bg-white/10">
        <span
          ref={barRef}
          className="block h-px w-full origin-left scale-x-0 bg-gradient-to-r from-cyan-brand to-orange-brand"
        />
      </span>
    </div>
  );
}
