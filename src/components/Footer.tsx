"use client";

import { COMPANY, FOOTER, NAV } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";

export default function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-navy-950">
      {/* Marquesina con el nombre */}
      <div className="relative flex overflow-hidden border-b border-white/[0.06] py-8">
        <div className="flex shrink-0 animate-marquee whitespace-nowrap">
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={i}
              className="mx-8 font-display text-5xl font-bold tracking-[0.2em] text-white/[0.06] sm:text-7xl"
            >
              BOUW
            </span>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <span
              key={`b-${i}`}
              className="mx-8 font-display text-5xl font-bold tracking-[0.2em] text-white/[0.06] sm:text-7xl"
            >
              BOUW
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <LogoMark className="h-10 w-auto" />
              <span className="font-display text-xl font-bold tracking-[0.14em] text-ink">
                BOUW
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-dim">
              {t(COMPANY.tagline)} — {t(FOOTER.builtWith)}
            </p>
          </div>

          <nav className="flex flex-col gap-3">
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

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-xs text-ink-dim sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {COMPANY.name}. {t(FOOTER.rights)}
          </p>
          <a
            href="#top"
            data-cursor="link"
            className="font-mono uppercase tracking-[0.2em] transition-colors hover:text-cyan-light"
          >
            ↑ Top
          </a>
        </div>
      </div>
    </footer>
  );
}
