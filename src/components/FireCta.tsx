"use client";

import { useEffect, useRef, useState } from "react";
import { COMPANY } from "@/lib/content";
import { useLang } from "@/lib/i18n";

/**
 * Llamada a la acción que prende con el dragón.
 *
 * La escena 3D avisa por `bouw:fire` cuando la criatura empieza a escupir al
 * llegar a contacto, y este bloque se enciende con ella. Como el fuego no
 * existe si el visitante pidió menos movimiento, hay una segunda vía: en
 * cuanto la sección entra en pantalla se enciende igual. El texto nunca
 * depende del canvas para poder leerse.
 */
export default function FireCta() {
  const { t, lang } = useLang();
  const [lit, setLit] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onFire = (e: Event) => {
      const detail = (e as CustomEvent<{ on: boolean }>).detail;
      if (detail?.on) setLit(true);
    };
    window.addEventListener("bouw:fire", onFire);

    // Respaldo: si no hay canvas, o el fuego está apagado, basta con llegar
    const el = root.current;
    let observer: IntersectionObserver | undefined;
    if (el) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) setLit(true);
        },
        { threshold: 0.4 },
      );
      observer.observe(el);
    }

    return () => {
      window.removeEventListener("bouw:fire", onFire);
      observer?.disconnect();
    };
  }, []);

  const heading = lang === "es" ? "Contáctanos" : "Get in touch";

  return (
    <div ref={root} className="relative mb-16 lg:mb-24">
      {/* Brasa detrás del titular: crece cuando prende */}
      <div
        aria-hidden
        className={`pointer-events-none absolute -inset-x-10 -top-16 h-56 blur-[90px] transition-all duration-[1400ms] ease-out ${
          lit ? "opacity-100" : "scale-y-50 opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(50% 60% at 30% 60%, rgba(232,119,34,0.5), transparent 70%)",
        }}
      />

      <div className="relative">
        <span
          className={`font-mono text-[11px] uppercase tracking-[0.3em] transition-colors duration-700 ${
            lit ? "text-orange-light" : "text-ink-dim"
          }`}
        >
          {lang === "es" ? "Último paso" : "Last step"}
        </span>

        <h2 className="mt-5 font-display text-[clamp(2.8rem,9vw,7rem)] font-bold leading-[0.9]">
          <span
            className={`bg-clip-text transition-all duration-1000 ease-out ${
              lit ? "text-transparent" : "text-ink"
            }`}
            style={
              lit
                ? {
                    backgroundImage:
                      "linear-gradient(100deg, #ffd9a8 0%, #f79b4a 32%, #e87722 62%, #b7702c 100%)",
                    filter: "drop-shadow(0 0 26px rgba(232,119,34,0.35))",
                  }
                : undefined
            }
          >
            {heading}
          </span>
        </h2>

        {/* Reguero de brasa: se propaga de izquierda a derecha al prender */}
        <div className="mt-6 h-px w-full max-w-2xl overflow-hidden bg-white/10">
          <div
            className={`h-px origin-left bg-gradient-to-r from-orange-brand via-orange-light to-transparent transition-transform duration-[1600ms] ease-out ${
              lit ? "scale-x-100" : "scale-x-0"
            }`}
          />
        </div>

        <p
          className={`mt-6 max-w-xl text-lg leading-snug transition-opacity duration-1000 ${
            lit ? "opacity-100" : "opacity-60"
          } text-ink`}
        >
          {t({
            es: "Cuéntanos qué proceso te está costando horas. Te respondemos con un plan, no con un catálogo.",
            en: "Tell us which process is costing you hours. You get a plan back, not a catalogue.",
          })}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={COMPANY.whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="link"
            className={`group inline-flex items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-700 ${
              lit
                ? "bg-orange-brand text-navy-950 shadow-[0_0_40px_-8px_rgba(232,119,34,0.8)]"
                : "border border-white/15 text-ink"
            }`}
          >
            {lang === "es" ? "Escríbenos por WhatsApp" : "Message us on WhatsApp"}
            <span
              aria-hidden
              className="transition-transform duration-500 group-hover:translate-x-1"
            >
              →
            </span>
          </a>

          <a
            href={`mailto:${COMPANY.email}`}
            data-cursor="link"
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim transition-colors hover:text-cyan-light"
          >
            {COMPANY.email}
          </a>
        </div>
      </div>
    </div>
  );
}
