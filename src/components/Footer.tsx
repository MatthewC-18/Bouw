"use client";

import { COMPANY, FOOTER, NAV } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";

/** `home`: prefijo de los anclas, igual que en `Nav`. */
export default function Footer({ home = "" }: { home?: string }) {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-white/[0.06] bg-navy-950/95">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-10">
        {/* El eslogan cierra la página, en grande: es lo último que se lee */}
        <p className="mb-14 border-b border-white/[0.06] pb-12 font-display text-[clamp(2.25rem,6vw,4.75rem)] font-bold leading-[0.95] tracking-tight text-ink">
          <span className="mr-4 align-middle text-[0.6em] text-cyan-light" aria-hidden>
            ↻
          </span>
          {t(COMPANY.slogan)}
        </p>
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <LogoMark className="h-14 w-auto" />
              <span className="border-l border-white/10 pl-3 font-mono text-[9px] uppercase leading-[1.6] tracking-[0.24em] text-ink-dim">
                {t(COMPANY.tagline)}
              </span>
            </div>
            <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-ink-soft">
              {t({
                es: "Ingeniería de procesos, calidad y automatización para empresas que fabrican.",
                en: "Process, quality and automation engineering for companies that make things.",
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
                href={`${home}#${n.id}`}
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
            © {year} {COMPANY.legalName || COMPANY.name}
            {COMPANY.ruc ? ` · RUC ${COMPANY.ruc}` : ""} · {t(FOOTER.rights)}
          </p>
          <a
            href="/privacidad"
            data-cursor="link"
            className="transition-colors hover:text-cyan-light"
          >
            {lang === "es" ? "Aviso de privacidad" : "Privacy notice"}
          </a>
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
