"use client";

import { setTheme, useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";

/**
 * Cambio de modo, en la barra: un sol en oscuro (lleva al claro) y una luna
 * en claro (lleva al oscuro). Mismo chasis que el botón de idioma de al lado.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useTheme();
  const { lang } = useLang();
  const dark = theme === "dark";
  const label = dark
    ? lang === "es"
      ? "Cambiar a modo claro"
      : "Switch to light mode"
    : lang === "es"
      ? "Cambiar a modo oscuro"
      : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={label}
      title={label}
      className={`flex h-[30px] w-[30px] items-center justify-center rounded-full border border-white/15 text-ink-dim transition-colors hover:border-cyan-brand hover:text-cyan-light ${className}`}
    >
      {dark ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
          <path d="M20.2 14.6A8.4 8.4 0 0 1 9.4 3.8a8.4 8.4 0 1 0 10.8 10.8z" />
        </svg>
      )}
    </button>
  );
}
