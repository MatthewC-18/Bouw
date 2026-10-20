"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import LoopVideo from "./LoopVideo";

/**
 * Los proyectos de pantalla, dentro de un aparato.
 *
 * Matthew, 18 oct 2026, sobre Programa contable: «está bien el video, pero
 * con el fondo verde el contraste está feo; no tanto por el color, busca
 * algo mejor», e «igual Charms». La ventana oscura flotando sobre el
 * escenario de color quedaba como un recuadro pegado. Dentro de un portátil
 * (y, en Charms, también de un teléfono) se lee como lo que es: el sistema
 * funcionando en el aparato de quien lo usa, como en una foto de producto.
 *
 * Todo es CSS: ni imágenes de marcos ni sombras pintadas. El escenario es un
 * contenedor de tamaño (`.p-area`) y el aparato mide en `cqw`/`cqh` para
 * caber entero sin recortar la pantalla.
 */

/** Imágenes que se pasan solas, en bucle, mientras se ven. */
export function Slides({
  slides,
  every = 3.6,
  sizes,
  fit = "cover",
  dots = true,
}: {
  slides: { src: string; alt: string; label?: string }[];
  every?: number;
  sizes: string;
  fit?: "cover" | "top";
  /** Los puntitos de cuál va: en el teléfono no, que tapan la pantalla. */
  dots?: boolean;
}) {
  const [on, setOn] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRun(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!run || slides.length < 2) return;
    const id = window.setTimeout(() => setOn((i) => (i + 1) % slides.length), every * 1000);
    return () => window.clearTimeout(id);
  }, [run, on, every, slides.length]);

  const label = slides[on]?.label;

  return (
    <div ref={root} className="absolute inset-0">
      {slides.map((s, i) => (
        <Image
          key={s.src}
          src={s.src}
          alt={s.alt}
          fill
          sizes={sizes}
          // Solo la primera se pide de entrada; las demás, cuando ya se ve
          loading={i === 0 ? undefined : "lazy"}
          className={`${fit === "top" ? "object-cover object-top" : "object-cover"} transition-opacity duration-700 ${
            i === on ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
      {label && (
        <span
          key={on}
          className="pain-in absolute bottom-[4%] left-[3%] inline-flex items-center gap-1.5 rounded-full bg-[rgba(7,17,31,0.84)] px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-[#eef3f9] @lg:text-[9.5px]"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#4fd6e8]" aria-hidden />
          {label}
        </span>
      )}
      {dots && slides.length > 1 && (
        <span className="absolute bottom-[4%] right-[3%] flex gap-1" aria-hidden>
          {slides.map((s, i) => (
            <span
              key={s.src}
              className={`h-1 rounded-full transition-all duration-500 ${i === on ? "w-4 bg-[#eef3f9]" : "w-1 bg-[#eef3f9]/45"}`}
            />
          ))}
        </span>
      )}
    </div>
  );
}

/** Un video de pantalla con su rótulo de paso, que cambia con el tiempo del video. */
export function CuedVideo({
  src,
  poster,
  label,
  cues,
}: {
  src: string;
  poster: string;
  label: string;
  /** Segundo en que entra cada paso, su nombre corto y la frase. */
  cues: { at: number; step: string; text: string }[];
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [cue, setCue] = useState(0);

  useEffect(() => {
    const video = wrap.current?.querySelector("video");
    if (!video) return;
    const onTime = () => {
      let k = 0;
      cues.forEach((c, i) => {
        if (video.currentTime >= c.at) k = i;
      });
      setCue((prev) => (prev === k ? prev : k));
    };
    video.addEventListener("timeupdate", onTime);
    return () => video.removeEventListener("timeupdate", onTime);
  }, [src, cues]);

  const c = cues[cue];
  return (
    <div ref={wrap} className="absolute inset-0">
      <LoopVideo src={src} poster={poster} label={label} className="absolute inset-0 h-full w-full object-cover" />
      {c && (
        <div
          key={cue}
          className="pain-in absolute bottom-[4%] left-[3%] flex max-w-[64%] items-baseline gap-2 rounded-md bg-[rgba(7,17,31,0.86)] px-2 py-1 text-[#eef3f9] shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)] @lg:px-2.5 @lg:py-1.5"
        >
          <span className="shrink-0 font-display text-[12px] font-bold leading-none text-[#4fd6e8] tabular-nums @lg:text-[14px]">
            {String(cue).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-[#4fd6e8] @lg:text-[8.5px]">{c.step}</span>
            {/* En pantallas chicas solo el paso: la frase taparía la hoja */}
            <span className="mt-0.5 hidden line-clamp-2 text-[9px] leading-snug @md:block @lg:text-[10.5px]">{c.text}</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Un portátil: pantalla con su bisel y la base. Mide lo que quepa en el
 * escenario (`fit`, en % del contenedor) sin deformar la pantalla (`ratio`).
 */
export function Laptop({
  ratio,
  fit = 90,
  className = "",
  style,
  children,
}: {
  /** Proporción de la pantalla, como número (ancho / alto). */
  ratio: number;
  /** Cuánto del escenario puede ocupar, en %. */
  fit?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`device-laptop ${className}`}
      style={{ "--ratio": ratio, "--fit": fit, ...style } as CSSProperties}
    >
      <div className="device-lid">
        <span className="device-cam" aria-hidden />
        <div className="device-screen" style={{ aspectRatio: String(ratio) }}>
          {children}
        </div>
      </div>
      <div className="device-base" aria-hidden />
    </div>
  );
}

/** Un teléfono, de alto `h` (en % del alto del escenario). */
export function Phone({ className = "", style, children }: { className?: string; style?: CSSProperties; children: ReactNode }) {
  return (
    // Posicionado siempre: la pantalla va con `inset` dentro de él
    <div className={`device-phone ${/(^|\s)absolute(\s|$)/.test(className) ? "" : "relative"} ${className}`} style={style}>
      <span className="device-island" aria-hidden />
      <div className="device-phone-screen">{children}</div>
    </div>
  );
}
