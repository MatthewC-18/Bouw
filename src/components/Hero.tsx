"use client";

import { useEffect, useRef } from "react";
import { COMPANY, HERO } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { onLayoutChange, onScrollFrame, tickNow } from "@/lib/scrollTicker";
import OfficeStatus from "./OfficeStatus";
import PlanSplit from "./PlanSplit";

export default function Hero() {
  const { t } = useLang();
  const hintRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  /*
   * El indicador se apaga escribiendo su opacidad a mano, no por estado.
   *
   * Iba con `useState` en el bucle de scroll: un render de React por
   * fotograma para mover un solo número de un solo estilo. Con la escena 3D
   * en el mismo hilo eso se nota. Un `ref` y una escritura directa hacen lo
   * mismo sin pasar por el reconciliador.
   */
  useEffect(() => {
    const off = onScrollFrame(() => {
      const el = hintRef.current;
      if (!el) return;
      const h = window.innerHeight || 1;
      const fade = Math.min(Math.max(window.scrollY / h, 0), 1);
      el.style.opacity = String(Math.max(1 - fade * 2, 0));
    });
    tickNow();
    return off;
  }, []);

  /*
   * Dónde empieza el titular, para que el corte del divisor caiga en el mismo
   * sitio sobre las letras que sobre el dragón.
   *
   * `PlanSplit` publica el corte en píxeles de ventana porque el shader lo
   * quiere así, pero el recorte del titular se mide contra la caja del h1. La
   * resta necesita el borde izquierdo del h1, y eso es un `getBoundingClientRect`
   * — que fuerza layout, así que se hace cuando cambia el layout y no por
   * fotograma.
   */
  useEffect(() => {
    const measure = () => {
      const el = titleRef.current;
      if (!el) return;
      el.style.setProperty(
        "--split-origin",
        `${el.getBoundingClientRect().left.toFixed(1)}px`,
      );
    };
    measure();
    const off = onLayoutChange(measure);
    tickNow();
    return off;
  }, []);

  return (
    <section
      id="top"
      className="hero-veil relative flex min-h-[100svh] items-center overflow-hidden"
    >
      {/* El titular dice "Del diseño a la realidad". Esto lo deja tocarlo. */}
      <PlanSplit />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-32 pb-24 lg:px-10">
        <div className="max-w-3xl">
          <div className="mb-8 flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-light">
              {t(HERO.eyebrow)}
            </span>
            <span className="h-px w-16 bg-gradient-to-r from-cyan-brand to-transparent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ink-dim">
              EST. {COMPANY.yearsExperience}+
            </span>
          </div>

          {/*
            El titular, dos veces.

            Debajo, terminado. Encima, la misma frase dibujada a línea y
            recortada a la izquierda del divisor plano / realidad. Arrastrar
            el corte por encima de las letras convierte "Del diseño a la
            realidad" en literalmente eso: diseño de un lado, realidad del
            otro. Ver `.split-title` en `globals.css` y el comentario de
            cabecera de `PlanSplit`.

            La copia de arriba va oculta a los lectores de pantalla: es el
            mismo texto y anunciado dos veces sería un titular tartamudo.
          */}
          <h1
            ref={titleRef}
            className="split-title font-display text-[clamp(2.75rem,8vw,6.5rem)] font-bold leading-[0.94] tracking-tight"
          >
            <span className="block text-ink">{t(HERO.titleTop)}</span>
            <span className="block text-accent">
              {t(HERO.titleAccent)}
            </span>

            <span aria-hidden className="split-title-plan">
              <span className="block">{t(HERO.titleTop)}</span>
              <span className="block">{t(HERO.titleAccent)}</span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-xl leading-relaxed text-ink-soft">
            {t(HERO.subtitle)}
          </p>

          {/*
            Una acción, no dos.

            Eran dos píldoras del mismo tamaño, la primera con degradado cián
            y un barrido naranja al pasar el ratón. El degradado ya se había
            quitado del titular y de la barra por ser lo que más delata una
            plantilla, y aquí seguía intacto en el elemento más visible de la
            página. Ahora es tinta plana, y lo segundo es un enlace de texto
            que lleva a la calculadora — no compite, ofrece otra cosa.
          */}
          <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4">
            <a
              href="#proyectos"
              data-cursor="link"
              className="bg-cyan-brand px-8 py-4 text-sm font-semibold text-navy-950 transition-colors duration-300 hover:bg-cyan-light"
            >
              {t(HERO.ctaPrimary)}
            </a>

            <a
              href="#proceso"
              data-cursor="link"
              className="border-b border-white/25 pb-0.5 text-sm text-ink-soft transition-colors duration-300 hover:border-cyan-light hover:text-cyan-light"
            >
              {t(HERO.ctaSecondary)}
            </a>
          </div>

          {/* Estado de las dos sedes, en lugar de la fila de cifras */}
          <OfficeStatus />
        </div>
      </div>

      {/* Coordenadas de las sedes: detalle de plano, no adorno */}
      <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-6 xl:flex">
        {[
          { city: "QUITO", coords: "0.1807° S · 78.4678° W" },
          { city: "MONTERREY", coords: "25.6866° N · 100.3161° W" },
        ].map((o) => (
          <div key={o.city} className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-ink-dim">
              {o.city}
            </p>
            <p className="mt-1 font-mono text-[10px] tracking-[0.12em] text-cyan-light/60">
              {o.coords}
            </p>
          </div>
        ))}
        <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-ink-dim/60">
          {COMPANY.yearsExperience}+ {"//"} EST.
        </p>
      </div>

      {/* Indicador de scroll */}
      <div
        ref={hintRef}
        className="pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
          {t(HERO.scrollHint)}
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-white/15">
          <span className="absolute inset-x-0 top-0 h-4 animate-scroll-dot bg-cyan-light" />
        </span>
      </div>
    </section>
  );
}
