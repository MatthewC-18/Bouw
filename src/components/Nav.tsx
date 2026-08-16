"use client";

import { useEffect, useState } from "react";
import LogoMark from "./LogoMark";
import { COMPANY, NAV } from "@/lib/content";
import { useLang } from "@/lib/i18n";

export default function Nav() {
  const { lang, toggle, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
          {NAV.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              data-cursor="link"
              className={`relative rounded-full px-4 py-2 text-sm transition-colors ${
                active === item.id
                  ? "text-ink"
                  : "text-ink-dim hover:text-ink"
              }`}
            >
              {t(item.label)}
              <span
                className={`absolute inset-x-4 -bottom-px h-px origin-left bg-gradient-to-r from-cyan-brand to-orange-brand transition-transform duration-500 ${
                  active === item.id ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </a>
          ))}

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
            className="ml-3 rounded-full bg-gradient-to-r from-cyan-brand to-cyan-light px-5 py-2 text-sm font-semibold text-navy-950 transition-transform duration-300 hover:scale-[1.04]"
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
