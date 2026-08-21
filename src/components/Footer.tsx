"use client";

import { COMPANY, FOOTER, NAV } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";

export default function Footer() {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] bg-navy-950/95">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <LogoMark className="h-11 w-auto" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-2xl font-bold tracking-[0.14em] text-ink">
                  BOUW
                </span>
                <span className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.24em] text-ink-dim">
                  {t(COMPANY.tagline)}
                </span>
              </span>
            </div>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-soft">
              {t({
                es: "Consultoría de procesos, calidad y automatización para equipos que fabrican cosas reales.",
                en: "Process, quality and automation consulting for teams that build real things.",
              })}
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim/60">
              {lang === "es" ? "Secciones" : "Sections"}
            </p>
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                data-cursor="link"
                className="text-sm text-ink-dim transition-colors hover:text-cyan-light"
              >
                {t(n.label)}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-3 text-sm">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-ink-dim/60">
              {lang === "es" ? "Contacto" : "Contact"}
            </p>
            <a
              href={`mailto:${COMPANY.email}`}
              data-cursor="link"
              className="text-ink-dim transition-colors hover:text-cyan-light"
            >
              {COMPANY.email}
            </a>
            <a
              href={COMPANY.whatsapp}
              target="_blank"
              rel="noreferrer noopener"
              data-cursor="link"
              className="text-ink-dim transition-colors hover:text-cyan-light"
            >
              {COMPANY.phoneDisplay}
            </a>
            {COMPANY.locations.map((l) => (
              <span key={l} className="text-ink-dim">
                {l}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/[0.06] pt-6 font-mono text-[11px] text-ink-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY.name} · {t(FOOTER.rights)}
          </p>
          <p className="text-ink-dim/60">{t(FOOTER.builtWith)}</p>
          <a
            href="#top"
            data-cursor="link"
            className="uppercase tracking-[0.2em] transition-colors hover:text-cyan-light"
          >
            ↑ {lang === "es" ? "Arriba" : "Top"}
          </a>
        </div>
      </div>
    </footer>
  );
}
