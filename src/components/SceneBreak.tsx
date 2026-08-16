"use client";

import { useEffect, useRef, useState } from "react";
import type { Localized } from "@/lib/content";
import { useLang } from "@/lib/i18n";

type Props = {
  /** Índice técnico que aparece junto a la frase */
  mark: string;
  quote: Localized;
  /** A qué lado se ancla el texto; el otro lado queda libre para la escena */
  align?: "left" | "right";
};

/**
 * Banda sin contenido opaco entre secciones.
 *
 * Aquí es donde el ensamblaje de la marca ocurre a la vista: nada la tapa.
 * El texto es corto y se pega a un costado para no competir con la escena.
 */
export default function SceneBreak({ mark, quote, align = "left" }: Props) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const compute = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 0 al entrar por abajo, 1 al salir por arriba
      const p = 1 - (r.top + r.height / 2) / vh;
      setProgress(Math.min(Math.max(p, 0), 1));
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // Se revela cerca del centro de la pantalla y se retira al salir
  const near = Math.sin(Math.min(Math.max(progress, 0), 1) * Math.PI);

  return (
    <div
      ref={ref}
      aria-hidden={false}
      className="relative flex min-h-[85svh] items-center overflow-hidden"
    >
      <div className="mx-auto flex w-full max-w-6xl px-6 lg:px-10">
        <figure
          className={`max-w-sm ${align === "right" ? "ml-auto text-right" : ""}`}
          style={{
            opacity: 0.25 + near * 0.75,
            transform: `translateY(${(1 - near) * 20}px)`,
            transition: "opacity 120ms linear",
          }}
        >
          <div
            className={`flex items-center gap-3 ${align === "right" ? "justify-end" : ""}`}
          >
            <span className="font-mono text-[11px] tracking-[0.3em] text-ink-dim">
              {mark}
            </span>
            <span
              className="h-px bg-gradient-to-r from-cyan-brand to-transparent transition-[width] duration-500"
              style={{ width: `${24 + near * 56}px` }}
            />
          </div>

          <blockquote className="mt-6 font-display text-[clamp(1.5rem,3.2vw,2.5rem)] font-bold leading-[1.12] text-ink">
            {t(quote)}
          </blockquote>
        </figure>
      </div>
    </div>
  );
}
