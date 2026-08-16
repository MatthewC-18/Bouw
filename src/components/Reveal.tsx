"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Tag = "div" | "section" | "article" | "header" | "li" | "p";

type Props = {
  children: ReactNode;
  /** Retardo en ms para escalonar elementos de una misma fila */
  delay?: number;
  className?: string;
  as?: Tag;
};

/**
 * Envuelve contenido y lo revela cuando entra en pantalla.
 * Usa IntersectionObserver: nada de librerías de animación ni de scroll.
 */
export default function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sin IntersectionObserver mostramos el contenido de una: nunca dejamos
    // una sección en opacidad 0 por una API que falte.
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // El union de etiquetas confunde a TS al inferir props; fijamos una y basta.
  const Element = as as "div";

  return (
    <Element
      ref={ref}
      className={`reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Element>
  );
}
