"use client";

import { COMPANY } from "@/lib/content";
import { useLang } from "@/lib/i18n";

/**
 * El eslogan, con su propia letra.
 *
 * Iba en Archivo, la de los titulares, y se perdía entre ellos: «cambia la
 * letra para que se vea mejor y no tan sobrio» (Matthew, 19 oct 2026). Ahora
 * va en Instrument Serif cursiva, la única serif del sitio, así que se
 * reconoce como la firma de la empresa y no como un titular más. La segunda
 * mitad, la promesa («se automatiza»), lleva el degradado de la marca, del
 * cián al naranja del fuego del dragón.
 */
export default function Slogan({ className = "" }: { className?: string }) {
  const { t } = useLang();
  const text = t(COMPANY.slogan);
  // Se parte en la coma: «Si se repite,» y «se automatiza.»
  const cut = text.indexOf(", ");
  const head = cut > 0 ? text.slice(0, cut + 1) : "";
  const tail = cut > 0 ? text.slice(cut + 2) : text;
  return (
    <p className={`font-serif italic leading-[1.02] tracking-[-0.01em] ${className}`}>
      {head && <span className="text-ink">{head} </span>}
      <span className="slogan-glow">{tail}</span>
    </p>
  );
}
