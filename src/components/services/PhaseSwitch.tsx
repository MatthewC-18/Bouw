"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useLang } from "@/lib/i18n";

/** Segundos en cada estado antes de pasar al otro. */
const DWELL = 5.5;

export type Phase = "hoy" | "bouw";

/**
 * Hoy o con Bouw, para los tableros de los servicios.
 *
 * Mientras el tablero se ve y nadie ha tocado nada, pasa solo de uno a otro;
 * en cuanto alguien elige, se queda en lo elegido. Con menos movimiento
 * pedido no pasa solo: se queda en «Con Bouw», que es lo que se vende.
 */
export function usePhase(root: RefObject<HTMLElement | null>) {
  const [phase, setPhase] = useState<Phase>("hoy");
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const still = useRef(false);

  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still.current) {
      setPhase("bouw");
      setAuto(false);
    }
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [root]);

  useEffect(() => {
    if (!auto || !visible) return;
    const id = window.setTimeout(() => setPhase((p) => (p === "hoy" ? "bouw" : "hoy")), DWELL * 1000);
    return () => window.clearTimeout(id);
  }, [auto, visible, phase]);

  const pick = (p: Phase) => {
    setAuto(false);
    setPhase(p);
  };

  return { phase, pick, running: auto && visible };
}

/** El selector: dos botones en una pastilla, con la raya de lo que falta. */
export default function PhaseSwitch({
  phase,
  pick,
  running,
}: {
  phase: Phase;
  pick: (p: Phase) => void;
  running: boolean;
}) {
  const { lang } = useLang();
  const opts: { id: Phase; label: string; dot: string }[] = [
    { id: "hoy", label: lang === "es" ? "Hoy" : "Today", dot: "bg-orange-brand" },
    { id: "bouw", label: lang === "es" ? "Con Bouw" : "With Bouw", dot: "bg-(--p-good)" },
  ];
  return (
    <div role="group" className="inline-flex shrink-0 rounded-full p-0.5 ring-1 ring-(--p-line)">
      {opts.map((o) => {
        const on = phase === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => pick(o.id)}
            className={`relative inline-flex items-center gap-1.5 overflow-hidden rounded-full px-2.5 py-1 text-[10.5px] font-semibold transition-colors duration-300 @md:px-3 @md:text-[11px] ${
              on ? "bg-(--p-accent-soft) text-ink ring-1 ring-(--p-line)" : "text-ink-dim hover:text-ink"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${o.dot}`} aria-hidden />
            {o.label}
            {on && running && (
              <span
                key={phase}
                aria-hidden
                className="pain-progress absolute inset-x-2.5 bottom-0 h-[1.5px] bg-(--p-accent)"
                style={{ animationDuration: `${DWELL}s` }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
