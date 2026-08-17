"use client";

import { useLang } from "@/lib/i18n";

/**
 * Troquel.
 *
 * Una ventana recortada en el dossier impreso: entre los dos pliegos claros
 * el papel se abre y se ve la escena 3D pasando por detrás. Es el argumento
 * de la empresa dicho en materiales — lo digital atravesando lo impreso — y
 * de paso evita que dos bloques claros seguidos apaguen el 3D.
 */
export default function PaperWindow() {
  const { t } = useLang();

  return (
    <div className="relative">
      {/* Los dos bordes de papel que enmarcan el recorte */}
      <div className="sheet h-10 w-full" />

      <div className="relative flex min-h-[46svh] items-center justify-center overflow-hidden">
        {/* Filos del troquel */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#0d2947]/30"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#0d2947]/30"
        />

        {/* Sombra interior del papel sobre el hueco */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[rgba(226,229,231,0.6)] to-transparent"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[rgba(226,229,231,0.6)] to-transparent"
        />

        <p className="pointer-events-none select-none font-mono text-[10px] uppercase tracking-[0.34em] text-ink-dim">
          {t({ es: "Troquel · escena viva", en: "Die-cut · live scene" })}
        </p>
      </div>

      <div className="sheet h-10 w-full" />
    </div>
  );
}
