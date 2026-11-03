"use client";

import Link from "next/link";
import { COMPANY } from "@/lib/content";
import { useLang } from "@/lib/i18n";
import LogoMark from "./LogoMark";
import Slogan from "./Slogan";

/**
 * La página de «no existe».
 *
 * Era la de Next por defecto: «404 · This page could not be found.», en
 * inglés y sobre negro, sin marca ni salida. Un enlace mal copiado en un
 * anuncio acababa ahí. Ahora dice lo que pasó en el idioma del visitante y
 * le da tres salidas: la portada, los proyectos y escribirnos.
 */
export default function NotFound() {
  const { lang, setLang } = useLang();
  const es = lang === "es";

  return (
    <main className="flex min-h-screen flex-col bg-navy-950 text-ink">
      <header className="border-b border-white/[0.07]">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link href="/" data-cursor="link" aria-label={COMPANY.name}>
            <LogoMark className="h-10 w-auto" preload />
          </Link>
          <button
            type="button"
            onClick={() => setLang(es ? "en" : "es")}
            data-cursor="link"
            className="rounded-full border border-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-dim hover:text-ink"
          >
            {es ? "EN" : "ES"}
          </button>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-orange-light">
          {es ? "Error 404 · página no encontrada" : "Error 404 · page not found"}
        </p>
        <h1 className="mt-5 font-display text-[clamp(2.25rem,6vw,4rem)] font-bold leading-[1.02]">
          {es ? "Esta página no existe." : "This page doesn't exist."}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
          {es
            ? "Puede que el enlace esté mal copiado o que la página se haya movido. Lo que buscabas seguramente está en la portada."
            : "The link may be mistyped or the page may have moved. What you were looking for is most likely on the home page."}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/"
            data-cursor="link"
            className="bg-cyan-brand px-7 py-3.5 text-sm font-semibold text-navy-950 transition-colors hover:bg-cyan-light"
          >
            {es ? "Ir a la portada" : "Go to the home page"}
          </Link>
          <Link
            href="/#proyectos"
            data-cursor="link"
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-ink transition-colors hover:border-cyan-light hover:text-cyan-light"
          >
            {es ? "Ver proyectos" : "See our work"}
          </Link>
          <a
            href={COMPANY.whatsapp}
            target="_blank"
            rel="noreferrer noopener"
            data-cursor="link"
            className="rounded-full border border-white/15 px-5 py-3 text-sm text-ink transition-colors hover:border-cyan-light hover:text-cyan-light"
          >
            {es ? "Escríbenos por WhatsApp" : "Message us on WhatsApp"}
          </a>
        </div>

        <div className="mt-20 border-t border-white/[0.07] pt-10">
          <Slogan className="text-[clamp(1.75rem,4vw,2.5rem)]" />
        </div>
      </section>
    </main>
  );
}
