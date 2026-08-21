"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import LogoMark from "./LogoMark";
import { getBrief, getBriefServer, subscribeBrief } from "@/lib/brief";
import { COMPANY, NAV } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import { onScrollFrame, tickNow } from "@/lib/scrollTicker";

/**
 * Lo que el visitante lleva encima, dicho en la barra.
 *
 * Las dos herramientas de la página producen un dato suyo: cuántas frases se
 * ha reconocido y cuántas horas al año le cuesta lo que hace a mano. Una barra
 * de navegación normal enseña cinco enlaces iguales, los mismos para todo el
 * mundo y los mismos toda la visita.
 *
 * Esta enseña sus dos números. Marca cuatro síntomas y "Diagnóstico" pasa a
 * llevar un 4; haz la cuenta y "La cuenta" pasa a decir 48 h. No es un
 * indicador de progreso ni una insignia: es su respuesta, que ahora le sigue
 * por la página y le espera en el formulario ya escrita.
 *
 * Aparece solo cuando hay algo que enseñar. Un contador a cero es ruido.
 */
function useBrief() {
  return useSyncExternalStore(subscribeBrief, getBrief, getBriefServer);
}

/** Redondeo corto para la barra: 48 h, 1.2 k h. Nunca más de cinco caracteres. */
function shortHours(hours: number) {
  if (hours >= 1000) return `${(hours / 1000).toFixed(1)}k h`;
  return `${Math.round(hours)} h`;
}

export default function Nav() {
  const { lang, toggle, t } = useLang();
  const brief = useBrief();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    // `setScrolled` con el mismo booleano no re-renderiza, así que basta con
    // colgarse del latido común
    const off = onScrollFrame(() => setScrolled(window.scrollY > 24));
    tickNow();
    return off;
  }, []);

  // Resalta la sección visible
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (!sections.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { threshold: [0.25, 0.5], rootMargin: "-20% 0px -50% 0px" },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-white/[0.07] bg-navy-950/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-10">
        <a
          href="#top"
          data-cursor="link"
          className="flex items-center gap-3 outline-none"
          aria-label={COMPANY.name}
        >
          <LogoMark className="h-9 w-auto shrink-0" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold tracking-[0.14em] text-ink">
              BOUW
            </span>
            <span className="mt-1 text-[9px] uppercase tracking-[0.24em] text-ink-dim">
              Automation &amp; Digital
            </span>
          </span>
        </a>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            /*
              El dato del visitante, si lo hay. Va pegado al enlace de la
              herramienta que lo produjo, no en un sitio aparte: lo que dice es
              "esto que marcaste sigue aquí", y para eso tiene que estar donde
              lo marcó.
            */
            const mark =
              item.id === "servicios" && brief.symptoms.length > 0
                ? String(brief.symptoms.length)
                : item.id === "proceso" && brief.count
                  ? shortHours(brief.count.hours)
                  : null;

            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-cursor="link"
                className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition-colors ${
                  active === item.id ? "text-ink" : "text-ink-dim hover:text-ink"
                }`}
              >
                {t(item.label)}
                {mark && (
                  <span className="whitespace-nowrap rounded-full border border-cyan-brand/45 bg-cyan-brand/10 px-1.5 py-0.5 font-mono text-[10px] leading-none tracking-wider text-cyan-light">
                    {mark}
                  </span>
                )}
                <span
                  className={`absolute inset-x-3.5 -bottom-px h-px origin-left bg-cyan-brand transition-transform duration-500 ${
                    active === item.id ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </a>
            );
          })}

          <button
            type="button"
            onClick={toggle}
            data-cursor="link"
            aria-label={lang === "es" ? "Switch to English" : "Cambiar a español"}
            className="ml-2 rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-dim transition-colors hover:border-cyan-brand hover:text-cyan-light"
          >
            {lang === "es" ? "EN" : "ES"}
          </button>

          <a
            href="#contacto"
            data-cursor="link"
            className="ml-3 bg-cyan-brand px-5 py-2 text-sm font-semibold text-navy-950 transition-colors duration-300 hover:bg-cyan-light"
          >
            {lang === "es" ? "Hablemos" : "Let's talk"}
          </a>
        </div>

        {/* Mobile */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            type="button"
            onClick={toggle}
            className="rounded-full border border-white/15 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink-dim"
          >
            {lang === "es" ? "EN" : "ES"}
          </button>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Menú"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5"
          >
            <span
              className={`h-px w-6 bg-ink transition-transform duration-300 ${
                open ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-6 bg-ink transition-transform duration-300 ${
                open ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Panel móvil */}
      <div
        className={`overflow-hidden border-t border-white/[0.07] bg-navy-950/95 backdrop-blur-xl transition-[max-height] duration-500 md:hidden ${
          open ? "max-h-96" : "max-h-0 border-transparent"
        }`}
      >
        <div className="flex flex-col px-6 py-4">
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              className="border-b border-white/5 py-4 font-display text-lg text-ink last:border-0"
            >
              {t(item.label)}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
