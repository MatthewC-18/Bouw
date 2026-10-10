"use client";

import { useEffect, useRef } from "react";
import type { Localized } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { onLayoutChange, onScrollFrame, tickNow } from "@/lib/scrollTicker";

type Props = {
  mark: string;
  title: Localized;
  body: Localized;
  align?: "left" | "right";
};

/**
 * Capítulo entre dos secciones.
 *
 * La frase va a toda la anchura y el dragón se posa encima de su primera
 * línea, como en el logo se posa sobre la W (`data-perch`, ver `Dragon.tsx`).
 *
 * La frase entra con el scroll: sube y se ilumina al acercarse al centro, y se
 * apaga al irse. Todo por `transform` y `opacity` en capas propias; nada de
 * geometría por fotograma.
 */
export default function SceneBreak({ mark, title, body, align = "left" }: Props) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  const ruleRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let top = 0;
    let height = 0;

    const measure = () => {
      const r = el.getBoundingClientRect();
      top = r.top + window.scrollY;
      height = r.height;
    };

    const compute = () => {
      const vh = window.innerHeight || 1;
      // 0 cuando la banda entra por abajo, 1 cuando sale por arriba
      const p = Math.min(
        Math.max((window.scrollY + vh - top) / (height + vh), 0),
        1,
      );
      const near = Math.sin(p * Math.PI);

      // La frase no se desplaza: el dragón se posa en ella, y su percha se
      // mide en el layout. Solo se enciende y se apaga
      const title = titleRef.current;
      if (title) title.style.opacity = String(0.12 + near * 0.88);
      const body = bodyRef.current;
      if (body) {
        body.style.opacity = String(Math.max(near * 1.4 - 0.4, 0));
        body.style.transform = `translate3d(0, ${((0.5 - p) * 9).toFixed(2)}vh, 0)`;
      }
      const rule = ruleRef.current;
      if (rule) rule.style.transform = `scaleX(${(0.3 + near * 0.7).toFixed(3)})`;
    };

    const remeasure = () => {
      measure();
      compute();
    };

    remeasure();
    const offScroll = onScrollFrame(compute);
    const offLayout = onLayoutChange(remeasure);
    tickNow();
    return () => {
      offScroll();
      offLayout();
    };
  }, []);

  const right = align === "right";

  return (
    <div
      ref={ref}
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      <div
        className={`mx-auto w-full max-w-[1560px] px-6 lg:px-16 ${right ? "text-right" : ""}`}
      >
        <div className={`flex items-center gap-3 ${right ? "justify-end" : ""}`}>
          <span className="font-mono text-[11px] tracking-[0.3em] text-ink-dim">
            {mark}
          </span>
          <span
            ref={ruleRef}
            className="h-px w-20 origin-left bg-gradient-to-r from-cyan-brand to-transparent"
            style={{ transform: "scaleX(0.3)" }}
          />
        </div>

        {/*
          La frase a toda la anchura. Va en capa propia porque el scroll la
          mueve en cada fotograma; sin capa, cada escritura repintaba un
          bloque de texto del tamaño de la pantalla.
        */}
        <p
          ref={titleRef}
          className="mt-8 font-display text-[clamp(3.25rem,9.5vw,10rem)] leading-[0.9] text-ink will-change-[opacity]"
          style={{ opacity: 0.12 }}
        >
          {/*
            Percha: el borde de arriba de la frase, cerca de su arranque. Va en
            un `span` y no en el párrafo para medir la tinta y no la caja.
          */}
          <span
            data-perch={`capitulo-${mark}`}
            data-perch-corner={right ? "right" : "left"}
          >
            {t(title)}
          </span>
        </p>

        <p
          ref={bodyRef}
          className={`mt-10 max-w-xl text-xl leading-relaxed text-ink-soft will-change-[transform,opacity] ${right ? "ml-auto" : ""}`}
          style={{ opacity: 0 }}
        >
          {t(body)}
        </p>
      </div>
    </div>
  );
}
